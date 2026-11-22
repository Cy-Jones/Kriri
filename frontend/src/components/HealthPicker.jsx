import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { playUiSound } from "../lib/sound";

export const HEALTH_OPTIONS = [
  { value: "On Track", color: "#22c55e", label: "On Track" },
  { value: "At Risk", color: "#f5a623", label: "At Risk" },
  { value: "Off Track", color: "#ef4444", label: "Off Track" },
];

export function getHealthIcon(health, className = "") {
  const norm = (health || "").toLowerCase();
  const color =
    norm.includes("off")
      ? "#ef4444"
      : norm.includes("risk")
      ? "#f59e0b"
      : "#22c55e";

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.75"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export default function HealthPicker({ value, onChange, onClose, align = "left" }) {
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

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const normValue = (value || "On Track").toLowerCase();
  const alignClass = align === "right" ? "right-0" : "left-0";

  const content = (
    <div
      ref={popoverRef}
      className={`${
        isMobile
          ? "bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-2xl shadow-2xl w-[260px] max-w-[calc(100vw-32px)] text-zinc-900 dark:text-white p-2 flex flex-col"
          : `absolute top-full ${alignClass} mt-2 bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-xl shadow-2xl w-[200px] z-50 text-zinc-900 dark:text-white p-1 animate-in fade-in zoom-in-95 duration-150`
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/[0.06] dark:border-[var(--border,rgba(255,255,255,0.08))] mb-1">
        <span className="text-[12px] text-zinc-500 dark:text-[#8a8f98]">Change health...</span>
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
      <div className="flex flex-col gap-0.5">
        {HEALTH_OPTIONS.map((option) => {
          const isSelected = normValue === option.value.toLowerCase();
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                playUiSound("toggle");
                onChange(option.value);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left cursor-pointer rounded-lg transition-colors ${
                isSelected
                  ? "bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                  : "hover:bg-black/5 dark:hover:bg-white/[0.05] text-zinc-700 dark:text-[#d1d2d5]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={option.color}
                  strokeWidth="2.75"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <span className="text-[13.5px] font-medium leading-none">
                  {option.label}
                </span>
              </div>
              {isSelected && (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-900 dark:text-white/80"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
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
