# VedaAI — AI Assessment Creator

A full-stack AI-powered assessment creation tool. Teachers fill a form, Gemini AI generates a structured question paper, and the results are delivered in real-time via WebSocket.

## Architecture

```
Frontend (Next.js)  ←WebSocket→  Backend (Express)
                                      ↓ BullMQ
                                  Gemini 1.5 Pro
                                      ↓
                                  MongoDB (store)
                                  Redis (cache/jobs)
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)
- Redis running locally (`redis-server`)
- Gemini API key

### 1. Backend Setup

```bash
cd backend

# Add your Gemini API key to .env
# Edit backend/.env and set: GEMINI_API_KEY=your_key_here

npm install
npm run dev
# → Running on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

### 3. Open the App
Visit **http://localhost:3000**

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/vedaai` | MongoDB connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `GEMINI_API_KEY` | *(required)* | Google Gemini API key |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:5000` | WebSocket URL |

---

## Features

### ✅ Core
- **3-step creation form** — Title, subject, grade, due date, question types, instructions, file upload
- **Dynamic question type table** — Add/remove rows, auto-calculate totals
- **AI generation** — Gemini 1.5 Pro generates structured JSON (sections, questions, difficulty, marks, answer key)
- **Real-time WebSocket updates** — Live progress bar during generation
- **Output page** — Formatted exam paper with student fields, sections, difficulty badges
- **Zustand state management** — Devtools-enabled store
- **BullMQ background jobs** — Retries with exponential backoff
- **Redis caching** — Assignment list cached for 30s
- **MongoDB** — Persistent storage for assignments and papers

### ✅ Bonus
- **Answer Key toggle** — Show/hide per-question answers
- **Print/PDF** — Browser print with clean print stylesheet
- **Regenerate** — Re-queue generation for an existing assignment
- **Difficulty distribution chart** — Visual bar chart in action panel

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/assignments` | List all assignments |
| `POST` | `/api/assignments` | Create + queue generation |
| `GET` | `/api/assignments/:id` | Get assignment + paper |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `POST` | `/api/assignments/:id/regenerate` | Re-queue generation |

## WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `connected` | Server→Client | `{ clientId }` |
| `subscribe` | Client→Server | `{ assignmentId }` |
| `job:progress` | Server→Client | `{ assignmentId, status, progress, message }` |
| `job:completed` | Server→Client | `{ assignmentId, paperId, progress: 100 }` |
| `job:failed` | Server→Client | `{ assignmentId, message }` |
