import { schedulePersist } from "./persist-data";
import { dirtyFiles, isSeeding, observers, ydoc } from "./session";

export const observeFile = (path: string) => {
    if (!ydoc || observers.has(path)) return;

    const fn = () => {
        if (isSeeding) return;
        dirtyFiles.add(path);
        schedulePersist();
    };

    ydoc.getText(`file:${path}`).observe(fn);
    observers.set(path, fn);
};