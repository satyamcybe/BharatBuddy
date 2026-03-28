# CampusWhisper

> Anonymous, ephemeral chat platform for college students. No signup. No identity. Gone by morning.

---

## Features

- 🎭 **Zero-identity** — no signup, no email, no phone. Just pick your year, branch, and mood.
- 💬 **8 Topic Rooms** — Academics, Placements, Study Together, Vent, Ideas & Projects, Productivity, SOS, Just Talk
- 👻 **Ephemeral messages** — all chats auto-delete after 24 hours (Redis TTL)
- 🆘 **SOS System** — urgent help requests broadcast across all rooms with a glowing banner
- 🔔 **"I Shipped It"** — celebrate wins; broadcasts a bell notification to every room
- 📌 **Resource Pinboard** — pin notes, videos, tools, and repos per room; upvote the best ones
- 🧑‍💻 **Code Blocks** — syntax-highlighted code sharing with Prism.js (JS, Python, C, C++, Java, more)
- 🌫️ **Whisper Wall** — anonymous one-liners that float away after 24 hours
- 🚨 **Moderation** — profanity filtering + shadow-ban system + report → auto-remove pipeline
- 📱 **Fully responsive** — collapsible sidebar, touch-friendly on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS v3, Socket.io-client, Framer Motion, Prism.js, Axios |
| Backend | Node.js + Express, Socket.io, Redis (ioredis), PostgreSQL + Prisma ORM |
| Security | helmet, express-rate-limit, bad-words, shadow-ban system |
| Infra | Docker + docker-compose, nginx (client), node:20-alpine (server) |

---

## Quick Start (Docker)

```bash
# Clone and enter the campuswhisper directory
cd campuswhisper

# Copy environment file (defaults work for docker-compose)
cp server/.env.example server/.env

# Start all services
docker-compose up --build

# In a separate terminal, run migrations and seed data
docker-compose exec server npx prisma migrate deploy
docker-compose exec server node src/prisma/seed.js
```

Open **http://localhost:5173** in your browser.

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- Redis 7+
- PostgreSQL 15+
- npm

### 1. Server

```bash
cd server

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your local Redis and PostgreSQL URLs

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed sample data
node src/prisma/seed.js

# Start dev server
npm run dev
```

Server runs on **http://localhost:4000**

### 2. Client

```bash
cd client

# Install dependencies
npm install

# Create .env.local
echo "VITE_SERVER_URL=http://localhost:4000" > .env.local

# Start dev server
npm run dev
```

Client runs on **http://localhost:5173**

---

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Express server port |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/campuswhisper` | PostgreSQL connection URL |

### Client (`client/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:4000` | Backend server URL for Socket.io + API |

---

## Project Structure

```
campuswhisper/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── pages/          # Landing, Gate, Rooms, Chat, WhisperWall
│   │   ├── components/     # MessageBubble, CodeBlock, SOSBanner, etc.
│   │   ├── socket.js       # Socket.io client singleton
│   │   ├── App.jsx         # Router + global context
│   │   └── index.css       # Design system CSS variables
│   ├── Dockerfile
│   └── package.json
├── server/
│   ├── src/
│   │   ├── socket/         # Socket.io handlers (room, SOS, whisper)
│   │   ├── redis/          # Redis client + message store
│   │   ├── routes/         # REST API routes (pinboard, report)
│   │   ├── middleware/      # Rate limiter, content moderator
│   │   ├── prisma/         # Prisma schema + seed
│   │   └── index.js        # Express + Socket.io entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
└── docker-compose.yml
```

---

## API Reference

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/pinboard/:roomId` | Get pinned resources for a room |
| `POST` | `/api/pinboard` | Pin a new resource |
| `POST` | `/api/pinboard/:id/upvote` | Upvote a resource |
| `DELETE` | `/api/pinboard/:id` | Delete your pinned resource |
| `POST` | `/api/report` | Report a message |

All API routes are rate-limited to **30 requests/minute per IP**.

---

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId, sessionToken, year, branch, mood }` | Join a chat room |
| `leave_room` | `{ roomId }` | Leave a chat room |
| `send_message` | `{ roomId, content, type, language?, isSOS, sessionToken, handle, year, branch, mood }` | Send a message |
| `typing_start` | `{ roomId, handle }` | Start typing indicator |
| `typing_stop` | `{ roomId }` | Stop typing indicator |
| `ship_it` | `{ handle, sessionToken }` | Broadcast "I Shipped It!" |
| `send_whisper` | `{ content }` | Post to Whisper Wall |
| `upvote_resource` | `{ resourceId, sessionToken }` | Upvote a pinned resource |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room_joined` | `{ messages, onlineCount, dominantMood }` | Confirmation with history |
| `new_message` | Message object | New message in room |
| `message_removed` | `{ messageId }` | Auto-remove after 3+ reports |
| `typing` | `{ handle }` | Someone is typing |
| `stop_typing` | `{ handle }` | Stopped typing |
| `online_count` | `{ roomId, count }` | Room online count update |
| `ship_it_broadcast` | `{ handle }` | Global ship-it notification |
| `sos_broadcast` | Message object | SOS message broadcast |
| `new_whisper` | `{ id, content, createdAt }` | New whisper posted |
| `whisper_history` | `{ whispers }` | Existing whispers on connect |
| `global_online` | `{ total }` | Total platform online count |

---

## Redis Key Schema

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `messages:{roomId}` | List | 86400s | Last 50 messages per room |
| `whispers` | Sorted Set | Score-based | Whisper Wall (24h window) |
| `ratelimit:{sessionToken}` | String | 30s | Message rate limiting (max 5) |
| `shadowban:{sessionToken}` | String | 3600s | Shadow ban flag |
| `reportcount:{messageId}` | String | 86400s | Report counter per message |
| `online:{roomId}` | Set | Manual | Active session tokens per room |

---

## Moderation

- **Profanity filter**: `bad-words` npm package — replaces blocked words with asterisks
- **Rate limiting**: max 5 messages per 30 seconds per session (Redis counter)
- **Shadow ban**: if a session gets 3+ reports, their messages are only visible to themselves for 1 hour
- **Auto-remove**: if a message gets 3+ reports via `/api/report`, it's deleted from Redis and all clients receive `message_removed`

---

## Anonymity Model

- **No auth, no accounts, no cookies**
- Session data stored only in `sessionStorage` (cleared on tab close)
- Anonymous handle (e.g. `SilentCoder#4821`) regenerated every session
- `sessionToken` (UUID v4) used only for rate limiting and shadow-ban tracking in Redis — never stored in PostgreSQL
- Closing the tab = full identity reset

---

## License

MIT
