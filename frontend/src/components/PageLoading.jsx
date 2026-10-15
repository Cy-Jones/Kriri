import React from "react";

export default function PageLoading({
  label = "Workspace",
  fullScreen = true,
  className = "",
}) {
  return (
    <div
      className={`${
        fullScreen
          ? "fixed inset-0 z-50 min-h-[100dvh] w-screen"
          : "flex-1 w-full h-full min-h-[300px]"
      } flex flex-col items-center justify-center p-8 select-none bg-black text-[#8a8f98] animate-in fade-in duration-150 ${className}`}
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
