import { ChevronRight, FilePlus, Folder, 
  FolderOpen, FolderPlus, 
  MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { RenameInput } from "../rename-input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InlineInput } from "../inline-input";
import { FileTreeItem } from "../file-tree-item";
import { FileTreeItemProps } from "..";

export const FolderItem = ({
  item,
  depth,
  activeFile,
  projectPath,
  onSelect,
  onDelete,
  onRefresh,
}: FileTreeItemProps & { depth: number }) => {
  const [open, setOpen] = useState(item.open ?? false);
  const [pending, setPending] = useState<"file" | "folder" | null>(null);
  const [renaming, setRenaming] = useState(false);

  const startCreate = (type: "file" | "folder") => {
    setOpen(true);
    setPending(type);
  };

  const handleDone = () => {
    setPending(null);
    onRefresh();
  };

  const handleRenameDone = () => {
    setRenaming(false);
    onRefresh();
  };

  const FolderIcn = open ? FolderOpen : Folder;

  return (
    <div>
      {/* Folder row — or rename input */}
      {renaming ? (
        <div
          className="flex items-center gap-1.5 py-0.75 px-2"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <ChevronRight size={12} className="text-neutral-500 shrink-0 opacity-40" />
          <FolderIcn size={15} className="shrink-0" style={{ color: "#F59E0B" }} />
          <RenameInput
            currentName={item.name}
            projectPath={projectPath}
            oldPath={item.path}
            onDone={handleRenameDone}
          />
        </div>
      ) : (
        <div
          role="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full cursor-pointer flex items-center gap-1.5 py-0.75 px-2 hover:bg-white/4 transition-colors rounded-md group"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-150 text-neutral-500 shrink-0 ${open ? "rotate-90" : ""}`}
          />
          <FolderIcn size={15} className="shrink-0" style={{ color: "#F59E0B" }} />
          <span className="flex-1 text-[12.5px] text-neutral-400 group-hover:text-neutral-300 transition-colors tracking-wide truncate">
            {item.name}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-4 h-4 flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/10 transition-all shrink-0"
              >
                <MoreHorizontal size={11} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-[#1e1e24] border-white/10 text-neutral-300 shadow-xl shadow-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); startCreate("file"); }}
                className="text-[11.5px] gap-2 cursor-pointer focus:bg-white/6 focus:text-neutral-100"
              >
                <FilePlus size={11} className="text-neutral-500" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); startCreate("folder"); }}
                className="text-[11.5px] gap-2 cursor-pointer focus:bg-white/6 focus:text-neutral-100"
              >
                <FolderPlus size={11} className="text-neutral-500" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/6" />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
                className="text-[11.5px] gap-2 cursor-pointer focus:bg-white/6 focus:text-neutral-100"
              >
                <Pencil size={11} className="text-neutral-500" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/6" />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete?.(item.path, "folder", item.name); }}
                className="text-[11.5px] gap-2 cursor-pointer text-red-400/80 focus:bg-red-500/10 focus:text-red-400"
              >
                <Trash2 size={11} className="text-red-500/60" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Children + inline create input */}
      {open && (
        <>
          {pending && (
            <InlineInput
              type={pending}
              depth={depth + 1}
              projectPath={projectPath}
              parentPath={item.path}
              onDone={handleDone}
            />
          )}
          {item.children?.map((child, i) => (
            <FileTreeItem
              key={i}
              item={child}
              depth={depth + 1}
              activeFile={activeFile}
              projectPath={projectPath}
              onSelect={onSelect}
              onDelete={onDelete}
              onRefresh={onRefresh}
            />
          ))}
        </>
      )}
    </div>
  );
};