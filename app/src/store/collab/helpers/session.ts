import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export let ydoc: Y.Doc | null = null;
export let isSeeding = false;
export let yjsProvider: WebsocketProvider | null = null;
export let controlWs: WebSocket | null = null;
export let meta: {
	workspaceCode: string;
	username: string;
	color: string;
} | null = null;
export let intent: 'open' | 'knock' = 'open';
export let persistTimer: ReturnType<typeof setTimeout> | null = null;

export const dirtyFiles = new Set<string>();
export const observers = new Map<string, () => void>();

export const setYdoc = (doc: Y.Doc | null) => {
	ydoc = doc;
};
export const setProvider = (p: WebsocketProvider | null) => {
	yjsProvider = p;
};
export const setControlWs = (ws: WebSocket | null) => {
	controlWs = ws;
};
export const setMeta = (
	m: { workspaceCode: string; username: string; color: string } | null,
) => {
	meta = m;
};
export const setIntent = (i: 'open' | 'knock') => {
	intent = i;
};
export const setPersistTimer = (t: ReturnType<typeof setTimeout> | null) => {
	persistTimer = t;
};

export const setIsSeeding = (v: boolean) => { isSeeding = v; };

export const getYdoc = () => ydoc;