const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { clerkMiddleware } = require("@clerk/express");

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = [
  frontendUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);

  if (
    process.env.NODE_ENV !== "production" &&
    (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
     /^https:\/\/.*(trycloudflare\.com|pinggy\.link|ngrok-free\.app|loca\.lt)$/.test(origin))
  ) {
    return callback(null, true);
  }

  callback(new Error(`Origin ${origin} not allowed by CORS`));
};

// Middleware
app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
  }),
);
// Webhook routes must be before express.json() to allow raw body parsing
const webhookRoutes = require("./routes/webhook.routes");
app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(clerkMiddleware());

// Basic Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Import Routes
const authRoutes = require("./routes/auth.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const projectRoutes = require("./routes/project.routes");
const milestoneRoutes = require("./routes/milestone.routes");
const taskRoutes = require("./routes/task.routes");
const commentRoutes = require("./routes/comment.routes");
const aiRoutes = require("./routes/ai.routes");

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = require("./socket").init(server, corsOriginHandler);

module.exports = app;
