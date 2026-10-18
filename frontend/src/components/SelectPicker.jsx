import { useState, useRef, useEffect } from "react";

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

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const content = (
    <div
      ref={popoverRef}
      className={`${
        isMobile
          ? "bg-[#25272a] border border-[#333538] rounded-2xl shadow-2xl w-[240px] max-w-[calc(100vw-32px)] text-white p-1.5 flex flex-col"
          : `absolute top-full left-0 mt-2 bg-[#25272a] border border-[#333538] rounded-xl shadow-2xl ${width} z-50 text-white overflow-hidden py-1`
      }`}
    >
      {isMobile && (
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#333538] mb-1">
          <span className="text-[12px] font-medium text-[#8a8f98]">Select health</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a8f98] hover:text-white p-0.5 rounded transition-colors"
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
        </div>
      )}
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => {
            onChange(option.value);
            onClose();
          }}
          className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.06] rounded-md transition-colors ${
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

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-150">
        {content}
      </div>
    );
  }

  return content;
}
