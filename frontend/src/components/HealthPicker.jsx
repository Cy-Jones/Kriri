import { useRef, useEffect } from 'react';

const HEALTH_OPTIONS = [
  { value: 'No updates', color: '#85868a' },
  { value: 'On track', color: '#4caf50' },
  { value: 'At risk', color: '#f5a623' },
  { value: 'Off track', color: '#e95454' },
];

export function getHealthIcon(health) {
  const option = HEALTH_OPTIONS.find(o => o.value === health) || HEALTH_OPTIONS[0];
  if (health === 'No updates') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" className="opacity-60 text-[#85868a]">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={option.color} strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 6v6l4 2" stroke="currentColor" />
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={popoverRef} className="absolute top-full left-0 mt-2 bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl w-[240px] z-50 text-white py-1">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333538] mb-1">
        <span className="text-[12px] text-[#8a8f98]">Change health...</span>
        <div className="flex items-center gap-1 text-[10px] text-[#8a8f98]">
          <span className="bg-white/5 px-1 rounded">H</span>
        </div>
      </div>
      {HEALTH_OPTIONS.map((option, idx) => (
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
            {getHealthIcon(option.value)}
            <span className="text-[13px] text-[#d1d2d5]">{option.value}</span>
          </div>
          <div className="flex items-center gap-2">
            {value === option.value && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d1d2d5]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span className="text-[12px] text-[#8a8f98] ml-2 w-3 text-right">{idx}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
