const { pool } = require('../config/db');

let ioInstance = null;

/** Called once from server.js after the Socket.IO server is created. */
function attachIo(io) {
  ioInstance = io;
}

/**
 * Create a notification row and push it in real time to the recipient's
 * personal room (room name = `user:<id>`) if they're connected.
 */
async function notify({ userId, actorId = null, type, title, message = null, link = null }) {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, actor_id, type, title, message, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, actorId, type, title, message, link]
  );

  const payload = {
    id: result.insertId,
    user_id: userId,
    actor_id: actorId,
    type,
    title,
    message,
    link,
    is_read: 0,
    created_at: new Date().toISOString(),
  };

  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', payload);
  }

  return payload;
}

/** Notify multiple recipients at once (e.g. all team members). */
async function notifyMany(userIds, params) {
  const unique = [...new Set(userIds)].filter((id) => id !== params.actorId);
  await Promise.all(unique.map((userId) => notify({ ...params, userId })));
}

module.exports = { attachIo, notify, notifyMany };
