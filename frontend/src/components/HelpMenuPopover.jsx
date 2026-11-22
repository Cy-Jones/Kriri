import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Keyboard,
  Settings,
} from "lucide-react";
import { releases } from "../data/changelogData";

export default function HelpMenuPopover({
  isOpen,
  onClose,
  onOpenShortcuts,
  onOpenContact,
  onOpenChangelog,
  className = "",
}) {
  const navigate = useNavigate();
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isMac =
    typeof window !== "undefined"
      ? navigator.platform.toUpperCase().indexOf("MAC") >= 0
      : true;

  // Show the latest implemented features from the changelog
  const recentReleases = releases.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute bottom-full left-0 mb-2 w-[260px] bg-[var(--surface-floating,#1a1b1e)] border border-[var(--border,rgba(255,255,255,0.1))] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-1.5 z-50 text-[var(--foreground,#f4f4f5)] select-none backdrop-blur-md ${className}`}
        >
          {/* Main Menu Links */}
          <div className="flex flex-col space-y-[2px]">
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenContact?.();
              }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors text-left w-full group cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors flex-none" />
              <span className="flex-1 font-medium">Contact us</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenShortcuts?.();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors text-left w-full group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors flex-none" />
                <span className="font-medium">Keyboard shortcuts</span>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] font-mono tracking-tight">
                {isMac ? "⌘ /" : "Ctrl /"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                navigate("/settings");
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors text-left w-full group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors flex-none" />
                <span className="font-medium">Settings</span>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] font-mono">G then S</span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)] my-1.5" />

          {/* What's New Section */}
          <div className="px-2.5 pt-1 pb-1">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-2">
              What’s new
            </span>

            {/* Timeline */}
            <div className="relative pl-4 space-y-2.5">
              {/* Dashed connector line */}
              <div className="absolute left-[3px] top-[6px] bottom-[6px] w-[1px] border-l border-dashed border-[var(--border)]" />

              {recentReleases.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    onClose?.();
                    onOpenChangelog?.(rel.id);
                  }}
                  className="relative flex items-center text-[12px] text-[var(--foreground)] opacity-90 hover:opacity-100 transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] group-hover:bg-[var(--foreground)] transition-colors -ml-[16px] mr-2.5 ring-4 ring-[var(--surface-floating)] flex-none" />
                  <span className="truncate">{rel.shortTitle || rel.title}</span>
                </div>
              ))}

              <div
                onClick={() => {
                  onClose?.();
                  onOpenChangelog?.(null);
                }}
                className="relative flex items-center text-[12px] text-[var(--foreground)] opacity-90 hover:opacity-100 transition-colors cursor-pointer group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] group-hover:bg-[var(--foreground)] transition-colors -ml-[16px] mr-2.5 ring-4 ring-[var(--surface-floating)] flex-none" />
                <span className="truncate font-medium">Full changelog</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
