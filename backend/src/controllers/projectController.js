const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { notifyMany } = require('../utils/notificationService');
const { ACTIVITY_ACTIONS, NOTIFICATION_TYPES, PROJECT_STATUS } = require('../config/constants');

// ---------------------------------------------------------------------
// GET /api/projects  — list with search/filter/sort/paginate
// ---------------------------------------------------------------------
const listProjects = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { search, status, teamId, sort = 'newest' } = req.query;

  const where = [];
  const params = [];

  if (search) { where.push('p.name LIKE ?'); params.push(`%${search}%`); }
  if (status) { where.push('p.status = ?'); params.push(status); }
  if (teamId) { where.push('p.team_id = ?'); params.push(teamId); }

  // Team members only see projects belonging to teams they're on or that they manage
  if (req.user.role === 'team_member') {
    where.push(`p.id IN (
      SELECT DISTINCT pr.id FROM projects pr
      LEFT JOIN team_members tm ON tm.team_id = pr.team_id
      WHERE tm.user_id = ? OR pr.manager_id = ?
    )`);
    params.push(req.user.id, req.user.id);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    newest: 'p.created_at DESC',
    oldest: 'p.created_at ASC',
    due_date: 'p.end_date ASC',
    name: 'p.name ASC',
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.progress,
            p.team_id, t.name AS team_name, p.manager_id, u.name AS manager_name,
            p.created_at,
            (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id) AS task_count
     FROM projects p
     LEFT JOIN teams t ON t.id = p.team_id
     JOIN users u ON u.id = p.manager_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM projects p ${whereClause}`,
    params
  );

  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------
// GET /api/projects/:id
// ---------------------------------------------------------------------
const getProjectById = asyncHandler(async (req, res) => {
  const [projects] = await pool.query(
    `SELECT p.*, t.name AS team_name, u.name AS manager_name
     FROM projects p
     LEFT JOIN teams t ON t.id = p.team_id
     JOIN users u ON u.id = p.manager_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!projects.length) throw ApiError.notFound('Project not found');

  const [taskStats] = await pool.query(
    `SELECT status, COUNT(*) AS count FROM tasks WHERE project_id = ? GROUP BY status`,
    [req.params.id]
  );

  res.json({ success: true, data: { ...projects[0], taskStats } });
});

// ---------------------------------------------------------------------
// POST /api/projects
// ---------------------------------------------------------------------
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status = 'planning', teamId, startDate, endDate } = req.body;

  if (status && !PROJECT_STATUS.includes(status)) throw ApiError.badRequest('Invalid status');

  const [result] = await pool.query(
    `INSERT INTO projects (name, description, status, team_id, manager_id, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description || null, status, teamId || null, req.user.id, startDate || null, endDate || null]
  );
  const projectId = result.insertId;

  if (teamId) {
    const [members] = await pool.query('SELECT user_id FROM team_members WHERE team_id = ?', [teamId]);
    await notifyMany(members.map((m) => m.user_id), {
      actorId: req.user.id,
      type: NOTIFICATION_TYPES.PROJECT_UPDATED,
      title: 'New project assigned to your team',
      message: `${req.user.name} created project "${name}"`,
      link: `/projects/${projectId}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.PROJECT_CREATED,
    entityType: 'project',
    entityId: projectId,
    description: `Project "${name}" created`,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { id: projectId, name, status } });
});

// ---------------------------------------------------------------------
// PUT /api/projects/:id
// ---------------------------------------------------------------------
const updateProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const { name, description, status, teamId, startDate, endDate } = req.body;

  if (status && !PROJECT_STATUS.includes(status)) throw ApiError.badRequest('Invalid status');

  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (teamId !== undefined) { fields.push('team_id = ?'); params.push(teamId || null); }
  if (startDate !== undefined) { fields.push('start_date = ?'); params.push(startDate || null); }
  if (endDate !== undefined) { fields.push('end_date = ?'); params.push(endDate || null); }

  if (!fields.length) throw ApiError.badRequest('No fields provided to update');

  params.push(projectId);
  const [result] = await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
  if (!result.affectedRows) throw ApiError.notFound('Project not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.PROJECT_UPDATED,
    entityType: 'project',
    entityId: projectId,
    description: `Project #${projectId} updated`,
    metadata: req.body,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Project updated successfully' });
});

// ---------------------------------------------------------------------
// DELETE /api/projects/:id
// ---------------------------------------------------------------------
const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);
  if (!result.affectedRows) throw ApiError.notFound('Project not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.PROJECT_DELETED,
    entityType: 'project',
    entityId: projectId,
    description: `Project #${projectId} deleted`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Project deleted successfully' });
});

/**
 * Recomputes and persists a project's progress percentage based on
 * its tasks' completion status. Exported so taskController can call
 * it whenever a task's status changes.
 */
async function recomputeProjectProgress(projectId) {
  const [[stats]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
     FROM tasks WHERE project_id = ?`,
    [projectId]
  );
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  await pool.query('UPDATE projects SET progress = ? WHERE id = ?', [progress, projectId]);
  return progress;
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  recomputeProjectProgress,
};
