const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/charts', dashboardController.getCharts);
router.get('/calendar', dashboardController.getCalendarEvents);
router.get('/login-monitoring', authorize('admin'), dashboardController.getLoginMonitoring);

module.exports = router;
