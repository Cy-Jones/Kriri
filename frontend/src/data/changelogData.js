// Kriri Product Releases & Changelog
// Only features and capabilities that are actually implemented in Kriri

export const releases = [
  {
    id: "kanban-boards",
    date: "October 8, 2026",
    version: "v1.3.0",
    categories: ["features", "polish", "fixes"],
    title: "Interactive Kanban Boards & Visual Workflows",
    shortTitle: "Interactive Kanban Boards",
    summary:
      "Introducing Kriri's visual workflow engine. Teams can now manage project lifecycles across interactive Kanban columns with drag-and-drop task transitions, granular priority triage, and instant optimistic updates.",
    sections: [
      {
        title: "Drag-and-Drop Pipeline",
        content:
          "Reorder tasks and transition work smoothly between stages: Todo, In Progress, In Review, and Done. Powered by responsive drag interactions with automatic state persistence.",
      },
      {
        title: "Inline Priority & Metadata Triage",
        content:
          "Assign priority levels (Urgent, High, Medium, Low), set target delivery dates, and allocate team members directly from task cards without opening nested dialogs.",
      },
      {
        title: "Keyboard-Driven Board Navigation",
        content:
          "Navigate, select, and move cards across columns entirely from the keyboard using Space to pick up and Arrow keys to place.",
      },
    ],
    polish: [
      "Added optimistic local state updates for instantaneous card movement between columns.",
      "Enhanced column hover contrast and visual drop indicator transitions.",
      "Introduced column card count badges that dynamically reflect active search filters.",
    ],
    fixes: [
      "Resolved task reordering glitch when quickly dragging multiple cards sequentially.",
      "Fixed status synchronization discrepancy between List view and Kanban swimlanes.",
      "Prevented unnecessary layout shifts and horizontal viewport snapping during card drag.",
    ],
  },
  {
    id: "activity-center",
    date: "September 24, 2026",
    version: "v1.2.0",
    categories: ["features", "polish", "fixes"],
    title: "Unified Activity Center & Notifications",
    shortTitle: "Unified Activity Center",
    summary:
      "Stay aligned on project momentum without leaving your workspace. The new Inbox view aggregates task assignments, status updates, and priority changes into a single chronological feed.",
    sections: [
      {
        title: "Unread Filtering & One-Click Triage",
        content:
          "Review changes that occurred while away from your desk. Filter to view only unread notifications, or clear the entire activity queue with a single click.",
      },
      {
        title: "Contextual Deep Linking",
        content:
          "Clicking any notification item deep-links directly to the relevant project and scrolls smoothly to the target task.",
      },
    ],
    polish: [
      "Added unread count badge in the workspace top navigation bar with real-time counter updates.",
      "Enhanced mobile slide-out drawer for quick notification review on smaller viewport widths.",
      "Configured keyboard shortcut (I) to immediately focus and open the Activity Center.",
    ],
    fixes: [
      "Fixed unread badge counter failing to decrement immediately after dismissing an item.",
      "Resolved duplicate WebSocket event listeners on rapid navigation transitions.",
      "Fixed relative timestamp calculations for notifications across timezone offsets.",
    ],
  },
  {
    id: "multi-tenant-workspaces",
    date: "September 5, 2026",
    version: "v1.1.0",
    categories: ["features", "polish", "fixes"],
    title: "Multi-Tenant Workspaces & Role-Based Access",
    shortTitle: "Multi-Tenant Workspaces",
    summary:
      "Engineered for growing organizations. Isolate workflows into distinct workspaces with dedicated project portfolios, team directories, and granular role permissions.",
    sections: [
      {
        title: "Organization Workspaces",
        content:
          "Switch seamlessly between distinct workspaces for engineering, design, and operations without logging out or losing context.",
      },
      {
        title: "Role-Based Access Control",
        content:
          "Enforce governance across Owners, Admins, and Members to protect project configurations and workspace-level settings.",
      },
      {
        title: "Authentication with Clerk",
        content:
          "Frictionless onboarding supporting Google OAuth, GitHub OAuth, and email credentials with just-in-time PostgreSQL user provisioning.",
      },
    ],
    polish: [
      "Built dedicated team management view with member search and role modification.",
      "Refined workspace switcher in the sidebar with instant keyboard search filtering.",
      "Polished onboarding invitation acceptance flow and redirect handling.",
    ],
    fixes: [
      "Automated database user and organization membership synchronization via Clerk webhooks to eliminate orphaned records.",
      "Hardened workspace invitation flows with automatic authorization checks.",
      "Fixed member role cache invalidation bug when permissions were updated in multi-tab sessions.",
    ],
  },
  {
    id: "task-management",
    date: "August 15, 2026",
    version: "v1.0.0",
    categories: ["features", "polish", "fixes"],
    title: "Multi-View Task Management & Universal Navigation",
    shortTitle: "Multi-View Task Management",
    summary:
      "The first official public release of Kriri: an ultra-fast, high-density project workspace engineered for speed, typographic clarity, and keyboard-first workflows.",
    sections: [
      {
        title: "Dual Task Views (List & Kanban)",
        content:
          "Switch instantaneously between spatial Kanban boards for sprint execution and high-density tabular Lists for backlog grooming and bulk inspection.",
      },
      {
        title: "Global Command Palette (⌘K)",
        content:
          "Universal search across all tasks, projects, and navigation routes. Execute actions and jump across pages from anywhere with a single keystroke.",
      },
      {
        title: "Pitch-Black Swiss Design System",
        content:
          "Built around absolute black (#000000), 1px hairline borders, and calibrated typographic proportions to eliminate visual clutter and maximize focus.",
      },
    ],
    polish: [
      "Integrated global keyboard shortcut cheat sheet accessible anytime with '?'.",
      "Engineered responsive layout foundation for desktop, tablet, and mobile screens.",
      "Fine-tuned high-density typography and 1px hairline border consistency across all screens.",
    ],
    fixes: [
      "Constructed PostgreSQL relational database schema with cascade deletes and foreign key constraints.",
      "Fixed command palette autofocus issue when opened rapidly in WebKit/Safari.",
      "Resolved task list sorting reset on browser history navigation.",
    ],
  },
];
