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
          className={`absolute bottom-full left-0 mb-2 w-[260px] bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-1.5 z-50 text-zinc-900 dark:text-[#f4f4f5] select-none ${className}`}
        >
          {/* Main Menu Links */}
          <div className="flex flex-col space-y-[2px]">
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenContact?.();
              }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-zinc-800 hover:text-zinc-900 hover:bg-black/5 dark:text-[#e8e8e8] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors text-left w-full group"
            >
              <MessageSquare className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:text-[#8a8f98] dark:group-hover:text-white transition-colors flex-none" />
              <span className="flex-1">Contact us</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenShortcuts?.();
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-zinc-800 hover:text-zinc-900 hover:bg-black/5 dark:text-[#e8e8e8] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors text-left w-full group"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:text-[#8a8f98] dark:group-hover:text-white transition-colors flex-none" />
                <span>Keyboard shortcuts</span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-[#8a8f98] font-mono tracking-tight">
                {isMac ? "⌘ /" : "Ctrl /"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                navigate("/settings");
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-zinc-800 hover:text-zinc-900 hover:bg-black/5 dark:text-[#e8e8e8] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors text-left w-full group"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:text-[#8a8f98] dark:group-hover:text-white transition-colors flex-none" />
                <span>Settings</span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-[#8a8f98]">G then S</span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-black/10 dark:border-white/[0.08] my-1.5" />

          {/* What's New Section */}
          <div className="px-2.5 pt-1 pb-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-[#8a8f98] block mb-2">
              What’s new
            </span>

            {/* Timeline */}
            <div className="relative pl-4 space-y-2.5">
              {/* Dashed connector line */}
              <div className="absolute left-[3px] top-[6px] bottom-[6px] w-[1px] border-l border-dashed border-black/20 dark:border-white/20" />

              {recentReleases.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    onClose?.();
                    onOpenChangelog?.(rel.id);
                  }}
                  className="relative flex items-center text-[12px] text-zinc-700 hover:text-zinc-900 dark:text-[#d1d2d5] dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-zinc-900 dark:bg-[#8a8f98] dark:group-hover:bg-white transition-colors -ml-[16px] mr-2.5 ring-4 ring-white dark:ring-[#1a1b1e] flex-none" />
                  <span className="truncate">{rel.shortTitle || rel.title}</span>
                </div>
              ))}

              <div
                onClick={() => {
                  onClose?.();
                  onOpenChangelog?.(null);
                }}
                className="relative flex items-center text-[12px] text-zinc-700 hover:text-zinc-900 dark:text-[#d1d2d5] dark:hover:text-white transition-colors cursor-pointer group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-zinc-900 dark:bg-[#8a8f98] dark:group-hover:bg-white transition-colors -ml-[16px] mr-2.5 ring-4 ring-white dark:ring-[#1a1b1e] flex-none" />
                <span className="truncate font-medium">Full changelog</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
