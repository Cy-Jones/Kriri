import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import PageLoading from "../components/PageLoading";
import {
  LayoutGrid,
  KanbanSquare,
  CheckSquare,
  Users,
  Settings,
  Search,
  Folder,
  LogOut,
  Inbox as InboxIcon,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import CreateTaskModal from "../components/CreateTaskModal";
import CommandPalette from "../components/CommandPalette";
import KeyboardShortcutsHelp from "../components/KeyboardShortcutsHelp";
import HelpMenuPopover from "../components/HelpMenuPopover";
import ContactModal from "../components/ContactModal";
import ChangelogModal from "../components/ChangelogModal";
import { useGlobalShortcuts } from "../hooks/useGlobalShortcuts";
import {
  useUser,
  useClerk,
  OrganizationSwitcher,
  useOrganization,
  useOrganizationList,
} from "@clerk/clerk-react";
import { api } from "../lib/api";
import posthog from "../lib/posthog";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const { userMemberships, isLoaded: isOrgListLoaded, setActive } = useOrganizationList({
    userMemberships: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [initialOrg, setInitialOrg] = useState(null);

  // Auto-activate user's primary organization if not currently active
  useEffect(() => {
    if (isOrgListLoaded && userMemberships?.data?.length > 0 && !organization && setActive) {
      setActive({ organization: userMemberships.data[0].organization.id });
    }
  }, [isOrgListLoaded, userMemberships?.data, organization, setActive]);

  // Auto-collapse sidebar on tablet viewports (768px <= width < 1024px)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("kriri_sidebar_collapsed");
    if (saved !== null) {
      return saved === "true";
    }
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kriri_sidebar_collapsed", String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      const saved = localStorage.getItem("kriri_sidebar_collapsed");
      if (saved === null) {
        setIsSidebarCollapsed(window.innerWidth >= 768 && window.innerWidth < 1024);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getRouteLabel = (pathname, stateTitle) => {
    if (stateTitle) return stateTitle;
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname === "/inbox" || pathname.startsWith("/inbox")) return "Inbox";
    if (pathname === "/tasks" || pathname.startsWith("/tasks")) return "Issues";
    if (pathname === "/kanban" || pathname.startsWith("/kanban")) return "Board";
    if (pathname === "/projects" || pathname === "/projects/") return "Projects";
    if (pathname.startsWith("/projects/")) return "Project Details";
    if (pathname === "/analytics" || pathname.startsWith("/analytics")) return "Analytics";
    if (pathname === "/team" || pathname.startsWith("/team")) return "Team";
    if (pathname === "/settings" || pathname.startsWith("/settings")) return "Settings";
    return "Workspace";
  };

  const prevPathRef = useRef(location.pathname);

  const triggerNavLoading = () => {
    // Instant navigation without artificial delay
  };

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsMobileNavOpen(false);
    }
  }, [location.pathname]);

  useGlobalShortcuts({
    onOpenCommandPalette: () =>
      window.dispatchEvent(new CustomEvent("open-command-palette")),
    onOpenHelp: () => setIsHelpOpen((prev) => !prev),
    onOpenCreateTask: () => setIsModalOpen(true),
    onToggleSidebar: toggleSidebar,
  });

  useEffect(() => {
    if (
      isOrgListLoaded &&
      userMemberships &&
      !userMemberships.isLoading &&
      userMemberships.data !== undefined &&
      userMemberships.data.length === 0 &&
      location.pathname !== "/onboarding"
    ) {
      navigate("/onboarding", { replace: true });
    }
  }, [
    isOrgListLoaded,
    userMemberships?.isLoading,
    userMemberships?.data,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (user) {
      api
        .post("/auth/sync", {})
        .then(() => {
          if (initialOrg === null) {
            setInitialOrg(organization?.id || "personal");
          } else if (initialOrg !== (organization?.id || "personal")) {
            // Organization changed, reload to fetch fresh data for everything
            window.location.reload();
          }
        })
        .catch((err) => console.error("Sync error:", err));
    }
  }, [user, organization?.id]);

  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id);
    }
  }, [user?.id]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const userName = user?.fullName || user?.firstName || "User";
  const initials = userName.substring(0, 2).toUpperCase();
  const avatarUrl = user?.imageUrl;

  const topNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
    { name: "Inbox", path: "/inbox", icon: InboxIcon },
    { name: "Issues", path: "/tasks", icon: CheckSquare },
    { name: "Board", path: "/kanban", icon: KanbanSquare },
  ];

  const workspaceItems = [
    { name: "Projects", path: "/projects", icon: Folder },
    { name: "Analytics", path: "/analytics", icon: LineChart },
    { name: "Team", path: "/team", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleSignOut = () => {
    posthog.capture("logout");
    posthog.reset();
    signOut(() => navigate("/"));
  };

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden text-text-primary text-[13px] font-sans selection:bg-accent/30 selection:text-white">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-shrink-0 bg-transparent flex-col transition-all duration-200 relative select-none ${
          isSidebarCollapsed ? "w-[60px]" : "w-[260px]"
        }`}
      >
        {isSidebarCollapsed ? (
          /* Collapsed Sidebar Rail */
          <div className="flex flex-col h-full items-center py-1">
            {/* Top Expand Button */}
            <div className="h-[48px] flex items-center justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/[0.06] hover:text-[#e8e8e8] text-[#8a8f98] rounded-md transition-colors"
                title="Expand sidebar (⌘B)"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`p-1 rounded-md transition-colors ${
                  isProfileOpen ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                }`}
                title={userName}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-[20px] h-[20px] rounded-full object-cover shadow-sm ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-[20px] h-[20px] rounded-full bg-[#5e6ad2] flex items-center justify-center text-white text-[9px] font-bold tracking-tighter shadow-sm">
                    {initials}
                  </div>
                )}
              </button>
            </div>

            {/* Quick Actions (Search, New Issue) */}
            <div className="flex flex-col items-center gap-1 pb-2 mb-2 border-b border-white/[0.06] w-full">
              <button
                type="button"
                onClick={() =>
                  document.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                  )
                }
                className="w-8 h-8 flex items-center justify-center hover:bg-white/[0.04] text-[#8a8f98] hover:text-[#e8e8e8] rounded-md transition-colors"
                title="Search (⌘K)"
              >
                <Search size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/[0.04] text-[#8a8f98] hover:text-[#e8e8e8] rounded-md transition-colors"
                title="New Issue (C)"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Nav Items (Icons only) */}
            <div className="flex-1 w-full px-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-1">
              {topNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  state={{ loadingTitle: item.name }}
                  onClick={() => {
                    if (location.pathname !== item.path) {
                      triggerNavLoading(item.name);
                    }
                  }}
                  title={item.name}
                  className={({ isActive }) =>
                    `w-9 h-8 flex items-center justify-center rounded-md transition-colors ${
                      isActive
                        ? "bg-white/[0.08] text-white font-medium"
                        : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
                    }`
                  }
                >
                  <item.icon size={15} />
                </NavLink>
              ))}

              <div className="w-5 h-[1px] bg-white/[0.06] my-2" />

              {workspaceItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  state={{ loadingTitle: item.name }}
                  onClick={() => {
                    if (location.pathname !== item.path) {
                      triggerNavLoading(item.name);
                    }
                  }}
                  title={item.name}
                  className={({ isActive }) =>
                    `w-9 h-8 flex items-center justify-center rounded-md transition-colors ${
                      isActive
                        ? "bg-white/[0.08] text-white font-medium"
                        : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
                    }`
                  }
                >
                  <item.icon size={15} />
                </NavLink>
              ))}
            </div>

            {/* Footer Help */}
            <div className="p-2 mt-auto relative">
              <button
                type="button"
                onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                title="Help & Resources"
              >
                <span className="text-[10px] font-bold">?</span>
              </button>
              <HelpMenuPopover
                isOpen={isHelpMenuOpen}
                onClose={() => setIsHelpMenuOpen(false)}
                onOpenShortcuts={() => setIsHelpOpen(true)}
                onOpenContact={() => setIsContactOpen(true)}
                onOpenChangelog={(releaseId) => {
                  setSelectedRelease(releaseId);
                  setIsChangelogOpen(true);
                }}
                className="left-0"
              />
            </div>
          </div>
        ) : (
          /* Expanded Sidebar */
          <>
            {/* Sidebar Header */}
            <div className="h-[48px] flex items-center justify-between px-3 mt-1">
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 text-[#e8e8e8] font-medium cursor-pointer px-2 py-1 -ml-2 rounded-md transition-colors ${isProfileOpen ? "bg-white/[0.04]" : "hover:bg-white/[0.04]"}`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-[18px] h-[18px] rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-[#5e6ad2] flex items-center justify-center text-white text-[9px] font-bold tracking-tighter shadow-sm">
                    {initials}
                  </div>
                )}
                <span className="text-[13px] truncate max-w-[140px]">
                  {userName}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#8a8f98] opacity-70"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              <div className="flex items-center gap-0.5 text-[#8a8f98]">
                <button
                  type="button"
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                    )
                  }
                  className="p-1.5 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
                  title="Search (⌘K)"
                >
                  <Search size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
                  title="New Issue (C)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
                  title="Collapse sidebar (⌘B)"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </div>

            {/* Sidebar Nav */}
            <div className="px-3 pb-3 flex-1 overflow-y-auto">
              <nav className="flex flex-col space-y-[2px] mt-1 text-[13px]">
                {topNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    state={{ loadingTitle: item.name }}
                    onClick={() => {
                      if (location.pathname !== item.path) {
                        triggerNavLoading(item.name);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                        isActive
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
                      }`
                    }
                  >
                    <item.icon size={15} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mt-6 flex items-center justify-between px-2.5 mb-2">
                <span className="text-[11px] font-medium tracking-wide text-[#8a8f98]">
                  Workspace
                </span>
              </div>
              <div className="px-2 mb-4">
                <OrganizationSwitcher
                  hidePersonal={false}
                  afterLeaveOrganizationUrl="/dashboard"
                  afterSelectOrganizationUrl="/dashboard"
                  afterCreateOrganizationUrl="/dashboard"
                  appearance={{
                    elements: {
                      organizationSwitcherTrigger:
                        "w-full flex justify-between items-center px-2 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#e8e8e8] text-[13px] font-medium rounded-md transition-colors",
                      organizationSwitcherTriggerIcon: "text-[#8a8f98] w-3 h-3",
                      organizationPreviewMainIdentifier:
                        "text-[#e8e8e8] font-medium text-[13px]",
                      organizationPreviewSecondaryIdentifier:
                        "text-[#8a8f98] text-[11px]",
                    },
                  }}
                />
              </div>
              <nav className="flex flex-col space-y-[2px] text-[13px]">
                {workspaceItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    state={{ loadingTitle: item.name }}
                    onClick={() => {
                      if (location.pathname !== item.path) {
                        triggerNavLoading(item.name);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                        isActive
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
                      }`
                    }
                  >
                    <item.icon size={15} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 mt-auto relative">
              <button
                type="button"
                onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                title="Help & Resources"
              >
                <span className="text-[11px] font-bold">?</span>
              </button>
              <HelpMenuPopover
                isOpen={isHelpMenuOpen}
                onClose={() => setIsHelpMenuOpen(false)}
                onOpenShortcuts={() => setIsHelpOpen(true)}
                onOpenContact={() => setIsContactOpen(true)}
                onOpenChangelog={(releaseId) => {
                  setSelectedRelease(releaseId);
                  setIsChangelogOpen(true);
                }}
                className="left-3"
              />
            </div>
          </>
        )}

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div
            className={`absolute bg-[#212226] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-[13px] ${
              isSidebarCollapsed
                ? "top-[44px] left-[62px] w-[220px]"
                : "top-[50px] left-3 w-[240px]"
            }`}
          >
            <div
              className="px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#e8e8e8]"
              onClick={() => {
                triggerNavLoading("Settings");
                navigate("/settings", { state: { loadingTitle: "Settings" } });
                setIsProfileOpen(false);
              }}
            >
              <span>Settings</span>
            </div>
            <div
              className="px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer text-[#e8e8e8]"
              onClick={() => {
                triggerNavLoading("Team");
                navigate("/team", { state: { loadingTitle: "Team" } });
                setIsProfileOpen(false);
              }}
            >
              Invite and manage members
            </div>
            <div className="h-[1px] bg-white/[0.08] my-1"></div>
            <div
              className="px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#e8e8e8]"
              onClick={handleSignOut}
            >
              <span>Log out</span>
              <div className="flex items-center gap-0.5 text-[#8a8f98] text-[11px] font-mono">
                <span>⌥</span>
                <span>⇧</span>
                <span>Q</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-0 md:py-2 md:pr-2 min-w-0 h-full overflow-hidden transition-all duration-200">
        {/* Mobile Header */}
        <header
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            height: "calc(48px + env(safe-area-inset-top, 0px))",
          }}
          className="md:hidden flex items-center justify-between px-3 border-b border-white/[0.06] bg-black text-[#e8e8e8] flex-shrink-0 select-none"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 -ml-1 text-[#8a8f98] hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <span className="font-semibold text-[13px] text-white tracking-tight">
              {navigatingLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#8a8f98]">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-command-palette"),
                )
              }
              className="p-1.5 hover:bg-white/[0.06] hover:text-[#e8e8e8] rounded-md transition-colors"
              title="Search"
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 hover:bg-white/[0.06] hover:text-[#e8e8e8] rounded-md transition-colors"
              title="New Issue"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-w-0 bg-[#131416] rounded-none md:rounded-xl relative z-0 border-0 md:border md:border-white/[0.05] shadow-2xl overflow-hidden">
          <div
            className={`flex-1 overflow-y-auto overflow-x-hidden bg-transparent ${location.pathname.startsWith("/inbox") ? "" : "px-4 py-4 md:px-6 lg:px-8 md:py-6"}`}
          >
            <Outlet context={{ triggerNavLoading, isSidebarCollapsed, toggleSidebar }} />
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div
            style={{
              paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
            }}
            className="relative w-[280px] max-w-[85vw] h-full bg-[#131416] border-r border-white/10 flex flex-col p-3 z-10 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="h-11 flex items-center justify-between px-2 mb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#5e6ad2] flex items-center justify-center text-white text-[10px] font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-[13px] font-medium text-white truncate max-w-[140px]">
                  {userName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 text-[#8a8f98] hover:text-white rounded-md hover:bg-white/[0.06]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto space-y-4">
              <nav className="flex flex-col space-y-[2px] text-[13px]">
                {topNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    state={{ loadingTitle: item.name }}
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      if (location.pathname !== item.path) {
                        triggerNavLoading(item.name);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
                      }`
                    }
                  >
                    <item.icon size={16} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] font-medium tracking-wide text-[#8a8f98] px-2.5 mb-2">
                  Workspace
                </div>
                <div className="px-1 mb-2">
                  <OrganizationSwitcher
                    hidePersonal={false}
                    afterLeaveOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    afterCreateOrganizationUrl="/dashboard"
                  />
                </div>
              </div>

              <nav className="flex flex-col space-y-[2px] text-[13px]">
                {workspaceItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    state={{ loadingTitle: item.name }}
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      if (location.pathname !== item.path) {
                        triggerNavLoading(item.name);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]"
                      }`
                    }
                  >
                    <item.icon size={16} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 text-xs text-[#8a8f98] hover:text-white px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.04] text-[#8a8f98] hover:text-white text-xs"
                  title="Help & Resources"
                >
                  ?
                </button>
                <HelpMenuPopover
                  isOpen={isHelpMenuOpen}
                  onClose={() => setIsHelpMenuOpen(false)}
                  onOpenShortcuts={() => {
                    setIsMobileNavOpen(false);
                    setIsHelpOpen(true);
                  }}
                  onOpenContact={() => {
                    setIsMobileNavOpen(false);
                    setIsContactOpen(true);
                  }}
                  onOpenChangelog={(releaseId) => {
                    setIsMobileNavOpen(false);
                    setSelectedRelease(releaseId);
                    setIsChangelogOpen(true);
                  }}
                  className="left-auto right-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={(newTask) => {
          window.location.reload();
        }}
      />

      <CommandPalette
        openCreateTask={() => setIsModalOpen(true)}
        openHelp={() => setIsHelpOpen(true)}
      />

      <KeyboardShortcutsHelp isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />

      <ContactModal
        isOpen={isContactOpen}
        onOpenChange={setIsContactOpen}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onOpenChange={setIsChangelogOpen}
        initialRelease={selectedRelease}
      />
    </div>
  );
}
