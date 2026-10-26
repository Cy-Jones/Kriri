import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/registry/components/button/button";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  confirmMatchText = null,
}) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTypedText("");
    }
  }, [isOpen]);

  const isMatch = !confirmMatchText || typedText.trim() === confirmMatchText.trim();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
      if (e.key === "Enter" && isOpen && isMatch) onConfirm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm, isMatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-[#2a2a2a] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-[#2a2a2a]">
          <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
            {message}
          </p>

          {confirmMatchText && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-zinc-500 dark:text-[#85868a]">
                To confirm, enter{" "}
                <span className="font-semibold text-zinc-900 dark:text-white select-all">
                  "{confirmMatchText}"
                </span>{" "}
                below:
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={confirmMatchText}
                autoFocus
                className="w-full px-3 py-1.5 text-[13px] rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="text-[13px] h-8"
            >
              {cancelText}
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              disabled={!isMatch}
              className={`text-[13px] h-8 transition-all ${
                !isMatch ? "opacity-40 cursor-not-allowed" : ""
              } ${
                isDanger
                  ? isMatch
                    ? "bg-[#ef4444] text-white hover:bg-[#dc2626] border-none shadow-sm font-medium"
                    : "bg-red-500/10 text-red-500 border-none"
                  : ""
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
