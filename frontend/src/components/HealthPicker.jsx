import { useRef, useEffect } from "react";

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

export default function HealthPicker({ value, onChange, onClose }) {
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

  const normValue = (value || "On Track").toLowerCase();

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 bg-white dark:bg-[#1c1d22] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl w-[200px] z-50 text-zinc-900 dark:text-white p-1 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex flex-col gap-0.5">
        {HEALTH_OPTIONS.map((option) => {
          const isSelected = normValue === option.value.toLowerCase();
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
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
}
