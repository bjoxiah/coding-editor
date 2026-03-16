import { nanoid } from "nanoid";
import { rooms, clients } from "./model";
import WebSocket from "ws";

export const handleMessage = (socketId: string, ws: WebSocket, msg: any) => {
	switch (msg.type) {
		case 'room:open':
			return onRoomOpen(socketId, ws, msg);
		case 'room:knock':
			return onKnock(socketId, ws, msg);
		case 'room:accept':
			return onAccept(socketId, msg);
		case 'room:decline':
			return onDecline(socketId, msg);
		case 'room:kick':
			return onKick(socketId, msg);
		case 'room:close':
			return onRoomClose(socketId, msg);
	}
}

// Owner opens room
export const onRoomOpen = (socketId: string, ws: WebSocket, msg: any) => {
	rooms.set(msg.workspaceCode, {
		ownerId: socketId,
		ownerWs: ws,
		pending: new Map(),
		members: new Map(),
	});
	clients.get(socketId)!.workspaceCode = msg.workspaceCode;
	clients.get(socketId)!.username = msg.username;
	send(ws, { type: 'room:opened' });
}

// Collaborator knocks
export const onKnock = (socketId: string, ws: WebSocket, msg: any) => {
	const room = rooms.get(msg.workspaceCode);
	if (!room) {
		send(ws, { type: 'room:not_found' });
		return;
	}

	const requestId = nanoid();
	room.pending.set(requestId, {
		requestId,
		ws,
		username: msg.username,
		socketId,
	});
	clients.get(socketId)!.workspaceCode = msg.workspaceCode;
	clients.get(socketId)!.username = msg.username;

	send(ws, { type: 'room:knocked', requestId });
	send(room.ownerWs, {
		type: 'room:incoming',
		requestId,
		username: msg.username,
	});
}

// Owner accepts
export const onAccept = (socketId: string, msg: any) => {
	const room = rooms.get(msg.workspaceCode);
	if (!room || room.ownerId !== socketId) return;

	const req = room.pending.get(msg.requestId);
	if (!req) return;

	room.pending.delete(msg.requestId);
	// Track as a member so we can kick later
	room.members.set(req.socketId, {
		socketId: req.socketId,
		ws: req.ws,
		username: req.username,
	});

	send(req.ws, {
		type: 'room:accepted',
		workspaceCode: msg.workspaceCode,
		snapshot: msg.snapshot,
	});
}

// Owner declines
export const onDecline = (socketId: string, msg: any) => {
	const room = rooms.get(msg.workspaceCode);
	if (!room || room.ownerId !== socketId) return;

	const req = room.pending.get(msg.requestId);
	if (!req) return;

	room.pending.delete(msg.requestId);
	send(req.ws, { type: 'room:declined' });
}

// Owner kicks a member by username
export const onKick = (socketId: string, msg: any) => {
	const room = rooms.get(msg.workspaceCode);
	if (!room || room.ownerId !== socketId) return;

	// Find the member by username
	for (const [memberSocketId, member] of room.members) {
		if (member.username === msg.username) {
			send(member.ws, { type: 'room:kicked' });
			room.members.delete(memberSocketId);
			break;
		}
	}
}

// Owner closes the room
export const onRoomClose = (socketId: string, msg: any) => {
	const room = rooms.get(msg.workspaceCode);
	if (!room || room.ownerId !== socketId) return;

	// Notify all members
	for (const member of room.members.values()) {
		send(member.ws, { type: 'room:closed' });
	}

	rooms.delete(msg.workspaceCode);
}

// Disconnect
export const handleDisconnect = (socketId: string) => {
	const client = clients.get(socketId);
	if (!client) return;
	clients.delete(socketId);

	if (!client.workspaceCode) return;
	const room = rooms.get(client.workspaceCode);
	if (!room) return;

	if (room.ownerId === socketId) {
		// Owner left — notify everyone
		for (const member of room.members.values()) {
			send(member.ws, { type: 'room:closed' });
		}
		rooms.delete(client.workspaceCode);
	} else {
		// Member left
		room.members.delete(socketId);
	}
}

// Helper

export const send = (ws: WebSocket, payload: object) => {
	if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
};