const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { verifyToken, requireMinimumRole } = require('../middleware/auth.middleware');

// All workspace routes require authentication
router.use(verifyToken);

// Any authenticated user can potentially create a workspace if Clerk lets them
router.post('/', workspaceController.createWorkspace);

// Viewers and above can view workspaces
router.get('/', requireMinimumRole('Viewer'), workspaceController.getUserWorkspaces);
router.get('/:id', requireMinimumRole('Viewer'), workspaceController.getWorkspaceDetails);

// Members can view workspace members
router.get('/:id/members', requireMinimumRole('Member'), workspaceController.getWorkspaceMembers);

// Only Admins can update roles
router.put('/:id/members/:userId/role', requireMinimumRole('Admin'), workspaceController.updateWorkspaceMemberRole);

// Only Admins can remove members
router.delete('/:id/members/:userId', requireMinimumRole('Admin'), workspaceController.removeWorkspaceMember);

module.exports = router;
