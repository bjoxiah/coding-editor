import { WebsocketProvider } from "y-websocket";
import { AwarenessMember, useCollab } from "..";

export const bindAwareness = (provider: WebsocketProvider) => {
	const read = () => {
		const members: AwarenessMember[] = [];
		provider.awareness.getStates().forEach((state, clientId) => {
			if (state?.user) members.push({ clientId, ...state.user });
		});
		useCollab.setState({ members });
	};

	read();
	provider.awareness.on('change', read);
};