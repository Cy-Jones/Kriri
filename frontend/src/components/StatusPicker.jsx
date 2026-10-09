import { useRef, useEffect } from "react";

const STATUS_OPTIONS = [
  { value: "Backlog", number: 1 },
  { value: "Planned", number: 2 },
  { value: "In Progress", number: 3 },
  { value: "Completed", number: 4 },
  { value: "Canceled", number: 5 },
];

export function getStatusIcon(status) {
  switch (status) {
    case "Backlog":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#85868a]"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "Planned":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#a1a1aa]"
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
    case "In Progress":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#f5a623]"
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
    case "Completed":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#5e6ad2]"
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
    case "Canceled":
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-[#85868a]"
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
      return null;
  }
}

export default function LinearStatusPicker({ value, onChange, onClose }) {
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

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl w-[240px] z-50 text-white py-1"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333538] mb-1">
        <span className="text-[12px] text-[#8a8f98]">Change status...</span>
      </div>
      {STATUS_OPTIONS.map((option) => (
        <div
          key={option.value}
          onClick={() => {
            onChange(option.value);
            onClose();
          }}
          className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.06] rounded-md transition-colors m-1 ${
            value === option.value ? "bg-white/[0.04]" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            {getStatusIcon(option.value)}
            <span className="text-[13px] text-[#d1d2d5]">{option.value}</span>
          </div>
          <div className="flex items-center gap-2">
            {value === option.value && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#d1d2d5]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
