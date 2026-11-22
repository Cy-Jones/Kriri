import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Mic, ArrowUp, Paperclip, AtSign, PenLine, Eye, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KririPromptInput({
  value = "",
  onChange,
  onSubmit,
  isListening = false,
  onVoiceToggle,
  loading = false,
  placeholder = "Ask Kriri",
  variant = "default", // 'default' (main page) | 'compact' (modal)
  onAttachFile,
  onMention,
  accessMode = "read_write", // 'read_write' | 'read_only'
  onAccessModeChange,
}) {
  const isCompact = variant === "compact";
  const singleLineHeight = isCompact ? 22 : 24;

  // Deterministically compute multiline state from value to prevent layout-measurement re-render loops
  const isMultiline = Boolean(
    value && (value.includes("\n") || value.length > (isCompact ? 36 : 56))
  );

  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isAccessMenuOpen, setIsAccessMenuOpen] = useState(false);

  const textareaRef = useRef(null);
  const plusMenuRef = useRef(null);
  const accessMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close plus and access menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setIsPlusMenuOpen(false);
      }
      if (accessMenuRef.current && !accessMenuRef.current.contains(e.target)) {
        setIsAccessMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Safely measure and adjust textarea height via requestAnimationFrame to avoid synchronous React layout loops
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const frameId = requestAnimationFrame(() => {
      if (!value) {
        el.style.height = `${singleLineHeight}px`;
        return;
      }

      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;

      if (isMultiline) {
        const minH = isCompact ? 44 : 52;
        const maxH = isCompact ? 160 : 200;
        el.style.height = `${Math.min(Math.max(scrollHeight, minH), maxH)}px`;
      } else {
        el.style.height = `${singleLineHeight}px`;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [value, isMultiline, singleLineHeight, isCompact]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        onSubmit?.();
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachFile?.(file);
      setIsPlusMenuOpen(false);
      textareaRef.current?.focus();
    }
  };

  const handleMentionClick = () => {
    onMention?.();
    setIsPlusMenuOpen(false);
    textareaRef.current?.focus();
  };

  const renderAccessModeDropdown = () => (
    <div className="relative shrink-0" ref={accessMenuRef}>
      <button
        type="button"
        onClick={() => setIsAccessMenuOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer select-none shrink-0 border ${
          isCompact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
        } ${
          accessMode === "read_write"
            ? "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.05] dark:hover:bg-white/[0.09] border-black/10 dark:border-white/10"
            : "text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25"
        }`}
        title="Change AI access permissions"
      >
        {accessMode === "read_write" ? (
          <PenLine size={isCompact ? 11 : 12} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
        ) : (
          <Eye size={isCompact ? 11 : 12} className="text-amber-500 shrink-0" />
        )}
        <span>{accessMode === "read_write" ? "Read & write" : "Read only"}</span>
        <ChevronDown
          size={10}
          className={`opacity-50 transition-transform duration-150 ${
            isAccessMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isAccessMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+8px)] right-0 w-48 bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-white/10 rounded-xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1 z-50 text-xs select-none backdrop-blur-md"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              Access Mode
            </div>

            <button
              type="button"
              onClick={() => {
                onAccessModeChange?.("read_write");
                setIsAccessMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer group ${
                accessMode === "read_write"
                  ? "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-2">
                <PenLine size={13} strokeWidth={1.8} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                <span className="text-[12.5px]">Read & write</span>
              </div>
              {accessMode === "read_write" && (
                <Check size={13} strokeWidth={2.5} className="text-zinc-900 dark:text-white shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onAccessModeChange?.("read_only");
                setIsAccessMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer group mt-0.5 ${
                accessMode === "read_only"
                  ? "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye size={13} strokeWidth={1.8} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                <span className="text-[12.5px]">Read only</span>
              </div>
              {accessMode === "read_only" && (
                <Check size={13} strokeWidth={2.5} className="text-zinc-900 dark:text-white shrink-0" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div
      className={`w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/5 focus-within:border-black/20 dark:focus-within:border-white/15 shadow-sm dark:shadow-lg select-none ${
        isCompact ? "rounded-[22px]" : "rounded-[26px]"
      } ${
        isMultiline
          ? isCompact
            ? "p-2.5 sm:p-3 flex flex-col gap-2.5"
            : "p-3 sm:p-3.5 flex flex-col gap-3"
          : isCompact
          ? "px-3 py-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-2"
          : "px-3.5 sm:px-4 py-2.5 sm:py-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 sm:gap-x-3"
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When MULTILINE: Textarea is full width at top, controls in bottom row */}
      {isMultiline ? (
        <>
          {/* Top: Auto-expanding Textarea spanning full card width */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-[#8e8e8e] focus:outline-none resize-none custom-scrollbar break-words px-1.5 pt-0.5 leading-relaxed overflow-y-auto ${
              isCompact ? "text-[16px] sm:text-[13.5px]" : "text-[16px] sm:text-[15px]"
            }`}
          />

          {/* Bottom Bar: Left Plus/Attach menu, Right Mic, Send */}
          <div className="flex items-center justify-between w-full pt-1">
            {/* Left + Attach Button with Popover Menu */}
            <div className="relative" ref={plusMenuRef}>
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                className={`rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ${
                  isCompact ? "w-7 h-7" : "w-8 h-8"
                }`}
                title="Attach & options"
              >
                <Plus size={isCompact ? 16 : 18} strokeWidth={2} />
              </button>

              {/* Premium Plus Popover Menu */}
              <AnimatePresence>
                {isPlusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute bottom-[calc(100%+10px)] left-0 bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1.5 z-50 text-xs backdrop-blur-md ${
                      isCompact ? "w-52" : "w-60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsPlusMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors font-medium cursor-pointer group"
                    >
                      <Paperclip
                        size={15}
                        strokeWidth={1.85}
                        className="text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0"
                      />
                      <span>Attach file or document</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMentionClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors font-medium cursor-pointer group"
                    >
                      <AtSign
                        size={15}
                        strokeWidth={1.85}
                        className="text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0"
                      />
                      <span>Mention project or task</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Controls: Access Dropdown, Mic, Send */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {renderAccessModeDropdown()}

              <button
                type="button"
                onClick={onVoiceToggle}
                className={`rounded-full transition-colors cursor-pointer ${
                  isCompact ? "p-1" : "p-1.5"
                } ${
                  isListening
                    ? "text-rose-500 bg-rose-500/20 animate-pulse"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10"
                }`}
                title={isListening ? "Listening... click to stop" : "Start continuous dictation"}
              >
                <Mic size={isCompact ? 16 : 18} strokeWidth={1.85} />
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={!value.trim() || loading}
                className={`rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer shadow-sm shrink-0 ${
                  isCompact ? "w-7 h-7" : "w-8 sm:w-9 h-8 sm:h-9"
                }`}
                title="Send message"
              >
                <ArrowUp size={isCompact ? 14 : 16} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* When SINGLE-LINE: Left Plus, Center Textarea, Right Controls */
        <>
          {/* Left + Button with Popover Menu */}
          <div className="relative shrink-0" ref={plusMenuRef}>
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen((prev) => !prev)}
              className={`rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ${
                isCompact ? "w-7 h-7" : "w-8 h-8"
              }`}
              title="Attach & options"
            >
              <Plus size={isCompact ? 16 : 18} strokeWidth={2} />
            </button>

            {/* Premium Plus Popover Menu */}
            <AnimatePresence>
              {isPlusMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute bottom-[calc(100%+10px)] left-0 bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1.5 z-50 text-xs backdrop-blur-md ${
                    isCompact ? "w-52" : "w-60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors font-medium cursor-pointer group"
                  >
                    <Paperclip
                      size={15}
                      strokeWidth={1.85}
                      className="text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0"
                    />
                    <span>Attach file or document</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMentionClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors font-medium cursor-pointer group"
                  >
                    <AtSign
                      size={15}
                      strokeWidth={1.85}
                      className="text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0"
                    />
                    <span>Mention project or task</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-[#8e8e8e] focus:outline-none resize-none custom-scrollbar min-w-0 leading-normal overflow-hidden py-0.5 ${
              isCompact ? "text-[16px] sm:text-[13.5px]" : "text-[16px] sm:text-[15px]"
            }`}
          />

          {/* Right: Access Dropdown + Mic + Circular Send */}
          <div
            className={`flex items-center shrink-0 ${
              isCompact ? "gap-1.5" : "gap-1.5 sm:gap-2"
            }`}
          >
            {renderAccessModeDropdown()}

            <button
              type="button"
              onClick={onVoiceToggle}
              className={`rounded-full transition-colors cursor-pointer ${
                isCompact ? "p-1" : "p-1.5"
              } ${
                isListening
                  ? "text-rose-500 bg-rose-500/20 animate-pulse"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10"
              }`}
              title={isListening ? "Listening... click to stop" : "Start continuous dictation"}
            >
              <Mic size={isCompact ? 16 : 18} strokeWidth={1.85} />
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim() || loading}
              className={`rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer shadow-sm shrink-0 ${
                isCompact ? "w-7 h-7" : "w-8 sm:w-9 h-8 sm:h-9"
              }`}
              title="Send message"
            >
              <ArrowUp size={isCompact ? 14 : 16} strokeWidth={2.2} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
