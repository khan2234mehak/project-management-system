const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { saveFile, deleteFile } = require('../utils/storage');
const { ACTIVITY_ACTIONS, ROLE_IDS } = require('../config/constants');

const SAFE_USER_FIELDS = `id, name, email, role_id, avatar_url, job_title, is_email_verified, is_blocked, last_login_at, created_at`;

// ---------------------------------------------------------------------
// GET /api/users  (admin, project_manager) — list, search, paginate, filter by role/status
// ---------------------------------------------------------------------
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { search, role, status } = req.query;

  const where = [];
  const params = [];

  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    where.push('r.name = ?');
    params.push(role);
  }
  if (status === 'blocked') where.push('u.is_blocked = 1');
  if (status === 'active') where.push('u.is_blocked = 0');

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role, u.avatar_url, u.job_title,
            u.is_email_verified, u.is_blocked, u.last_login_at, u.created_at
     FROM users u JOIN roles r ON r.id = u.role_id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id ${whereClause}`,
    params
  );

  res.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// ---------------------------------------------------------------------
// GET /api/users/:id
// ---------------------------------------------------------------------
const getUserById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role, u.avatar_url, u.job_title,
            u.is_email_verified, u.is_blocked, u.last_login_at, u.created_at
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [req.params.id]
  );
  if (!rows.length) throw ApiError.notFound('User not found');
  res.json({ success: true, data: rows[0] });
});

// ---------------------------------------------------------------------
// PUT /api/users/:id  — edit profile (self or admin)
// ---------------------------------------------------------------------
const updateUser = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const isSelf = req.user.id === targetId;
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    throw ApiError.forbidden('You can only edit your own profile');
  }

  const { name, jobTitle } = req.body;
  const fields = [];
  const params = [];

  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (jobTitle !== undefined) { fields.push('job_title = ?'); params.push(jobTitle); }

  if (!fields.length) throw ApiError.badRequest('No fields provided to update');

  params.push(targetId);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.USER_PROFILE_UPDATED,
    entityType: 'user',
    entityId: targetId,
    description: `Profile updated for user #${targetId}`,
    ipAddress: req.ip,
  });

  const [rows] = await pool.query(`SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`, [targetId]);
  res.json({ success: true, data: rows[0] });
});

// ---------------------------------------------------------------------
// POST /api/users/:id/avatar
// ---------------------------------------------------------------------
const uploadAvatar = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id !== targetId && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only update your own avatar');
  }
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const { url } = await saveFile(req.file.path, { folder: 'avatars' });
  await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [url, targetId]);

  res.json({ success: true, data: { avatarUrl: url } });
});

// ---------------------------------------------------------------------
// DELETE /api/users/:id  (admin)
// ---------------------------------------------------------------------
const deleteUser = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id === targetId) throw ApiError.badRequest('You cannot delete your own account');

  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [targetId]);
  if (!result.affectedRows) throw ApiError.notFound('User not found');

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.USER_DELETED,
    entityType: 'user',
    entityId: targetId,
    description: `Admin ${req.user.name} deleted user #${targetId}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

// ---------------------------------------------------------------------
// PATCH /api/users/:id/block  (admin)
// ---------------------------------------------------------------------
const setBlockedStatus = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { blocked } = req.body;
  if (req.user.id === targetId) throw ApiError.badRequest('You cannot block your own account');

  await pool.query('UPDATE users SET is_blocked = ? WHERE id = ?', [blocked ? 1 : 0, targetId]);

  await logActivity({
    userId: req.user.id,
    action: blocked ? ACTIVITY_ACTIONS.USER_BLOCKED : ACTIVITY_ACTIONS.USER_UNBLOCKED,
    entityType: 'user',
    entityId: targetId,
    description: `Admin ${req.user.name} ${blocked ? 'blocked' : 'unblocked'} user #${targetId}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: `User ${blocked ? 'blocked' : 'unblocked'} successfully` });
});

// ---------------------------------------------------------------------
// PATCH /api/users/:id/role  (admin)
// ---------------------------------------------------------------------
const changeRole = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { role } = req.body;
  const roleId = ROLE_IDS[role];
  if (!roleId) throw ApiError.badRequest('Invalid role');

  await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, targetId]);

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.USER_ROLE_CHANGED,
    entityType: 'user',
    entityId: targetId,
    description: `Admin ${req.user.name} changed role of user #${targetId} to ${role}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Role updated successfully' });
});

// ---------------------------------------------------------------------
// GET /api/users/:id/login-history
// ---------------------------------------------------------------------
const getLoginHistory = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id !== targetId && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own login history');
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT id, login_at, logout_at, session_duration_seconds, ip_address, device_info, browser_info, was_successful
     FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT ? OFFSET ?`,
    [targetId, limit, offset]
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM login_history WHERE user_id = ?', [targetId]);

  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------
// GET /api/users/:id/activity
// ---------------------------------------------------------------------
const getUserActivity = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id !== targetId && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own activity');
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT id, action, entity_type, entity_id, description, created_at
     FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [targetId, limit, offset]
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM activity_logs WHERE user_id = ?', [targetId]);

  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  uploadAvatar,
  deleteUser,
  setBlockedStatus,
  changeRole,
  getLoginHistory,
  getUserActivity,
};
