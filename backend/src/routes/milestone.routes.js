const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestone.controller');
const { verifyToken, requireMinimumRole } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', requireMinimumRole('Project Manager'), milestoneController.createMilestone);
router.get('/project/:projectId', requireMinimumRole('Viewer'), milestoneController.getProjectMilestones);
router.put('/:id', requireMinimumRole('Project Manager'), milestoneController.updateMilestone);
router.delete('/:id', requireMinimumRole('Project Manager'), milestoneController.deleteMilestone);

module.exports = router;
