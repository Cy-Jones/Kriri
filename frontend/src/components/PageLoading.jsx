import React from "react";

export default function PageLoading({
  label = "Workspace",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center flex-1 w-full h-full min-h-[380px] p-8 select-none bg-[#131416] animate-in fade-in duration-150 ${className}`}
    >
      <div className="flex items-center gap-2.5 text-[#8a8f98]">
        <div className="w-4 h-4 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
        <span className="text-[13px] font-medium text-[#8a8f98] tracking-tight">
          Loading <span className="text-[#e8e8e8]">{label}</span>...
        </span>
      </div>
    </div>
  );
}
