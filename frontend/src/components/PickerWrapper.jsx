import React from 'react';
import * as PopoverPrimitive from "@radix-ui/react-popover";

export default function PickerWrapper({ open, onOpenChange, trigger, children, align = "start" }) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side="bottom"
          sideOffset={0}
          className="z-[9999] relative w-0 h-0"
        >
          <div className="relative top-0 left-0">
             {children}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
