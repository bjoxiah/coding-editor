import * as Y from 'yjs';
import { ydoc, observers, setYdoc } from './session';

export const createDoc = () => {
    destroyDoc();
    setYdoc(new Y.Doc());
};

export const destroyDoc = () => {
    if (!ydoc) return;
    observers.forEach((fn, path) => {
        ydoc!.getText(`file:${path}`).unobserve(fn);
    });
    observers.clear();
    ydoc.destroy();
    setYdoc(null);
};