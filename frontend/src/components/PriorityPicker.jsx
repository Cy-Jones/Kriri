import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { playUiSound } from "../lib/sound";

const PRIORITY_OPTIONS = [
  { value: "No priority", number: 0, label: "No priority" },
  { value: "Urgent", number: 1, label: "Urgent" },
  { value: "High", number: 2, label: "High" },
  { value: "Medium", number: 3, label: "Medium" },
  { value: "Low", number: 4, label: "Low" },
];

export function getPriorityIcon(priority) {
  const norm = (priority || "").toLowerCase().trim();
  if (norm === "urgent") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#e27a4a] shrink-0"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
        <path d="M12 8v4"></path>
        <path d="M12 16h.01"></path>
      </svg>
    );
  } else if (norm === "high") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground shrink-0"
      >
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
        <path d="M12 20v-8"></path>
        <path d="M17 20V8"></path>
        <path d="M22 4v16"></path>
      </svg>
    );
  } else if (norm === "medium") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/75 shrink-0"
      >
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
        <path d="M12 20v-8"></path>
      </svg>
    );
  } else if (norm === "low") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/50 shrink-0"
      >
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
      </svg>
    );
  } else {
    // No priority - Three horizontal dots (Matches Linear Image 7)
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-foreground/40 shrink-0"
      >
        <circle cx="5" cy="12" r="2.2" />
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="19" cy="12" r="2.2" />
      </svg>
    );
  }
}

export default function PriorityPicker({ value, onChange, onClose, align = "left" }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Keyboard shortcut listener for 0, 1, 2, 3, 4 and Escape (Linear Image 7)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        const match = PRIORITY_OPTIONS.find((opt) => opt.number === num);
        if (match) {
          e.preventDefault();
          playUiSound("toggle");
          onChange(match.value);
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange, onClose]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const alignClass = align === "right" ? "right-0" : "left-0";

  const content = (
    <div
      ref={popoverRef}
      className={`${
        isMobile
          ? "bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-2xl shadow-2xl w-[260px] max-w-[calc(100vw-32px)] text-zinc-900 dark:text-white p-1.5 flex flex-col"
          : `absolute top-full ${alignClass} mt-2 bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-xl shadow-2xl w-[220px] z-50 text-zinc-900 dark:text-white py-1`
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/[0.06] dark:border-[var(--border,rgba(255,255,255,0.08))] mb-1">
        <span className="text-[12px] font-medium text-zinc-500 dark:text-[#8a8f98]">
          Set priority to...
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-zinc-400 bg-black/[0.06] dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 font-semibold">
            P
          </span>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white p-0.5 rounded transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col p-0.5">
        {PRIORITY_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <div
              key={option.value}
              onClick={() => {
                playUiSound("toggle");
                onChange(option.value);
                onClose();
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-md transition-colors m-0.5 select-none ${
                isSelected ? "bg-black/[0.04] dark:bg-white/[0.04]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                {getPriorityIcon(option.value)}
                <span className="text-[13px] text-zinc-800 dark:text-[#d1d2d5]">
                  {option.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isSelected && (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-900 dark:text-[#d1d2d5]"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className="font-mono text-[11px] text-zinc-400 dark:text-[#8a8f98]">
                  {option.number}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-150">
        {content}
      </div>,
      document.body
    );
  }

  return content;
}
