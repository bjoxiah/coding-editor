import { WebsocketProvider } from "y-websocket";
import * as Y from 'yjs';
import { meta, setProvider, ydoc } from "./session";
import { useAppStore } from "@/store";
import { observeFile } from "./observe";
import { bindAwareness } from "./bind-awareness";
import { useCollab } from "..";
import { useSettings } from "@/store/settings";

export const connectYjs = (onReady?: (doc: Y.Doc) => void) => {
	if (!meta || !ydoc) return;

	const { workspaceCode, username, color } = meta;

	const provider = new WebsocketProvider(
		`${useSettings.getState().settings.ws_url}/yjs`,
		workspaceCode,
		ydoc,
	);

    setProvider(provider);

	provider.on('sync', (synced: boolean) => {
		if (!synced) return;
		console.log('[yjs] synced', workspaceCode);

		// Host: seed files into ydoc on first sync
		onReady?.(ydoc!);

		// Both peers: start observing all project files for changes.
		const { currentProject } = useAppStore.getState();
		currentProject?.files.forEach((file) => observeFile(file.path));

		provider!.awareness.setLocalStateField('user', {
			username,
			color,
			activeFile: useAppStore.getState().activeFile?.path,
		});

		bindAwareness(provider!);

		useCollab.setState({ provider: provider, status: 'active' });
	});
};