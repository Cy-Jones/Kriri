import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useUser, useOrganization } from "@clerk/react";
import {
  X,
  FileText,
  MessageSquare,
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
  Copy,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { api } from "../lib/api";
import posthog from "../lib/posthog";
import { playUiSound } from "../lib/sound";
import StatusPicker, { getStatusIcon } from "./StatusPicker";
import PriorityPicker, { getPriorityIcon } from "./PriorityPicker";
import LeadPicker from "./LeadPicker";
import DatePicker from "./DatePicker";
import { formatKririDate } from "../lib/userPreferences";
import { TaskDetailsSkeleton } from "./skeletons/PageSkeletons";
import { useDeferredSkeleton } from "../hooks/useDeferredSkeleton";

const TASK_STATUS_OPTIONS = [
  { value: "Backlog", number: 1 },
  { value: "Todo", number: 2 },
  { value: "In Progress", number: 3 },
  { value: "In Review", number: 4 },
  { value: "Done", number: 5 },
  { value: "Canceled", number: 6 },
];

export default function TaskDetailsModal({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated,
  onTaskDeleted,
}) {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [task, setTask] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Active Picker Popover State
  const [activePicker, setActivePicker] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);

  // Subtasks State
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Dependencies State
  const [dependencies, setDependencies] = useState({ blocked_by: [], blocking: [] });
  const [allWorkspaceTasks, setAllWorkspaceTasks] = useState([]);
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);
  const [selectedBlockerId, setSelectedBlockerId] = useState("");
  const [depError, setDepError] = useState("");

  const [isStarred, setIsStarred] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const commentInputRef = useRef(null);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks?task=${taskId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    playUiSound("toggle");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Load available members for Assignee Picker
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, organization?.id, user]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!isOpen) return;

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
          onClose();
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
  }, [isOpen, onClose, activePicker]);

  const showSkeleton = useDeferredSkeleton(loading && !task, 180);

  const fetchTaskDetails = async () => {
    try {
      if (!task) setLoading(true);
      const taskData = await api.get(`/tasks/${taskId}`);
      setTask(taskData);
      setTitle(taskData.title || "");
      setDescription(taskData.description || "");
      setSubtasks(taskData.subtasks || []);
      setDependencies(taskData.dependencies || { blocked_by: [], blocking: [] });

      const commentsData = await api.get(`/comments/task/${taskId}`);
      setComments(Array.isArray(commentsData) ? commentsData : []);

      posthog.capture("task_viewed", {
        task_id: taskId,
        project_id: taskData.project_id,
      });
    } catch (error) {
      console.error("fetchTaskDetails error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      const directCache = api.getCached(`/tasks/${taskId}`);
      const listCache = api.getCached("/tasks");
      const found = directCache || (Array.isArray(listCache) ? listCache.find(t => String(t.id) === String(taskId)) : null);
      if (found) {
        setTask(found);
        setTitle(found.title || "");
        setDescription(found.description || "");
        if (found.subtasks) setSubtasks(found.subtasks);
        if (found.dependencies) setDependencies(found.dependencies);
      }
      fetchTaskDetails();
    } else if (!isOpen) {
      setTask(null);
      setTitle("");
      setDescription("");
      setComments([]);
      setLoading(true);
    }
  }, [isOpen, taskId]);

  // Save Title
  const handleSaveTitle = async () => {
    if (!title.trim() || title === task?.title) return;
    try {
      const updated = await api.put(`/tasks/${taskId}`, {
        ...task,
        title: title.trim(),
      });
      setTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // Save Description
  const handleSaveDescription = async () => {
    if (description === (task?.description || "")) return;
    try {
      const updated = await api.put(`/tasks/${taskId}`, {
        ...task,
        description: description.trim(),
      });
      setTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update description:", err);
    }
  };

  // Save Status
  const handleSelectStatus = async (newStatus) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${taskId}`, {
        ...task,
        status: newStatus,
      });
      setTask(updated);
      if (newStatus === "Done") {
        playUiSound("success");
      } else {
        playUiSound("toggle");
      }
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Save Priority
  const handleSelectPriority = async (newPriority) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${taskId}`, {
        ...task,
        priority: newPriority,
      });
      setTask(updated);
      playUiSound("toggle");
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  // Save Assignee
  const handleSelectAssignee = async (selectedMember) => {
    setActivePicker(null);
    const newAssigneeId = selectedMember?.id || null;
    try {
      const updated = await api.put(`/tasks/${taskId}`, {
        ...task,
        assignee_id: newAssigneeId,
      });
      setTask({
        ...updated,
        assignee_name: selectedMember?.name || null,
        assignee_avatar_url: selectedMember?.avatar_url || null,
      });
      playUiSound("toggle");
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update assignee:", err);
    }
  };

  // Save Due Date
  const handleSelectDueDate = async (date) => {
    setActivePicker(null);
    try {
      const updated = await api.put(`/tasks/${taskId}`, {
        ...task,
        due_date: date ? new Date(date).toISOString().split("T")[0] : null,
      });
      setTask(updated);
      playUiSound("toggle");
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update due date:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      playUiSound("toggle");
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Comments
  const handlePostComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const addedComment = await api.post("/comments", {
        task_id: taskId,
        content: newComment.trim(),
      });
      setComments([...comments, addedComment]);
      setNewComment("");
      playUiSound("chime");
      posthog.capture("comment_added", { task_id: taskId });
    } catch (error) {
      console.error(error);
    }
  };

  // Subtasks
  const handleToggleSubtask = async (sub) => {
    const nextStatus = sub.status === "Done" ? "Todo" : "Done";
    const prevSubtasks = [...subtasks];
    setSubtasks(subtasks.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s)));
    try {
      await api.put(`/tasks/${sub.id}`, { title: sub.title, status: nextStatus });
      if (nextStatus === "Done") {
        playUiSound("success");
      } else {
        playUiSound("toggle");
      }
      const refreshed = await api.get(`/tasks/${taskId}`);
      setTask(refreshed);
      if (onTaskUpdated) onTaskUpdated(refreshed);
    } catch (err) {
      console.error("Failed to update subtask:", err);
      setSubtasks(prevSubtasks);
    }
  };

  const handleCreateSubtask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      const created = await api.post(`/tasks/${taskId}/subtasks`, {
        title: newSubtaskTitle.trim(),
      });
      setSubtasks([...subtasks, created]);
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      playUiSound("chime");
      const refreshed = await api.get(`/tasks/${taskId}`);
      setTask(refreshed);
      if (onTaskUpdated) onTaskUpdated(refreshed);
    } catch (err) {
      console.error("Failed to create subtask:", err);
    }
  };

  const handleDeleteSubtask = async (subId) => {
    try {
      await api.delete(`/tasks/${subId}`);
      setSubtasks(subtasks.filter((s) => s.id !== subId));
      playUiSound("toggle");
      const refreshed = await api.get(`/tasks/${taskId}`);
      setTask(refreshed);
      if (onTaskUpdated) onTaskUpdated(refreshed);
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  // Dependencies
  const fetchWorkspaceTasks = async () => {
    try {
      const res = await api.get("/tasks?limit=200");
      setAllWorkspaceTasks(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("fetchWorkspaceTasks error:", err);
    }
  };

  const handleAddBlocker = async () => {
    if (!selectedBlockerId) return;
    setDepError("");
    try {
      const newDep = await api.post(`/tasks/${taskId}/dependencies`, {
        depends_on_task_id: parseInt(selectedBlockerId, 10),
      });
      setDependencies({
        ...dependencies,
        blocked_by: [...dependencies.blocked_by, newDep],
      });
      setSelectedBlockerId("");
      setIsAddingBlocker(false);
      playUiSound("chime");
    } catch (err) {
      setDepError(err.message || "Failed to add blocker");
    }
  };

  const handleRemoveDependency = async (depId) => {
    try {
      await api.delete(`/tasks/${taskId}/dependencies/${depId}`);
      setDependencies({
        ...dependencies,
        blocked_by: dependencies.blocked_by.filter(
          (d) => (d.dependency_id || d.id) !== depId,
        ),
      });
      playUiSound("toggle");
    } catch (err) {
      console.error("Failed to remove dependency:", err);
    }
  };

  const availableBlockers = useMemo(() => {
    const existingBlockerIds = new Set(
      dependencies.blocked_by.map((d) => d.id || d.depends_on_task_id),
    );
    existingBlockerIds.add(parseInt(taskId, 10));
    return allWorkspaceTasks.filter((t) => !existingBlockerIds.has(t.id));
  }, [allWorkspaceTasks, dependencies.blocked_by, taskId]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-elevated text-foreground w-full max-w-[95vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] md:h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        {/* Top Header Breadcrumb Bar (Matches Linear Image 2 & 9) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 shrink-0 border-b border-border bg-surface">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center text-accent">
              <CheckSquare size={15} />
            </div>
            <div className="text-zinc-500 dark:text-[#85868a] text-[13px] sm:text-[14px] flex items-center gap-1.5 font-medium truncate">
              <span>{task?.project_name || "My issues"}</span>
              <span className="text-zinc-400 dark:text-[#55565a]">›</span>
              <span className="font-mono text-zinc-900 dark:text-[#d1d2d5] font-semibold">
                {task?.project_identifier
                  ? `${task.project_identifier}-${task.id}`
                  : `TASK-${task?.id}`}
              </span>
              <span className="truncate text-zinc-400 dark:text-[#6e737d] font-normal hidden sm:inline">
                {task?.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
              title={isStarred ? "Starred" : "Star issue"}
            >
              <Star
                size={13}
                className={isStarred ? "text-amber-400 fill-amber-400" : ""}
              />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={copiedLink ? "Link copied!" : "Copy link"}
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Link2 size={14} />}
            </button>
            <button
              type="button"
              onClick={handleDeleteTask}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body: Linear 2-Column Layout (Matching Image 2) */}
        {showSkeleton ? (
          <TaskDetailsSkeleton isModal={true} />
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Main Scrollable Area */}
            <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar px-6 sm:px-10 py-6 flex flex-col">
              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Task title"
                className="w-full bg-transparent border-none text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white focus:outline-none placeholder:text-text-muted mb-2 tracking-tight"
              />

              {/* Seamless Description Textarea */}
              <div className="mb-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  placeholder="Add description..."
                  rows={3}
                  className="w-full bg-transparent border-none text-[14px] text-zinc-700 dark:text-[#d1d2d5] focus:outline-none placeholder:text-zinc-500 dark:placeholder:text-[#6e737d] leading-relaxed resize-none"
                />
              </div>

              {/* Subtasks Section (Matching Linear Image 2) */}
              <div className="mb-6">
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

                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden my-3">
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
                  <div className="space-y-1 mt-2">
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
                              className="text-text-muted hover:text-accent transition-colors cursor-pointer shrink-0"
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
                                  ? "line-through text-text-muted"
                                  : "text-foreground font-medium"
                              }`}
                            >
                              {sub.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {sub.assignee_name && (
                              <span className="text-[11px] text-text-muted">
                                {sub.assignee_name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(sub.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-rose-500 rounded transition-opacity cursor-pointer"
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

                {isAddingSubtask && (
                  <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-3 mt-2 animate-in fade-in duration-150">
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
              </div>

              {/* Dependencies Section */}
              {dependencies.blocked_by.length > 0 && (
                <div className="mb-6 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-3.5">
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
                        <span className="text-[10px] text-text-muted">{dep.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Section (Matches Linear Image 2) */}
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-6 mb-8">
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
                    {task?.creator_name || (user?.username ? `@${user.username}` : user?.fullName) || "User"} created ·{" "}
                    {new Date(task?.created_at || Date.now()).toLocaleDateString()}
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
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[13px] text-foreground">{comment.content}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Linear-Style Comment Composer Box */}
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

            {/* Right: Properties Sidebar (Exact Linear Image 2 Layout) */}
            <div className="w-full md:w-[250px] shrink-0 border-t md:border-t-0 md:border-l border-black/[0.06] dark:border-white/[0.06] px-5 py-5 flex flex-col gap-6 text-[12.5px] bg-surface/30">
              {/* Section 1: Properties */}
              <div>
                <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5">
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

              {/* Section 2: Labels (Matches Image 2) */}
              <div>
                <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5">
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

              {/* Section 3: Project (Matches Image 2) */}
              <div>
                <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5">
                  Project
                </div>
                <div className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-lg text-zinc-700 dark:text-[#d1d2d5]">
                  <FileText size={13} className="text-zinc-400 dark:text-[#8a8f98] shrink-0" />
                  <span className="truncate">{task?.project_name || "Add to project"}</span>
                </div>
              </div>

              {/* Section 4: Due date */}
              <div>
                <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-2.5">
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
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
