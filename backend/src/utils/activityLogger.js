const { pool } = require('../config/db');

/**
 * Record an entry in activity_logs. Fire-and-forget by design (callers
 * await it for ordering, but a logging failure should never block the
 * primary request) — errors are swallowed and logged to console only.
 */
async function logActivity({ userId, action, entityType = null, entityId = null, description = null, metadata = null, ipAddress = null }) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, description, metadata ? JSON.stringify(metadata) : null, ipAddress]
    );
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity };
