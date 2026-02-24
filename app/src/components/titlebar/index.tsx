import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import { ArrowLeft, Play, Loader2, Save } from "lucide-react";
import { publishToSnack } from "../../service";

export const TitleBar = () => {
  const navigate = useNavigate();
  const {
    currentProject,
    closeProject,
    agentRunning,
    expoRunning,
    unsavedPaths,
    activeFile,
    saveActiveFile,
  } = useAppStore();

  const isFileDirty = !!(activeFile && unsavedPaths.has(activeFile.path));
  const anyDirty    = unsavedPaths.size > 0;

  const handleClose = () => {
    closeProject();
    navigate("/");
  };

  const handleRun = async () => {
    if (agentRunning || expoRunning) return;
    await publishToSnack();
  };

  const handleSave = async () => {
    if (!isFileDirty || agentRunning || expoRunning) return;
    await saveActiveFile();
  };

  // Cmd+S / Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isFileDirty && !agentRunning && !expoRunning) {
          saveActiveFile();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFileDirty, agentRunning, expoRunning, saveActiveFile]);

  return (
    <div
      className="h-10 flex items-center justify-between px-4 bg-[#111113] border-b border-white/6 shrink-0 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {currentProject && (
          <>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-neutral-500">
                {currentProject.name}
              </span>
              {/* Dot indicates any unsaved file across all tabs */}
              {anyDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400/70 shrink-0" />
              )}
            </div>
          </>
        )}
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {currentProject && (
          <>
            {/* Save — active only when current file is dirty */}
            <button
              onClick={handleSave}
              disabled={!isFileDirty || agentRunning || expoRunning}
              title="Save (⌘S)"
              className={`h-7 px-3 text-[11px] font-medium rounded-md transition-all flex items-center gap-1.5 ${
                isFileDirty && !agentRunning && !expoRunning
                  ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 cursor-pointer"
                  : "bg-white/3 text-neutral-700 cursor-not-allowed"
              }`}
            >
              <Save size={11} />
              Save
            </button>

            {/* Run */}
            <button
              onClick={handleRun}
              disabled={agentRunning || expoRunning}
              className={`h-7 px-3 text-[11px] font-medium rounded-md transition-all flex items-center gap-1.5 ${
                agentRunning || expoRunning
                  ? "bg-white/3 text-neutral-700 cursor-not-allowed"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
              }`}
            >
              {agentRunning || expoRunning ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  {agentRunning ? "Generating..." : "Publishing..."}
                </>
              ) : (
                <>
                  <Play size={11} />
                  Run
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};