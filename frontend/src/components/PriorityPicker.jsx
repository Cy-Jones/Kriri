import { useRef, useEffect } from 'react';
import { Signal } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'No priority', number: 0, color: 'text-[#8a8f98]/30' },
  { value: 'Urgent', number: 1, color: 'text-[#e27a4a]' },
  { value: 'High', number: 2, color: 'text-[#e8e8e8]' },
  { value: 'Medium', number: 3, color: 'text-[#8a8f98]' },
  { value: 'Low', number: 4, color: 'text-[#8a8f98]/50' },
];

export function getPriorityIcon(priority) {
  const color = priority === 'Urgent' ? 'text-[#e27a4a]' :
                priority === 'High' ? 'text-[#e8e8e8]' :
                priority === 'Medium' ? 'text-[#8a8f98]' :
                priority === 'Low' ? 'text-[#8a8f98]/50' :
                'text-[#8a8f98]/30';
                
  if (priority === 'Urgent') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
        <path d="M12 8v4"></path>
        <path d="M12 16h.01"></path>
      </svg>
    );
  } else if (priority === 'High') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
        <path d="M12 20v-8"></path>
        <path d="M17 20V8"></path>
        <path d="M22 4v16"></path>
      </svg>
    );
  } else if (priority === 'Medium') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
        <path d="M12 20v-8"></path>
      </svg>
    );
  } else if (priority === 'Low') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <path d="M2 20h.01"></path>
        <path d="M7 20v-4"></path>
      </svg>
    );
  } else {
    // No priority
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <circle cx="12" cy="12" r="9" strokeDasharray="4 4"></circle>
      </svg>
    );
  }
}

export default function PriorityPicker({ value, onChange, onClose }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={popoverRef} className="absolute top-full left-0 mt-2 bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl w-[240px] z-50 text-white py-1">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333538] mb-1">
        <span className="text-[12px] text-[#8a8f98]">Change priority...</span>
      </div>
      {PRIORITY_OPTIONS.map((option) => (
        <div
          key={option.value}
          onClick={() => {
            onChange(option.value);
            onClose();
          }}
          className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.06] rounded-md transition-colors m-1 ${
            value === option.value ? 'bg-white/[0.04]' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            {getPriorityIcon(option.value)}
            <span className="text-[13px] text-[#d1d2d5]">{option.value}</span>
          </div>
          <div className="flex items-center gap-2">
            {value === option.value && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d1d2d5]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
