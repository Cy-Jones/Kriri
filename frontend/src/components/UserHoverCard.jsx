import React from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Avatar } from "@/registry/components/avatar/avatar";
import { Clock, Box } from "lucide-react";

export default function UserHoverCard({ children, user }) {
  if (!user) return children;

  return (
    <HoverCard.Root openDelay={300} closeDelay={100}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={5}
          className="z-[9999] w-[260px] bg-[#1e1f21] border border-[#333538] rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <Avatar name={user.name} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#e8e8e8]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#8a8f98] bg-[#2a2b2d] border border-[#3c3f44] px-1.5 py-0.5 rounded">
                    Lead
                  </span>
                </div>
                <div className="text-[13px] text-[#8a8f98]">
                  @{user.name.toLowerCase().replace(/\s+/g, "")}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-[12px] text-[#8a8f98]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] ml-1"></div>
              <span className="ml-1 text-[#d1d2d5]">Online</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#8a8f98]">
              <Clock size={14} className="ml-0.5" />
              <span className="ml-0.5">
                1:34 AM <span className="opacity-60">local time</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#8a8f98]">
              <Box size={14} className="ml-0.5" />
              <span className="ml-0.5 text-[#e8e8e8]">Kriri Web Platform</span>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
