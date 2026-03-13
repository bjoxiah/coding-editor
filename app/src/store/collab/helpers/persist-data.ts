import { useSettings } from '@/store/settings';
import { ydoc, dirtyFiles, persistTimer, setPersistTimer } from './session';
import { isTauri, tauriInvoke, useAppStore } from '@/store';

export const persistNow = async () => {
    if (!isTauri() || !ydoc) return;

    const { currentProject, unsavedPaths } = useAppStore.getState();
    if (!currentProject || currentProject.owner !== useSettings.getState().settings.username) return;

    const projectPath = currentProject.path;
    const toWrite = [...dirtyFiles];
    dirtyFiles.clear();

    await Promise.all(
        toWrite.map(async (filePath) => {
            const content = ydoc!.getText(`file:${filePath}`).toString();
            if (!content) return;
            try {
                await tauriInvoke('save_file', { projectPath, filePath, content });
                const next = new Set(unsavedPaths);
                next.delete(filePath);
                useAppStore.setState({ unsavedPaths: next });
            } catch (e) {
                dirtyFiles.add(filePath);
                console.error('[persist] failed:', filePath, e);
            }
        }),
    );
};

export const schedulePersist = () => {
    if (persistTimer) clearTimeout(persistTimer);
    setPersistTimer(setTimeout(persistNow, 1500));
};