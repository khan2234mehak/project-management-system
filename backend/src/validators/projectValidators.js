const { body } = require('express-validator');
const { PROJECT_STATUS } = require('../config/constants');

const createProjectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 200 }),
  body('status').optional().isIn(PROJECT_STATUS).withMessage('Invalid status'),
  body('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid start date'),
  body('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid end date'),
];

const updateProjectValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('status').optional().isIn(PROJECT_STATUS).withMessage('Invalid status'),
  body('startDate').optional({ values: 'falsy' }).isISO8601(),
  body('endDate').optional({ values: 'falsy' }).isISO8601(),
];

module.exports = { createProjectValidator, updateProjectValidator };
