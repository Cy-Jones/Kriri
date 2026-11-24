import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Link2, AlertCircle, X, Check, Loader2 } from "lucide-react";
import { dataStore } from "../lib/dataStore";
import { playUiSound } from "../lib/sound";
import { getStatusIcon } from "./StatusPicker";
import { getPriorityIcon } from "./PriorityPicker";

export default function DependencyPicker({
  isOpen,
  onClose,
  currentTaskId,
  existingDependencyIds = new Set(),
  onAddDependency,
  align = "left",
  title = "Add blocking task",
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setError("");
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Filter available tasks from dataStore
  const candidateTasks = useMemo(() => {
    const allTasks = dataStore.getTasksSnapshot();
    const currentIdStr = String(currentTaskId);
    const query = search.trim().toLowerCase();

    return allTasks
      .filter((t) => {
        if (!t || String(t.id) === currentIdStr) return false;
        if (existingDependencyIds.has(t.id) || existingDependencyIds.has(String(t.id))) return false;

        if (!query) return true;

        const titleMatch = (t.title || "").toLowerCase().includes(query);
        const idMatch = String(t.id).includes(query);
        const identMatch = (t.project_identifier || "").toLowerCase().includes(query);
        const fullIdent = `${t.project_identifier || ""}-${t.id}`.toLowerCase();
        return titleMatch || idMatch || identMatch || fullIdent.includes(query);
      })
      .slice(0, 30); // 30 items max for 120Hz snappy rendering
  }, [search, currentTaskId, existingDependencyIds]);

  // Reset selected index when candidateTasks change
  useEffect(() => {
    setSelectedIndex(0);
  }, [candidateTasks.length, search]);

  // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          candidateTasks.length > 0 ? (prev + 1) % candidateTasks.length : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          candidateTasks.length > 0
            ? (prev - 1 + candidateTasks.length) % candidateTasks.length
            : 0
        );
        return;
      }
      if (e.key === "Enter" && candidateTasks[selectedIndex]) {
        e.preventDefault();
        handleSelect(candidateTasks[selectedIndex]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, candidateTasks, selectedIndex, onClose]);

  const handleSelect = async (task) => {
    if (isSubmitting || !task) return;
    setError("");
    setIsSubmitting(true);
    playUiSound("toggle");

    try {
      await onAddDependency(task.id);
      playUiSound("chime");
      onClose();
    } catch (err) {
      playUiSound("toggle");
      const errMsg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to add dependency link";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`absolute top-[calc(100%+6px)] ${
        align === "right" ? "right-0" : "left-0"
      } z-50 w-[320px] sm:w-[380px] bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[380px]`}
      onClick={(e) => e.stopPropagation()}
      data-testid="dependency-combobox"
    >
      {/* Header & Search Input */}
      <div className="p-2.5 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#8a8f98] uppercase tracking-wider">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        <div className="relative flex items-center">
          <Search
            size={13}
            className="absolute left-2.5 text-zinc-400 dark:text-[#8a8f98] pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID, or KRI-..."
            className="w-full pl-8 pr-7 py-1.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] focus:border-accent dark:focus:border-accent rounded-lg text-[12px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#6e737d] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Cycle Detection / API Error Banner */}
      {error && (
        <div
          className="mx-2.5 mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] flex items-start gap-1.5 animate-in fade-in duration-100"
          data-testid="dependency-error-banner"
        >
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <div className="leading-tight flex-1">{error}</div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5 max-h-[260px]">
        {candidateTasks.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-zinc-400 dark:text-[#8a8f98]">
            {search ? "No matching tasks found" : "No available tasks to link"}
          </div>
        ) : (
          candidateTasks.map((task, idx) => {
            const isHighlighted = idx === selectedIndex;
            const fullIdent = task.project_identifier
              ? `${task.project_identifier}-${task.id}`
              : `#${task.id}`;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => handleSelect(task)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer ${
                  isHighlighted
                    ? "bg-black/[0.06] dark:bg-white/[0.08] text-zinc-900 dark:text-white"
                    : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-zinc-700 dark:text-[#d1d2d5]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">
                    {getStatusIcon(task.status)}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400 dark:text-[#8a8f98] shrink-0">
                    {fullIdent}
                  </span>
                  <span className="truncate font-medium">{task.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="shrink-0">
                    {getPriorityIcon(task.priority || "No priority")}
                  </span>
                  {isSubmitting && isHighlighted && (
                    <Loader2 size={12} className="animate-spin text-accent" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
