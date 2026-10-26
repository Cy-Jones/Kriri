import { useState, useEffect, useRef, Suspense } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "motion/react";
import PageLoading from "../components/PageLoading";
import {
  LayoutDashboard,
  SquareKanban,
  Bug,
  UserRoundGroup,
  Settings,
  Search,
  FolderKanban,
  LogOut,
  Inbox,
  ChartNoAxesCombined,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import CreateTaskModal from "../components/CreateTaskModal";
import CommandPalette from "../components/CommandPalette";
import KeyboardShortcutsHelp from "../components/KeyboardShortcutsHelp";
import HelpMenuPopover from "../components/HelpMenuPopover";
import ContactModal from "../components/ContactModal";
import ChangelogModal from "../components/ChangelogModal";
import ActionTooltip from "../components/ActionTooltip";
import { useGlobalShortcuts } from "../hooks/useGlobalShortcuts";
import { useTheme } from "../contexts/ThemeContext";
import {
  useUser,
  useClerk,
  useAuth,
  OrganizationSwitcher,
  useOrganization,
  useOrganizationList,
} from "@clerk/clerk-react";
import { api, setClerkTokenGetter, resetAuthCache } from "../lib/api";
import posthog from "../lib/posthog";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { theme, effectiveTheme, toggleTheme, setTheme } = useTheme();
  const { organization } = useOrganization();

  useEffect(() => {
    if (getToken) {
      const scope = `${user?.id || "anon"}:${organization?.id || "personal"}`;
      setClerkTokenGetter(getToken, scope);
    }
  }, [getToken, user?.id, organization?.id]);
  const { userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({
    userMemberships: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const currentOrgRef = useRef(null);

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
    const handleOpenNav = () => setIsMobileNavOpen(true);
    window.addEventListener("resize", handleResize);
    window.addEventListener("open-mobile-nav", handleOpenNav);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("open-mobile-nav", handleOpenNav);
    };
  }, []);

  const getRouteLabel = (pathname) => {
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

  const isRouteActive = (itemPath) => {
    if (itemPath === "/projects") {
      return location.pathname === "/projects" || location.pathname.startsWith("/projects/");
    }
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + "/");
  };

  const currentRouteTitle = getRouteLabel(location.pathname);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsMobileNavOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

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
        .catch((err) => console.error("Sync error:", err));

      const activeAuthKey = `${user.id}:${organization?.id || "personal"}`;
      if (currentOrgRef.current === null) {
        currentOrgRef.current = activeAuthKey;
      } else if (currentOrgRef.current !== activeAuthKey) {
        currentOrgRef.current = activeAuthKey;
        resetAuthCache();
        window.location.reload();
      }
    }
  }, [user?.id, organization?.id]);

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
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", path: "/inbox", icon: Inbox },
    { name: "Issues", path: "/tasks", icon: Bug },
    { name: "Board", path: "/kanban", icon: SquareKanban },
  ];

  const workspaceItems = [
    { name: "Projects", path: "/projects", icon: FolderKanban },
    { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
    { name: "Team", path: "/team", icon: UserRoundGroup },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleSignOut = () => {
    posthog.capture("logout");
    posthog.reset();
    signOut(() => navigate("/"));
  };

  const isFullViewportRoute =
    location.pathname.startsWith("/inbox") ||
    location.pathname.startsWith("/kanban");

  return (
    <div
      className={`flex w-full bg-[#fbfbfb] dark:bg-black text-text-primary text-[13px] font-sans selection:bg-accent/30 selection:text-white transition-colors duration-200 ${
        isFullViewportRoute
          ? "h-[100dvh] overflow-hidden"
          : "min-h-screen md:h-[100dvh] md:overflow-hidden"
      }`}
    >
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
              <ActionTooltip label="Expand sidebar" shortcut="⌘B" side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-8 h-8 flex items-center justify-center hover:bg-black/[0.04] hover:text-[#09090b] text-[#52525b] dark:hover:bg-white/[0.06] dark:hover:text-[#e8e8e8] dark:text-[#8a8f98] rounded-md transition-colors"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={16} strokeWidth={1.75} />
                </button>
              </ActionTooltip>
            </div>

            {/* Profile Avatar */}
            <div className="relative mb-2">
              <ActionTooltip
                label={organization?.name ? `${organization.name} (${userName})` : `${userName} (Workspace)`}
                side="right"
                sideOffset={10}
              >
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`p-1 rounded-md transition-colors ${
                    isProfileOpen ? "bg-black/[0.06] dark:bg-white/[0.06]" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  }`}
                  aria-label="Workspace & Profile"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="w-[20px] h-[20px] rounded-full object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/10"
                    />
                  ) : (
                    <div className="w-[20px] h-[20px] rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center text-foreground text-[9px] font-bold tracking-tighter shadow-sm">
                      {initials}
                    </div>
                  )}
                </button>
              </ActionTooltip>
            </div>

            {/* Quick Actions (Search, New Issue) */}
            <div className="flex flex-col items-center gap-1 pb-2 mb-2 border-b border-black/[0.06] dark:border-white/[0.06] w-full">
              <ActionTooltip label="Search" shortcut="⌘K" side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center hover:bg-black/[0.04] text-[#52525b] hover:text-[#09090b] dark:hover:bg-white/[0.04] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] rounded-md transition-colors"
                  aria-label="Search"
                >
                  <Search size={14} strokeWidth={1.75} />
                </button>
              </ActionTooltip>
              <ActionTooltip label="New issue" shortcut="C" side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-black/[0.04] text-[#52525b] hover:text-[#09090b] dark:hover:bg-white/[0.04] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] rounded-md transition-colors"
                  aria-label="New issue"
                >
                  <SquarePen size={14} strokeWidth={1.75} />
                </button>
              </ActionTooltip>
            </div>

            {/* Nav Items (Icons only) */}
            <div className="flex-1 w-full px-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-1.5">
                {topNavItems.map((item) => {
                  const isActive = isRouteActive(item.path);
                  return (
                    <ActionTooltip key={item.name} label={item.name} side="right" sideOffset={10}>
                      <Link
                        to={item.path}
                        aria-label={item.name}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative w-9 h-8 flex items-center justify-center rounded-full transition-colors ${
                          isActive
                            ? "text-zinc-950 dark:text-white"
                            : "text-[#52525b] hover:text-[#09090b] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="collapsedSidebarActivePill"
                            className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.14] border border-black/10 dark:border-white/10 rounded-full shadow-xs"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                          />
                        )}
                        <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} className="relative z-10" />
                      </Link>
                    </ActionTooltip>
                  );
                })}

                <div className="w-5 h-[1px] bg-black/[0.08] dark:bg-white/[0.06] my-1" />

                {workspaceItems.map((item) => {
                  const isActive = isRouteActive(item.path);
                  return (
                    <ActionTooltip key={item.name} label={item.name} side="right" sideOffset={10}>
                      <Link
                        to={item.path}
                        aria-label={item.name}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative w-9 h-8 flex items-center justify-center rounded-full transition-colors ${
                          isActive
                            ? "text-zinc-950 dark:text-white"
                            : "text-[#52525b] hover:text-[#09090b] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="collapsedSidebarActivePill"
                            className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.14] border border-black/10 dark:border-white/10 rounded-full shadow-xs"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                          />
                        )}
                        <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} className="relative z-10" />
                      </Link>
                    </ActionTooltip>
                  );
                })}
              </div>

            {/* Footer Help & Theme */}
            <div className="p-2 mt-auto relative flex flex-col items-center gap-1.5">
              <ActionTooltip label={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"} side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={(e) => toggleTheme("eclipse", e.currentTarget)}
                  className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors"
                  aria-label="Toggle theme"
                >
                  {effectiveTheme === "dark" ? <Sun size={12} strokeWidth={1.8} /> : <Moon size={12} strokeWidth={1.8} />}
                </button>
              </ActionTooltip>
              <ActionTooltip label="Help & resources" shortcut="?" side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                  className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors"
                  aria-label="Help & resources"
                >
                  <span className="text-[10px] font-bold">?</span>
                </button>
              </ActionTooltip>
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
                className={`flex items-center gap-2 text-[#18181b] dark:text-[#e8e8e8] font-medium cursor-pointer px-2 py-1 -ml-2 rounded-md transition-colors ${isProfileOpen ? "bg-black/[0.06] dark:bg-white/[0.04]" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-[18px] h-[18px] rounded-full object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/10"
                  />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center text-foreground text-[9px] font-bold tracking-tighter shadow-sm">
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
                  className="text-[#71717a] dark:text-[#8a8f98] opacity-70"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              <div className="flex items-center gap-0.5 text-[#52525b] dark:text-[#8a8f98]">
                <ActionTooltip label="Search" shortcut="⌘K" side="bottom" sideOffset={6}>
                  <button
                    type="button"
                    onClick={() =>
                      document.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                      )
                    }
                    className="p-1.5 hover:bg-black/[0.04] hover:text-[#09090b] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8] rounded-md transition-colors"
                    aria-label="Search"
                  >
                    <Search size={14} strokeWidth={1.75} />
                  </button>
                </ActionTooltip>
                <ActionTooltip label="New issue" shortcut="C" side="bottom" sideOffset={6}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="p-1.5 hover:bg-black/[0.04] hover:text-[#09090b] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8] rounded-md transition-colors"
                    aria-label="New issue"
                  >
                    <SquarePen size={14} strokeWidth={1.75} />
                  </button>
                </ActionTooltip>
                <ActionTooltip label="Collapse sidebar" shortcut="⌘B" side="bottom" sideOffset={6}>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-black/[0.04] hover:text-[#09090b] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8] rounded-md transition-colors"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose size={14} strokeWidth={1.75} />
                  </button>
                </ActionTooltip>
              </div>
            </div>

            {/* Sidebar Nav */}
            <div className="px-3 pb-3 flex-1 overflow-y-auto">
              <nav className="flex flex-col space-y-[2px] mt-1 text-[13px]">
                  {topNavItems.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                          isActive
                            ? "text-[#09090b] dark:text-white font-medium"
                            : "text-[#52525b] hover:bg-black/[0.04] hover:text-[#09090b] dark:text-[#8a8f98] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="expandedSidebarActivePill"
                            className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.08] border border-black/5 dark:border-white/5 rounded-md"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                          />
                        )}
                        <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} className="relative z-10" />
                        <span className="relative z-10">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 flex items-center justify-between px-2.5 mb-2">
                  <span className="text-[11px] font-medium tracking-wide text-[#71717a] dark:text-[#8a8f98]">
                    Workspace
                  </span>
                </div>
                <div className="px-2 mb-4">
                  <OrganizationSwitcher
                    hidePersonal={false}
                    afterLeaveOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    afterCreateOrganizationUrl="/dashboard"
                    afterSelectPersonalUrl="/dashboard"
                    appearance={{
                      elements: {
                        organizationSwitcherTrigger:
                          "w-full flex justify-between items-center px-2 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] !text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:!text-[#e8e8e8] text-[13px] font-medium rounded-md transition-colors",
                        organizationSwitcherTriggerIcon: "!text-[#52525b] dark:!text-[#8a8f98] w-3 h-3",
                        organizationPreviewMainIdentifier:
                          "!text-zinc-900 dark:!text-[#e8e8e8] font-medium text-[13px]",
                        organizationPreviewSecondaryIdentifier:
                          "!text-zinc-500 dark:!text-[#8a8f98] text-[11px]",
                      },
                    }}
                  />
                </div>
                <nav className="flex flex-col space-y-[2px] text-[13px]">
                  {workspaceItems.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                          isActive
                            ? "text-[#09090b] dark:text-white font-medium"
                            : "text-[#52525b] hover:bg-black/[0.04] hover:text-[#09090b] dark:text-[#8a8f98] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="expandedSidebarActivePill"
                            className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.08] border border-black/5 dark:border-white/5 rounded-md"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                          />
                        )}
                        <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} className="relative z-10" />
                        <span className="relative z-10">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 mt-auto relative flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                  className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors"
                  title="Help & Resources"
                >
                  <span className="text-[11px] font-bold">?</span>
                </button>
                <ActionTooltip label={effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"} side="top" sideOffset={6}>
                  <button
                    type="button"
                    onClick={(e) => toggleTheme("eclipse", e.currentTarget)}
                    className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors"
                    aria-label="Toggle theme"
                  >
                    {effectiveTheme === "dark" ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
                  </button>
                </ActionTooltip>
              </div>
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
            className={`absolute bg-white dark:bg-[#212226] border border-black/10 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl py-1 z-50 text-[13px] ${
              isSidebarCollapsed
                ? "top-[44px] left-[62px] w-[220px]"
                : "top-[50px] left-3 w-[240px]"
            }`}
          >
            <div
              className="px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#18181b] dark:text-[#e8e8e8]"
              onClick={() => {
                navigate("/settings");
                setIsProfileOpen(false);
              }}
            >
              <span>Settings</span>
            </div>
            <div
              className="px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer text-[#18181b] dark:text-[#e8e8e8]"
              onClick={() => {
                navigate("/team");
                setIsProfileOpen(false);
              }}
            >
              Invite and manage members
            </div>
            <div
              className="px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#18181b] dark:text-[#e8e8e8]"
              onClick={(e) => {
                toggleTheme("eclipse", e.currentTarget);
                setIsProfileOpen(false);
              }}
            >
              <span>Theme: {effectiveTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              {effectiveTheme === "dark" ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
            </div>
            <div className="h-[1px] bg-black/[0.08] dark:bg-white/[0.08] my-1"></div>
            <div
              className="px-3 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#18181b] dark:text-[#e8e8e8]"
              onClick={handleSignOut}
            >
              <span>Log out</span>
              <div className="flex items-center gap-0.5 text-[#71717a] dark:text-[#8a8f98] text-[11px] font-mono">
                <span>⌥</span>
                <span>⇧</span>
                <span>Q</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col p-0 md:py-2 md:pr-2 min-w-0 transition-all duration-200 ${
          isFullViewportRoute
            ? "h-full overflow-hidden"
            : "min-h-screen md:h-full md:overflow-hidden"
        }`}
      >
        <main
          className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-black md:dark:bg-[#131416] rounded-none md:rounded-xl relative z-0 border-0 md:border md:border-black/[0.08] dark:md:border-white/[0.05] shadow-none md:shadow-xs dark:shadow-none md:dark:shadow-2xl ${
            isFullViewportRoute ? "overflow-hidden" : "md:overflow-hidden"
          }`}
        >
          <div
            className={`flex-1 min-h-0 bg-transparent ${
              location.pathname.startsWith("/inbox")
                ? "h-full overflow-hidden overscroll-y-contain"
                : location.pathname.startsWith("/kanban")
                  ? "h-full overflow-hidden flex flex-col px-3.5 py-2 sm:px-4 sm:py-3 md:px-6 lg:px-8 md:py-4 overscroll-y-contain"
                  : "w-full md:h-full md:overflow-y-auto md:overflow-x-hidden px-3.5 pt-2 pb-24 sm:px-4 sm:pt-4 sm:pb-8 md:px-6 lg:px-8 md:py-6"
            }`}
          >
            <Suspense fallback={<PageLoading label={currentRouteTitle} />}>
              <Outlet
                context={{
                  isSidebarCollapsed,
                  toggleSidebar,
                  openMobileNav: () => setIsMobileNavOpen(true),
                }}
              />
            </Suspense>
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
            className="relative w-[280px] max-w-[85vw] h-full bg-[#fbfbfb] dark:bg-black border-r border-black/10 dark:border-white/10 flex flex-col p-3 z-10 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="h-11 flex items-center justify-between px-2 mb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center text-foreground text-[10px] font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-[13px] font-medium text-[#18181b] dark:text-white truncate max-w-[140px]">
                  {userName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 text-[#52525b] hover:text-[#09090b] rounded-md hover:bg-black/[0.04] dark:text-[#8a8f98] dark:hover:text-white dark:hover:bg-white/[0.06]"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto space-y-4">
              <nav className="flex flex-col space-y-[2px] text-[13px]">
                  {topNavItems.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMobileNavOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                          isActive
                            ? "text-[#09090b] dark:text-white font-medium"
                            : "text-[#52525b] hover:bg-black/[0.04] hover:text-[#09090b] dark:text-[#8a8f98] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mobileDrawerActivePill"
                            className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.08] border border-black/5 dark:border-white/5 rounded-md"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                          />
                        )}
                        <item.icon size={16} strokeWidth={isActive ? 2 : 1.75} className="relative z-10" />
                        <span className="relative z-10">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <div className="text-[11px] font-medium tracking-wide text-[#71717a] dark:text-[#8a8f98] px-2.5 mb-2">
                    Workspace
                  </div>
                  <div className="px-1 mb-2">
                    <OrganizationSwitcher
                      hidePersonal={false}
                      afterLeaveOrganizationUrl="/dashboard"
                      afterSelectOrganizationUrl="/dashboard"
                      afterCreateOrganizationUrl="/dashboard"
                      afterSelectPersonalUrl="/dashboard"
                      appearance={{
                        elements: {
                          organizationSwitcherTrigger:
                            "w-full flex justify-between items-center px-2 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] !text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:!text-[#e8e8e8] text-[13px] font-medium rounded-md transition-colors",
                          organizationSwitcherTriggerIcon: "!text-[#52525b] dark:!text-[#8a8f98] w-3 h-3",
                          organizationPreviewMainIdentifier:
                            "!text-zinc-900 dark:!text-[#e8e8e8] font-medium text-[13px]",
                          organizationPreviewSecondaryIdentifier:
                            "!text-zinc-500 dark:!text-[#8a8f98] text-[11px]",
                        },
                      }}
                    />
                  </div>
                </div>

                <nav className="flex flex-col space-y-[2px] text-[13px]">
                  {workspaceItems.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMobileNavOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                          isActive
                            ? "text-[#09090b] dark:text-white font-medium"
                            : "text-[#52525b] hover:bg-black/[0.04] hover:text-[#09090b] dark:text-[#8a8f98] dark:hover:bg-white/[0.04] dark:hover:text-[#e8e8e8]"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mobileDrawerActivePill"
                            className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.08] border border-black/5 dark:border-white/5 rounded-md"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                          />
                        )}
                        <item.icon size={16} strokeWidth={isActive ? 2 : 1.75} className="relative z-10" />
                        <span className="relative z-10">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 text-xs text-[#52525b] hover:text-[#09090b] px-2 py-1.5 rounded-md hover:bg-black/[0.04] dark:text-[#8a8f98] dark:hover:text-white dark:hover:bg-white/[0.04] transition-colors"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
              <div className="relative flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => toggleTheme("eclipse", e.currentTarget)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-white text-xs transition-colors"
                  aria-label="Toggle theme"
                >
                  {effectiveTheme === "dark" ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/[0.04] text-[#52525b] hover:text-[#09090b] dark:bg-white/[0.04] dark:text-[#8a8f98] dark:hover:text-white text-xs"
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
