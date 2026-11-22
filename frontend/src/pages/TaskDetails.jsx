import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useUser, useOrganization } from "@clerk/react";
import {
  X,
  FileText,
  Send,
  Calendar,
  User,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertCircle,
  Link2,
  Star,
  Check,
  PanelRight,
  Menu,
  ChevronRight,
  Paperclip,
  AtSign,
} from "lucide-react";
import { api } from "../lib/api";
import posthog from "../lib/posthog";
import { playUiSound } from "../lib/sound";
import StatusPicker, { getStatusIcon } from "../components/StatusPicker";
import PriorityPicker, { getPriorityIcon } from "../components/PriorityPicker";
import LeadPicker from "../components/LeadPicker";
import DatePicker from "../components/DatePicker";
import { TaskDetailsSkeleton } from "../components/skeletons/PageSkeletons";
import { useDeferredSkeleton } from "../hooks/useDeferredSkeleton";
import { formatKririDate } from "../lib/userPreferences";

const TASK_STATUS_OPTIONS = [
  { value: "Backlog", number: 1 },
  { value: "Todo", number: 2 },
  { value: "In Progress", number: 3 },
  { value: "In Review", number: 4 },
  { value: "Done", number: 5 },
  { value: "Canceled", number: 6 },
];

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { organization } = useOrganization();

  const [task, setTask] = useState(() => {
    if (location.state?.task) return location.state.task;
    const fromApiCache = api.getCached("/tasks");
    if (Array.isArray(fromApiCache)) {
      const found = fromApiCache.find((t) => String(t.id) === String(id));
      if (found) return found;
    }
    return api.getCached(`/tasks/${id}`) || null;
  });
  const [title, setTitle] = useState(() => task?.title || "");
  const [description, setDescription] = useState(() => task?.description || "");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(() => !task);

  // Active Picker Popover State
  const [activePicker, setActivePicker] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);

  // Subtasks State
  const [subtasks, setSubtasks] = useState(() => task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Dependencies State
  const [dependencies, setDependencies] = useState(() => task?.dependencies || { blocked_by: [], blocking: [] });
  const [allWorkspaceTasks, setAllWorkspaceTasks] = useState(() => {
    const fromApiCache = api.getCached("/tasks");
    return Array.isArray(fromApiCache) ? fromApiCache : [];
  });
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);
  const [selectedBlockerId, setSelectedBlockerId] = useState("");
  const [depError, setDepError] = useState("");

  const [isStarred, setIsStarred] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const commentInputRef = useRef(null);

  // Load available members for Assignee Picker
  useEffect(() => {
    if (organization?.id) {
      api
        .get(`/workspaces/${organization.id}/members`)
        .then((data) => {
          if (Array.isArray(data)) setAvailableMembers(data);
        })
        .catch((err) => console.error("Failed to load members", err));
    } else if (user) {
      setAvailableMembers([
        {
          id: user.id || "personal",
          name: user.fullName || "User",
          email: user.primaryEmailAddress?.emailAddress || "",
          avatar_url: user.imageUrl,
          role: "Owner",
        },
      ]);
    }
  }, [organization?.id, user]);

  // Load workspace tasks for blocker selection on-demand
  useEffect(() => {
    if (!isAddingBlocker || allWorkspaceTasks.length > 0) return;
    const controller = new AbortController();
    api
      .get("/tasks", { signal: controller.signal })
      .then((data) => {
        if (Array.isArray(data)) setAllWorkspaceTasks(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to load tasks for dependencies", err);
        }
      });
    return () => {
      controller.abort();
    };
  }, [isAddingBlocker, allWorkspaceTasks.length]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    // Check if the current task in state matches this id, otherwise check cache or show skeleton
    const fromApiCache = api.getCached("/tasks");
    const cached =
      (Array.isArray(fromApiCache) &&
        fromApiCache.find((t) => String(t.id) === String(id))) ||
      api.getCached(`/tasks/${id}`);

    if (cached) {
      setTask(cached);
      setTitle(cached.title || "");
      setDescription(cached.description || "");
      setSubtasks(cached.subtasks || []);
      setDependencies(cached.dependencies || { blocked_by: [], blocking: [] });
      setLoading(false);
    } else {
      setTask(null);
      setLoading(true);
    }

    const fetchTaskDetails = async () => {
      try {
        const [taskData, commentsData] = await Promise.all([
          api.get(`/tasks/${id}`, { signal: controller.signal }),
          api.get(`/comments/task/${id}`, { signal: controller.signal }).catch(
            (err) => {
              if (err.name === "AbortError") throw err;
              return [];
            },
          ),
        ]);
        setTask(taskData);
        setTitle(taskData.title || "");
        setDescription(taskData.description || "");
        setSubtasks(taskData.subtasks || []);
        setDependencies(
          taskData.dependencies || { blocked_by: [], blocking: [] },
        );
        setComments(Array.isArray(commentsData) ? commentsData : []);

        posthog.capture("task_viewed", {
          task_id: id,
          project_id: taskData.project_id,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("fetchTaskDetails error:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTaskDetails();

    return () => {
      controller.abort();
    };
  }, [id]);

  // Keyboard navigation & Shortcuts (S=Status, P=Priority, A=Assignee, D=Due Date, C=Comment)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);

      if (e.key === "Escape") {
        if (activePicker) {
          setActivePicker(null);
          return;
        }
        if (isInput) {
          e.target.blur();
        } else {
          navigate("/tasks");
        }
        return;
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (
          commentInputRef.current &&
          document.activeElement === commentInputRef.current
        ) {
          handlePostComment(e);
        }
        return;
      }

      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          setActivePicker((prev) => (prev === "status" ? null : "status"));
          break;
        case "p":
          e.preventDefault();
          setActivePicker((prev) => (prev === "priority" ? null : "priority"));
          break;
        case "a":
          e.preventDefault();
          setActivePicker((prev) => (prev === "assignee" ? null : "assignee"));
          break;
        case "d":
          e.preventDefault();
          setActivePicker((prev) => (prev === "due_date" ? null : "due_date"));
          break;
        case "c":
          e.preventDefault();
          commentInputRef.current?.focus();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePicker, navigate]);

  // Save Title
  const handleSaveTitle = async () => {
    if (!title.trim() || title === task?.title) return;
    try {
      const updated = await api.put(`/tasks/${id}`, {
        ...task,
        title: title.trim(),
      });
      setTask(updated);
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // Save Description
  const handleSaveDescription = async () => {
    if (description === (task?.description || "")) return;
    try {
      const updated = await api.put(`/tasks/${id}`, {
        ...task,
        description: description.trim(),
      });
      setTask(updated);
    } catch (err) {
      console.error("Failed to update description:", err);
    }
  };

  // Save Status
  const handleSelectStatus = async (newStatus) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${id}`, {
        ...task,
        status: newStatus,
      });
      setTask(updated);
      if (newStatus === "Done") {
        playUiSound("success");
      } else {
        playUiSound("toggle");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Save Priority
  const handleSelectPriority = async (newPriority) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${id}`, {
        ...task,
        priority: newPriority,
      });
      setTask(updated);
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  // Save Assignee
  const handleSelectAssignee = async (member) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${id}`, {
        ...task,
        assignee_id: member ? member.id : null,
        assignee_name: member ? member.name : null,
      });
      setTask(updated);
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  // Save Due Date
  const handleSelectDueDate = async (date) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${id}`, {
        ...task,
        due_date: date ? date.toISOString() : null,
      });
      setTask(updated);
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to update due date:", err);
    }
  };

  // Create Subtask
  const handleCreateSubtask = async (e) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const created = await api.post(`/tasks/${id}/subtasks`, {
        title: newSubtaskTitle.trim(),
      });
      setSubtasks([...subtasks, created]);
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to create subtask:", err);
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (subtask) => {
    const newStatus = subtask.status === "Done" ? "Todo" : "Done";
    try {
      const updated = await api.put(`/tasks/${id}/subtasks/${subtask.id}`, {
        status: newStatus,
      });
      setSubtasks(subtasks.map((s) => (s.id === subtask.id ? updated : s)));
      if (newStatus === "Done") {
        playUiSound("success");
      } else {
        playUiSound("toggle");
      }
    } catch (err) {
      console.error("Failed to update subtask:", err);
    }
  };

  // Delete Subtask
  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await api.delete(`/tasks/${id}/subtasks/${subtaskId}`);
      setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  // Post Comment
  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const created = await api.post(`/comments/task/${id}`, {
        content: newComment.trim(),
        user_name: user?.fullName || "User",
      });
      setComments([...comments, created]);
      setNewComment("");
      playUiSound("toggle");
      posthog.capture("comment_created", { task_id: id });
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      playUiSound("trash");
      navigate("/tasks");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    playUiSound("toggle");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Add Blocker Dependency
  const handleAddDependency = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBlockerId) return;
    setDepError("");

    try {
      const result = await api.post(`/tasks/${id}/dependencies`, {
        depends_on_task_id: parseInt(selectedBlockerId, 10),
      });
      setDependencies({
        ...dependencies,
        blocked_by: [...dependencies.blocked_by, result],
      });
      setSelectedBlockerId("");
      setIsAddingBlocker(false);
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to add dependency:", err);
      setDepError(err.message || "Failed to add blocker. Circular dependency detected.");
    }
  };

  const handleRemoveDependency = async (depId) => {
    try {
      await api.delete(`/tasks/${id}/dependencies/${depId}`);
      setDependencies({
        ...dependencies,
        blocked_by: dependencies.blocked_by.filter(
          (d) => (d.dependency_id || d.id) !== depId
        ),
      });
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to remove dependency:", err);
    }
  };

  const availableBlockers = useMemo(() => {
    const existingBlockerIds = new Set(
      dependencies.blocked_by.map((d) => d.id || d.depends_on_task_id)
    );
    existingBlockerIds.add(parseInt(id, 10));
    return allWorkspaceTasks.filter((t) => !existingBlockerIds.has(t.id));
  }, [allWorkspaceTasks, dependencies.blocked_by, id]);

  const showSkeleton = useDeferredSkeleton(loading && !task, 180);

  if (showSkeleton) {
    return <TaskDetailsSkeleton isModal={false} />;
  }

  if (!task) {
    return (
      <div className="p-8 text-foreground flex flex-col gap-3 items-center justify-center h-full">
        <AlertCircle size={32} className="text-zinc-500" />
        <h2 className="text-lg font-semibold">Task not found</h2>
        <Link to="/tasks" className="text-accent hover:underline text-sm">
          Return to tasks
        </Link>
      </div>
    );
  }

  const taskIdentifier = task?.project_identifier
    ? `${task.project_identifier}-${task.id}`
    : `TASK-${task?.id}`;

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[var(--card-bg)] overflow-hidden text-foreground">
      {/* 1. TOP BREADCRUMB & ACTION HEADER (Matches ProjectDetails & Linear Image 1) */}
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
            to="/tasks"
            className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors shrink-0"
          >
            Tasks
          </Link>
          <span className="text-zinc-400 dark:text-[#55565a] shrink-0">›</span>

          {task?.project_name && (
            <>
              <Link
                to={`/projects/${task.project_id}`}
                className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[180px]"
              >
                {task.project_name}
              </Link>
              <span className="text-zinc-400 dark:text-[#55565a] shrink-0">›</span>
            </>
          )}

          <span className="font-mono text-zinc-900 dark:text-[#d1d2d5] font-semibold shrink-0">
            {taskIdentifier}
          </span>
          <span className="text-zinc-400 dark:text-[#6e737d] font-normal truncate max-w-[140px] sm:max-w-[220px] hidden sm:inline">
            {task.title}
          </span>

          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0 ml-1"
            title={isStarred ? "Starred" : "Star issue"}
          >
            <Star
              size={13}
              className={isStarred ? "text-amber-400 fill-amber-400" : ""}
            />
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors cursor-pointer"
            title={isCopied ? "Link copied!" : "Copy link"}
          >
            {isCopied ? <Check size={15} className="text-emerald-500" /> : <Link2 size={15} />}
          </button>

          <button
            type="button"
            onClick={handleDeleteTask}
            className="p-1.5 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
            title="Delete task"
          >
            <Trash2 size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isSidebarOpen
                ? "bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            title="Toggle sidebar"
          >
            <PanelRight size={15} />
          </button>
        </div>
      </div>

      {/* 2. MAIN BODY (Linear 2-Column Layout matching Image 1) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left: Scrollable Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar px-6 sm:px-12 py-8 flex flex-col">
          {/* Large Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="Issue title"
            className="w-full bg-transparent border-none text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-[#6e737d] mb-3 tracking-tight"
          />

          {/* Seamless Description Textarea */}
          <div className="mb-6">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder="Add description..."
              rows={4}
              className="w-full bg-transparent border-none text-[14px] text-zinc-700 dark:text-[#d1d2d5] focus:outline-none placeholder:text-zinc-500 dark:placeholder:text-[#6e737d] leading-relaxed resize-none"
            />
          </div>

          {/* Sub-issues Section (Linear Style matching Image 5) */}
          <div className="mb-8">
            {!isAddingSubtask && (
              <button
                type="button"
                onClick={() => setIsAddingSubtask(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white transition-colors cursor-pointer py-1"
              >
                <Plus size={13} />
                <span>Add sub-issues</span>
              </button>
            )}

            {/* Subtask inline creation card */}
            {isAddingSubtask && (
              <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-3 mb-3 animate-in fade-in duration-150 max-w-xl">
                <input
                  type="text"
                  autoFocus
                  placeholder="Issue title"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateSubtask(e);
                    }
                  }}
                  className="w-full bg-transparent border-none text-[13.5px] font-medium text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-[#6e737d] mb-2"
                />
                <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#8a8f98]">
                    <span className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] font-mono text-[10.5px]">
                      {task?.project_identifier || "TASK"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle("");
                      }}
                      className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!newSubtaskTitle.trim()}
                      onClick={handleCreateSubtask}
                      className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subtask Progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full max-w-md h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden my-3">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${
                      (subtasks.filter((s) => s.status === "Done").length /
                        subtasks.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            )}

            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="space-y-1 mt-2 max-w-xl">
                {subtasks.map((sub) => {
                  const isSubDone = sub.status === "Done";
                  return (
                    <div
                      key={sub.id}
                      className="group flex items-center justify-between p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-[13px]"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(sub)}
                          className="text-zinc-400 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                          aria-label={isSubDone ? "Mark todo" : "Mark done"}
                        >
                          {isSubDone ? (
                            <CheckSquare size={15} className="text-emerald-500" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                        <span
                          className={`truncate ${
                            isSubDone
                              ? "line-through text-zinc-400 dark:text-[#8a8f98]"
                              : "text-zinc-900 dark:text-white font-medium"
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sub.assignee_name && (
                          <span className="text-[11px] text-zinc-500 dark:text-[#8a8f98]">
                            {sub.assignee_name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(sub.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition-opacity cursor-pointer"
                          title="Delete subtask"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dependencies Section */}
          {dependencies.blocked_by.length > 0 && (
            <div className="mb-8 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-3.5 max-w-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-accent" />
                  <h4 className="text-xs font-semibold text-foreground">Dependencies</h4>
                </div>
              </div>
              <div className="space-y-1">
                {dependencies.blocked_by.map((dep) => (
                  <div
                    key={dep.dependency_id || dep.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle text-[12px]"
                  >
                    <span className="truncate text-foreground font-mono text-[11px]">
                      {dep.project_identifier ? `${dep.project_identifier}-${dep.id}` : `#${dep.id}`}
                      <span className="font-sans ml-2 text-text-muted">{dep.title}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">{dep.status}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep.dependency_id || dep.id)}
                        className="text-text-muted hover:text-rose-500 p-0.5 rounded cursor-pointer"
                        title="Remove blocker"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Section (Linear Image 1) */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-6 mb-8 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Activity</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Unsubscribe
                </button>
                <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold">
                  {user?.firstName?.charAt(0) || "C"}
                </div>
              </div>
            </div>

            {/* Creator Activity Item */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-[#8a8f98] mb-4">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>
                {task?.creator_name || user?.fullName || "cyruskjones"} created ·{" "}
                {formatKririDate(task?.created_at || Date.now())}
              </span>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex flex-shrink-0 items-center justify-center text-accent text-[10px] font-bold">
                    {comment.user_name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.03] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-semibold text-foreground">
                        {comment.user_name}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {formatKririDate(comment.created_at)}
                      </span>
                    </div>
                    <div className="text-[13px] text-foreground">{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Linear Comment Composer Box */}
            <form onSubmit={handlePostComment} className="relative mt-2">
              <textarea
                ref={commentInputRef}
                rows={3}
                placeholder="Leave a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handlePostComment(e);
                  }
                }}
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] focus:border-black/20 dark:focus:border-white/20 rounded-xl p-3 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-[#6e737d] focus:outline-none resize-none pb-10"
              />
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                  title="Send comment (⌘ + Enter)"
                >
                  <Send size={11} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Properties Sidebar (Exact Linear Image 1 Layout) */}
        {isSidebarOpen && (
          <div className="w-full md:w-[280px] shrink-0 border-t md:border-t-0 md:border-l border-black/[0.06] dark:border-white/[0.06] p-5 flex flex-col gap-6 text-[12.5px] bg-surface/30 overflow-y-auto custom-scrollbar">
            {/* Section 1: Properties */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5 uppercase tracking-wider">
                Properties
              </div>
              <div className="space-y-1">
                {/* Status */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActivePicker(activePicker === "status" ? null : "status")}
                    className="w-full flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left text-zinc-800 dark:text-[#d1d2d5]"
                  >
                    <div className="shrink-0">{getStatusIcon(task?.status || "Todo")}</div>
                    <span className="font-medium">{task?.status || "Todo"}</span>
                  </button>
                  {activePicker === "status" && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-50">
                      <StatusPicker
                        value={task?.status || "Todo"}
                        options={TASK_STATUS_OPTIONS}
                        onChange={handleSelectStatus}
                        onClose={() => setActivePicker(null)}
                      />
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActivePicker(activePicker === "priority" ? null : "priority")}
                    className="w-full flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white"
                  >
                    <div className="shrink-0">{getPriorityIcon(task?.priority || "No priority")}</div>
                    <span>{task?.priority === "No priority" ? "Set priority" : task?.priority}</span>
                  </button>
                  {activePicker === "priority" && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-50">
                      <PriorityPicker
                        value={task?.priority || "No priority"}
                        onChange={handleSelectPriority}
                        onClose={() => setActivePicker(null)}
                      />
                    </div>
                  )}
                </div>

                {/* Assignee */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActivePicker(activePicker === "assignee" ? null : "assignee")}
                    className="w-full flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left text-zinc-800 dark:text-[#d1d2d5]"
                  >
                    {task?.assignee_name ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                          {task.assignee_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{task.assignee_name}</span>
                      </>
                    ) : (
                      <>
                        <User size={13} className="text-zinc-400 dark:text-[#8a8f98] shrink-0" />
                        <span className="text-zinc-500 dark:text-[#8a8f98]">Assign to...</span>
                      </>
                    )}
                  </button>
                  {activePicker === "assignee" && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-50">
                      <LeadPicker
                        value={task?.assignee_id ? { id: task.assignee_id, name: task.assignee_name } : null}
                        availableMembers={availableMembers}
                        onChange={handleSelectAssignee}
                        onClose={() => setActivePicker(null)}
                        title="Assign to..."
                        emptyLabel="No assignee"
                        roleLabel=""
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Labels (Matches Image 1) */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5 uppercase tracking-wider">
                Labels
              </div>
              <button
                type="button"
                className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer w-full text-left"
              >
                <span className="text-[13px] opacity-70">⊘</span>
                <span>Add label</span>
              </button>
            </div>

            {/* Section 3: Project (Matches Image 1) */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5 uppercase tracking-wider">
                Project
              </div>
              {task?.project_name ? (
                <Link
                  to={`/projects/${task.project_id}`}
                  className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-zinc-700 dark:text-[#d1d2d5] transition-colors"
                >
                  <FileText size={13} className="text-zinc-400 dark:text-[#8a8f98] shrink-0" />
                  <span className="truncate">{task.project_name}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg text-zinc-500 dark:text-[#8a8f98]">
                  <FileText size={13} className="text-zinc-400 dark:text-[#8a8f98] shrink-0" />
                  <span>Add to project</span>
                </div>
              )}
            </div>

            {/* Section 4: Due date */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5 uppercase tracking-wider">
                Due date
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePicker(activePicker === "due_date" ? null : "due_date")}
                  className="w-full flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-zinc-700 dark:text-[#d1d2d5] transition-colors cursor-pointer text-left"
                >
                  <Calendar size={13} className="text-zinc-400 dark:text-[#8a8f98] shrink-0" />
                  <span>{task?.due_date ? formatKririDate(task.due_date) : "Set due date"}</span>
                </button>
                {activePicker === "due_date" && (
                  <div className="absolute top-[calc(100%+4px)] right-0 z-50">
                    <DatePicker
                      value={task?.due_date}
                      onChange={handleSelectDueDate}
                      onClose={() => setActivePicker(null)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Dependencies / Blocker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] uppercase tracking-wider">
                  Dependencies
                </span>
                {!isAddingBlocker && (
                  <button
                    type="button"
                    onClick={() => setIsAddingBlocker(true)}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={11} /> Blocker
                  </button>
                )}
              </div>

              {isAddingBlocker && (
                <form onSubmit={handleAddDependency} className="flex flex-col gap-2 p-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg border border-black/[0.06] dark:border-white/[0.06]">
                  <select
                    value={selectedBlockerId}
                    onChange={(e) => setSelectedBlockerId(e.target.value)}
                    className="w-full bg-surface text-foreground border border-border text-xs rounded p-1.5 focus:outline-none"
                  >
                    <option value="">Select blocking task...</option>
                    {availableBlockers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.project_identifier ? `${t.project_identifier}-${t.id}` : `#${t.id}`} - {t.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBlocker(false);
                        setSelectedBlockerId("");
                      }}
                      className="text-xs text-text-muted hover:text-foreground px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedBlockerId}
                      className="text-xs bg-accent hover:bg-accent-hover text-white px-2.5 py-1 rounded disabled:opacity-50 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {depError && (
                <p className="text-[11px] text-rose-500 mt-1">{depError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

