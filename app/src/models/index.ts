export interface CodeFile {
  path: string;     // relative e.g. "app/(tabs)/index.tsx"
  content: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  lang?: string;
  open?: boolean;
  children?: FileNode[];
}

export interface Project {
  snack_id?: string;
  brand_color: string;
  inspiration_images: string[]; // S3 keys
  id: string;
  name: string;
  path: string;       // absolute path on disk
  prompt: string;
  tree: FileNode[];
  files: CodeFile[];   // files written by agent
  created_at: number;
  logs: ProjectLogs[];
  expoUrl: string;
}

export type ProjectLogs = {
  action: "scaffold" | "edit" | "preview",
  type: "file_write" | "status" | "done" | "error",
  message: string,
  timestamp?: string
}

export interface AgentFileEvent {
  type: "file_write";
  path: string;
  content: string;
}

export interface AgentDoneEvent {
  type: "done";
  summary: string;
  files: string[];    // list of paths written
}

export interface AgentErrorEvent {
  type: "error";
  message: string;
}

export interface AgentStatusEvent {
  type: "status";
  message: string;
}

export type AgentEvent = AgentFileEvent | AgentDoneEvent | AgentStatusEvent | AgentErrorEvent;

export interface IAppState {
  projects: Project[];
  currentProject: Project | null;
  activeFile: CodeFile | null;
  openTabs: string[];
  agentRunning: boolean;
  expoRunning: boolean;
  unsavedPaths: Set<string>;
}