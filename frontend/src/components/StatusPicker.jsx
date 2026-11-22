import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { playUiSound } from "../lib/sound";

const STATUS_OPTIONS = [
  { value: "Backlog", number: 1 },
  { value: "Todo", number: 2 },
  { value: "In Progress", number: 3 },
  { value: "In Review", number: 4 },
  { value: "Done", number: 5 },
  { value: "Canceled", number: 6 },
];

export function getStatusIcon(status) {
  const norm = (status || "").toLowerCase().trim();
  switch (norm) {
    case "backlog":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-foreground/50 shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "todo":
    case "to do":
    case "planned":
    case "planning":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-foreground/75 shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "in progress":
    case "active":
    case "in-progress":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#f5a623] shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M7 1.5 A 5.5 5.5 0 0 0 7 12.5 Z" fill="currentColor" />
        </svg>
      );
    case "in review":
    case "review":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#3b82f6] shrink-0"
        >
          <path
            d="M2.5 3A1.5 1.5 0 0 1 4 1.5h4.25L11.5 4.75V11A1.5 1.5 0 0 1 10 12.5H4A1.5 1.5 0 0 1 2.5 11V3Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M8 1.5V5h3.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "completed":
    case "done":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#5e6ad2] shrink-0"
        >
          <circle cx="7" cy="7" r="6" fill="currentColor" />
          <path
            d="M4.5 7L6.5 9L10 4.5"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "canceled":
    case "cancelled":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-foreground/50 shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-foreground/75 shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
  }
}

export default function StatusPicker({ value, onChange, onClose, align = "left", options }) {
  const popoverRef = useRef(null);
  const statusOptions = options || STATUS_OPTIONS;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Keyboard shortcut listener for 1..6 and Escape (Linear Image 10)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        const match = statusOptions.find((opt, idx) => (opt.number ? opt.number === num : idx + 1 === num));
        if (match) {
          e.preventDefault();
          if (match.value === "Completed" || match.value === "Done") {
            playUiSound("success");
          } else {
            playUiSound("toggle");
          }
          onChange(match.value);
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange, onClose, statusOptions]);

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
          Change status...
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-zinc-400 bg-black/[0.06] dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 font-semibold">
            S
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
        {statusOptions.map((option, idx) => {
          const isSelected = value === option.value || (value === "Todo" && option.value === "Planned") || (value === "Done" && option.value === "Completed");
          const optNumber = option.number || idx + 1;
          return (
            <div
              key={option.value}
              onClick={() => {
                if (option.value === "Completed" || option.value === "Done") {
                  playUiSound("success");
                } else {
                  playUiSound("toggle");
                }
                onChange(option.value);
                onClose();
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-md transition-colors m-0.5 select-none ${
                isSelected ? "bg-black/[0.04] dark:bg-white/[0.04]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                {getStatusIcon(option.value)}
                <span className="text-[13px] text-zinc-800 dark:text-[#d1d2d5]">
                  {option.value}
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
                  {optNumber}
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
