import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../lib/api";
import { getAvatarColor } from "../../lib/avatarUtils";

export default function TeamWorkloadCard({ workspaceMembers = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("kriri:team_workload_collapsed") === "true";
      } catch {}
    }
    return false;
  });

  const fetchWorkload = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/ai/workload");
      setData(res);
    } catch (err) {
      console.error("Failed to fetch team workload:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("kriri:team_workload_collapsed", String(next));
        } catch {}
      }
      return next;
    });
  };

  const memberLookup = useMemo(() => {
    const map = new Map();
    if (Array.isArray(workspaceMembers)) {
      workspaceMembers.forEach((m) => {
        if (m.id) map.set(String(m.id), m);
        if (m.email) map.set(m.email.toLowerCase(), m);
      });
    }
    return map;
  }, [workspaceMembers]);

  const enrichedMembers = useMemo(() => {
    if (!data?.members) return [];
    return data.members.map((m) => {
      const matched =
        memberLookup.get(String(m.userId)) ||
        (m.email ? memberLookup.get(m.email.toLowerCase()) : null);

      return {
        ...m,
        avatarUrl: m.avatarUrl || matched?.avatar_url || matched?.avatarUrl || null,
        role: matched?.role || "Member",
        username: matched?.username || null,
        email: m.email || matched?.email || null,
      };
    });
  }, [data?.members, memberLookup]);

  const totalActive = useMemo(() => {
    if (data?.summary?.totalActiveTasks !== undefined) {
      return data.summary.totalActiveTasks;
    }
    return enrichedMembers.reduce((sum, m) => sum + (m.activeTasks || 0), 0);
  }, [data?.summary, enrichedMembers]);

  const totalOverdue = useMemo(() => {
    if (data?.summary?.totalOverdueTasks !== undefined) {
      return data.summary.totalOverdueTasks;
    }
    return enrichedMembers.reduce((sum, m) => sum + (m.overdueTasks || 0), 0);
  }, [data?.summary, enrichedMembers]);

  const balanceIndex = data?.summary?.balanceIndex ?? 100;

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 dark:bg-surface-elevated/40 backdrop-blur-xs p-4 sm:p-4.5 mb-6 shadow-2xs animate-pulse motion-reduce:animate-none">
        <div className="flex items-center justify-between">
          <div className="w-44 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-6 h-6 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-lg border border-border/80 bg-surface-elevated/70 p-3 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-24 h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border-subtle">
                <div className="w-8 h-3 mx-auto rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                <div className="w-8 h-3 mx-auto rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                <div className="w-8 h-3 mx-auto rounded bg-black/[0.06] dark:bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || enrichedMembers.length === 0) return null;

  const gridColsClass =
    enrichedMembers.length <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : enrichedMembers.length === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="rounded-xl border border-border bg-surface/60 dark:bg-surface-elevated/40 backdrop-blur-xs p-4 sm:p-4.5 mb-6 shadow-2xs transition-all">
      {/* Container Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13.5px] sm:text-[14px] font-semibold text-foreground tracking-tight whitespace-nowrap">
          Team Capacity & Workload
        </h3>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => fetchWorkload(true)}
            disabled={refreshing}
            className="p-1.5 text-text-muted hover:text-foreground rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
            title="Refresh workload analysis"
          >
            <RefreshCw
              size={13}
              className={`transition-transform duration-500 ${refreshing ? "animate-spin text-indigo-500" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 text-text-muted hover:text-foreground rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
            title={isCollapsed ? "Expand capacity cards" : "Collapse capacity cards"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Member Capacity Grid (when expanded) */}
      {!isCollapsed && (
        <div className={`grid ${gridColsClass} gap-3 mt-3.5`}>
          {enrichedMembers.map((m) => {
            const isOverloaded = m.capacityStatus === "Overloaded";
            const isUnderallocated = m.capacityStatus === "Underallocated";
            const loadShare =
              m.loadPercentage !== undefined
                ? m.loadPercentage
                : totalActive > 0
                  ? Math.round((m.activeTasks / totalActive) * 100)
                  : 0;

            const barColor = isOverloaded
              ? "bg-rose-500"
              : isUnderallocated
                ? "bg-amber-500"
                : "bg-emerald-500";

            return (
              <div
                key={m.userId}
                className="rounded-lg border border-border/80 bg-surface-elevated/70 hover:bg-surface-elevated hover:border-border transition-all duration-150 p-3 flex flex-col justify-between gap-3 shadow-2xs group"
              >
                {/* Member Identity */}
                <div className="flex items-center gap-2 min-w-0">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-bold text-white shrink-0 ${getAvatarColor(
                        m.name,
                        m.email
                      )}`}
                    >
                      {m.name ? m.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12.5px] font-medium text-foreground truncate leading-tight group-hover:text-foreground">
                      {m.name}
                    </span>
                    <span className="text-[10.5px] text-text-muted truncate leading-normal">
                      {m.role || "Member"}
                      {m.username ? ` • @${m.username.replace(/^@/, '')}` : (m.email ? ` • ${m.email}` : "")}
                    </span>
                  </div>
                </div>

                {/* Capacity Share Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10.5px] text-text-muted">
                    <span>Workload Share</span>
                    <span className="font-mono font-medium text-text-secondary">
                      {loadShare}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(loadShare, 4))}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border-subtle text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                      Active
                    </span>
                    <span className="text-[12.5px] font-semibold text-foreground tabular-nums">
                      {m.activeTasks}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                      Overdue
                    </span>
                    <span
                      className={`text-[12.5px] font-semibold tabular-nums ${
                        m.overdueTasks > 0
                          ? "text-rose-500 dark:text-rose-400"
                          : "text-text-muted"
                      }`}
                    >
                      {m.overdueTasks}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                      Done
                    </span>
                    <span className="text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {m.completedTasks}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
