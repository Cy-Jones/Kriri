import React from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Avatar } from "@/registry/components/avatar/avatar";
import { Clock, Box } from "lucide-react";

export default function UserHoverCard({ children, user }) {
  if (!user) return children;

  const isOnline =
    user.status === "online" ||
    user.status === "Online" ||
    user.status === "Active" ||
    user.isOnline === true;
  const isAway = user.status === "away" || user.status === "Away";

  const defaultTimeMap = {
    "Sarah Chen": "9:42 AM",
    "Alex Vance": "5:18 PM",
    "Elena Rostova": "2:34 AM",
    "Dev Patel": "11:05 AM",
    "David Kim": "4:15 PM",
  };

  const localTime = user.localTime || defaultTimeMap[user.name] || "10:24 AM";
  const role =
    user.role ||
    (user.name === "Elena Rostova" || user.name === "Sarah Chen"
      ? "Lead"
      : "Member");

  return (
    <HoverCard.Root openDelay={250} closeDelay={100}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={5}
          className="z-[9999] w-[260px] bg-white dark:bg-[#1e1f21] border border-black/10 dark:border-[#333538] rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 text-zinc-900 dark:text-white"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <Avatar
                name={user.name}
                size="md"
                status={isOnline ? "online" : undefined}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-zinc-900 dark:text-[#e8e8e8]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-600 dark:text-[#8a8f98] bg-black/5 dark:bg-[#2a2b2d] border border-black/10 dark:border-[#3c3f44] px-1.5 py-0.5 rounded">
                    {role}
                  </span>
                </div>
                <div className="text-[13px] text-zinc-500 dark:text-[#8a8f98]">
                  @{user.name.toLowerCase().replace(/\s+/g, "")}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-[#8a8f98]">
              <div
                className={`w-1.5 h-1.5 rounded-full ml-1 ${
                  isOnline
                    ? "bg-[#3fb950]"
                    : isAway
                    ? "bg-[#f59e0b]"
                    : "bg-[#71717a]"
                }`}
              />
              <span
                className={`ml-1 ${isOnline ? "text-zinc-800 dark:text-[#d1d2d5]" : "text-zinc-500 dark:text-[#8a8f98]"}`}
              >
                {isOnline ? "Online" : isAway ? "Away" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-[#8a8f98]">
              <Clock size={14} className="ml-0.5 text-zinc-400 dark:text-[#8a8f98]" />
              <span className="ml-0.5 text-zinc-600 dark:text-[#8a8f98]">
                {localTime} <span className="opacity-60">local time</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-[#8a8f98]">
              <Box size={14} className="ml-0.5 text-zinc-400 dark:text-[#8a8f98]" />
              <span className="ml-0.5 text-zinc-800 dark:text-[#e8e8e8]">Kriri Web Platform</span>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
