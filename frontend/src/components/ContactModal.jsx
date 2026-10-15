import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Paperclip, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function ContactModal({ isOpen, onOpenChange }) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success'
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userEmail = user?.primaryEmailAddress?.emailAddress || "your email";

  // Reset & focus
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setStatus("idle");
      const t = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Escape to close, Cmd+Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, message, status]);

  const handleSend = async () => {
    if (!message.trim() || status === "submitting") return;
    setStatus("submitting");

    await new Promise((r) => setTimeout(r, 450));
    setStatus("success");
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            key="linear-contact-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 [backdrop-filter:blur(8px)]"
          />

          {/* Dialog Container - Stretched out comfortably */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-[101] w-full max-w-[620px] rounded-2xl border border-white/10 bg-[#1b1c20] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.8)] text-white"
          >
            {status === "success" ? (
              <div className="py-10 flex flex-col items-center text-center">
                <CheckCircle2 className="w-9 h-9 text-white mb-3" />
                <h4 className="text-[15px] font-semibold text-white">Message sent</h4>
                <p className="text-xs text-[#8a8f98] mt-1.5 max-w-sm leading-relaxed">
                  Thanks for reaching out! We will reply to{" "}
                  <span className="text-white font-medium">{userEmail}</span> shortly.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white tracking-tight">
                      Contact us
                    </h3>
                    <p className="text-[13px] text-[#8a8f98] mt-1 leading-normal">
                      Include any relevant details, or email us directly at{" "}
                      <a
                        href="mailto:support@kriri.app"
                        className="text-white hover:underline inline-flex items-center gap-0.5"
                      >
                        support@kriri.app
                        <ArrowUpRight className="w-3.5 h-3.5 flex-none" />
                      </a>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="text-[#8a8f98] hover:text-white p-1.5 -mr-1 -mt-1 rounded-md hover:bg-white/[0.06] transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Textarea container */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141518] p-3.5 focus-within:border-white/20 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    placeholder="Tell us what's on your mind, describe a bug, or share your feedback..."
                    className="w-full min-h-[160px] bg-transparent border-0 outline-none resize-none text-[13px] text-[#f4f4f5] placeholder-[#5f6066] leading-relaxed focus:ring-0"
                  />

                  {/* Actions inside box */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] mt-2">
                    <button
                      type="button"
                      className="text-[#8a8f98] hover:text-white p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
                      title="Attach file (optional)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2.5">
                      <span className="hidden sm:inline-block text-[11px] text-[#5f6066]">
                        ⌘ + Enter
                      </span>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!message.trim() || status === "submitting"}
                        className="px-4 py-2 rounded-lg bg-white hover:bg-[#e8e8e8] text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {status === "submitting" ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
