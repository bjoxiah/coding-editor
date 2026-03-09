import WebSocket from "ws";

export interface PendingRequest {
    requestId: string;
    ws: WebSocket;
    username: string;
    socketId: string;
}

export interface Room {
    ownerId: string;
    ownerWs: WebSocket;
    pending: Map<string, PendingRequest>;
    members: Map<string, { socketId: string; ws: WebSocket; username: string }>;
}

export const rooms = new Map<string, Room>();
export const clients = new Map<
    string,
    { ws: WebSocket; workspaceCode: string | null; username: string | null }
>();