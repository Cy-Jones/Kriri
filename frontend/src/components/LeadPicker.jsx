import { useState, useRef, useEffect } from "react";

export default function LeadPicker({
  onClose,
  onChange,
  value,
  availableMembers = [],
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

  const handleSelect = (lead) => {
    if (onChange) onChange(lead);
    onClose();
  };

  const getInitial = (name, email) => {
    if (name) return name[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

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
          ? "bg-white dark:bg-[#1e1f21] border border-black/10 dark:border-[#333538] rounded-2xl shadow-2xl w-[280px] max-w-[calc(100vw-32px)] text-zinc-900 dark:text-white text-[12.5px] flex flex-col p-2"
          : "absolute top-full right-0 mt-2 bg-white dark:bg-[#1e1f21] border border-black/10 dark:border-[#333538] rounded-xl shadow-2xl w-[260px] max-h-[300px] overflow-y-auto z-50 text-zinc-900 dark:text-white text-[13px] flex flex-col p-1.5 custom-scrollbar"
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/[0.06] dark:border-[#333538] mb-2">
        <span className="text-[12px] font-medium text-zinc-500 dark:text-[#8a8f98]">Assign project lead</span>
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

      {/* Current Lead / Unassigned */}
      <div
        onClick={() => handleSelect(null)}
        className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer transition-colors mb-2"
      >
        <div className="w-4 h-4 bg-[#5e6ad2] rounded flex items-center justify-center flex-shrink-0">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {value?.avatar_url ? (
          <img
            src={value.avatar_url}
            alt={value.name}
            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[9px] font-medium flex-shrink-0">
            {value ? getInitial(value.name, value.email) : "U"}
          </div>
        )}
        <span className="text-zinc-900 dark:text-[#e8e8e8] font-medium truncate">
          {value ? value.name || value.email?.split("@")[0] : "Unassigned"}
        </span>
        <span className="text-zinc-500 dark:text-[#8a8f98] ml-auto text-[11.5px]">Project lead</span>
      </div>

      <div className="px-2 pt-1 pb-1.5 text-[12px] font-medium text-zinc-500 dark:text-[#8a8f98]">
        Assign user
      </div>

      <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[220px] custom-scrollbar">
        {availableMembers.length === 0 && (
          <div className="p-2 text-zinc-400 dark:text-[#8a8f98] text-center italic text-[12px]">
            No members found.
          </div>
        )}

        {availableMembers.map((member) => {
          const displayName =
            member.name || member.email?.split("@")[0] || "User";
          const initial = getInitial(member.name, member.email);
          return (
            <div
              key={member.id}
              onClick={() => handleSelect(member)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[9px] font-medium">
                  {initial}
                </div>
              )}
              <span className="text-zinc-800 dark:text-[#d1d2d5] truncate">{displayName}</span>
            </div>
          );
        })}
      </div>
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
