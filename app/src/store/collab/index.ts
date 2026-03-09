import { create } from "zustand";
import { WebsocketProvider } from "y-websocket";
import { openSocket } from "./helpers/socket";
import { sendControl } from "./helpers/send-control";
import { teardown } from "./helpers/tear-down";
import { useAppStore } from "..";
import { controlWs, meta, setIntent, setMeta, yjsProvider } from "./helpers/session";


export type CollabStatus =
    | 'off'
    | 'connecting'
    | 'incoming'
    | 'pending'
    | 'active'
    | 'declined'
    | 'not_found'
    | 'kicked';

export interface JoinRequest {
    requestId: string;
    username: string;
}

export interface AwarenessMember {
    clientId: number;
    username: string;
    color: string;
    activeFile?: string;
}


export interface CollabStore {
	status: CollabStatus;
	requests: JoinRequest[];
	members: AwarenessMember[];
	provider: WebsocketProvider | null;

	enable: (workspaceCode: string, username: string, color: string) => void;
	disable: () => void;
	knock: (code: string, username: string, color: string) => void;
	accept: (id: string) => void;
	decline: (id: string) => void;
	kick: (clientId: number) => void;
	setActiveFile: (file: string) => void;
}

export const useCollab = create<CollabStore>((set, get) => ({
	status: 'off',
	requests: [],
	members: [],
	provider: null,

	enable: (workspaceCode, username, color) => {
		if (controlWs) return;
		setMeta({ workspaceCode, username, color });
		setIntent('open');
		openSocket(set);
	},

	disable: () => {
		sendControl({
			type: 'room:closed',
			workspaceCode: meta?.workspaceCode,
		});
		teardown();

		set({ status: 'off', requests: [], members: [], provider: null });

		const { currentProject } = useAppStore.getState();
		if (currentProject) {
			const updated = { ...currentProject, files: [] };
			useAppStore.setState((s) => ({
				currentProject: updated,
				activeFile: null,
				openTabs: [],
				freshRead: true,
				// Keep projects in sync with the updated currentProject
				projects: s.projects.map((p) =>
					p.id === updated.id ? updated : p,
				),
			}));
		}
	},

	knock: (code, username, color) => {
		if (controlWs) return;
		setMeta({ workspaceCode: code, username, color });
		setIntent('knock');
		openSocket(set);
	},

	accept: (requestId) => {
		const { currentProject } = useAppStore.getState();
		sendControl({
			type: 'room:accept',
			requestId,
			workspaceCode: meta!.workspaceCode,
			snapshot: JSON.stringify(currentProject),
		});
		set((s) => ({
			requests: s.requests.filter((r) => r.requestId !== requestId),
		}));
	},

	decline: (requestId) => {
		sendControl({
			type: 'room:decline',
			requestId,
			workspaceCode: meta!.workspaceCode,
		});
		set((s) => ({
			requests: s.requests.filter((r) => r.requestId !== requestId),
		}));
	},

	kick: (clientId) => {
		const member = get().members.find((m) => m.clientId === clientId);
		if (!member || !meta) return;
		sendControl({
			type: 'room:kick',
			workspaceCode: meta.workspaceCode,
			username: member.username,
		});
	},

	setActiveFile: (filePath) => {
		if (!yjsProvider || !meta) return;
		yjsProvider.awareness.setLocalStateField('user', {
			username: meta.username,
			color: meta.color,
			activeFile: filePath,
		});
	},
}));