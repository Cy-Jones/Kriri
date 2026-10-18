import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

function renderShortcutKeys(shortcut) {
  if (!shortcut) return null;

  if (typeof shortcut === "string" && shortcut.includes(" then ")) {
    const parts = shortcut.split(" then ");
    return (
      <span className="flex items-center gap-1 ml-1.5">
        <kbd className="h-[18px] min-w-[18px] px-1.5 flex items-center justify-center rounded-[5px] bg-white/[0.08] border border-white/[0.12] font-mono text-[10px] text-[#a1a7b1]">
          {parts[0]}
        </kbd>
        <span className="text-[10px] text-[#8a8f98]">then</span>
        <kbd className="h-[18px] min-w-[18px] px-1.5 flex items-center justify-center rounded-[5px] bg-white/[0.08] border border-white/[0.12] font-mono text-[10px] text-[#a1a7b1]">
          {parts[1]}
        </kbd>
      </span>
    );
  }

  let keys = [];
  if (Array.isArray(shortcut)) {
    keys = shortcut;
  } else if (typeof shortcut === "string") {
    if (shortcut.includes(" ")) {
      keys = shortcut.split(" ").filter(Boolean);
    } else if (shortcut.startsWith("⌘") && shortcut.length > 1) {
      keys = ["⌘", shortcut.slice(1)];
    } else {
      keys = [shortcut];
    }
  }

  return (
    <span className="flex items-center gap-1 ml-1">
      {keys.map((k, idx) => (
        <kbd
          key={idx}
          className="h-[18px] min-w-[18px] px-1.5 flex items-center justify-center rounded-[5px] bg-white/[0.08] border border-white/[0.12] font-mono text-[10px] text-[#a1a7b1] leading-none select-none"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export default function ActionTooltip({
  children,
  label,
  shortcut,
  side = "bottom",
  align = "center",
  sideOffset = 6,
}) {
  if (!label) return children;

  return (
    <Tooltip.Provider delayDuration={120} skipDelayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            className="z-[9999] px-2.5 py-1.5 flex items-center gap-1.5 bg-[#2a2b2d] border border-[#3c3f44] text-[#e8e8e8] text-[12px] rounded-lg shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 pointer-events-none select-none"
          >
            <span className="font-medium whitespace-nowrap">{label}</span>
            {renderShortcutKeys(shortcut)}
            <Tooltip.Arrow className="fill-[#3c3f44]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
