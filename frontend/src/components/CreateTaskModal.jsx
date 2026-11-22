import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import posthog from "../lib/posthog";
import { playUiSound } from "../lib/sound";
import { X, Tag, Sparkles, RefreshCw } from "lucide-react";
import { getStatusIcon } from "./StatusPicker";
import { getPriorityIcon } from "./PriorityPicker";

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  initialProjectId,
  initialStatus,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(initialStatus || "Todo");
  const [priority, setPriority] = useState("Medium");
  const [createMore, setCreateMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(initialProjectId || "");

  // AI Task Generation State
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setStatus(initialStatus || "Todo");
      setPriority("Medium");

      api
        .get("/projects")
        .then((data) => {
          setProjects(data);
          if (data.length > 0 && !projectId) {
            setProjectId(initialProjectId || data[0].id);
          }
        })
        .catch((err) => console.error("Failed to fetch projects", err));
    }
  }, [isOpen, initialProjectId, initialStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setLoading(true);
    try {
      const newTask = await api.post("/tasks", {
        title,
        description,
        status,
        priority,
        project_id: projectId,
      });
      if (onTaskCreated) onTaskCreated(newTask);
      playUiSound("success");
      posthog.capture("task_created", { project_id: projectId });

      if (createMore) {
        setTitle("");
        setDescription("");
      } else {
        setTitle("");
        setDescription("");
        setStatus("Todo");
        setPriority("Medium");
        onClose();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/tasks/generate", {
        prompt: aiPrompt,
        project_id: projectId,
      });

      if (res.proposal) {
        setTitle(res.proposal.title || "");
        let desc = res.proposal.description || "";
        if (res.proposal.subtasks && res.proposal.subtasks.length > 0) {
          desc += "\n\n### Subtasks\n" + res.proposal.subtasks.map((s) => `- [ ] ${s}`).join("\n");
        }
        if (res.proposal.acceptance_criteria && res.proposal.acceptance_criteria.length > 0) {
          desc += "\n\n### Acceptance Criteria\n" + res.proposal.acceptance_criteria.map((c) => `- [ ] ${c}`).join("\n");
        }
        setDescription(desc);
        if (res.proposal.priority) {
          setPriority(res.proposal.priority);
        }
        setShowAiPrompt(false);
        setAiPrompt("");
        playUiSound("chime");
      }
    } catch (err) {
      console.error("AI Task Generation error:", err);
    } finally {
      setAiLoading(false);
    }
  };



  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[95vw] sm:max-w-[700px] md:max-w-3xl lg:max-w-4xl rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden bg-surface-elevated text-foreground border border-border">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Top Bar */}
          <div className="px-4 py-3 flex items-center justify-between min-w-0 border-b border-black/[0.06] dark:border-white/[0.04]">
            <div className="flex items-center gap-2 text-[12.5px] sm:text-[13px] text-zinc-700 dark:text-text-secondary min-w-0 max-w-[calc(100%-48px)]">
              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors text-zinc-800 dark:text-text-secondary focus:outline-none truncate max-w-full text-ellipsis border border-black/5 dark:border-white/5"
              >
                {projects.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-white dark:bg-[var(--surface-elevated,#1e1f21)] text-zinc-900 dark:text-white"
                  >
                    {p.identifier ? `${p.identifier} — ${p.name}` : p.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAiPrompt((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors border ${
                  showAiPrompt
                    ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                    : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 border-black/5 dark:border-white/5"
                }`}
                title="Generate task with AI"
              >
                <Sparkles size={12} className="text-indigo-400" />
                <span>AI Generate</span>
              </button>
            </div>
            <div className="flex items-center gap-1 text-zinc-400 dark:text-text-muted shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-900 dark:text-text-muted dark:hover:text-white transition-colors rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* AI Prompt Input Bar */}
          {showAiPrompt && (
            <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border-b border-indigo-500/15 flex flex-col gap-2 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Describe what you want to achieve:
                </span>
                <span className="text-[10px] opacity-75">Auto-generates title, subtasks & acceptance criteria</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Implement OAuth2 login with JWT rotation, password reset, and session tests"
                  className="flex-1 bg-white dark:bg-[var(--surface,#1a1b1e)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.1))] rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleGenerateWithAi();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerateWithAi}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="px-5 sm:px-6 py-4 flex flex-col gap-2.5">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="w-full bg-transparent text-[18px] sm:text-[22px] font-semibold text-zinc-900 dark:text-white placeholder:text-text-muted focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full bg-transparent text-[13.5px] sm:text-[14.5px] text-zinc-800 dark:text-white placeholder:text-text-muted focus:outline-none resize-none min-h-[140px] sm:min-h-[170px]"
            />
          </div>

          {/* Bottom Bar */}
          <div className="px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-black/[0.06] dark:border-[var(--border-subtle,rgba(255,255,255,0.05))] mt-1 bg-zinc-50/80 dark:bg-[var(--surface,#1a1b1e)]/50">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0 max-w-full">
              {/* Status button */}
              <button
                type="button"
                onClick={() => {
                  const statuses = ["Backlog", "Todo", "In Progress", "Done", "Canceled"];
                  const next = statuses[(statuses.indexOf(status) + 1) % statuses.length];
                  setStatus(next);
                }}
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors text-[11.5px] text-foreground shrink-0 whitespace-nowrap cursor-pointer shadow-2xs"
                title="Click to cycle status"
              >
                {getStatusIcon(status)}
                <span>{status}</span>
              </button>

              {/* Priority button */}
              <button
                type="button"
                onClick={() => {
                  const priorities = ["No priority", "Low", "Medium", "High", "Urgent"];
                  const next = priorities[(priorities.indexOf(priority) + 1) % priorities.length];
                  setPriority(next);
                }}
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors text-[11.5px] text-foreground shrink-0 whitespace-nowrap cursor-pointer shadow-2xs"
                title="Click to cycle priority"
              >
                {getPriorityIcon(priority)}
                <span>{priority === "No priority" ? "Priority" : priority}</span>
              </button>

              {/* Assignee button */}
              <button
                type="button"
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors text-[11.5px] text-foreground shrink-0 whitespace-nowrap shadow-2xs"
              >
                <div className="w-[14px] h-[14px] rounded-full bg-[#f54868] flex items-center justify-center text-white text-[7px] font-bold tracking-tighter shrink-0">
                  CY
                </div>
                <span>cyruskjones</span>
              </button>

              {/* Labels button */}
              <button
                type="button"
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors text-[11.5px] text-foreground shrink-0 whitespace-nowrap shadow-2xs"
              >
                <Tag size={12} className="opacity-70 shrink-0" />
                <span>Labels</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/[0.06] dark:border-white/[0.04]">
              <label className="flex items-center gap-2 cursor-pointer group shrink-0">
                <div
                  className={`relative w-[28px] h-[16px] rounded-full transition-colors ${createMore ? "bg-accent" : "bg-black/15 dark:bg-white/20"}`}
                >
                  <div
                    className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] bg-white rounded-full transition-transform ${createMore ? "translate-x-[12px]" : "translate-x-0"}`}
                  />
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={createMore}
                  onChange={(e) => setCreateMore(e.target.checked)}
                />
                <span className="text-[12px] text-zinc-500 dark:text-text-muted group-hover:text-zinc-800 dark:group-hover:text-text-secondary transition-colors select-none whitespace-nowrap">
                  Create more
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="kriri-primary-btn h-[28px] px-4 rounded-full font-medium text-[12.5px] disabled:opacity-50 transition-all duration-300 shadow-sm active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                {loading ? "Creating..." : "Create issue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
