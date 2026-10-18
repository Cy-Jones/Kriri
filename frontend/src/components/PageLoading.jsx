import React from "react";

export default function PageLoading({
  label = "Workspace",
  fullScreen = false,
  className = "",
}) {
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 min-h-[100dvh] w-screen flex flex-col items-center justify-center p-8 select-none bg-[#0a0a0c] text-[#8a8f98] animate-in fade-in duration-150 ${className}`}
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

  return (
    <div
      className={`flex-1 w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 select-none bg-transparent text-[#8a8f98] animate-in fade-in duration-100 ${className}`}
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
