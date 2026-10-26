"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "./segmented-control.module.css";

export default function SegmentedControl({
  options,
  value,
  onValueChange,
  label,
  onOptionIntent,
  className,
  fullWidth = false,
  layoutId: customLayoutId,
}) {
  const isFullWidth = fullWidth || className?.includes("w-full");
  const id = useId();
  const activeLayoutId = customLayoutId || `${id}-pill`;
  const reduced = useReducedMotion();
  const track = useRef(null);

  // Optimistic local state so the pill glides immediately on click without waiting for heavy parent renders
  const [activeVal, setActiveVal] = useState(value);

  useEffect(() => {
    setActiveVal(value);
  }, [value]);

  const handleSelect = (val) => {
    if (val === activeVal) return;
    setActiveVal(val);
    onValueChange?.(val);
  };

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === (activeVal ?? value)),
  );

  const onKeyDown = (event) => {
    const last = options.length - 1;
    const target =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? selectedIndex === last
          ? 0
          : selectedIndex + 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? selectedIndex === 0
            ? last
            : selectedIndex - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (target < 0 || !options[target]) return;
    event.preventDefault();
    handleSelect(options[target].value);
    track.current
      ?.querySelector(`[data-value="${CSS.escape(options[target].value)}"]`)
      ?.focus({ preventScroll: true });
  };

  return (
    <div
      className={`${styles.root} ${className ?? ""}`}
      role="group"
      aria-label={label}
    >
      <div
        ref={track}
        className={`${styles.track} ${isFullWidth ? "w-full" : ""}`}
      >
        {options.map((option, index) => {
          const isActive = (activeVal ?? value) === option.value;
          return (
            <button
              key={option.value}
              id={`${id}-${option.value}`}
              className={`relative ${styles.button} ${isFullWidth ? "flex-1 justify-center text-center" : ""} ${
                isActive
                  ? "text-zinc-900 dark:text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
              }`}
              type="button"
              data-value={option.value}
              aria-pressed={isActive}
              tabIndex={index === selectedIndex ? 0 : -1}
              onClick={() => handleSelect(option.value)}
              onKeyDown={onKeyDown}
              onPointerEnter={
                onOptionIntent ? () => onOptionIntent(option.value) : undefined
              }
              onFocus={
                onOptionIntent ? () => onOptionIntent(option.value) : undefined
              }
            >
              {isActive && (
                <motion.div
                  layoutId={activeLayoutId}
                  className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-full shadow-xs pointer-events-none"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 35 }
                  }
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center gap-1.5 ${isFullWidth ? "w-full" : ""}`}
              >
                {option.label}
                {option.accessory}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
