import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import { CodeFile, FileNode, IAppState, Project, ProjectLogs } from "../models";
import { tauriStorage } from "@/lib/persistence";

// Actions

type AppActions = {
  addProject: (meta: Project) => void;
  removeProject: (path: string, deleteFromDisk?: boolean) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  loadFileTree: () => Promise<void>;
  closeProject: () => void;
  openFile: (path: string) => Promise<void>;
  setActiveFile: (file: CodeFile | null) => void;
  updateFileContent: (path: string, content: string) => void;
  closeTab: (path: string) => void;
  saveActiveFile: () => Promise<void>;
  onAgentFileWrite: (path: string, content: string) => void;
  setAgentRunning: (running: boolean) => void;
  setExpoRunning: (running: boolean) => void;
  addProjectLog: (entry: ProjectLogs) => void;
  addExpoUrl: (url: string) => void;

  reset: () => void;
};

// Initial State

const initialState: IAppState = {
  projects: [],
  currentProject: null,
  activeFile: null,
  openTabs: [],
  agentRunning: false,
  expoRunning: false,
  unsavedPaths: new Set<string>(),
};

// Store

export const useAppStore = create<IAppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addProject: (meta) => {
        const { projects } = get();
        const filtered = projects.filter((p) => p.id !== meta.id);
        set({ projects: [meta, ...filtered] });
      },

      removeProject: async (path, deleteFromDisk = false) => {
        const { projects, currentProject } = get();

        // delete files from disk
        if (deleteFromDisk) {
          try {
            await invoke("delete_project", { projectPath: path });
          } catch (err) {
            console.error("Failed to delete project from disk:", err);
          }
        }

        set({
          projects: projects.filter((p) => p.path !== path),
          ...(currentProject?.path === path
            ? {
                currentProject: null,
                activeFile: null,
                openTabs: [],
                agentRunning: false,
                expoRunning: false,
              }
            : {}),
        });
      },

      setCurrentProject: (project) => {
        const { activeFile, openTabs } = get();
        set({
          currentProject: project,
          activeFile: project == null ? null : activeFile,
          openTabs: project == null ? [] : openTabs,
        })
      },

      loadFileTree: async () => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
          const tree = await invoke<FileNode[]>("get_file_tree", {
            projectPath: currentProject.path,
          });
          set({ currentProject: { ...currentProject, tree } });
        } catch (err) {
          console.error("Failed to load file tree:", err);
        }
      },

      closeProject: () => {
        set({
          currentProject: null,
          activeFile: null,
          openTabs: [],
          agentRunning: false,
          expoRunning: false,
          unsavedPaths: new Set(),
        });
      },

      openFile: async (path: string) => {
        const { currentProject, openTabs } = get();
        if (!currentProject) return;

        const existing = currentProject.files.find((f) => f.path === path);
        if (existing) {
          set({
            activeFile: existing,
            openTabs: openTabs.includes(path)
              ? openTabs
              : [...openTabs, path],
          });
          return;
        }

        try {
          const content = await invoke<string>("read_file", {
            projectPath: currentProject.path,
            filePath: path,
          });

          const file: CodeFile = { path, content };

          set({
            currentProject: {
              ...currentProject,
              files: [...currentProject.files, file],
            },
            activeFile: file,
            openTabs: openTabs.includes(path)
              ? openTabs
              : [...openTabs, path],
          });
        } catch (err) {
          console.error("Failed to open file:", err);
        }
      },

      setActiveFile: (file: CodeFile | null) => set({ activeFile: file }),

      updateFileContent: (path, content) => {
        const { currentProject, activeFile, unsavedPaths } = get();
        if (!currentProject) return;

        const updatedFiles = currentProject.files.map((f) =>
          f.path === path ? { ...f, content } : f
        );

        set({
          unsavedPaths: new Set([...unsavedPaths, path]),
          currentProject: { ...currentProject, files: updatedFiles },
          activeFile:
            activeFile?.path === path
              ? { ...activeFile, content }
              : activeFile,
        });
      },

      closeTab: (path) => {
        const { openTabs, activeFile } = get();
        const next = openTabs.filter((t) => t !== path);
        set({
          openTabs: next,
          activeFile:
            activeFile?.path === path
              ? next.length > 0
                ? { path: next[next.length - 1], content: "" }
                : null
              : activeFile,
        });

        if (activeFile?.path === path && next.length > 0) {
          get().openFile(next[next.length - 1]);
        }
      },

      saveActiveFile: async () => {
        const { currentProject, activeFile, unsavedPaths } = get();
        if (!currentProject || !activeFile) return;

        try {
          await invoke("save_file", {
            projectPath: currentProject.path,
            filePath: activeFile.path,
            content: activeFile.content,
          });

          // Remove only the saved file from dirty set
          const next = new Set(unsavedPaths);
          next.delete(activeFile.path);
          set({ unsavedPaths: next });
        } catch (err) {
          console.error("Failed to save file:", err);
        }
      },

      onAgentFileWrite: (path, content) => {
        const { currentProject, openTabs } = get();
        if (!currentProject) return;

        const file: CodeFile = { path, content };

        const existingIndex = currentProject.files.findIndex(
          (f) => f.path === path
        );
        const updatedFiles =
          existingIndex >= 0
            ? currentProject.files.map((f) =>
                f.path === path ? file : f
              )
            : [...currentProject.files, file];

        set({
          currentProject: { ...currentProject, files: updatedFiles },
          activeFile: file,
          openTabs: openTabs.includes(path)
            ? openTabs
            : [...openTabs, path],
        });
      },

      setAgentRunning: (running) => set({ agentRunning: running }),
      setExpoRunning: (running) => set({ expoRunning: running }),

      addProjectLog: (entry: ProjectLogs) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const log: ProjectLogs = {
          ...entry,
          timestamp: new Date().toISOString(),
        };

        const updatedProject = {
          ...currentProject,
          logs: [
            ...currentProject.logs.filter(x => !(x.action === entry.action && x.type === 'error')),
            log,
          ],
        };

        set({ currentProject: updatedProject });
        set(state => ({
          projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
        }));
      },

      addExpoUrl: (url: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject = {...currentProject, expoUrl: url };

        set({ currentProject: updatedProject });
        const { projects } = get();
        const updatedProjects = projects.map((p) =>
          p.id === updatedProject.id ? updatedProject : p
        );
        set({ projects: updatedProjects });
      },

      reset: () => set(initialState),
    }),
    {
      name: "app-store",
      storage: tauriStorage,
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);
