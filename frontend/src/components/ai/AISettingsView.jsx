import { useState, useEffect } from "react";
import {
  Sparkles,
  Cpu,
  Activity,
  ShieldCheck,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Zap,
  Info,
} from "lucide-react";
import { api } from "../../lib/api";

export default function AISettingsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState(null); // { type: "success" | "error", message: string }

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ai/usage");
      setData(res);
      setKeyFeedback(null);
    } catch (err) {
      console.error("Failed to load AI stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSaveKey = async (e) => {
    if (e) e.preventDefault();
    if (!customKeyInput.trim()) return;

    setSavingKey(true);
    setKeyFeedback(null);

    try {
      const res = await api.patch("/ai/config", {
        custom_api_key: customKeyInput.trim(),
      });
      if (res.success) {
        setKeyFeedback({
          type: "success",
          message: "Custom OpenRouter API key verified and active for this workspace.",
        });
        setCustomKeyInput("");
        setIsEditingKey(false);
        fetchStats();
      }
    } catch (err) {
      setKeyFeedback({
        type: "error",
        message: err.response?.data?.error || err.message || "Failed to verify OpenRouter key.",
      });
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm("Remove custom API key and revert to workspace free allocation?")) {
      return;
    }
    setSavingKey(true);
    setKeyFeedback(null);

    try {
      await api.patch("/ai/config", { custom_api_key: "" });
      setKeyFeedback({
        type: "success",
        message: "Custom key removed. Reverted to platform shared allocation.",
      });
      fetchStats();
    } catch (err) {
      setKeyFeedback({
        type: "error",
        message: err.response?.data?.error || err.message || "Failed to remove key.",
      });
    } finally {
      setSavingKey(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <div className="w-36 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
          <div className="w-full h-2 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2">
              <div className="w-20 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
              <div className="w-14 h-6 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const summary = stats.summary || {};
  const dailyQuota = data?.dailyQuota || {
    limit: 50,
    usedToday: 0,
    remainingToday: 50,
    percentUsed: 0,
    isCustomKey: false,
  };
  const capabilities = data?.capabilities || [];
  const config = data?.config || {};
  const hasCustomKey = Boolean(config.hasCustomKey);
  const circuitStatus = data?.circuitStatus || "CLOSED";

  // Quota bar colors
  const percent = dailyQuota.percentUsed || 0;
  let quotaColor = "bg-emerald-500";
  let quotaTextColor = "text-emerald-500";
  if (percent >= 90) {
    quotaColor = "bg-rose-500";
    quotaTextColor = "text-rose-500";
  } else if (percent >= 70) {
    quotaColor = "bg-amber-500";
    quotaTextColor = "text-amber-500";
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* 1. Master Gateway Header Card */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14.5px] font-semibold text-foreground">
                OpenRouter AI Gateway
              </h3>
              {circuitStatus === "CLOSED" ? (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                  <Clock size={10} />
                  Circuit Open ({data?.cooldownRemainingSec || 60}s)
                </span>
              )}
            </div>
            <p className="text-[12px] text-text-muted mt-0.5">
              {hasCustomKey
                ? "Dedicated Workspace Key (Unlimited Rate Quota)"
                : "Protected Free Tier (50 daily requests allocation with auto-fallback)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-1.5 text-text-muted hover:text-foreground rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-500" : ""} />
          </button>
        </div>
      </div>

      {/* 2. Daily Quota & Overload Protection Meter */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs transition-colors space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className={quotaTextColor} />
            <h4 className="text-[13px] font-semibold text-foreground">
              Daily Request Allocation
            </h4>
          </div>
          <span className="text-[12px] font-medium text-text-muted">
            {hasCustomKey ? (
              <span className="text-emerald-500 font-semibold">Unlimited (BYOK Key)</span>
            ) : (
              <>
                <strong className={quotaTextColor}>{dailyQuota.usedToday}</strong> /{" "}
                {dailyQuota.limit} requests today
              </>
            )}
          </span>
        </div>

        {!hasCustomKey && (
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full ${quotaColor} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>{dailyQuota.remainingToday} requests remaining</span>
              <span>Resets at 00:00 UTC daily</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border-subtle flex items-start gap-2.5 text-[11.5px] text-text-muted">
          <ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
          <span>
            <strong>Overload Protection Active:</strong> Sliding-window rate limiting (5 req/min/user),
            concurrency semaphore (max 2 in-flight calls), and graceful fallback to Kriri&apos;s
            deterministic intelligence engine ensure your account never crashes or runs out of credits.
          </span>
        </div>
      </div>

      {/* 3. Bring-Your-Own-Key (BYOK) Card */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs transition-colors space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
              <Key size={16} />
            </div>
            <div>
              <h4 className="text-[13.5px] font-semibold text-foreground">
                Workspace API Key (BYOK)
              </h4>
              <p className="text-[12px] text-text-muted mt-0.5">
                Provide your own OpenRouter key for dedicated high-throughput inference and custom models.
              </p>
            </div>
          </div>

          {hasCustomKey && !isEditingKey && (
            <button
              type="button"
              onClick={() => setIsEditingKey(true)}
              className="text-[12px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
            >
              Change Key
            </button>
          )}
        </div>

        {keyFeedback && (
          <div
            className={`p-3 rounded-xl text-[12px] flex items-center gap-2 ${
              keyFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}
          >
            {keyFeedback.type === "success" ? (
              <CheckCircle2 size={14} className="shrink-0" />
            ) : (
              <AlertCircle size={14} className="shrink-0" />
            )}
            <span>{keyFeedback.message}</span>
          </div>
        )}

        {hasCustomKey && !isEditingKey ? (
          <div className="p-3.5 rounded-xl bg-surface-hover border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
                Active Key
              </span>
              <span className="font-mono text-[12.5px] text-foreground">
                {config.maskedCustomKey || "sk-or-v1-••••••••"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveKey}
              disabled={savingKey}
              className="text-[11.5px] text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Remove Key
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl text-[13px] bg-surface-hover border border-border text-foreground placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition-colors"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingKey || !customKeyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-[12.5px] font-medium transition-colors cursor-pointer shrink-0"
                >
                  {savingKey ? "Verifying..." : "Validate & Save"}
                </button>
                {isEditingKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingKey(false);
                      setCustomKeyInput("");
                    }}
                    className="px-3 py-2 rounded-xl bg-surface-hover border border-border text-foreground text-[12.5px] font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-text-muted">
              Keys are encrypted at rest and validated directly with OpenRouter.
            </p>
          </form>
        )}
      </div>

      {/* 4. Aggregate Workspace Usage Metrics */}
      <div className="rounded-2xl border border-border bg-surface grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle overflow-hidden shadow-xs transition-colors">
        <div className="p-5 flex flex-col justify-between gap-1">
          <span className="text-[11.5px] font-medium text-text-muted block">
            Workspace Requests
          </span>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            {summary.total_requests || 0}
          </span>
        </div>
        <div className="p-5 flex flex-col justify-between gap-1">
          <span className="text-[11.5px] font-medium text-text-muted block">
            Tokens Processed
          </span>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            {Number(summary.total_tokens || 0).toLocaleString()}
          </span>
        </div>
        <div className="p-5 flex flex-col justify-between gap-1">
          <span className="text-[11.5px] font-medium text-text-muted block">
            Average Latency
          </span>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            {summary.avg_latency_ms || 180}ms
          </span>
        </div>
        <div className="p-5 flex flex-col justify-between gap-1">
          <span className="text-[11.5px] font-medium text-text-muted block">
            Estimated Cost
          </span>
          <span className="text-2xl font-bold text-emerald-500 tracking-tight">$0.00</span>
        </div>
      </div>

      {/* 5. Enterprise AI Capabilities (Friendly Capability Map) */}
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
        <div className="px-6 py-4 bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
          <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
            AI Intelligence Capabilities & Routing
          </h4>
          <span className="text-[11px] text-text-muted">Multi-Model Tier</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="px-6 py-3.5 flex items-center justify-between hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
            >
              <div>
                <span className="text-[13px] font-medium text-foreground block">
                  {cap.title}
                </span>
                <span className="text-[11.5px] text-text-muted block mt-0.5">
                  Engine: {cap.model}
                </span>
              </div>
              <div>
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-surface-hover border border-border text-foreground">
                  {cap.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 6. Recent Workspace AI Activity & Audit Log */}
      {stats.recentLogs && stats.recentLogs.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          <div className="px-6 py-4 bg-black/[0.01] dark:bg-white/[0.01]">
            <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              Recent Workspace AI Activity
            </h4>
          </div>
          <div className="divide-y divide-border-subtle">
            {stats.recentLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="px-6 py-3 flex items-center justify-between hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="capitalize text-[13px] font-medium text-foreground">
                    {log.feature}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-text-muted text-[11.5px]">
                  <span>{log.total_tokens} tokens</span>
                  <span>{log.latency_ms}ms</span>
                  <span
                    className={`font-medium ${
                      log.request_status === "success" ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {log.request_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
