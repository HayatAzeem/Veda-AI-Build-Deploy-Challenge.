import { useAssignmentStore, JobProgress } from '../store/useAssignmentStore';

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

export function connectWebSocket() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
  const { setWsConnected, setJobProgress, updateAssignmentStatus } = useAssignmentStore.getState();

  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) return wsInstance;

  wsInstance = new WebSocket(wsUrl);

  wsInstance.onopen = () => {
    console.log('✅ WebSocket connected');
    setWsConnected(true);
    reconnectAttempts = 0;
  };

  wsInstance.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg, setJobProgress, updateAssignmentStatus);
    } catch (e) {
      console.warn('WS message parse error:', e);
    }
  };

  wsInstance.onclose = () => {
    setWsConnected(false);
    wsInstance = null;

    if (reconnectAttempts < MAX_RECONNECT) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
      reconnectAttempts++;
      console.log(`🔄 WS reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
      reconnectTimer = setTimeout(connectWebSocket, delay);
    }
  };

  wsInstance.onerror = (err) => {
    console.warn('WS error:', err);
  };

  return wsInstance;
}

function handleMessage(
  msg: any,
  setJobProgress: (id: string, p: JobProgress) => void,
  updateAssignmentStatus: (id: string, status: any) => void
) {
  const { type, assignmentId, status, progress, message, paperId } = msg;

  if (type === 'job:progress' || type === 'job:completed' || type === 'job:failed') {
    if (assignmentId) {
      setJobProgress(assignmentId, { assignmentId, status, progress, message, paperId });
      updateAssignmentStatus(assignmentId, status);
    }
  }
}

export function subscribeToAssignment(assignmentId: string) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify({ type: 'subscribe', assignmentId }));
  }
}

export function unsubscribeFromAssignment(assignmentId: string) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify({ type: 'unsubscribe', assignmentId }));
  }
}

export function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (wsInstance) {
    wsInstance.close();
    wsInstance = null;
  }
}

export { wsInstance };
