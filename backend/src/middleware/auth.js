const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const { pool } = require('../config/db');

/**
 * Verifies the JWT from the Authorization header, loads a fresh copy of
 * the user from the DB (so blocked/role-changed users are caught
 * immediately rather than waiting for token expiry), and attaches it
 * to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.job_title, u.is_blocked,
              u.is_email_verified, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!rows.length) {
      throw ApiError.unauthorized('User no longer exists');
    }
    const user = rows[0];
    if (user.is_blocked) {
      throw ApiError.forbidden('Your account has been blocked. Contact an administrator.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restricts a route to a fixed set of roles.
 * Usage: authorize('admin', 'project_manager')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };
