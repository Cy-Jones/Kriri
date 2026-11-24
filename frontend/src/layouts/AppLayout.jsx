import { useState, useEffect, useRef, Suspense, lazy, useMemo, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import { ContextualRouteSkeleton } from "../components/skeletons/PageSkeletons";
import {
  LayoutDashboard,
  SquareKanban,
  CheckSquare,
  Bug,
  UserRoundGroup,
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
  Sparkles,
  History,
  ChevronDown,
  Settings as SettingsIcon,
} from "lucide-react";
import { KririAgentIcon } from "../components/ai/KririAgentIcon";
import CreateTaskModal from "../components/CreateTaskModal";
import CreateProjectModal from "../components/CreateProjectModal";
const AIAssistantModal = lazy(() => import("../components/ai/AIAssistantModal"));
const ChatHistoryPopover = lazy(() => import("../components/ai/ChatHistoryPopover"));
const CommandPalette = lazy(() => import("../components/CommandPalette"));
const KeyboardShortcutsHelp = lazy(() => import("../components/KeyboardShortcutsHelp"));
const HelpMenuPopover = lazy(() => import("../components/HelpMenuPopover"));
const ContactModal = lazy(() => import("../components/ContactModal"));
const ChangelogModal = lazy(() => import("../components/ChangelogModal"));
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
} from "@clerk/react";
import { updateClerkLocalization } from "../lib/clerkLocalization";
import { api, setClerkTokenGetter, resetAuthCache, clearUserSessionData, clearApiCache, setActiveWorkspaceId } from "../lib/api";
import { clearActiveThemeStorage } from "../lib/userTheme";
import posthog, { trackPageView } from "../lib/posthog";
import { playUiSound } from "../lib/sound";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { theme, effectiveTheme, toggleTheme, setTheme } = useTheme();

  const switcherActionLabel =
    effectiveTheme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode";

  const profileThemeLabel =
    theme === "custom"
      ? effectiveTheme === "dark"
        ? "Theme: Custom (Dark)"
        : "Theme: Custom (Light)"
      : effectiveTheme === "dark"
      ? "Theme: Dark Mode"
      : "Theme: Light Mode";
  const { organization, membership } = useOrganization();

  const [optimisticPath, setOptimisticPath] = useState(null);
  const activePath = optimisticPath || location.pathname;

  // Clear optimistic path during render when location catches up, preventing an extra post-commit re-render
  if (optimisticPath && location.pathname === optimisticPath) {
    setOptimisticPath(null);
  }

  const [memberCount, setMemberCount] = useState(() => {
    if (typeof organization?.membersCount === "number") return organization.membersCount;
    return 1;
  });

  useEffect(() => {
    if (!organization?.id) {
      document.documentElement.removeAttribute("data-sole-member");
      return;
    }

    let isMounted = true;
    const fetchMemberCount = async () => {
      try {
        const cached = api.getCached(`/workspaces/${organization.id}/members`);
        if (Array.isArray(cached) && cached.length > 0) {
          if (isMounted) setMemberCount(cached.length);
        }
        const data = await api.get(`/workspaces/${organization.id}/members`);
        if (Array.isArray(data) && isMounted) {
          setMemberCount(data.length);
        }
      } catch {
        if (typeof organization?.membersCount === "number" && isMounted) {
          setMemberCount(organization.membersCount);
        }
      }
    };

    fetchMemberCount();
    return () => {
      isMounted = false;
    };
  }, [organization?.id, organization?.membersCount]);

  const rawRole = (membership?.role || "").toLowerCase();
  const isOwner = rawRole.includes("owner") || rawRole === "org:admin";
  const isAdmin = rawRole.includes("admin");
  const isSoleOwner = isOwner && memberCount <= 1;

  useEffect(() => {
    if (isSoleOwner) {
      document.documentElement.setAttribute("data-sole-member", "true");
    } else {
      document.documentElement.removeAttribute("data-sole-member");
    }

    const hideSoleMemberTransfer = () => {
      if (!isSoleOwner) return;
      const elements = document.querySelectorAll(
        '.cl-modalContent [data-localization-key*="leaveOrganization"], .cl-organizationProfile-root [data-localization-key*="leaveOrganization"]'
      );
      elements.forEach((el) => {
        const section = el.closest(".cl-profileSection, [class*='profileSection__organizationDanger'], [class*='profileSection']");
        if (section) {
          section.style.display = "none";
        }
      });
    };

    const observer = new MutationObserver(hideSoleMemberTransfer);
    observer.observe(document.body, { childList: true, subtree: true });
    hideSoleMemberTransfer();

    return () => {
      observer.disconnect();
    };
  }, [isSoleOwner]);

  useEffect(() => {
    if (!organization) return;
    const wsName = organization.name || "Software Development";

    if (isOwner) {
      if (memberCount > 1) {
        updateClerkLocalization({
          organizationProfile: {
            profilePage: {
              dangerSection: {
                leaveOrganization: {
                  title: `Transfer Ownership of "${wsName}"`,
                  messageLine1: `Notice: You are the Owner & Administrator of "${wsName}". You cannot leave this workspace without transferring ownership. Please select a team member in Settings > Profile > Workspace Access to take over ownership before leaving.`,
                  messageLine2: `This action will permanently revoke your access to ${wsName}.`,
                  actionDescription: `Type "${wsName}" below to continue.`,
                },
              },
            },
          },
        });
      }
    } else if (isAdmin) {
      updateClerkLocalization({
        organizationProfile: {
          profilePage: {
            dangerSection: {
              leaveOrganization: {
                title: `Leave "${wsName}" as Administrator?`,
                messageLine1: `Notice: You are an Administrator of "${wsName}". Leaving will immediately revoke your management privileges over team members, workspace settings, integrations, and private boards.`,
                messageLine2: `This action will permanently revoke your access to ${wsName}.`,
                actionDescription: `Type "${wsName}" below to continue.`,
              },
            },
          },
        },
      });
    } else {
      updateClerkLocalization({
        organizationProfile: {
          profilePage: {
            dangerSection: {
              leaveOrganization: {
                title: `Leave "${wsName}"?`,
                messageLine1: `Are you sure you want to remove yourself from "${wsName}"? You will immediately lose access to all projects, tasks, issues, and discussions within this workspace.`,
                messageLine2: `This action is permanent and irreversible.`,
                actionDescription: `Type "${wsName}" below to continue.`,
              },
            },
          },
        },
      });
    }
  }, [organization?.name, isOwner, isAdmin, memberCount]);

  useEffect(() => {
    if (getToken) {
      const scope = `${user?.id || "anon"}:${organization?.id || "personal"}`;
      setClerkTokenGetter(getToken, scope);
    }
  }, [getToken, user?.id, organization?.id]);

  useEffect(() => {
    if (location.pathname && !location.pathname.startsWith("/settings")) {
      sessionStorage.setItem("kriri-last-workspace-path", location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  // Session start redirect to user's configured startup view
  useEffect(() => {
    const sessionActive = sessionStorage.getItem("kriri-session-active");
    if (!sessionActive) {
      sessionStorage.setItem("kriri-session-active", "true");
      const behavior = localStorage.getItem("kriri-start-page-behavior") || "default_view";
      const lastPage = localStorage.getItem("kriri-last-visited-page");
      if (behavior === "last_visited" && lastPage && lastPage !== "/" && !lastPage.startsWith("/login")) {
        navigate(lastPage, { replace: true });
        return;
      }
      const startupView = localStorage.getItem("kriri-default-view") || "dashboard";
      if (startupView !== "dashboard" && (location.pathname === "/dashboard" || location.pathname === "/")) {
        navigate(`/${startupView}`, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  // Track last visited page for start-page behavior
  useEffect(() => {
    if (location.pathname && !location.pathname.startsWith("/login")) {
      localStorage.setItem("kriri-last-visited-page", location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  // Global handler for Open External Links in New Tab
  useEffect(() => {
    const handleGlobalLinkClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        const isExternal = !href.startsWith(window.location.origin);
        if (isExternal && localStorage.getItem("kriri-open-links-new-tab") === "true") {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        }
      }
    };
    document.addEventListener("click", handleGlobalLinkClick, { capture: true });
    return () => document.removeEventListener("click", handleGlobalLinkClick, { capture: true });
  }, []);
  const { userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({
    userMemberships: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
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

  const toggleSidebar = useCallback(() => {
    playUiSound("toggle");
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kriri_sidebar_collapsed", String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const openMobileNav = useCallback(() => setIsMobileNavOpen(true), []);
  const outletContext = useMemo(
    () => ({
      isSidebarCollapsed,
      toggleSidebar,
      openMobileNav,
    }),
    [isSidebarCollapsed, toggleSidebar, openMobileNav]
  );

  useEffect(() => {
    const handleResize = () => {
      const saved = localStorage.getItem("kriri_sidebar_collapsed");
      if (saved === null) {
        setIsSidebarCollapsed(window.innerWidth >= 768 && window.innerWidth < 1024);
      }
    };
    const handleOpenNav = () => setIsMobileNavOpen(true);
    const handleOpenAI = () => setIsAIAssistantOpen(true);
    const handleKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAIAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("open-mobile-nav", handleOpenNav);
    window.addEventListener("open-ai-assistant", handleOpenAI);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("open-mobile-nav", handleOpenNav);
      window.removeEventListener("open-ai-assistant", handleOpenAI);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const getRouteLabel = (pathname) => {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname === "/inbox" || pathname.startsWith("/inbox")) return "Inbox";
    if (pathname === "/tasks" || pathname.startsWith("/tasks") || pathname.startsWith("/issues") || pathname.startsWith("/kanban")) return "Issues";
    if (pathname === "/agent" || pathname.startsWith("/agent")) return "Agent";
    if (pathname === "/projects" || pathname === "/projects/") return "Projects";
    if (pathname.startsWith("/projects/")) return "Project Details";
    if (pathname === "/analytics" || pathname.startsWith("/analytics")) return "Analytics";
    if (pathname === "/team" || pathname.startsWith("/team")) return "Team";
    if (pathname === "/settings" || pathname.startsWith("/settings")) return "Settings";
    return "Workspace";
  };

  const isRouteActive = (itemPath) => {
    if (itemPath === "/projects") {
      return activePath === "/projects" || activePath.startsWith("/projects/");
    }
    if (itemPath === "/tasks" || itemPath === "/issues") {
      return activePath === "/tasks" || activePath.startsWith("/tasks") || activePath === "/issues" || activePath.startsWith("/issues") || activePath === "/kanban";
    }
    return activePath === itemPath || activePath.startsWith(itemPath + "/");
  };

  const handleFastNav = useCallback((path, e) => {
    if (e && e.button !== 0) return;
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) return;
    setOptimisticPath(path);
    navigate(path);
  }, [navigate]);

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
    onOpenCreateProject: () => setIsCreateProjectOpen(true),
    onToggleSidebar: toggleSidebar,
    onToggleAgent: () => setIsAIAssistantOpen((prev) => !prev),
  });

  useEffect(() => {
    // Only record that onboarding was completed if user explicitly has onboarded metadata or an active org membership
    if (user?.id && (user?.unsafeMetadata?.onboarded || (userMemberships?.data && userMemberships.data.length > 0))) {
      localStorage.setItem(`kriri_onboarded_${user.id}`, "true");
      localStorage.setItem("kriri_has_onboarded", "true");
    }
  }, [user?.id, user?.unsafeMetadata?.onboarded, userMemberships?.data]);

  useEffect(() => {
    // If the user has completed onboarding, they should never be kicked back to /onboarding,
    // even if they delete all organization workspaces and fall back to their personal account.
    const hasOnboarded =
      user?.unsafeMetadata?.onboarded ||
      (userMemberships?.data && userMemberships.data.length > 0);

    if (
      !hasOnboarded &&
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
    user?.id,
    user?.unsafeMetadata?.onboarded,
  ]);

  useEffect(() => {
    if (user?.id) {
      const storedLastUser = localStorage.getItem("kriri_current_user_id");
      if (storedLastUser && storedLastUser !== user.id) {
        clearUserSessionData();
      }
      localStorage.setItem("kriri_current_user_id", user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      api
        .post("/auth/sync", {})
        .catch((err) => console.error("Sync error:", err));

      const activeAuthKey = `${user.id}:${organization?.id || "personal"}`;
      if (currentOrgRef.current === null) {
        currentOrgRef.current = activeAuthKey;
        if (organization?.id) {
          setActiveWorkspaceId(organization.id);
        }
      } else if (currentOrgRef.current !== activeAuthKey) {
        currentOrgRef.current = activeAuthKey;
        if (organization?.id) {
          setActiveWorkspaceId(organization.id);
        } else {
          setActiveWorkspaceId(null);
        }
      }
    }
  }, [user?.id, organization?.id]);

  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id);
      if (user.username) {
        localStorage.setItem("kriri-user-username", user.username);
      }
      if (user.fullName) {
        localStorage.setItem("kriri-user-fullname", user.fullName);
      }
      if (user.imageUrl) {
        localStorage.setItem("kriri-user-avatar", user.imageUrl);
      }
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
      if (email) {
        localStorage.setItem("kriri-user-email", email);
      }
    }
  }, [user?.id, user?.username, user?.fullName, user?.imageUrl, user?.primaryEmailAddress?.emailAddress]);

  // Route Tracking: Safely track route changes ($pageview) on <Outlet /> transition asynchronously
  useEffect(() => {
    trackPageView(location.pathname, location.search);
  }, [location.pathname, location.search]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileTriggerRef = useRef(null);
  const collapsedProfileTriggerRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleOutsideClick = (e) => {
      const isInsideDropdown = profileDropdownRef.current && profileDropdownRef.current.contains(e.target);
      const isInsideTrigger = profileTriggerRef.current && profileTriggerRef.current.contains(e.target);
      const isInsideCollapsedTrigger = collapsedProfileTriggerRef.current && collapsedProfileTriggerRef.current.contains(e.target);

      if (!isInsideDropdown && !isInsideTrigger && !isInsideCollapsedTrigger) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isProfileOpen]);

  const userUsername =
    user?.username ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-user-username") : null);

  const nameFormat =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-name-format") || "full"
      : "full";

  const userFullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.firstName ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-user-fullname") : null) ||
    "Cyrus Jones";

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-user-email") : null) ||
    "";

  const userName =
    (nameFormat === "username" && userUsername ? `@${userUsername}` : null) ||
    userFullName;

  const initials = (() => {
    if (user?.firstName && user?.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (userFullName && userFullName !== "Cyrus Jones") {
      const parts = userFullName.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.firstName) return user.firstName.slice(0, 2).toUpperCase();
    if (userUsername) return userUsername.slice(0, 2).toUpperCase();
    return "CJ";
  })();

  const avatarUrl =
    user?.imageUrl ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-user-avatar") : null) ||
    null;

  const defaultStartupPath = `/${
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-default-view") || "dashboard"
      : "dashboard"
  }`;

  const topNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", path: "/inbox", icon: Inbox },
    { name: "Issues", path: "/tasks", icon: CheckSquare },
    { name: "Agent", path: "/agent", icon: KririAgentIcon },
  ];

  const workspaceItems = [
    { name: "Projects", path: "/projects", icon: FolderKanban },
    { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
    { name: "Team", path: "/team", icon: UserRoundGroup },
  ];

  const handleSignOut = () => {
    posthog.capture("logout");
    posthog.reset();
    clearUserSessionData();
    clearActiveThemeStorage();
    signOut(() => navigate("/"));
  };

  const isFullViewportRoute =
    location.pathname.startsWith("/inbox") ||
    location.pathname.startsWith("/tasks") ||
    location.pathname.startsWith("/kanban") ||
    location.pathname.startsWith("/agent") ||
    location.pathname.startsWith("/projects/");

  return (
    <TooltipPrimitive.Provider delayDuration={120} skipDelayDuration={300}>
      <div
        className={`flex w-full bg-[var(--sidebar,#fbfbfb)] dark:bg-[var(--sidebar,#000000)] text-text-primary text-[13px] font-sans selection:bg-accent/30 selection:text-white transition-colors duration-200 ${
          isFullViewportRoute
            ? "h-[100dvh] overflow-hidden"
            : "min-h-screen md:h-[100dvh] md:overflow-hidden"
        }`}
        style={{ backgroundColor: "var(--sidebar)" }}
      >
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-shrink-0 bg-transparent flex-col transition-all duration-200 relative select-none text-[var(--sidebar-foreground)] ${
          isSidebarCollapsed ? "w-[60px]" : "w-[260px]"
        }`}
        style={{ color: "var(--sidebar-foreground)" }}
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
                  className="w-8 h-8 flex items-center justify-center text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] rounded-md transition-colors"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={16} strokeWidth={1.75} />
                </button>
              </ActionTooltip>
            </div>

            {/* Profile Avatar */}
            <div className="relative mb-2">
              <ActionTooltip
                label={organization?.name ? `${organization.name} (${userFullName})` : `${userFullName} (Workspace)`}
                side="right"
                sideOffset={10}
              >
                <button
                  type="button"
                  ref={collapsedProfileTriggerRef}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`p-1 rounded-md transition-colors ${
                    isProfileOpen ? "bg-[var(--sidebar-active)]" : "hover:bg-[var(--sidebar-hover)]"
                  }`}
                  aria-label="Workspace & Profile"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userFullName}
                      className="w-[20px] h-[20px] rounded-full object-cover shadow-sm ring-1 ring-[var(--sidebar-border)]"
                    />
                  ) : (
                    <div className="w-[20px] h-[20px] rounded-full bg-[var(--sidebar-hover)] border border-[var(--sidebar-border)] flex items-center justify-center text-[var(--sidebar-foreground)] text-[9px] font-bold tracking-tighter shadow-sm">
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
                  className="w-8 h-8 flex items-center justify-center text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] rounded-md transition-colors"
                  aria-label="Search"
                >
                  <Search size={14} strokeWidth={1.75} />
                </button>
              </ActionTooltip>
              <ActionTooltip label="New issue" shortcut="C" side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] rounded-md transition-colors"
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
                        onMouseDown={(e) => handleFastNav(item.path, e)}
                        onClick={(e) => {
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                          }
                        }}
                        aria-label={item.name}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative w-9 h-8 flex items-center justify-center rounded-full ${
                          isActive
                            ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.08))] border border-[var(--sidebar-active-border,rgba(255,255,255,0.12))] shadow-xs"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-transparent transition-colors duration-150"
                        }`}
                        style={{
                          color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)",
                        }}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2 : 1.8}
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        />
                      </Link>
                    </ActionTooltip>
                  );
                })}

                <div
                  className="w-5 h-[1px] my-1"
                  style={{ backgroundColor: "var(--sidebar-border, rgba(255,255,255,0.08))" }}
                />

                {workspaceItems.map((item) => {
                  const isActive = isRouteActive(item.path);
                  return (
                    <ActionTooltip key={item.name} label={item.name} side="right" sideOffset={10}>
                      <Link
                        to={item.path}
                        onMouseDown={(e) => handleFastNav(item.path, e)}
                        onClick={(e) => {
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                          }
                        }}
                        aria-label={item.name}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative w-9 h-8 flex items-center justify-center rounded-full ${
                          isActive
                            ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.08))] border border-[var(--sidebar-active-border,rgba(255,255,255,0.12))] shadow-xs"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-transparent transition-colors duration-150"
                        }`}
                        style={{
                          color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)",
                        }}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2 : 1.8}
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        />
                      </Link>
                    </ActionTooltip>
                  );
                })}
              </div>

            {/* Footer Help & Theme */}
            <div className="p-2 mt-auto relative flex flex-col items-center gap-1.5">
              <ActionTooltip label={switcherActionLabel} side="right" sideOffset={10}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme("eclipse", e.currentTarget);
                  }}
                  className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors cursor-pointer"
                  aria-label={switcherActionLabel}
                  title={switcherActionLabel}
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
              {isHelpMenuOpen && (
                <Suspense fallback={null}>
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
                </Suspense>
              )}
            </div>
          </div>
        ) : (
          /* Expanded Sidebar */
          <>
            {/* Sidebar Header */}
            <div className="h-[48px] flex items-center justify-between px-3 mt-1">
              <button
                type="button"
                ref={profileTriggerRef}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 text-[var(--sidebar-foreground)] font-medium cursor-pointer px-2 py-1 -ml-1.5 rounded-md transition-colors select-none ${
                  isProfileOpen ? "bg-[var(--sidebar-active)]" : "hover:bg-[var(--sidebar-hover)]"
                }`}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userFullName}
                      className="w-full h-full rounded-full object-cover shadow-xs ring-1 ring-[var(--sidebar-border)]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--sidebar-hover)] border border-[var(--sidebar-border)] flex items-center justify-center text-[var(--sidebar-foreground)] text-[9px] font-bold tracking-tighter shadow-xs">
                      {initials}
                    </div>
                  )}
                </div>
                <span className="text-[13px] font-medium text-[var(--sidebar-foreground)] truncate max-w-[135px] leading-none inline-flex items-center">
                  {userFullName}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-[var(--sidebar-muted)] opacity-70 shrink-0 transition-transform duration-150 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="flex items-center gap-0.5 text-[var(--sidebar-muted)]">
                <ActionTooltip label="Search" shortcut="⌘K" side="bottom" sideOffset={6}>
                  <button
                    type="button"
                    onClick={() =>
                      document.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                      )
                    }
                    className="p-1.5 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] rounded-md transition-colors"
                    aria-label="Search"
                  >
                    <Search size={14} strokeWidth={1.75} />
                  </button>
                </ActionTooltip>
                <ActionTooltip label="New issue" shortcut="C" side="bottom" sideOffset={6}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="p-1.5 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] rounded-md transition-colors"
                    aria-label="New issue"
                  >
                    <SquarePen size={14} strokeWidth={1.75} />
                  </button>
                </ActionTooltip>
                <ActionTooltip label="Collapse sidebar" shortcut="⌘B" side="bottom" sideOffset={6}>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] rounded-md transition-colors"
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
                        onMouseDown={(e) => handleFastNav(item.path, e)}
                        onClick={(e) => {
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                          }
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md ${
                          isActive
                            ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.08))] border border-[var(--sidebar-active-border,rgba(255,255,255,0.12))] font-semibold"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium border border-transparent transition-colors duration-150"
                        }`}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2 : 1.8}
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        />
                        <span
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        >
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 flex items-center justify-between px-2.5 mb-2">
                  <span
                    className="text-[11px] font-medium tracking-wide"
                    style={{ color: "var(--sidebar-muted)" }}
                  >
                    Workspace
                  </span>
                </div>
                <div className="px-2 mb-4">
                  {user ? (
                    <OrganizationSwitcher
                      hidePersonal={false}
                      afterLeaveOrganizationUrl={defaultStartupPath}
                      afterSelectOrganizationUrl={defaultStartupPath}
                      afterCreateOrganizationUrl={defaultStartupPath}
                      afterSelectPersonalUrl={defaultStartupPath}
                      appearance={{
                        elements: {
                          organizationSwitcherTrigger:
                            "w-full flex justify-between items-center px-2 py-1.5 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] text-[13px] font-medium rounded-md transition-colors [&_.cl-organizationPreviewMainIdentifier]:!text-[var(--sidebar-foreground)] [&_.cl-organizationPreviewSecondaryIdentifier]:!text-[var(--sidebar-muted)]",
                          organizationSwitcherTriggerIcon: "!text-[var(--sidebar-muted)] w-3 h-3",
                        },
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full flex justify-between items-center px-2 py-1.5 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] text-[13px] font-medium rounded-md transition-colors cl-organizationSwitcherTrigger"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-[6px] border border-[var(--sidebar-border)] bg-[var(--sidebar-hover)] flex items-center justify-center text-[var(--sidebar-foreground)] cl-avatarBox">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </div>
                        <span className="truncate max-w-[130px] font-medium text-[13px] text-[var(--sidebar-foreground)] cl-organizationPreviewMainIdentifier">
                          {organization?.name || "Software Development"}
                        </span>
                      </div>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[var(--sidebar-muted)] cl-organizationSwitcherTriggerIcon"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>
                <nav className="flex flex-col space-y-[2px] text-[13px]">
                  {workspaceItems.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onMouseDown={(e) => handleFastNav(item.path, e)}
                        onClick={(e) => {
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                          }
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md ${
                          isActive
                            ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.08))] border border-[var(--sidebar-active-border,rgba(255,255,255,0.12))] font-semibold"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium border border-transparent transition-colors duration-150"
                        }`}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2 : 1.8}
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        />
                        <span
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        >
                          {item.name}
                        </span>
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
                  className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.08))] text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] transition-colors"
                  title="Help & Resources"
                >
                  <span className="text-[11px] font-bold">?</span>
                </button>
                <ActionTooltip label={switcherActionLabel} side="top" sideOffset={6}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme("eclipse", e.currentTarget);
                    }}
                    className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.08))] text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] transition-colors cursor-pointer"
                    aria-label={switcherActionLabel}
                    title={switcherActionLabel}
                  >
                    {effectiveTheme === "dark" ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
                  </button>
                </ActionTooltip>
              </div>
              {isHelpMenuOpen && (
                <Suspense fallback={null}>
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
                </Suspense>
              )}
            </div>
          </>
        )}

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div
            ref={profileDropdownRef}
            className={`absolute bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)] rounded-xl shadow-2xl py-1 z-50 text-[13px] backdrop-blur-md ${
              isSidebarCollapsed
                ? "top-[44px] left-[62px] w-[256px]"
                : "top-[50px] left-2.5 w-[248px]"
            }`}
          >
            {/* User Profile Summary Header (Clerk Design Principles) */}
            <div className="p-3 border-b border-[var(--border)] mb-1">
              <div className="flex items-center gap-3">
                {/* Left Avatar */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userFullName}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-[var(--border)] shadow-xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--popover-foreground)] text-xs font-semibold shadow-xs">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Right Stacked Identity */}
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="font-semibold text-[13.5px] text-[var(--popover-foreground)] truncate leading-snug tracking-tight">
                    {userFullName}
                  </div>
                  {userUsername && (
                    <div className="text-[12px] text-[var(--muted-foreground)] truncate leading-tight font-mono tracking-tight mt-0.5">
                      @{userUsername}
                    </div>
                  )}
                  {userEmail && (
                    <div
                      className="text-[11.5px] text-[var(--muted-foreground)] opacity-75 truncate leading-tight mt-0.5"
                      title={userEmail}
                    >
                      {userEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Actions */}
            <div className="px-1 py-0.5 space-y-0.5">
              <button
                type="button"
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer flex items-center justify-between text-[var(--popover-foreground)] transition-colors select-none text-left"
                onClick={() => {
                  navigate("/settings");
                  setIsProfileOpen(false);
                }}
              >
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer flex items-center justify-between text-[var(--popover-foreground)] transition-colors select-none text-left"
                onClick={() => {
                  navigate("/team");
                  setIsProfileOpen(false);
                }}
              >
                <span>Invite and manage members</span>
              </button>
              <button
                type="button"
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer flex items-center justify-between text-[var(--popover-foreground)] transition-colors select-none text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTheme("eclipse", e.currentTarget);
                  setIsProfileOpen(false);
                }}
              >
                <span>{profileThemeLabel}</span>
                {effectiveTheme === "dark" ? (
                  <Sun size={13} strokeWidth={1.8} className="text-[var(--muted-foreground)]" />
                ) : (
                  <Moon size={13} strokeWidth={1.8} className="text-[var(--muted-foreground)]" />
                )}
              </button>
            </div>

            <div className="h-[1px] bg-[var(--border)] my-1 mx-1"></div>

            <div className="px-1 py-0.5">
              <button
                type="button"
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer flex items-center justify-between text-[var(--popover-foreground)] transition-colors select-none text-left"
                onClick={handleSignOut}
              >
                <span>Log out</span>
                <div className="flex items-center gap-0.5 text-[var(--muted-foreground)] text-[11px] font-mono">
                  <span>⌥</span>
                  <span>⇧</span>
                  <span>Q</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col p-0 md:p-2 min-w-0 transition-all duration-200 ${
          isFullViewportRoute
            ? "h-full overflow-hidden"
            : "min-h-screen md:h-full md:overflow-hidden"
        }`}
      >
        <main
          className={`flex-1 flex flex-col min-w-0 rounded-none md:rounded-xl relative z-0 border-0 md:border md:border-[var(--border,rgba(255,255,255,0.05))] shadow-none md:shadow-xs dark:shadow-none md:dark:shadow-2xl ${
            isFullViewportRoute ? "overflow-hidden" : "md:overflow-hidden"
          }`}
          style={{ backgroundColor: "var(--card-bg)" }}
        >
          <div
            className={`flex-1 min-h-0 bg-transparent ${
              location.pathname.startsWith("/inbox") || location.pathname.startsWith("/agent")
                ? "h-full overflow-hidden overscroll-y-contain"
                : location.pathname.startsWith("/kanban") || location.pathname.startsWith("/tasks") || location.pathname === "/projects" || location.pathname === "/projects/"
                  ? "h-full overflow-hidden flex flex-col px-3.5 pt-2 pb-0 sm:px-4 sm:pt-3 sm:pb-0 md:px-6 lg:px-8 md:pt-4 md:pb-0 overscroll-y-contain"
                  : location.pathname.startsWith("/projects/")
                    ? "h-full overflow-hidden flex flex-col"
                    : "w-full md:h-full md:overflow-y-auto md:overflow-x-hidden px-3.5 pt-2 pb-24 sm:px-4 sm:pt-4 sm:pb-8 md:px-6 lg:px-8 md:py-6"
            }`}
          >
            <Suspense fallback={<ContextualRouteSkeleton pathname={location.pathname} />}>
              <Outlet context={outletContext} />
            </Suspense>
          </div>
        </main>

        {/* Bottom Agent Bar (outside of main container, completely transparent with no gray background) */}
        {!location.pathname.startsWith("/agent") && (
          <div
            className="fixed md:static right-3 z-30 md:z-auto bg-[var(--surface-floating)] md:bg-transparent backdrop-blur-md md:backdrop-blur-none border border-[var(--border)] md:border-0 rounded-full md:rounded-none shadow-md md:shadow-none h-8 md:h-8 px-2 md:px-2 flex items-center justify-end shrink-0 select-none transition-all"
            style={{
              bottom: "max(calc(env(safe-area-inset-bottom, 0px) + 12px), 14px)",
            }}
          >
            <div className="flex items-center gap-0.5 sm:gap-1 transition-colors text-[13px]" style={{ color: "var(--sidebar-foreground)" }}>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(false);
                  setIsAIAssistantOpen((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-full md:rounded-md transition-all group font-medium ${
                  isAIAssistantOpen
                    ? "bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] shadow-xs"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)]"
                }`}
                title="Open Kriri Agent (⌘J)"
                style={{ color: "var(--sidebar-foreground)" }}
              >
                <KririAgentIcon
                  size={17}
                  strokeWidth={1.85}
                  className="transition-transform group-hover:scale-105 text-[var(--sidebar-foreground)]"
                />
                <span className="font-medium text-[12.5px] md:text-[13px] tracking-tight text-[var(--sidebar-foreground)]">
                  Agent
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className={`p-1 md:p-1.5 rounded-full md:rounded-md transition-all cursor-pointer ${
                  isHistoryOpen
                    ? "bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] shadow-xs"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)]"
                }`}
                title="Chat History"
                aria-label="Chat History"
                aria-expanded={isHistoryOpen}
                style={{ color: "var(--sidebar-foreground)" }}
              >
                <History size={16} strokeWidth={1.85} className="text-[var(--sidebar-foreground)]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isHistoryOpen && (
        <Suspense fallback={null}>
          <ChatHistoryPopover
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectConversation={(convId) => {
              setSelectedConversationId(convId);
              setIsAIAssistantOpen(true);
            }}
            onNewChat={() => {
              setSelectedConversationId(null);
              setIsAIAssistantOpen(true);
            }}
          />
        </Suspense>
      )}

      {isAIAssistantOpen && (
        <Suspense fallback={null}>
          <AIAssistantModal
            isOpen={isAIAssistantOpen}
            onClose={() => {
              setIsAIAssistantOpen(false);
              setSelectedConversationId(null);
            }}
            selectedConversationId={selectedConversationId}
          />
        </Suspense>
      )}

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div
            style={{
              paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
              backgroundColor: "var(--sidebar)",
            }}
            className="relative w-[280px] max-w-[85vw] h-full bg-[var(--sidebar,#fbfbfb)] dark:bg-[var(--sidebar,#000000)] border-r border-black/10 dark:border-[var(--sidebar-border,rgba(255,255,255,0.08))] flex flex-col p-3 z-10 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="h-11 flex items-center justify-between px-2 mb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userFullName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center text-foreground text-[10px] font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-[13px] font-medium text-[var(--sidebar-foreground)] truncate max-w-[140px] leading-none flex items-center">
                  {userFullName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)] rounded-md hover:bg-[var(--sidebar-hover,rgba(255,255,255,0.06))] transition-colors"
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
                        onMouseDown={(e) => {
                          handleFastNav(item.path, e);
                          setIsMobileNavOpen(false);
                        }}
                        onClick={(e) => {
                          setIsMobileNavOpen(false);
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                          }
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md ${
                          isActive
                            ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.08))] border border-[var(--sidebar-active-border,rgba(255,255,255,0.12))] font-semibold"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium border border-transparent transition-colors duration-150"
                        }`}
                      >
                        <item.icon
                          size={16}
                          strokeWidth={isActive ? 2 : 1.75}
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        />
                        <span
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        >
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>

                <div
                  className="pt-2 border-t"
                  style={{ borderColor: "var(--sidebar-border, rgba(255,255,255,0.08))" }}
                >
                  <div
                    className="text-[11px] font-medium tracking-wide px-2.5 mb-2 uppercase"
                    style={{ color: "var(--sidebar-muted)" }}
                  >
                    Workspace
                  </div>
                  <div className="px-1 mb-2">
                    {user ? (
                      <OrganizationSwitcher
                        hidePersonal={false}
                        afterLeaveOrganizationUrl={defaultStartupPath}
                        afterSelectOrganizationUrl={defaultStartupPath}
                        afterCreateOrganizationUrl={defaultStartupPath}
                        afterSelectPersonalUrl={defaultStartupPath}
                        appearance={{
                          elements: {
                            organizationSwitcherTrigger:
                              "w-full flex justify-between items-center px-2 py-1.5 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] text-[13px] font-medium rounded-md transition-colors [&_.cl-organizationPreviewMainIdentifier]:!text-[var(--sidebar-foreground)] [&_.cl-organizationPreviewSecondaryIdentifier]:!text-[var(--sidebar-muted)]",
                            organizationSwitcherTriggerIcon: "!text-[var(--sidebar-muted)] w-3 h-3",
                          },
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full flex justify-between items-center px-2 py-1.5 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] text-[13px] font-medium rounded-md transition-colors cl-organizationSwitcherTrigger"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-[6px] border border-[var(--sidebar-border)] bg-[var(--sidebar-hover)] flex items-center justify-center text-[var(--sidebar-foreground)] cl-avatarBox">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </div>
                          <span className="truncate max-w-[130px] font-medium text-[13px] text-[var(--sidebar-foreground)] cl-organizationPreviewMainIdentifier">
                            {organization?.name || "Software Development"}
                          </span>
                        </div>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[var(--sidebar-muted)] cl-organizationSwitcherTriggerIcon"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <nav className="flex flex-col space-y-[2px] text-[13px]">
                  {workspaceItems.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onMouseDown={(e) => {
                          handleFastNav(item.path, e);
                          setIsMobileNavOpen(false);
                        }}
                        onClick={(e) => {
                          setIsMobileNavOpen(false);
                          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                          }
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md ${
                          isActive
                            ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.08))] border border-[var(--sidebar-active-border,rgba(255,255,255,0.12))] font-semibold"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] font-medium border border-transparent transition-colors duration-150"
                        }`}
                      >
                        <item.icon
                          size={16}
                          strokeWidth={isActive ? 2 : 1.75}
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        />
                        <span
                          className="relative z-10"
                          style={{ color: isActive ? "var(--sidebar-foreground)" : "var(--sidebar-muted)" }}
                        >
                          {item.name}
                        </span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme("eclipse", e.currentTarget);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52525b] hover:text-black dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#8a8f98] dark:hover:text-white text-xs transition-colors cursor-pointer"
                  aria-label={switcherActionLabel}
                  title={switcherActionLabel}
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
                {isHelpMenuOpen && (
                  <Suspense fallback={null}>
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
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <Suspense fallback={null}>
          <CreateTaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onTaskCreated={(newTask) => {
              const current = api.getCached("/tasks");
              if (Array.isArray(current)) {
                api.setCached("/tasks", [newTask, ...current]);
              } else {
                clearApiCache("/tasks");
              }
              window.dispatchEvent(new CustomEvent("kriri:task-created", { detail: newTask }));
            }}
          />
        </Suspense>
      )}

      {isCreateProjectOpen && (
        <Suspense fallback={null}>
          <CreateProjectModal
            isOpen={isCreateProjectOpen}
            onClose={() => setIsCreateProjectOpen(false)}
            onProjectCreated={(newProject) => {
              const current = api.getCached("/projects");
              if (Array.isArray(current)) {
                api.setCached("/projects", [newProject, ...current]);
              } else {
                clearApiCache("/projects");
              }
              window.dispatchEvent(new CustomEvent("kriri:project-created", { detail: newProject }));
              if (!location.pathname.startsWith("/projects")) {
                navigate("/projects");
              }
            }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <CommandPalette
          openCreateTask={() => setIsModalOpen(true)}
          openHelp={() => setIsHelpOpen(true)}
        />
      </Suspense>

      {isHelpOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsHelp isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
        </Suspense>
      )}

      {isContactOpen && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={isContactOpen}
            onOpenChange={setIsContactOpen}
          />
        </Suspense>
      )}

      {isChangelogOpen && (
        <Suspense fallback={null}>
          <ChangelogModal
            isOpen={isChangelogOpen}
            onOpenChange={setIsChangelogOpen}
            initialRelease={selectedRelease}
          />
        </Suspense>
      )}
      </div>
    </TooltipPrimitive.Provider>
  );
}
