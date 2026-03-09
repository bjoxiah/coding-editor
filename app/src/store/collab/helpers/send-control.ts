import { controlWs } from './session';

export const sendControl = (payload: object) => {
    if (controlWs?.readyState === WebSocket.OPEN) {
        controlWs.send(JSON.stringify(payload));
    }
};