import { useAppStore } from '@/store';
import { useCollab } from '..';
import { connectYjs } from './connect-yjs';
import { createDoc } from './doc';
import { teardown } from './tear-down';
import { setIsSeeding } from './session';

export const handleMessage = (msg: any) => {
	switch (msg.type) {
		case 'room:opened':
			createDoc();
			connectYjs((doc) => {
				const { currentProject } = useAppStore.getState();
				if (!currentProject) return;

				setIsSeeding(true);
				doc.transact(() => {
					currentProject.files.forEach((file) => {
						const yText = doc.getText(`file:${file.path}`);
						if (yText.length === 0) {
							yText.insert(0, file.content);
						}
					});
				});
				setIsSeeding(false);
			});
			break;

		case 'room:knocked':
			useCollab.setState({ status: 'pending' });
			break;

		case 'room:accepted': {
			createDoc();
			const project = JSON.parse(msg.snapshot);
			const store = useAppStore.getState();
			store.setCurrentProject(project);
			connectYjs();
			break;
		}

		case 'room:declined':
			teardown();
			useCollab.setState({ status: 'declined' });
			break;

		case 'room:not_found':
			teardown();
			useCollab.setState({ status: 'not_found' });
			break;

		case 'room:incoming':
			useCollab.setState((s) => ({
				requests: [
					...s.requests,
					{ requestId: msg.requestId, username: msg.username },
				],
			}));
			break;

		case 'room:kicked':
			teardown(true);
			useCollab.setState({
				status: 'kicked',
				members: [],
				provider: null,
			});
			break;

		case 'room:closed':
			teardown(true);
			useCollab.setState({ status: 'off', members: [], provider: null });
			break;
	}
};
