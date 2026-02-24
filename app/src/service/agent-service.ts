import { AgentEvent } from "@/models";
import { useAppStore } from "@/store";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface RunAgentParams {
  project_path: string;
  prompt:        string;
  app_name:      string;
  brand_color:   string;
  image_urls:    string[];
}

export const runAgent = async (params: RunAgentParams): Promise<void> => {
  const {
    setAgentRunning,
    onAgentFileWrite,
    loadFileTree,
    addProjectLog
  } = useAppStore.getState();

  setAgentRunning(true);
  addProjectLog({action: 'scaffold', type: 'status', message: 'Agent started...'});

  let unlistenFn: UnlistenFn | null = null;

  const cleanup = () => {
    if (unlistenFn) unlistenFn();
    setAgentRunning(false);
  };

  // Listen for Tauri events emitted by the Rust SSE consumer
  unlistenFn = await listen<AgentEvent>("agent_event", ({ payload }) => {
    switch (payload.type) {
      case "file_write":
        // Rust already wrote the file — just update the in-memory editor state
        addProjectLog({ action: 'scaffold', type: 'file_write', message: `Wrote ${payload.path}` })
        onAgentFileWrite(payload.path, payload.content);
        break;

      case "status":
        addProjectLog({ action: 'scaffold', type: 'status', message: payload.message })
        break;

      case "done":
        addProjectLog({ action: 'scaffold', type: 'done', message: payload.summary })
        // Reload file tree so explorer shows all new files
        loadFileTree();
        setAgentRunning(false);
        cleanup();
        break;

      case "error":
        addProjectLog({ action: 'scaffold', type: 'error', message: `Error: ${payload.message}` })
        setAgentRunning(false);
        cleanup();
        break;
    }
  });

  // Kick off the Rust agent command operation
  await invoke("run_agent", {
    projectPath: params.project_path,
    prompt:      params.prompt,
    appName:     params.app_name,
    brandColor:  params.brand_color,
    imageUrls:   params.image_urls,
  }).catch((e) => {
    addProjectLog({ action: 'scaffold', type: 'error', message: `Failed to start agent: ${e}` })
    setAgentRunning(false);
    cleanup();
  });
}