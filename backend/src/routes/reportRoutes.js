const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'project_manager'));

router.get('/:type/excel', reportController.exportExcel);
router.get('/:type/pdf', reportController.exportPdf);

module.exports = router;
