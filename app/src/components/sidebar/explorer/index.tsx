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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/store/settings";
import { ConfirmDialog, DialogState } from "./confirm-dialog";
import { InputState, RootInlineInput } from "./inline-input";

export const  Explorer = () => {
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

        <RootInlineInput
          input={input}
          onChange={(v) => setInput((s) => ({ ...s, value: v, error: "" }))}
          onSubmit={handleRootInputSubmit}
          onCancel={() => setInput((s) => ({ ...s, visible: false }))}
        />

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