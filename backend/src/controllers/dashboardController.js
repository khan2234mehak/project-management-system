const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// ---------------------------------------------------------------------
// GET /api/dashboard/summary  — top cards + recent activity
// Scoped: admins/PMs see org-wide; team members see their own scope.
// ---------------------------------------------------------------------
const getSummary = asyncHandler(async (req, res) => {
  const isPrivileged = ['admin', 'project_manager'].includes(req.user.role);
  const userScope = isPrivileged ? null : req.user.id;

  const projectScopeClause = userScope
    ? `WHERE p.id IN (SELECT DISTINCT pr.id FROM projects pr
        LEFT JOIN team_members tm ON tm.team_id = pr.team_id
        WHERE tm.user_id = ? OR pr.manager_id = ?)`
    : '';
  const projectParams = userScope ? [userScope, userScope] : [];

  const [[projectCounts]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status IN ('planning','in_progress','testing') THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM projects p ${projectScopeClause}`,
    projectParams
  );

  const taskScopeClause = userScope
    ? 'WHERE t.assignee_id = ? OR t.created_by = ?'
    : '';
  const taskParams = userScope ? [userScope, userScope] : [];

  const [[taskCounts]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status != 'done' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN due_date < date('now') AND status != 'done' THEN 1 ELSE 0 END) AS overdue
     FROM tasks t ${taskScopeClause}`,
    taskParams
  );

  const [[{ teamMembers }]] = await pool.query(
    isPrivileged
      ? `SELECT COUNT(DISTINCT id) AS teamMembers FROM users`
      : `SELECT COUNT(DISTINCT tm2.user_id) AS teamMembers
         FROM team_members tm1
         JOIN team_members tm2 ON tm2.team_id = tm1.team_id
         WHERE tm1.user_id = ?`,
    isPrivileged ? [] : [req.user.id]
  );

  const [recentActivity] = await pool.query(
    `SELECT al.id, al.action, al.description, al.created_at, u.name AS user_name
     FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
     ${userScope ? 'WHERE al.user_id = ?' : ''}
     ORDER BY al.created_at DESC LIMIT 10`,
    userScope ? [userScope] : []
  );

  res.json({
    success: true,
    data: {
      projects: {
        total: projectCounts.total || 0,
        active: projectCounts.active || 0,
        completed: projectCounts.completed || 0,
      },
      tasks: {
        total: taskCounts.total || 0,
        completed: taskCounts.completed || 0,
        pending: taskCounts.pending || 0,
        overdue: taskCounts.overdue || 0,
      },
      teamMembers: teamMembers || 0,
      recentActivity,
    },
  });
});

// ---------------------------------------------------------------------
// GET /api/dashboard/charts  — data for Recharts on the frontend
// ---------------------------------------------------------------------
const getCharts = asyncHandler(async (req, res) => {
  // Project progress by status
  const [projectProgress] = await pool.query(
    `SELECT status, COUNT(*) AS count FROM projects GROUP BY status`
  );

  // Task completion rate over last 6 months
  const [monthlyCompletion] = await pool.query(
    `SELECT strftime('%Y-%m', updated_at) AS month,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed,
            COUNT(*) AS total
     FROM tasks
     WHERE updated_at >= date('now', '-6 months')
     GROUP BY month ORDER BY month ASC`
  );

  // Team productivity: tasks completed per team in last 30 days
  const [teamProductivity] = await pool.query(
    `SELECT t.name AS team_name, COUNT(ta.id) AS completed_tasks
     FROM teams t
     JOIN projects p ON p.team_id = t.id
     JOIN tasks ta ON ta.project_id = p.id AND ta.status = 'done'
       AND ta.updated_at >= date('now', '-30 days')
     GROUP BY t.id ORDER BY completed_tasks DESC LIMIT 10`
  );

  // Active users per day for last 14 days (based on login_history)
  const [activeUsers] = await pool.query(
    `SELECT date(login_at) AS day, COUNT(DISTINCT user_id) AS active_users
     FROM login_history
     WHERE login_at >= date('now', '-14 days') AND was_successful = 1
     GROUP BY day ORDER BY day ASC`
  );

  // Task distribution by priority
  const [priorityDistribution] = await pool.query(
    `SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority`
  );

  res.json({
    success: true,
    data: { projectProgress, monthlyCompletion, teamProductivity, activeUsers, priorityDistribution },
  });
});

// ---------------------------------------------------------------------
// GET /api/dashboard/login-monitoring  (admin)
// ---------------------------------------------------------------------
const getLoginMonitoring = asyncHandler(async (req, res) => {
  const [[totals]] = await pool.query(`SELECT COUNT(*) AS totalUsers FROM users`);
  const [[active]] = await pool.query(`SELECT COUNT(*) AS activeUsers FROM users WHERE is_blocked = 0`);

  // "Online" approximated as logged in within the last 15 minutes with no logout recorded
  const [[online]] = await pool.query(
    `SELECT COUNT(DISTINCT user_id) AS onlineUsers FROM login_history
     WHERE logout_at IS NULL AND login_at >= datetime('now', '-15 minutes')`
  );

  const [lastLogins] = await pool.query(
    `SELECT u.id, u.name, u.email, u.last_login_at
     FROM users u ORDER BY u.last_login_at DESC LIMIT 20`
  );

  const [dailyStats] = await pool.query(
    `SELECT date(login_at) AS day, COUNT(*) AS logins, COUNT(DISTINCT user_id) AS unique_users
     FROM login_history WHERE login_at >= date('now', '-7 days') AND was_successful = 1
     GROUP BY day ORDER BY day ASC`
  );

  const [weeklyStats] = await pool.query(
    `SELECT strftime('%Y-%W', login_at) AS week, COUNT(*) AS logins, COUNT(DISTINCT user_id) AS unique_users
     FROM login_history WHERE login_at >= date('now', '-8 weeks') AND was_successful = 1
     GROUP BY week ORDER BY week ASC`
  );

  const [monthlyStats] = await pool.query(
    `SELECT strftime('%Y-%m', login_at) AS month, COUNT(*) AS logins, COUNT(DISTINCT user_id) AS unique_users
     FROM login_history WHERE login_at >= date('now', '-12 months') AND was_successful = 1
     GROUP BY month ORDER BY month ASC`
  );

  res.json({
    success: true,
    data: {
      totalUsers: totals.totalUsers,
      activeUsers: active.activeUsers,
      onlineUsers: online.onlineUsers,
      lastLogins,
      dailyStats,
      weeklyStats,
      monthlyStats,
    },
  });
});

// ---------------------------------------------------------------------
// GET /api/dashboard/calendar  — deadlines for calendar view
// ---------------------------------------------------------------------
const getCalendarEvents = asyncHandler(async (req, res) => {
  const { start, end } = req.query; // ISO date strings

  const isPrivileged = ['admin', 'project_manager'].includes(req.user.role);
  const scopeClause = isPrivileged ? '' : 'AND (t.assignee_id = ? OR t.created_by = ?)';
  const scopeParams = isPrivileged ? [] : [req.user.id, req.user.id];

  const [taskDeadlines] = await pool.query(
    `SELECT t.id, t.title, t.due_date AS date, 'task' AS type, t.priority, p.name AS project_name
     FROM tasks t JOIN projects p ON p.id = t.project_id
     WHERE t.due_date BETWEEN ? AND ? ${scopeClause}`,
    [start, end, ...scopeParams]
  );

  const [projectDeadlines] = await pool.query(
    `SELECT p.id, p.name AS title, p.end_date AS date, 'project' AS type, p.status
     FROM projects p WHERE p.end_date BETWEEN ? AND ?`,
    [start, end]
  );

  res.json({ success: true, data: { tasks: taskDeadlines, projects: projectDeadlines } });
});

module.exports = { getSummary, getCharts, getLoginMonitoring, getCalendarEvents };
