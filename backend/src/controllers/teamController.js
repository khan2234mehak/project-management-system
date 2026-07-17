const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { notify, notifyMany } = require('../utils/notificationService');
const { ACTIVITY_ACTIONS, NOTIFICATION_TYPES } = require('../config/constants');

// ---------------------------------------------------------------------
// GET /api/teams
// ---------------------------------------------------------------------
const listTeams = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { search } = req.query;

  const where = [];
  const params = [];
  if (search) { where.push('t.name LIKE ?'); params.push(`%${search}%`); }

  // Non-admins only see teams they belong to or created
  if (req.user.role !== 'admin') {
    where.push('(t.created_by = ? OR t.id IN (SELECT team_id FROM team_members WHERE user_id = ?))');
    params.push(req.user.id, req.user.id);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.description, t.created_by, u.name AS creator_name, t.created_at,
            (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS member_count
     FROM teams t JOIN users u ON u.id = t.created_by
     ${whereClause}
     ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM teams t ${whereClause}`, params
  );

  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------
// GET /api/teams/:id  (with members + performance metrics)
// ---------------------------------------------------------------------
const getTeamById = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const [teams] = await pool.query(
    `SELECT t.*, u.name AS creator_name FROM teams t JOIN users u ON u.id = t.created_by WHERE t.id = ?`,
    [teamId]
  );
  if (!teams.length) throw ApiError.notFound('Team not found');

  const [members] = await pool.query(
    `SELECT tm.id AS membership_id, tm.team_role, tm.joined_at,
            u.id, u.name, u.email, u.avatar_url, u.job_title
     FROM team_members tm JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = ? ORDER BY tm.joined_at ASC`,
    [teamId]
  );

  const [[metrics]] = await pool.query(
    `SELECT
       COUNT(DISTINCT p.id) AS total_projects,
       COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) AS completed_projects,
       COUNT(DISTINCT ta.id) AS total_tasks,
       COUNT(DISTINCT CASE WHEN ta.status = 'done' THEN ta.id END) AS completed_tasks
     FROM teams t
     LEFT JOIN projects p ON p.team_id = t.id
     LEFT JOIN tasks ta ON ta.project_id = p.id
     WHERE t.id = ?`,
    [teamId]
  );

  res.json({ success: true, data: { ...teams[0], members, metrics } });
});

// ---------------------------------------------------------------------
// POST /api/teams
// ---------------------------------------------------------------------
const createTeam = asyncHandler(async (req, res) => {
  const { name, description, memberIds = [] } = req.body;

  const [result] = await pool.query(
    'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)',
    [name, description || null, req.user.id]
  );
  const teamId = result.insertId;

  // Creator is automatically a lead member
  await pool.query(
    'INSERT INTO team_members (team_id, user_id, team_role) VALUES (?, ?, ?)',
    [teamId, req.user.id, 'lead']
  );

  const uniqueMemberIds = [...new Set(memberIds)].filter((id) => id !== req.user.id);
  if (uniqueMemberIds.length) {
    const values = uniqueMemberIds.map((id) => [teamId, id, 'member']);
    await pool.query('INSERT INTO team_members (team_id, user_id, team_role) VALUES ?', [values]);
    await notifyMany(uniqueMemberIds, {
      actorId: req.user.id,
      type: NOTIFICATION_TYPES.TEAM_INVITE,
      title: 'Added to a new team',
      message: `${req.user.name} added you to team "${name}"`,
      link: `/teams/${teamId}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TEAM_CREATED,
    entityType: 'team',
    entityId: teamId,
    description: `Team "${name}" created`,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: { id: teamId, name, description } });
});

// ---------------------------------------------------------------------
// PUT /api/teams/:id
// ---------------------------------------------------------------------
const updateTeam = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const { name, description } = req.body;

  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (!fields.length) throw ApiError.badRequest('No fields provided to update');

  params.push(teamId);
  const [result] = await pool.query(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, params);
  if (!result.affectedRows) throw ApiError.notFound('Team not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TEAM_UPDATED,
    entityType: 'team',
    entityId: teamId,
    description: `Team #${teamId} updated`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Team updated successfully' });
});

// ---------------------------------------------------------------------
// DELETE /api/teams/:id
// ---------------------------------------------------------------------
const deleteTeam = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const [result] = await pool.query('DELETE FROM teams WHERE id = ?', [teamId]);
  if (!result.affectedRows) throw ApiError.notFound('Team not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TEAM_DELETED,
    entityType: 'team',
    entityId: teamId,
    description: `Team #${teamId} deleted`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Team deleted successfully' });
});

// ---------------------------------------------------------------------
// POST /api/teams/:id/members
// ---------------------------------------------------------------------
const addMembers = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const { memberIds = [] } = req.body;
  if (!memberIds.length) throw ApiError.badRequest('memberIds is required');

  const [team] = await pool.query('SELECT name FROM teams WHERE id = ?', [teamId]);
  if (!team.length) throw ApiError.notFound('Team not found');

  for (const userId of memberIds) {
    await pool.query(
      'INSERT OR IGNORE INTO team_members (team_id, user_id, team_role) VALUES (?, ?, ?)',
      [teamId, userId, 'member']
    );
  }

  await notifyMany(memberIds, {
    actorId: req.user.id,
    type: NOTIFICATION_TYPES.TEAM_INVITE,
    title: 'Added to a team',
    message: `${req.user.name} added you to team "${team[0].name}"`,
    link: `/teams/${teamId}`,
  });

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TEAM_MEMBER_ADDED,
    entityType: 'team',
    entityId: teamId,
    description: `${memberIds.length} member(s) added to team #${teamId}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Members added successfully' });
});

// ---------------------------------------------------------------------
// DELETE /api/teams/:id/members/:userId
// ---------------------------------------------------------------------
const removeMember = asyncHandler(async (req, res) => {
  const { id: teamId, userId } = req.params;
  const [result] = await pool.query(
    'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
    [teamId, userId]
  );
  if (!result.affectedRows) throw ApiError.notFound('Membership not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.TEAM_MEMBER_REMOVED,
    entityType: 'team',
    entityId: teamId,
    description: `User #${userId} removed from team #${teamId}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Member removed successfully' });
});

// ---------------------------------------------------------------------
// PATCH /api/teams/:id/members/:userId/role
// ---------------------------------------------------------------------
const changeMemberRole = asyncHandler(async (req, res) => {
  const { id: teamId, userId } = req.params;
  const { teamRole } = req.body; // 'lead' | 'member'
  if (!['lead', 'member'].includes(teamRole)) throw ApiError.badRequest('Invalid team role');

  const [result] = await pool.query(
    'UPDATE team_members SET team_role = ? WHERE team_id = ? AND user_id = ?',
    [teamRole, teamId, userId]
  );
  if (!result.affectedRows) throw ApiError.notFound('Membership not found');

  res.json({ success: true, message: 'Member role updated' });
});

module.exports = {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMembers,
  removeMember,
  changeMemberRole,
};
