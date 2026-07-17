const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProjectValidator, updateProjectValidator } = require('../validators/projectValidators');

router.use(authenticate);

router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProjectById);
// All logged-in users can create projects (team_member included)
router.post('/', createProjectValidator, validate, projectController.createProject);
router.put('/:id', updateProjectValidator, validate, projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
