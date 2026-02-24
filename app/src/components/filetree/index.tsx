import { FileNode } from "@/models";
import { FileTreeItem } from "./file-tree-item";
import { LucideIcon, FileCode2, Hash, FileJson, Gem, FileCog, FileText, FileImage, Braces, GitBranch, Settings, Lock } from "lucide-react";

export type DeleteHandler = (path: string, type: "file" | "folder", name: string) => void;

export interface FileIconConfig {
  icon: LucideIcon;
  color: string;
}

export const fileIconMap: Record<string, FileIconConfig> = {
  tsx: { icon: FileCode2, color: "#3b82f6" },
  jsx: { icon: FileCode2, color: "#3b82f6" },
  ts:  { icon: FileCode2, color: "#2563eb" },
  js:  { icon: FileCode2, color: "#eab308" },
  css: { icon: Hash,      color: "#a855f7" },
  html:{ icon: FileCode2, color: "#ef4444" },
  json:{ icon: FileJson,  color: "#eab308" },
  rs:  { icon: Gem,       color: "#ef4444" },
  toml:{ icon: FileCog,   color: "#f97316" },
  md:  { icon: FileText,  color: "#9ca3af" },
  txt: { icon: FileText,  color: "#9ca3af" },
  svg: { icon: FileImage, color: "#f59e0b" },
  png: { icon: FileImage, color: "#22c55e" },
  jpg: { icon: FileImage, color: "#22c55e" },
  webp:{ icon: FileImage, color: "#22c55e" },
  lock:{ icon: Lock,      color: "#6b7280" },
  yaml:{ icon: Braces,    color: "#f472b6" },
  yml: { icon: Braces,    color: "#f472b6" },
  gitignore: { icon: GitBranch, color: "#6b7280" },
  conf:{ icon: Settings,  color: "#6b7280" },
};

export const getFileIcon = (filename: string, lang?: string): FileIconConfig => {
  const ext = lang || filename.split(".").pop() || "";
  const dotFile = filename.startsWith(".") ? filename.slice(1) : "";
  return fileIconMap[ext] || fileIconMap[dotFile] || { icon: FileText, color: "#6b7280" };
};

export interface FileTreeItemProps {
  item: FileNode;
  depth?: number;
  activeFile: string;
  projectPath: string;
  onSelect: (path: string) => void;
  onDelete?: DeleteHandler;
  onRefresh: () => void;
}

interface FileTreeProps {
  tree: FileNode[];
  activeFile: string;
  projectPath: string;
  onSelect: (path: string) => void;
  onDelete?: DeleteHandler;
  onRefresh: () => void;
}

export const FileTree = (props: FileTreeProps) => (
  <div className="flex-1 overflow-y-auto py-2 px-1.5">
    {props.tree.map((item, i) => (
      <FileTreeItem key={i} item={item} {...props} />
    ))}
  </div>
);