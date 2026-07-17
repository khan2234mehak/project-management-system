const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.unreadOnly === 'true';

  const where = ['n.user_id = ?'];
  const params = [req.user.id];
  if (unreadOnly) where.push('n.is_read = 0');

  const [rows] = await pool.query(
    `SELECT n.id, n.type, n.title, n.message, n.link, n.is_read, n.created_at,
            a.name AS actor_name, a.avatar_url AS actor_avatar
     FROM notifications n LEFT JOIN users a ON a.id = n.actor_id
     WHERE ${where.join(' AND ')}
     ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ unreadCount }]] = await pool.query(
    'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );

  res.json({ success: true, data: rows, unreadCount, pagination: { page, limit } });
});

// PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) throw ApiError.notFound('Notification not found');
  res.json({ success: true, message: 'Notification marked as read' });
});

// PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
  res.json({ success: true, message: 'All notifications marked as read' });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) throw ApiError.notFound('Notification not found');
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { listNotifications, markAsRead, markAllAsRead, deleteNotification };
