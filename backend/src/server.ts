import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

import assignmentRoutes from './routes/assignments';
import { wsService } from './services/websocketService';
import { startWorker } from './workers/generationWorker';
import { initQueue } from './queues/assignmentQueue';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: process.env.REDIS_AVAILABLE === 'true' ? 'connected' : 'unavailable (direct mode)',
  });
});

// HTTP + WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  const clientId = uuidv4();
  console.log(`🔌 WebSocket client connected: ${clientId}`);
  wsService.registerClient(clientId, ws);
  ws.send(JSON.stringify({ type: 'connected', clientId, message: 'Connected to VedaAI WebSocket' }));
});

wss.on('error', (err) => {
  console.error('WSS error:', err);
});

// Connect MongoDB and start
async function bootstrap() {
  try {
    // Connect MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Try Redis/BullMQ — fall back to direct mode if unavailable
    const redisOk = await initQueue();
    if (redisOk) {
      startWorker();
      console.log('✅ Redis connected — BullMQ queue active');
    } else {
      console.log('⚠️  Redis unavailable — using direct in-process generation');
    }

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 VedaAI Backend running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();

export { app, server, wss };
