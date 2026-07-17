const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');
const { saveFile, deleteFile, PROVIDER } = require('../utils/storage');
const { ACTIVITY_ACTIONS } = require('../config/constants');

// ---------------------------------------------------------------------
// POST /api/tasks/:taskId/attachments
// ---------------------------------------------------------------------
const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const [task] = await pool.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
  if (!task.length) throw ApiError.notFound('Task not found');

  const { url, publicId } = await saveFile(req.file.path, {
    folder: 'attachments',
    originalName: req.file.originalname,
  });

  const [result] = await pool.query(
    `INSERT INTO attachments (task_id, uploaded_by, file_name, file_url, file_type, file_size, storage_provider)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [taskId, req.user.id, req.file.originalname, url, req.file.mimetype, req.file.size, PROVIDER]
  );

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.FILE_UPLOADED,
    entityType: 'attachment',
    entityId: result.insertId,
    description: `File "${req.file.originalname}" uploaded to task #${taskId}`,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: {
      id: result.insertId,
      fileName: req.file.originalname,
      fileUrl: url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      publicId,
    },
  });
});

// ---------------------------------------------------------------------
// POST /api/projects/:projectId/attachments
// ---------------------------------------------------------------------
const uploadProjectAttachment = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const [project] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
  if (!project.length) throw ApiError.notFound('Project not found');

  const { url, publicId } = await saveFile(req.file.path, { folder: 'attachments' });

  const [result] = await pool.query(
    `INSERT INTO attachments (project_id, uploaded_by, file_name, file_url, file_type, file_size, storage_provider)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [projectId, req.user.id, req.file.originalname, url, req.file.mimetype, req.file.size, PROVIDER]
  );

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.FILE_UPLOADED,
    entityType: 'attachment',
    entityId: result.insertId,
    description: `File "${req.file.originalname}" uploaded to project #${projectId}`,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: { id: result.insertId, fileName: req.file.originalname, fileUrl: url, publicId },
  });
});

// ---------------------------------------------------------------------
// GET /api/tasks/:taskId/attachments
// ---------------------------------------------------------------------
const listTaskAttachments = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.file_name, a.file_url, a.file_type, a.file_size, a.created_at,
            u.name AS uploaded_by_name
     FROM attachments a JOIN users u ON u.id = a.uploaded_by
     WHERE a.task_id = ? ORDER BY a.created_at DESC`,
    [req.params.taskId]
  );
  res.json({ success: true, data: rows });
});

// ---------------------------------------------------------------------
// GET /api/projects/:projectId/attachments
// ---------------------------------------------------------------------
const listProjectAttachments = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.file_name, a.file_url, a.file_type, a.file_size, a.created_at,
            u.name AS uploaded_by_name
     FROM attachments a JOIN users u ON u.id = a.uploaded_by
     WHERE a.project_id = ? ORDER BY a.created_at DESC`,
    [req.params.projectId]
  );
  res.json({ success: true, data: rows });
});

// ---------------------------------------------------------------------
// DELETE /api/attachments/:id
// ---------------------------------------------------------------------
const deleteAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM attachments WHERE id = ?', [id]);
  if (!rows.length) throw ApiError.notFound('Attachment not found');
  const attachment = rows[0];

  if (attachment.uploaded_by !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own uploads');
  }

  await deleteFile(attachment.file_url.split('/').pop(), { folder: 'attachments' });
  await pool.query('DELETE FROM attachments WHERE id = ?', [id]);

  await logActivity({
    userId: req.user.id,
    action: ACTIVITY_ACTIONS.FILE_DELETED,
    entityType: 'attachment',
    entityId: id,
    description: `File "${attachment.file_name}" deleted`,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Attachment deleted successfully' });
});

module.exports = {
  uploadTaskAttachment,
  uploadProjectAttachment,
  listTaskAttachments,
  listProjectAttachments,
  deleteAttachment,
};
