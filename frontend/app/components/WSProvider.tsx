'use client';
import { useEffect } from 'react';
import { connectWebSocket } from '../lib/websocket';

export default function WSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    connectWebSocket();
  }, []);
  return <>{children}</>;
}
