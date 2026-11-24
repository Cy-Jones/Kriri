const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../src/config/database");

/**
 * KRIRI High-Volume Production Seeding Engine
 * Target Account: smartjones07@gmail.com
 *
 * Rules:
 * - Project Identifier: KRI-{USER_CODE}-{INDEX} (e.g., KRI-CJ-1, KRI-CJ-22)
 * - Task Identifier: {PROJECT_IDENTIFIER}-{TASK_ID}
 * - 60 Dense, 100% Fully Populated Projects (No Lorem Ipsum, No blanks)
 * - Exactly 200 Tasks across all Kanban columns with detailed acceptance criteria
 * - Exactly 50 Inbox Notifications tied to generated projects/tasks
 */

// Helper to derive user initials/code
function getUserIdentifierCode(name) {
  if (!name || typeof name !== "string") return "USR";
  const clean = name.trim();
  if (!clean) return "USR";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p[0].toUpperCase()).slice(0, 3).join("");
  }
  return clean.slice(0, 3).toUpperCase() || "USR";
}

// Helper to generate a clean URL slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// --- 60 REALISTIC ENGINEERING & PRODUCT PROJECTS ---
const PROJECTS_DATA = [
  {
    name: "Kubernetes Multi-Region Cluster Migration",
    summary: "Terraform-managed geo-distributed GKE clusters with Cloud Armor ingress and Calico CNI mesh.",
    desc: "Migrate legacy single-region container infrastructure to geo-distributed GKE clusters across US-East, EU-West, and Asia-South. Implements unified Terraform modules, Calico network security policies, global external HTTP(S) load balancers with Cloud Armor DDoS mitigation, and ArgoCD multi-cluster GitOps synchronization to ensure zero-downtime failover.\n\nKey architectural pillars include strict cross-region latency limits under 45ms, automated DNS failover routing via Cloudflare, and hermetic CI/CD container image scanning with Trivy prior to deployment.",
    labels: ["infra", "kubernetes", "devops", "cloud"],
    priority: "Urgent",
    status: "In Progress",
    health: "At Risk",
    progress: 58,
    leadCode: "CJ"
  },
  {
    name: "Stripe Billing & Metered Usage Pipeline",
    summary: "Automated billing pipeline supporting tiered team seats, metered AI token consumption, and webhook idempotency.",
    desc: "Refactor subscription management from legacy static tiers to dynamic Stripe Customer Portal integration with real-time metered usage records. Implements robust webhook handlers with Svix signature validation, automated grace-period notifications, and PDF receipt rendering.\n\nGuarantees idempotent invoice finalization, prevents race conditions during plan downgrades, and connects with PostgreSQL transaction logs for accurate monthly revenue accounting and seat reconciliations.",
    labels: ["billing", "stripe", "fintech", "backend"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "AR"
  },
  {
    name: "SOC2 Type II Compliance & Audit Logging",
    summary: "Tamper-evident cryptographically chained audit logging for all privilege escalation and tenant mutations.",
    desc: "Implement append-only audit trail logging for all workspace membership changes, API key lifecycle events, and data export operations. Prepares automated compliance reporting and integrates Datadog SIEM log archive forwarding.\n\nEnforces strict access control verifications, customer-managed encryption key support (CMEK) via AWS KMS/GCP Cloud KMS, and annual penetration test remediations to satisfy all trust security criteria.",
    labels: ["security", "compliance", "audit", "rbac"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 74,
    leadCode: "CJ"
  },
  {
    name: "Mobile App Companion v2.0 (iOS & Android)",
    summary: "Cross-platform Flutter application with offline-first SQLite sync and biometric authentication.",
    desc: "Complete re-architecture of the Kriri companion mobile client. Features offline-first SQLite optimistic updates, native Biometric LocalAuthentication (FaceID/Fingerprint), 120Hz smooth scroll animations, and interactive push notifications via APNs and FCM.\n\nIncorporates seamless deep-linking to specific project tasks, background state synchronization, and battery-efficient delta updates using binary WebSocket frames.",
    labels: ["mobile", "flutter", "ios", "android"],
    priority: "High",
    status: "In Progress",
    health: "At Risk",
    progress: 46,
    leadCode: "DK"
  },
  {
    name: "Core API Gateway & Unified Rate Limiting",
    summary: "High-throughput reverse proxy handling JWT auth, sliding window rate limits, and circuit breaking.",
    desc: "Production reverse proxy layer routing incoming client traffic. Implements Redis-backed sliding-window token bucket rate limiters, automatic Circuit Breaker tripping for upstream HTTP 429/503 errors, and Clerk session token verification.\n\nReduces 99th percentile response latency below 12ms for authenticated requests while shielding internal database connection pools against volumetric DDoS bursts.",
    labels: ["backend", "gateway", "performance", "redis"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Real-time WebSocket State Fanout Engine",
    summary: "Socket.IO pub/sub room clustering backed by Redis Streams for sub-50ms live task collaboration.",
    desc: "Engineered scalable real-time state fanout service for issue assignment notifications, live board updates, and mention pings. Uses Redis adapter pub/sub for cross-node message broadcast and auto-reconnecting socket transports.\n\nFeatures message deduplication, optimistic client-side reconciliations, and automatic room leave/join lifecycle tracking tied to Clerk workspace tenancy.",
    labels: ["websockets", "realtime", "backend", "pubsub"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 68,
    leadCode: "AR"
  },
  {
    name: "Design System v2 & OKLCH Perceptual Tokens",
    summary: "Modern color token architecture utilizing OKLCH color space for accessible contrast in dark and light modes.",
    desc: "Migration from legacy hex colors to OKLCH perceptual tokens complying with WCAG 2.1 AA (4.5:1 ratio). Includes redesigned Tailwind 4 configuration, Radix UI primitive wrappers, micro-interactions with Motion, and hairline borders.\n\nProvides a living Storybook component library, automated visual regression test suites via Chromatic, and token exports for web and mobile clients.",
    labels: ["frontend", "design-system", "tailwind", "ui"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "GraphQL Federation Subgraph Router",
    summary: "Apollo Federation v2 router unifying Task, Workspace, and Identity microservices under a single schema.",
    desc: "Unify fragmented REST microservices under an Apollo Router supergraph schema. Implements distributed entity resolvers, dataloader batching to eliminate N+1 queries, and automated schema check validations in CI.\n\nProvides strong schema typing, query complexity analysis to protect backend resources, and persisted query hashing for client bandwidth optimization.",
    labels: ["backend", "graphql", "microservices", "architecture"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 52,
    leadCode: "AR"
  },
  {
    name: "PostgreSQL Vector Search & Embeddings Engine",
    summary: "pgvector integration enabling semantic similarity search and RAG retrieval over project documentation.",
    desc: "Introduce pgvector extension to primary PostgreSQL clusters to support semantic indexing of project descriptions, task comments, and workspace knowledge bases. Implements HNSW indexes for sub-10ms nearest neighbor queries.\n\nIncludes automated document chunking, embeddings generation via open-source embedding models, and hybrid keyword-vector search ranking using reciprocal rank fusion.",
    labels: ["ai", "database", "postgres", "vector-search"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 62,
    leadCode: "CJ"
  },
  {
    name: "WebAssembly Image Processing Pipeline",
    summary: "Client-side image resizing, WebP conversion, and blurhash placeholder generation via Rust-compiled WASM.",
    desc: "Offload avatar and attachment pre-processing to user browsers using a Rust WebAssembly module. Generates progressive JPEG/WebP representations and calculates 32-character BlurHash strings before file upload to S3.\n\nEliminates expensive backend image transformation worker servers while guaranteeing instant client-side preview rendering and reducing upload bandwidth by up to 70%.",
    labels: ["frontend", "wasm", "rust", "performance"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "DK"
  },
  {
    name: "Zero-Trust mTLS Service Mesh Architecture",
    summary: "Istio service mesh deployment with mutual TLS, SPIFFE identities, and strict egress firewalls.",
    desc: "Deploy Istio across all production Kubernetes clusters to establish zero-trust communication between internal microservices. Configures SPIFFE cryptographic identities, automated certificate rotation with HashiCorp Vault, and fine-grained authorization policies.\n\nEnforces strict egress gateway filtering to prevent unauthorized external network egress and data exfiltration from compromised pods.",
    labels: ["security", "devops", "istio", "networking"],
    priority: "Urgent",
    status: "In Review",
    health: "At Risk",
    progress: 88,
    leadCode: "CJ"
  },
  {
    name: "Automated Chaos Engineering & Load Testing Suite",
    summary: "Continuous resilience verification simulating network partitions, node failures, and 10x traffic spikes.",
    desc: "Build comprehensive chaos engineering pipeline using Chaos Mesh and k6 distributed load generators. Automates weekly simulations of Kubernetes worker node drains, Redis sentinel failovers, and synthetic PostgreSQL connection pool exhaustion.\n\nEnsures automated alerting, graceful degraded mode fallbacks, and recovery objectives (RTO < 2 minutes, RPO = 0) are continuously validated.",
    labels: ["testing", "qa", "chaos", "resilience"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 40,
    leadCode: "AR"
  },
  {
    name: "120Hz Virtualized Board & List View Engine",
    summary: "Decoupled DataStore and TanStack Virtual rendering for lag-free 10,000+ item issue switching.",
    desc: "Engineering milestone to eliminate UI frame drops during large workspace navigation. Implements custom memory-cached ViewStateStore, windowed DOM virtualization for Kanban columns, and passive touch gesture listeners.\n\nAchieves consistent 120 FPS scrolling performance on ProMotion displays and sub-1ms filter application across thousands of active issues.",
    labels: ["frontend", "performance", "react", "virtualization"],
    priority: "Urgent",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "Enterprise SAML & SCIM Identity Provisioning",
    summary: "Okta, Azure AD, and Google Workspace Single Sign-On with automated JIT seat provisioning and de-provisioning.",
    desc: "Deliver enterprise identity federation supporting SAML 2.0 and SCIM 2.0 directory synchronization. Automates user provisioning, role assignments based on IdP group claims, and immediate session termination upon employee offboarding.\n\nProvides self-serve domain verification via DNS TXT records and enterprise SSO enforcement settings for workspace administrators.",
    labels: ["security", "auth", "enterprise", "clerk"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 65,
    leadCode: "CJ"
  },
  {
    name: "PostHog Product Analytics & Telemetry Mesh",
    summary: "Privacy-preserving client and server event instrumentation with asynchronous batching and session replay.",
    desc: "Integrate PostHog product telemetry across all frontend routes, command palette actions, and backend API controllers. Features non-blocking batch dispatching via requestIdleCallback, user privacy masking, and feature flag management.\n\nEnables engineering teams to measure feature adoption, detect friction in onboarding funnels, and debug client-side exceptions through correlated session replays.",
    labels: ["analytics", "observability", "posthog", "frontend"],
    priority: "Low",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "DK"
  },
  {
    name: "OpenTelemetry Distributed Tracing & APM Mesh",
    summary: "End-to-end W3C trace context propagation across HTTP, WebSockets, and PostgreSQL queries with Jaeger UI.",
    desc: "Deploy OpenTelemetry instrumentation across the entire Node.js backend runtime. Captures distributed traces with span events, database query duration histograms, and external API latencies.\n\nExports telemetry to Grafana Tempo and Prometheus, enabling instant root-cause analysis for tail-latency anomalies and slow database locks.",
    labels: ["observability", "opentelemetry", "tracing", "monitoring"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 72,
    leadCode: "AR"
  },
  {
    name: "AI Prompt Injection Firewall & Safety Guardrails",
    summary: "Multi-layered input validation detecting prompt injections, jailbreaks, and PII leakage prior to LLM submission.",
    desc: "Architect pre-flight inference safety middleware. Evaluates incoming user prompts against known adversarial injection heuristics, semantic embeddings distance models, and regex PII detectors.\n\nRedacts social security numbers, API tokens, and credentials from prompts while ensuring autonomous agent tool calling remains confined to verified schemas.",
    labels: ["ai", "security", "guardrails", "safety"],
    priority: "Urgent",
    status: "In Progress",
    health: "At Risk",
    progress: 44,
    leadCode: "CJ"
  },
  {
    name: "ClickHouse Real-Time Telemetry & Event Store",
    summary: "Columnar database cluster for high-volume audit event ingestion, analytics aggregation, and trend forecasting.",
    desc: "Establish a dedicated ClickHouse cluster for ingesting tens of millions of raw workspace telemetry and audit records daily. Features Zookeeper-free ClickHouse Keeper replication, automated partition TTLs, and materialized views.\n\nPowers instantaneous velocity charts, sprint burndown aggregations, and team delivery cycle time analytics on the dashboard.",
    labels: ["database", "clickhouse", "analytics", "bigdata"],
    priority: "Medium",
    status: "Planning",
    health: "On Track",
    progress: 15,
    leadCode: "DK"
  },
  {
    name: "Conflict-Free Replicated Task Trees (CRDTs)",
    summary: "Yjs-powered collaborative document and task hierarchy editing with multi-client peer convergence.",
    desc: "Implement CRDT state synchronization for task descriptions and subtask lists. Enables multiple team members to edit specifications simultaneously without merge conflicts, lockouts, or data loss.\n\nFeatures visual cursor presence, character-level diff highlighting, and automatic offline change buffering with seamless server reconciliation upon reconnection.",
    labels: ["realtime", "crdt", "collaboration", "frontend"],
    priority: "High",
    status: "In Progress",
    health: "At Risk",
    progress: 50,
    leadCode: "SC"
  },
  {
    name: "S3 Multipart Direct-Upload Pipeline",
    summary: "Signed pre-flight URL upload mechanism for attachments up to 5GB with chunked resumable transfers.",
    desc: "Modernize file attachments by replacing server-proxied uploads with direct AWS S3/Cloudflare R2 multipart signed URLs. Utilizes Uppy client libraries for automatic pause, resume, and retry across unstable network connections.\n\nIncludes automated virus scanning via ClamAV Lambda triggers and web-optimized thumbnail generation upon upload completion.",
    labels: ["storage", "s3", "aws", "upload"],
    priority: "Low",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "AR"
  },
  {
    name: "Hermetic Docker Build Matrix & Caching Engine",
    summary: "Multi-stage BuildKit container optimizations with remote registry cache mounts reducing CI build times by 80%.",
    desc: "Overhaul container image build pipelines using modern BuildKit syntax, Alpine minimal base layers, and unprivileged non-root execution users. Configures remote inline cache imports from GitHub Container Registry (GHCR).\n\nCuts median Pull Request container build times from 9.5 minutes to under 85 seconds while verifying zero vulnerabilities with Grype security scans.",
    labels: ["devops", "docker", "ci", "buildkit"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Natural Language Issue Decomposition Service",
    summary: "AI pipeline transforming vague product briefs into fully scoped user stories, subtasks, and acceptance tests.",
    desc: "Develop dedicated prompt engineering and tool-orchestration service that ingests high-level project specs and outputs structured task hierarchies. Assigns appropriate priority labels, estimated story points, and dependency links.\n\nGrounds generation in existing workspace components to prevent duplicate work and recommends optimal team member assignments based on historical velocity.",
    labels: ["ai", "agents", "llm", "automation"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 78,
    leadCode: "CJ"
  },
  {
    name: "Dynamic Theme Engine & Accessible High-Contrast Modes",
    summary: "Runtime theme token generator calculating luminance, WCAG AA contrast, and user-customized accent palettes.",
    desc: "Build client-side dynamic CSS custom property generator supporting arbitrary hex brand accents. Calculates relative luminance and automatically shifts foreground and border contrasts to guarantee 4.5:1 legibility.\n\nFeatures custom color picker popovers, persistent user profile preferences, and zero-flash theme hydration on initial page render.",
    labels: ["frontend", "theme", "css", "accessibility"],
    priority: "Low",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "PostgreSQL Read-Replica Pooler & Connection Sharding",
    summary: "PgBouncer pool cluster routing read-only analytics queries to async replicas with replica-lag health checks.",
    desc: "Configure transaction-mode PgBouncer connection pooling layer in front of PostgreSQL. Distributes heavy read queries and dashboard aggregations to secondary read replicas while reserving primary nodes for writes.\n\nIncludes automated replica-lag monitoring to temporarily route queries to the primary if replication lag exceeds 500ms, preventing stale read anomalies.",
    labels: ["database", "postgres", "scaling", "pgbouncer"],
    priority: "High",
    status: "In Review",
    health: "On Track",
    progress: 92,
    leadCode: "AR"
  },
  {
    name: "Playwright End-to-End Test Matrix & Synthetic Monitoring",
    summary: "Hermetic browser test suite covering critical authentication, Kanban drag-and-drop, and billing checkout paths.",
    desc: "Construct comprehensive end-to-end automated test suite utilizing Playwright across Chromium, Firefox, and WebKit. Simulates realistic keyboard shortcuts, command palette navigation, drag-and-drop task movements, and Clerk auth flows.\n\nRuns hourly synthetic probes against production staging environments with automated PagerDuty escalation upon workflow regression.",
    labels: ["testing", "playwright", "e2e", "qa"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 60,
    leadCode: "DK"
  },
  {
    name: "Fast ⌘K Command Search & Fuzzy Token Index",
    summary: "In-memory trie and fuzzy substring index matching projects, tasks, and members under 2ms.",
    desc: "Implement ultra-low latency command palette engine with in-memory client indexing. Supports fuzzy matching, prefix scoring, keyboard hotkeys, and contextual command suggestions based on current active workspace route.\n\nEliminates network round-trips for common navigation actions and provides instant keyboard-first productivity across large workspaces.",
    labels: ["frontend", "command-palette", "performance", "search"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "Semantic Cache Layer for Autonomous AI Agents",
    summary: "Redis similarity cache storing LLM query responses to reduce inference latency and API costs by 65%.",
    desc: "Implement semantic caching proxy sitting between application controllers and OpenRouter inference endpoints. Generates embedding vectors for user queries and returns cached responses when cosine similarity exceeds 0.96.\n\nDrastically reduces external LLM provider costs, protects master daily quota limits, and provides instant responses for repetitive project questions.",
    labels: ["ai", "cache", "redis", "optimization"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 70,
    leadCode: "CJ"
  },
  {
    name: "Automated Database Migration & Rollback Runner",
    summary: "Zero-downtime database migration harness with expand-and-contract schema phases and advisory locks.",
    desc: "Develop automated database schema migration runner executing within transactional advisory locks. Enforces expand-and-contract deployment patterns for non-blocking column additions, index creations, and foreign key validations.\n\nIncludes automated dry-run validation in Pull Request CI pipelines and instant rollback scripts for critical production emergencies.",
    labels: ["database", "migrations", "devops", "sql"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "AR"
  },
  {
    name: "WebRTC Audio/Video Standup & Screen Share SFU",
    summary: "Integrated team huddle experience utilizing selective forwarding units (SFU) for low-bandwidth ephemeral calls.",
    desc: "Build lightweight in-app audio and video standup feature directly accessible from project workspaces. Utilizes LiveKit WebRTC SFU infrastructure with adaptive bitrate streaming, background noise suppression, and active speaker spotlighting.\n\nAllows team members to jump into instant 5-minute sync calls, share screen mockups, and pin discussion highlights directly to related task boards.",
    labels: ["webrtc", "realtime", "video", "collaboration"],
    priority: "Low",
    status: "Planning",
    health: "On Track",
    progress: 10,
    leadCode: "DK"
  },
  {
    name: "Git Provider Integration & Branch Linking (GitHub & GitLab)",
    summary: "Bi-directional webhook synchronization linking commits, pull requests, and CI build status to Kriri tasks.",
    desc: "Establish rich Git integrations automatically connecting GitHub and GitLab repositories to Kriri tasks via branch name matching (e.g. `feat/KRI-CJ-12-auth`). Displays live PR review status, merge checks, and build results directly within issue sidebars.\n\nAutomates task status transitions to 'In Review' on PR open and 'Done' when pull requests are merged into the default branch.",
    labels: ["integrations", "github", "git", "webhooks"],
    priority: "High",
    status: "In Progress",
    health: "On Track",
    progress: 55,
    leadCode: "AR"
  },
  {
    name: "Custom Webhook Dispatcher & Event Delivery Engine",
    summary: "Reliable customer webhook notification service with HMAC-SHA256 signatures and exponential backoff retry.",
    desc: "Construct high-volume webhook dispatching infrastructure delivering workspace mutations to external customer endpoints. Features cryptographically signed payloads using HMAC-SHA256 headers, delivery status logs, and manual redelivery controls.\n\nImplements exponential backoff retries across 5 attempts over 24 hours, circuit breaking failing recipient endpoints to maintain queue throughput.",
    labels: ["integrations", "webhooks", "backend", "events"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Automated Performance Regression Profiler",
    summary: "Lighthouse CI and Chrome DevTools protocol harness detecting bundle bloat and layout shifts in every PR.",
    desc: "Incorporate automated performance budget gating into pull request workflows. Executes synthetic Lighthouse audits and tracks Core Web Vitals (LCP < 1.2s, INP < 50ms, CLS = 0) against production baselines.\n\nAutomatically comments with flamegraph comparisons and blocks pull requests that exceed JavaScript bundle size allowances by more than 2%.",
    labels: ["performance", "frontend", "ci", "lighthouse"],
    priority: "Low",
    status: "In Progress",
    health: "On Track",
    progress: 64,
    leadCode: "SC"
  },
  {
    name: "Enterprise Data Export & Backup Snapshotter",
    summary: "Scheduled automated JSON/CSV workspace data dumps with AES-256 encryption and S3 bucket synchronization.",
    desc: "Provide enterprise workspace owners with automated daily and on-demand data export capabilities. Packages projects, tasks, comments, attachment metadata, and audit logs into standardized ZIP archives.\n\nEncrypts archives with customer-provided public keys or AES-256 and provides direct synchronization to customer-owned AWS S3 or Google Cloud Storage buckets.",
    labels: ["enterprise", "backup", "security", "data"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Keyboard Navigation Overhaul & Shortcuts Modal",
    summary: "Vim-inspired navigation keys (J/K movement, C creation, X selection, / search) with interactive help overlay.",
    desc: "Empower power users with full keyboard accessibility across all primary workspace surfaces. Features row-cursor navigation with J and K, quick issue creation with C, bulk selection with X, and instant status assignment with S.\n\nIncludes an interactive shortcuts help modal (`?`), customizable shortcut keybindings, and platform detection for macOS and Windows keys.",
    labels: ["frontend", "shortcuts", "accessibility", "ux"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "Automated SLA Tracking & Escalation Bot",
    summary: "Configurable SLA breach monitoring calculating time-to-first-response and alerting on urgent incidents.",
    desc: "Deploy background policy monitor calculating customer SLA thresholds based on issue priority and workspace business hours. Emits real-time Slack/Teams alerts when critical bugs approach SLA breach thresholds within 60 minutes.\n\nIncludes automated escalation reassignments to on-call team leads and monthly compliance SLA report generation for enterprise customer success teams.",
    labels: ["automation", "sla", "monitoring", "support"],
    priority: "High",
    status: "In Progress",
    health: "At Risk",
    progress: 38,
    leadCode: "AR"
  },
  {
    name: "Markdown & WYSIWYG Dual-Mode Editor",
    summary: "ProseMirror-based rich text editor supporting inline code execution, tables, checklists, and image drag-and-drop.",
    desc: "Replace plain text areas with responsive rich document editor. Supports seamless toggling between raw Markdown syntax and formatted WYSIWYG view, syntax-highlighted code blocks, task mention pills, and inline image pasting.\n\nFeatures auto-saving drafts to local storage and instant server sync with debounced patch updates.",
    labels: ["frontend", "editor", "markdown", "rich-text"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 82,
    leadCode: "SC"
  },
  {
    name: "Slack & Microsoft Teams Interactive Bot Integration",
    summary: "Bi-directional Slack bot allowing users to create issues, update statuses, and view daily summaries from chat.",
    desc: "Build verified Slack and Microsoft Teams app integrations. Enables teams to convert chat messages into Kriri tasks using message shortcuts, receive targeted mention notifications, and interact with approval cards directly inside chat channels.\n\nIncludes a daily morning briefing bot posting sprint burn-up metrics and highlighting blocked tasks to relevant engineering channels.",
    labels: ["integrations", "slack", "teams", "bot"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 48,
    leadCode: "DK"
  },
  {
    name: "Multi-Tenant Database Row-Level Security (RLS)",
    summary: "PostgreSQL native Row-Level Security policies enforcing tenant workspace isolation at the engine level.",
    desc: "Upgrade database security architecture by activating PostgreSQL Row-Level Security (RLS) across all primary tables. Enforces workspace_id isolation checks natively inside the database query planner using session configuration variables.\n\nGuarantees that even in the event of an application SQL vulnerability, cross-tenant data leakage is fundamentally impossible at the engine layer.",
    labels: ["security", "database", "postgres", "rls"],
    priority: "Urgent",
    status: "In Review",
    health: "On Track",
    progress: 95,
    leadCode: "CJ"
  },
  {
    name: "Granular Role-Based Access Control (RBAC) Matrix",
    summary: "Customizable workspace permission matrix with custom roles, resource scoping, and guest access modes.",
    desc: "Refactor fixed role hierarchy into flexible RBAC permission matrix. Allows enterprise administrators to create custom roles (e.g. 'Contractor', 'QA Tester', 'Product Lead') with fine-grained read, write, and delete permissions per project.\n\nIncludes time-limited guest access modes, external client shareable links, and real-time permission enforcement across API and WebSocket handlers.",
    labels: ["security", "rbac", "permissions", "enterprise"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Automated Dependency Cycle Detection Engine",
    summary: "Recursive SQL CTE algorithms preventing circular task blocking links and computing topological critical paths.",
    desc: "Implement deterministic graph validation logic preventing circular dependencies (e.g., A blocks B, B blocks C, C blocks A) using recursive PostgreSQL Common Table Expressions. Rejects invalid dependency submissions with immediate 400 Bad Request.\n\nComputes the critical delivery path across project tasks, highlighting the exact chain of blockers determining project completion dates.",
    labels: ["backend", "algorithms", "graph", "sql"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "AR"
  },
  {
    name: "Customer Portal & Public Roadmap Board",
    summary: "Lightweight publicly shareable roadmap boards for feature voting, customer feedback, and changelog updates.",
    desc: "Provide product teams with customer-facing roadmap views. Allows verified external users to upvote proposed features, submit bug reports, and track planned delivery timelines without exposing internal engineering tasks.\n\nFeatures custom domain mapping, branding overrides, and automated notification emails to upvoters when status changes occur.",
    labels: ["frontend", "public", "roadmap", "growth"],
    priority: "Low",
    status: "In Progress",
    health: "On Track",
    progress: 35,
    leadCode: "SC"
  },
  {
    name: "Subtask Progress Rollup & Hierarchy Sync",
    summary: "Real-time parent task progress calculations and status transitions triggered by subtask completions.",
    desc: "Automate parent issue progress tracking. Whenever subtasks are marked as Done or moved across Kanban columns, parent issue progress percentage is automatically recalculated and updated in PostgreSQL.\n\nBroadcasts live WebSocket updates so nested task trees in the UI immediately reflect hierarchical progress without full page reloads.",
    labels: ["backend", "database", "tasks", "realtime"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "AR"
  },
  {
    name: "Elasticsearch Workspace Search & Log Ingestion",
    summary: "Distributed Elasticsearch cluster indexing issue descriptions, commit messages, and discussion threads.",
    desc: "Integrate dedicated Elasticsearch cluster to provide sub-10ms full-text search across large enterprise workspaces with millions of historic records. Configures custom n-gram tokenizers and stemming for engineering terminology.\n\nIncludes automated log sync pipelines using Logstash and asynchronous change-data-capture triggers from PostgreSQL.",
    labels: ["search", "elasticsearch", "database", "scaling"],
    priority: "Low",
    status: "Paused",
    health: "Off Track",
    progress: 25,
    leadCode: "DK"
  },
  {
    name: "Figma Plugin for Instant Kriri Issue Creation",
    summary: "Direct Figma canvas integration allowing designers to inspect layers and file engineering tasks with screenshots.",
    desc: "Develop native Figma plugin connecting designers directly to their Kriri project workspaces. Allows creators to select canvas frames, attach annotated design screenshots, and publish tasks with direct Figma deep links.\n\nSynchronizes design component token names directly into task descriptions, bridging the gap between product design and engineering handoff.",
    labels: ["figma", "design", "integrations", "plugin"],
    priority: "Low",
    status: "Planning",
    health: "On Track",
    progress: 20,
    leadCode: "SC"
  },
  {
    name: "Automated Sprint Burndown & Velocity Forecasting",
    summary: "Statistical sprint analytics calculating rolling team velocity, scope creep ratios, and projected completion dates.",
    desc: "Construct automated agile analytics engine tracking sprint health. Calculates historical team velocity over trailing 6 sprints, measures mid-sprint scope additions, and estimates delivery confidence intervals.\n\nGenerates interactive Recharts velocity visualizations and exports weekly delivery performance summaries to leadership.",
    labels: ["analytics", "charts", "agile", "velocity"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 75,
    leadCode: "DK"
  },
  {
    name: "Redis Sentinel High-Availability Cache Cluster",
    summary: "Multi-node Redis Sentinel deployment with automated master failover and split-brain prevention.",
    desc: "Upgrade single-instance Redis cache to a fault-tolerant 3-node Sentinel cluster. Configures automated failover election with quorum, client connection auto-reconnection, and persistence via append-only files (AOF).\n\nEnsures rate limiters, session stores, and real-time socket room adapters survive sudden server hardware terminations without service interruption.",
    labels: ["infra", "redis", "devops", "ha"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Terraform Infrastructure as Code (IaC) Modernization",
    summary: "Declarative Terraform modules managing VPC networking, managed databases, IAM policies, and DNS records.",
    desc: "Standardize all cloud infrastructure into modular, version-controlled Terraform code. Implements remote state locking with DynamoDB and S3, automated linting with tflint, and security scanning with Checkov.\n\nEnables engineering teams to provision identical staging and development environments in under 15 minutes with consistent security guardrails.",
    labels: ["infra", "terraform", "devops", "cloud"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 68,
    leadCode: "CJ"
  },
  {
    name: "Automated Email Digest & Notification Batcher",
    summary: "Intelligent notification aggregation compiling unread updates into clean, responsive daily digest emails.",
    desc: "Build notification batching service that groups rapid mentions and issue assignments into cohesive digest emails instead of spamming inboxes. Features clean HTML email templates rendered via React Email.\n\nIncludes one-click unsubscribe headers, custom delivery frequency preferences, and SES delivery reputation monitoring.",
    labels: ["notifications", "email", "backend", "engagement"],
    priority: "Low",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "AR"
  },
  {
    name: "PostgreSQL Database Connection Pooling (PgBouncer)",
    summary: "Dedicated PgBouncer container handling 5,000+ client connections with minimal memory footprint.",
    desc: "Deploy PgBouncer connection pooler in front of PostgreSQL to resolve connection exhaustion during high-concurrency traffic spikes. Configures transaction pooling mode, connection reuse, and statement timeouts.\n\nReduces backend database memory usage by 60% while maintaining sub-millisecond query execution overhead.",
    labels: ["database", "postgres", "performance", "scaling"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "GraphQL API Caching with Cloudflare Workers",
    summary: "Edge compute caching layer caching GraphQL query responses with cache tag invalidation on mutations.",
    desc: "Deploy Cloudflare Worker reverse proxy intercepting read-only GraphQL queries. Parses query abstract syntax trees (ASTs), caches normalized responses at the edge, and invalidates cached entities via webhook events.\n\nDelivers sub-15ms cached response times globally while eliminating 85% of repeated read requests to origin servers.",
    labels: ["cloudflare", "graphql", "edge", "caching"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 54,
    leadCode: "AR"
  },
  {
    name: "Kanban Swimlane Grouping (By Assignee & Priority)",
    summary: "Multi-axis Kanban board rendering supporting dynamic horizontal swimlanes grouped by assignee, project, or priority.",
    desc: "Extend Kanban board renderer to support horizontal swimlanes. Users can pivot board view to group tasks by assignee capacity, parent project, or priority level while preserving drag-and-drop column transitions.\n\nFeatures collapsible swimlane sections, sticky header rows, and persistent user layout preferences in localStorage.",
    labels: ["frontend", "kanban", "ui", "dnd"],
    priority: "Medium",
    status: "In Review",
    health: "On Track",
    progress: 90,
    leadCode: "SC"
  },
  {
    name: "Internal Developer CLI Tool (`kriri-cli`)",
    summary: "Golang terminal CLI for engineers to create tasks, start timers, and check reviews directly from git repositories.",
    desc: "Construct high-speed native command-line interface in Golang. Integrates with local git repositories to automatically detect active branch names, associate commits with issues, and view personal task backlogs in the terminal.\n\nProvides interactive terminal UI (TUI) with Bubbletea for rapid task updates without switching context to the browser.",
    labels: ["cli", "golang", "tooling", "devex"],
    priority: "Low",
    status: "Planning",
    health: "On Track",
    progress: 18,
    leadCode: "DK"
  },
  {
    name: "Automated Dependency Vulnerability Remediation (Dependabot & Snyk)",
    summary: "Continuous container and npm package scanning with automated pull requests for critical security patches.",
    desc: "Establish continuous security monitoring across all frontend and backend dependency manifests. Configures Snyk and Dependabot to automatically open isolated pull requests with passing test suites upon vulnerability detection.\n\nIncludes automated policy blocking pull requests containing dependencies with known CVE scores above 7.0.",
    labels: ["security", "dependencies", "ci", "audit"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  },
  {
    name: "Project Blueprint Generator & Template Library",
    summary: "Pre-configured project scaffolding templates for Mobile Apps, SaaS Platforms, and Design Systems.",
    desc: "Develop project creation template engine providing pre-populated milestone roadmaps, standard issue categories, and quality gate checklists. Accelerates team onboarding from zero to fully scoped backlog in seconds.\n\nAllows workspace administrators to save existing successful projects as reusable templates for future initiatives.",
    labels: ["templates", "productivity", "onboarding", "product"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "Edge-Based Geo-Routing & Latency Optimization",
    summary: "Anycast network routing directing API traffic to the closest regional cluster to minimize TCP handshake latency.",
    desc: "Implement Cloudflare Anycast routing infrastructure routing user traffic to the closest operational edge location. Establishes TLS termination at the edge with HTTP/3 and 0-RTT connection resumption.\n\nReduces global median round-trip times by 40% for international engineering teams across Europe, South America, and Asia.",
    labels: ["networking", "cloudflare", "edge", "infra"],
    priority: "Low",
    status: "In Progress",
    health: "On Track",
    progress: 42,
    leadCode: "AR"
  },
  {
    name: "CSV & Jira Issue Migration Wizard",
    summary: "Self-serve import tool mapping Jira XML and CSV columns into Kriri task hierarchies, users, and labels.",
    desc: "Build self-serve migration pipeline allowing teams switching from Jira or Asana to upload CSV or XML exports. Features interactive column mapping interface with automatic user email matching and label deduplication.\n\nPerforms batch transactional imports capable of ingesting 20,000+ historical issues with original creation timestamps and status mappings.",
    labels: ["migration", "jira", "import", "tooling"],
    priority: "Medium",
    status: "In Progress",
    health: "On Track",
    progress: 60,
    leadCode: "DK"
  },
  {
    name: "Enterprise Audit Log Export & SIEM Forwarder",
    summary: "Real-time streaming of workspace security events to Datadog, Splunk, and AWS S3 via OpenTelemetry collectors.",
    desc: "Provide enterprise compliance administrators with real-time SIEM event streaming. Captures authentication attempts, role modifications, API key access, and data exports, forwarding standardized CEF/JSON logs to customer Datadog or Splunk endpoints.\n\nGuarantees at-least-once delivery with persistent disk buffers to survive transient SIEM endpoint outages.",
    labels: ["security", "siem", "compliance", "datadog"],
    priority: "High",
    status: "In Review",
    health: "On Track",
    progress: 85,
    leadCode: "CJ"
  },
  {
    name: "Intelligent Workload Balancing & Burnout Protection",
    summary: "Capacity analytics detecting over-allocated team members and recommending optimal task reassignment.",
    desc: "Develop capacity intelligence algorithms evaluating team workload distribution across active sprints. Flags team members with more than 6 active high-priority issues or impending deadline overlaps.\n\nRecommends optimal reassignments to under-allocated peers with matching skill tags, preventing engineer burnout and leveling sprint throughput.",
    labels: ["analytics", "workload", "ai", "management"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "DK"
  },
  {
    name: "Touch Gesture Overhaul & Mobile Viewport Polish",
    summary: "Suppression of sticky hover tooltips on touch displays and smooth swipe gestures for Kanban boards.",
    desc: "Refine responsive mobile and tablet interactions across all application routes. Implements coarse pointer media query checks in ActionTooltip components to eliminate sticky hover boxes on iOS and Android touch screens.\n\nEnhances horizontal board scroll containers with smooth momentum scrolling, touch-optimized card grab handles, and haptic feedback triggers.",
    labels: ["frontend", "mobile", "gestures", "ux"],
    priority: "Medium",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "SC"
  },
  {
    name: "AI Observability Dashboard & Token Accounting",
    summary: "Real-time monitoring of OpenRouter inference costs, fallback error rates, and circuit breaker trip events.",
    desc: "Construct administrative observability dashboard tracking AI model usage. Visualizes token consumption by feature, average response latency, and model fallback distribution across Nemotron, Flint, and Gemma tiers.\n\nEnforces per-user and per-workspace daily cost caps, alerting administrators when monthly budgets reach 80% threshold.",
    labels: ["ai", "observability", "metrics", "dashboard"],
    priority: "High",
    status: "Done",
    health: "On Track",
    progress: 100,
    leadCode: "CJ"
  }
];

// --- REALISTIC TASK BLUEPRINTS (200 Total) ---
const TASK_TEMPLATES = [
  {
    title: "Implement Redis sliding-window token bucket algorithm",
    desc: "### Objective\nConstruct a high-performance Redis rate-limiting service utilizing the sliding-window token bucket algorithm.\n\n### Technical Architecture\n- Use Redis sorted sets (ZSET) with microsecond epoch timestamps as scores.\n- Execute cleanup of expired keys and rate limit validation within a single atomic Lua script (`EVALSHA`).\n- Return standardized `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` HTTP headers on all responses.\n\n### Acceptance Criteria\n- [ ] Atomic Lua script executes in under 2ms under concurrent load.\n- [ ] Correctly blocks bursts exceeding 100 requests per second with HTTP 429.\n- [ ] Bypasses limits for verified developer bypass keys (`smartjones07@gmail.com`).",
    hours: 12,
    priority: "High"
  },
  {
    title: "Configure Istio mutual TLS (mTLS) with SPIFFE identity verification",
    desc: "### Objective\nEnforce strict mutual TLS authentication between internal backend services and database connection poolers.\n\n### Implementation Details\n- Deploy PeerAuthentication custom resource with `STRICT` mode enabled across the production namespace.\n- Configure HashiCorp Vault intermediate CA integration for automated 24-hour certificate rotations.\n- Verify SPIFFE ID matching (`spiffe://kriri.internal/ns/prod/sa/backend`).\n\n### Acceptance Criteria\n- [ ] Plaintext TCP connections from outside the service mesh are actively rejected.\n- [ ] Zero downtime observed during automated 24-hour cert renewal cycle.\n- [ ] Prometheus reports `istio_tcp_connections_opened_total` with `tls_version=\"TLSv1.3\"`.",
    hours: 16,
    priority: "Urgent"
  },
  {
    title: "Optimize Kanban board DOM virtualization with TanStack Virtual",
    desc: "### Objective\nEliminate scroll stutter and memory leakage on Kanban boards containing over 500 tasks per column.\n\n### Implementation Details\n- Wrap Kanban column task lists in `@tanstack/react-virtual` with dynamic row measurement.\n- Implement overscan padding of 5 items to ensure smooth 120Hz gesture scrolling without blank flashes.\n- Connect sortable refs with `@dnd-kit/core` without breaking active drag-and-drop handles.\n\n### Acceptance Criteria\n- [ ] Chrome DevTools Performance profile confirms steady 120 FPS on Apple Silicon displays.\n- [ ] Memory footprint remains constant when scrolling through 500+ items.\n- [ ] Dragging items across column boundaries maintains visual drop indicators.",
    hours: 14,
    priority: "High"
  },
  {
    title: "Refactor Clerk webhook endpoint with Svix raw body verification",
    desc: "### Objective\nFix intermittent webhook verification failures by ensuring raw unparsed request bodies are evaluated.\n\n### Technical Details\n- Register `/api/webhooks/clerk` before `express.json()` middleware using `express.raw({ type: 'application/json' })`.\n- Pass raw buffer and `svix-signature`, `svix-timestamp`, and `svix-id` headers to `Webhook.verify()`.\n- Implement idempotency cache to prevent duplicate user provisioning on webhook retries.\n\n### Acceptance Criteria\n- [ ] Svix verification passes 100% of the time on valid Clerk test payloads.\n- [ ] Returns HTTP 400 Bad Request on forged or expired signatures.\n- [ ] Successfully provisions user records in PostgreSQL within 50ms of `user.created` event.",
    hours: 8,
    priority: "High"
  },
  {
    title: "Write automated PostgreSQL migration harness with advisory locks",
    desc: "### Objective\nPrevent concurrent migration execution during multi-pod Kubernetes rolling deployments.\n\n### Technical Details\n- Acquire transactional PostgreSQL advisory lock (`pg_advisory_xact_lock(hashtext('kriri_migrations'))`) before evaluating migration versions.\n- Record migration version, checksum, and execution duration in `_migrations_history` table.\n- Roll back transaction immediately if any DDL statement fails.\n\n### Acceptance Criteria\n- [ ] Simultaneous execution from 3 concurrent pods results in exactly one migration run without deadlocks.\n- [ ] Failed migrations rollback cleanly without leaving partial tables.\n- [ ] Complete execution history logged with timestamps and execution durations.",
    hours: 10,
    priority: "Medium"
  },
  {
    title: "Implement pgvector semantic similarity search with HNSW indexing",
    desc: "### Objective\nProvide sub-10ms semantic document retrieval over workspace knowledge base items.\n\n### Technical Details\n- Enable `CREATE EXTENSION IF NOT EXISTS vector;` in primary database schema.\n- Store 1536-dimensional embeddings in `document_embeddings` table with `vector(1536)` column type.\n- Build HNSW index with parameters `m = 16, ef_construction = 64` using cosine distance operator (`<=>`).\n\n### Acceptance Criteria\n- [ ] Nearest neighbor vector similarity queries return top 5 matches in under 8ms.\n- [ ] Cosine similarity metric accurately ranks relevant task and project descriptions.\n- [ ] Automated script re-indexes embeddings when underlying documents are updated.",
    hours: 18,
    priority: "High"
  },
  {
    title: "Build coarse pointer media query hook in ActionTooltip",
    desc: "### Objective\nPrevent sticky tooltip popovers on touchscreen mobile devices and tablets.\n\n### Implementation Details\n- Evaluate `(pointer: coarse)` media query using standard browser APIs.\n- Call React hooks (`useState`, `useEffect`) unconditionally at the top of `ActionTooltip.jsx` to satisfy React Rules of Hooks.\n- Bypass Radix Tooltip rendering entirely when touch capability is detected.\n\n### Acceptance Criteria\n- [ ] Zero lingering tooltips after tapping buttons on iOS Safari and Android Chrome.\n- [ ] `oxlint` reports zero Rules of Hooks warnings or errors.\n- [ ] Desktop cursor hover interactions continue displaying tooltips with 150ms delay.",
    hours: 6,
    priority: "Medium"
  },
  {
    title: "Configure Prometheus metrics exporter for Node.js event loop lag",
    desc: "### Objective\nCapture real-time Node.js runtime metrics to monitor event loop starvation and garbage collection pauses.\n\n### Technical Details\n- Integrate `prom-client` collecting default metrics: `nodejs_eventloop_lag_seconds`, `nodejs_heap_size_used_bytes`, and `nodejs_gc_duration_seconds`.\n- Expose `/api/metrics` endpoint protected by basic authentication for Prometheus scraper.\n- Configure alert threshold when 99th percentile event loop lag exceeds 50ms for more than 2 minutes.\n\n### Acceptance Criteria\n- [ ] Prometheus server successfully scrapes metrics every 15 seconds.\n- [ ] Grafana dashboard visualizes heap utilization, active handle counts, and GC pauses.\n- [ ] Zero performance degradation observed on production application routes.",
    hours: 8,
    priority: "Medium"
  },
  {
    title: "Implement recursive SQL CTE for circular dependency prevention",
    desc: "### Objective\nEnsure tasks cannot be linked into infinite blocking loops (e.g. A blocks B, B blocks A).\n\n### Technical Details\n- Before inserting a record into `task_dependencies`, execute recursive Common Table Expression checking reachability from `depends_on_task_id` to `task_id`.\n- Reject circular submissions with HTTP 400 and clear error description.\n- Enforce unique compound constraint `UNIQUE(task_id, depends_on_task_id)`.\n\n### Acceptance Criteria\n- [ ] Direct circular links (A -> B, B -> A) rejected with 400.\n- [ ] Deep transitive circular links (A -> B -> C -> D -> A) rejected with 400.\n- [ ] Valid non-circular dependency trees insert cleanly in under 4ms.",
    hours: 10,
    priority: "High"
  },
  {
    title: "Design OKLCH color token system complying with WCAG 2.1 AA",
    desc: "### Objective\nDeliver accessible contrast ratios across all default and user-configured theme palettes.\n\n### Implementation Details\n- Calculate relative luminance in linear RGB space according to WCAG 2.1 specifications.\n- Enforce minimum 4.5:1 contrast for normal text and 3:1 for large headers and icons.\n- Generate dynamic dark mode background, surface, and elevated tokens based on primary accent.\n\n### Acceptance Criteria\n- [ ] 12-theme test matrix passes WCAG AA compliance across all UI surfaces.\n- [ ] Text remains crisp and legible on custom saturated background choices.\n- [ ] Theme changes transition smoothly with CSS custom properties without re-mounting the DOM.",
    hours: 12,
    priority: "Medium"
  },
  {
    title: "Implement optimistic task status updates in Kanban board",
    desc: "### Objective\nProvide instant 0ms visual feedback when users drag tasks between Kanban columns.\n\n### Implementation Details\n- Immediately update local React state and `DataStore` cache upon `@dnd-kit` drag completion.\n- Play subtle UI audio chime on drop.\n- Dispatch asynchronous PATCH request to `/api/tasks/:id` with new status.\n- Automatically roll back task to previous column and show toast notification if network request fails.\n\n### Acceptance Criteria\n- [ ] Zero perceptible lag between release gesture and card landing in target column.\n- [ ] Rapid consecutive moves queue correctly without race condition overwrites.\n- [ ] Network errors revert task position smoothly and alert user.",
    hours: 12,
    priority: "High"
  },
  {
    title: "Integrate OpenRouter fallback tiers (Nemotron -> Flint -> Gemma)",
    desc: "### Objective\nEnsure continuous AI Assistant availability during upstream provider outages or rate limits.\n\n### Technical Details\n- Configure primary tier: `nvidia/nemotron-3.5-super-vl:free`.\n- Configure secondary fallback: `recursive/flint-v1.0:free`.\n- Configure tertiary fallback: `google/gemma-4-26b-a4b-it:free`.\n- Intercept HTTP 429 and 503 status codes, logging telemetry and retrying downstream model within 350ms.\n\n### Acceptance Criteria\n- [ ] Upstream 429 immediately switches to secondary tier without user-facing error.\n- [ ] Circuit breaker trips to OPEN on sustained provider failure.\n- [ ] Audit logs accurately record which model tier serviced each conversation turn.",
    hours: 14,
    priority: "Urgent"
  },
  {
    title: "Build subtask progress rollup calculation trigger in PostgreSQL",
    desc: "### Objective\nAutomatically update parent issue completion percentage as subtasks are delivered.\n\n### Implementation Details\n- Query all child tasks where `parent_task_id = parent.id`.\n- Compute `progress = ROUND((completed_count / total_count) * 100)`.\n- Update parent record and broadcast `TASK_UPDATED` WebSocket event to active workspace members.\n\n### Acceptance Criteria\n- [ ] Parent progress updates to 100% when all subtasks reach 'Done'.\n- [ ] Adding new incomplete subtask decreases parent progress accurately.\n- [ ] WebSocket event notifies other connected browser tabs within 50ms.",
    hours: 8,
    priority: "Medium"
  },
  {
    title: "Sanitize Markdown description HTML rendering to prevent XSS",
    desc: "### Objective\nPrevent Cross-Site Scripting (XSS) vulnerabilities in user-generated task descriptions.\n\n### Technical Details\n- Configure `react-markdown` with strict rehype sanitization plugins.\n- Strip raw `<script>`, `<iframe>`, `onload`, and javascript-protocol href attributes.\n- Allow safe structural tags: `<h1>` through `<h6>`, `<p>`, `<ul>`, `<ol>`, `<code>`, `<pre>`, `<blockquote>`.\n\n### Acceptance Criteria\n- [ ] Malicious `<script>alert(1)</script>` payloads render safely as plain text.\n- [ ] Malicious `[click me](javascript:...)` links are sanitized or stripped.\n- [ ] Syntax-highlighted code blocks and markdown tables continue rendering correctly.",
    hours: 6,
    priority: "Urgent"
  },
  {
    title: "Implement fuzzy command palette search matching in under 2ms",
    desc: "### Objective\nProvide instantaneous ⌘K search across workspace projects, issues, and quick action commands.\n\n### Implementation Details\n- Build client-side scoring index incorporating word boundaries, acronym prefixes, and exact substring matches.\n- Rank exact matches highest, followed by prefix matches and fuzzy token distances.\n- Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`) remains locked to current query results.\n\n### Acceptance Criteria\n- [ ] Search filtering 1,000 items executes in under 2ms on typical client hardware.\n- [ ] Typing acronyms (e.g. 'K8s') matches 'Kubernetes Multi-Region Cluster'.\n- [ ] Esc key immediately dismisses palette and returns focus to previous element.",
    hours: 8,
    priority: "Medium"
  },
  {
    title: "Set up hermetic Docker BuildKit caching with multi-stage compilation",
    desc: "### Objective\nDrastically reduce CI container build times and minimize production image size.\n\n### Technical Details\n- Stage 1: Build dependencies and compile frontend Vite bundle.\n- Stage 2: Install production-only Node.js backend dependencies.\n- Stage 3: Minimal Node.js 22 Alpine runtime containing only required build artifacts.\n- Mount BuildKit cache for `/root/.npm`.\n\n### Acceptance Criteria\n- [ ] Final production container image size is under 180MB.\n- [ ] Container executes under non-root user `node` (UID 1000).\n- [ ] Unchanged dependencies rebuild in under 30 seconds using BuildKit cache.",
    hours: 10,
    priority: "Medium"
  },
  {
    title: "Implement Stripe webhook signature verification and idempotency",
    desc: "### Objective\nProcess subscription lifecycle events safely without duplicate transactions.\n\n### Technical Details\n- Verify `Stripe-Signature` header using `stripe.webhooks.constructEvent()`.\n- Store `stripe_event_id` in `billing_events` table with unique constraint.\n- Process `customer.subscription.updated` and `invoice.payment_succeeded` events inside database transactions.\n\n### Acceptance Criteria\n- [ ] Duplicate webhook delivery returns HTTP 200 without executing duplicate database mutations.\n- [ ] Tampered or invalid signatures return HTTP 400 immediately.\n- [ ] User organization plan entitlement updates in real-time.",
    hours: 12,
    priority: "High"
  },
  {
    title: "Add keyboard shortcut recorder in User Settings modal",
    desc: "### Objective\nAllow power users to customize hotkeys for common workspace operations.\n\n### Implementation Details\n- Capture keydown modifier combinations (`Meta`, `Ctrl`, `Alt`, `Shift` + Key).\n- Store custom shortcut map in `localStorage` scoped to active user ID.\n- Prevent browser shortcut collisions (e.g. warn on `Cmd+W`, `Cmd+Q`, `Cmd+R`).\n\n### Acceptance Criteria\n- [ ] Successfully records custom key combinations and displays clean visual badges.\n- [ ] Conflicting shortcuts prompt user with resolution dialog.\n- [ ] Reset to Defaults button restores standard Kriri hotkey bindings.",
    hours: 8,
    priority: "Low"
  },
  {
    title: "Implement database connection health check and auto-reconnect",
    desc: "### Objective\nEnsure backend recovers gracefully from transient PostgreSQL network disconnects.\n\n### Technical Details\n- Add `pool.on('error', ...)` handler logging connection drops.\n- Implement active query retry for read operations when connection reset occurs.\n- Update `/api/health` endpoint to perform `SELECT 1` query verification.\n\n### Acceptance Criteria\n- [ ] Sudden database restart recovers without terminating Express process.\n- [ ] Health check returns HTTP 503 during outage and recovers to 200 within 2 seconds of DB readiness.\n- [ ] Unhandled database errors are caught and transformed to structured 500 JSON.",
    hours: 6,
    priority: "Urgent"
  },
  {
    title: "Build interactive Human-in-the-Loop AI approval card in chat",
    desc: "### Objective\nRequire explicit user confirmation before autonomous AI tools perform state-modifying actions.\n\n### Technical Details\n- Tools like `delete_project`, `create_task`, and `assign_task` return `requires_approval: true` proposal cards.\n- Render `InlineDecisionCard` or `ApprovalCard` with action details, target project, and diff preview.\n- Clicking 'Confirm' executes the action and updates card state to 'Confirmed'.\n\n### Acceptance Criteria\n- [ ] Modifying tools are blocked until user clicks Confirm.\n- [ ] Read-only queries execute autonomously without prompting for approval.\n- [ ] Audit log records whether action was user-approved or auto-executed.",
    hours: 12,
    priority: "High"
  },
  {
    title: "Configure OpenTelemetry distributed tracing and W3C tracecontext",
    desc: "### Objective\nCorrelate frontend client requests with backend Express handlers and PostgreSQL queries.\n\n### Technical Details\n- Inject standard `traceparent` and `tracestate` headers into client `api.js` fetch wrapper.\n- Extract trace context in Express middleware and attach to Node.js `AsyncLocalStorage` context.\n- Instrument `pg` query runner to record SQL statement tags and query execution durations.\n\n### Acceptance Criteria\n- [ ] Jaeger UI visualizes end-to-end trace waterfalls showing browser, gateway, and database latencies.\n- [ ] Tracing overhead accounts for less than 1.5% CPU increase under 500 RPS load.\n- [ ] Trace IDs are included in structured 500 error responses for fast debugging.",
    hours: 14,
    priority: "High"
  },
  {
    title: "Implement PostgreSQL tsvector full-text search with GIN index",
    desc: "### Objective\nDeliver sub-5ms keyword search across task titles and markdown descriptions.\n\n### Implementation Details\n- Add `tsv_search tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED` column.\n- Create inverted GIN index: `CREATE INDEX idx_tasks_search ON tasks USING GIN (tsv_search)`.\n- Query with `websearch_to_tsquery('english', $1)` supporting boolean operators and exact phrase quotes.\n\n### Acceptance Criteria\n- [ ] Full-text query on 50,000 tasks returns top 20 ranked results in under 5ms.\n- [ ] Phrase searches (e.g. \"JWT rotation\") rank higher than single token matches.\n- [ ] GIN index automatically stays consistent without manual re-index cron jobs.",
    hours: 10,
    priority: "Medium"
  },
  {
    title: "Fix OAuth2 refresh token rotation race condition on parallel tabs",
    desc: "### Objective\nPrevent accidental user logout when multiple browser tabs refresh expired auth tokens concurrently.\n\n### Technical Details\n- Implement server-side grace period (30s) where the previous refresh token remains valid for parallel requests.\n- Implement client-side mutex promise locking in `api.js` to ensure only one refresh request fires at a time.\n- Share active refresh promise across tabs via `BroadcastChannel('kriri_token_refresh')`.\n\n### Acceptance Criteria\n- [ ] Opening 10 simultaneous tabs with expired tokens results in exactly one refresh request.\n- [ ] Zero 401 unauthenticated logout redirects triggered during parallel navigation.\n- [ ] Stolen refresh tokens are immediately revoked when reused outside the grace period.",
    hours: 8,
    priority: "Urgent"
  },
  {
    title: "Optimize virtualized Gantt timeline canvas rendering with OffscreenCanvas",
    desc: "### Objective\nMaintain 120 FPS timeline panning across projects spanning multi-year roadmaps.\n\n### Implementation Details\n- Offload timeline track and milestone bar rendering to Web Worker using `OffscreenCanvas`.\n- Rasterize date headers and milestone markers into offscreen bitmap buffers.\n- Bind mouse wheel and pinch-to-zoom gestures to canvas transform matrix with zero DOM allocations.\n\n### Acceptance Criteria\n- [ ] Smooth 120Hz panning on Apple Silicon ProMotion displays with zero dropped frames.\n- [ ] Memory footprint remains steady under 60MB when viewing 200+ parallel project tracks.\n- [ ] Panning and zooming remain responsive during heavy background WebSocket ingestion.",
    hours: 16,
    priority: "High"
  },
  {
    title: "Implement WebSocket heartbeat ping/pong with exponential backoff",
    desc: "### Objective\nInstantly detect silent TCP connection drops when laptops sleep or switch Wi-Fi networks.\n\n### Implementation Details\n- Send client heartbeat ping every 25 seconds; expect server pong within 5 seconds.\n- Trigger socket reconnect with exponential backoff and randomized jitter (1s, 2s, 4s, 8s, max 30s) on missed pong.\n- Buffer outgoing client mutations in indexedDB queue while disconnected, flushing atomically on reconnect.\n\n### Acceptance Criteria\n- [ ] UI shows subtle reconnecting indicator within 6 seconds of network disconnection.\n- [ ] Reconnecting resumes active room subscription without page refresh.\n- [ ] Zero lost user edits during transient tunnel reconnects.",
    hours: 8,
    priority: "Medium"
  },
  {
    title: "Audit and eliminate memory leaks in React Virtual List DOM recycling",
    desc: "### Objective\nPrevent progressive JavaScript heap growth during extended 8-hour user sessions.\n\n### Implementation Details\n- Take baseline and 100-scroll heap snapshots using Chrome DevTools Memory Profiler.\n- Clean up dangling event listeners and resize observer subscriptions in detached virtual items.\n- Ensure `ActionTooltip` portal roots are destroyed upon task unmounting.\n\n### Acceptance Criteria\n- [ ] Heap size returns to baseline within 5% after scrolling through 1,000 tasks.\n- [ ] Zero detached HTML nodes detected in Chrome DevTools heap snapshot comparison.\n- [ ] Lighthouse Performance score maintains 98+ on production dashboard.",
    hours: 12,
    priority: "High"
  },
  {
    title: "Implement accessible keyboard focus trap for modal dialogs",
    desc: "### Objective\nGuarantee WCAG 2.1 AA keyboard navigation compliance in all task and project dialogs.\n\n### Technical Details\n- Trap `Tab` and `Shift+Tab` focus cycles within `TaskDetailsModal` and `CreateTaskModal`.\n- Restore keyboard focus to triggering DOM element when modal is dismissed via `Escape`.\n- Apply `aria-modal=\"true\"` and `role=\"dialog\"` attributes to dialog root containers.\n\n### Acceptance Criteria\n- [ ] Screen readers announce modal title and initial focused input upon opening.\n- [ ] Tab key cannot navigate outside modal boundaries while modal is visible.\n- [ ] VoiceOver and NVDA accessibility audits pass with zero accessibility violations.",
    hours: 6,
    priority: "Medium"
  },
  {
    title: "Configure Redis Cluster automatic failover handling with Sentinel",
    desc: "### Objective\nEnsure rate limiters and real-time pub/sub remain operational during master Redis node failures.\n\n### Technical Details\n- Deploy 3-node Redis Sentinel cluster monitoring primary read/write nodes.\n- Configure `ioredis` client with Sentinel service discovery and automatic master role renegotiation.\n- Implement client command retry with backoff during 2-second failover elections.\n\n### Acceptance Criteria\n- [ ] Killing primary Redis container results in zero HTTP 500 errors returned to API clients.\n- [ ] Sentinel promotes replica to master and updates client connections in under 2.5 seconds.\n- [ ] Rate-limiting token bucket states survive failover with zero lost quota tokens.",
    hours: 14,
    priority: "High"
  },
  {
    title: "Implement S3 chunked resumable file upload mechanism with checksums",
    desc: "### Objective\nSupport reliable large video and design file attachments up to 2GB.\n\n### Implementation Details\n- Split files larger than 10MB into 5MB chunks using browser Blob slice API.\n- Request pre-signed S3 Part URLs with `Content-MD5` verification for each slice.\n- Call `CompleteMultipartUpload` upon final chunk delivery and record attachment metadata in PostgreSQL.\n\n### Acceptance Criteria\n- [ ] Pausing and resuming 500MB upload completes successfully across network dropouts.\n- [ ] Corrupted chunks are automatically detected and re-uploaded before final assembly.\n- [ ] File metadata and thumbnail URLs update on task card within 200ms of completion.",
    hours: 12,
    priority: "Medium"
  },
  {
    title: "Build automated PR preview environment deployment pipeline",
    desc: "### Objective\nSpin up isolated staging preview deployments for every frontend pull request.\n\n### Technical Details\n- Trigger Cloudflare Pages / Vercel preview build on GitHub `pull_request` webhook.\n- Post ephemeral preview URL comment to GitHub PR with automated Lighthouse audit summary.\n- Destroy preview infrastructure when PR is closed or merged.\n\n### Acceptance Criteria\n- [ ] Pull request builds complete and post preview link in under 90 seconds.\n- [ ] Isolated preview environment connects to dedicated test database schema.\n- [ ] Zero stale preview containers left running after PR merge.",
    hours: 10,
    priority: "Low"
  }
];

// --- REALISTIC NOTIFICATION TEMPLATES (50 Total) ---
const NOTIFICATION_TEMPLATES = [
  {
    type: "mention",
    title: "mentioned you on",
    msgTpl: (user, task) => `@${user.name.split(" ")[0].toLowerCase()} can you verify the acceptance criteria on '${task.title}'? The staging environment is ready.`,
    actorKey: "alex"
  },
  {
    type: "assignment",
    title: "assigned an issue to you:",
    msgTpl: (user, task) => `Sarah Chen assigned '${task.title}' to you for the upcoming sprint milestone.`,
    actorKey: "sarah"
  },
  {
    type: "status_change",
    title: "moved task to In Review:",
    msgTpl: (user, task) => `David Kim marked '${task.title}' as ready for testing and code review.`,
    actorKey: "david"
  },
  {
    type: "comment",
    title: "commented on your issue:",
    msgTpl: (user, task) => `Alex Rivera: "Confirmed passing all 48 test suites. Merging branch into main now." (${task.title})`,
    actorKey: "alex"
  },
  {
    type: "review_requested",
    title: "requested your code review on",
    msgTpl: (user, task) => `Pull request #42 is ready for architecture sign-off on '${task.title}'.`,
    actorKey: "sarah"
  },
  {
    type: "due_date",
    title: "upcoming milestone deadline:",
    msgTpl: (user, task) => `Reminder: '${task.title}' is scheduled for completion within 48 hours.`,
    actorKey: "david"
  },
  {
    type: "mention",
    title: "tagged you in architecture discussion:",
    msgTpl: (user, task) => `@${user.name.split(" ")[0].toLowerCase()} we need your approval on the database schema changes for '${task.title}'.`,
    actorKey: "alex"
  },
  {
    type: "status_change",
    title: "completed project task:",
    msgTpl: (user, task) => `Sarah Chen verified and marked '${task.title}' as Delivered and Done.`,
    actorKey: "sarah"
  }
];

async function seedDenseTestData() {
  console.log("==========================================================");
  console.log("🚀 KRIRI HIGH-VOLUME PRODUCTION SEEDING ENGINE STARTING");
  console.log("==========================================================");

  const client = await db.pool.connect();
  try {
    // 1. ISOLATE TARGET USER: smartjones07@gmail.com
    console.log("\n[Step 1: Identifying Target User & Primary Workspace]...");
    const userRes = await client.query(
      "SELECT id, name, email, clerk_user_id, username, role FROM users WHERE email = $1",
      ["smartjones07@gmail.com"]
    );
    if (userRes.rows.length === 0) {
      throw new Error("Target user smartjones07@gmail.com not found in database.");
    }
    const targetUser = userRes.rows[0];
    console.log(`✓ Target User: ${targetUser.name} (${targetUser.email}, ID: ${targetUser.id}, Clerk: ${targetUser.clerk_user_id})`);

    // Target the primary workspace: 'Software Development' (clerk org: org_3KQ5pTClVdih5ARRLe2kMEL0Zog, ID: 10)
    let wsRes = await client.query(
      `SELECT id, name, slug, clerk_org_id, owner_id 
       FROM workspaces 
       WHERE (owner_id = $1 OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = $1))
         AND name = 'Software Development'
       ORDER BY id DESC LIMIT 1`,
      [targetUser.id]
    );

    if (wsRes.rows.length === 0) {
      wsRes = await client.query(
        `SELECT id, name, slug, clerk_org_id, owner_id 
         FROM workspaces 
         WHERE owner_id = $1 
         ORDER BY id DESC LIMIT 1`,
        [targetUser.id]
      );
    }

    if (wsRes.rows.length === 0) {
      throw new Error("No active workspace found for smartjones07@gmail.com.");
    }

    const targetWorkspace = wsRes.rows[0];
    console.log(`✓ Isolated Target Workspace: "${targetWorkspace.name}" (ID: ${targetWorkspace.id}, Slug: ${targetWorkspace.slug}, Clerk Org: ${targetWorkspace.clerk_org_id || "None"})`);

    // 2. RETRIEVE OR PROVISION WORKSPACE TEAM MEMBERS
    console.log("\n[Step 2: Resolving Workspace Team Members]...");
    // Ensure standard team users exist in database
    await client.query(`
      INSERT INTO users (clerk_user_id, name, email, role, status) VALUES
      ('user_seed_alex', 'Alex Rivera', 'alex@kriri.app', 'Member', 'Active'),
      ('user_seed_sarah', 'Sarah Chen', 'sarah@kriri.app', 'Member', 'Active'),
      ('user_seed_david', 'David Kim', 'david@kriri.app', 'Member', 'Active')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, status = 'Active'
    `);

    // Ensure all team members belong to target workspace
    await client.query(`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      SELECT $1, id, CASE WHEN id = $2 THEN 'Owner' ELSE 'Member' END
      FROM users WHERE email IN ('smartjones07@gmail.com', 'alex@kriri.app', 'sarah@kriri.app', 'david@kriri.app')
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `, [targetWorkspace.id, targetUser.id]);

    const membersRes = await client.query(
      `SELECT u.id, u.name, u.email, u.clerk_user_id, wm.role 
       FROM workspace_members wm 
       JOIN users u ON wm.user_id = u.id 
       WHERE wm.workspace_id = $1`,
      [targetWorkspace.id]
    );

    const team = membersRes.rows;
    console.log(`✓ Active Workspace Members: ${team.length} members loaded`);
    team.forEach(m => console.log(`   • ${m.name} (${m.email}, User ID: ${m.id}, Code: ${getUserIdentifierCode(m.name)})`));

    const memberMapByCode = {};
    team.forEach(m => {
      const code = getUserIdentifierCode(m.name);
      memberMapByCode[code] = m;
    });

    // 3. TARGET ISOLATION & DATA WIPE (TRANSACTION PROTECTED)
    console.log("\n[Step 3: Safely Executing Wipe for Target Workspace Only]...");
    await client.query("BEGIN");

    // Count records to be deleted for audit log
    const prevProjCount = await client.query("SELECT COUNT(*) FROM projects WHERE workspace_id = $1", [targetWorkspace.id]);
    const prevTaskCount = await client.query("SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id = $1", [targetWorkspace.id]);
    const prevNotifCount = await client.query("SELECT COUNT(*) FROM notifications WHERE workspace_id = $1", [targetWorkspace.id]);

    // Delete in foreign-key safe cascade order
    await client.query("DELETE FROM task_dependencies WHERE workspace_id = $1", [targetWorkspace.id]);
    await client.query(
      "DELETE FROM comments WHERE task_id IN (SELECT t.id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id = $1)",
      [targetWorkspace.id]
    );
    await client.query(
      "DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE workspace_id = $1)",
      [targetWorkspace.id]
    );
    await client.query(
      "DELETE FROM milestones WHERE project_id IN (SELECT id FROM projects WHERE workspace_id = $1)",
      [targetWorkspace.id]
    );
    await client.query(
      "DELETE FROM project_members WHERE project_id IN (SELECT id FROM projects WHERE workspace_id = $1)",
      [targetWorkspace.id]
    );
    await client.query("DELETE FROM notifications WHERE workspace_id = $1", [targetWorkspace.id]);
    await client.query("DELETE FROM projects WHERE workspace_id = $1", [targetWorkspace.id]);

    console.log(`✓ Data wipe complete for workspace ID ${targetWorkspace.id}:`);
    console.log(`   - Projects cleared: ${prevProjCount.rows[0].count}`);
    console.log(`   - Tasks cleared: ${prevTaskCount.rows[0].count}`);
    console.log(`   - Notifications cleared: ${prevNotifCount.rows[0].count}`);

    // 4. GENERATE 60 FULLY POPULATED PROJECTS (KRI-{USER_CODE}-{INDEX})
    console.log("\n[Step 4: Seeding Exactly 60 High-Density Realistic Projects]...");
    const identifierCounters = {};
    const createdProjects = [];

    let projPosition = 0;
    for (const pData of PROJECTS_DATA) {
      projPosition++;
      const creator = memberMapByCode[pData.leadCode] || targetUser;
      const userCode = getUserIdentifierCode(creator.name);
      identifierCounters[userCode] = (identifierCounters[userCode] || 0) + 1;
      const identifier = `KRI-${userCode}-${identifierCounters[userCode]}`;
      const slug = `${slugify(pData.name)}-${String(projPosition).padStart(2, "0")}`;

      // Calculate start and due dates in pure JS
      const daysAgo = Math.floor(Math.random() * 60) + 10;
      const dueDaysOffset = pData.status === "Done" ? -Math.floor(Math.random() * 15) : Math.floor(Math.random() * 45) + 5;
      const startDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + dueDaysOffset * 86400000).toISOString().split("T")[0];
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const updatedAt = new Date(Date.now() - Math.max(1, daysAgo - 5) * 86400000).toISOString();

      const pRes = await client.query(
        `INSERT INTO projects (
           workspace_id, name, slug, identifier, description, short_summary,
           owner_id, lead_id, status, health, priority, progress, labels,
           position, start_date, due_date, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
           $15, $16, $17, $18
         ) RETURNING id, name, slug, identifier, status, health, priority, progress, lead_id`,
        [
          targetWorkspace.id,
          pData.name,
          slug,
          identifier,
          pData.desc,
          pData.summary,
          creator.id,
          creator.id,
          pData.status,
          pData.health,
          pData.priority,
          pData.progress,
          JSON.stringify(pData.labels),
          projPosition,
          startDate,
          dueDate,
          createdAt,
          updatedAt
        ]
      );

      const newProj = pRes.rows[0];
      createdProjects.push(newProj);

      // Add project members for avatar stacks
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role)
        VALUES ($1, $2, 'Project Manager')
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [newProj.id, creator.id]);

      // Assign additional collaborators
      for (const m of team) {
        if (m.id !== creator.id && Math.random() > 0.4) {
          await client.query(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ($1, $2, 'Member')
            ON CONFLICT (project_id, user_id) DO NOTHING
          `, [newProj.id, m.id]);
        }
      }
    }

    console.log(`✓ Successfully seeded exactly ${createdProjects.length} projects.`);

    // 5. GENERATE EXACTLY 200 FULLY POPULATED TASKS
    console.log("\n[Step 5: Seeding Exactly 200 Realistically Distributed Tasks]...");
    const TOTAL_TASKS_TARGET = 200;
    const createdTasks = [];

    // Kanban status distribution: 50 Todo, 60 In Progress, 40 In Review, 50 Done = 200
    const STATUS_DISTRIBUTION = [
      ...Array(50).fill("Todo"),
      ...Array(60).fill("In Progress"),
      ...Array(40).fill("In Review"),
      ...Array(50).fill("Done"),
    ];

    let taskPosition = 0;
    for (let i = 0; i < TOTAL_TASKS_TARGET; i++) {
      taskPosition++;
      const baseTpl = TASK_TEMPLATES[i % TASK_TEMPLATES.length];
      const project = createdProjects[i % createdProjects.length];
      const status = STATUS_DISTRIBUTION[i];

      // Assignee distribution: target user gets ~40%, team members get remainder, 5% unassigned
      let assignee = null;
      const assignRoll = Math.random();
      if (assignRoll < 0.45) {
        assignee = targetUser;
      } else if (assignRoll < 0.95) {
        assignee = team[i % team.length];
      }

      const reporter = targetUser;

      // Calculate realistic progress percentage matching Kanban column
      let progress = 0;
      if (status === "Done") progress = 100;
      else if (status === "In Review") progress = 85;
      else if (status === "In Progress") progress = Math.floor(Math.random() * 50) + 25;
      else progress = 0;

      // Dates & Overdue Simulation: 25 tasks past scheduled due date
      const daysAgo = Math.floor(Math.random() * 45) + 5;
      let dueOffset = 0;
      if (status === "Done") {
        dueOffset = -Math.floor(Math.random() * 10) - 2;
      } else if (i < 25) {
        // First 25 tasks are overdue (past due date)
        dueOffset = -Math.floor(Math.random() * 8) - 1;
      } else {
        dueOffset = Math.floor(Math.random() * 30) + 2;
      }

      const cycleNum = Math.floor(i / TASK_TEMPLATES.length);
      const suffix = cycleNum > 0 ? ` (Phase ${cycleNum + 1})` : "";
      const taskTitle = `${baseTpl.title}${suffix}`;
      const taskDesc = `${baseTpl.desc}\n\n*Scoped specifically for project ${project.name} (${project.identifier}). Acceptance criteria verified by lead.*`;

      const startDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + dueOffset * 86400000).toISOString().split("T")[0];
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const updatedAt = new Date(Date.now() - Math.max(1, daysAgo - 2) * 86400000).toISOString();
      const completedAt = status === "Done" ? new Date(Date.now() - Math.max(1, daysAgo - 1) * 86400000).toISOString() : null;

      const tRes = await client.query(
        `INSERT INTO tasks (
           project_id, title, description, status, priority, assignee_id, reporter_id,
           start_date, due_date, estimated_hours, actual_hours, progress, position,
           completed_at, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4::varchar, $5::varchar, $6, $7,
           $8, $9, $10, $11, $12, $13,
           $14, $15, $16
         ) RETURNING id, project_id, title, status, priority, assignee_id, due_date, description`,
        [
          project.id,
          taskTitle,
          taskDesc,
          status,
          baseTpl.priority,
          assignee ? assignee.id : null,
          reporter.id,
          startDate,
          dueDate,
          baseTpl.hours,
          status === "Done" ? baseTpl.hours : Math.floor(baseTpl.hours * (progress / 100)),
          progress,
          taskPosition,
          completedAt,
          createdAt,
          updatedAt
        ]
      );

      const createdTask = tRes.rows[0];
      // Attach project identifier for audit log
      createdTask.project_identifier = project.identifier;
      createdTasks.push(createdTask);
    }

    console.log(`✓ Successfully seeded exactly ${createdTasks.length} tasks across ${createdProjects.length} projects.`);

    // 6. GENERATE KEY MILESTONES & DEPENDENCIES
    console.log("\n[Step 6: Seeding Project Milestones & Critical Path Dependencies]...");
    const sampleMilestones = [
      { name: "M1: Architecture Blueprint & Threat Model", status: "Done", offset: -20 },
      { name: "M2: Core API & Real-time WebSockets", status: "Done", offset: -5 },
      { name: "M3: 120Hz Frontend Optimization & Caching", status: "In Progress", offset: 12 },
      { name: "M4: Security Review & Production Cutover", status: "Pending", offset: 30 },
    ];

    for (let i = 0; i < Math.min(15, createdProjects.length); i++) {
      const proj = createdProjects[i];
      for (const m of sampleMilestones) {
        const mDueDate = new Date(Date.now() + m.offset * 86400000).toISOString().split("T")[0];
        await client.query(`
          INSERT INTO milestones (project_id, name, description, due_date, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [proj.id, m.name, `Delivery milestone for ${proj.name}`, mDueDate, m.status]);
      }
    }

    // Add 20 non-circular dependencies
    for (let i = 0; i < 20; i++) {
      const t1 = createdTasks[i * 2];
      const t2 = createdTasks[i * 2 + 1];
      if (t1 && t2 && t1.id !== t2.id) {
        await client.query(`
          INSERT INTO task_dependencies (workspace_id, task_id, depends_on_task_id, type)
          VALUES ($1, $2, $3, 'blocks')
          ON CONFLICT (task_id, depends_on_task_id) DO NOTHING
        `, [targetWorkspace.id, t1.id, t2.id]);
      }
    }
    console.log(`✓ Milestones and task dependency relationships provisioned.`);

    // 7. GENERATE EXACTLY 50 REALISTIC INBOX NOTIFICATIONS
    console.log("\n[Step 7: Seeding Exactly 50 Realistic Inbox Notifications]...");
    const TOTAL_NOTIFICATIONS_TARGET = 50;
    const createdNotifications = [];

    const actorTeam = team.filter(m => m.id !== targetUser.id);
    for (let i = 0; i < TOTAL_NOTIFICATIONS_TARGET; i++) {
      const tpl = NOTIFICATION_TEMPLATES[i % NOTIFICATION_TEMPLATES.length];
      const actor = actorTeam[i % actorTeam.length] || team[0];
      const task = createdTasks[i % createdTasks.length];
      const isRead = i >= 20; // 20 Unread, 30 Read
      const minutesAgo = (i * 120) + 15; // Staggered over past 5 days
      const createdAt = new Date(Date.now() - minutesAgo * 60000).toISOString();

      const fullTitle = `${actor.name} ${tpl.title} "${task.title.slice(0, 48)}..."`;
      const fullMsg = tpl.msgTpl(targetUser, task);

      const nRes = await client.query(
        `INSERT INTO notifications (
           workspace_id, user_id, actor_id, type, title, message,
           entity_type, entity_id, is_read, created_at
         ) VALUES (
           $1, $2, $3, $4::varchar, $5, $6,
           'task', $7, $8, $9
         ) RETURNING id, type, title, is_read, entity_id, created_at`,
        [
          targetWorkspace.id,
          targetUser.clerk_user_id,
          actor.clerk_user_id,
          tpl.type,
          fullTitle,
          fullMsg,
          task.id,
          isRead,
          createdAt
        ]
      );

      createdNotifications.push(nRes.rows[0]);
    }

    console.log(`✓ Successfully seeded exactly ${createdNotifications.length} notifications (${createdNotifications.filter(n => !n.is_read).length} unread).`);

    // COMMIT TRANSACTION
    await client.query("COMMIT");
    console.log("\n✓ Transaction successfully committed to PostgreSQL database.");

    // 8. FINAL DATABASE VERIFICATION AUDIT
    console.log("\n==========================================================");
    console.log("📊 FINAL DATABASE VERIFICATION AUDIT");
    console.log("==========================================================");

    const auditProjects = await client.query("SELECT COUNT(*) FROM projects WHERE workspace_id = $1", [targetWorkspace.id]);
    const auditTasks = await client.query("SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id = $1", [targetWorkspace.id]);
    const auditNotifications = await client.query(
      "SELECT COUNT(*) FROM notifications WHERE workspace_id = $1 AND user_id = $2",
      [targetWorkspace.id, targetUser.clerk_user_id]
    );
    const auditUnreadNotifs = await client.query(
      "SELECT COUNT(*) FROM notifications WHERE workspace_id = $1 AND user_id = $2 AND is_read = false",
      [targetWorkspace.id, targetUser.clerk_user_id]
    );
    const auditStatus = await client.query(
      `SELECT t.status, COUNT(*) as count 
       FROM tasks t JOIN projects p ON t.project_id = p.id 
       WHERE p.workspace_id = $1 
       GROUP BY t.status ORDER BY count DESC`,
      [targetWorkspace.id]
    );

    const auditEmptyDesc = await client.query(
      `SELECT COUNT(*) as count 
       FROM tasks t JOIN projects p ON t.project_id = p.id 
       WHERE p.workspace_id = $1 AND (t.description IS NULL OR t.description = '')`,
      [targetWorkspace.id]
    );

    console.log(`- Workspace: ${targetWorkspace.name} (ID: ${targetWorkspace.id})`);
    console.log(`- Total Projects: ${auditProjects.rows[0].count}`);
    console.log(`- Total Tasks: ${auditTasks.rows[0].count}`);
    console.log(`- Empty Descriptions Count: ${auditEmptyDesc.rows[0].count} (MUST BE 0)`);
    console.log(`- Total Notifications: ${auditNotifications.rows[0].count} (${auditUnreadNotifs.rows[0].count} Unread)`);
    console.log(`- Task Breakdown:`);
    auditStatus.rows.forEach(r => console.log(`   • ${r.status}: ${r.count}`));

    return {
      workspace: targetWorkspace,
      user: targetUser,
      projects: createdProjects,
      tasks: createdTasks,
      notifications: createdNotifications,
      counts: {
        deletedProjects: parseInt(prevProjCount.rows[0].count, 10),
        deletedTasks: parseInt(prevTaskCount.rows[0].count, 10),
        deletedNotifications: parseInt(prevNotifCount.rows[0].count, 10),
        seededProjects: parseInt(auditProjects.rows[0].count, 10),
        seededTasks: parseInt(auditTasks.rows[0].count, 10),
        seededNotifications: parseInt(auditNotifications.rows[0].count, 10),
        unreadNotifications: parseInt(auditUnreadNotifs.rows[0].count, 10),
      }
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("FATAL: Seeding failed, rolled back transaction:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDenseTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDenseTestData };
