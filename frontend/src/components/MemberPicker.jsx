import { useState, useRef, useEffect } from "react";

export default function LinearMemberPicker({
  onClose,
  onSelect,
  currentMembers = [],
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

  const toggleMember = (user) => {
    const isSelected = currentMembers.some((m) => m.id === user.id);
    if (isSelected) {
      onSelect(currentMembers.filter((m) => m.id !== user.id));
    } else {
      onSelect([...currentMembers, user]);
    }
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
          ? "bg-[#202225] border border-[#333538] rounded-2xl shadow-2xl w-[280px] max-w-[calc(100vw-32px)] text-white text-[12.5px] flex flex-col p-2"
          : "absolute top-full left-0 mt-2 bg-[#202225] border border-[#333538] rounded-xl shadow-2xl w-[260px] max-h-[300px] overflow-y-auto z-50 text-white text-[13px] flex flex-col p-1.5 custom-scrollbar"
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#333538] mb-1.5">
        <span className="text-[12px] font-medium text-[#8a8f98]">Select members</span>
        {isMobile && (
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
        )}
      </div>

      <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[220px] custom-scrollbar">
        {availableMembers.length === 0 && (
          <div className="p-2 text-[#8a8f98] text-center italic text-[12px]">
            No members found.
          </div>
        )}
        {availableMembers.map((member) => {
          const isSelected = currentMembers.some((m) => m.id === member.id);
          const displayName =
            member.name || member.email?.split("@")[0] || "User";
          const initial = getInitial(member.name, member.email);

          return (
            <div
              key={member.id}
              onClick={() => toggleMember(member)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
            >
              <div
                className={`w-3.5 h-3.5 rounded-[3px] border ${isSelected ? "bg-[#f54868] border-[#f54868]" : "border-[#55565a]"} flex items-center justify-center shrink-0`}
              >
                {isSelected && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover ml-1 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[9px] font-medium ml-1 shrink-0">
                  {initial}
                </div>
              )}
              <span className="text-[#d1d2d5] truncate text-[12.5px]">{displayName}</span>
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
