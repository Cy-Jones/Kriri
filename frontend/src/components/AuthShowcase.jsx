import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import { Avatar } from "../registry/components/avatar/avatar";
import { Button } from "../registry/components/button/button";

export function AuthShowcase() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((s) => (s + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSlide = () => {
    setActiveSlide((s) => (s + 1) % 3);
    setIsPlaying(false);
  };

  const prevSlide = () => {
    setActiveSlide((s) => (s - 1 + 3) % 3);
    setIsPlaying(false);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const slides = [
    {
      id: "board",
      title: "Board View",
      tag: "Preview",
      content: (
        <>
          {/* Mockup Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-400"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white font-display">
                  Project Alpha
                </h3>
                <p className="text-xs text-zinc-500">Active Sprint</p>
              </div>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#121214] bg-zinc-800 flex items-center justify-center text-xs text-white">
                JD
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#121214] bg-blue-800 flex items-center justify-center text-xs text-white">
                SA
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#121214] bg-white/10 flex items-center justify-center text-xs text-white">
                +3
              </div>
            </div>
          </div>

          {/* Mockup Board/List */}
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-3 cursor-default">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-white">
                  Implement OAuth Integration
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  In Progress
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">KRI-42</span>
                  <span>•</span>
                  <span>Tomorrow</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white">
                  JD
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-3 cursor-default">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-white">
                  Design System Architecture
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-white/5">
                  To Do
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">KRI-45</span>
                  <span>•</span>
                  <span>Next week</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-dashed border-zinc-600 flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 opacity-60 flex flex-col gap-3 cursor-default">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-white line-through text-zinc-400">
                  Setup CI/CD Pipeline
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  Done
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">KRI-38</span>
                  <span>•</span>
                  <span>Yesterday</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center text-[10px] text-white">
                  SA
                </div>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "timeline",
      title: "Timeline View",
      tag: "New",
      content: (
        <>
          {/* Mockup Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-400"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white font-display">
                  Q4 Roadmap
                </h3>
                <p className="text-xs text-zinc-500">Timeline view</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded-lg">
              Share
            </div>
          </div>

          {/* Timeline UI */}
          <div className="flex flex-col gap-6 relative mt-4">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10 z-0"></div>

            <div className="relative z-10 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                <div className="text-sm font-medium text-white mb-1">
                  Database Migration
                </div>
                <div className="text-xs text-zinc-500 mb-3">
                  Oct 12 - Oct 25
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-2/3 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                <div className="text-sm font-medium text-white mb-1">
                  Public API Launch
                </div>
                <div className="text-xs text-zinc-500 mb-3">
                  Nov 01 - Nov 15
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-1/4 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex gap-4 items-start opacity-50">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center mt-1 shrink-0"></div>
              <div className="flex-1 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 border-dashed">
                <div className="text-sm font-medium text-zinc-400 mb-1">
                  Add Milestone
                </div>
                <div className="text-xs text-zinc-600">Click to schedule</div>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "inbox",
      title: "Inbox",
      tag: "Beta",
      content: (
        <>
          {/* Mockup Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-rose-400"
                >
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white font-display">
                  Inbox
                </h3>
                <p className="text-xs text-zinc-500">2 unread notifications</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-400">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
          </div>

          {/* Notifications */}
          <motion.div
            className="flex flex-col gap-3 mt-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.1 },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: motionTokens.spring.smooth,
                },
              }}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-indigo-500/30 flex gap-4 cursor-default relative overflow-hidden group hover:border-indigo-500/50 transition-colors"
            >
              <div className="shrink-0 flex items-center mt-1">
                <Avatar name="Sarah" size="md" status="online" />
              </div>
              <div>
                <div className="text-sm text-zinc-300 mb-1">
                  <span className="text-white font-medium">Sarah</span>{" "}
                  mentioned you in{" "}
                  <span className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                    KRI-42
                  </span>
                </div>
                <div className="text-xs text-zinc-400 bg-black/40 p-2 rounded-lg border border-white/5 mt-2">
                  "Can you review the latest PR for the OAuth flow?"
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: motionTokens.spring.smooth,
                },
              }}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-rose-500/30 flex gap-4 cursor-default relative overflow-hidden group hover:border-rose-500/50 transition-colors"
            >
              <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-rose-500/10 text-rose-400 mt-1">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div>
                <div className="text-sm text-zinc-300 mb-1">
                  Build failed on{" "}
                  <span className="text-white font-medium group-hover:text-rose-400 transition-colors">
                    main
                  </span>
                </div>
                <div className="text-xs text-rose-400 font-mono mt-1">
                  Error: missing dependency
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: motionTokens.spring.smooth,
                },
              }}
              className="p-4 rounded-2xl bg-zinc-900/40 border border-emerald-500/20 flex gap-4 cursor-default relative overflow-hidden opacity-70 group hover:opacity-100 hover:border-emerald-500/40 transition-all"
            >
              <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 mt-1">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <div className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Issue{" "}
                  <span className="text-zinc-300 group-hover:text-emerald-400 transition-colors">
                    KRI-38
                  </span>{" "}
                  marked as done
                </div>
                <div className="text-xs text-zinc-600 mt-1 group-hover:text-zinc-500 transition-colors">
                  Yesterday at 4:30 PM
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      ),
    },
  ];

  const current = slides[activeSlide];

  return (
    <div className="hidden lg:flex lg:w-1/2 p-4">
      <div className="w-full h-full bg-[#121214] border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between p-12">
        <div className="relative z-10 w-full h-full flex flex-col max-w-lg mx-auto mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ ...motionTokens.spring.smooth, duration: 0.3 }}
              className="w-full"
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full mt-auto relative z-10 flex flex-col gap-6 pt-8 border-t border-white/5">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-3 relative h-6 overflow-hidden min-w-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id + "-title"}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 absolute left-0 whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-white">
                    {current.title}
                  </span>
                  <span className="text-xs border border-white/10 px-2 py-0.5 rounded-md text-zinc-400 bg-white/5">
                    {current.tag}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 text-zinc-500">
              <Button
                onClick={prevSlide}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full w-8 h-8 p-0 flex items-center justify-center"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </Button>
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full w-8 h-8 p-0 flex items-center justify-center"
              >
                {isPlaying ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </Button>
              <Button
                onClick={nextSlide}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full w-8 h-8 p-0 flex items-center justify-center"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Button>
            </div>
          </div>

          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            {isPlaying && (
              <motion.div
                key={current.id}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
