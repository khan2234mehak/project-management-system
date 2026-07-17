const express = require('express');
const router = express.Router();

const teamController = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', teamController.listTeams);
router.get('/:id', teamController.getTeamById);
// All logged-in users can create teams
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', authorize('admin', 'project_manager'), teamController.deleteTeam);
router.post('/:id/members', teamController.addMembers);
router.delete('/:id/members/:userId', teamController.removeMember);
router.patch('/:id/members/:userId/role', authorize('admin', 'project_manager'), teamController.changeMemberRole);

module.exports = router;
