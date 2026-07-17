const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.use(authenticate);

router.get('/', authorize('admin', 'project_manager'), userController.listUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.patch('/:id/block', authorize('admin'), userController.setBlockedStatus);
router.patch('/:id/role', authorize('admin'), userController.changeRole);
router.post('/:id/avatar', uploadAvatar.single('avatar'), userController.uploadAvatar);
router.get('/:id/login-history', userController.getLoginHistory);
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;
