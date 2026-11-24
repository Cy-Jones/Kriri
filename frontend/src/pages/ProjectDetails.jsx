import { useState, useEffect, useMemo, useDeferredValue, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useUser, useOrganization } from "@clerk/react";
import { api } from "../lib/api";
import { trackAsync } from "../lib/posthog";
import { ProjectDetailsSkeleton } from "../components/skeletons/PageSkeletons";
import { useDeferredSkeleton } from "../hooks/useDeferredSkeleton";
import { useSocket } from "../contexts/useSocket";
import { useTasksStore, dataStore } from "../lib/dataStore";
import StatusPicker, { getStatusIcon } from "../components/StatusPicker";
import PriorityPicker, { getPriorityIcon } from "../components/PriorityPicker";
import HealthPicker, { getHealthIcon } from "../components/HealthPicker";
import LeadPicker from "../components/LeadPicker";
import DatePicker from "../components/DatePicker";
import MembersAvatarStack from "../components/projects/MembersAvatarStack";
import { getInitial, getAvatarColor } from "../lib/avatarUtils";
import { copyTextToClipboard } from "../lib/use-copy-feedback";
import {
  Plus,
  CheckSquare,
  FileText,
  Menu,
  Star,
  Link2,
  Bell,
  PanelRight,
  MoreHorizontal,
  SquarePen,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  Check,
  Sparkles,
} from "lucide-react";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import ProjectHealthCard from "../components/ai/ProjectHealthCard";
import { useListShortcuts } from "../hooks/useListShortcuts";
import { useTheme } from "../contexts/ThemeContext";
import { playUiSound } from "../lib/sound";
import { Format as Checklist } from "@lucasmarkes/hairline/react";
import ViewSwitcher from "../components/ViewSwitcher";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { effectiveTheme } = useTheme();

  const [project, setProject] = useState(() => {
    if (location.state?.project) return location.state.project;
    const fromApiCache = api.getCached("/projects");
    if (Array.isArray(fromApiCache)) {
      const found = fromApiCache.find(
        (p) => String(p.id) === String(id) || p.slug === id || p.identifier === id
      );
      if (found) return found;
    }
    const singleCache = api.getCached(`/projects/${id}`);
    if (singleCache) return singleCache;
    return null;
  });
  const [loading, setLoading] = useState(() => !project);
  const { user } = useUser();
  const { organization, membership } = useOrganization();
  const socket = useSocket();

  const { tasks: allTasks } = useTasksStore();
  const tasks = useMemo(() => {
    if (!id || !Array.isArray(allTasks)) return [];
    return allTasks.filter(
      (t) => String(t.project_id) === String(id) || String(t.project_slug) === String(id)
    );
  }, [allTasks, id]);
  const tasksLoaded = true;
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [drawerTouchStartY, setDrawerTouchStartY] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  // Dynamic layout metrics for mobile drawer (handles iOS Safari dynamic bottom bar)
  const [mobileDrawerMetrics, setMobileDrawerMetrics] = useState(() => {
    if (typeof window === "undefined") {
      return { top: "15vh", bottomOffset: 120, paddingBottom: 180 };
    }
    const screenH = window.screen?.height || window.innerHeight;
    const innerH = window.innerHeight;
    const bottomBarDiff = Math.max(screenH - innerH, 120);
    return {
      top: "15vh",
      bottomOffset: bottomBarDiff,
      paddingBottom: bottomBarDiff + 80,
    };
  });

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const calculateMetrics = () => {
      const screenH = window.screen?.height || window.innerHeight;
      const innerH = window.innerHeight;
      const bottomBarDiff = Math.max(screenH - innerH, 120);
      setMobileDrawerMetrics({
        top: "15vh",
        bottomOffset: bottomBarDiff,
        paddingBottom: bottomBarDiff + 80,
      });
    };

    calculateMetrics();
    window.addEventListener("resize", calculateMetrics);
    window.addEventListener("orientationchange", calculateMetrics);
    return () => {
      window.removeEventListener("resize", calculateMetrics);
      window.removeEventListener("orientationchange", calculateMetrics);
    };
  }, [isMobileSidebarOpen]);

  // Lock body & document scroll when mobile properties drawer is open (clean overflow lock)
  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isMobileSidebarOpen]);

  const formatProjectDates = (startDate, dueDate) => {
    if (!startDate && !dueDate) return "Set dates";
    const formatSingle = (val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const start = formatSingle(startDate);
    const end = formatSingle(dueDate);
    if (start && end) return `${start} → ${end}`;
    if (end) return `${end}`;
    if (start) return `Starts ${start}`;
    return "Set dates";
  };

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  // A user can manage project properties unless explicitly restricted as Guest or Viewer.
  // Defaults to true so members are not blocked during initial load or while fetching role.
  const canManageProjects =
    currentUserRole === "Guest" || currentUserRole === "Viewer" ? false : true;

  useEffect(() => {
    const controller = new AbortController();
    const fetchRole = async () => {
      if (!organization) {
        setCurrentUserRole("Owner");
        return;
      }
      try {
        const response = await api.get(
          `/workspaces/${organization.id}/members`,
          { signal: controller.signal },
        );
        const members = Array.isArray(response)
          ? response
          : response.data?.members || [];
        setWorkspaceMembers(members);
        const userEmail = (user?.primaryEmailAddress?.emailAddress || "").toLowerCase();
        const currentMember = members.find(
          (m) =>
            (m.email && m.email.toLowerCase() === userEmail) ||
            String(m.id) === String(user?.id),
        );
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        } else if (membership?.role) {
          const rawRole = (membership.role || "").toLowerCase();
          setCurrentUserRole(
            rawRole.includes("admin") || rawRole.includes("owner")
              ? "Owner"
              : "Member",
          );
        } else {
          setCurrentUserRole("Member");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch role", err);
          if (membership?.role) {
            const rawRole = (membership.role || "").toLowerCase();
            setCurrentUserRole(
              rawRole.includes("admin") || rawRole.includes("owner")
                ? "Owner"
                : "Member",
            );
          } else {
            setCurrentUserRole("Member");
          }
        }
      }
    };
    if (user) {
      fetchRole();
    }
    return () => {
      controller.abort();
    };
  }, [organization, user, membership?.role]);

  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam) {
      const formatted =
        tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      if (["Overview", "Issues", "Milestones"].includes(formatted))
        return formatted;
    }
    return "Overview";
  });
  const [isTabPending, startTabTransition] = useTransition();
  const deferredTab = useDeferredValue(activeTab);
  const tabs = ["Overview", "Issues", "Milestones"];
  const [activePicker, setActivePicker] = useState(null);

  // Sync activeTab when URL searchParams (?tab=...) changes externally
  useEffect(() => {
    if (tabParam) {
      const normalized =
        tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      if (tabs.includes(normalized) && normalized !== activeTab) {
        setActiveTab(normalized);
      }
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    startTabTransition(() => {
      setSearchParams({ tab: tab.toLowerCase() });
    });
    trackAsync("project_tab_changed", {
      tab: tab.toLowerCase(),
      project_id: id,
    });
  };

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    // Check if the current project in state matches this id, otherwise check cache or show skeleton
    const fromApiCache = api.getCached("/projects");
    const cached =
      (Array.isArray(fromApiCache) &&
        fromApiCache.find(
          (p) =>
            String(p.id) === String(id) ||
            p.slug === id ||
            p.identifier === id,
        )) ||
      api.getCached(`/projects/${id}`);

    if (cached) {
      setProject(cached);
      setLoading(false);
    } else {
      setProject(null);
      setLoading(true);
    }

    api
      .get(`/projects/${id}`, { signal: controller.signal })
      .then((data) => {
        setProject(data);
        trackAsync("project_viewed", { project_id: id });
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error(err);
        if (err?.response?.data?.error === "Project not found") {
          navigate("/404", {
            state: { from: `/projects/${id}` },
            replace: true,
          });
        }
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [id, navigate]);

  useEffect(() => {
    if (activeTab === "Issues" && allTasks.length === 0) {
      dataStore.fetchTasks().catch(() => {});
    }
  }, [activeTab, allTasks.length]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleProjectUpdated = (updatedProject) => {
      if (updatedProject.id === id || updatedProject.id === parseInt(id, 10)) {
        setProject((prev) => ({ ...prev, ...updatedProject }));
      }
    };

    const handleProjectDeleted = (data) => {
      const deletedId = typeof data === "object" && data !== null ? (data.id ?? data.projectId) : data;
      if (String(deletedId) === String(id)) {
        navigate("/projects");
      }
    };

    const handleTaskCreated = (newTask) => {
      if (
        newTask.project_id === id ||
        newTask.project_id === parseInt(id, 10)
      ) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        ),
      );
    };

    const handleTaskDeleted = (data) => {
      const deletedId = typeof data === "object" && data !== null ? (data.id ?? data.taskId) : data;
      setTasks((prev) => prev.filter((t) => t.id !== deletedId && String(t.id) !== String(deletedId)));
    };

    socket.on("PROJECT_UPDATED", handleProjectUpdated);
    socket.on("PROJECT_DELETED", handleProjectDeleted);
    socket.on("TASK_CREATED", handleTaskCreated);
    socket.on("TASK_UPDATED", handleTaskUpdated);
    socket.on("TASK_DELETED", handleTaskDeleted);

    return () => {
      socket.off("PROJECT_UPDATED", handleProjectUpdated);
      socket.off("PROJECT_DELETED", handleProjectDeleted);
      socket.off("TASK_CREATED", handleTaskCreated);
      socket.off("TASK_UPDATED", handleTaskUpdated);
      socket.off("TASK_DELETED", handleTaskDeleted);
    };
  }, [socket, id, navigate]);

  useEffect(() => {
    const handleProjectShortcuts = (e) => {
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;

      const isMod = e.metaKey || e.ctrlKey;
      if (!e.shiftKey && !e.altKey) {
        if (e.key === "1" || (isMod && e.key === "1")) {
          e.preventDefault();
          handleTabChange("Overview");
        } else if (e.key === "2" || (isMod && e.key === "2")) {
          e.preventDefault();
          handleTabChange("Issues");
        } else if (e.key === "3" || (isMod && e.key === "3")) {
          e.preventDefault();
          handleTabChange("Milestones");
        }
      }
    };
    window.addEventListener("keydown", handleProjectShortcuts);
    return () => window.removeEventListener("keydown", handleProjectShortcuts);
  }, []);

  useListShortcuts({
    items: activeTab === "Issues" ? tasks : [],
    activeIndex,
    setActiveIndex,
    onOpenItem: (task) => navigate(`/tasks/${task.id}`),
    onCreateItem: () => setIsCreateModalOpen(true),
  });

  const updateProjectProperty = async (key, value) => {
    if (!canManageProjects || !project) return;

    if (key === "status" && (value === "Completed" || value === "Done")) {
      playUiSound("success");
    } else {
      playUiSound("toggle");
    }

    // Optimistic update
    const prevProject = { ...project };
    setProject((prev) => ({ ...prev, [key]: value }));

    try {
      await api.put(`/projects/${id}`, { [key]: value });
    } catch (err) {
      console.error("Failed to update project property:", err);
      // Revert on failure
      setProject(prevProject);
    }
  };

  const showSkeleton = useDeferredSkeleton(loading && !project, 180);

  if (showSkeleton) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return (
      <div className="p-8 text-foreground flex flex-col gap-3 items-center justify-center h-full">
        <h2 className="text-lg font-semibold">Project not found</h2>
        <button
          onClick={() => navigate("/projects")}
          className="text-accent hover:underline text-sm cursor-pointer"
        >
          Return to projects
        </button>
      </div>
    );
  }

  const renderPropertiesSidebar = (isMobile = false) => (
    <div className={`flex flex-col ${isMobile ? "gap-6" : "p-5 gap-7"}`}>
      {/* Properties section */}
      <div>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-foreground">Properties</h3>
          </div>
        )}

        <div className="flex flex-col gap-3 text-[13px]">
          {/* Status */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Status</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "sidebar-status" ? null : "sidebar-status");
                }}
              >
                {getStatusIcon(project.status || "Planned")}
                <span>{project.status || "Planned"}</span>
              </div>
              {activePicker === "sidebar-status" && (
                <StatusPicker
                  align="right"
                  value={project.status || "Planned"}
                  onChange={(val) => updateProjectProperty("status", val)}
                  onClose={() => setActivePicker(null)}
                />
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Priority</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "sidebar-priority" ? null : "sidebar-priority");
                }}
              >
                {getPriorityIcon(project.priority || "No priority")}
                <span>{project.priority || "No priority"}</span>
              </div>
              {activePicker === "sidebar-priority" && (
                <PriorityPicker
                  align="right"
                  value={project.priority}
                  onChange={(val) => updateProjectProperty("priority", val)}
                  onClose={() => setActivePicker(null)}
                />
              )}
            </div>
          </div>

          {/* Health */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Health</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "sidebar-health" ? null : "sidebar-health");
                }}
              >
                {getHealthIcon(project.health || "On track")}
                <span>{project.health || "On track"}</span>
              </div>
              {activePicker === "sidebar-health" && (
                <HealthPicker
                  align="right"
                  value={project.health || "On track"}
                  onChange={(val) => updateProjectProperty("health", val)}
                  onClose={() => setActivePicker(null)}
                />
              )}
            </div>
          </div>

          {/* Lead */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Lead</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "sidebar-lead" ? null : "sidebar-lead");
                }}
              >
                {project.lead ? (
                  <>
                    <div
                      className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold ${getAvatarColor(project.lead.name, project.lead.email)}`}
                    >
                      {project.lead.avatar_url ? (
                        <img
                          src={project.lead.avatar_url}
                          alt={project.lead.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitial(project.lead.name, project.lead.email)
                      )}
                    </div>
                    <span>{project.lead.name || project.lead.email.split("@")[0]}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-black/10 dark:border-white/[0.1] border-dashed text-zinc-400 dark:text-white/[0.3]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <span className="text-zinc-400 dark:text-[#85868a]">Unassigned</span>
                  </>
                )}
              </div>
              {activePicker === "sidebar-lead" && (
                <LeadPicker
                  align="right"
                  value={project.lead}
                  currentLead={project.lead}
                  availableMembers={workspaceMembers.length > 0 ? workspaceMembers : (project.members || [])}
                  onChange={(val) => updateProjectProperty("lead", val)}
                  onClose={() => setActivePicker(null)}
                />
              )}
            </div>
          </div>

          {/* Members */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Members</span>
            <div className="flex items-center gap-2">
              {project.members && project.members.length > 0 && (
                <MembersAvatarStack members={project.members} max={3} />
              )}
              <div
                className={`flex items-center gap-1.5 transition-colors rounded p-1 ${project.members && project.members.length > 0 ? "" : "-ml-1"} ${canManageProjects ? "text-zinc-600 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "text-zinc-400 dark:text-[#85868a] cursor-default"}`}
                onClick={canManageProjects ? () => {} : undefined}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>{project.members && project.members.length > 0 ? "" : "Add members"}</span>
              </div>
            </div>
          </div>

          {/* Start date */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Start date</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "sidebar-startDate" ? null : "sidebar-startDate");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                <span>
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Set start date"}
                </span>
              </div>
              {activePicker === "sidebar-startDate" && (
                <DatePicker
                  align="right"
                  value={project.start_date}
                  onChange={(val) => updateProjectProperty("start_date", val)}
                  onClose={() => setActivePicker(null)}
                  placeholder="Start date"
                />
              )}
            </div>
          </div>

          {/* Target date */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Target date</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "sidebar-dueDate" ? null : "sidebar-dueDate");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span>
                  {project.due_date
                    ? new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Set target date"}
                </span>
              </div>
              {activePicker === "sidebar-dueDate" && (
                <DatePicker
                  align="right"
                  value={project.due_date}
                  onChange={(val) => updateProjectProperty("due_date", val)}
                  onClose={() => setActivePicker(null)}
                  placeholder="Target date"
                />
              )}
            </div>
          </div>

          {/* Teams */}
          {project.teams && project.teams.length > 0 && (
            <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
              <span>Teams</span>
              <div className={`flex items-center gap-2 text-foreground p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "cursor-default"}`}>
                <div className="w-4 h-4 rounded-[3px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center font-bold text-[9px]">
                  {project.teams[0].charAt(0).toUpperCase()}
                </div>
                <span>{project.teams[0]}</span>
                {project.teams.length > 1 && (
                  <span className="text-text-muted text-[12px]">+{project.teams.length - 1}</span>
                )}
              </div>
            </div>
          )}

          {/* Slack */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Slack</span>
            <div
              className={`flex items-center gap-2 transition-colors rounded -ml-1 p-1 ${canManageProjects ? "text-zinc-600 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "text-zinc-400 dark:text-[#85868a] cursor-default"}`}
              onClick={canManageProjects ? () => {} : undefined}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
              <span>Slack channel</span>
            </div>
          </div>

          {/* Labels */}
          <div className="grid grid-cols-[90px_1fr] items-center text-text-muted">
            <span>Labels</span>
            <div
              className={`flex items-center gap-2 transition-colors rounded -ml-1 p-1 ${canManageProjects ? "text-zinc-600 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "text-zinc-400 dark:text-[#85868a] cursor-default"}`}
              onClick={canManageProjects ? () => {} : undefined}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Add label</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-black/[0.08] dark:border-white/[0.06]" />

      {/* Milestones section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            onClick={() => handleTabChange("Milestones")}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900 hover:text-zinc-700 dark:text-white dark:hover:text-[#d1d2d5] cursor-pointer"
          >
            <span>Milestones</span>
            <ChevronRight size={13} className="text-zinc-400 dark:text-[#85868a]" />
          </div>
          <button
            onClick={() => handleTabChange("Milestones")}
            className="text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white p-0.5 rounded transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        {project.milestones && project.milestones.length > 0 ? (
          <div className="flex flex-col gap-2">
            {project.milestones.map((ms, idx) => (
              <div
                key={idx}
                className={
                  isMobile
                    ? "flex items-center justify-between p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.05] text-[13px]"
                    : "flex items-start gap-2 text-[13px] text-zinc-700 dark:text-[#d1d2d5]"
                }
              >
                <div className="flex items-center gap-2">
                  <svg className="text-[#5e6ad2] shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  <span className="font-medium text-zinc-900 dark:text-[#d1d2d5]">{ms.name || ms.title}</span>
                </div>
                {isMobile && ms.due_date && (
                  <span className="text-xs text-text-muted">
                    {new Date(ms.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-text-muted leading-relaxed">
            Add milestones to organize work within your project and break it into more granular stages.
          </p>
        )}
      </div>

      <hr className="border-black/[0.08] dark:border-white/[0.06]" />

      {/* Activity section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900 hover:text-zinc-700 dark:text-white dark:hover:text-[#d1d2d5] cursor-pointer">
            <span>Activity</span>
            <ChevronRight size={13} className="text-zinc-400 dark:text-[#85868a]" />
          </div>
        </div>

        <div className="flex gap-3 text-[12px]">
          <div className="w-5 h-5 rounded-full bg-[#f97373] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            {(project.lead?.name || project.lead?.email || "C").charAt(0).toUpperCase()}
          </div>
          <div className="text-text-muted">
            <span className="text-zinc-800 dark:text-[#d1d2d5] font-medium mr-1">
              {project.lead?.name || project.lead?.email || "cyrusjones"}
            </span>
            created the project{" "}
            <span className="ml-1">
              {new Date(project.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col min-h-full md:h-full bg-[var(--card-bg)] md:overflow-hidden select-none text-foreground">
      {/* 1. Top Breadcrumb & Action Header */}
      <div className="h-[44px] shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-border bg-[var(--card-bg)] z-20">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] font-medium min-w-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
            className="md:hidden p-1 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={17} strokeWidth={1.75} />
          </button>
          <Link
            to="/projects"
            className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors shrink-0"
          >
            Projects
          </Link>
          <span className="text-zinc-400 dark:text-[#55565a] shrink-0">›</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 rounded-[4px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center shrink-0">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <span className="text-foreground truncate max-w-[150px] sm:max-w-[280px] md:max-w-md font-semibold">
              {project.name}
            </span>
          </div>
        </div>

        {/* Right Action Icons (Star, More, Link, Bell) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 text-text-muted">
          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className="w-7 h-7 rounded-md hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            title={isStarred ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              size={14}
              className={isStarred ? "fill-[#e9ba35] text-[#e9ba35]" : ""}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-7 h-7 rounded-md hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            title="More options"
          >
            <MoreHorizontal size={14} />
          </button>

          <button
            type="button"
            onClick={async () => {
              const success = await copyTextToClipboard(window.location.href);
              if (success) {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }
            }}
            className="w-7 h-7 rounded-md hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors relative"
            title={isCopied ? "Link copied!" : "Copy link"}
          >
            {isCopied ? (
              <Check size={14} className="text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Link2 size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSubscribed(!isSubscribed)}
            className="w-7 h-7 rounded-md hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            title={isSubscribed ? "Subscribed to updates" : "Subscribe"}
          >
            <Bell
              size={14}
              className={isSubscribed ? "text-[#5e6ad2]" : ""}
            />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tab Row */}
      <div className="relative h-[42px] shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-border bg-[var(--card-bg)] z-10">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`relative transition-colors text-xs font-medium rounded-full px-3 py-1 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? "text-foreground"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="projectDetailsActiveTab"
                    className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-full shadow-xs pointer-events-none"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 35,
                    }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Right side Properties panel toggle button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                setIsSidebarOpen((prev) => !prev);
              } else {
                setIsMobileSidebarOpen((prev) => !prev);
              }
            }}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
              (typeof window !== "undefined" && window.innerWidth >= 1024 ? isSidebarOpen : isMobileSidebarOpen)
                ? "bg-black/[0.08] dark:bg-white/[0.08] border-black/15 dark:border-white/15 text-foreground"
                : "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-black/[0.08] dark:border-white/[0.06] text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
            }`}
            title="Toggle properties panel"
          >
            <PanelRight size={14} />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Content */}
        <div
          className={`flex-1 min-w-0 min-h-0 flex flex-col ${
            deferredTab === "Issues"
              ? `overflow-hidden p-4 sm:p-5 ${isSidebarOpen ? "lg:px-6 lg:py-5" : "lg:p-8"}`
              : "overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10"
          }`}
        >
          {deferredTab === "Overview" && (
            <div className="max-w-3xl">
              {/* Project Icon Badge */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-red-500/10 to-red-500/5 dark:from-[#2a1717] dark:to-[#1c1212] border border-[#e95454]/25 text-[#e95454] flex items-center justify-center mb-4 shadow-sm">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                {project.name}
              </h1>
              <p className="text-text-muted text-[13px] leading-relaxed mb-6">
                A collaborative workspace for managing projects, tasks, and team workflows.
              </p>

              {/* AI Project Health & Risk Intelligence Card */}
              <ProjectHealthCard projectId={id} />

              {/* Properties Section: Horizontal Chips */}
              <div className="mb-6">
                <div className="text-[12px] font-medium text-text-muted mb-2.5">
                  Properties
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Status Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "chip-status" ? null : "chip-status");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.06] dark:text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {getStatusIcon(project.status || "Planned")}
                      <span>{project.status || "Planned"}</span>
                    </div>
                    {activePicker === "chip-status" && (
                      <StatusPicker
                        align="left"
                        value={project.status || "Planned"}
                        onChange={(val) => updateProjectProperty("status", val)}
                        onClose={() => setActivePicker(null)}
                      />
                    )}
                  </div>

                  {/* Priority Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "chip-priority" ? null : "chip-priority");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.06] dark:text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {getPriorityIcon(project.priority || "No priority")}
                      <span>{project.priority || "No priority"}</span>
                    </div>
                    {activePicker === "chip-priority" && (
                      <PriorityPicker
                        align="left"
                        value={project.priority}
                        onChange={(val) => updateProjectProperty("priority", val)}
                        onClose={() => setActivePicker(null)}
                      />
                    )}
                  </div>

                  {/* Lead Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "chip-lead" ? null : "chip-lead");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.06] dark:text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {project.lead ? (
                        <>
                          <div
                            className={`w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[8px] font-bold ${getAvatarColor(
                              project.lead.name,
                              project.lead.email,
                            )}`}
                          >
                            {project.lead.avatar_url ? (
                              <img
                                src={project.lead.avatar_url}
                                alt={project.lead.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitial(project.lead.name, project.lead.email)
                            )}
                          </div>
                          <span>
                            {project.lead.name || project.lead.email.split("@")[0]}
                          </span>
                        </>
                      ) : (
                        <span className="text-text-muted">No lead</span>
                      )}
                    </div>
                    {activePicker === "chip-lead" && (
                      <LeadPicker
                        align="left"
                        value={project.lead}
                        currentLead={project.lead}
                        availableMembers={workspaceMembers.length > 0 ? workspaceMembers : (project.members || [])}
                        onChange={(val) => updateProjectProperty("lead", val)}
                        onClose={() => setActivePicker(null)}
                      />
                    )}
                  </div>

                  {/* Dates Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "chip-dueDate" ? null : "chip-dueDate");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.06] dark:text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <Calendar size={12} className="text-text-muted" />
                      <span>{formatProjectDates(project.start_date, project.due_date)}</span>
                    </div>
                    {activePicker === "chip-dueDate" && (
                      <DatePicker
                        align="left"
                        value={project.due_date}
                        onChange={(val) => updateProjectProperty("due_date", val)}
                        onClose={() => setActivePicker(null)}
                        placeholder="Target date"
                      />
                    )}
                  </div>

                  {/* Team Chip */}
                  {project.teams && project.teams.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/[0.03] border border-black/[0.08] text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white">
                      <div className="w-3.5 h-3.5 rounded-[3px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center font-bold text-[8px]">
                        {project.teams[0].charAt(0).toUpperCase()}
                      </div>
                      <span>{project.teams[0]}</span>
                    </div>
                  )}

                  {/* More Properties button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="w-7 h-[26px] rounded-md bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] text-zinc-500 hover:text-zinc-900 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.06] dark:text-[#8a8f98] dark:hover:text-white flex items-center justify-center transition-colors"
                    title="View all properties"
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </div>
              </div>

              {/* Resources Section */}
              <div className="mb-6">
                <div className="text-[12px] font-medium text-text-muted mb-2">
                  Resources
                </div>
                <button
                  type="button"
                  className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white flex items-center gap-1.5 py-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>Add document or link...</span>
                </button>
              </div>

              {/* Write first project update card */}
              <div
                onClick={() => {
                  // Prompt or focus
                }}
                className="border border-black/[0.08] hover:border-black/[0.15] bg-black/[0.01] hover:bg-black/[0.03] dark:border-white/[0.08] dark:hover:border-white/[0.15] dark:bg-white/[0.02] dark:hover:bg-white/[0.04] rounded-xl p-4 flex items-center justify-center gap-2 text-[13.5px] font-medium text-zinc-700 hover:text-zinc-900 dark:text-[#d1d2d5] dark:hover:text-white cursor-pointer transition-all my-6 group"
              >
                <SquarePen
                  size={15}
                  className="text-zinc-400 group-hover:text-zinc-900 dark:text-[#8a8f98] dark:group-hover:text-white transition-colors"
                />
                <span>Write first project update</span>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <div
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white cursor-pointer mb-3 select-none transition-colors"
                >
                  <span>Description</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-150 ${
                      isDescriptionExpanded ? "" : "-rotate-90"
                    }`}
                  />
                </div>

                {isDescriptionExpanded && (
                  canManageProjects ? (
                    <textarea
                      defaultValue={project.description || ""}
                      placeholder="Add a project description..."
                      onBlur={(e) => {
                        if (e.target.value !== project.description) {
                          updateProjectProperty("description", e.target.value);
                        }
                      }}
                      className="w-full min-h-[140px] text-[13.5px] leading-relaxed text-zinc-800 dark:text-[#d1d2d5] whitespace-pre-wrap bg-black/[0.02] border border-black/[0.08] hover:border-black/[0.15] focus:border-black/30 dark:bg-white/[0.02] dark:border-white/[0.06] dark:hover:border-white/10 dark:focus:border-white/20 focus:outline-none rounded-lg p-3 resize-none transition-colors"
                    />
                  ) : (
                    <div className="text-[13.5px] leading-relaxed text-zinc-800 dark:text-[#d1d2d5] whitespace-pre-wrap">
                      {project.description || "No description provided."}
                    </div>
                  )
                )}
              </div>

              {/* Milestones in Overview */}
              <div className="mb-8">
                <div
                  onClick={() => handleTabChange("Milestones")}
                  className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white cursor-pointer py-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>Milestone</span>
                </div>
                {project.milestones && project.milestones.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    {project.milestones.map((ms, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.05] text-[13px]"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="text-[#5e6ad2] shrink-0"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          </svg>
                          <span className="text-foreground font-medium">{ms.name || ms.title}</span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {ms.due_date
                            ? new Date(ms.due_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {deferredTab === "Milestones" &&
            (project.milestones && project.milestones.length > 0 ? (
              <div className="flex flex-col gap-4 mt-2 max-w-3xl">
                {project.milestones.map((ms, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg
                          className="text-[#5e6ad2]"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        <span className="font-semibold text-foreground text-[14px]">
                          {ms.name || ms.title}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">
                        {ms.due_date
                          ? new Date(ms.due_date).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    {ms.description && (
                      <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] ml-6">
                        {ms.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center mt-20">
                <div className="w-16 h-16 bg-black/[0.03] border border-black/[0.08] dark:bg-white/[0.03] dark:border-white/[0.05] rounded-2xl flex items-center justify-center text-zinc-400 dark:text-[#8a8f98] shadow-sm relative overflow-hidden mb-6">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-zinc-900/10 dark:bg-white/20 blur-xl rounded-full" />
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </div>
                <h2 className="text-[16px] font-semibold text-foreground mb-3">
                  No milestones yet
                </h2>
                <p className="text-[14px] text-text-muted leading-relaxed">
                  Project milestones such as key deliverables and dates will
                  appear here.
                </p>
              </div>
            ))}

          {deferredTab === "Issues" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 sm:mb-5 shrink-0">
                <h2 className="text-[16px] font-semibold text-foreground">
                  Project Issues
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="kriri-primary-btn flex items-center gap-1.5 transition-all duration-300 text-xs font-medium px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.06)] active:scale-[0.98]"
                >
                  <Plus size={14} strokeWidth={2.2} /> New Issue
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10">
                  <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
                    <Checklist theme={effectiveTheme} intensity={0.7} className="w-full h-full text-zinc-400 dark:text-[#8a8f98] opacity-80" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">
                      Add issues to the project
                    </h2>
                    <p className="text-[14px] text-zinc-500 dark:text-text-muted leading-relaxed">
                      Start building your project by creating an issue. You can
                      also add teams, team members, and project dates in the
                      project sidebar.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="kriri-primary-btn h-8 px-4 rounded-full font-medium text-[13px] transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.06)] active:scale-[0.98] flex items-center gap-2"
                    >
                      <Plus size={14} strokeWidth={2.2} />
                      Create new issue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 bg-surface border border-border rounded-xl flex flex-col overflow-hidden shadow-xs">
                  {/* Mobile Task Cards (< md) */}
                  <div className="flex md:hidden flex-col divide-y divide-border-subtle flex-1 overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
                    {tasks.map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          navigate(`/tasks/${task.id}`);
                        }}
                        className={`p-3.5 flex flex-col gap-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          activeIndex === idx
                            ? "bg-black/[0.05] dark:bg-white/[0.06]"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-zinc-500 dark:text-text-muted font-medium whitespace-nowrap shrink-0">
                            {task.project_identifier || project?.identifier
                              ? `${task.project_identifier || project.identifier}-${task.id}`
                              : task.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                task.priority === "High"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"
                                  : task.priority === "Medium"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-orange-500 border-amber-500/20"
                                    : "bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-gray-400 border-black/10 dark:border-white/10"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-gray-400">
                              {getStatusIcon(task.status)}
                              <span className="text-[12px]">{task.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[13px] font-medium text-zinc-900 dark:text-text-primary line-clamp-2">
                          {task.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-gray-400 pt-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            {task.assignee_name && (
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 ${getAvatarColor(task.assignee_name, task.assignee_name)}`}
                              >
                                {task.assignee_name.charAt(0)}
                              </div>
                            )}
                            <span className="truncate">{task.assignee_name || "Unassigned"}</span>
                          </div>
                          {task.due_date && (
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / Tablet Table Grid (>= md) */}
                  <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Table Header */}
                    <div
                      className={`grid ${
                        isSidebarOpen
                          ? "grid-cols-[150px_minmax(0,1fr)_100px_70px_minmax(0,95px)] 2xl:grid-cols-[150px_minmax(0,1fr)_105px_75px_100px_75px]"
                          : "grid-cols-[150px_minmax(0,1fr)_105px_75px_100px_75px]"
                      } gap-3 sm:gap-4 px-4 sm:px-5 py-3 border-b border-border text-xs font-medium text-text-muted bg-transparent shrink-0 overflow-x-hidden select-none`}
                    >
                      <div className="whitespace-nowrap">ID</div>
                      <div>Title</div>
                      <div>Status</div>
                      <div>Priority</div>
                      <div>Assignee</div>
                      <div className={`text-right ${isSidebarOpen ? "hidden 2xl:block" : "block"}`}>Due</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border-subtle no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
                      {tasks.map((task, idx) => (
                        <div
                          key={task.id}
                          onClick={() => {
                            navigate(`/tasks/${task.id}`);
                          }}
                          className={`grid ${
                            isSidebarOpen
                              ? "grid-cols-[150px_minmax(0,1fr)_100px_70px_minmax(0,95px)] 2xl:grid-cols-[150px_minmax(0,1fr)_105px_75px_100px_75px]"
                              : "grid-cols-[150px_minmax(0,1fr)_105px_75px_100px_75px]"
                          } gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors items-center text-[13px] group cursor-pointer overflow-x-hidden min-w-0 ${
                            activeIndex === idx
                              ? "bg-black/[0.05] ring-1 ring-inset ring-black/10 dark:bg-white/[0.08] dark:ring-white/10"
                              : ""
                          }`}
                        >
                          <div className="font-mono text-[11px] text-text-muted font-medium whitespace-nowrap shrink-0 overflow-hidden select-all">
                            {task.project_identifier || project?.identifier
                              ? `${task.project_identifier || project.identifier}-${task.id}`
                              : task.id}
                          </div>
                          <div className="text-foreground font-medium truncate group-hover:text-accent transition-colors min-w-0">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            {getStatusIcon(task.status)}
                            <span
                              className={`truncate ${
                                task.status === "Done"
                                  ? "text-text-muted"
                                  : "text-foreground"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border truncate block text-center ${
                                task.priority === "High"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"
                                  : task.priority === "Medium"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-orange-500 border-amber-500/20"
                                    : "bg-black/5 dark:bg-white/5 text-text-muted border-border"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-text-secondary truncate min-w-0">
                            {task.assignee_name && (
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${getAvatarColor(task.assignee_name, task.assignee_name)}`}
                              >
                                {task.assignee_name.charAt(0)}
                              </div>
                            )}
                            <span className="truncate">
                              {task.assignee_name || "Unassigned"}
                            </span>
                          </div>
                          <div className={`text-right text-text-muted text-xs truncate min-w-0 ${isSidebarOpen ? "hidden 2xl:block" : "block"}`}>
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Right Sidebar */}
        {isSidebarOpen && (
          <div className="hidden lg:block w-[300px] xl:w-[320px] shrink-0 border-l border-border overflow-y-auto custom-scrollbar bg-[var(--card-bg)]">
            {renderPropertiesSidebar(false)}
          </div>
        )}
      </div>

      {/* Mobile Slide-over / Bottom Sheet */}
      {isMobileSidebarOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 lg:hidden bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: `-${mobileDrawerMetrics.bottomOffset + 60}px`,
                minHeight: "100%",
              }}
              onClick={() => setIsMobileSidebarOpen(false)}
              onTouchMove={(e) => e.preventDefault()}
            />

            {/* Properties Container Popup */}
            <div
              className="fixed inset-x-0 z-[51] lg:hidden bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border-t border-[var(--border,rgba(255,255,255,0.08))] rounded-t-2xl overflow-y-auto overscroll-contain custom-scrollbar p-5 pt-3 shadow-2xl flex flex-col"
              style={{
                top: mobileDrawerMetrics.top,
                bottom: `-${mobileDrawerMetrics.bottomOffset}px`,
                minHeight: "calc(100lvh - 15vh)",
                paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${mobileDrawerMetrics.paddingBottom}px)`,
                WebkitOverflowScrolling: "touch",
              }}
              onTouchStart={(e) => setDrawerTouchStartY(e.touches[0].clientY)}
              onTouchEnd={(e) => {
                if (drawerTouchStartY !== null) {
                  const diffY = e.changedTouches[0].clientY - drawerTouchStartY;
                  if (diffY > 80 && e.currentTarget.scrollTop <= 0) {
                    setIsMobileSidebarOpen(false);
                  }
                  setDrawerTouchStartY(null);
                }
              }}
            >
              {/* Drag Handle */}
              <div
                className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-3 cursor-pointer hover:bg-black/25 dark:hover:bg-white/30 transition-colors shrink-0"
                onClick={() => setIsMobileSidebarOpen(false)}
                title="Tap or drag down to close"
              />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer select-none"
                  title="Collapse properties sidebar"
                >
                  <span>Properties</span>
                  <ChevronDown size={14} className="text-text-muted" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.06] dark:text-[#8a8f98] dark:hover:text-white dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Properties content */}
              {renderPropertiesSidebar(true)}
            </div>
          </>,
          document.body
        )}

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        onTaskUpdated={(updatedTask) => {
          dataStore.handleTaskUpdated(updatedTask);
        }}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialProjectId={id}
        onTaskCreated={(newTask) => {
          dataStore.handleTaskCreated(newTask);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
