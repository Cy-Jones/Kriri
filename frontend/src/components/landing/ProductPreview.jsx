import { useState } from "react";
import {
  LayoutGrid,
  CheckSquare,
  KanbanSquare,
  Folder,
  LineChart,
  Inbox as InboxIcon,
  Users,
  Settings,
  Plus,
  Search,
  Circle,
  Compass,
  FileText,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Plot as Chart, Lockers } from "@lucasmarkes/hairline/react";
import { IssuesEmptyIcon } from "../EmptyStateIcons";

const initialTasks = [
  {
    id: "KRI-101",
    title: "Implement new React components & views",
    status: "In Progress",
    priority: "High",
    assignee: "K",
    assigneeName: "Kriri Inc.",
    assigneeColor: "bg-[#3b82f6]",
    due: "Today",
  },
  {
    id: "KRI-102",
    title: "Setup Vite configuration & build pipeline",
    status: "In Progress",
    priority: "Medium",
    assignee: "SC",
    assigneeName: "Sarah Chen",
    assigneeColor: "bg-[#30a46c]",
    due: "Tomorrow",
  },
  {
    id: "KRI-103",
    title: "Design keyboard shortcut command palette",
    status: "Todo",
    priority: "High",
    assignee: "K",
    assigneeName: "Kriri Inc.",
    assigneeColor: "bg-[#3b82f6]",
    due: "Oct 16",
  },
];

const boardColumns = [
  {
    id: "todo",
    label: "Todo",
    icon: Circle,
    cards: [
      {
        id: "KRI-103",
        title: "Design command palette",
        tag: "K",
        tagColor: "bg-[#3b82f6]",
      },
    ],
  },
  {
    id: "progress",
    label: "In Progress",
    icon: Compass,
    iconColor: "text-[#f5a623]",
    cards: [
      {
        id: "KRI-101",
        title: "Implement new React components",
        tag: "K",
        tagColor: "bg-[#3b82f6]",
        highlight: true,
      },
      {
        id: "KRI-102",
        title: "Setup Vite configuration",
        tag: "SC",
        tagColor: "bg-[#30a46c]",
        highlight: true,
      },
    ],
  },
  {
    id: "review",
    label: "In Review",
    icon: FileText,
    iconColor: "text-[#0091ff]",
    cards: [],
  },
  {
    id: "done",
    label: "Done",
    icon: CheckSquare,
    iconColor: "text-[#30a46c]",
    cards: [
      {
        id: "KRI-100",
        title: "PostHog analytics telemetry",
        tag: "DK",
        tagColor: "bg-[#f5a623]",
        done: true,
      },
    ],
  },
];

const dashboardStats = [
  { label: "Tasks Due Today", value: 4, change: "Today", tone: "text-white/60" },
  { label: "Overdue", value: 0, change: "All clear", tone: "text-[#30a46c]" },
  { label: "In Progress", value: 7, change: "Active", tone: "text-[#f5a623]" },
  { label: "Completed (7d)", value: 18, change: "+24% weekly", tone: "text-[#30a46c]" },
];

const recentProjects = [
  { name: "Frontend Re-architecture", slug: "KRI-1" },
  { name: "Real-time Collaboration", slug: "KRI-2" },
];

const projectRoadmaps = [
  {
    name: "Frontend Re-architecture",
    slug: "KRI-1",
    progress: 75,
    status: "On Track",
    statusColor: "text-[#30a46c] bg-[#30a46c]/10 border-[#30a46c]/20",
    members: ["K", "SC"],
    date: "Oct 28",
  },
  {
    name: "Real-time Collaboration Engine",
    slug: "KRI-2",
    progress: 45,
    status: "In Progress",
    statusColor: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
    members: ["SC", "DK"],
    date: "Nov 15",
  },
];

const teamMembers = [
  { name: "Kriri Inc.", role: "Owner", email: "team@kriri.app", color: "bg-[#3b82f6]", status: "Online" },
  { name: "Sarah Chen", role: "Admin", email: "sarah@kriri.app", color: "bg-[#30a46c]", status: "Active" },
  { name: "David Kim", role: "Member", email: "david@kriri.app", color: "bg-[#f5a623]", status: "Active" },
];

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState("issues");
  const [loadingTab, setLoadingTab] = useState(null);
  const [issueTab, setIssueTab] = useState("active");
  const [tasks, setTasks] = useState(initialTasks);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleTabClick = (item) => {
    if (item.id === activeTab) return;
    setLoadingTab(item.label);
    setTimeout(() => {
      setActiveTab(item.id);
      setLoadingTab(null);
    }, 240);
  };

  const toggleTaskStatus = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "Done" ? "In Progress" : "Done" }
          : t,
      ),
    );
  };

  const toggleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)),
    );
  };

  const topNavItems = [
    { id: "dashboard", label: "Dashboard", path: "dashboard", icon: LayoutGrid },
    {
      id: "inbox",
      label: "Inbox",
      path: "inbox",
      icon: InboxIcon,
      badge: notifications.filter((n) => n.unread).length || null,
    },
    {
      id: "issues",
      label: "Issues",
      path: "tasks",
      icon: CheckSquare,
      badge: tasks.filter((t) => t.status !== "Done").length,
    },
    { id: "board", label: "Board", path: "kanban", icon: KanbanSquare },
  ];

  const workspaceNavItems = [
    { id: "projects", label: "Projects", path: "projects", icon: Folder, badge: 2 },
    { id: "analytics", label: "Analytics", path: "analytics", icon: LineChart },
    { id: "team", label: "Team", path: "team", icon: Users },
    { id: "settings", label: "Settings", path: "settings", icon: Settings },
  ];

  const allNavItems = [...topNavItems, ...workspaceNavItems];
  const currentNav = allNavItems.find((n) => n.id === activeTab) || topNavItems[2];

  const renderNavButton = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    if (isSidebarCollapsed) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => handleTabClick(item)}
          title={item.label}
          className={`w-9 h-8 mx-auto flex items-center justify-center rounded-md transition-colors relative ${
            isActive
              ? "bg-white/[0.08] text-white font-medium shadow-sm"
              : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
          }`}
        >
          <Icon size={15} />
          {item.badge && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </button>
      );
    }
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleTabClick(item)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left ${
          isActive
            ? "bg-white/[0.08] text-white font-medium shadow-sm"
            : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] font-sans px-1.5 py-0.5 rounded-full ${
              isActive
                ? "bg-white/20 text-white font-semibold"
                : "bg-white/[0.06] text-[#8a8f98]"
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <section
      id="product-preview"
      className="pt-2 sm:pt-3 lg:pt-4 pb-6 sm:pb-8 lg:pb-10 2xl:pb-14 bg-transparent relative overflow-hidden scroll-mt-24 sm:scroll-mt-28"
    >
      <div className="mx-auto max-w-[1440px] px-2.5 sm:px-6 lg:px-8 relative z-10">
        {/* Mac Window Mockup Container with ultra-soft fading elevation shadow */}
        <div
          className="relative mx-auto w-full max-w-full xl:max-w-[1360px] 2xl:max-w-[1400px] rounded-xl sm:rounded-2xl bg-black border border-white/10 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.55),0_8px_24px_-8px_rgba(0,0,0,0.35)] overflow-hidden ring-1 ring-white/10 font-sans"
          style={{
            fontFamily: 'var(--font-sans, "Geist Variable", sans-serif)',
          }}
        >
          {/* Mac Window Top Bar */}
          <div className="h-10 sm:h-11 border-b border-white/[0.08] bg-[#0a0a0a] flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4 select-none">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] border border-black/20" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] border border-black/20" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] border border-black/20" />
              </div>
            </div>

            <div className="flex-1 max-w-[200px] sm:max-w-xs mx-auto">
              <div className="bg-black border border-white/[0.08] rounded-md px-2.5 sm:px-3.5 py-0.5 sm:py-1 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 font-sans shadow-inner truncate">
                <span className="text-zinc-600 hidden xs:inline">kriri.app/</span>
                <span className="text-white font-medium">{currentNav.path}</span>
              </div>
            </div>

            <div className="w-8 sm:w-12 flex-shrink-0" />
          </div>

          {/* Mobile Navigation Strip (visible only on small screens) */}
          <div className="md:hidden flex items-center gap-1 px-2.5 py-1.5 border-b border-white/[0.08] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-[#0a0a0a]">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    isActive
                      ? "bg-white/[0.12] text-white"
                      : "text-[#8a8f98] hover:text-[#e8e8e8]"
                  }`}
                >
                  <Icon size={12} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* App Body (Responsive height: fits comfortably in 14" & 16" laptop viewports, full 760px on large monitors) */}
          <div className="flex h-[440px] sm:h-[500px] md:h-[540px] lg:h-[580px] xl:h-[640px] 2xl:h-[760px] max-h-[calc(100vh-140px)] max-h-[calc(100dvh-140px)] min-h-[380px] bg-black text-[#e8e8e8] text-[13px] selection:bg-accent/30 selection:text-white">
            {/* Real In-App Sidebar */}
            <aside
              className={`hidden md:flex flex-shrink-0 bg-transparent border-r border-white/[0.06] flex-col justify-start p-2.5 sm:p-3 select-none overflow-y-auto transition-all duration-200 ${
                isSidebarCollapsed
                  ? "w-[56px] items-center"
                  : "w-[220px] sm:w-[240px] lg:w-[250px] 2xl:w-[260px]"
              }`}
            >
              {isSidebarCollapsed ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="h-[40px] flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsSidebarCollapsed(false)}
                      className="p-1.5 hover:bg-white/[0.06] hover:text-white text-[#8a8f98] rounded-md transition-colors"
                      title="Expand sidebar"
                    >
                      <PanelLeftOpen size={15} />
                    </button>
                  </div>

                  <div className="w-[20px] h-[20px] rounded-md bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-bold shadow-sm mb-2">
                    K
                  </div>

                  <div className="w-full flex flex-col gap-1 items-center">
                    {topNavItems.map(renderNavButton)}
                  </div>

                  <div className="w-5 h-[1px] bg-white/[0.06] my-2" />

                  <div className="w-full flex flex-col gap-1 items-center">
                    {workspaceNavItems.map(renderNavButton)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1. Header: Profile / User Dropdown */}
                  <div className="h-[40px] flex items-center justify-between px-2 -mx-1">
                    <div className="flex items-center gap-2 text-[#e8e8e8] font-medium cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-white/[0.04]">
                      <div className="w-[20px] h-[20px] rounded-md bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        K
                      </div>
                      <span className="text-[13px] font-medium truncate max-w-[120px]">
                        Kriri Inc.
                      </span>
                      <ChevronDown size={12} className="text-[#8a8f98] opacity-70" />
                    </div>

                    <div className="flex items-center gap-0.5 text-[#8a8f98]">
                      <button
                        type="button"
                        className="p-1 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
                        title="Search (⌘K)"
                      >
                        <Search size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("issues")}
                        className="p-1 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
                        title="New Issue"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed(true)}
                        className="p-1 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
                        title="Collapse sidebar"
                      >
                        <PanelLeftClose size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 2. Top Nav Items */}
                  <nav className="flex flex-col space-y-[2px] text-[13px]">
                    {topNavItems.map(renderNavButton)}
                  </nav>

                  {/* 3. Workspace Section */}
                  <div>
                    <div className="flex items-center justify-between px-2.5 mb-1.5">
                      <span className="text-[11px] font-medium tracking-wide text-[#8a8f98]">
                        Workspace
                      </span>
                    </div>

                    <div className="w-full flex justify-between items-center px-2 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#e8e8e8] text-[13px] font-medium rounded-md transition-colors mb-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-bold">
                          K
                        </div>
                        <span className="truncate">Kriri Inc.</span>
                      </div>
                      <ChevronDown size={12} className="text-[#8a8f98]" />
                    </div>

                    <nav className="flex flex-col space-y-[2px] text-[13px]">
                      {workspaceNavItems.map(renderNavButton)}
                    </nav>
                  </div>
                </div>
              )}
            </aside>

            {/* Main Interactive Canvas */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#131416] overflow-hidden">
              {loadingTab ? (
                <div className="flex-1 flex items-center justify-center bg-[#131416] select-none">
                  <div className="flex items-center gap-2.5 text-[#8a8f98]">
                    <div className="w-4 h-4 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
                    <span className="text-[13px] font-medium text-[#8a8f98] tracking-tight">
                      Loading <span className="text-[#e8e8e8]">{loadingTab}</span>...
                    </span>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                {/* 1. ISSUES VIEW */}
                {activeTab === "issues" && (
                  <motion.div
                    key="issues"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2.5 sm:gap-4 flex-shrink-0">
                      <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                          Frontend Re-architecture
                        </h1>
                        <p className="text-[11px] sm:text-xs text-[#8a8f98] mt-0.5">
                          Project KRI-1 &bull; {tasks.length} issues in active sprint
                        </p>
                      </div>

                      <button
                        type="button"
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm w-fit"
                      >
                        <Plus size={13} /> New Issue
                      </button>
                    </div>

                    <div className="flex items-center gap-1 border-b border-white/[0.06] mb-3 sm:mb-4 text-xs select-none">
                      <button
                        type="button"
                        onClick={() => setIssueTab("active")}
                        className={`px-3 py-1.5 font-medium border-b-2 transition-colors -mb-px ${
                          issueTab === "active"
                            ? "border-white text-white"
                            : "border-transparent text-[#8a8f98] hover:text-[#e8e8e8]"
                        }`}
                      >
                        Active ({tasks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setIssueTab("backlog")}
                        className={`px-3 py-1.5 font-medium border-b-2 transition-colors -mb-px ${
                          issueTab === "backlog"
                            ? "border-white text-white"
                            : "border-transparent text-[#8a8f98] hover:text-[#e8e8e8]"
                        }`}
                      >
                        Backlog (0)
                      </button>
                    </div>

                    {issueTab === "backlog" ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center gap-4 border border-white/[0.05] bg-white/[0.01] rounded-xl">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-[#8a8f98] shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
                          <IssuesEmptyIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                        <div>
                          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                            No backlog issues
                          </h2>
                          <p className="text-[11px] sm:text-xs text-[#8a8f98] mt-1 max-w-xs leading-relaxed">
                            All tasks are currently assigned to active sprint
                            cycles. Create an issue to add it to the backlog.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="h-7 sm:h-8 px-3 bg-white text-black rounded-md font-medium text-xs hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Plus size={13} /> Create issue
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Mobile Issues Card List */}
                        <div className="md:hidden flex-1 overflow-y-auto space-y-2">
                          {tasks.map((task) => {
                            const isDone = task.status === "Done";
                            return (
                              <div
                                key={task.id}
                                onClick={() => toggleTaskStatus(task.id)}
                                className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] active:bg-white/[0.05] transition-colors cursor-pointer"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-[#8a8f98]">
                                      {task.id}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                        task.priority === "High"
                                          ? "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/20"
                                          : task.priority === "Medium"
                                            ? "bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20"
                                            : "bg-white/[0.04] text-[#8a8f98] border-white/5"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#8a8f98]">
                                    {task.due}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs font-medium mb-2.5 ${
                                    isDone
                                      ? "line-through text-[#8a8f98]"
                                      : "text-white"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5 text-zinc-400">
                                    {isDone ? (
                                      <CheckSquare
                                        size={13}
                                        className="text-[#30a46c]"
                                      />
                                    ) : task.status === "In Progress" ? (
                                      <Compass
                                        size={13}
                                        className="text-[#f5a623]"
                                      />
                                    ) : (
                                      <Circle
                                        size={13}
                                        className="text-[#8a8f98]"
                                      />
                                    )}
                                    <span>{task.status}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center ${task.assigneeColor}`}
                                    >
                                      {task.assignee}
                                    </div>
                                    <span className="text-zinc-400 text-[11px]">
                                      {task.assigneeName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Issues Table */}
                        <div className="hidden md:flex flex-1 bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-x-auto flex-col shadow-sm">
                          <div className="grid grid-cols-[80px_minmax(260px,1fr)_130px_100px_130px_80px] min-w-[760px] gap-4 px-5 py-3 border-b border-white/[0.05] text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider">
                            <div>ID</div>
                            <div>Title</div>
                            <div>Status</div>
                            <div>Priority</div>
                            <div>Assignee</div>
                            <div className="text-right">Due</div>
                          </div>

                          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] min-w-[760px]">
                            {tasks.map((task) => {
                              const isDone = task.status === "Done";
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="grid grid-cols-[80px_minmax(260px,1fr)_130px_100px_130px_80px] gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors items-center text-[13px] group cursor-pointer"
                                >
                                  <div className="font-mono text-[11px] text-[#8a8f98]">
                                    {task.id}
                                  </div>
                                  <div
                                    className={`font-medium truncate transition-colors ${
                                      isDone
                                        ? "line-through text-[#8a8f98]"
                                        : "text-white group-hover:text-accent"
                                    }`}
                                  >
                                    {task.title}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isDone ? (
                                      <CheckSquare
                                        size={14}
                                        className="text-[#30a46c]"
                                      />
                                    ) : task.status === "In Progress" ? (
                                      <Compass
                                        size={14}
                                        className="text-[#f5a623] fill-[#f5a623]/20"
                                      />
                                    ) : task.status === "In Review" ? (
                                      <FileText
                                        size={14}
                                        className="text-[#0091ff] fill-[#0091ff]/20"
                                      />
                                    ) : (
                                      <Circle
                                        size={14}
                                        className="text-[#8a8f98]"
                                      />
                                    )}
                                    <span
                                      className={`text-xs ${isDone ? "text-[#8a8f98]" : "text-white"}`}
                                    >
                                      {task.status}
                                    </span>
                                  </div>
                                  <div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                        task.priority === "High"
                                          ? "bg-[#e5484d]/10 text-[#e5484d] border-[#e5484d]/20"
                                          : task.priority === "Medium"
                                            ? "bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20"
                                            : "bg-white/[0.04] text-[#8a8f98] border-white/5"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-sm ${task.assigneeColor}`}
                                    >
                                      {task.assignee}
                                    </div>
                                    <span className="text-xs text-[#8a8f98] truncate">
                                      {task.assigneeName}
                                    </span>
                                  </div>
                                  <div className="text-right text-xs font-sans text-[#8a8f98]">
                                    {task.due}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* 2. BOARD VIEW */}
                {activeTab === "board" && (
                  <motion.div
                    key="board"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col min-w-0 min-h-0 p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-2.5 sm:gap-4 flex-shrink-0">
                      <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                        Board
                      </h1>
                      <button
                        type="button"
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm w-fit"
                      >
                        <Plus size={13} /> New Issue
                      </button>
                    </div>

                    {/* Scrollable Board Columns Container */}
                    <div className="flex-1 min-h-0 min-w-0 w-full overflow-x-auto overflow-y-auto pb-2 [touch-action:pan-x_pan-y] [-webkit-overflow-scrolling:touch]">
                      <div className="flex gap-2.5 sm:gap-3.5 min-w-max h-full pb-1">
                        {boardColumns.map((col) => {
                          const Icon = col.icon;
                          return (
                            <div
                              key={col.id}
                              className="w-[210px] sm:w-[240px] lg:w-[260px] flex-shrink-0 flex flex-col rounded-2xl bg-white/[0.01] border border-white/[0.04] p-3 sm:p-3.5"
                            >
                              <div className="flex items-center justify-between mb-3 text-xs font-medium text-[#8a8f98]">
                                <span className="flex items-center gap-1.5 text-white">
                                  <Icon size={13} className={col.iconColor || "text-[#8a8f98]"} />
                                  {col.label}
                                </span>
                                <span className="text-[11px] font-sans bg-white/[0.06] px-2 py-0.5 rounded-full">
                                  {col.cards.length}
                                </span>
                              </div>

                              <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                                {col.cards.map((card) => (
                                  <div
                                    key={card.id}
                                    className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                                      card.done
                                        ? "bg-[#121316]/50 border border-white/[0.04] opacity-75 hover:opacity-100"
                                        : card.highlight
                                          ? "bg-[#121316] border border-[#f5a623]/20 hover:border-[#f5a623]/40"
                                          : "bg-[#121316] border border-white/[0.06] hover:border-white/15"
                                    }`}
                                  >
                                    <span
                                      className={`text-xs font-medium block ${
                                        card.done ? "text-[#8a8f98] line-through" : "text-white"
                                      }`}
                                    >
                                      {card.title}
                                    </span>
                                    <div className="flex items-center justify-between mt-3 text-[11px] text-[#8a8f98]">
                                      <span>{card.id}</span>
                                      <div
                                        className={`w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-bold ${card.tagColor}`}
                                      >
                                        {card.tag}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. DASHBOARD VIEW */}
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-y-auto"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2.5 sm:gap-4 flex-shrink-0">
                      <div>
                        <span className="text-[11px] sm:text-xs font-medium text-[#8a8f98]">
                          Wednesday, October 10
                        </span>
                        <h1 className="text-lg sm:text-2xl font-semibold text-white tracking-tight mt-0.5">
                          Good afternoon, Kriri Inc.
                        </h1>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("projects")}
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer w-fit"
                      >
                        <Plus size={13} /> New Project
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
                      {dashboardStats.map((stat, i) => (
                        <div
                          key={i}
                          className="p-2.5 sm:p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex flex-col gap-1"
                        >
                          <span className="text-[11px] sm:text-[12px] font-medium text-[#8a8f98] truncate">
                            {stat.label}
                          </span>
                          <div className="flex items-baseline justify-between mt-0.5 sm:mt-1">
                            <span className="text-xl sm:text-2xl font-semibold text-white">
                              {stat.value}
                            </span>
                            <span className={`text-[10px] sm:text-[11px] font-medium ${stat.tone}`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                          Recent Projects
                        </h3>
                        <span
                          onClick={() => setActiveTab("projects")}
                          className="text-xs text-[#8a8f98] hover:text-white cursor-pointer transition-colors"
                        >
                          View all &rarr;
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 pb-2">
                        {recentProjects.map((proj) => (
                          <div
                            key={proj.slug}
                            onClick={() => setActiveTab("projects")}
                            className="p-3 sm:p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex flex-col justify-between min-h-[90px] sm:min-h-[110px] cursor-pointer group"
                          >
                            <span className="font-semibold text-white group-hover:text-accent transition-colors text-xs sm:text-sm line-clamp-1">
                              {proj.name}
                            </span>
                            <div className="flex items-center justify-between mt-2 sm:mt-3">
                              <span className="text-[11px] sm:text-xs text-[#8a8f98] font-mono">
                                {proj.slug}
                              </span>
                              <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20">
                                In Progress
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. PROJECTS VIEW */}
                {activeTab === "projects" && (
                  <motion.div
                    key="projects"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-2.5 sm:gap-4 flex-shrink-0">
                      <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                          Projects
                        </h1>
                        <p className="text-[11px] sm:text-xs text-[#8a8f98] mt-0.5">
                          2 active roadmaps in Kriri Inc.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm w-fit"
                      >
                        <Plus size={13} /> New Project
                      </button>
                    </div>

                    <div className="space-y-3.5 flex-1 overflow-y-auto">
                      {projectRoadmaps.map((proj) => (
                        <div
                          key={proj.slug}
                          className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.06] hover:border-white/15 transition-all flex flex-col gap-3.5 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs text-[#8a8f98]">
                                {proj.slug}
                              </span>
                              <span className="text-sm font-medium text-white group-hover:text-accent transition-colors">
                                {proj.name}
                              </span>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${proj.statusColor}`}>
                              {proj.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full bg-white/80 rounded-full"
                                style={{ width: `${proj.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-sans text-[#8a8f98]">
                              {proj.progress}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[#8a8f98]">
                            <span>Target: {proj.date}</span>
                            <div className="flex -space-x-1">
                              {proj.members.map((m, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded-full bg-[#1e2024] border border-[#08090A] text-[9px] text-white flex items-center justify-center font-bold"
                                >
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. INBOX VIEW */}
                {activeTab === "inbox" && (
                  <motion.div
                    key="inbox"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-2.5 sm:gap-4 flex-shrink-0">
                      <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                          Inbox
                        </h1>
                        <p className="text-[11px] sm:text-xs text-[#8a8f98] mt-0.5">
                          {notifications.filter((n) => n.unread).length} unread notifications
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, unread: false })),
                          )
                        }
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] transition-colors text-xs font-medium w-fit"
                      >
                        Mark all as read
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center h-full text-[#8a8f98] gap-3 sm:gap-4 my-auto select-none">
                        <div className="w-44 h-44 sm:w-36 sm:h-36 2xl:w-40 2xl:h-40 relative overflow-visible flex items-center justify-center">
                          <Lockers
                            theme="dark"
                            intensity={0.7}
                            className="w-full h-full text-[#8a8f98]"
                          />
                        </div>
                        <span className="text-[13px] text-[#8a8f98] font-medium">
                          All caught up
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleNotificationRead(item.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                              item.unread
                                ? "bg-white/[0.03] border-white/15"
                                : "bg-white/[0.01] border-white/5 opacity-70"
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm bg-[#3b82f6]">
                              {item.senderInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-white">
                                  {item.sender}{" "}
                                  <span className="text-[#8a8f98] font-normal">
                                    {item.action}
                                  </span>{" "}
                                  <span className="text-white font-mono">
                                    {item.target}
                                  </span>
                                </span>
                                <span className="text-[11px] text-[#8a8f98]">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-xs text-[#8a8f98] mt-1 truncate">
                                {item.snippet}
                              </p>
                            </div>
                            {item.unread && (
                              <div className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 6. ANALYTICS VIEW */}
                {activeTab === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
                      <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                        Analytics
                      </h1>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center gap-3.5 sm:gap-4.5 lg:gap-6 my-auto select-none">
                      <div className="w-48 h-48 sm:w-44 sm:h-44 md:w-52 md:h-52 2xl:w-60 2xl:h-60 flex items-center justify-center relative overflow-visible">
                        <Chart
                          theme="dark"
                          intensity={0.8}
                          className="w-full h-full text-[#8a8f98]"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-white tracking-tight">
                          No analytics data yet
                        </h2>
                        <p className="text-[13px] text-[#8a8f98] leading-relaxed">
                          Once you start creating issues and moving them across
                          your board, your insights will appear here.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 7. TEAM VIEW */}
                {activeTab === "team" && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-2.5 sm:gap-4 flex-shrink-0">
                      <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                          Team Members
                        </h1>
                        <p className="text-[11px] sm:text-xs text-[#8a8f98] mt-0.5">
                          3 active collaborators in Kriri Inc.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-md bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm w-fit"
                      >
                        <Plus size={13} /> Invite Member
                      </button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01]"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center ${member.color}`}
                            >
                              {member.name === "Kriri Inc."
                                ? "K"
                                : member.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="font-medium text-white text-xs">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-[#8a8f98]">
                                {member.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-sans text-[#8a8f98]">
                              {member.role}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {member.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 8. SETTINGS VIEW */}
                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 2xl:p-7 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-5 flex-shrink-0">
                      <div>
                        <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                          Workspace Settings
                        </h1>
                        <p className="text-[11px] sm:text-xs text-[#8a8f98] mt-0.5">
                          Kriri Inc. configuration
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto">
                      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-3">
                        <span className="text-xs font-medium text-white block">
                          Workspace Name
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#8a8f98]">Kriri Inc.</span>
                          <span className="text-xs text-white hover:underline cursor-pointer">
                            Edit
                          </span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-3">
                        <span className="text-xs font-medium text-white block">
                          Authentication & SSO
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-400">
                            Clerk SSO Enabled
                          </span>
                          <span className="text-xs text-[#8a8f98]">Configured</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>
          </div>

          {/* Subtle Bottom Glow Edge */}
          <div className="absolute -bottom-px inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
