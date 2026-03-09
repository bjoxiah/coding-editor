import { toast } from "sonner";
import { handleMessage } from "./handle-message";
import { sendControl } from "./send-control";
import { controlWs, intent, meta, setControlWs } from "./session";
import { teardown } from "./tear-down";
import { CollabStore, useCollab } from "..";
import { useSettings } from "@/store/settings";

export const openSocket = (set: (s: Partial<CollabStore>) => void) => {
	const ws = new WebSocket(`${useSettings.getState().settings.ws_url}/collab`);
    setControlWs(ws)
	set({ status: 'connecting' });

	ws.onopen = () => {
		const { workspaceCode, username, color } = meta!;
		if (intent === 'open') {
			sendControl({ type: 'room:open', workspaceCode, username, color });
		} else {
			sendControl({ type: 'room:knock', workspaceCode, username, color });
		}
	};

	ws.onmessage = (raw) => {
		try {
			handleMessage(JSON.parse(raw.data));
		} catch (e: any) {
			toast.error(e?.message, { position: 'top-center' });
		}
	};

	ws.onclose = () => {
		if (controlWs !== ws) return;

		teardown();
		useCollab.setState({ status: 'off', members: [], provider: null });
	};

	ws.onerror = () => {
		if (controlWs !== ws) return;

		teardown();
		useCollab.setState({ status: 'off', members: [], provider: null });
	};
};
