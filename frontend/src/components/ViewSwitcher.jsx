/**
 * Universal High-Performance Switcher
 * Zero-overhead instant CSS active pill and zero-delay pointerdown response
 */
export default function ViewSwitcher({
  views,
  activeView,
  onViewChange,
  layoutId,
  className = "",
  fullWidth = true,
  iconPosition = "left",
  size = "md",
}) {
  return (
    <div
      className={`flex items-center p-0.5 sm:p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm select-none ${
        fullWidth ? "w-full" : "w-fit shrink-0"
      } ${className}`}
    >
      {views.map((tab) => {
        const isActive = activeView === tab.value;
        const iconElement = tab.icon ? (
          <span
            className={`shrink-0 ${
              isActive
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-[#8a8f98]"
            }`}
          >
            {tab.icon}
          </span>
        ) : null;

        return (
          <button
            key={tab.value}
            type="button"
            onPointerDown={(e) => {
              if (e.button === 0) {
                e.stopPropagation();
                onViewChange?.(tab.value);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onViewChange?.(tab.value);
            }}
            className={`relative ${
              fullWidth ? "flex-1" : "shrink-0"
            } flex items-center justify-center gap-1.5 ${
              size === "sm"
                ? "px-2.5 py-1 text-[11px] sm:text-[11.5px]"
                : "px-3 py-1 sm:py-1.5 text-[12px]"
            } font-medium rounded-full cursor-pointer select-none ${
              isActive
                ? "text-zinc-900 dark:text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
            }`}
          >
            {isActive && (
              <div
                className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-full shadow-xs pointer-events-none"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap">
              {iconPosition === "left" && iconElement}
              {tab.mobileLabel ? (
                <>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                </>
              ) : (
                <span>{tab.label}</span>
              )}
              {iconPosition === "right" && iconElement}
            </span>
          </button>
        );
      })}
    </div>
  );
}

