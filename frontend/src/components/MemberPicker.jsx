import { useRef, useEffect } from 'react';

export default function LinearMemberPicker({ onClose, onSelect, currentMembers = [], availableMembers = [] }) {
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
    const isSelected = currentMembers.some(m => m.id === user.id);
    if (isSelected) {
      onSelect(currentMembers.filter(m => m.id !== user.id));
    } else {
      onSelect([...currentMembers, user]);
    }
  };

  const getInitial = (name, email) => {
    if (name) return name[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  return (
    <div ref={popoverRef} className="absolute top-full left-0 mt-2 bg-[#202225] border border-[#333538] rounded-lg shadow-2xl w-[260px] max-h-[300px] overflow-y-auto z-50 text-white text-[13px] flex flex-col p-1.5 custom-scrollbar">
      {availableMembers.length === 0 && (
        <div className="p-2 text-[#8a8f98] text-center italic">No members found.</div>
      )}
      {availableMembers.map(member => {
        const isSelected = currentMembers.some(m => m.id === member.id);
        const displayName = member.name || member.email?.split('@')[0] || 'User';
        const initial = getInitial(member.name, member.email);
        
        return (
          <div 
            key={member.id}
            onClick={() => toggleMember(member)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors"
          >
            <div className={`w-3.5 h-3.5 rounded-[3px] border ${isSelected ? 'bg-[#f54868] border-[#f54868]' : 'border-[#55565a]'} flex items-center justify-center`}>
              {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={displayName} className="w-5 h-5 rounded-full object-cover ml-1" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[9px] font-medium ml-1">
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
