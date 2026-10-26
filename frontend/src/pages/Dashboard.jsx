import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  ArrowUpRight,
  Play,
  Menu,
  TrendingUp,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Users,
  Layers,
  GitBranch,
  Sparkles,
} from "lucide-react";
import { Drawer } from "@lucasmarkes/hairline/react";
import { useNavigate } from "react-router-dom";
import { useUser, useOrganization } from "@clerk/clerk-react";
import CreateProjectModal from "../components/CreateProjectModal";
import { api } from "../lib/api";
import posthog from "../lib/posthog";
import PageLoading from "../components/PageLoading";
import { useTheme } from "../contexts/ThemeContext";

// Arc Components
import { LineChart } from "../registry/components/line-chart/line-chart";
import { Badge } from "../registry/components/badge/badge";
import { Button } from "../registry/components/button/button";
import { Avatar } from "../registry/components/avatar/avatar";
import { Progress } from "../registry/components/progress/progress";
import { motion } from "motion/react";
import { AnimatedCounter } from "../registry/components/animated-counter/animated-counter";

export default function Dashboard() {
  const { effectiveTheme } = useTheme();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const userName = user?.fullName || user?.firstName || "User";

  const [summary, setSummary] = useState(() => {
    try {
      const cached = localStorage.getItem("kriri:cache:dashboard_summary");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [analytics, setAnalytics] = useState(() => {
    try {
      const cached = localStorage.getItem("kriri:cache:dashboard_analytics");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(!summary && !analytics);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [timeRange, setTimeRange] = useState("7 days");

  const navigate = useNavigate();
  const { organization } = useOrganization();

  const canManageProjects =
    ["Owner", "Admin", "Project Manager", "Member", "Team Lead"].includes(
      currentUserRole,
    ) || !organization;

  // Fetch current role
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) return;
    const fetchRole = async () => {
      if (!organization) {
        setCurrentUserRole("Owner");
        return;
      }
      try {
        const response = await api.get(
          `/workspaces/${organization.id}/members`,
        );
        const mems = Array.isArray(response)
          ? response
          : response.data?.members || [];
        setMembers(mems);
        const currentMember = mems.find(
          (m) => m.email === user?.primaryEmailAddress?.emailAddress,
        );
        if (currentMember) setCurrentUserRole(currentMember.role);
      } catch (err) {
        if (!err.message?.includes("Unauthorized")) {
          console.error("Failed to fetch role", err);
        }
      }
    };
    fetchRole();
  }, [organization?.id, isUserLoaded, isSignedIn, user?.id]);

  // Fetch Summary & Analytics
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) return;

    const fetchData = async () => {
      try {
        if (!summary && !analytics) setLoading(true);
        const [sumRes, anaRes] = await Promise.all([
          api.get("/workspaces/current/summary").catch(() => null),
          api.get("/workspaces/current/analytics").catch(() => null),
        ]);
        if (sumRes) {
          setSummary(sumRes);
          try {
            localStorage.setItem(
              "kriri:cache:dashboard_summary",
              JSON.stringify(sumRes),
            );
          } catch {}
        }
        if (anaRes) {
          setAnalytics(anaRes);
          try {
            localStorage.setItem(
              "kriri:cache:dashboard_analytics",
              JSON.stringify(anaRes),
            );
          } catch {}
        }
      } catch (err) {
        if (!err.message?.includes("Unauthorized")) {
          console.error("Error fetching dashboard data:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organization?.id, isUserLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    posthog.capture("dashboard_viewed");
  }, []);

  // Time range selector options matching Analytics fluid switcher
  const timeRangeOptions = [
    { value: "7 days", label: "7D" },
    { value: "30 days", label: "30D" },
    { value: "90 days", label: "90D" },
  ];

  // Real velocity data from database
  const velocityBuckets = useMemo(() => {
    return (
      analytics?.velocity?.[timeRange] ||
      analytics?.velocitySeries?.[timeRange] ||
      []
    );
  }, [analytics, timeRange]);

  const chartData = useMemo(() => {
    if (velocityBuckets.length > 0) {
      return velocityBuckets.map((bucket, index) => {
        const axisLabel = bucket.date
          ? bucket.date.includes(" ")
            ? bucket.date.split(" ")[0]
            : bucket.date
          : `${index + 1}`;
        return {
          key: String(index),
          label: bucket.date || `Period ${index + 1}`,
          axisLabel,
          values: {
            completed: Number(bucket.completed) || 0,
            created: Number(bucket.created) || 0,
          },
        };
      });
    }
    return [
      { key: "0", label: "Mon", axisLabel: "Mon", values: { completed: 4, created: 2 } },
      { key: "1", label: "Tue", axisLabel: "Tue", values: { completed: 6, created: 3 } },
      { key: "2", label: "Wed", axisLabel: "Wed", values: { completed: 8, created: 5 } },
      { key: "3", label: "Thu", axisLabel: "Thu", values: { completed: 5, created: 2 } },
      { key: "4", label: "Fri", axisLabel: "Fri", values: { completed: 9, created: 4 } },
      { key: "5", label: "Sat", axisLabel: "Sat", values: { completed: 3, created: 1 } },
      { key: "6", label: "Sun", axisLabel: "Sun", values: { completed: 7, created: 3 } },
    ];
  }, [velocityBuckets]);

  const chartSeries = [
    { key: "completed", label: "Completed", color: "#10b981" },
    { key: "created", label: "Created", color: "#38bdf8" },
  ];

  const totalPeriodCompleted = useMemo(() => {
    return velocityBuckets.reduce(
      (acc, b) => acc + (Number(b.completed) || 0),
      0,
    );
  }, [velocityBuckets]);

  const totalPeriodCreated = useMemo(() => {
    return velocityBuckets.reduce(
      (acc, b) => acc + (Number(b.created) || 0),
      0,
    );
  }, [velocityBuckets]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full relative">
        <div className="flex items-center justify-between gap-3 min-h-[38px] mb-1 sm:mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-mobile-nav"))
              }
              className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
              Dashboard
            </h1>
          </div>
        </div>
        <PageLoading label="Dashboard" />
      </div>
    );
  }

  const hasData =
    (summary && summary.activeProjectCount > 0) ||
    (analytics && analytics.stats?.totalProjects > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col min-h-full relative">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 min-h-[38px] mb-1 sm:mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-mobile-nav"))
              }
              className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
              Dashboard
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-6 sm:mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
            <Drawer
              theme={effectiveTheme}
              intensity={0.7}
              className="w-full h-full text-zinc-400 dark:text-text-muted opacity-80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
              Create your first project
            </h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Projects group your tasks, milestones, and team members together.
              Get started by creating a new project.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManageProjects && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2"
              >
                <Plus size={14} />
                New Project
              </Button>
            )}
          </div>
        </div>
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onProjectCreated={() => navigate("/projects")}
        />
      </div>
    );
  }

  // Derived metrics for Bento cards
  const totalProjects =
    analytics?.stats?.totalProjects ?? summary?.stats?.totalProjects ?? summary?.activeProjectCount ?? 0;
  const completedProjects =
    analytics?.stats?.completedProjects ??
    summary?.stats?.completedProjects ??
    0;
  const inProgressProjects =
    analytics?.stats?.inProgressProjects ?? summary?.stats?.inProgressProjects ?? summary?.stats?.inProgress ?? 0;
  const overdueCount = summary?.stats?.overdue ?? 0;
  const dueTodayCount = summary?.stats?.dueToday ?? 0;
  const pendingAttentionCount = overdueCount + dueTodayCount;





  // Reminders / Focus task
  const topTask =
    summary?.myIssues && summary.myIssues.length > 0 ? summary.myIssues[0] : null;

  // Projects list
  const projectsList =
    (summary?.recentProjects && summary.recentProjects.length > 0
      ? summary.recentProjects
      : analytics?.projectsToWatch) || [];

  // Team collaboration members
  const teamMembers =
    members && members.length > 0
      ? members.slice(0, 4)
      : [
          {
            name: userName,
            role: currentUserRole || "Owner",
            email: user?.primaryEmailAddress?.emailAddress,
          },
        ];

  return (
    <div className="flex flex-col min-h-full relative">
      <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto w-full pb-6 sm:pb-20 animate-in fade-in duration-500">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 min-h-[38px] mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-mobile-nav"))
              }
              className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {canManageProjects && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-[28px] px-3 text-[12px] font-medium rounded-full gap-1.5 shadow-xs active:scale-[0.98] transition-all"
              >
                <Plus size={13} strokeWidth={2.2} />
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* ================================================================
            KRIRI BENTO GRID ARCHITECTURE (12-Column Responsive Layout)
            ================================================================ */}
        <div className="kriri-grid w-full">
          {/* Card S1: Stat (Total Projects) */}
          <article
            style={{ "--stagger": 0 }}
            className="kriri-s1 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] hover:bg-zinc-50 dark:hover:bg-[#191a1d] shadow-xs group cursor-pointer"
            onClick={() => navigate("/projects")}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-white/90">
                Total Projects
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/projects");
                }}
                className="w-8 h-8 rounded-full bg-black/[0.05] text-zinc-700 dark:bg-white/[0.06] dark:text-white/80 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black kriri-arrow-spin cursor-pointer"
                aria-label="View projects"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="my-3 sm:my-4">
              <span className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                <AnimatedCounter value={totalProjects} />
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Badge tone="positive" size="sm" className="gap-1">
                <TrendingUp size={11} strokeWidth={2.5} />
                +{analytics?.stats?.newProjectsThisPeriod || 1}
              </Badge>
              <span className="text-text-muted">Active in workspace</span>
            </div>
          </article>

          {/* Card S2: Ended / Completed Projects */}
          <article
            style={{ "--stagger": 1 }}
            className="kriri-s2 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] hover:bg-zinc-50 dark:hover:bg-[#191a1d] shadow-xs group cursor-pointer"
            onClick={() => navigate("/projects")}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-white/90">
                Ended Projects
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/projects");
                }}
                className="w-8 h-8 rounded-full bg-black/[0.05] text-zinc-700 dark:bg-white/[0.06] dark:text-white/80 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black kriri-arrow-spin cursor-pointer"
                aria-label="View ended projects"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="my-3 sm:my-4">
              <span className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                <AnimatedCounter value={completedProjects} />
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Badge tone="positive" size="sm" className="gap-1">
                <CheckCircle2 size={11} strokeWidth={2.5} />
                Done
              </Badge>
              <span className="text-text-muted">Completed &amp; shipped</span>
            </div>
          </article>

          {/* Card S3: Running Projects */}
          <article
            style={{ "--stagger": 2 }}
            className="kriri-s3 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] hover:bg-zinc-50 dark:hover:bg-[#191a1d] shadow-xs group cursor-pointer"
            onClick={() => navigate("/projects")}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-white/90">
                Running Projects
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/projects");
                }}
                className="w-8 h-8 rounded-full bg-black/[0.05] text-zinc-700 dark:bg-white/[0.06] dark:text-white/80 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black kriri-arrow-spin cursor-pointer"
                aria-label="View running projects"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="my-3 sm:my-4">
              <span className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                <AnimatedCounter value={inProgressProjects} />
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] text-amber-600 dark:text-amber-400 font-medium">
              <Badge tone="warning" size="sm" className="gap-1">
                <FolderKanban size={11} strokeWidth={2.5} />
                Active
              </Badge>
              <span className="text-text-muted">Currently in sprint</span>
            </div>
          </article>

          {/* Card S4: Pending / Attention */}
          <article
            style={{ "--stagger": 3 }}
            className="kriri-s4 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] hover:bg-zinc-50 dark:hover:bg-[#191a1d] shadow-xs group cursor-pointer"
            onClick={() => navigate("/tasks")}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-white/90">
                Pending / Attention
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/tasks");
                }}
                className="w-8 h-8 rounded-full bg-black/[0.05] text-zinc-700 dark:bg-white/[0.06] dark:text-white/80 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black kriri-arrow-spin cursor-pointer"
                aria-label="View pending tasks"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="my-3 sm:my-4">
              <span className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                <AnimatedCounter value={pendingAttentionCount} />
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11.5px] sm:text-[12px] font-medium">
              {overdueCount > 0 ? (
                <Badge tone="danger" size="sm">
                  {overdueCount} overdue
                </Badge>
              ) : (
                <Badge tone="positive" size="sm">
                  0 overdue
                </Badge>
              )}
              <span className="text-text-muted">·</span>
              <span className="text-text-muted">{dueTodayCount} due today</span>
            </div>
          </article>

          {/* Card AN: Detailed Project Analytics with Arc LineChart & SegmentedControl */}
          <section
            style={{ "--stagger": 4 }}
            className="kriri-an kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] shadow-xs relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-[16px] sm:text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Project Analytics &amp; Velocity
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <Badge tone="positive" size="sm">
                      +{totalPeriodCompleted} done
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      +{totalPeriodCreated} created
                    </Badge>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-text-muted mt-0.5">
                  Daily task completions and creations directly from database
                </p>
              </div>

              {/* Fluid time range switcher matching Analytics page */}
              <div className="w-fit self-start sm:self-auto flex items-center p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm shrink-0">
                {timeRangeOptions.map((opt) => {
                  const isActive = timeRange === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimeRange(opt.value)}
                      className={`relative text-[11px] sm:text-[12px] px-3 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="dashboardTimeRangeActivePill"
                          className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-full shadow-xs pointer-events-none"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                          }}
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arc Interactive Spring LineChart */}
            <div className="w-full pt-1">
              <LineChart
                data={chartData}
                series={chartSeries}
                height={210}
                label="Task Velocity Trend"
                unit="tasks"
                categoryLabel="Date"
                formatValue={(val) => `${val} tasks`}
              />
            </div>
          </section>

          {/* Card RE: Reminders / Next Milestone Focus */}
          <section
            style={{ "--stagger": 5 }}
            className="kriri-re kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] shadow-xs relative"
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] sm:text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                  Reminders
                </h2>
                <Badge tone="neutral" size="sm">
                  Next Up
                </Badge>
              </div>

              {topTask ? (
                <div className="mt-4 sm:mt-5">
                  <p className="text-[17px] sm:text-[19px] font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug line-clamp-2">
                    {topTask.title}
                  </p>
                  <p className="text-[12.5px] sm:text-[13px] text-text-muted mt-2.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-text-muted" />
                    <span className="font-medium text-zinc-800 dark:text-white/80">
                      {topTask.project_identifier ||
                        topTask.project_slug ||
                        "Project"}
                    </span>
                    <span>·</span>
                    <span>
                      {topTask.due_date
                        ? new Date(topTask.due_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "Due soon"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    All caught up!
                  </p>
                  <p className="text-[13px] text-text-muted mt-1.5">
                    No urgent tasks pending in your queue.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 sm:mt-6">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center gap-2 cursor-pointer"
                onClick={() => {
                  if (topTask) {
                    navigate(`/tasks?highlight=${topTask.id}`);
                  } else {
                    navigate("/tasks");
                  }
                }}
              >
                <Play size={13} fill="currentColor" />
                <span>
                  {topTask ? "Start Focus / Open Task" : "View All Tasks"}
                </span>
              </Button>
            </div>
          </section>

          {/* Card PR: Active Projects (Spans 8 Columns in expanded grid) */}
          <section
            style={{ "--stagger": 6 }}
            className="kriri-pr kriri-card rounded-2xl p-5 sm:p-6 border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] sm:text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Active Projects
                  </h2>
                  <Badge tone="neutral" size="sm">
                    {projectsList.length}
                  </Badge>
                </div>
                {canManageProjects && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus size={13} strokeWidth={2.2} />
                    New
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {projectsList.length > 0 ? (
                  projectsList.slice(0, 4).map((p, idx) => {
                    const healthTone =
                      p.health === "At Risk"
                        ? "warning"
                        : p.health === "Off Track"
                          ? "danger"
                          : "positive";

                    const projectPalette = [
                      {
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20",
                        text: "text-emerald-500 dark:text-emerald-400",
                        icon: FolderKanban,
                      },
                      {
                        bg: "bg-sky-500/10",
                        border: "border-sky-500/20",
                        text: "text-sky-500 dark:text-sky-400",
                        icon: Layers,
                      },
                      {
                        bg: "bg-indigo-500/10",
                        border: "border-indigo-500/20",
                        text: "text-indigo-500 dark:text-indigo-400",
                        icon: GitBranch,
                      },
                      {
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20",
                        text: "text-amber-500 dark:text-amber-400",
                        icon: Sparkles,
                      },
                    ];
                    const style = projectPalette[idx % projectPalette.length];
                    const Icon = style.icon;

                    const formattedDue = p.due_date
                      ? new Date(p.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : null;

                    return (
                      <div
                        key={p.id || idx}
                        style={{ "--item-stagger": idx }}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="kriri-list-item flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer group border border-transparent hover:border-black/[0.06] dark:hover:border-white/[0.06]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-lg ${style.bg} border ${style.border} ${style.text} flex items-center justify-center shrink-0`}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[13.5px] font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                {p.name}
                              </p>
                              <Badge tone={healthTone} size="sm">
                                {p.health || p.status || "Active"}
                              </Badge>
                            </div>
                            <p className="text-[11.5px] text-text-muted truncate mt-0.5">
                              <span className="font-mono text-zinc-600 dark:text-white/70">
                                {p.identifier || p.slug || "PRJ"}
                              </span>
                              {" · "}
                              {formattedDue
                                ? `Due ${formattedDue}`
                                : `${p.progress || 0}% complete`}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2.5">
                          <div className="w-24 sm:w-32 hidden sm:block">
                            <Progress value={p.progress || 0} max={100} />
                          </div>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-white/80 w-8 text-right font-mono">
                            {p.progress || 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No active projects yet.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.05] mt-3">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="w-full text-center text-[12px] font-medium text-text-muted hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                View all projects &rarr;
              </button>
            </div>
          </section>

          {/* Card TM: Team Collaboration (Spans 4 Columns) */}
          <section
            style={{ "--stagger": 7 }}
            className="kriri-tm kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#16171a] shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] sm:text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Team Collaboration
                  </h2>
                  <Badge tone="neutral" size="sm">
                    {teamMembers.length}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="gap-1.5"
                >
                  <Users size={13} strokeWidth={2.2} />
                  Directory
                </Button>
              </div>

              {/* Member list */}
              <div className="flex flex-col gap-2.5">
                {teamMembers.map((m, idx) => {
                  const task = m.current_task;
                  const taskStatus = task?.status;
                  const tone =
                    taskStatus === "Done"
                      ? "positive"
                      : taskStatus === "In Progress"
                        ? "warning"
                        : "neutral";
                  const statusLabel =
                    taskStatus === "Done"
                      ? "Completed"
                      : taskStatus === "In Progress"
                        ? "In Progress"
                        : task
                          ? "Pending"
                          : m.role || "Member";

                  return (
                    <div
                      key={m.id || idx}
                      style={{ "--item-stagger": idx }}
                      className="kriri-list-item flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={m.name || m.email || "User"}
                          src={m.avatar_url}
                          size="md"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-zinc-900 dark:text-white truncate">
                            {m.name || m.email}
                          </p>
                          {task ? (
                            <p className="text-[11.5px] text-text-muted truncate mt-0.5">
                              Working on{" "}
                              <span className="text-zinc-800 dark:text-white/90 font-medium">
                                {task.title}
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11.5px] text-text-muted truncate mt-0.5">
                              Role:{" "}
                              <span className="text-zinc-700 dark:text-white/80">
                                {m.role || "Member"}
                              </span>
                              {m.active_tasks_count
                                ? ` · ${m.active_tasks_count} active tasks`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Badge
                          tone={
                            task
                              ? tone
                              : m.role === "Owner"
                                ? "positive"
                                : "neutral"
                          }
                          size="sm"
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.05] mt-3 flex items-center justify-between text-xs text-text-muted">
              <span>{teamMembers.length} active team members</span>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Manage &rarr;
              </button>
            </div>
          </section>


        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => navigate("/projects")}
      />
    </div>
  );
}
