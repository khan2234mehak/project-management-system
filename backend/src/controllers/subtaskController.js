const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { ACTIVITY_ACTIONS } = require('../config/constants');

// POST /api/tasks/:taskId/subtasks
const createSubtask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  const [task] = await pool.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
  if (!task.length) throw ApiError.notFound('Parent task not found');

  const [result] = await pool.query(
    'INSERT INTO subtasks (task_id, title, created_by) VALUES (?, ?, ?)',
    [taskId, title, req.user.id]
  );

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.SUBTASK_CREATED,
    entityType: 'subtask',
    entityId: result.insertId,
    description: `Subtask "${title}" added to task #${taskId}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { id: result.insertId, title, is_completed: 0 } });
});

// PUT /api/subtasks/:id
const updateSubtask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, isCompleted } = req.body;

  const fields = [];
  const params = [];
  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (isCompleted !== undefined) { fields.push('is_completed = ?'); params.push(isCompleted ? 1 : 0); }
  if (!fields.length) throw ApiError.badRequest('No fields provided to update');

  params.push(id);
  const [result] = await pool.query(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`, params);
  if (!result.affectedRows) throw ApiError.notFound('Subtask not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.SUBTASK_UPDATED,
    entityType: 'subtask',
    entityId: id,
    description: `Subtask #${id} updated`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Subtask updated successfully' });
});

// DELETE /api/subtasks/:id
const deleteSubtask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query('DELETE FROM subtasks WHERE id = ?', [id]);
  if (!result.affectedRows) throw ApiError.notFound('Subtask not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.SUBTASK_DELETED,
    entityType: 'subtask',
    entityId: id,
    description: `Subtask #${id} deleted`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Subtask deleted successfully' });
});

module.exports = { createSubtask, updateSubtask, deleteSubtask };
