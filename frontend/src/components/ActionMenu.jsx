import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

export function ActionMenu({ trigger, children, align = "end" }) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>
        {trigger}
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          sideOffset={5}
          className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/[0.05] bg-[#1a1b1e] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 outline-none"
        >
          {children}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export function ActionMenuItem({ children, onClick, destructive }) {
  return (
    <DropdownPrimitive.Item
      onSelect={onClick}
      className={`relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-[13px] font-medium outline-none transition-colors data-[highlighted]:bg-white/[0.04] ${
        destructive ? "text-red-400 data-[highlighted]:text-red-400 data-[highlighted]:bg-red-400/10" : "text-[#e8e8e8]"
      }`}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}

export function ActionMenuSeparator() {
  return <DropdownPrimitive.Separator className="my-1.5 h-px bg-white/[0.05]" />;
}
