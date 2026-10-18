import { useState, useEffect } from "react";
import { api } from "../lib/api";
import posthog from "../lib/posthog";
import { X, Tag } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[95vw] sm:max-w-[700px] md:max-w-3xl lg:max-w-4xl rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
        style={{
          backgroundColor: "#212226",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Top Bar */}
          <div className="px-4 py-3 flex items-center justify-between min-w-0 border-b border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[12.5px] sm:text-[13px] text-text-secondary min-w-0 max-w-[calc(100%-48px)]">
              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                className="bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors text-text-secondary focus:outline-none truncate max-w-full text-ellipsis"
              >
                {projects.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-[#212226] text-white"
                  >
                    {p.identifier ? `${p.identifier} — ${p.name}` : p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 text-text-muted shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:text-white transition-colors rounded-md hover:bg-white/[0.06]"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="px-5 sm:px-6 py-4 flex flex-col gap-2.5">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="w-full bg-transparent text-[18px] sm:text-[22px] font-semibold text-white placeholder:text-text-muted focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full bg-transparent text-[13.5px] sm:text-[14.5px] text-white placeholder:text-text-muted focus:outline-none resize-none min-h-[140px] sm:min-h-[170px]"
            />
          </div>

          {/* Bottom Bar */}
          <div className="px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/5 mt-1 bg-[#1a1b1e]/50">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0 max-w-full">
              {/* Status button */}
              <button
                type="button"
                onClick={() => {
                  const statuses = ["Backlog", "Todo", "In Progress", "Done", "Canceled"];
                  const next = statuses[(statuses.indexOf(status) + 1) % statuses.length];
                  setStatus(next);
                }}
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors text-[11.5px] text-text-secondary bg-white/[0.02] shrink-0 whitespace-nowrap cursor-pointer"
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
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors text-[11.5px] text-text-secondary bg-white/[0.02] shrink-0 whitespace-nowrap cursor-pointer"
                title="Click to cycle priority"
              >
                {getPriorityIcon(priority)}
                <span>{priority === "No priority" ? "Priority" : priority}</span>
              </button>

              {/* Assignee button */}
              <button
                type="button"
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors text-[11.5px] text-text-primary bg-white/[0.02] shrink-0 whitespace-nowrap"
              >
                <div className="w-[14px] h-[14px] rounded-full bg-[#f54868] flex items-center justify-center text-white text-[7px] font-bold tracking-tighter shrink-0">
                  CY
                </div>
                <span>cyruskjones</span>
              </button>

              {/* Labels button */}
              <button
                type="button"
                className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors text-[11.5px] text-text-secondary bg-white/[0.02] shrink-0 whitespace-nowrap"
              >
                <Tag size={12} className="opacity-70 shrink-0" />
                <span>Labels</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
              <label className="flex items-center gap-2 cursor-pointer group shrink-0">
                <div
                  className={`relative w-[28px] h-[16px] rounded-full transition-colors ${createMore ? "bg-accent" : "bg-white/20"}`}
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
                <span className="text-[12px] text-text-muted group-hover:text-text-secondary transition-colors select-none whitespace-nowrap">
                  Create more
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="h-[28px] px-4 rounded-full font-medium text-[12.5px] bg-white text-black hover:bg-zinc-100 disabled:opacity-50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.14)] hover:shadow-[0_0_28px_rgba(255,255,255,0.22)] active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                {loading ? "Creating..." : "Create issue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
