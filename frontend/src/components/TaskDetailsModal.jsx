import { useState, useEffect, useRef } from "react";
import {
  XSquare,
  MessageSquare,
  Send,
  Calendar,
  User,
  FileText,
  Star,
} from "lucide-react";
import { api } from "../lib/api";
import posthog from "../lib/posthog";

export default function TaskDetailsModal({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated,
}) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const statusSelectRef = useRef(null);
  const prioritySelectRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        e.target.tagName,
      );

      if (e.key === "Escape") {
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
          const formEvent = new Event("submit", {
            cancelable: true,
            bubbles: true,
          });
          handlePostComment(formEvent);
        }
        return;
      }

      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          statusSelectRef.current?.focus();
          break;
        case "p":
          e.preventDefault();
          prioritySelectRef.current?.focus();
          break;
        case "e":
        case "c":
          e.preventDefault();
          commentInputRef.current?.focus();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const taskData = await api.get(`/tasks/${taskId}`);
      setTask(taskData);
      const commentsData = await api.get(`/comments/task/${taskId}`);
      setComments(commentsData);
      posthog.capture("task_viewed", {
        task_id: taskId,
        project_id: taskData.project_id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  const handlePostComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const addedComment = await api.post("/comments", {
        task_id: taskId,
        content: newComment,
      });
      setComments([...comments, addedComment]);
      setNewComment("");
      posthog.capture("comment_added", { task_id: taskId });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (e) => {
    const newStatus = e.target.value;
    try {
      const updatedTask = await api.put(`/tasks/${taskId}`, {
        ...task,
        status: newStatus,
      });
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePriority = async (e) => {
    const newPriority = e.target.value;
    try {
      const updatedTask = await api.put(`/tasks/${taskId}`, {
        ...task,
        priority: newPriority,
      });
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-surface border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {loading
                  ? "Loading..."
                  : task?.project_identifier
                    ? `${task.project_identifier}-${task.id}`
                    : `Task #${task?.id}`}
              </h2>
              <div className="text-sm text-text-secondary">
                {task?.project_identifier
                  ? `${task.project_identifier}${task.project_name ? ` · ${task.project_name}` : ""}`
                  : `Project #${task?.project_id}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            <XSquare size={20} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-8 text-center text-text-secondary">
            Loading details...
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden relative">
            {/* Left side: Main Content */}
            <div className="flex-1 md:border-r border-b md:border-b-0 border-border flex flex-col overflow-y-visible md:overflow-y-auto">
              <div className="p-4 sm:p-6 pb-24">
                <h1 className="text-xl font-semibold text-text-primary mb-4">
                  {task?.title}
                </h1>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    Description
                  </h3>
                  <div className="text-[13px] text-text-secondary bg-surface-elevated p-4 rounded-lg min-h-[100px] whitespace-pre-wrap">
                    {task?.description || "No description provided."}
                  </div>
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
                    <MessageSquare size={16} /> Activity & Comments
                  </h3>

                  <div className="space-y-4 mb-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex flex-shrink-0 items-center justify-center text-accent text-xs font-bold">
                          {comment.user_name?.charAt(0)}
                        </div>
                        <div className="flex-1 bg-surface-elevated p-3 rounded-lg rounded-tl-none">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-medium text-text-primary">
                              {comment.user_name}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[13px] text-text-secondary">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-[13px] text-text-muted text-center py-4">
                        No comments yet. Be the first to start the discussion!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Properties */}
            <div className="w-full md:w-[280px] bg-surface-elevated flex-shrink-0 flex flex-col">
              <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
                    Status
                  </label>
                  <select
                    ref={statusSelectRef}
                    value={task?.status}
                    onChange={handleUpdateStatus}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
                    Priority
                  </label>
                  <select
                    ref={prioritySelectRef}
                    value={task?.priority}
                    onChange={handleUpdatePriority}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
                    Assignee
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded bg-surface border border-border">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                      {task?.assignee_name ? task.assignee_name.charAt(0) : "?"}
                    </div>
                    <span className="text-[13px] text-text-primary">
                      {task?.assignee_name || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
                    Due Date
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded bg-surface border border-border text-text-primary text-[13px]">
                    <Calendar size={14} />
                    {task?.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "No due date"}
                  </div>
                </div>
              </div>
            </div>

            {/* Comment Input Sticky at Bottom of Left Area */}
            <div className="md:absolute md:bottom-0 md:left-0 md:w-[calc(100%-280px)] border-t border-border bg-surface p-4">
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-surface-elevated border border-border rounded-lg px-4 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-accent hover:bg-accent-hover text-white px-3.5 h-8 rounded-full transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
