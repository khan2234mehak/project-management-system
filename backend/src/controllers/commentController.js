const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { notify, notifyMany } = require('../utils/notificationService');
const { ACTIVITY_ACTIONS, NOTIFICATION_TYPES } = require('../config/constants');

let ioInstance = null;
function attachIo(io) { ioInstance = io; }

const MENTION_REGEX = /@([a-zA-Z0-9_.]+)/g;

// ---------------------------------------------------------------------
// GET /api/tasks/:taskId/comments
// ---------------------------------------------------------------------
const listComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const [rows] = await pool.query(
    `SELECT c.id, c.parent_id, c.content, c.is_edited, c.created_at, c.updated_at,
            u.id AS user_id, u.name AS user_name, u.avatar_url AS user_avatar
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.task_id = ? ORDER BY c.created_at ASC`,
    [taskId]
  );
  res.json({ success: true, data: rows });
});

// ---------------------------------------------------------------------
// POST /api/tasks/:taskId/comments
// ---------------------------------------------------------------------
const createComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { content, parentId } = req.body;

  const [tasks] = await pool.query(
    'SELECT t.title, t.assignee_id, t.project_id FROM tasks t WHERE t.id = ?',
    [taskId]
  );
  if (!tasks.length) throw ApiError.notFound('Task not found');
  const task = tasks[0];

  const [result] = await pool.query(
    'INSERT INTO comments (task_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
    [taskId, req.user.id, parentId || null, content]
  );
  const commentId = result.insertId;

  const newComment = {
    id: commentId,
    parent_id: parentId || null,
    content,
    is_edited: 0,
    created_at: new Date().toISOString(),
    user_id: req.user.id,
    user_name: req.user.name,
    user_avatar: req.user.avatar_url,
  };

  if (ioInstance) {
    ioInstance.to(`task:${taskId}`).emit('comment:new', newComment);
  }

  // Notify the task assignee (if not the commenter)
  if (task.assignee_id && task.assignee_id !== req.user.id) {
    await notify({
      userId: task.assignee_id,
      actorId: req.user.id,
      type: NOTIFICATION_TYPES.COMMENT_ADDED,
      title: 'New comment on your task',
      message: `${req.user.name} commented on "${task.title}"`,
      link: `/tasks/${taskId}`,
    });
  }

  // Parse @mentions and notify mentioned users by name match
  const mentionedNames = [...content.matchAll(MENTION_REGEX)].map((m) => m[1]);
  if (mentionedNames.length) {
    const [mentionedUsers] = await pool.query(
      `SELECT id FROM users WHERE REPLACE(name, ' ', '') IN (?)`,
      [mentionedNames]
    );
    if (mentionedUsers.length) {
      await notifyMany(mentionedUsers.map((u) => u.id), {
        actorId: req.user.id,
        type: NOTIFICATION_TYPES.MENTION,
        title: 'You were mentioned in a comment',
        message: `${req.user.name} mentioned you on "${task.title}"`,
        link: `/tasks/${taskId}`,
      });
    }
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.COMMENT_ADDED,
    entityType: 'comment',
    entityId: commentId,
    description: `Comment added to task #${taskId}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: newComment });
});

// ---------------------------------------------------------------------
// PUT /api/comments/:id
// ---------------------------------------------------------------------
const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const [existing] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
  if (!existing.length) throw ApiError.notFound('Comment not found');
  if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only edit your own comments');
  }

  await pool.query('UPDATE comments SET content = ?, is_edited = 1 WHERE id = ?', [content, id]);

  if (ioInstance) {
    ioInstance.to(`task:${existing[0].task_id}`).emit('comment:updated', { id: Number(id), content });
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.COMMENT_UPDATED,
    entityType: 'comment',
    entityId: id,
    description: `Comment #${id} edited`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Comment updated successfully' });
});

// ---------------------------------------------------------------------
// DELETE /api/comments/:id
// ---------------------------------------------------------------------
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
  if (!existing.length) throw ApiError.notFound('Comment not found');
  if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  await pool.query('DELETE FROM comments WHERE id = ?', [id]);

  if (ioInstance) {
    ioInstance.to(`task:${existing[0].task_id}`).emit('comment:deleted', { id: Number(id) });
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.COMMENT_DELETED,
    entityType: 'comment',
    entityId: id,
    description: `Comment #${id} deleted`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Comment deleted successfully' });
});

module.exports = { attachIo, listComments, createComment, updateComment, deleteComment };
