import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Compass,
  CheckSquare,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import PageLoading from "../components/PageLoading";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { useSocket } from "../contexts/SocketContext";
import { useListShortcuts } from "../hooks/useListShortcuts";
import { useTheme } from "../contexts/ThemeContext";
import { Format as Checklist } from "@lucasmarkes/hairline/react";

export default function Tasks() {
  const { effectiveTheme } = useTheme();
  const outletCtx = useOutletContext();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { organization } = useOrganization();
  const socket = useSocket();

  const [tasks, setTasks] = useState(() => {
    const fromApiCache = api.getCached("/tasks");
    if (Array.isArray(fromApiCache) && fromApiCache.length > 0) return fromApiCache;
    try {
      const cached = localStorage.getItem(`kriri:cache:tasks_${organization?.id || "personal"}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => tasks.length === 0);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        ),
      );
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    socket.on("TASK_CREATED", handleTaskCreated);
    socket.on("TASK_UPDATED", handleTaskUpdated);
    socket.on("TASK_DELETED", handleTaskDeleted);

    return () => {
      socket.off("TASK_CREATED", handleTaskCreated);
      socket.off("TASK_UPDATED", handleTaskUpdated);
      socket.off("TASK_DELETED", handleTaskDeleted);
    };
  }, [socket]);

  useEffect(() => {
    if (!user) return;
    setTasks((prev) => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
    api
      .get("/tasks")
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data);
          try {
            localStorage.setItem(
              `kriri:cache:tasks_${organization?.id || "personal"}`,
              JSON.stringify(data),
            );
          } catch {}
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user?.id, organization?.id]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.assignee_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (t.status || "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tasks, searchQuery],
  );

  useEffect(() => {
    const taskIdParam = searchParams.get("task") || location.state?.taskId;
    if (taskIdParam) {
      const parsedId = Number(taskIdParam) || taskIdParam;
      setHighlightedTaskId(parsedId);
      const targetIdx = filteredTasks.findIndex((t) => String(t.id) === String(parsedId));
      if (targetIdx !== -1) {
        setActiveIndex(targetIdx);
      }
      if (searchParams.get("modal") === "true" || location.state?.openModal) {
        setSelectedTaskId(parsedId);
      }
    }
  }, [location.search, location.state, filteredTasks.length]);

  useEffect(() => {
    if (!loading && highlightedTaskId) {
      const timer = setTimeout(() => {
        const desktopEl = document.getElementById(`task-row-desktop-${highlightedTaskId}`);
        const mobileEl = document.getElementById(`task-row-mobile-${highlightedTaskId}`);
        const el = (desktopEl && desktopEl.offsetParent !== null) ? desktopEl : (mobileEl && mobileEl.offsetParent !== null ? mobileEl : (desktopEl || mobileEl));
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loading, highlightedTaskId]);

  useListShortcuts({
    items: filteredTasks,
    activeIndex,
    setActiveIndex,
    onOpenItem: (task) => setSelectedTaskId(task.id),
    onCreateItem: () => setIsCreateModalOpen(true),
  });

  if (loading) {
    return <PageLoading label="Issues" />;
  }

  const openMobileNav = () => {
    if (outletCtx?.openMobileNav) {
      outletCtx.openMobileNav();
    } else {
      window.dispatchEvent(new CustomEvent("open-mobile-nav"));
    }
  };

  return (
    <div className="w-full flex flex-col min-h-full md:h-full animate-in fade-in duration-300">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 min-h-[38px]">
        {/* Left: Mobile hamburger menu + Title + Count */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={openMobileNav}
            className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
            Issues
          </h1>
          <div className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-[#8a8f98] text-[11px] font-medium border border-black/[0.06] dark:border-white/[0.06] shrink-0">
            {tasks.length}
          </div>
        </div>

        {/* Right: Search + Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Search Input */}
          <div className="hidden sm:block relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#8a8f98]"
            />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] bg-white dark:bg-[#16171a] border border-black/[0.08] dark:border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#8a8f98] focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
            />
          </div>

          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`sm:hidden h-[26px] w-[26px] flex items-center justify-center rounded-md transition-colors ${
              isSearchOpen || searchQuery
                ? "bg-black/[0.08] dark:bg-white/[0.1] text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            }`}
            aria-label="Filter tasks"
            title="Search"
          >
            <Search size={14} />
          </button>

          {/* New Issue Button - Sized to match header */}
          {tasks.length > 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-[26px] sm:h-[28px] px-3 bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-300 text-[11.5px] sm:text-[12px] font-medium rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_0_20px_rgba(255,255,255,0.14)] active:scale-[0.98] shrink-0 flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2.2} /> New Issue
            </button>
          )}
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {isSearchOpen && (
        <div className="sm:hidden mb-4 relative flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#8a8f98]"
            />
            <input
              type="text"
              autoFocus
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#16171a] border border-black/[0.08] dark:border-white/[0.08] rounded-md pl-9 pr-8 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#8a8f98] focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white p-0.5"
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            className="text-xs text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white px-1.5 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
            <Checklist theme={effectiveTheme} intensity={0.7} className="w-full h-full text-zinc-400 dark:text-[#8a8f98] opacity-80" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
              Create your first issue
            </h2>
            <p className="text-[14px] text-zinc-500 dark:text-[#8a8f98] leading-relaxed">
              Issues are used to track tasks, bugs, and feature requests. Get
              started by organizing your work.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-4 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-full font-medium text-[13px] hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_0_20px_rgba(255,255,255,0.14)] active:scale-[0.98] flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={2.2} />
              New Issue
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-[#16171a] border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden flex flex-col shadow-sm">
          {/* Mobile Issue List (< md) */}
          <div className="md:hidden flex flex-col divide-y divide-black/[0.06] dark:divide-white/[0.05] overflow-y-auto">
            {filteredTasks.map((task, idx) => {
              const isHighlighted = String(highlightedTaskId) === String(task.id);
              const isSelected = String(selectedTaskId) === String(task.id) || activeIndex === idx;
              return (
                <div
                  key={task.id}
                  id={`task-row-mobile-${task.id}`}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setHighlightedTaskId(task.id);
                    setActiveIndex(idx);
                  }}
                  className={`relative p-3.5 flex flex-col gap-2 transition-colors cursor-pointer ${
                    isHighlighted
                      ? "bg-black/[0.04] dark:bg-white/[0.06] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-r-full before:bg-zinc-900 dark:before:bg-white/80"
                      : isSelected
                        ? "bg-black/[0.02] dark:bg-white/[0.04]"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono transition-colors ${
                          isHighlighted ? "text-zinc-900 dark:text-[#f0f0f0]" : "text-zinc-500 dark:text-[#8a8f98]"
                        }`}
                      >
                        {task.project_identifier
                          ? `${task.project_identifier}-${task.id}`
                          : task.project_slug
                            ? `${task.project_slug}-${task.id}`
                            : task.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          task.priority === "High"
                            ? "bg-danger/10 text-danger border-danger/20"
                            : task.priority === "Medium"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-[#8a8f98] border-black/[0.06] dark:border-white/[0.06]"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-[#8a8f98]">
                        {task.status === "Done" ? (
                          <CheckSquare size={13} className="text-success" />
                        ) : task.status === "In Progress" ? (
                          <Compass size={13} className="text-warning fill-warning/20" />
                        ) : task.status === "In Review" ? (
                          <FileText size={13} className="text-info fill-info/20" />
                        ) : (
                          <Compass size={13} className="text-zinc-400 dark:text-[#8a8f98]" />
                        )}
                        <span className="text-[12px]">{task.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[13px] font-medium text-zinc-900 dark:text-white line-clamp-2">
                    {task.title}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#8a8f98] pt-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {task.assignee_name && (
                        <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[8px] font-bold">
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
              );
            })}
          </div>

          {/* Desktop/Tablet Table Grid (>= md) */}
          <div className="hidden md:flex flex-col flex-1 overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_minmax(240px,1fr)_120px_100px_100px_80px] min-w-[720px] gap-4 px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.05] text-xs font-medium text-zinc-500 dark:text-[#8a8f98] uppercase tracking-wider">
              <div>ID</div>
              <div>Title</div>
              <div>Status</div>
              <div>Priority</div>
              <div>Assignee</div>
              <div className="text-right">Due</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-black/[0.06] dark:divide-white/[0.05] min-w-[720px]">
              {filteredTasks.map((task, idx) => {
                const isHighlighted = String(highlightedTaskId) === String(task.id);
                const isSelected = String(selectedTaskId) === String(task.id) || activeIndex === idx;
                return (
                  <div
                    key={task.id}
                    id={`task-row-desktop-${task.id}`}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setHighlightedTaskId(task.id);
                      setActiveIndex(idx);
                    }}
                    className={`relative grid grid-cols-[80px_minmax(240px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3.5 transition-colors items-center text-[13px] group cursor-pointer ${
                      isHighlighted
                        ? "bg-black/[0.04] dark:bg-white/[0.06] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-zinc-900 dark:before:bg-white/80"
                        : isSelected
                          ? "bg-black/[0.02] dark:bg-white/[0.03]"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span
                        className={`transition-colors ${
                          isHighlighted ? "text-zinc-900 dark:text-[#f0f0f0]" : "text-zinc-500 dark:text-[#8a8f98]"
                        }`}
                      >
                        {task.project_identifier
                          ? `${task.project_identifier}-${task.id}`
                          : task.project_slug
                            ? `${task.project_slug}-${task.id}`
                            : task.id}
                      </span>
                    </div>
                  <div className="text-zinc-900 dark:text-white font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "Done" ? (
                      <CheckSquare size={14} className="text-success" />
                    ) : task.status === "In Progress" ? (
                      <Compass
                        size={14}
                        className="text-warning fill-warning/20"
                      />
                    ) : task.status === "In Review" ? (
                      <FileText size={14} className="text-info fill-info/20" />
                    ) : (
                      <Compass size={14} className="text-zinc-400 dark:text-[#8a8f98]" />
                    )}
                    <span
                      className={
                        task.status === "Done"
                          ? "text-zinc-500 dark:text-[#8a8f98]"
                          : "text-zinc-900 dark:text-white"
                      }
                    >
                      {task.status}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        task.priority === "High"
                          ? "bg-danger/10 text-danger border-danger/20"
                          : task.priority === "Medium"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-[#8a8f98] border-black/[0.06] dark:border-white/[0.06]"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-[#8a8f98] truncate">
                    {task.assignee_name && (
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[9px] font-bold">
                        {task.assignee_name.charAt(0)}
                      </div>
                    )}
                    <span className="truncate">
                      {task.assignee_name || "Unassigned"}
                    </span>
                  </div>
                  <div className="text-right text-zinc-500 dark:text-[#8a8f98] text-xs">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => {
          setSelectedTaskId(null);
          if (searchParams.has("task") || location.state?.taskId) {
            navigate("/tasks", { replace: true });
          }
        }}
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
        onTaskCreated={(newTask) => {
          setTasks([newTask, ...tasks]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
