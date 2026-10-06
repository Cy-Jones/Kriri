const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAuth } = require('@clerk/express');

router.post('/sync', requireAuth(), authController.sync);
router.get('/me', verifyToken, authController.me);

module.exports = router;
