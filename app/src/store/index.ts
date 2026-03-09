import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CodeFile, FileNode, IAppState, Project, ProjectLogs } from '../models';
import { tauriStorage } from '@/lib/persistence';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

// Necessary for web testing
export const isTauri = () =>
	typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const tauriInvoke = async <T>(cmd: string, args?: any): Promise<T> => {
	return invoke<T>(cmd, args);
};

type AppActions = {
	addProject: (meta: Project) => void;
	removeProject: (path: string, deleteFromDisk?: boolean) => Promise<void>;
	setCurrentProject: (project: Project | null) => void;
	loadFileTree: () => Promise<void>;
	loadFiles: () => Promise<void>;
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

const initialState: IAppState = {
	projects: [],
	currentProject: null,
	activeFile: null,
	openTabs: [],
	agentRunning: false,
	expoRunning: false,
	unsavedPaths: new Set<string>(),
	freshRead: false,
};

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

				if (deleteFromDisk) {
					try {
						if (isTauri()) {
							await tauriInvoke('delete_project', {
								projectPath: path,
							});
						}
					} catch (err) {
						console.error(
							'Failed to delete project from disk:',
							err,
						);
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
				});
			},

			loadFiles: async () => {
				const { currentProject } = get();
				if (!currentProject || !isTauri()) return;

				const IMAGE_EXTENSIONS = new Set([
					'png',
					'jpg',
					'jpeg',
					'gif',
					'webp',
					'svg',
					'ico',
					'bmp',
					'tiff',
					'tif',
					'avif',
					'heic',
					'heif',
					// Fonts
					'ttf',
					'otf',
					'woff',
					'woff2',
					'eot',
					// Binary / media
					'mp4',
					'mp3',
					'mov',
					'avi',
					'webm',
					'ogg',
					'pdf',
					'zip',
					'tar',
					'gz',
					'exe',
					'dmg',
				]);

				const isBinaryFile = (path: string) => {
					const ext = path.split('.').pop()?.toLowerCase() ?? '';
					return IMAGE_EXTENSIONS.has(ext);
				};

				const collectFiles = (nodes: FileNode[]): string[] => {
					const paths: string[] = [];
					for (const node of nodes) {
						if (node.children && node.children.length > 0) {
							paths.push(...collectFiles(node.children));
						} else if (!isBinaryFile(node.path)) {
							paths.push(node.path);
						}
					}
					return paths;
				};

				// Refresh tree first so we walk the latest file structure
				await get().loadFileTree();

				// Re-read state after tree update
				const { currentProject: refreshed } = get();
				if (!refreshed) return;

				const paths = collectFiles(refreshed.tree ?? []);

				try {
					const files: CodeFile[] = await Promise.all(
						paths.map(async (filePath) => {
							const content = await tauriInvoke<string>(
								'read_file',
								{
									projectPath: refreshed.path,
									filePath,
								},
							);
							return { path: filePath, content };
						}),
					);

					set({
						currentProject: { ...refreshed, files },
					});
				} catch (err: any) {
					toast.error(err, { position: 'top-center' });
				}
			},

			loadFileTree: async () => {
				const { currentProject } = get();
				if (!currentProject) return;

				try {
					// In browser, just keep whatever tree we already have
					if (!isTauri()) return;

					const tree = await tauriInvoke<FileNode[]>(
						'get_file_tree',
						{
							projectPath: currentProject.path,
						},
					);
					set({ currentProject: { ...currentProject, tree } });
				} catch (err: any) {
					toast.error(err, { position: 'top-center' });
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
				const {
					currentProject: initialProject,
					openTabs,
					freshRead,
				} = get();
				if (!initialProject) return;

				if (!freshRead) {
					const existing = initialProject.files.find(
						(f) => f.path === path,
					);
					if (existing) {
						set({
							activeFile: existing,
							openTabs: openTabs.includes(path)
								? openTabs
								: [...openTabs, path],
						});
						return;
					}
				}

				if (freshRead) set({ freshRead: false });

				try {
					const content = isTauri()
						? await tauriInvoke<string>('read_file', {
								projectPath: initialProject.path,
								filePath: path,
							})
						: '';

					const { currentProject } = get();
					if (!currentProject) return;

					const file: CodeFile = { path, content };

					set({
						currentProject: {
							...currentProject,
							files: [
								...currentProject.files.filter(
									(f) => f.path !== path,
								),
								file,
							],
						},
						activeFile: file,
						openTabs: openTabs.includes(path)
							? openTabs
							: [...openTabs, path],
					});
				} catch (err: any) {
					toast.error(err, { position: 'top-center' });
				}
			},

			setActiveFile: (file) => set({ activeFile: file }),

			updateFileContent: (path, content) => {
				const { currentProject, activeFile, unsavedPaths } = get();
				if (!currentProject) return;

				const existing = currentProject.files.find(
					(f) => f.path === path,
				);
				if (existing?.content === content) return;

				set({
					unsavedPaths: new Set([...unsavedPaths, path]),
					currentProject: {
						...currentProject,
						files: currentProject.files.map((f) =>
							f.path === path ? { ...f, content } : f,
						),
					},
					activeFile:
						activeFile?.path === path
							? { ...activeFile, content }
							: activeFile,
				});
			},

			closeTab: (path) => {
				const { openTabs, activeFile, unsavedPaths } = get();
				const next = openTabs.filter((t) => t !== path);

				const nextUnsaved = new Set(unsavedPaths);
				nextUnsaved.delete(path);

				set({
					openTabs: next,
					unsavedPaths: nextUnsaved,
					activeFile:
						activeFile?.path === path
							? next.length > 0
								? { path: next[next.length - 1], content: '' }
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
					if (isTauri()) {
						await tauriInvoke('save_file', {
							projectPath: currentProject.path,
							filePath: activeFile.path,
							content: activeFile.content,
						});
					}
					const next = new Set(unsavedPaths);
					next.delete(activeFile.path);
					set({ unsavedPaths: next });
				} catch (err: any) {
					toast.error(err, { position: 'top-center' });
				}
			},

			onAgentFileWrite: (path, content) => {
				const { currentProject, openTabs, unsavedPaths } = get();
				if (!currentProject) return;

				const file: CodeFile = { path, content };

				const nextUnsaved = new Set(unsavedPaths);
				nextUnsaved.delete(path);

				const existingIndex = currentProject.files.findIndex(
					(f) => f.path === path,
				);
				const updatedFiles =
					existingIndex >= 0
						? currentProject.files.map((f) =>
								f.path === path ? file : f,
							)
						: [...currentProject.files, file];

				set({
					currentProject: { ...currentProject, files: updatedFiles },
					activeFile: file,
					unsavedPaths: nextUnsaved,
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
						...currentProject.logs.filter(
							(x) =>
								!(
									x.runId === entry.runId &&
									x.type === 'error'
								),
						),
						log,
					],
				};

				set({ currentProject: updatedProject });
				set((state) => ({
					projects: state.projects.map((p) =>
						p.id === updatedProject.id ? updatedProject : p,
					),
				}));
			},

			addExpoUrl: (url: string) => {
				const { currentProject } = get();
				if (!currentProject) return;

				const updatedProject = { ...currentProject, expoUrl: url };
				set({ currentProject: updatedProject });

				const { projects } = get();
				set({
					projects: projects.map((p) =>
						p.id === updatedProject.id ? updatedProject : p,
					),
				});
			},

			reset: () => set(initialState),
		}),
		{
			name: 'app-store',
			storage: tauriStorage,
			partialize: (state) => ({ projects: state.projects }),
		},
	),
);
