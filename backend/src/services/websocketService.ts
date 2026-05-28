import WebSocket from 'ws';
import { IncomingMessage } from 'http';

interface WSClient {
  ws: WebSocket;
  assignmentIds: Set<string>;
}

class WebSocketService {
  private clients: Map<string, WSClient> = new Map();

  registerClient(clientId: string, ws: WebSocket) {
    this.clients.set(clientId, { ws, assignmentIds: new Set() });

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && msg.assignmentId) {
          const client = this.clients.get(clientId);
          if (client) {
            client.assignmentIds.add(msg.assignmentId);
          }
        }
        if (msg.type === 'unsubscribe' && msg.assignmentId) {
          const client = this.clients.get(clientId);
          if (client) {
            client.assignmentIds.delete(msg.assignmentId);
          }
        }
      } catch (e) {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
    });

    ws.on('error', () => {
      this.clients.delete(clientId);
    });
  }

  sendToAssignment(assignmentId: string, event: object) {
    const payload = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (
        client.assignmentIds.has(assignmentId) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(payload);
      }
    });
  }

  broadcast(event: object) {
    const payload = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  getConnectedCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
