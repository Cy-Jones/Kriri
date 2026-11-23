import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export default function PickerWrapper({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
}) {
  if (!open) {
    return trigger;
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <div className="inline-flex shrink-0 outline-none">{trigger}</div>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side="bottom"
          sideOffset={0}
          className="z-[9999] relative w-0 h-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="relative top-0 left-0"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {typeof children === "function" ? children() : children}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
