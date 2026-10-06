import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function ActionTooltip({ children, label, shortcut, side = "bottom", align = "center" }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={4}
            className="z-[9999] px-2.5 py-1.5 flex items-center gap-2 bg-[#2a2b2d] border border-[#3c3f44] text-[#e8e8e8] text-[12px] rounded shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
          >
            <span className="font-medium whitespace-nowrap">{label}</span>
            {shortcut && (
              <span className="text-[10px] text-[#8a8f98] bg-[#1e1f21] px-1.5 py-0.5 rounded border border-[#333538] whitespace-nowrap ml-1">
                {shortcut}
              </span>
            )}
            <Tooltip.Arrow className="fill-[#3c3f44]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
