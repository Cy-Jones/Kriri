import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, RefreshCw, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import FormattedAIMessage from "./FormattedAIMessage";

export default function ProjectHealthCard({ projectId, onOpenAssistant }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/ai/projects/${projectId}/health`);
      setData(res);
    } catch (err) {
      console.error("Failed to load project health:", err);
      setError(err.message || "Unable to compute health score.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-[#8a8f98] min-h-[140px]">
        <RefreshCw size={14} className="animate-spin text-indigo-500" />
        <span>Calculating project health metrics & risk signals...</span>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const score = data.healthScore || 80;
  const statusColor =
    score >= 80
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : score >= 60
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
        : "text-rose-500 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] dark:to-transparent flex flex-col gap-4 shadow-xs mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Sparkles size={13} />
          </div>
          <h3 className="text-[13.5px] font-semibold text-zinc-900 dark:text-white">
            AI Project Health & Risk Audit
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${statusColor}`}>
            {data.healthStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealth}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Re-run health evaluation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Score Radial */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
          <div className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {score}
            <span className="text-xs text-zinc-400 dark:text-[#8a8f98] font-normal">/100</span>
          </div>
          <div className="flex flex-col text-[11px] text-zinc-500 dark:text-[#8a8f98]">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Composite Health</span>
            <span>Deterministic Score</span>
          </div>
        </div>

        {/* Metric Summary */}
        <div className="md:col-span-3 grid grid-cols-3 gap-2 text-[12px]">
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <span className="text-zinc-400 dark:text-[#8a8f98] text-[10.5px] block">Completion</span>
            <span className="text-zinc-900 dark:text-white font-semibold text-[14px]">
              {data.metrics?.completionRate ?? 0}%
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <span className="text-zinc-400 dark:text-[#8a8f98] text-[10.5px] block">Overdue Issues</span>
            <span className={`font-semibold text-[14px] ${data.metrics?.overdueTasks > 0 ? "text-rose-500" : "text-zinc-900 dark:text-white"}`}>
              {data.metrics?.overdueTasks ?? 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <span className="text-zinc-400 dark:text-[#8a8f98] text-[10.5px] block">Risk Level</span>
            <span className="text-zinc-900 dark:text-white font-semibold text-[14px]">
              {data.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* AI Narrative Explanation */}
      {data.explanation && (
        <div className="bg-black/[0.015] dark:bg-white/[0.015] p-3.5 rounded-xl border border-black/[0.04] dark:border-white/[0.04]">
          <FormattedAIMessage content={data.explanation} className="text-zinc-600 dark:text-[#a1a1aa]" />
        </div>
      )}

      {/* Risks Detected */}
      {data.risks && data.risks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.risks.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-400">
              <AlertTriangle size={13} className="shrink-0" />
              <span>{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

