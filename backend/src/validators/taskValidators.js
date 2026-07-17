const { body } = require('express-validator');
const { TASK_STATUS, TASK_PRIORITY } = require('../config/constants');

const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 250 }),
  body('priority').optional().isIn(TASK_PRIORITY).withMessage('Invalid priority'),
  body('status').optional().isIn(TASK_STATUS).withMessage('Invalid status'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid due date'),
];

const moveTaskValidator = [
  body('status').isIn(TASK_STATUS).withMessage('Invalid status'),
  body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
];

module.exports = { createTaskValidator, moveTaskValidator };
