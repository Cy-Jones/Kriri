import { useRef, useEffect } from "react";

export default function LinearLeadPicker({
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

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl w-[260px] max-h-[300px] overflow-y-auto z-50 text-white text-[13px] flex flex-col p-1.5 custom-scrollbar"
    >
      {/* Current Lead */}
      <div
        onClick={() => handleSelect(null)}
        className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.08] cursor-pointer transition-colors mb-2"
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
        <span className="text-[#e8e8e8] font-medium truncate">
          {value ? value.name || value.email?.split("@")[0] : "Unassigned"}
        </span>
        <span className="text-[#8a8f98] ml-auto text-[12px]">Project lead</span>
      </div>

      <div className="px-2 pt-1 pb-2 text-[13px] font-medium text-[#8a8f98]">
        Assign user
      </div>

      {availableMembers.length === 0 && (
        <div className="p-2 text-[#8a8f98] text-center italic">
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
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
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
            <span className="text-[#d1d2d5] truncate">{displayName}</span>
          </div>
        );
      })}
    </div>
  );
}
