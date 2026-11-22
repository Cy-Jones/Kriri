const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { verifyToken, requireMinimumRole } = require("../middleware/auth.middleware");

// All AI endpoints require authenticated workspace scope
router.use(verifyToken);

// Conversation & Chat
router.post("/chat", aiController.chat);
router.post("/stream", aiController.streamChat);
router.get("/conversations", aiController.getConversations);
router.post("/conversations", aiController.createConversation);
router.get("/conversations/:conversationId/messages", aiController.getMessages);
router.post("/conversations/:conversationId/messages", aiController.appendMessage);
router.patch("/conversations/:conversationId", aiController.updateConversation);
router.delete("/conversations/:conversationId", aiController.deleteConversation);

// Project Blueprint & Description Generation
router.post("/projects/blueprint", aiController.generateProjectBlueprintEndpoint);

// Smart Task Intelligence
router.post("/tasks/generate", aiController.generateTask);

// Project & Team Intelligence
router.get("/projects/:projectId/health", aiController.getProjectHealth);
router.get("/workload", aiController.getTeamWorkload);
router.post("/reports/generate", aiController.generateReport);

// Agentic Workflows & Tool Execution
router.post("/tools/execute", aiController.executeTool);

// Document Intelligence (RAG)
router.post("/documents", aiController.uploadDocument);

// Usage Accounting & Observability Dashboard (Admin & Owner only)
router.get("/usage", requireMinimumRole("Admin"), aiController.getUsageStats);
router.patch("/config", requireMinimumRole("Admin"), aiController.updateAIConfig);

module.exports = router;

