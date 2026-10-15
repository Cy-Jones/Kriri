import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import { Avatar } from "../registry/components/avatar/avatar";
import { AvatarGroup } from "../registry/components/avatar-group/avatar-group";
import { Badge } from "../registry/components/badge/badge";
import { Progress } from "../registry/components/progress/progress";
import { Stack, Plot, Relay, Branches, Terminal } from "@lucasmarkes/hairline/react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  Sparkles,
  CheckCircle2,
  GitPullRequest,
} from "lucide-react";

export function AuthShowcase() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "Lead",
      status: "online",
      localTime: "9:42 AM",
    },
    {
      name: "Alex Vance",
      role: "Staff Engineer",
      status: "online",
      localTime: "5:18 PM",
    },
    {
      name: "Elena Rostova",
      role: "Lead",
      status: "offline",
      localTime: "2:34 AM",
    },
    {
      name: "Dev Patel",
      role: "Systems Engineer",
      status: "offline",
      localTime: "11:05 AM",
    },
  ];

  const slides = [
    {
      id: "board",
      title: "Sprint Board",
      content: (
        <div className="flex flex-col gap-3.5 xl:gap-6">
          {/* Slide Header - Vertically Centered */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3.5 xl:gap-4">
              <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-xl xl:rounded-2xl bg-white/[0.04] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 shadow-inner text-zinc-300 select-none">
                <Stack theme="dark" intensity={0.85} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-lg xl:text-xl font-medium text-white font-display tracking-tight leading-tight">
                  Active Sprint 24
                </h3>
                <p className="text-[11px] xl:text-xs text-zinc-400 mt-0.5">
                  Core Engine & Synchronization
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <AvatarGroup size="sm" max={3} members={teamMembers} />
            </div>
          </div>

          {/* Sprint Progress Meter using Arc Progress */}
          <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2 xl:gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Sprint Completion</span>
              <span className="text-zinc-200 font-mono">8 of 12 issues</span>
            </div>
            <Progress value={67} size="sm" showValue={false} />
          </div>

          {/* Work Items */}
          <div className="flex flex-col gap-2.5 xl:gap-3.5">
            {/* Card 1 */}
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 transition-all duration-200 flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs sm:text-sm font-medium text-white">
                  Realtime WebSocket Sync Layer
                </span>
                <Badge tone="info" size="sm">In Progress</Badge>
              </div>
              <div className="flex justify-between items-center text-[11px] xl:text-xs text-zinc-500 pt-1.5 xl:pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">KRI-42</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Clock size={11} /> Due tomorrow
                  </span>
                </div>
                <Avatar name="Alex Vance" size="xs" status="online" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 transition-all duration-200 flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs sm:text-sm font-medium text-white">
                  Atomic State & Conflict Resolution
                </span>
                <Badge tone="warning" size="sm">In Review</Badge>
              </div>
              <div className="flex justify-between items-center text-[11px] xl:text-xs text-zinc-500 pt-1.5 xl:pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">KRI-39</span>
                  <span>•</span>
                  <span className="text-zinc-400">2 approvals needed</span>
                </div>
                <Avatar name="Sarah Chen" size="xs" status="online" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.02] border border-white/[0.05] opacity-75 hover:opacity-100 transition-opacity flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs sm:text-sm font-medium text-zinc-300">
                  Clerk Auth & Session Hardening
                </span>
                <Badge tone="success" size="sm">Done</Badge>
              </div>
              <div className="flex justify-between items-center text-[11px] xl:text-xs text-zinc-500 pt-1.5 xl:pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">KRI-35</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Merged to main
                  </span>
                </div>
                <Avatar name="Dev Patel" size="xs" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "timeline",
      title: "Roadmap",
      content: (
        <div className="flex flex-col gap-3.5 xl:gap-6">
          {/* Slide Header - Vertically Centered with Badge Text */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3.5 xl:gap-4">
              <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-xl xl:rounded-2xl bg-white/[0.04] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 shadow-inner text-zinc-300 select-none">
                <Plot theme="dark" intensity={0.85} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-lg xl:text-xl font-medium text-white font-display tracking-tight leading-tight">
                  Q4 Engineering Roadmap
                </h3>
                <p className="text-[11px] xl:text-xs text-zinc-400 mt-0.5">
                  Critical path & release milestones
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Badge tone="info" size="sm">On Schedule</Badge>
            </div>
          </div>

          {/* Timeline Nodes */}
          <div className="flex flex-col gap-2.5 xl:gap-4 relative mt-1">
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    Database Sharding & Read Replicas
                  </span>
                </div>
                <span className="text-[11px] xl:text-xs font-mono text-zinc-400">Oct 12 – 26</span>
              </div>
              <Progress value={94} size="sm" showValue />
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    Public GraphQL & Webhook Gateway
                  </span>
                </div>
                <span className="text-[11px] xl:text-xs font-mono text-zinc-400">Nov 02 – 18</span>
              </div>
              <Progress value={52} size="sm" showValue />
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.02] border border-white/[0.05] border-dashed flex flex-col gap-2 xl:gap-3 opacity-75">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-300">
                    Multi-Region Edge Routing
                  </span>
                </div>
                <Badge tone="neutral" size="sm">Upcoming</Badge>
              </div>
              <div className="text-[11px] xl:text-xs text-zinc-500">
                Scheduled for Q4 release window · Planning phase complete
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "inbox",
      title: "Live Stream",
      content: (
        <div className="flex flex-col gap-3.5 xl:gap-6">
          {/* Slide Header - Vertically Centered with Live Pill */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3.5 xl:gap-4">
              <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-xl xl:rounded-2xl bg-white/[0.04] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 shadow-inner text-zinc-300 select-none">
                <Relay theme="dark" intensity={0.85} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-lg xl:text-xl font-medium text-white font-display tracking-tight leading-tight">
                  Activity Telemetry
                </h3>
                <p className="text-[11px] xl:text-xs text-zinc-400 mt-0.5">
                  Live mentions & deployments
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Activity Items */}
          <div className="flex flex-col gap-2.5 xl:gap-3.5">
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex gap-3 xl:gap-3.5 items-start">
              <Avatar name="Sarah Chen" size="sm" status="online" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white font-medium">Sarah Chen</strong> mentioned you
                  </span>
                  <span className="text-[10px] xl:text-[11px] text-zinc-500 font-mono">2m ago</span>
                </div>
                <div className="text-[11px] xl:text-xs text-zinc-300 bg-white/[0.03] border border-white/[0.06] rounded-lg xl:rounded-xl p-2 xl:p-3 mt-1 xl:mt-2">
                  "Can you verify the token refresh backoff logic on branch <span className="font-mono text-zinc-100">feat/reconnect</span>?"
                </div>
              </div>
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex gap-3 xl:gap-3.5 items-start">
              <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Sparkles size={13} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-0.5 xl:mb-1">
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white font-medium">Release v2.4.0</strong> deployed
                  </span>
                  <Badge tone="success" size="sm">Passed</Badge>
                </div>
                <p className="text-[11px] xl:text-xs text-zinc-400 mt-0.5 xl:mt-1">
                  Passed all 128 integration tests · Production edge verified (48ms p99)
                </p>
              </div>
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.02] border border-white/[0.05] flex gap-3 xl:gap-3.5 items-start opacity-75 hover:opacity-100 transition-opacity">
              <Avatar name="Alex Vance" size="sm" status="online" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-0.5 xl:mb-1">
                  <span className="text-xs sm:text-sm text-zinc-200">
                    <strong className="text-white font-medium">Alex Vance</strong> approved pull request
                  </span>
                  <span className="text-[10px] xl:text-[11px] text-zinc-500 font-mono">18m ago</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] xl:text-xs text-zinc-400 mt-0.5 xl:mt-1">
                  <GitPullRequest size={12} className="text-indigo-400" />
                  <span className="font-mono">PR #128: Batch mutation endpoints</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "pull-requests",
      title: "Pull Requests",
      content: (
        <div className="flex flex-col gap-3.5 xl:gap-6">
          {/* Slide Header - Vertically Centered */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3.5 xl:gap-4">
              <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-xl xl:rounded-2xl bg-white/[0.04] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 shadow-inner text-zinc-300 select-none">
                <Branches theme="dark" intensity={0.85} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-lg xl:text-xl font-medium text-white font-display tracking-tight leading-tight">
                  Pull Requests
                </h3>
                <p className="text-[11px] xl:text-xs text-zinc-400 mt-0.5">
                  Code reviews & branch integration
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Badge tone="info" size="sm">4 Active</Badge>
            </div>
          </div>

          {/* PR Items */}
          <div className="flex flex-col gap-2.5 xl:gap-3.5">
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2">
                  <GitPullRequest size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    feat(sync): differential state updates
                  </span>
                </div>
                <Badge tone="success" size="sm">Approved</Badge>
              </div>
              <div className="flex justify-between items-center text-[11px] xl:text-xs text-zinc-500 pt-1.5 xl:pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">#142</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> 32 tests passing
                  </span>
                </div>
                <Avatar name="Sarah Chen" size="xs" status="online" />
              </div>
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2">
                  <GitPullRequest size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    perf(db): connection pool optimization
                  </span>
                </div>
                <Badge tone="warning" size="sm">In Review</Badge>
              </div>
              <div className="flex justify-between items-center text-[11px] xl:text-xs text-zinc-500 pt-1.5 xl:pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">#139</span>
                  <span>•</span>
                  <span className="text-zinc-400">1 review requested</span>
                </div>
                <Avatar name="Alex Vance" size="xs" status="online" />
              </div>
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.02] border border-white/[0.05] opacity-75 hover:opacity-100 transition-opacity flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2">
                  <GitPullRequest size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-300">
                    chore: upgrade motion tokens v2
                  </span>
                </div>
                <Badge tone="neutral" size="sm">Draft</Badge>
              </div>
              <div className="flex justify-between items-center text-[11px] xl:text-xs text-zinc-500 pt-1.5 xl:pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">#137</span>
                  <span>•</span>
                  <span className="text-zinc-500">Updated 2h ago</span>
                </div>
                <Avatar name="Dev Patel" size="xs" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "telemetry",
      title: "System Health",
      content: (
        <div className="flex flex-col gap-3.5 xl:gap-6">
          {/* Slide Header - Vertically Centered */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3.5 xl:gap-4">
              <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-xl xl:rounded-2xl bg-white/[0.04] border border-white/[0.08] p-1 flex items-center justify-center shrink-0 shadow-inner text-zinc-300 select-none">
                <Terminal theme="dark" intensity={0.85} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-lg xl:text-xl font-medium text-white font-display tracking-tight leading-tight">
                  Edge Telemetry
                </h3>
                <p className="text-[11px] xl:text-xs text-zinc-400 mt-0.5">
                  Global clusters & SLA compliance
                </p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Badge tone="success" size="sm">99.98% Uptime</Badge>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="flex flex-col gap-2.5 xl:gap-3.5">
            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span className="text-xs sm:text-sm font-medium text-white">US-East Region Edge</span>
                </div>
                <span className="text-[11px] xl:text-xs font-mono text-zinc-400">18ms p95</span>
              </div>
              <Progress value={96} size="sm" showValue={false} />
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span className="text-xs sm:text-sm font-medium text-white">EU-Central Gateway</span>
                </div>
                <span className="text-[11px] xl:text-xs font-mono text-zinc-400">24ms p95</span>
              </div>
              <Progress value={92} size="sm" showValue={false} />
            </div>

            <div className="p-3 xl:p-4.5 sm:p-5 rounded-xl xl:rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col gap-2 xl:gap-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span className="text-xs sm:text-sm font-medium text-white">AP-East Edge Cache</span>
                </div>
                <span className="text-[11px] xl:text-xs font-mono text-zinc-400">32ms p95</span>
              </div>
              <Progress value={88} size="sm" showValue={false} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const totalSlides = slides.length;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((s) => (s + 1) % totalSlides);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, totalSlides]);

  const nextSlide = () => {
    setActiveSlide((s) => (s + 1) % totalSlides);
    setIsPlaying(false);
  };

  const prevSlide = () => {
    setActiveSlide((s) => (s - 1 + totalSlides) % totalSlides);
    setIsPlaying(false);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const current = slides[activeSlide];

  return (
    <div className="hidden lg:flex lg:w-1/2 p-3 xl:p-4">
      <div className="w-full h-full bg-[#0a0a0a] border border-white/10 rounded-2xl xl:rounded-3xl relative overflow-hidden flex flex-col justify-between p-5 lg:p-6 xl:p-10">
        {/* Clean subtle dot grid without colored blur glows */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Main Showcase Stage */}
        <div className="relative z-10 w-full flex-1 flex flex-col justify-center py-2 xl:py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ ...motionTokens.spring.smooth, duration: 0.28 }}
              className="w-full max-w-2xl mx-auto"
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Controls & Segmented Progress */}
        <div className="w-full relative z-10 flex flex-col gap-3 xl:gap-5 pt-3 xl:pt-5 border-t border-white/[0.06]">
          <div className="w-full flex justify-between items-center">
            {/* Title only - Lower pill removed per user request */}
            <span className="text-xs xl:text-sm font-medium text-white font-display">
              {current.title}
            </span>

            {/* Carousel Controls */}
            <div className="flex items-center gap-1.5 text-zinc-400">
              <button
                onClick={prevSlide}
                aria-label="Previous slide"
                className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg xl:rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-white transition-all flex items-center justify-center active:scale-95"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
                className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg xl:rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-white transition-all flex items-center justify-center active:scale-95"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next slide"
                className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg xl:rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-white transition-all flex items-center justify-center active:scale-95"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Segmented Progress Bars (5 items) */}
          <div className="grid grid-cols-5 gap-1.5 xl:gap-2 w-full">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => {
                  setActiveSlide(idx);
                  setIsPlaying(false);
                }}
                className="h-1 rounded-full bg-white/[0.08] overflow-hidden cursor-pointer relative"
              >
                {activeSlide === idx && isPlaying ? (
                  <motion.div
                    key={`bar-${activeSlide}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                    className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  />
                ) : activeSlide > idx || (activeSlide === idx && !isPlaying) ? (
                  <div className="h-full w-full bg-white/70" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthShowcase;
