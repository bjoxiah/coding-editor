import { AgentEvent } from "@/models";
import { useAppStore } from "@/store";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface ScaffoldAgentParams {
  projectPath: string;
  prompt:      string;
  appName:     string;
  brandColor:  string;
  imageUrls:   string[];
}

export interface EditorAgentParams {
  projectPath:  string;
  prompt:       string;
  relativePath: string;
  content:      string;
}

const runAgentOperation = async (
  action:     'scaffold' | 'edit',
  command:    string,
  params:     Record<string, unknown>,
): Promise<void> => {
  const runId = crypto.randomUUID();
  const { setAgentRunning, onAgentFileWrite, loadFileTree, addProjectLog } =
    useAppStore.getState();

  setAgentRunning(true);
  addProjectLog({ runId, action, type: "status", message: "Agent started..." });

  let unlistenFn: UnlistenFn | null = null;

  const cleanup = () => {
    unlistenFn?.();
    setAgentRunning(false);
  };

  unlistenFn = await listen<AgentEvent>("agent_event", ({ payload }) => {
    switch (payload.type) {
      case "file_write":
        addProjectLog({ runId, action, type: "file_write", message: `Wrote ${payload.path}` });
        onAgentFileWrite(payload.path, payload.content);
        break;

      case "status":
        addProjectLog({ runId, action, type: "status", message: payload.message });
        break;

      case "done":
        addProjectLog({ runId, action, type: "done", message: payload.summary });
        loadFileTree();
        cleanup();
        break;

      case "error":
        addProjectLog({ runId, action, type: "error", message: payload.message });
        cleanup();
        break;
    }
  });

  await invoke(command, params).catch((e) => {
    addProjectLog({ runId, action, type: "error", message: `Failed to start agent: ${e}` });
    cleanup();
  });
};

export const scaffoldAgentOperation = (params: ScaffoldAgentParams) =>
  runAgentOperation("scaffold", "scaffold_project", { ...params });

export const editorAgentOperation = (params: EditorAgentParams) =>
  runAgentOperation("edit", "edit_project_file", { ...params });