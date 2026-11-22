import { useState, useEffect } from "react";
import { Users, AlertCircle, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { getAvatarColor } from "../../lib/avatarUtils";

export default function TeamWorkloadCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ai/workload");
      setData(res);
    } catch (err) {
      console.error("Failed to fetch team workload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-[#8a8f98] min-h-[140px] mb-6">
        <RefreshCw size={14} className="animate-spin text-indigo-500" />
        <span>Evaluating team capacity & task allocation balance...</span>
      </div>
    );
  }

  if (!data || !data.members) return null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border bg-surface flex flex-col gap-5 shadow-xs mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Sparkles size={13} />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground">
            Team Workload & Capacity Intelligence
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            Balance Index: {data.summary?.balanceIndex ?? 100}%
          </span>
        </div>

        <button
          onClick={fetchWorkload}
          className="p-1 text-text-muted hover:text-foreground rounded-md hover:bg-surface-hover transition-colors"
          title="Refresh Workload Analysis"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Member Capacity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.members.map((m) => {
          const isOverloaded = m.capacityStatus === "Overloaded";
          const isUnderallocated = m.capacityStatus === "Underallocated";

          return (
            <div
              key={m.userId}
              className="p-3.5 rounded-xl border border-border bg-surface-elevated flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(
                      m.name,
                      m.email
                    )}`}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-foreground truncate">
                      {m.name}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    isOverloaded
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : isUnderallocated
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}
                >
                  {m.capacityStatus}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-border-subtle">
                <div>
                  <span className="text-text-muted block text-[10px]">Active</span>
                  <span className="font-semibold text-foreground">{m.activeTasks}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Overdue</span>
                  <span className={`font-semibold ${m.overdueTasks > 0 ? "text-rose-500" : "text-foreground"}`}>
                    {m.overdueTasks}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">Completed</span>
                  <span className="font-semibold text-foreground">{m.completedTasks}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

