const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { pool } = require('../config/db');

/**
 * Initializes Socket.IO on top of the given HTTP server.
 * Clients authenticate by passing their JWT access token in the
 * connection handshake (`auth: { token }`).
 *
 * Rooms used throughout the app:
 *   user:<id>      -> personal notifications
 *   project:<id>   -> Kanban board live updates
 *   task:<id>      -> live comments on a task detail view
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const [rows] = await pool.query('SELECT id, name, is_blocked FROM users WHERE id = ?', [decoded.id]);
      if (!rows.length || rows[0].is_blocked) return next(new Error('Unauthorized'));

      socket.userId = rows[0].id;
      socket.userName = rows[0].name;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });
    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
    });
    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('disconnect', () => {
      // No-op: cleanup is automatic. Hook for presence tracking if needed later.
    });
  });

  return io;
}

module.exports = initSocket;
