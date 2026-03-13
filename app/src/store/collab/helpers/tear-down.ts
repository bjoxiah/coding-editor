import { useAppStore } from "@/store";
import { destroyDoc } from "./doc";
import { persistNow } from "./persist-data";
import { controlWs, dirtyFiles, meta, persistTimer, setControlWs, setMeta, setPersistTimer, setProvider, yjsProvider } from "./session";

export const teardown = (removeProject = false) => {
	if (persistTimer) {
		clearTimeout(persistTimer);
        setPersistTimer(null);
		persistNow();
	}

	dirtyFiles.clear();

	const workspaceCode = meta?.workspaceCode;

	yjsProvider?.destroy();
    setProvider(null)

	destroyDoc(); // unobserves all files + destroys ydoc

	const ws = controlWs;
	setControlWs(null);
	ws?.close();

    setMeta(null);

	if (removeProject && workspaceCode) {
		useAppStore.getState().setCurrentProject(null);
		useAppStore.setState((s) => ({
			projects: s.projects.filter(
				(p) => p.id !== workspaceCode.toLowerCase(),
			),
		}));
	}

	console.log('[collab] session torn down');
};