import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useUser, useOrganization } from "@clerk/clerk-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Cpu,
  Smartphone,
  X,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PageLoading from "../components/PageLoading";
import TaskDetailsModal from "../components/TaskDetailsModal";
import { Plot as Chart } from "@lucasmarkes/hairline/react";
import { useTheme } from "../contexts/ThemeContext";

export default function Analytics() {
  const navigate = useNavigate();
  const { effectiveTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30 days");
  const [velocityMetric, setVelocityMetric] = useState("completed"); // "completed" | "created" | "shipped"
  const [velocityDrilldownView, setVelocityDrilldownView] = useState("tasks"); // "tasks" | "projects"
  const [selectedVelocityDate, setSelectedVelocityDate] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [expandedBracket, setExpandedBracket] = useState(null); // "completed" | "inProgress" | "atRisk" | null
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  useEffect(() => {
    setSelectedVelocityDate(null);
  }, [timeRange, velocityMetric]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/workspaces/current/analytics");
      setData(res);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await fetchAnalytics();
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded && user) {
      init();
    }
  }, [organization?.id, isLoaded, user?.id]);

  // Real velocity data from backend database aggregation
  const velocityData = useMemo(() => {
    if (data?.velocity?.[timeRange]?.length) {
      return data.velocity[timeRange];
    }
    return [];
  }, [data, timeRange]);

  // Derive stats directly from real database metrics
  const completedIssuesCount = data?.stats?.completedIssues ?? 0;
  const totalIssuesCount = data?.stats?.totalIssues ?? 0;
  const activeIssuesCount = data?.stats?.activeIssues ?? 0;
  const overdueTasksCount = String(data?.stats?.overdueIssues ?? 0).padStart(2, "0");
  const onTimeDeliveryRate = data?.stats?.onTimeDelivery ?? 0;
  const taskChangePct = data?.stats?.taskChangePct ?? 0;

  const totalProjectsCount = data?.projectHealth?.totalProjects ?? 0;
  const activeProjectsCount = data?.stats?.activeProjects ?? 0;
  const onTrackProjectsCount = data?.projectHealth?.onTrack ?? 0;
  const atRiskProjectsCount = data?.projectHealth?.atRisk ?? 0;
  const offTrackProjectsCount = data?.projectHealth?.offTrack ?? 0;
  const completedProjectsCount = data?.projectHealth?.completed ?? 0;
  const overallCompletionRate = data?.projectHealth?.overallCompletion ?? 0;
  const newProjectsCount = data?.stats?.newProjectsThisPeriod ?? 0;

  // Real projects to watch from active workspace
  const projectsToWatch = data?.projectsToWatch || [];

  // Dynamic sum for the active metric across the selected time period
  const velocityTitleStat = useMemo(() => {
    if (!velocityData.length) {
      return velocityMetric === "completed"
        ? completedIssuesCount
        : velocityMetric === "created"
          ? totalIssuesCount
          : completedProjectsCount;
    }
    return velocityData.reduce(
      (acc, curr) => acc + (curr[velocityMetric] || 0),
      0,
    );
  }, [velocityData, velocityMetric, completedIssuesCount, totalIssuesCount, completedProjectsCount]);

  const selectedVelocityBucket = useMemo(() => {
    if (!selectedVelocityDate || !velocityData.length) return null;
    return velocityData.find((b) => b.date === selectedVelocityDate) || null;
  }, [velocityData, selectedVelocityDate]);

  const handleBarClick = (date) => {
    if (!date) return;
    setSelectedVelocityDate((prev) => (prev === date ? null : date));
  };

  if (loading) {
    return <PageLoading label="Analytics" />;
  }

  const hasData = data && (totalProjectsCount > 0 || totalIssuesCount > 0);

  if (!hasData) {
    return (
      <div className="w-full flex flex-col h-full animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 min-h-[38px]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
              className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-black/[0.06] dark:text-[#8a8f98] dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
              Analytics
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
            <Chart theme={effectiveTheme} intensity={0.7} className="w-full h-full text-zinc-500 dark:text-[#8a8f98] opacity-80" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
              No analytics data yet
            </h2>
            <p className="text-[14px] text-zinc-500 dark:text-text-muted leading-relaxed">
              Once you start creating projects, issues, and tracking progress in this workspace, your velocity and completion insights will appear here.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => navigate("/projects")}
              className="h-8 px-4 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-md font-medium text-[13px] hover:bg-zinc-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
            >
              Go to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-full md:h-full min-w-0 animate-in fade-in duration-300 select-none text-zinc-900 dark:text-[#e8e8e8]">
      {/* 1. PAGE HEADER */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 flex-shrink-0 min-h-[38px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
            className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-black/[0.06] dark:text-[#8a8f98] dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
            Analytics
          </h1>
        </div>

        {/* Time range switcher to the far right, matching header button size */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm shrink-0">
          {[
            { value: "7 days", label: "7 days", mobileLabel: "7d" },
            { value: "30 days", label: "30 days", mobileLabel: "30d" },
            { value: "90 days", label: "90 days", mobileLabel: "90d" },
          ].map((range) => {
            const isActive = timeRange === range.value;
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => setTimeRange(range.value)}
                className={`relative text-[11px] sm:text-[12px] px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="timeRangeActivePill"
                    className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-full shadow-xs pointer-events-none"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 hidden sm:inline">{range.label}</span>
                <span className="relative z-10 sm:hidden">{range.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="w-full md:flex-1 md:overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-6 sm:pb-16">
          {/* 4 TOP KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Tasks completed */}
            <div className="p-4 sm:p-5.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col justify-between hover:border-black/15 dark:hover:border-white/15 hover:bg-zinc-50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
              <div>
                <div className="text-[13px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                  Tasks completed
                </div>
                <div className="text-2xl sm:text-[28px] font-semibold text-zinc-900 dark:text-white tracking-tight mt-0.5">
                  {completedIssuesCount}
                </div>
                {taskChangePct !== 0 ? (
                  <div className={`text-[12px] ${taskChangePct >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"} font-medium flex items-center gap-1 mt-1`}>
                    {taskChangePct >= 0 ? <ArrowUp size={11} strokeWidth={2.5} /> : <ArrowDown size={11} strokeWidth={2.5} />}
                    <span>{Math.abs(taskChangePct)}% vs previous period</span>
                  </div>
                ) : (
                  <div className="text-[12px] text-zinc-500 dark:text-[#8a8f98] font-medium flex items-center gap-1 mt-1">
                    <span>No change vs previous period</span>
                  </div>
                )}
              </div>
              {/* Clear Context Progress */}
              <div className="flex flex-col gap-1.5 mt-5">
                <div className="flex items-center justify-between text-[12px] text-zinc-500 dark:text-[#8a8f98]">
                  <span>
                    {completedIssuesCount} of {totalIssuesCount} total
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-white font-medium">
                    {totalIssuesCount > 0
                      ? Math.round(
                          (completedIssuesCount / totalIssuesCount) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${totalIssuesCount > 0 ? Math.round((completedIssuesCount / totalIssuesCount) * 100) : 0}%`,
                    }}
                    className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-700 ease-out"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Active projects */}
            <div className="p-4 sm:p-5.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col justify-between hover:border-black/15 dark:hover:border-white/15 hover:bg-zinc-50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
              <div>
                <div className="text-[13px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                  Active projects
                </div>
                <div className="text-2xl sm:text-[28px] font-semibold text-zinc-900 dark:text-white tracking-tight mt-0.5">
                  {activeProjectsCount}
                </div>
                <div className="text-[12px] text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <ArrowUp size={11} strokeWidth={2.5} />
                  <span>{newProjectsCount} new in this period</span>
                </div>
              </div>
              {/* Clear Context Progress */}
              <div className="flex flex-col gap-1.5 mt-5">
                <div className="flex items-center justify-between text-[12px] text-zinc-500 dark:text-[#8a8f98]">
                  <span>
                    {activeProjectsCount} of {totalProjectsCount} projects
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-white font-medium">
                    {totalProjectsCount > 0
                      ? Math.round(
                          (activeProjectsCount / totalProjectsCount) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${totalProjectsCount > 0 ? Math.round((activeProjectsCount / totalProjectsCount) * 100) : 0}%`,
                    }}
                    className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-700 ease-out"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: On-time delivery */}
            <div className="p-4 sm:p-5.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col justify-between hover:border-black/15 dark:hover:border-white/15 hover:bg-zinc-50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
              <div>
                <div className="text-[13px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                  On-time delivery
                </div>
                <div className="text-2xl sm:text-[28px] font-semibold text-zinc-900 dark:text-white tracking-tight mt-0.5">
                  {onTimeDeliveryRate}%
                </div>
                {completedIssuesCount > 0 ? (
                  <div className="text-[12px] text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                    <ArrowUp size={11} strokeWidth={2.5} />
                    <span>{onTimeDeliveryRate >= 90 ? "Exceeding benchmark" : "Below benchmark"}</span>
                  </div>
                ) : (
                  <div className="text-[12px] text-zinc-500 dark:text-[#8a8f98] font-medium flex items-center gap-1 mt-1">
                    <span>Based on completed tasks</span>
                  </div>
                )}
              </div>
              {/* Clear Context Progress */}
              <div className="flex flex-col gap-1.5 mt-5">
                <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] text-zinc-500 dark:text-[#8a8f98]">
                  <span>Target: 90.0% benchmark</span>
                  <span className={`font-mono font-medium ${onTimeDeliveryRate >= 90 ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-500 dark:text-[#8a8f98]"}`}>
                    {completedIssuesCount > 0 ? (onTimeDeliveryRate >= 90 ? "Exceeding" : "On track") : "-"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, onTimeDeliveryRate)}%` }}
                    className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-700 ease-out"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Overdue tasks */}
            <div className="p-4 sm:p-5.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col justify-between hover:border-black/15 dark:hover:border-white/15 hover:bg-zinc-50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
              <div>
                <div className="text-[13px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                  Overdue tasks
                </div>
                <div className="text-2xl sm:text-[28px] font-semibold text-zinc-900 dark:text-white tracking-tight mt-0.5">
                  {overdueTasksCount}
                </div>
                <div className={`text-[12px] font-medium flex items-center gap-1 mt-1 ${parseInt(overdueTasksCount) > 0 ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                  {parseInt(overdueTasksCount) > 0 ? (
                    <span>Requires attention</span>
                  ) : (
                    <span>No overdue tasks</span>
                  )}
                </div>
              </div>
              {/* Clear Context Progress */}
              <div className="flex flex-col gap-1.5 mt-5">
                <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] text-zinc-500 dark:text-[#8a8f98]">
                  <span>
                    {overdueTasksCount} of {activeIssuesCount} active
                  </span>
                  <span className="font-mono text-[#f87171] font-medium">
                    {activeIssuesCount > 0
                      ? Math.round(
                          ((parseInt(overdueTasksCount) || 0) /
                            activeIssuesCount) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${activeIssuesCount > 0 ? Math.min(100, Math.round(((parseInt(overdueTasksCount) || 0) / activeIssuesCount) * 100)) : 0}%`,
                    }}
                    className="h-full bg-[#f87171] rounded-full transition-all duration-700 ease-out"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN VELOCITY CHART CARD */}
          <div className="p-4 sm:p-6.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col gap-4 sm:gap-5 hover:border-black/15 dark:hover:border-white/12 hover:bg-zinc-50/50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
            {/* Header & Big Stat Row */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Work velocity
                  </h2>
                  <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98] mt-0.5 hidden sm:block">
                    Velocity trend and distribution across this interval
                  </p>
                </div>

                {/* Big Stat on Right */}
                <div className="text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">
                    {velocityTitleStat}
                  </div>
                  {taskChangePct !== 0 ? (
                    <div
                      className={`text-[11px] font-medium flex items-center justify-end gap-1 mt-1 ${
                        taskChangePct >= 0
                          ? "text-emerald-500 dark:text-emerald-400"
                          : "text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {taskChangePct >= 0 ? (
                        <ArrowUp size={11} strokeWidth={2.5} />
                      ) : (
                        <ArrowDown size={11} strokeWidth={2.5} />
                      )}
                      <span>{Math.abs(taskChangePct)}% vs prior</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-500 dark:text-[#8a8f98] font-medium flex items-center justify-end gap-1 mt-1">
                      <span>Steady vs prior</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Switcher Pills: balanced 3-column segmented control on mobile, flex on desktop */}
              <div className="w-full sm:w-fit grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl sm:rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] relative">
                {[
                  {
                    id: "completed",
                    label: "Tasks completed",
                    mobileLabel: "Completed",
                  },
                  {
                    id: "created",
                    label: "Tasks created",
                    mobileLabel: "Created",
                  },
                  {
                    id: "shipped",
                    label: "Projects completed",
                    mobileLabel: "Projects",
                  },
                ].map((tab) => {
                  const isActive = velocityMetric === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVelocityMetric(tab.id)}
                      className={`relative text-[11px] sm:text-[11.5px] px-2 sm:px-3.5 py-1.5 rounded-lg sm:rounded-full font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                        isActive
                          ? "text-zinc-900 dark:text-white font-semibold"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="velocityMetricActivePill"
                          className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-lg sm:rounded-full shadow-xs pointer-events-none"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-1.5 truncate">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white shadow-[0_0_6px_rgba(0,0,0,0.3)] dark:shadow-[0_0_6px_rgba(255,255,255,0.8)] shrink-0" />
                        )}
                        <span className="hidden sm:inline whitespace-nowrap">
                          {tab.label}
                        </span>
                        <span className="sm:hidden truncate">
                          {tab.mobileLabel}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recharts Bar Chart with Soft Rounded Bar Tops & Fluid Animation */}
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={velocityData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                  barCategoryGap="20%"
                  onClick={(state) => {
                    if (state?.activeLabel) {
                      handleBarClick(state.activeLabel);
                    } else if (state?.activePayload?.[0]?.payload?.date) {
                      handleBarClick(state.activePayload[0].payload.date);
                    }
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={effectiveTheme === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.06)"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: effectiveTheme === "dark" ? "#8a8f98" : "#71717a", fontSize: 11 }}
                    stroke={effectiveTheme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)"}
                    tickLine={false}
                    axisLine={{ stroke: effectiveTheme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)" }}
                    dy={6}
                  />
                  <YAxis
                    tick={{ fill: effectiveTheme === "dark" ? "#8a8f98" : "#71717a", fontSize: 11 }}
                    stroke={effectiveTheme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)"}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    cursor={{ fill: effectiveTheme === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const val = item[velocityMetric];
                        return (
                          <div className="bg-white dark:bg-[#1c1d22]/95 border border-black/10 dark:border-white/10 rounded-2xl px-3.5 py-2.5 shadow-xl flex flex-col gap-0.5 backdrop-blur-md">
                            <span className="text-[11px] font-mono text-zinc-500 dark:text-[#8a8f98]">
                              {item.date}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13.5px] font-bold text-zinc-900 dark:text-white">
                                {val}
                              </span>
                              <span className="text-[11px] text-zinc-500 dark:text-[#8a8f98] capitalize">
                                {velocityMetric}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
                              {item.isCurrent
                                ? "● Current period"
                                : "● Previous pace"}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-[#8a8f98]/80 mt-1 pt-1 border-t border-black/5 dark:border-white/[0.08]">
                              Click bar to inspect details
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={velocityMetric}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                    animationDuration={600}
                    animationEasing="ease-out"
                    isAnimationActive={true}
                    onClick={(entry) => {
                      if (entry?.date) handleBarClick(entry.date);
                    }}
                  >
                    {velocityData.map((entry, index) => {
                      const isSelected =
                        selectedVelocityBucket?.date === entry.date;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            isSelected
                              ? (effectiveTheme === "dark" ? "#ffffff" : "#09090b")
                              : entry.isCurrent
                              ? (effectiveTheme === "dark" ? "#e4e6eb" : "#27272a")
                              : (effectiveTheme === "dark" ? "#3b3e47" : "#e4e4e7")
                          }
                          stroke={isSelected ? "#5e6ad2" : "none"}
                          strokeWidth={isSelected ? 2 : 0}
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            handleBarClick(entry.date);
                          }}
                          className="transition-colors duration-300 hover:opacity-85 cursor-pointer"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Chart Legend & Interaction Hint */}
            <div className="flex items-center justify-between text-[11.5px] text-zinc-500 dark:text-[#8a8f98] pt-1">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-[#e4e6eb]" />
                  <span>Current period</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-[#3b3e47]" />
                  <span>Previous period</span>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 dark:text-[#8a8f98]/70 hidden sm:inline">
                Click any bar to inspect projects or tasks
              </span>
            </div>

            {/* Selected Velocity Bucket Drilldown with Smooth AnimatePresence */}
            <AnimatePresence>
              {selectedVelocityBucket &&
                (() => {
                  const bucketProjects =
                    selectedVelocityBucket.details?.[velocityMetric] || [];
                  const bucketTasks =
                    selectedVelocityBucket.details?.[
                      velocityMetric === "completed"
                        ? "completedTasks"
                        : "createdTasks"
                    ] || [];
                  const metricLabel =
                    velocityMetric === "shipped"
                      ? "Projects Completed"
                      : velocityMetric === "created"
                      ? "Tasks Created"
                      : "Tasks Completed";

                  return (
                    <motion.div
                      key={`drilldown-${selectedVelocityBucket.date}`}
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-black/[0.08] dark:border-white/[0.08] flex flex-col gap-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Date and Count Label on the left + Mobile Close button */}
                          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white font-medium shrink-0">
                                {selectedVelocityBucket.date}
                              </span>
                              <span className="text-[12px] sm:text-[13px] font-semibold text-zinc-900 dark:text-white truncate">
                                {selectedVelocityBucket[velocityMetric]} {metricLabel}
                              </span>
                            </div>

                            {/* Mobile-only close button */}
                            <button
                              type="button"
                              onClick={() => setSelectedVelocityDate(null)}
                              className="sm:hidden p-1 text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                              title="Close details"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {/* Sub-tab switcher + Desktop Close button */}
                          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                            {velocityMetric !== "shipped" ? (
                              <div className="grid grid-cols-2 sm:flex items-center bg-black/[0.04] dark:bg-white/[0.04] p-0.5 rounded-lg sm:rounded-full border border-black/10 dark:border-white/10 relative w-full sm:w-auto">
                                {[
                                  {
                                    id: "tasks",
                                    label: `Tasks (${bucketTasks.length})`,
                                  },
                                  {
                                    id: "projects",
                                    label: `By Project (${bucketProjects.length})`,
                                  },
                                ].map((subTab) => {
                                  const isSubActive =
                                    velocityDrilldownView === subTab.id;
                                  return (
                                    <button
                                      key={subTab.id}
                                      type="button"
                                      onClick={() =>
                                        setVelocityDrilldownView(subTab.id)
                                      }
                                      className={`relative px-2.5 py-1 sm:px-3 text-[11px] rounded-md sm:rounded-full font-medium transition-colors cursor-pointer text-center justify-center shrink-0 whitespace-nowrap ${
                                        isSubActive
                                          ? "text-zinc-900 dark:text-white font-semibold"
                                          : "text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white"
                                      }`}
                                    >
                                      {isSubActive && (
                                        <motion.div
                                          layoutId="velocityDrilldownSubPill"
                                          className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-md sm:rounded-full shadow-xs pointer-events-none"
                                          transition={{
                                            type: "spring",
                                            stiffness: 450,
                                            damping: 35,
                                          }}
                                        />
                                      )}
                                      <span className="relative z-10">
                                        {subTab.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[11px] sm:text-[11.5px] text-zinc-500 dark:text-[#8a8f98] whitespace-nowrap">
                                ({bucketProjects.length}{" "}
                                {bucketProjects.length === 1
                                  ? "project"
                                  : "projects"}
                                )
                              </span>
                            )}

                            {/* Desktop-only close button */}
                            <button
                              type="button"
                              onClick={() => setSelectedVelocityDate(null)}
                              className="hidden sm:flex p-1 text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                              title="Close details"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04] max-h-56 overflow-y-auto scrollbar-hide mt-1">
                          {velocityMetric !== "shipped" &&
                          velocityDrilldownView === "tasks" ? (
                            bucketTasks.length === 0 ? (
                              <div className="text-[12px] text-zinc-500 dark:text-[#8a8f98] py-2 px-1">
                                No tasks recorded for this metric in this interval.
                              </div>
                            ) : (
                              bucketTasks.map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedTaskId(task.id)}
                                  className="flex items-center justify-between py-2.5 px-3 -mx-1.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:border-black/10 dark:hover:border-white/10 border border-transparent transition-all duration-200 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                    <CheckCircle2
                                      size={13}
                                      className={`shrink-0 ${
                                        velocityMetric === "completed"
                                          ? "text-emerald-500 dark:text-emerald-400"
                                          : "text-[#5e6ad2]"
                                      }`}
                                    />
                                    <span className="font-mono text-[11px] text-zinc-500 dark:text-[#8a8f98] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors tracking-tight shrink-0">
                                      {task.taskIdentifier}
                                    </span>
                                    <span className="text-[12.5px] font-medium text-zinc-800 dark:text-white/90 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                      {task.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-[11px] text-zinc-500 dark:text-[#8a8f98] px-2 py-0.5 rounded-md bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] hidden sm:inline-block max-w-[160px] truncate">
                                      {task.projectName}
                                    </span>
                                    <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-md text-zinc-500 dark:text-[#8a8f98] bg-black/[0.03] dark:bg-white/[0.03]">
                                      {task.priority}
                                    </span>
                                    <ArrowUpRight
                                      size={12}
                                      className="text-zinc-400 dark:text-[#8a8f98]/60 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                                    />
                                  </div>
                                </div>
                              ))
                            )
                          ) : bucketProjects.length === 0 ? (
                            <div className="text-[12px] text-zinc-500 dark:text-[#8a8f98] py-2 px-1">
                              No projects recorded for this metric in this interval.
                            </div>
                          ) : (
                            bucketProjects.map((proj) => (
                              <div
                                key={proj.id}
                                onClick={() => navigate(`/projects/${proj.id}`)}
                                className="flex items-center justify-between py-2.5 px-3 -mx-1.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:border-black/10 dark:hover:border-white/10 border border-transparent transition-all duration-200 cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2] shrink-0" />
                                  <span className="font-mono text-[11px] text-zinc-500 dark:text-[#8a8f98] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors tracking-tight shrink-0">
                                    {proj.identifier || `P-${proj.id}`}
                                  </span>
                                  <span className="text-[12.5px] font-medium text-zinc-800 dark:text-white/90 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                    {proj.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  {velocityMetric !== "shipped" && proj.count && (
                                    <span className="text-[11px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                                      {proj.count}{" "}
                                      {proj.count === 1 ? "task" : "tasks"}
                                    </span>
                                  )}
                                  <div className="w-14 h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full overflow-hidden hidden sm:block">
                                    <div
                                      style={{ width: `${proj.progress || 0}%` }}
                                      className="h-full bg-zinc-900 dark:bg-white/80 rounded-full"
                                    />
                                  </div>
                                  <span className="text-[11px] font-mono text-zinc-500 dark:text-[#8a8f98] w-8 text-right">
                                    {proj.progress || 0}%
                                  </span>
                                  <ArrowUpRight
                                    size={12}
                                    className="text-zinc-400 dark:text-[#8a8f98]/60 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>

          {/* 3. BOTTOM SECTION: PROJECT HEALTH & PROJECTS TO WATCH */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Card A: Project Health */}
            <div className="p-5 sm:p-6.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col justify-between hover:border-black/15 dark:hover:border-white/12 hover:bg-zinc-50/50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
              <div>
                {/* Header */}
                <div>
                  <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Project health
                  </h3>
                  <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98] mt-0.5">
                    Overall completion
                  </p>
                  <div className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight mt-1.5">
                    {overallCompletionRate}%
                  </div>
                </div>

                {/* Progress Breakdown Rows with Clickable Drilldown */}
                <div className="flex flex-col gap-4 mt-6">
                  {[
                    {
                      key: "onTrack",
                      label: "On Track",
                      color: "#22c55e",
                      count: onTrackProjectsCount,
                      barColor: "bg-[#22c55e]",
                      barWidth:
                        totalProjectsCount > 0
                          ? Math.round(
                              (onTrackProjectsCount / totalProjectsCount) * 100,
                            )
                          : 0,
                      projects: data?.projectHealth?.brackets?.onTrack || [],
                    },
                    {
                      key: "atRisk",
                      label: "At Risk",
                      color: "#f59e0b",
                      count: atRiskProjectsCount,
                      barColor: "bg-[#f59e0b]",
                      barWidth:
                        totalProjectsCount > 0
                          ? Math.round(
                              (atRiskProjectsCount / totalProjectsCount) * 100,
                            )
                          : 0,
                      projects: data?.projectHealth?.brackets?.atRisk || [],
                    },
                    {
                      key: "offTrack",
                      label: "Off Track",
                      color: "#ef4444",
                      count: offTrackProjectsCount,
                      barColor: "bg-[#ef4444]",
                      barWidth:
                        totalProjectsCount > 0
                          ? Math.round(
                              (offTrackProjectsCount / totalProjectsCount) *
                                100,
                            )
                          : 0,
                      projects: data?.projectHealth?.brackets?.offTrack || [],
                    },
                  ].map((bracket) => {
                    const isExpanded = expandedBracket === bracket.key;
                    return (
                      <div key={bracket.key} className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBracket(isExpanded ? null : bracket.key)
                          }
                          className={`w-full flex items-center justify-between text-[12.5px] p-2.5 -mx-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                            isExpanded
                              ? "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-900 dark:text-white"
                              : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-zinc-800 dark:text-white/90"
                          }`}
                          title={`Click to ${isExpanded ? "hide" : "show"} individual projects`}
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={bracket.color}
                              strokeWidth="2.75"
                              className="shrink-0"
                            >
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {bracket.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                            <span>{bracket.count} projects</span>
                            <ChevronDown
                              size={14}
                              className={`text-zinc-400 dark:text-[#8a8f98] transition-transform duration-250 ease-out ${
                                isExpanded ? "rotate-180 text-zinc-900 dark:text-white" : "rotate-0"
                              }`}
                            />
                          </div>
                        </button>

                        <div className="w-full h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${bracket.barWidth}%` }}
                            className={`h-full ${bracket.barColor} rounded-full transition-all duration-700 ease-out`}
                          />
                        </div>

                        {/* Individual Projects List within that bracket with AnimatePresence */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              key={`health-bracket-${bracket.key}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                duration: 0.28,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04] max-h-56 overflow-y-auto scrollbar-hide border-t border-black/[0.06] dark:border-white/[0.06] pt-1">
                                {bracket.projects.length === 0 ? (
                                  <div className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98] py-2 px-1">
                                    No projects in this bracket.
                                  </div>
                                ) : (
                                  bracket.projects.map((proj) => (
                                    <div
                                      key={proj.id}
                                      onClick={() =>
                                        navigate(`/projects/${proj.id}`)
                                      }
                                      className="flex items-center justify-between py-2.5 px-3 -mx-1.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:border-black/10 dark:hover:border-white/10 border border-transparent transition-all duration-200 cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke={bracket.color}
                                          strokeWidth="2.75"
                                          className="shrink-0"
                                        >
                                          <circle cx="12" cy="12" r="9" />
                                        </svg>
                                        <span className="font-mono text-[11px] text-zinc-500 dark:text-[#8a8f98] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors tracking-tight shrink-0">
                                          {proj.identifier || `P-${proj.id}`}
                                        </span>
                                        <span className="text-[12.5px] font-medium text-zinc-800 dark:text-white/90 truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                          {proj.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2.5 shrink-0">
                                        <div className="flex items-center gap-2">
                                          <div className="w-12 h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full overflow-hidden hidden sm:block">
                                            <div
                                              style={{
                                                width: `${proj.progress || 0}%`,
                                              }}
                                              className={`h-full rounded-full ${bracket.barColor}`}
                                            />
                                          </div>
                                          <span className="text-[11px] font-mono text-zinc-500 dark:text-[#8a8f98] w-7 text-right">
                                            {proj.progress || 0}%
                                          </span>
                                        </div>
                                        <ArrowUpRight
                                          size={12}
                                          className="text-zinc-400 dark:text-[#8a8f98]/60 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                                        />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card B: Projects to watch */}
            <div className="p-5 sm:p-6.5 rounded-xl sm:rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#16171a]/95 flex flex-col justify-between hover:border-black/15 dark:hover:border-white/12 hover:bg-zinc-50/50 dark:hover:bg-[#191a1e] shadow-xs transition-all duration-300">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Projects to watch
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate("/projects")}
                    className="text-xs text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 flex items-center gap-1 group cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowUpRight
                      size={12}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </button>
                </div>

                {/* Project Rows */}
                <div className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {projectsToWatch.length === 0 ? (
                    <div className="text-xs text-zinc-500 dark:text-[#8a8f98] py-4 text-center">
                      No active projects in this workspace yet.
                    </div>
                  ) : (
                    projectsToWatch.slice(0, 3).map((proj, idx) => {
                      const healthNorm = (proj.health || "").toLowerCase();
                      const healthColor = healthNorm.includes("off")
                        ? "#ef4444"
                        : healthNorm.includes("risk")
                        ? "#f59e0b"
                        : "#22c55e";
                      const healthLabel = healthNorm.includes("off")
                        ? "Off Track"
                        : healthNorm.includes("risk")
                        ? "At Risk"
                        : "On Track";

                      return (
                        <div
                          key={proj.id || idx}
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          className="py-3 px-0 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all duration-200 flex flex-col gap-2 group cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-500 dark:text-[#8a8f98] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:border-black/15 dark:group-hover:border-white/15 group-hover:bg-black/[0.06] dark:group-hover:bg-white/[0.08] transition-all shrink-0">
                                {idx === 0 ? (
                                  <Layers size={13} />
                                ) : idx === 1 ? (
                                  <Cpu size={13} />
                                ) : (
                                  <Smartphone size={13} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-medium text-zinc-900 dark:text-white group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate">
                                  {proj.name}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-[#8a8f98] truncate">
                                  {proj.subtitle ||
                                    `${proj.category || "General"} · ${proj.identifier || ""}`}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={healthColor}
                                strokeWidth="2.75"
                                className="shrink-0"
                              >
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                              <span
                                className="text-[11px] font-medium"
                                style={{ color: healthColor }}
                              >
                                {healthLabel}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar & Percentage */}
                          <div className="flex items-center gap-3 pl-[38px]">
                            <div className="flex-1 h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                style={{
                                  width: `${proj.progress || 0}%`,
                                  backgroundColor: healthColor,
                                }}
                                className="h-full rounded-full transition-all duration-700 ease-out"
                              />
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-[#8a8f98] font-mono shrink-0 w-8 text-right">
                              {proj.progress || 0}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        onTaskUpdated={fetchAnalytics}
      />
    </div>
  );
}
