export const kririFaqItems = [
  {
    id: "free-preview",
    category: "General",
    question: "Why is Kriri completely free right now?",
    answer:
      "Kriri is under active public development. We are focused on refining keyboard ergonomics, sub-50ms synchronization, and design system fidelity before introducing commercial tiers.",
  },
  {
    id: "data-persistence",
    category: "General",
    question: "Will my data and workspaces be wiped when paid plans arrive?",
    answer:
      "No. Your existing workspaces, boards, issues, and audit history will remain intact. Any future tiers will target enterprise compliance and dedicated support, while core workspace tracking remains accessible.",
  },
  {
    id: "no-credit-card",
    category: "General",
    question: "Do I need to provide payment details or a credit card?",
    answer:
      "No. You can authenticate via GitHub or Google in seconds with zero payment credentials required.",
  },
  {
    id: "real-time-sync",
    category: "Collaboration",
    question: "How does real-time synchronization work?",
    answer:
      "Kriri is connected via persistent WebSockets. Task transitions, assignments, status changes, and priority updates broadcast instantaneously across all active workspace members with optimistic client state.",
  },
  {
    id: "multi-tenant",
    category: "Collaboration",
    question: "Can I manage multiple organizations and teams?",
    answer:
      "Yes. Workspaces isolate projects and members with role-based access control across Owners, Admins, and Members. You can switch organizations seamlessly from the sidebar.",
  },
  {
    id: "task-views",
    category: "Collaboration",
    question: "What views are available for tracking work?",
    answer:
      "Kriri provides spatial Kanban boards with fluid drag-and-drop, high-density tabular List views for backlog grooming, and chronological Gantt Timeline views for milestone planning.",
  },
  {
    id: "keyboard-first",
    category: "Ergonomics",
    question: "Is Kriri keyboard-first?",
    answer:
      "Yes. The global command palette (⌘K or Ctrl+K) lets you search and execute actions from anywhere. In Kanban boards, use Space to pick up cards and Arrow keys to place them. Press '?' anytime to view all shortcuts.",
  },
  {
    id: "design-system",
    category: "Ergonomics",
    question: "What design philosophy guides Kriri?",
    answer:
      "Kriri is engineered around an absolute pitch-black (#000000) Swiss foundation with 1px hairline borders, Geist & Inter typography, and zero visual clutter.",
  },
  {
    id: "infrastructure",
    category: "Security",
    question: "Where is workspace data stored and processed?",
    answer:
      "Kriri infrastructure is backed by PostgreSQL relational databases hosted in the United States and global edge servers for sub-50ms API responses.",
  },
  {
    id: "auth-provider",
    category: "Security",
    question: "How does authentication work?",
    answer:
      "Authentication is managed via Clerk, supporting Google OAuth, GitHub OAuth, and email credentials with just-in-time PostgreSQL user synchronization.",
  },
];

export default kririFaqItems;
