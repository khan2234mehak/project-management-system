const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logActivity } = require('../utils/activityLogger');
const { sendMail } = require('../utils/mailer');
const { ROLE_IDS, ACTIVITY_ACTIONS } = require('../config/constants');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  const { password, email_verify_token, reset_token, reset_token_expires, ...safe } = user;
  return safe;
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw ApiError.conflict('An account with this email already exists');

  const roleId = ROLE_IDS.team_member;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Auto-verify email so users can login immediately without SMTP setup
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, role_id, is_email_verified) VALUES (?, ?, ?, ?, 1)`,
    [name, email, hashedPassword, roleId]
  );

  await logActivity({
    userId: result.insertId,
    action: ACTIVITY_ACTIONS.USER_REGISTERED,
    entityType: 'user',
    entityId: result.insertId,
    description: `${name} registered`,
    ipAddress: req.ip,
  });

  // Try to send welcome email but don't block registration if no SMTP
  try {
    await sendMail({
      to: email,
      subject: 'Welcome to Pulseboard!',
      text: `Hi ${name}, your account is ready. Login at ${process.env.CLIENT_URL || 'http://localhost:5173'}`,
    });
  } catch (e) {
    // ignore mail errors
  }

  res.status(201).json({
    success: true,
    message: 'Account created successfully! You can now log in.',
  });
});

// GET /api/auth/verify-email?token=...
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw ApiError.badRequest('Verification token is required');
  const [rows] = await pool.query('SELECT id FROM users WHERE email_verify_token = ?', [token]);
  if (!rows.length) throw ApiError.badRequest('Invalid or expired verification token');
  await pool.query('UPDATE users SET is_email_verified = 1, email_verify_token = NULL WHERE id = ?', [rows[0].id]);
  res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    `SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [email]
  );
  if (!rows.length) throw ApiError.unauthorized('Invalid email or password');
  const user = rows[0];

  if (user.is_blocked) throw ApiError.forbidden('Your account has been blocked. Contact an administrator.');

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    await pool.query(`INSERT INTO login_history (user_id, ip_address, was_successful) VALUES (?, ?, 0)`, [user.id, req.ip]);
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokenPayload = { id: user.id, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  const [loginRecord] = await pool.query(
    `INSERT INTO login_history (user_id, ip_address, device_info, browser_info, was_successful) VALUES (?, ?, ?, ?, 1)`,
    [user.id, req.ip, req.headers['sec-ch-ua-platform'] || null, req.headers['user-agent'] || null]
  );

  await pool.query("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [user.id]);
  await logActivity({
    userId: user.id, action: ACTIVITY_ACTIONS.USER_LOGIN, entityType: 'user',
    entityId: user.id, description: `${user.name} logged in`, ipAddress: req.ip,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: { user: sanitizeUser(user), accessToken, loginHistoryId: loginRecord.insertId } });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { loginHistoryId } = req.body;
  if (loginHistoryId) {
    await pool.query(
      `UPDATE login_history SET logout_at = datetime('now'),
       session_duration_seconds = (strftime('%s', 'now') - strftime('%s', login_at))
       WHERE id = ? AND user_id = ?`,
      [loginHistoryId, req.user.id]
    );
  }
  await logActivity({
    userId: req.user.id, action: ACTIVITY_ACTIONS.USER_LOGOUT, entityType: 'user',
    entityId: req.user.id, description: `${req.user.name} logged out`, ipAddress: req.ip,
  });
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');
  let decoded;
  try { decoded = verifyRefreshToken(token); } catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }
  const [rows] = await pool.query(
    `SELECT u.id, r.name as role, u.is_blocked FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [decoded.id]
  );
  if (!rows.length || rows[0].is_blocked) throw ApiError.unauthorized('Account unavailable');
  const accessToken = signAccessToken({ id: rows[0].id, role: rows[0].role });
  res.json({ success: true, data: { accessToken } });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const [rows] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
  const genericMessage = 'If an account exists for that email, a reset link has been sent.';
  if (!rows.length) return res.json({ success: true, message: genericMessage });
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, expires, rows[0].id]);
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  await sendMail({ to: email, subject: 'Reset your password', text: `Hi ${rows[0].name}, reset your password here: ${resetUrl}` });
  res.json({ success: true, message: genericMessage });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')", [token]
  );
  if (!rows.length) throw ApiError.badRequest('Invalid or expired reset token');
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, rows[0].id]);
  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = { register, verifyEmail, login, logout, refresh, forgotPassword, resetPassword, getMe };
