const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken, requireMinimumRole } = require('../middleware/auth.middleware');

// All project routes require authentication
router.use(verifyToken);

// Viewers and above can view projects
router.get('/', requireMinimumRole('Viewer'), projectController.getAllProjects);
router.get('/:id', requireMinimumRole('Viewer'), projectController.getProjectById);

// Members and above can create and update projects
router.post('/', requireMinimumRole('Member'), projectController.createProject);
router.put('/:id', requireMinimumRole('Member'), projectController.updateProject);
router.delete('/:id', requireMinimumRole('Project Manager'), projectController.deleteProject);

module.exports = router;
