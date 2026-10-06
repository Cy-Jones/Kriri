import { useRef, useEffect } from 'react';

export default function ProgressPicker({ value, onChange, onClose }) {
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

  const options = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div ref={popoverRef} className="absolute top-full left-0 mt-2 bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl w-[200px] z-50 text-white py-2 max-h-[300px] overflow-y-auto">
      <div className="px-3 pb-2 mb-2 border-b border-[#333538] text-[12px] text-[#8a8f98]">Set progress</div>
      {options.map((opt) => (
        <div
          key={opt}
          onClick={() => {
            onChange(opt);
            onClose();
          }}
          className={`flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-white/[0.06] rounded-md transition-colors mx-1 ${
            value === opt ? 'bg-white/[0.04]' : ''
          }`}
        >
          <span className="text-[13px] text-[#d1d2d5]">{opt}%</span>
          {value === opt && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d1d2d5]">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
