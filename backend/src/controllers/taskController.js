const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../utils/notificationService');
const { ACTIVITY_ACTIONS, NOTIFICATION_TYPES, TASK_STATUS, TASK_PRIORITY } = require('../config/constants');
const { recomputeProjectProgress } = require('./projectController');

let ioInstance = null;
function attachIo(io) { ioInstance = io; }

function emitBoardUpdate(projectId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit(event, payload);
  }
}

// ---------------------------------------------------------------------
// GET /api/projects/:projectId/tasks  — Kanban board data (grouped by status)
// ---------------------------------------------------------------------
const getBoardForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { assignee, priority, search } = req.query;

  const where = ['t.project_id = ?'];
  const params = [projectId];
  if (assignee) { where.push('t.assignee_id = ?'); params.push(assignee); }
  if (priority) { where.push('t.priority = ?'); params.push(priority); }
  if (search) { where.push('t.title LIKE ?'); params.push(`%${search}%`); }

  const [tasks] = await pool.query(
    `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.position,
            t.assignee_id, u.name AS assignee_name, u.avatar_url AS assignee_avatar,
            t.created_by, t.created_at,
            (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) AS subtask_count,
            (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.is_completed = 1) AS subtask_done,
            (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count,
            (SELECT COUNT(*) FROM attachments a WHERE a.task_id = t.id) AS attachment_count
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE ${where.join(' AND ')}
     ORDER BY t.position ASC, t.created_at ASC`,
    params
  );

  const board = TASK_STATUS.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  res.json({ success: true, data: board });
});

// ---------------------------------------------------------------------
// GET /api/tasks/:id
// ---------------------------------------------------------------------
const getTaskById = asyncHandler(async (req, res) => {
  const [tasks] = await pool.query(
    `SELECT t.*, u.name AS assignee_name, u.avatar_url AS assignee_avatar,
            c.name AS creator_name, p.name AS project_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     JOIN users c ON c.id = t.created_by
     JOIN projects p ON p.id = t.project_id
     WHERE t.id = ?`,
    [req.params.id]
  );
  if (!tasks.length) throw ApiError.notFound('Task not found');

  const [subtasks] = await pool.query(
    'SELECT id, title, is_completed, created_at FROM subtasks WHERE task_id = ? ORDER BY created_at ASC',
    [req.params.id]
  );

  res.json({ success: true, data: { ...tasks[0], subtasks } });
});

// ---------------------------------------------------------------------
// POST /api/projects/:projectId/tasks
// ---------------------------------------------------------------------
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, priority = 'medium', assigneeId, dueDate, status = 'backlog' } = req.body;

  if (!TASK_PRIORITY.includes(priority)) throw ApiError.badRequest('Invalid priority');
  if (!TASK_STATUS.includes(status)) throw ApiError.badRequest('Invalid status');

  const [[{ maxPos }]] = await pool.query(
    'SELECT COALESCE(MAX(position), -1) AS maxPos FROM tasks WHERE project_id = ? AND status = ?',
    [projectId, status]
  );

  const [result] = await pool.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, title, description || null, status, priority, assigneeId || null, req.user.id, dueDate || null, maxPos + 1]
  );
  const taskId = result.insertId;

  if (assigneeId) {
    await notify({
      userId: assigneeId,
      actorId: req.user.id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New task assigned to you',
      message: `${req.user.name} assigned you "${title}"`,
      link: `/tasks/${taskId}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TASK_CREATED,
    entityType: 'task',
    entityId: taskId,
    description: `Task "${title}" created in project #${projectId}`,
    ipAddress: req.ip,
  });

  emitBoardUpdate(projectId, 'board:task_created', { taskId, status });

  res.status(201).json({ success: true, data: { id: taskId, title, status } });
});

// ---------------------------------------------------------------------
// PUT /api/tasks/:id
// ---------------------------------------------------------------------
const updateTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { title, description, priority, assigneeId, dueDate } = req.body;

  const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
  if (!existing.length) throw ApiError.notFound('Task not found');
  const task = existing[0];

  if (priority && !TASK_PRIORITY.includes(priority)) throw ApiError.badRequest('Invalid priority');

  const fields = [];
  const params = [];
  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
  if (assigneeId !== undefined) { fields.push('assignee_id = ?'); params.push(assigneeId); }
  if (dueDate !== undefined) { fields.push('due_date = ?'); params.push(dueDate); }

  if (!fields.length) throw ApiError.badRequest('No fields provided to update');

  params.push(taskId);
  await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);

  if (assigneeId !== undefined && assigneeId !== task.assignee_id && assigneeId) {
    await notify({
      userId: assigneeId,
      actorId: req.user.id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'Task assigned to you',
      message: `${req.user.name} assigned you "${title || task.title}"`,
      link: `/tasks/${taskId}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TASK_UPDATED,
    entityType: 'task',
    entityId: taskId,
    description: `Task #${taskId} updated`,
    metadata: req.body,
    ipAddress: req.ip,
  });

  emitBoardUpdate(task.project_id, 'board:task_updated', { taskId });

  res.json({ success: true, message: 'Task updated successfully' });
});

// ---------------------------------------------------------------------
// PATCH /api/tasks/:id/move  — Kanban drag-and-drop: change status/position
// ---------------------------------------------------------------------
const moveTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { status, position } = req.body;

  if (!TASK_STATUS.includes(status)) throw ApiError.badRequest('Invalid status');
  if (typeof position !== 'number' || position < 0) throw ApiError.badRequest('Invalid position');

  const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
  if (!existing.length) throw ApiError.notFound('Task not found');
  const task = existing[0];
  const statusChanged = task.status !== status;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Close the gap in the old column
    await conn.query(
      'UPDATE tasks SET position = position - 1 WHERE project_id = ? AND status = ? AND position > ?',
      [task.project_id, task.status, task.position]
    );

    // Open a gap in the new column at the target position
    await conn.query(
      'UPDATE tasks SET position = position + 1 WHERE project_id = ? AND status = ? AND position >= ?',
      [task.project_id, status, position]
    );

    await conn.query('UPDATE tasks SET status = ?, position = ? WHERE id = ?', [status, position, taskId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  if (statusChanged) {
    await logActivity({
      userId: req.user.id,
      action: ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,
      entityType: 'task',
      entityId: taskId,
      description: `Task "${task.title}" moved from ${task.status} to ${status}`,
      ipAddress: req.ip,
    });

    if (task.assignee_id && task.assignee_id !== req.user.id) {
      await notify({
        userId: task.assignee_id,
        actorId: req.user.id,
        type: NOTIFICATION_TYPES.STATUS_CHANGED,
        title: 'Task status changed',
        message: `"${task.title}" moved to ${status.replace('_', ' ')}`,
        link: `/tasks/${taskId}`,
      });
    }

    await recomputeProjectProgress(task.project_id);
  }

  emitBoardUpdate(task.project_id, 'board:task_moved', { taskId, status, position });

  res.json({ success: true, message: 'Task moved successfully' });
});

// ---------------------------------------------------------------------
// DELETE /api/tasks/:id
// ---------------------------------------------------------------------
const deleteTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const [existing] = await pool.query('SELECT project_id, title FROM tasks WHERE id = ?', [taskId]);
  if (!existing.length) throw ApiError.notFound('Task not found');

  await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TASK_DELETED,
    entityType: 'task',
    entityId: taskId,
    description: `Task "${existing[0].title}" deleted`,
    ipAddress: req.ip,
  });

  await recomputeProjectProgress(existing[0].project_id);
  emitBoardUpdate(existing[0].project_id, 'board:task_deleted', { taskId });

  res.json({ success: true, message: 'Task deleted successfully' });
});

// ---------------------------------------------------------------------
// GET /api/tasks  — global search/filter across all accessible tasks
// ---------------------------------------------------------------------
const searchTasks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { search, status, priority, assignee, projectId, sort = 'newest' } = req.query;

  const where = [];
  const params = [];
  if (search) { where.push('t.title LIKE ?'); params.push(`%${search}%`); }
  if (status) { where.push('t.status = ?'); params.push(status); }
  if (priority) { where.push('t.priority = ?'); params.push(priority); }
  if (assignee) { where.push('t.assignee_id = ?'); params.push(assignee); }
  if (projectId) { where.push('t.project_id = ?'); params.push(projectId); }

  if (req.user.role === 'team_member') {
    where.push('(t.assignee_id = ? OR t.created_by = ?)');
    params.push(req.user.id, req.user.id);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortMap = {
    newest: 't.created_at DESC',
    oldest: 't.created_at ASC',
    priority: `CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
    due_date: 't.due_date ASC',
  };

  const [rows] = await pool.query(
    `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.assignee_id, u.name AS assignee_name,
            t.project_id, p.name AS project_name, t.created_at
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     JOIN projects p ON p.id = t.project_id
     ${whereClause}
     ORDER BY ${sortMap[sort] || sortMap.newest}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM tasks t ${whereClause}`, params);

  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

module.exports = {
  attachIo,
  getBoardForProject,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  searchTasks,
};
