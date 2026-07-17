const express = require('express');
const router = express.Router();

const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;
