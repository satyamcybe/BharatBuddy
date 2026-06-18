require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');

const pinboardRouter = require('./routes/pinboard');
const reportRouter = require('./routes/report');
const initSocket = require('./socket/index');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to route handlers
app.set('io', io);

// Security and parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/pinboard', pinboardRouter);
app.use('/api/report', reportRouter);

// Socket.io
initSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
