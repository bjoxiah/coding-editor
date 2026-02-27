import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
  FolderOpen, Loader2, ArrowLeft, CheckCircle2,
  Copy, Search, Sparkles, ImageOff, Settings,
} from "lucide-react";
import { useAppStore } from "../../store";
import { FileNode } from "../../models";
import { scaffoldAgentOperation } from "../../service";
import { ColorPicker } from "./color-picker";
import { ImageUploadZone } from "./image-upload";
import { useSettings } from "@/store/settings";
import { SettingsModal } from "../settings";

interface Step {
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export interface UploadedImage {
  name: string;
  previewUrl: string;
  s3Key: string;
  uploading: boolean;
  error?: string;
}

export const PromptComponent = () => {
  const { settings } = useSettings();
  const [projectName, setProjectName] = useState("");
  const [workingDir, setWorkingDir]   = useState("");
  const [prompt, setPrompt]           = useState("");
  const [brandColor, setBrandColor]   = useState("#F59E0B");
  const [images, setImages]           = useState<UploadedImage[]>([]);
  const [loading, setLoading]         = useState(false);
  const [imageLoading, setImageLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [steps, setSteps]             = useState<Step[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navigate = useNavigate();
  const { setCurrentProject, addProject } = useAppStore();

  const awsConfigured = !!(
    settings?.aws_bucket &&
    settings?.aws_region && 
    settings?.aws_access_key_id && 
    settings?.aws_secret_access_key
  );

  const handlePickDirectory = async () => {
    const selected = await open({ directory: true, title: "Choose Working Directory" });
    if (selected) setWorkingDir(selected as string);
  };

  const isValid = projectName.trim() && workingDir && prompt.trim();

  const updateStep = (index: number, status: Step["status"]) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)));

  const handleAddImages = useCallback(async (files: File[]) => {
    try {
      setImageLoading(true);
      const newImages: UploadedImage[] = files.map((f) => ({
      name: f.name,
      previewUrl: URL.createObjectURL(f),
      s3Key: "",
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newImages]);

    await Promise.all(
      files.map(async (file, idx) => {
        const tempName = newImages[idx].name;
        try {
          const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
          const s3Key = await invoke<string>("upload_to_s3", {
            fileName: file.name,
            contentType: file.type,
            bytes,
          });
          setImages((prev) =>
            prev.map((img) => img.name === tempName && img.uploading
              ? { ...img, s3Key, uploading: false } : img)
          );
        } catch {
          setImages((prev) =>
            prev.map((img) => img.name === tempName && img.uploading
              ? { ...img, uploading: false, error: "Upload failed" } : img)
          );
        }
      })
    );
    } catch (error) {
      // error
    } finally {
      setImageLoading(false);
    }
    
  }, []);

  const handleRemoveImage = useCallback(async (keyOrName: string) => {
    try {
      setImageLoading(true);
      const img = images.find((i) => i.s3Key === keyOrName || i.name === keyOrName);
      if (img?.s3Key) {
        await invoke("delete_from_s3", { url: img.s3Key }).catch(console.error);
      }
      setImages((prev) =>
        prev.filter((img) => img.s3Key !== keyOrName && img.name !== keyOrName)
      );
    } catch(err: any) {
      // error
    } finally {
      setImageLoading(false);
    }
  }, [images]);

  const handleCreateProject = async () => {
    if (!isValid || loading || imageLoading) return;
    setLoading(true);
    setError("");
    const name = projectName.trim();

    setSteps([
      { label: "Creating project from template", status: "active" },
      { label: "Loading file structure",          status: "pending" },
      { label: "Starting AI agent",               status: "pending" },
    ]);

    try {
      const projectPath = await invoke<string>("create_project", { name, workingDir });
      updateStep(0, "done");
      updateStep(1, "active");

      const tree = await invoke<FileNode[]>("get_file_tree", { projectPath });
      updateStep(1, "done");
      updateStep(2, "active");

      const s3ImageKeys = images.filter((i) => i.s3Key).map((i) => i.s3Key);
      const proj = {
        id: crypto.randomUUID(),
        name,
        path: projectPath,
        prompt,
        brand_color: brandColor,
        inspiration_images: s3ImageKeys,
        created_at: Date.now(),
        files: [],
        tree,
        logs: [],
        expoUrl: ""
      };

      addProject(proj);
      setCurrentProject(proj);
      // refactored name
      scaffoldAgentOperation({
        projectPath,
        prompt,
        appName: name,
        brandColor: brandColor,
        imageUrls: s3ImageKeys,
      });

      await new Promise((res) => setTimeout(res, 10000)); // a little delay
      navigate("/editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSteps((prev) =>
        prev.map((s) => s.status === "active" ? { ...s, status: "error" } : s)
      );
      setLoading(false);
    }
  };

  const stepIcons = [Copy, Search, Sparkles];

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#111113] overflow-hidden">

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="w-full max-w-xl px-6 space-y-5">

        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft size={12} />
            Back to projects
          </button>
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">
            New Project
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Describe your React Native app and the agent will scaffold it.
          </p>
        </div>

        {/* Progress Steps */}
        {steps.length > 0 && (
          <div className="bg-white/2 border border-white/6 rounded-xl p-4 space-y-3">
            {steps.map((step, i) => {
              const IconComponent = stepIcons[i];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    step.status === "done"   ? "bg-emerald-400/10" :
                    step.status === "active" ? "bg-amber-400/10"   :
                    step.status === "error"  ? "bg-red-400/10"     : "bg-white/3"
                  }`}>
                    {step.status === "done"   ? <CheckCircle2 size={13} className="text-emerald-400" /> :
                     step.status === "active" ? <Loader2 size={13} className="text-amber-400 animate-spin" /> :
                     step.status === "error"  ? <span className="text-red-400 text-xs">✕</span> :
                     <IconComponent size={12} className="text-neutral-700" />}
                  </div>
                  <span className={`text-[12.5px] transition-colors duration-300 ${
                    step.status === "done"   ? "text-emerald-400/80" :
                    step.status === "active" ? "text-neutral-200"    :
                    step.status === "error"  ? "text-red-400"        : "text-neutral-600"
                  }`}>
                    {step.label}
                    {step.status === "done" && <span className="text-emerald-500 ml-1.5">✓</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Form */}
        {!loading && (
          <>
            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                placeholder="my-fitness-app"
                className="w-full bg-white/4 border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-amber-400/30 transition-colors"
              />
            </div>

            {/* Working Directory */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
                Working Directory
              </label>
              <button
                onClick={handlePickDirectory}
                className="w-full flex items-center gap-3 bg-white/4 border border-white/[0.07] rounded-xl px-4 py-2.5 text-left hover:border-white/12 focus:border-amber-400/30 outline-none transition-colors cursor-pointer"
              >
                <FolderOpen size={16} className="text-amber-400 shrink-0" />
                {workingDir
                  ? <span className="text-sm text-neutral-200 truncate">{workingDir}</span>
                  : <span className="text-sm text-neutral-600">Choose a folder...</span>}
              </button>
              {workingDir && projectName.trim() && (
                <p className="text-[11px] text-neutral-600 px-1">
                  → {workingDir}/{projectName.trim()}
                </p>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
                Describe Your App
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A fitness tracker with a dashboard, workout log, and profile screen..."
                rows={4}
                className="w-full bg-white/4 border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-amber-400/30 resize-none transition-colors"
              />
            </div>

            {/* Brand Color */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
                Brand Color
              </label>
              <div className="bg-white/2 border border-white/7 rounded-xl px-4 py-3">
                <ColorPicker value={brandColor} onChange={setBrandColor} />
              </div>
            </div>

            {/* Design Inspiration — AWS configured */}
            {awsConfigured ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
                  Design Inspiration
                  <span className="ml-2 normal-case tracking-normal font-normal text-neutral-700">optional</span>
                </label>
                <ImageUploadZone onError={setError} images={images} onAdd={handleAddImages} onRemove={handleRemoveImage} />
              </div>
            ) : (
              /* AWS not configured — prompt to set up */
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center cursor-pointer gap-3 px-4 py-3 rounded-xl border border-dashed border-white/8 bg-white/2 hover:border-amber-400/25 hover:bg-amber-400/3 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/4 flex items-center justify-center shrink-0 group-hover:bg-amber-400/10 transition-colors">
                  <ImageOff size={14} className="text-neutral-600 group-hover:text-amber-400/70 transition-colors" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[12px] text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    Design inspiration uploads require AWS S3
                  </p>
                  <p className="text-[10.5px] text-neutral-700 mt-0.5">
                    Click to configure your AWS credentials
                  </p>
                </div>
                <Settings size={13} className="text-neutral-700 group-hover:text-amber-400/60 transition-colors shrink-0" />
              </button>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-400/8 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Submit */}
        {!loading && (
          <button
            onClick={handleCreateProject}
            disabled={!isValid || imageLoading}
            className="w-full flex items-center cursor-pointer justify-center gap-2 px-5 py-2.5 bg-amber-400 text-neutral-900 text-sm font-medium rounded-lg hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Generate Project
          </button>
        )}
      </div>

      {/* Settings modal — opens to AWS tab */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab="aws"
      />
    </div>
  );
};