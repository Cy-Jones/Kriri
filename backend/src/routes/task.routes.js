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

// Members and above can create tasks
router.post('/', requireMinimumRole('Member'), taskController.createTask);

module.exports = router;
