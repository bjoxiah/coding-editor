import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileTree } from "../../filetree";
import { useAppStore } from "../../../store";
import {
  FilePlus,
  FolderPlusIcon,
  MoreHorizontal,
  Terminal,
  FolderOpen,
  X,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/store/settings";

interface DialogState {
  open: boolean;
  targetPath: string;
  targetName: string;
  targetType: "file" | "folder" | null;
}

/* Root-level inline input only (folder-level inputs live in FileTreeItem) */
interface InputState {
  visible: boolean;
  type: "file" | "folder";
  value: string;
  error: string;
}

const ConfirmDialog = ({
  dialog,
  onConfirm,
  onCancel,
}: {
  dialog: DialogState;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!dialog.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-85 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden">
        <div className="h-0.5 w-full bg-linear-to-r from-red-500/0 via-red-500/80 to-red-500/0" />
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-neutral-100">
                Delete {dialog.targetType === "folder" ? "Folder" : "File"}
              </h3>
              <p className="text-[11.5px] text-neutral-500 mt-0.5 leading-relaxed">
                {dialog.targetType === "folder"
                  ? "This will permanently delete the folder and all its contents."
                  : "This file will be permanently removed from disk."}
              </p>
            </div>
          </div>
          <div className="mb-4 px-3 py-1.5 rounded-md bg-white/4 border border-white/6">
            <span className="text-[11px] font-mono text-neutral-300 break-all">
              {dialog.targetName}
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/6 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RootInlineInput = ({
  input,
  onChange,
  onSubmit,
  onCancel,
}: {
  input: InputState;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) => {
  if (!input.visible) return null;
  return (
    <div className="px-2 pt-1 pb-1.5">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
        input.error ? "border-red-500/40 bg-red-500/5" : "border-sky-500/30 bg-sky-500/5"
      }`}>
        <input
          autoFocus
          value={input.value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={input.type === "file" ? "filename.tsx" : "folder-name"}
          className="flex-1 bg-transparent text-[11.5px] text-neutral-200 placeholder-neutral-600 outline-none min-w-0"
        />
        <button onClick={onSubmit} className="w-4 h-4 rounded flex items-center justify-center text-sky-400 hover:bg-sky-400/15 transition-colors shrink-0">
          <Check size={10} />
        </button>
        <button onClick={onCancel} className="w-4 h-4 rounded flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors shrink-0">
          <X size={10} />
        </button>
      </div>
      {input.error && <p className="text-[10px] text-red-400/80 mt-0.5 px-1">{input.error}</p>}
    </div>
  );
};

export const Explorer = () => {
  const { currentProject, openFile, activeFile, loadFileTree } = useAppStore();
  const {settings} = useSettings();

  const [dialog, setDialog] = useState<DialogState>({
    open: false, targetPath: "", targetName: "", targetType: null,
  });

  const [input, setInput] = useState<InputState>({
    visible: false, type: "file", value: "", error: "",
  });

  const handleOpenInTerminal = async () => {
    if (!currentProject) return;
    try { await invoke("open_in_terminal", { dirPath: currentProject.path }); }
    catch (err) { console.error(err); }
  };

  const handleOpenFolder = async () => {
    if (!currentProject) return;
    try { await invoke("open_in_finder", { path: currentProject.path }); }
    catch (err) { console.error(err); }
  };

  const handleDeleteRequest = useCallback(
    (path: string, type: "file" | "folder", name: string) =>
      setDialog({ open: true, targetPath: path, targetName: name, targetType: type }),
    []
  );

  const handleDeleteConfirm = async () => {
    if (!currentProject) return;
    try {
      await invoke("delete_file", { projectPath: currentProject.path, filePath: dialog.targetPath });
      await loadFileTree();
    } catch (err) { console.error(err); }
    finally { setDialog((d) => ({ ...d, open: false })); }
  };

  const handleRootInputSubmit = async () => {
    if (!currentProject) return;
    const name = input.value.trim();
    if (!name) { setInput((s) => ({ ...s, error: "Name is required" })); return; }
    if (/[\\:*?"<>|]/.test(name)) { setInput((s) => ({ ...s, error: "Invalid characters" })); return; }
    try {
      if (input.type === "file") {
        await invoke("write_file", { projectPath: currentProject.path, filePath: name, content: "" });
      } else {
        await invoke("create_directory", { projectPath: currentProject.path, dirPath: name });
      }
      await loadFileTree();
      setInput({ visible: false, type: "file", value: "", error: "" });
    } catch (err: any) {
      setInput((s) => ({ ...s, error: err?.toString() ?? "Failed" }));
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-[#141416] border-r border-white/6 shrink-0 select-none">

        {/* ── Header ── */}
        <div className="h-9.5 flex items-center justify-between px-3 border-b border-white/4">
          <span className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-neutral-500">
            Explorer
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setInput({ visible: true, type: "folder", value: "", error: "" })}
              title="New Folder at root"
              className="w-5 h-5 cursor-pointer flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/6 transition-colors"
            >
              <FolderPlusIcon size={12} />
            </button>
            <button
              onClick={() => setInput({ visible: true, type: "file", value: "", error: "" })}
              title="New File at root"
              className="w-5 h-5 cursor-pointer flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/6 transition-colors"
            >
              <FilePlus size={12} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="More actions"
                  className="w-5 h-5 cursor-pointer flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/6 transition-colors"
                >
                  <MoreHorizontal size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#1e1e24] border-white/10 text-neutral-300 shadow-xl shadow-black/40">
                <DropdownMenuItem
                  onClick={handleOpenInTerminal}
                  className="text-[11.5px] gap-2.5 cursor-pointer focus:bg-white/6 focus:text-neutral-100"
                >
                  <Terminal size={12} className="text-amber-400" />
                  Open in Terminal
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/6" />
                <DropdownMenuItem
                  onClick={handleOpenFolder}
                  className="text-[11.5px] gap-2.5 cursor-pointer focus:bg-white/6 focus:text-neutral-100"
                >
                  <FolderOpen size={12} className="text-sky-400" />
                  Open Project Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Root inline input (header buttons only) ── */}
        <RootInlineInput
          input={input}
          onChange={(v) => setInput((s) => ({ ...s, value: v, error: "" }))}
          onSubmit={handleRootInputSubmit}
          onCancel={() => setInput((s) => ({ ...s, visible: false }))}
        />

        {/* ── File tree ── */}
        {currentProject && (
          <FileTree
            tree={currentProject.tree}
            activeFile={activeFile?.path || ""}
            projectPath={currentProject.path}
            onSelect={openFile}
            onDelete={handleDeleteRequest}
            onRefresh={loadFileTree}
          />
        )}

        {/* ── Project footer ── */}
        <div className="px-4 py-3 border-t border-white/4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-400/10 flex items-center justify-center">
              <span className="text-amber-400 text-[10px] font-bold uppercase">{settings.username ? settings?.username[0] : 'O'}</span>
            </div>
            <div>
              <p className="text-[11px] text-neutral-300 font-medium">@{settings.username}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        dialog={dialog}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDialog((d) => ({ ...d, open: false }))}
      />
    </>
  );
};