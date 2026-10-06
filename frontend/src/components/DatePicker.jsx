import { useState, useRef, useEffect } from 'react';

export default function DatePicker({ value, onChange, placeholder = "Start date", onClose, placement = 'bottom', align = 'left' }) {
  const [activeTab, setActiveTab] = useState('Day');
  const tabs = ['Day', 'Month', 'Quarter', 'Half-year', 'Year'];
  
  // Ref for click outside
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

  const handleSelect = (val) => {
    onChange(val);
    onClose();
  };

  // Calendar Logic
  const parseDate = (val) => {
    if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const parts = val.split('-');
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };
  
  const [currentDate, setCurrentDate] = useState(() => parseDate(value));

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const returnToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInGrid = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    
    const days = [];
    const startDate = new Date(firstDay);
    startDate.setDate(1 - startingDayOfWeek);
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push({
        date: d,
        isCurrentMonth: d.getMonth() === month,
        dayNumber: d.getDate(),
        formatted: `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
      });
    }
    return days;
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const daysGrid = getDaysInGrid(currentDate);

  // Helper for today's format
  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  // Selected format
  const selectedFormatted = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

  const positionClass = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={popoverRef} className={`absolute ${positionClass} ${alignClass} bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl w-[280px] z-50 text-white overflow-hidden text-[13px] flex flex-col`}>
      <div className="p-3 pb-2 border-b border-[#333538]">
        <div className="text-[#8a8f98] mb-2 font-medium">{placeholder}</div>
        <div className="relative flex items-center w-full bg-[#1b1c1e] border border-[#333538] focus-within:border-[#5e6ad2] rounded-md px-2 py-1 min-h-[32px] transition-colors">
          {value ? (
            <div className="flex items-center justify-between w-full">
              <span className="bg-[#5e6ad2]/20 text-[#aebdf8] px-1.5 py-0.5 rounded text-[13px]">
                {value}
              </span>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }} 
                className="text-[#85868a] hover:text-[#d1d2d5] bg-[#333538] hover:bg-[#3f4145] rounded-full p-[3px] transition-colors flex items-center justify-center"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <input 
              autoFocus
              placeholder="Try: May 2027, Q4, 05/20/2027"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="w-full bg-transparent border-none text-[13px] text-white focus:outline-none placeholder:text-[#55565a]"
            />
          )}
        </div>
        
        <div className="flex items-center justify-between gap-1 mt-3">
          {tabs.map(tab => (
            <button 
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-[#8a8f98] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto max-h-[250px] custom-scrollbar">
        {activeTab === 'Day' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-[13px]">
              <span className="font-medium">{monthName} {year}</span>
              <div className="flex items-center gap-3 text-[#85868a]">
                <button type="button" onClick={returnToToday} className="hover:text-white mt-0.5" title="Return to today">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v2.5"/></svg>
                </button>
                <button type="button" onClick={() => changeMonth(-1)} className="hover:text-white">&lt;</button>
                <button type="button" onClick={() => changeMonth(1)} className="hover:text-white">&gt;</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-[12px]">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[#55565a] font-medium mb-1">{d}</div>
              ))}
              {daysGrid.map((dayObj, i) => {
                const isSelected = dayObj.formatted === selectedFormatted;
                const isToday = dayObj.formatted === todayFormatted;
                
                return (
                  <button 
                    type="button"
                    key={i} 
                    onClick={() => handleSelect(dayObj.formatted)}
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-white/10 text-white border border-[#55565a]' 
                        : dayObj.isCurrentMonth 
                          ? 'text-[#d1d2d5] hover:bg-white/10 hover:text-white' 
                          : 'text-[#55565a] hover:bg-white/5 hover:text-[#85868a]'
                    } ${
                      isToday && !isSelected ? 'border border-[#55565a]' : ''
                    }`}
                  >
                    {dayObj.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'Month' && (
          <div className="flex flex-col gap-6">
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <div key={year} className="flex flex-col gap-4">
                <div className="text-[12px] font-medium text-[#85868a]">{year}</div>
                <div className="grid grid-cols-3 gap-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                    <button type="button" key={m} onClick={() => handleSelect(`${m} ${year}`)} className="px-2 py-1 rounded-full border border-[#333538] hover:bg-white/5 text-[#85868a] hover:text-white transition-colors">{m}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'Quarter' && (
          <div className="flex flex-col gap-6">
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <div key={year}>
                <div className="text-[12px] font-medium text-[#85868a] mb-2">{year}</div>
                <div className="grid grid-cols-4 gap-2">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <button type="button" key={q} onClick={() => handleSelect(`${q} ${year}`)} className="px-2 py-1 rounded-full border border-[#333538] hover:bg-white/5 text-[#85868a] hover:text-white transition-colors text-center">{q}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'Half-year' && (
          <div className="flex flex-col gap-6">
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <div key={year}>
                <div className="text-[12px] font-medium text-[#85868a] mb-2">{year}</div>
                <div className="grid grid-cols-2 gap-2">
                  {['H1', 'H2'].map(h => (
                    <button type="button" key={h} onClick={() => handleSelect(`${h} ${year}`)} className="px-2 py-1 rounded-full border border-[#333538] hover:bg-white/5 text-[#85868a] hover:text-white transition-colors text-center">{h}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Year' && (
          <div className="flex flex-col gap-2">
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032].map(year => (
              <button type="button" key={year} onClick={() => handleSelect(`${year}`)} className="px-2 py-1.5 rounded-full border border-[#333538] hover:bg-white/5 text-[#85868a] hover:text-white transition-colors text-center font-medium">
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
