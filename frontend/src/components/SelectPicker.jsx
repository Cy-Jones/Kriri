import { useRef, useEffect } from "react";

export default function LinearSelectPicker({
  value,
  onChange,
  onClose,
  options,
  width = "w-[180px]",
}) {
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
      className={`absolute top-full left-0 mt-2 bg-[#25272a] border border-[#333538] rounded-xl shadow-2xl ${width} z-50 text-white overflow-hidden py-1`}
    >
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => {
            onChange(option.value);
            onClose();
          }}
          className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.06] transition-colors ${
            value === option.value ? "bg-white/[0.04]" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            {option.icon}
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
