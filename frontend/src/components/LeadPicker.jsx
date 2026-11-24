import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { playUiSound } from "../lib/sound";

export default function LeadPicker({
  onClose,
  onChange,
  onSelect,
  value,
  currentLead,
  availableMembers = [],
  align = "left",
  title = "Assign to...",
  emptyLabel = "No assignee",
  roleLabel = "",
}) {
  const popoverRef = useRef(null);
  const activeLead = value !== undefined ? value : currentLead;

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Keyboard shortcut listener for 0, 1, 2... and Escape (Linear Image 3)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        handleSelect(null);
        return;
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= availableMembers.length) {
        e.preventDefault();
        handleSelect(availableMembers[num - 1]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [availableMembers, onClose]);

  const handleSelect = (lead) => {
    playUiSound("toggle");
    if (onChange) onChange(lead);
    if (onSelect) onSelect(lead);
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

  const alignClass = align === "right" ? "right-0" : "left-0";

  const isNoneSelected = !activeLead || (!activeLead.id && !activeLead.name && !activeLead.email);

  const content = (
    <div
      ref={popoverRef}
      className={`${
        isMobile
          ? "bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-2xl shadow-2xl w-[280px] max-w-[calc(100vw-32px)] text-zinc-900 dark:text-white text-[12.5px] flex flex-col p-1.5"
          : `absolute top-full ${alignClass} mt-2 bg-white dark:bg-[var(--surface-elevated,#1e1f21)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-xl shadow-2xl w-[260px] max-h-[340px] z-50 text-zinc-900 dark:text-white text-[13px] flex flex-col p-1 custom-scrollbar`
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/[0.06] dark:border-[var(--border,rgba(255,255,255,0.08))] mb-1">
        <span className="text-[12px] font-medium text-zinc-500 dark:text-[#8a8f98]">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-zinc-400 bg-black/[0.06] dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 font-semibold">
            A
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
        {/* No assignee / Unassigned option (Linear Image 3) */}
        <div
          onClick={() => handleSelect(null)}
          className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-md transition-colors m-0.5 select-none ${
            isNoneSelected ? "bg-black/[0.04] dark:bg-white/[0.04]" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full border border-dashed border-zinc-400/50 dark:border-zinc-600 flex items-center justify-center text-zinc-400 dark:text-[#8a8f98]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-[13px] text-zinc-800 dark:text-[#d1d2d5]">
              {emptyLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isNoneSelected && (
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
              0
            </span>
          </div>
        </div>

        {/* Member options with index number (Linear Image 3) */}
        {availableMembers.map((member, idx) => {
          const displayName =
            member.name || member.email?.split("@")[0] || "User";
          const initial = getInitial(member.name, member.email);
          const isSelected = Boolean(
            activeLead &&
              (
                (activeLead.id != null && member.id != null && String(activeLead.id) === String(member.id)) ||
                (!activeLead.id && activeLead.clerk_user_id && member.clerk_user_id && activeLead.clerk_user_id === member.clerk_user_id) ||
                (!activeLead.id && !activeLead.clerk_user_id && activeLead.email && member.email && activeLead.email.toLowerCase() === member.email.toLowerCase()) ||
                (!activeLead.id && !activeLead.clerk_user_id && !activeLead.email && activeLead.username && member.username && activeLead.username.toLowerCase() === member.username.toLowerCase()) ||
                (!activeLead.id && !activeLead.clerk_user_id && !activeLead.email && !activeLead.username && activeLead.name && activeLead.name === displayName)
              )
          );
          const shortcutNum = idx + 1;

          return (
            <div
              key={member.id}
              onClick={() => handleSelect(member)}
              className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-md transition-colors m-0.5 select-none ${
                isSelected ? "bg-black/[0.04] dark:bg-white/[0.04]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[9px] font-medium shrink-0">
                    {initial}
                  </div>
                )}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-[13px] text-zinc-800 dark:text-[#d1d2d5] truncate font-medium">
                    {displayName}
                  </span>
                  {(member.username || member.email) && (
                    <span className="text-[10.5px] text-zinc-400 dark:text-[#8a8f98] truncate">
                      {member.username ? `@${member.username.replace(/^@/, "")}` : member.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
                  {shortcutNum}
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
