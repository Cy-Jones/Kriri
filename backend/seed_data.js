const db = require("./src/config/database");

async function seed() {
  console.log("Seeding realistic data for smartjones07@gmail.com...");

  // 1. Find user smartjones07@gmail.com
  const userRes = await db.query(
    "SELECT id, name, email FROM users WHERE email = 'smartjones07@gmail.com'",
  );
  if (userRes.rows.length === 0) {
    console.error("User smartjones07@gmail.com not found!");
    process.exit(1);
  }
  const cyrus = userRes.rows[0];
  console.log(`Found user: ${cyrus.name} (id: ${cyrus.id})`);

  // Ensure other team members exist
  await db.query(`
    INSERT INTO users (clerk_user_id, name, email, avatar_url, role) VALUES
    ('user_seed_alex', 'Alex Rivera', 'alex@acme.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'Member'),
    ('user_seed_sarah', 'Sarah Chen', 'sarah@acme.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces', 'Member'),
    ('user_seed_david', 'David Kim', 'david@acme.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'Member')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url;
  `);

  const teamRes = await db.query(
    "SELECT id, name, email FROM users WHERE email IN ('smartjones07@gmail.com', 'alex@acme.com', 'sarah@acme.com', 'david@acme.com', 'mbarry20061@gmail.com')",
  );
  const userMap = {};
  teamRes.rows.forEach((u) => {
    userMap[u.email] = u.id;
  });

  const memberIds = teamRes.rows.map((u) => u.id);

  // 2. Identify all workspaces
  const wsRes = await db.query(
    `SELECT id, name, slug FROM workspaces ORDER BY id ASC`,
  );
  let targetWorkspaces = wsRes.rows;

  console.log(
    `Target workspaces:`,
    targetWorkspaces.map((w) => `${w.name} (id: ${w.id})`),
  );

  for (const ws of targetWorkspaces) {
    console.log(`\n--- Seeding workspace: ${ws.name} (id: ${ws.id}) ---`);

    // Ensure all team members belong to this workspace
    for (const mId of memberIds) {
      await db.query(
        `INSERT INTO workspace_members (workspace_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (workspace_id, user_id) DO NOTHING`,
        [ws.id, mId, mId === cyrus.id ? "Owner" : "Member"],
      );
    }

    // Projects list
    const projectsData = [
      {
        name: "Core API Gateway & Routing",
        slug: "core-api-gateway",
        description:
          "High-throughput unified reverse proxy handling authentication, rate limiting, and request normalization for all backend services.",
        short_summary: "High-throughput API Gateway & edge routing proxy",
        status: "In Progress",
        health: "On Track",
        priority: "High",
        progress: 72,
        labels: ["backend", "infra", "security"],
        lead_id: cyrus.id,
        daysAgo: 24,
      },
      {
        name: "Real-time Notification Engine",
        slug: "realtime-notification-engine",
        description:
          "Event-driven WebSocket and push notification pipeline for issue assignments, mentions, and project updates.",
        short_summary: "Real-time WebSocket alerts and inbox feed",
        status: "In Progress",
        health: "On Track",
        priority: "High",
        progress: 65,
        labels: ["websockets", "backend", "notifications"],
        lead_id: userMap["alex@acme.com"] || cyrus.id,
        daysAgo: 21,
      },
      {
        name: "Enterprise Single Sign-On (SAML/Okta)",
        slug: "enterprise-sso",
        description:
          "SAML 2.0 and OIDC identity federation allowing enterprise workspaces to connect Google Workspace, Okta, and Azure AD.",
        short_summary: "SAML 2.0 and OIDC identity federation",
        status: "Planned",
        health: "On Track",
        priority: "Medium",
        progress: 25,
        labels: ["security", "auth", "enterprise"],
        lead_id: cyrus.id,
        daysAgo: 14,
      },
      {
        name: "Design System v2 & OKLCH Theme",
        slug: "design-system-v2",
        description:
          "Complete design tokens migration to OKLCH perceptual color space, hairline charts, and accessible contrast palettes.",
        short_summary: "Design tokens, typography scale, and dark mode palette",
        status: "Done",
        health: "On Track",
        priority: "High",
        progress: 100,
        labels: ["frontend", "design", "tokens"],
        lead_id: userMap["sarah@acme.com"] || cyrus.id,
        daysAgo: 30,
      },
      {
        name: "NextGen Mobile Application",
        slug: "nextgen-mobile-app",
        description:
          "Cross-platform Flutter application bringing the core Kriri issues and project tracker experience to iOS and Android.",
        short_summary: "iOS & Android companion mobile client",
        status: "In Progress",
        health: "At Risk",
        priority: "High",
        progress: 48,
        labels: ["mobile", "flutter", "ios", "android"],
        lead_id: userMap["david@acme.com"] || cyrus.id,
        daysAgo: 18,
      },
      {
        name: "PostgreSQL High Availability & Pooling",
        slug: "postgres-ha-clustering",
        description:
          "Database connection pooling optimization with PgBouncer, replication failover, and automated read-replica routing.",
        short_summary: "Database connection pooling and failover configuration",
        status: "Done",
        health: "On Track",
        priority: "High",
        progress: 100,
        labels: ["database", "devops", "performance"],
        lead_id: cyrus.id,
        daysAgo: 28,
      },
      {
        name: "AI Copilot & Workflow Automation",
        slug: "ai-copilot-engine",
        description:
          "Autonomous assistant providing automated task summarization, milestone forecasting, and duplicate issue triage.",
        short_summary: "Automated issue triage and milestone forecasting",
        status: "In Progress",
        health: "On Track",
        priority: "Medium",
        progress: 55,
        labels: ["ai", "gemini", "automation"],
        lead_id: cyrus.id,
        daysAgo: 16,
      },
      {
        name: "Billing & Stripe Subscription Portal",
        slug: "billing-and-subscriptions",
        description:
          "Stripe Customer Portal integration supporting tiered team seats, annual invoicing, and automated receipt dispatch.",
        short_summary: "Stripe checkout, usage metering, and seat licensing",
        status: "Done",
        health: "On Track",
        priority: "Medium",
        progress: 100,
        labels: ["billing", "stripe", "revenue"],
        lead_id: userMap["alex@acme.com"] || cyrus.id,
        daysAgo: 26,
      },
      {
        name: "Granular RBAC & Permission Matrix",
        slug: "granular-rbac",
        description:
          "Hierarchical permission system allowing custom roles (Owner, Admin, Project Manager, Member, Viewer, Guest) across projects.",
        short_summary: "Role-based access control and workspace scoping",
        status: "Done",
        health: "On Track",
        priority: "High",
        progress: 100,
        labels: ["security", "auth", "rbac"],
        lead_id: cyrus.id,
        daysAgo: 25,
      },
      {
        name: "Kubernetes Multi-Region Deployment",
        slug: "k8s-multi-region",
        description:
          "Terraform-managed GKE clusters across US-East, EU-West, and Asia-South with Global Anycast Load Balancers.",
        short_summary: "Multi-cluster container orchestration and global ingress",
        status: "Planned",
        health: "Off Track",
        priority: "Low",
        progress: 15,
        labels: ["infra", "kubernetes", "gcp"],
        lead_id: userMap["david@acme.com"] || cyrus.id,
        daysAgo: 10,
      },
      {
        name: "Developer Documentation & OpenAPI Specs",
        slug: "dev-docs-and-specs",
        description:
          "Interactive REST and WebSocket API documentation generated directly from Zod schema definitions with try-it-out console.",
        short_summary: "Interactive OpenAPI documentation & developer guides",
        status: "In Progress",
        health: "On Track",
        priority: "Medium",
        progress: 80,
        labels: ["docs", "api", "dx"],
        lead_id: userMap["sarah@acme.com"] || cyrus.id,
        daysAgo: 20,
      },
      {
        name: "Semantic Vector Search & Indexing",
        slug: "semantic-vector-search",
        description:
          "Hybrid keyword and embedding-based search for instant issue discovery, project indexing, and code references.",
        short_summary: "Instant full-text and semantic issue search",
        status: "In Progress",
        health: "On Track",
        priority: "High",
        progress: 60,
        labels: ["search", "embeddings", "backend"],
        lead_id: cyrus.id,
        daysAgo: 15,
      },
      {
        name: "SOC2 Compliance & Immutable Audit Log",
        slug: "soc2-audit-logging",
        description:
          "Tamper-evident cryptographically signed audit logging tracking every membership change, project export, and privilege grant.",
        short_summary: "Tamper-evident workspace security audit trail",
        status: "In Progress",
        health: "On Track",
        priority: "High",
        progress: 68,
        labels: ["security", "compliance", "audit"],
        lead_id: cyrus.id,
        daysAgo: 19,
      },
      {
        name: "Automated CI/CD Pipeline Overhaul",
        slug: "cicd-pipeline-overhaul",
        description:
          "GitHub Actions pipelines with parallelized build matrix, container caching, automated security scans, and preview deployments.",
        short_summary: "Optimized test runner and preview deployment builds",
        status: "Done",
        health: "On Track",
        priority: "Medium",
        progress: 100,
        labels: ["devops", "ci-cd", "github"],
        lead_id: userMap["alex@acme.com"] || cyrus.id,
        daysAgo: 27,
      },
      {
        name: "Data Warehouse ETL & BigQuery Sync",
        slug: "data-warehouse-etl",
        description:
          "Continuous change-data-capture pipeline streaming workspace analytics and telemetry into BigQuery for reporting.",
        short_summary: "Change-data-capture analytics pipeline to BigQuery",
        status: "Planned",
        health: "On Track",
        priority: "Medium",
        progress: 30,
        labels: ["data", "etl", "bigquery"],
        lead_id: userMap["david@acme.com"] || cyrus.id,
        daysAgo: 12,
      },
      {
        name: "Dark Mode & Accessibility (WCAG 2.1)",
        slug: "wcag-accessibility",
        description:
          "Keyboard navigation shortcuts, focus traps, ARIA attributes, and color contrast audit complying with WCAG 2.1 AA standards.",
        short_summary: "Full keyboard navigation and screen-reader accessibility",
        status: "Done",
        health: "On Track",
        priority: "High",
        progress: 100,
        labels: ["a11y", "frontend", "design"],
        lead_id: userMap["sarah@acme.com"] || cyrus.id,
        daysAgo: 29,
      },
      {
        name: "Multi-tenant S3 Asset CDN Pipeline",
        slug: "asset-cdn-pipeline",
        description:
          "Direct-to-S3 signed URL uploads with automated image optimization, thumbnail generation, and CloudFront CDN caching.",
        short_summary: "Presigned media uploads and CloudFront asset delivery",
        status: "In Progress",
        health: "On Track",
        priority: "Medium",
        progress: 74,
        labels: ["storage", "cdn", "media"],
        lead_id: userMap["alex@acme.com"] || cyrus.id,
        daysAgo: 17,
      },
      {
        name: "Incident Management & Webhook Bridge",
        slug: "incident-management-bridge",
        description:
          "Bi-directional integration syncing critical alerts from PagerDuty, Datadog, and Sentry into high-priority triage boards.",
        short_summary: "PagerDuty and Sentry alert synchronization",
        status: "In Progress",
        health: "At Risk",
        priority: "High",
        progress: 50,
        labels: ["integrations", "monitoring", "webhooks"],
        lead_id: cyrus.id,
        daysAgo: 13,
      },
      {
        name: "Interactive Onboarding & Team Invite Flow",
        slug: "interactive-onboarding",
        description:
          "Self-serve wizard guiding new workspace owners through team invitations, project templates, and sample board creation.",
        short_summary: "Step-by-step workspace setup and team invitation wizard",
        status: "Done",
        health: "On Track",
        priority: "Medium",
        progress: 100,
        labels: ["growth", "ux", "onboarding"],
        lead_id: userMap["sarah@acme.com"] || cyrus.id,
        daysAgo: 23,
      },
      {
        name: "Frontend Performance & LCP Optimization",
        slug: "frontend-lcp-optimization",
        description:
          "Route-based code splitting, font preloading, critical CSS extraction, and dynamic imports bringing LCP below 800ms.",
        short_summary: "Bundle tree-shaking, lazy routes, and sub-second LCP",
        status: "Done",
        health: "On Track",
        priority: "High",
        progress: 100,
        labels: ["performance", "frontend", "vite"],
        lead_id: cyrus.id,
        daysAgo: 22,
      },
      {
        name: "Customer Feedback Widget & Public Trello/Linear Roadmaps",
        slug: "public-roadmaps-and-feedback",
        description:
          "Embeddable feedback collection widget allowing external users to upvote feature requests and track public roadmap statuses.",
        short_summary: "Public roadmap board and embedded feature request widget",
        status: "Planned",
        health: "On Track",
        priority: "Low",
        progress: 20,
        labels: ["roadmap", "product", "community"],
        lead_id: userMap["david@acme.com"] || cyrus.id,
        daysAgo: 8,
      },
      {
        name: "Activity Audit Stream & Slack Integration",
        slug: "slack-activity-stream",
        description:
          "Real-time notifications sent directly to project-specific Slack channels whenever milestones are completed or issues are blocked.",
        short_summary: "Real-time Slack notifications for milestone updates",
        status: "In Progress",
        health: "On Track",
        priority: "Medium",
        progress: 62,
        labels: ["slack", "notifications", "integrations"],
        lead_id: userMap["alex@acme.com"] || cyrus.id,
        daysAgo: 11,
      },
    ];

    let position = 1;
    for (const p of projectsData) {
      const identifier = `KRI-CJ-${position}`;
      // Upsert project
      const projRes = await db.query(
        `INSERT INTO projects (
           workspace_id, owner_id, name, slug, identifier, description, short_summary,
           status, health, priority, progress, position, lead_id, labels,
           created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW() - ($15 || ' days')::interval, NOW() - ($15 || ' days')::interval)
         ON CONFLICT (workspace_id, slug) 
         DO UPDATE SET
           name = EXCLUDED.name,
           identifier = COALESCE(projects.identifier, EXCLUDED.identifier),
           description = EXCLUDED.description,
           short_summary = EXCLUDED.short_summary,
           status = EXCLUDED.status,
           health = EXCLUDED.health,
           priority = EXCLUDED.priority,
           progress = EXCLUDED.progress,
           lead_id = EXCLUDED.lead_id,
           labels = EXCLUDED.labels,
           updated_at = NOW()
         RETURNING id`,
        [
          ws.id,
          cyrus.id,
          p.name,
          p.slug,
          identifier,
          p.description,
          p.short_summary,
          p.status,
          p.health,
          p.priority,
          p.progress,
          position++,
          p.lead_id,
          JSON.stringify(p.labels),
          p.daysAgo,
        ],
      );

      const projectId = projRes.rows[0].id;

      // Assign project members
      for (const mId of memberIds) {
        await db.query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [projectId, mId, mId === cyrus.id ? "Project Manager" : "Member"],
        );
      }

      // Add milestones
      await db.query(
        `INSERT INTO milestones (project_id, name, description, due_date, status)
         VALUES 
           ($1, 'Architecture Specification & Scoping', 'Initial RFC and technical design doc', NOW() + INTERVAL '10 days', 'Completed'),
           ($1, 'Alpha Testflight & QA Integration', 'Internal testing and regression benchmarks', NOW() + INTERVAL '24 days', 'In Progress'),
           ($1, 'Production Rollout & Telemetry Validation', 'Gradual phased rollout to all workspace tenants', NOW() + INTERVAL '45 days', 'Pending')
         ON CONFLICT DO NOTHING`,
        [projectId],
      );

      // Add 3-5 tasks per project
      const sampleTasks = [
        {
          title: `Configure base architecture for ${p.name}`,
          status: "Done",
          priority: "High",
          assignee: cyrus.id,
          daysAgo: Math.max(1, p.daysAgo - 3),
        },
        {
          title: `Write unit test coverage and integration mocks`,
          status: "Done",
          priority: "Medium",
          assignee: userMap["alex@acme.com"] || cyrus.id,
          daysAgo: Math.max(1, p.daysAgo - 6),
        },
        {
          title: `Implement core handler and API endpoints`,
          status: p.progress > 70 ? "Done" : "In Progress",
          priority: "High",
          assignee: cyrus.id,
          daysAgo: Math.max(1, p.daysAgo - 8),
        },
        {
          title: `Review security boundaries and audit events`,
          status: p.progress === 100 ? "Done" : "In Review",
          priority: "High",
          assignee: userMap["sarah@acme.com"] || cyrus.id,
          daysAgo: Math.max(1, p.daysAgo - 12),
        },
        {
          title: `Benchmark load and latency thresholds`,
          status: p.progress === 100 ? "Done" : "Todo",
          priority: "Low",
          assignee: userMap["david@acme.com"] || cyrus.id,
          daysAgo: 2,
        },
      ];

      for (const t of sampleTasks) {
        await db.query(
          `INSERT INTO tasks (
             project_id, title, status, priority, assignee_id, reporter_id,
             progress, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7,
             NOW() - ($8 || ' days')::interval,
             NOW() - ($8 || ' days')::interval
           )`,
          [
            projectId,
            t.title,
            t.status,
            t.priority,
            t.assignee,
            cyrus.id,
            t.status === "Done" ? 100 : 40,
            t.daysAgo,
          ],
        );
      }
    }
    console.log(
      `Successfully seeded ${projectsData.length} projects and tasks in ${ws.name}`,
    );
  }

  // Verification query
  const totalP = await db.query("SELECT COUNT(*) FROM projects");
  const totalT = await db.query("SELECT COUNT(*) FROM tasks");
  const doneT = await db.query(
    "SELECT COUNT(*) FROM tasks WHERE status = 'Done'",
  );
  console.log("\n--- SEED COMPLETE ---");
  console.log(`Total projects in database: ${totalP.rows[0].count}`);
  console.log(
    `Total tasks: ${totalT.rows[0].count} (${doneT.rows[0].count} marked Done)`,
  );

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
