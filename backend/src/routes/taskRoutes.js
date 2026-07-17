const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const subtaskController = require('../controllers/subtaskController');
const commentController = require('../controllers/commentController');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { moveTaskValidator } = require('../validators/taskValidators');

router.use(authenticate);

// Direct task routes (mounted at /api/tasks)
router.get('/', taskController.searchTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id/move', moveTaskValidator, validate, taskController.moveTask);
router.delete('/:id', taskController.deleteTask);

// Subtasks
router.post('/:taskId/subtasks', subtaskController.createSubtask);

// Comments
router.get('/:taskId/comments', commentController.listComments);
router.post('/:taskId/comments', commentController.createComment);

// Attachments
router.get('/:taskId/attachments', attachmentController.listTaskAttachments);
router.post('/:taskId/attachments', uploadAttachment.single('file'), attachmentController.uploadTaskAttachment);

module.exports = router;
