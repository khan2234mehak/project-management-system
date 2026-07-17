const express = require('express');
const router = express.Router();

const subtaskController = require('../controllers/subtaskController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.put('/:id', subtaskController.updateSubtask);
router.delete('/:id', subtaskController.deleteSubtask);

module.exports = router;
