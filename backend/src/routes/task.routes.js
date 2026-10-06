const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');

const { verifyToken, requireMinimumRole } = require('../middleware/auth.middleware');

// All task routes require authentication
router.use(verifyToken);

// Viewers and above can view tasks
router.get('/', requireMinimumRole('Viewer'), taskController.getAllTasks);
router.get('/:id', requireMinimumRole('Viewer'), taskController.getTaskById);

// Members can update task status (per rule 4.4)
router.put('/:id', requireMinimumRole('Member'), taskController.updateTask);

// Only Project Managers and above can create tasks (per rule 4.2)
router.post('/', requireMinimumRole('Project Manager'), taskController.createTask);

module.exports = router;
