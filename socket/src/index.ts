import 'dotenv/config';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setPersistence, setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import { nanoid } from 'nanoid';
import { handleMessage, handleDisconnect, send } from './control/helpers';
import { rooms, clients } from './control/model';

// Persistence

const ldb = new LeveldbPersistence('./data');

setPersistence({
	bindState: async (roomName, ydoc) => {
		const persistedYdoc = await ldb.getYDoc(roomName);
		const existing = Y.encodeStateAsUpdate(persistedYdoc);
		Y.applyUpdate(ydoc, existing);
		ydoc.on('update', (update: Uint8Array) => {
			ldb.storeUpdate(roomName, update);
		});
	},
	writeState: async () => {},
});

// HTTP

const server = createServer(async (req, res) => {
	const url = new URL(req.url!, `http://${req.headers.host}`);

	if (url.pathname === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
		return;
	}

	res.writeHead(404).end();
});

// Two WS servers

const controlWss = new WebSocketServer({ noServer: true });
const yjsWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
	const path = new URL(req.url!, `http://${req.headers.host}`).pathname;
	if (path.startsWith('/yjs')) {
		yjsWss.handleUpgrade(req, socket, head, (ws) =>
			yjsWss.emit('connection', ws, req),
		);
	} else if (path.startsWith('/collab')) {
		controlWss.handleUpgrade(req, socket, head, (ws) =>
			controlWss.emit('connection', ws, req),
		);
	} else {
		socket.destroy();
	}
});

yjsWss.on('connection', (ws, req) => setupWSConnection(ws, req));

// Control channel

controlWss.on('connection', (ws) => {
	const socketId = nanoid();
	clients.set(socketId, { ws, workspaceCode: null, username: null });
	send(ws, { type: 'connected', socketId });

	ws.on('message', (raw) => {
		try {
			handleMessage(socketId, ws, JSON.parse(raw.toString()));
		} catch {}
	});
	ws.on('close', () => handleDisconnect(socketId));
	ws.on('error', () => handleDisconnect(socketId));
});

// Boot

const PORT = process.env.PORT ?? 1234;
server.listen(PORT, () => {});
