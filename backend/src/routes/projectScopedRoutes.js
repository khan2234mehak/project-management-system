const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createTaskValidator } = require('../validators/taskValidators');

router.use(authenticate);

// Kanban board for a project
router.get('/:projectId/tasks', taskController.getBoardForProject);
router.post('/:projectId/tasks', createTaskValidator, validate, taskController.createTask);

// Project-level attachments (e.g. project briefs, specs)
router.get('/:projectId/attachments', attachmentController.listProjectAttachments);
router.post(
  '/:projectId/attachments',
  uploadAttachment.single('file'),
  attachmentController.uploadProjectAttachment
);

module.exports = router;
