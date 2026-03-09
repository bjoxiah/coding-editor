declare module "y-websocket/bin/utils" {
  import { WebSocket } from "ws";
  import * as Y from "yjs";

  export function setupWSConnection(ws: WebSocket, req: any, opts?: any): void;
  export function setPersistence(persistence: {
    bindState: (docName: string, ydoc: Y.Doc) => Promise<void>;
    writeState: (docName: string, ydoc: Y.Doc) => Promise<void>;
  }): void;
}