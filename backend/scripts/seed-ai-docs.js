const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const db = require("../src/config/database");
const ragService = require("../src/services/ai/rag.service");

async function seedAiDocs() {
  console.log("Seeding Knowledge Base Documents for RAG Demo...");

  const wsRes = await db.query("SELECT id FROM workspaces LIMIT 1");
  if (wsRes.rows.length === 0) {
    console.error("No workspace found to seed docs");
    process.exit(1);
  }
  const workspaceId = wsRes.rows[0].id;

  const userRes = await db.query("SELECT id FROM users LIMIT 1");
  const userId = userRes.rows[0]?.id || null;

  const projRes = await db.query("SELECT id FROM projects WHERE workspace_id = $1 LIMIT 1", [workspaceId]);
  const projectId = projRes.rows[0]?.id || null;

  const sampleDoc = `# KRIRI System Architecture & Security Specification

## 1. Overview
KRIRI is a high-performance collaborative project intelligence platform inspired by Linear and Trello.
The system is built on a decoupled architecture comprising a React + Vite frontend, a Node.js + Express 5 backend, and a PostgreSQL database.

## 2. Authentication & Authorization
- **Gateway**: Clerk Authentication with OAuth2 and JWT bearer tokens.
- **Token Lifecycle**: Short-lived access tokens (60 seconds) with transparent client-side rotation.
- **Roles & Hierarchies**: Owner (70), Admin (60), Project Manager (50), Team Lead (40), Member (30), Viewer (20), Guest (10).
- **Workspace Isolation**: Every database entity is foreign-keyed to workspace_id. Cross-tenant leakage is prevented at the middleware level.

## 3. Real-Time Synchronization Engine
- Real-time updates utilize Socket.IO with WebSocket fallback.
- Server broadcasts TASK_CREATED, TASK_UPDATED, and PROJECT_UPDATED events to connected workspace rooms.
- Client state updates optimistically with conflict rollback.

## 4. AI Intelligence Subsystem
- Gateway: OpenRouter API with automated free-tier model routing.
- Context Grounding: Queries live PostgreSQL state before generating responses.
- Human-in-the-Loop Security: Destructive actions require explicit client confirmation before database execution.
`;

  try {
    const res = await ragService.ingestDocument({
      workspaceId,
      projectId,
      userId,
      filename: "KRIRI_Architecture_Spec.md",
      mimeType: "text/markdown",
      rawContent: sampleDoc,
    });
    console.log(`Successfully ingested document! ID: ${res.documentId}, Chunks: ${res.chunksIndexed}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed AI document:", err.message);
    process.exit(1);
  }
}

seedAiDocs();

