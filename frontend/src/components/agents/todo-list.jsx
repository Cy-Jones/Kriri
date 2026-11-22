import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Check,
  X,
  Loader2,
  Circle,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

/**
 * TodoList component for AI Agents (beUI specification)
 * A collapsible agent task plan with morphing status marks, a completion count,
 * compact metadata, and smooth list updates.
 */
export function TodoList({
  items = [],
  title = "Agent Plan",
  open: controlledOpen,
  defaultOpen = true,
  onOpenChange,
  collapseOnComplete = true,
  maxHeight = 248,
  className,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === "completed").length;
  const isAllCompleted = totalItems > 0 && completedItems === totalItems;
  const inProgressIndex = items.findIndex((i) => i.status === "in-progress");

  // Track if we auto-collapsed on complete
  const prevAllCompleted = useRef(false);

  useEffect(() => {
    if (collapseOnComplete && isAllCompleted && !prevAllCompleted.current) {
      // Auto-collapse slightly after completion for a polished finish
      const t = setTimeout(() => {
        if (controlledOpen === undefined) {
          setInternalOpen(false);
        }
        onOpenChange?.(false);
      }, 700);
      prevAllCompleted.current = true;
      return () => clearTimeout(t);
    } else if (!isAllCompleted) {
      prevAllCompleted.current = false;
    }
  }, [isAllCompleted, collapseOnComplete, controlledOpen, onOpenChange]);

  const toggleOpen = () => {
    const next = !isOpen;
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#161618]/70 backdrop-blur-md shadow-xs transition-all overflow-hidden font-sans select-none my-2.5",
        className
      )}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0"
          >
            <ChevronDown size={14} strokeWidth={2} />
          </motion.div>

          <span className="font-medium truncate tracking-tight text-zinc-800 dark:text-zinc-200">
            {title}
          </span>
        </div>

        {/* Rolling Status / Completion Badge */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          {!isAllCompleted ? (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {completedItems}/{totalItems}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Check size={11} strokeWidth={2.5} />
              <span>Completed</span>
            </div>
          )}
        </div>
      </button>

      {/* Expandable Task List Container */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-black/[0.05] dark:border-white/[0.05]"
          >
            <div
              style={{ maxHeight: `${maxHeight}px` }}
              className="overflow-y-auto custom-scrollbar px-3.5 py-2 space-y-1.5"
            >
              {items.map((item, idx) => {
                const isCompleted = item.status === "completed";
                const isInProgress = item.status === "in-progress";
                const isCancelled = item.status === "cancelled";
                const isPending = item.status === "pending" || !item.status;

                return (
                  <motion.div
                    key={item.id || idx}
                    layout
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "flex items-center justify-between gap-2.5 py-1 px-1.5 rounded-lg text-xs transition-colors",
                      isInProgress
                        ? "bg-black/[0.03] dark:bg-white/[0.05] text-zinc-900 dark:text-zinc-100 font-medium"
                        : isCompleted
                        ? "text-zinc-500 dark:text-zinc-400"
                        : isCancelled
                        ? "text-zinc-400 dark:text-zinc-500 line-through"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Morphing Status Mark */}
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                          >
                            <Check size={9} strokeWidth={2.8} />
                          </motion.div>
                        )}

                        {isInProgress && (
                          <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.1,
                                ease: "linear",
                              }}
                              className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 border-t-zinc-900 dark:border-t-zinc-100"
                            />
                            {item.progress !== undefined && (
                              <span className="sr-only">{item.progress}%</span>
                            )}
                          </div>
                        )}

                        {isCancelled && (
                          <div className="w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                            <X size={9} strokeWidth={2.5} />
                          </div>
                        )}

                        {isPending && (
                          <div className="w-3 h-3 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700" />
                        )}
                      </div>

                      {/* Task Title */}
                      <span className="truncate">{item.title}</span>
                    </div>

                    {/* Compact Metadata / Progress Detail */}
                    {item.detail && (
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                        {item.detail}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TodoList;

