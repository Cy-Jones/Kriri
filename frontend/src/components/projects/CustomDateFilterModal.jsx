import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomDateFilterModal({
  isOpen,
  onClose,
  customDateCategory,
  customDateModifier,
  setCustomDateModifier,
  customDateSearch,
  setCustomDateSearch,
  customDateMode,
  setCustomDateMode,
  customDateSelection,
  setCustomDateSelection,
  customDateMonthOffset,
  setCustomDateMonthOffset,
  onApply,
}) {
  if (!isOpen) return null;

  const handleApply = () => {
    const finalSelection = customDateSearch || customDateSelection;
    if (finalSelection) {
      const appliedValue =
        customDateModifier === "on"
          ? finalSelection
          : `${customDateModifier} ${finalSelection}`;
      onApply(customDateCategory, appliedValue);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-[640px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <h2 className="text-[15px] font-medium text-white">
            {customDateCategory}
          </h2>
          <div className="flex bg-white/5 rounded-full p-0.5">
            {["on", "before", "after"].map((modifier) => (
              <button
                key={modifier}
                onClick={() => setCustomDateModifier(modifier)}
                className={`px-3 py-1 text-[12px] rounded-full transition-colors ${
                  customDateModifier === modifier
                    ? "bg-white/10 text-white"
                    : "text-[#8a8f98] hover:text-[#e8e8e8]"
                }`}
              >
                {modifier}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <input
            type="text"
            value={customDateSearch}
            onChange={(e) => setCustomDateSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApply();
              }
            }}
            placeholder="Try: May 2027, Q4, 05/20/2027"
            className="w-full bg-[#1c1c1e] border border-white/20 rounded-lg text-[13px] text-white placeholder-[#8a8f98] px-3 py-2 outline-none focus:border-[#3b82f6] transition-colors"
          />

          <div className="flex items-center gap-1.5">
            {["Day", "Month", "Quarter", "Half-year", "Year"].map((mode) => (
              <button
                key={mode}
                onClick={() => setCustomDateMode(mode)}
                className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${
                  customDateMode === mode
                    ? "bg-white/10 text-white"
                    : "text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/5"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div
            className="flex flex-col gap-4 mt-2 overflow-y-auto max-h-[350px] pr-2"
            style={{ scrollbarWidth: "thin" }}
          >
            {customDateMode === "Quarter" &&
              ["2024", "2025", "2026", "2027", "2028"].map((year) => (
                <div key={year} className="flex flex-col gap-2">
                  <div className="text-[12px] text-[#8a8f98]">{year}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                      const val = `${year} ${q}`;
                      const isSelected = customDateSelection === val;
                      return (
                        <button
                          key={`${year}-${q}`}
                          onClick={() => setCustomDateSelection(val)}
                          className={`border rounded-full py-1.5 text-[12px] transition-colors ${
                            isSelected
                              ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]"
                              : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"
                          }`}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {customDateMode === "Month" &&
              ["2024", "2025", "2026", "2027", "2028"].map((year) => (
                <div key={year} className="flex flex-col gap-2">
                  <div className="text-[12px] text-[#8a8f98]">{year}</div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ].map((m) => {
                      const val = `${m} ${year}`;
                      const isSelected = customDateSelection === val;
                      return (
                        <button
                          key={`${year}-${m}`}
                          onClick={() => setCustomDateSelection(val)}
                          className={`border rounded-full py-1.5 text-[12px] transition-colors ${
                            isSelected
                              ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]"
                              : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {customDateMode === "Year" && (
              <div className="flex flex-col gap-2">
                <div className="text-[12px] text-[#8a8f98]">Select Year</div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "2020",
                    "2021",
                    "2022",
                    "2023",
                    "2024",
                    "2025",
                    "2026",
                    "2027",
                    "2028",
                    "2029",
                    "2030",
                    "2031",
                  ].map((y) => {
                    const isSelected = customDateSelection === y;
                    return (
                      <button
                        key={y}
                        onClick={() => setCustomDateSelection(y)}
                        className={`border rounded-full py-1.5 text-[12px] transition-colors ${
                          isSelected
                            ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]"
                            : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {customDateMode === "Half-year" &&
              ["2024", "2025", "2026", "2027", "2028"].map((year) => (
                <div key={year} className="flex flex-col gap-2">
                  <div className="text-[12px] text-[#8a8f98]">{year}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {["H1", "H2"].map((h) => {
                      const val = `${year} ${h}`;
                      const isSelected = customDateSelection === val;
                      return (
                        <button
                          key={`${year}-${h}`}
                          onClick={() => setCustomDateSelection(val)}
                          className={`border rounded-full py-1.5 text-[12px] transition-colors ${
                            isSelected
                              ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]"
                              : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {customDateMode === "Day" &&
              (() => {
                const getMonthData = (offset) => {
                  const d = new Date();
                  d.setDate(1);
                  d.setMonth(d.getMonth() + offset);
                  const year = d.getFullYear();
                  const month = d.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDay = new Date(year, month, 1).getDay();
                  const monthName = d.toLocaleString("default", {
                    month: "long",
                  });
                  return { year, month, daysInMonth, firstDay, monthName };
                };

                const left = getMonthData(customDateMonthOffset);
                const right = getMonthData(customDateMonthOffset + 1);

                const renderCalendar = (data, isRight) => {
                  return (
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-[13px] text-[#e8e8e8] font-medium">
                          {data.monthName} {data.year}
                        </div>
                        {isRight && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                setCustomDateMonthOffset((prev) => prev - 1)
                              }
                              className="text-[#8a8f98] hover:text-white"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              onClick={() =>
                                setCustomDateMonthOffset((prev) => prev + 1)
                              }
                              className="text-[#8a8f98] hover:text-white"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-7 text-[12px] text-center">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div
                            key={d}
                            className={`py-1.5 ${
                              d === "Su" || d === "Sa" ? "bg-white/[0.02]" : ""
                            } text-[#8a8f98]`}
                          >
                            {d}
                          </div>
                        ))}

                        {Array.from({ length: data.firstDay }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className={`py-1.5 ${
                              i === 0 ? "bg-white/[0.02]" : ""
                            }`}
                          ></div>
                        ))}

                        {Array.from(
                          { length: data.daysInMonth },
                          (_, i) => i + 1,
                        ).map((day) => {
                          const isWeekend =
                            (day + data.firstDay - 1) % 7 === 0 ||
                            (day + data.firstDay) % 7 === 0;
                          const val = `${data.monthName.substring(
                            0,
                            3,
                          )} ${day}, ${data.year}`;
                          const isSelected = customDateSelection === val;
                          return (
                            <div
                              key={day}
                              className={`flex items-center justify-center py-1.5 ${
                                isWeekend ? "bg-white/[0.02]" : ""
                              }`}
                            >
                              <button
                                onClick={() => setCustomDateSelection(val)}
                                className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                                  isSelected
                                    ? "bg-[#3b82f6] text-white"
                                    : "text-[#e8e8e8] hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                {day}
                              </button>
                            </div>
                          );
                        })}

                        {Array.from({
                          length: (42 - (data.firstDay + data.daysInMonth)) % 7,
                        }).map((_, i) => {
                          const total = data.firstDay + data.daysInMonth;
                          const isWeekend =
                            (total + i) % 7 === 0 || (total + i + 1) % 7 === 0;
                          return (
                            <div
                              key={`empty-end-${i}`}
                              className={`py-1.5 ${
                                isWeekend ? "bg-white/[0.02]" : ""
                              }`}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="flex gap-8">
                    {renderCalendar(left, false)}
                    {renderCalendar(right, true)}
                  </div>
                );
              })()}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2 bg-white/5 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/5 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-[13px] bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
