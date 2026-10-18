import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { api } from "../lib/api";
import posthog from "../lib/posthog";
import PageLoading from "../components/PageLoading";
import { useSocket } from "../contexts/SocketContext";
import StatusPicker, { getStatusIcon } from "../components/StatusPicker";
import PriorityPicker, { getPriorityIcon } from "../components/PriorityPicker";
import HealthPicker, { getHealthIcon } from "../components/HealthPicker";
import LeadPicker from "../components/LeadPicker";
import DatePicker from "../components/DatePicker";
import MembersAvatarStack from "../components/projects/MembersAvatarStack";
import { getInitial, getAvatarColor } from "../lib/avatarUtils";
import {
  Plus,
  CheckSquare,
  Compass,
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
} from "lucide-react";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import { IssuesEmptyIcon } from "../components/EmptyStateIcons";
import { useListShortcuts } from "../hooks/useListShortcuts";
import { Format as Checklist } from "@lucasmarkes/hairline/react";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { organization } = useOrganization();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

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
  const canManageProjects =
    ["Owner", "Admin", "Project Manager", "Member", "Team Lead"].includes(
      currentUserRole,
    ) || !organization;

  useEffect(() => {
    const fetchRole = async () => {
      if (!organization) {
        setCurrentUserRole("Owner");
        return;
      }
      try {
        const response = await api.get(
          `/workspaces/${organization.id}/members`,
        );
        const members = Array.isArray(response)
          ? response
          : response.data?.members || [];
        const currentMember = members.find(
          (m) => m.email === user?.primaryEmailAddress?.emailAddress,
        );
        if (currentMember) setCurrentUserRole(currentMember.role);
      } catch (err) {
        console.error("Failed to fetch role", err);
      }
    };
    if (user) {
      fetchRole();
    }
  }, [organization, user]);

  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam
      ? tabParam.charAt(0).toUpperCase() + tabParam.slice(1)
      : "Overview",
  );
  const tabs = ["Overview", "Issues", "Milestones"];
  const [activePicker, setActivePicker] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
    posthog.capture("project_tab_changed", {
      tab: tab.toLowerCase(),
      project_id: id,
    });
  };

  useEffect(() => {
    api
      .get(`/projects/${id}`)
      .then((data) => {
        setProject(data);
        posthog.capture("project_viewed", { project_id: id });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (err?.response?.data?.error === "Project not found") {
          navigate("/404", {
            state: { from: `/projects/${id}` },
            replace: true,
          });
        }
        setLoading(false);
      });
  }, [id, navigate]);

  useEffect(() => {
    if (activeTab === "Issues" && id && !tasksLoaded) {
      api
        .get(`/tasks?project_id=${id}`)
        .then((data) => {
          setTasks(data);
          setTasksLoaded(true);
        })
        .catch((err) => console.error(err));
    }
  }, [activeTab, id, tasksLoaded]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleProjectUpdated = (updatedProject) => {
      if (updatedProject.id === id || updatedProject.id === parseInt(id, 10)) {
        setProject((prev) => ({ ...prev, ...updatedProject }));
      }
    };

    const handleProjectDeleted = (deletedId) => {
      if (deletedId === id || deletedId === parseInt(id, 10)) {
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

    const handleTaskDeleted = ({ id: taskId }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          handleTabChange("Overview");
        }
        if (e.key === "2") {
          e.preventDefault();
          handleTabChange("Issues");
        }
        if (e.key === "3") {
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
    onOpenItem: (task) => setSelectedTaskId(task.id),
    onCreateItem: () => setIsCreateModalOpen(true),
  });

  const updateProjectProperty = async (key, value) => {
    if (!canManageProjects || !project) return;

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

  if (loading) {
    return (
      <PageLoading
        label={project?.name || project?.title || "Project Details"}
        description="Fetching project issues, milestones & metadata"
      />
    );
  }

  if (!project) {
    return <div className="p-8 text-white">Project not found</div>;
  }

  const renderPropertiesSidebar = (isMobile = false) => (
    <div className={`flex flex-col ${isMobile ? "gap-6" : "p-5 gap-7"}`}>
      {/* Properties section */}
      <div>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-white">Properties</h3>
          </div>
        )}

        <div className="flex flex-col gap-3 text-[13px]">
          {/* Status */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Status</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "status" ? null : "status");
                }}
              >
                {getStatusIcon(project.status || "Planned")}
                <span>{project.status || "Planned"}</span>
              </div>
              {activePicker === "status" && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <StatusPicker
                    value={project.status || "Planned"}
                    onChange={(val) => updateProjectProperty("status", val)}
                    onClose={() => setActivePicker(null)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Priority</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "priority" ? null : "priority");
                }}
              >
                {getPriorityIcon(project.priority || "No priority")}
                <span>{project.priority || "No priority"}</span>
              </div>
              {activePicker === "priority" && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <PriorityPicker
                    value={project.priority}
                    onChange={(val) => updateProjectProperty("priority", val)}
                    onClose={() => setActivePicker(null)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Health */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Health</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "health" ? null : "health");
                }}
              >
                {getHealthIcon(project.health || "On track")}
                <span>{project.health || "On track"}</span>
              </div>
              {activePicker === "health" && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <HealthPicker
                    value={project.health || "On track"}
                    onChange={(val) => updateProjectProperty("health", val)}
                    onClose={() => setActivePicker(null)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Lead */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Lead</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "lead" ? null : "lead");
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
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white/[0.1] border-dashed text-white/[0.3]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <span className="text-[#85868a]">Unassigned</span>
                  </>
                )}
              </div>
              {activePicker === "lead" && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <LeadPicker
                    currentLead={project.lead}
                    onSelect={(val) => updateProjectProperty("lead", val)}
                    onClose={() => setActivePicker(null)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Members</span>
            <div className="flex items-center gap-2">
              {project.members && project.members.length > 0 && (
                <MembersAvatarStack members={project.members} max={3} />
              )}
              <div
                className={`flex items-center gap-1.5 transition-colors rounded p-1 ${project.members && project.members.length > 0 ? "" : "-ml-1"} ${canManageProjects ? "hover:text-white cursor-pointer hover:bg-white/5" : "cursor-default"}`}
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
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Start date</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "startDate" ? null : "startDate");
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
              {activePicker === "startDate" && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <DatePicker
                    value={project.start_date}
                    onChange={(val) => updateProjectProperty("start_date", val)}
                    onClose={() => setActivePicker(null)}
                    placeholder="Start date"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Target date */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Target date</span>
            <div className="relative">
              <div
                className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canManageProjects) setActivePicker(activePicker === "dueDate" ? null : "dueDate");
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
              {activePicker === "dueDate" && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <DatePicker
                    value={project.due_date}
                    onChange={(val) => updateProjectProperty("due_date", val)}
                    onClose={() => setActivePicker(null)}
                    placeholder="Target date"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Teams */}
          {project.teams && project.teams.length > 0 && (
            <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
              <span>Teams</span>
              <div className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/5" : "cursor-default"}`}>
                <div className="w-4 h-4 rounded-[3px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center font-bold text-[9px]">
                  {project.teams[0].charAt(0).toUpperCase()}
                </div>
                <span>{project.teams[0]}</span>
                {project.teams.length > 1 && (
                  <span className="text-[#85868a] text-[12px]">+{project.teams.length - 1}</span>
                )}
              </div>
            </div>
          )}

          {/* Slack */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Slack</span>
            <div
              className={`flex items-center gap-2 transition-colors rounded -ml-1 p-1 ${canManageProjects ? "hover:text-white cursor-pointer hover:bg-white/5" : "cursor-default"}`}
              onClick={canManageProjects ? () => {} : undefined}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
              <span>Slack channel</span>
            </div>
          </div>

          {/* Labels */}
          <div className="grid grid-cols-[90px_1fr] items-center text-[#85868a]">
            <span>Labels</span>
            <div
              className={`flex items-center gap-2 transition-colors rounded -ml-1 p-1 ${canManageProjects ? "hover:text-white cursor-pointer hover:bg-white/5" : "cursor-default"}`}
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

      <hr className="border-white/[0.06]" />

      {/* Milestones section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            onClick={() => handleTabChange("Milestones")}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-white cursor-pointer hover:text-[#d1d2d5]"
          >
            <span>Milestones</span>
            <ChevronRight size={13} className="text-[#85868a]" />
          </div>
          <button
            onClick={() => handleTabChange("Milestones")}
            className="text-[#8a8f98] hover:text-white p-0.5 rounded transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        {project.milestones && project.milestones.length > 0 ? (
          <div className="flex flex-col gap-2">
            {project.milestones.map((ms, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[13px] text-[#d1d2d5]">
                <svg className="mt-0.5 text-[#5e6ad2] shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span>{ms.name || ms.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#85868a] leading-relaxed">
            Add milestones to organize work within your project and break it into more granular stages.
          </p>
        )}
      </div>

      <hr className="border-white/[0.06]" />

      {/* Activity section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white cursor-pointer hover:text-[#d1d2d5]">
            <span>Activity</span>
            <ChevronRight size={13} className="text-[#85868a]" />
          </div>
        </div>

        <div className="flex gap-3 text-[12px]">
          <div className="w-5 h-5 rounded-full bg-[#f97373] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            {(project.lead?.name || project.lead?.email || "C").charAt(0).toUpperCase()}
          </div>
          <div className="text-[#85868a]">
            <span className="text-[#d1d2d5] font-medium mr-1">
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
    <div className="w-full flex flex-col h-full bg-black md:bg-[#131416] animate-in fade-in duration-300 overflow-hidden select-none">
      {/* 1. Top Breadcrumb & Action Header */}
      <div className="h-[44px] shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-white/[0.06] bg-black md:bg-[#131416] z-20">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] font-medium min-w-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
            className="md:hidden p-1 -ml-1 text-[#8a8f98] hover:text-white rounded-md hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={17} strokeWidth={1.75} />
          </button>
          <Link
            to="/projects"
            className="text-[#85868a] hover:text-white transition-colors shrink-0"
          >
            Projects
          </Link>
          <span className="text-[#55565a] shrink-0">›</span>
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
            <span className="text-white truncate max-w-[150px] sm:max-w-[280px] md:max-w-md">
              {project.name}
            </span>
          </div>
        </div>

        {/* Right Action Icons (Star, More, Link, Bell) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 text-[#85868a]">
          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className="w-7 h-7 rounded-md hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
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
            className="w-7 h-7 rounded-md hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            title="More options"
          >
            <MoreHorizontal size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }
            }}
            className="w-7 h-7 rounded-md hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors relative"
            title={isCopied ? "Link copied!" : "Copy link"}
          >
            {isCopied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Link2 size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSubscribed(!isSubscribed)}
            className="w-7 h-7 rounded-md hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            title={isSubscribed ? "Subscribed to updates" : "Subscribe"}
          >
            <Bell
              size={14}
              className={isSubscribed ? "text-[#5e6ad2]" : ""}
            />
          </button>
        </div>
      </div>

      {/* 2. Linear-style Tab Row */}
      <div className="h-[42px] shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-white/[0.06] bg-black md:bg-[#131416] z-10">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`transition-all text-xs font-medium rounded-md px-3 py-1 flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-[#85868a] hover:text-[#d1d2d5] hover:bg-white/[0.04]"
                }`}
              >
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Right side Properties panel toggle button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
            className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#8a8f98] hover:text-white flex items-center justify-center transition-colors"
            title="Toggle properties panel"
          >
            <PanelRight size={14} />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 min-w-0">
          {activeTab === "Overview" && (
            <div className="max-w-3xl">
              {/* Project Icon Badge */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-[#2a1717] to-[#1c1212] border border-[#e95454]/25 text-[#e95454] flex items-center justify-center mb-4 shadow-sm">
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
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                {project.name}
              </h1>
              <p className="text-[#85868a] text-[13px] leading-relaxed mb-6">
                A collaborative workspace for managing projects, tasks, and team workflows.
              </p>

              {/* Properties Section: Horizontal Chips */}
              <div className="mb-6">
                <div className="text-[12px] font-medium text-[#85868a] mb-2.5">
                  Properties
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Status Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "status" ? null : "status");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {getStatusIcon(project.status || "Planned")}
                      <span>{project.status || "Planned"}</span>
                    </div>
                    {activePicker === "status" && (
                      <div className="absolute top-full left-0 mt-1 z-50">
                        <StatusPicker
                          value={project.status || "Planned"}
                          onChange={(val) => updateProjectProperty("status", val)}
                          onClose={() => setActivePicker(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Priority Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "priority" ? null : "priority");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {getPriorityIcon(project.priority || "No priority")}
                      <span>{project.priority || "No priority"}</span>
                    </div>
                    {activePicker === "priority" && (
                      <div className="absolute top-full left-0 mt-1 z-50">
                        <PriorityPicker
                          value={project.priority}
                          onChange={(val) => updateProjectProperty("priority", val)}
                          onClose={() => setActivePicker(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Lead Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "lead" ? null : "lead");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white transition-colors ${
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
                        <span className="text-[#85868a]">No lead</span>
                      )}
                    </div>
                    {activePicker === "lead" && (
                      <div className="absolute top-full left-0 mt-1 z-50">
                        <LeadPicker
                          currentLead={project.lead}
                          onSelect={(val) => updateProjectProperty("lead", val)}
                          onClose={() => setActivePicker(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dates Chip */}
                  <div className="relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageProjects)
                          setActivePicker(activePicker === "dueDate" ? null : "dueDate");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white transition-colors ${
                        canManageProjects ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <Calendar size={12} className="text-[#85868a]" />
                      <span>{formatProjectDates(project.start_date, project.due_date)}</span>
                    </div>
                    {activePicker === "dueDate" && (
                      <div className="absolute top-full left-0 mt-1 z-50">
                        <DatePicker
                          value={project.due_date}
                          onChange={(val) => updateProjectProperty("due_date", val)}
                          onClose={() => setActivePicker(null)}
                          placeholder="Target date"
                        />
                      </div>
                    )}
                  </div>

                  {/* Team Chip */}
                  {project.teams && project.teams.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-white">
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
                    className="w-7 h-[26px] rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#8a8f98] hover:text-white flex items-center justify-center transition-colors"
                    title="View all properties"
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </div>
              </div>

              {/* Resources Section */}
              <div className="mb-6">
                <div className="text-[12px] font-medium text-[#85868a] mb-2">
                  Resources
                </div>
                <button
                  type="button"
                  className="text-[13px] text-[#85868a] hover:text-white flex items-center gap-1.5 py-1 transition-colors"
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
                className="border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-4 flex items-center justify-center gap-2 text-[13.5px] font-medium text-[#d1d2d5] cursor-pointer transition-all my-6 group"
              >
                <SquarePen
                  size={15}
                  className="text-[#8a8f98] group-hover:text-white transition-colors"
                />
                <span>Write first project update</span>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <div
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#85868a] hover:text-white cursor-pointer mb-3 select-none transition-colors"
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
                      className="w-full min-h-[140px] text-[13.5px] leading-relaxed text-[#d1d2d5] whitespace-pre-wrap bg-white/[0.02] border border-white/[0.06] hover:border-white/10 focus:border-white/20 focus:outline-none rounded-lg p-3 resize-none transition-colors"
                    />
                  ) : (
                    <div className="text-[13.5px] leading-relaxed text-[#d1d2d5] whitespace-pre-wrap">
                      {project.description || "No description provided."}
                    </div>
                  )
                )}
              </div>

              {/* Milestones in Overview */}
              <div className="mb-8">
                <div
                  onClick={() => handleTabChange("Milestones")}
                  className="flex items-center gap-1.5 text-[13px] text-[#85868a] hover:text-white cursor-pointer py-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>Milestone</span>
                </div>
                {project.milestones && project.milestones.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    {project.milestones.map((ms, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[13px]"
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
                          <span className="text-white font-medium">{ms.name || ms.title}</span>
                        </div>
                        <span className="text-xs text-[#8a8f98]">
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

          {activeTab === "Milestones" &&
            (project.milestones && project.milestones.length > 0 ? (
              <div className="flex flex-col gap-4 mt-2 max-w-3xl">
                {project.milestones.map((ms, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-2"
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
                        <span className="font-medium text-white text-[14px]">
                          {ms.name || ms.title}
                        </span>
                      </div>
                      <span className="text-xs text-[#8a8f98]">
                        {ms.due_date
                          ? new Date(ms.due_date).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    {ms.description && (
                      <p className="text-[13px] text-[#a1a1aa] ml-6">
                        {ms.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center mt-20">
                <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-[#8a8f98] shadow-sm relative overflow-hidden mb-6">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
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
                <h2 className="text-[16px] font-medium text-white mb-3">
                  No milestones yet
                </h2>
                <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                  Project milestones such as key deliverables and dates will
                  appear here.
                </p>
              </div>
            ))}

          {activeTab === "Issues" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[16px] font-medium text-white">
                  Project Issues
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-100 transition-all duration-300 text-xs font-medium px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.14)] hover:shadow-[0_0_28px_rgba(255,255,255,0.22)] active:scale-[0.98]"
                >
                  <Plus size={14} strokeWidth={2.2} /> New Issue
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10">
                  <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
                    <Checklist theme="dark" intensity={0.7} className="w-full h-full text-[#8a8f98] opacity-80" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      Add issues to the project
                    </h2>
                    <p className="text-[14px] text-text-muted leading-relaxed">
                      Start building your project by creating an issue. You can
                      also add teams, team members, and project dates in the
                      project sidebar.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="h-8 px-4 bg-white text-black rounded-full font-medium text-[13px] hover:bg-zinc-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.14)] hover:shadow-[0_0_28px_rgba(255,255,255,0.22)] active:scale-[0.98] flex items-center gap-2"
                    >
                      <Plus size={14} strokeWidth={2.2} />
                      Create new issue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-x-auto flex flex-col shadow-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-[110px_minmax(200px,1fr)_120px_100px_100px_80px] min-w-[710px] gap-4 px-5 py-3 border-b border-white/[0.05] text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                    <div>ID</div>
                    <div>Title</div>
                    <div>Status</div>
                    <div>Priority</div>
                    <div>Assignee</div>
                    <div className="text-right">Due</div>
                  </div>

                  {/* Table Body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] custom-scrollbar min-w-[710px]">
                    {tasks.map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setActiveIndex(idx);
                        }}
                        className={`grid grid-cols-[110px_minmax(200px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors items-center text-[13px] group cursor-pointer ${
                          activeIndex === idx
                            ? "bg-white/[0.08] ring-1 ring-inset ring-white/10"
                            : ""
                        }`}
                      >
                        <div className="font-mono text-[11px] text-text-muted font-medium">
                          {task.project_identifier || project?.identifier
                            ? `${task.project_identifier || project.identifier}-${task.id}`
                            : task.id}
                        </div>
                        <div className="text-text-primary font-medium truncate group-hover:text-accent transition-colors">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status === "Done" ? (
                            <CheckSquare size={14} className="text-green-500" />
                          ) : task.status === "In Progress" ? (
                            <Compass size={14} className="text-orange-400" />
                          ) : task.status === "In Review" ? (
                            <FileText size={14} className="text-blue-400" />
                          ) : (
                            <Compass size={14} className="text-gray-500" />
                          )}
                          <span
                            className={
                              task.status === "Done"
                                ? "text-gray-400"
                                : "text-white"
                            }
                          >
                            {task.status}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              task.priority === "High"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : task.priority === "Medium"
                                  ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                  : "bg-white/5 text-gray-400 border-white/10"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 truncate">
                          {task.assignee_name && (
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(task.assignee_name, task.assignee_name)}`}
                            >
                              {task.assignee_name.charAt(0)}
                            </div>
                          )}
                          <span className="truncate">
                            {task.assignee_name || "Unassigned"}
                          </span>
                        </div>
                        <div className="text-right text-gray-500 text-xs">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Right Sidebar */}
        <div className="hidden lg:block w-[300px] xl:w-[320px] shrink-0 border-l border-white/[0.06] overflow-y-auto custom-scrollbar bg-black md:bg-[#131416]">
          {renderPropertiesSidebar(false)}
        </div>
      </div>

      {/* Mobile Slide-over / Bottom Sheet (Matching Image 4) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Bottom Sheet Drawer */}
          <div className="relative z-10 bg-[#161719] border-t border-white/[0.1] rounded-t-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-5 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <span>Properties</span>
                <ChevronDown size={14} className="text-[#8a8f98]" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg text-[#8a8f98] hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Properties content */}
            {renderPropertiesSidebar(true)}
          </div>
        </div>
      )}

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        onTaskUpdated={(updatedTask) => {
          setTasks(
            tasks.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
            ),
          );
        }}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialProjectId={id}
        onTaskCreated={(newTask) => {
          setTasks([newTask, ...tasks]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
