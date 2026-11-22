import React, { useState, useEffect } from "react";

export function SleekSlider({
  value = 30,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  accentColor,
  showBadge = true,
  className = "",
  ariaLabel = "Slider",
}) {
  const [internalVal, setInternalVal] = useState(value);

  useEffect(() => {
    setInternalVal(value);
  }, [value]);

  const numValue = Number(internalVal);
  const clampedValue = isNaN(numValue) ? 30 : Math.min(max, Math.max(min, numValue));
  const pct = Math.max(0, Math.min(100, ((clampedValue - min) / (max - min)) * 100));

  const activeColor = accentColor || "var(--kriri-accent, #5e6ad2)";

  // Parse RGB for hover/active glow
  let ringRgb = "94, 106, 210";
  let hex = (accentColor || "").replace("#", "").trim();
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  const num = parseInt(hex, 16);
  if (!isNaN(num) && hex.length === 6) {
    ringRgb = `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }

  // Smooth two-tone track gradient: active accent on the left, refined translucent rail on the right
  const trackBg = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${pct}%, rgba(255, 255, 255, 0.14) ${pct}%, rgba(255, 255, 255, 0.14) 100%)`;

  const handleUpdate = (e) => {
    const nextVal = Number(e.target.value);
    setInternalVal(nextVal);
    onChange?.(nextVal);
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex-1 flex items-center h-6">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onInput={handleUpdate}
          onChange={handleUpdate}
          aria-label={ariaLabel}
          className="sleek-slider cursor-pointer"
          style={{
            "--slider-track-bg": trackBg,
            "--slider-accent": activeColor,
            "--slider-ring": `rgba(${ringRgb}, 0.28)`,
          }}
        />
      </div>

      {showBadge && (
        <span className="min-w-[36px] px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 font-mono text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 text-center shrink-0 shadow-2xs tabular-nums select-none">
          {clampedValue}
        </span>
      )}
    </div>
  );
}
