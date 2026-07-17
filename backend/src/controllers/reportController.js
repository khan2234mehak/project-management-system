const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ---------------------------------------------------------------------
// Shared data fetchers per report type
// ---------------------------------------------------------------------
async function fetchReportData(type) {
  switch (type) {
    case 'project-progress': {
      const [rows] = await pool.query(
        `SELECT p.name, p.status, p.progress, p.start_date, p.end_date, u.name AS manager
         FROM projects p JOIN users u ON u.id = p.manager_id ORDER BY p.created_at DESC`
      );
      return {
        title: 'Project Progress Report',
        columns: ['Name', 'Status', 'Progress %', 'Start Date', 'End Date', 'Manager'],
        rows: rows.map((r) => [r.name, r.status, r.progress, r.start_date, r.end_date, r.manager]),
      };
    }
    case 'team-productivity': {
      const [rows] = await pool.query(
        `SELECT t.name AS team, COUNT(DISTINCT p.id) AS projects, COUNT(ta.id) AS total_tasks,
                SUM(CASE WHEN ta.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks
         FROM teams t
         LEFT JOIN projects p ON p.team_id = t.id
         LEFT JOIN tasks ta ON ta.project_id = p.id
         GROUP BY t.id`
      );
      return {
        title: 'Team Productivity Report',
        columns: ['Team', 'Projects', 'Total Tasks', 'Completed Tasks'],
        rows: rows.map((r) => [r.team, r.projects, r.total_tasks, r.completed_tasks]),
      };
    }
    case 'user-performance': {
      const [rows] = await pool.query(
        `SELECT u.name, COUNT(t.id) AS assigned_tasks,
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks
         FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id
         GROUP BY u.id`
      );
      return {
        title: 'User Performance Report',
        columns: ['User', 'Assigned Tasks', 'Completed Tasks'],
        rows: rows.map((r) => [r.name, r.assigned_tasks, r.completed_tasks]),
      };
    }
    case 'task-completion': {
      const [rows] = await pool.query(
        `SELECT t.title, t.status, t.priority, p.name AS project, u.name AS assignee, t.due_date
         FROM tasks t JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.assignee_id ORDER BY t.created_at DESC LIMIT 500`
      );
      return {
        title: 'Task Completion Report',
        columns: ['Title', 'Status', 'Priority', 'Project', 'Assignee', 'Due Date'],
        rows: rows.map((r) => [r.title, r.status, r.priority, r.project, r.assignee, r.due_date]),
      };
    }
    case 'login-activity': {
      const [rows] = await pool.query(
        `SELECT u.name, lh.login_at, lh.logout_at, lh.session_duration_seconds, lh.ip_address
         FROM login_history lh JOIN users u ON u.id = lh.user_id
         ORDER BY lh.login_at DESC LIMIT 500`
      );
      return {
        title: 'Login Activity Report',
        columns: ['User', 'Login At', 'Logout At', 'Duration (s)', 'IP Address'],
        rows: rows.map((r) => [r.name, r.login_at, r.logout_at, r.session_duration_seconds, r.ip_address]),
      };
    }
    default:
      return null;
  }
}

const VALID_TYPES = ['project-progress', 'team-productivity', 'user-performance', 'task-completion', 'login-activity'];

// ---------------------------------------------------------------------
// GET /api/reports/:type/excel
// ---------------------------------------------------------------------
const exportExcel = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) throw ApiError.badRequest('Unknown report type');

  const report = await fetchReportData(type);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(report.title.slice(0, 30));

  sheet.addRow(report.columns).font = { bold: true };
  report.rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((col) => { col.width = 22; });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

// ---------------------------------------------------------------------
// GET /api/reports/:type/pdf
// ---------------------------------------------------------------------
const exportPdf = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) throw ApiError.badRequest('Unknown report type');

  const report = await fetchReportData(type);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(18).text(report.title, { align: 'center' });
  doc.moveDown();

  const colWidth = (doc.page.width - 80) / report.columns.length;
  let y = doc.y;

  doc.fontSize(10).font('Helvetica-Bold');
  report.columns.forEach((col, i) => {
    doc.text(String(col), 40 + i * colWidth, y, { width: colWidth });
  });
  doc.moveDown();
  y = doc.y;
  doc.font('Helvetica');

  report.rows.forEach((row) => {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
    }
    row.forEach((cell, i) => {
      doc.text(cell !== null && cell !== undefined ? String(cell) : '-', 40 + i * colWidth, y, { width: colWidth });
    });
    y += 20;
  });

  doc.end();
});

module.exports = { exportExcel, exportPdf, VALID_TYPES };
