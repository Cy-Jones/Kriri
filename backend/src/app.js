const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { clerkMiddleware } = require('@clerk/express');

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
// Webhook routes must be before express.json() to allow raw body parsing
const webhookRoutes = require('./routes/webhook.routes');
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(clerkMiddleware());

// Basic Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const projectRoutes = require('./routes/project.routes');
const milestoneRoutes = require('./routes/milestone.routes');
const taskRoutes = require('./routes/task.routes');
const commentRoutes = require('./routes/comment.routes');

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
