import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useUser } from "@clerk/clerk-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plot as Chart } from "@lucasmarkes/hairline/react";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { organization, isLoaded } = useUser();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get("/workspaces/current/analytics");
        setData(res);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded) {
      fetchAnalytics();
    }
  }, [organization?.id, isLoaded]);

  if (loading) {
    return <div className="p-8 text-text-muted">Loading analytics...</div>;
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full w-full min-w-0 min-h-0 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6 flex-shrink-0 px-8 pt-6">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Analytics
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10">
          <div className="w-80 h-80 flex items-center justify-center relative overflow-visible">
            <Chart
              theme="dark"
              intensity={0.7}
              className="w-full h-full text-[#8a8f98]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              No analytics data yet
            </h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Once you start creating issues and moving them across your board,
              your insights will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0 min-h-0 animate-in fade-in duration-300">
      {/* Header - Full Width */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0 px-8 pt-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Analytics
        </h1>
      </div>

      {/* Content - Centered */}
      <div className="flex-1 overflow-y-auto w-full px-8">
        <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pb-20">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border bg-surface-elevated/50 flex flex-col gap-3">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-[13px] font-medium">Issues Closed</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-white">
                  {data.stats.completedIssues}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface-elevated/50 flex flex-col gap-3">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-[13px] font-medium">Active Issues</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-white">
                  {data.stats.activeIssues}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface-elevated/50 flex flex-col gap-3">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-[13px] font-medium">Completion Rate</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-white">
                  {data.stats.completionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-medium text-white">
                Issue Completion Over Time
              </h2>
              <div className="h-[300px] p-5 rounded-xl border border-border bg-surface-elevated/50">
                {data.completionTrend && data.completionTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.completionTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#222"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#888", fontSize: 12 }}
                        tickFormatter={(val) => {
                          const date = new Date(val);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                        stroke="#333"
                        tickMargin={10}
                      />
                      <YAxis
                        tick={{ fill: "#888", fontSize: 12 }}
                        stroke="#333"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#fff" }}
                        labelStyle={{ color: "#888" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#5e6ad2"
                        strokeWidth={2}
                        dot={{ fill: "#5e6ad2", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted text-[13px]">
                    Not enough data yet.
                  </div>
                )}
              </div>
            </div>

            {/* Workload Chart */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-medium text-white">
                Current Workload by Team Member
              </h2>
              <div className="h-[300px] p-5 rounded-xl border border-border bg-surface-elevated/50">
                {data.workload && data.workload.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.workload}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#222"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="user"
                        tick={{ fill: "#888", fontSize: 12 }}
                        stroke="#333"
                        tickMargin={10}
                      />
                      <YAxis
                        tick={{ fill: "#888", fontSize: 12 }}
                        stroke="#333"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#fff" }}
                        labelStyle={{ color: "#888" }}
                        cursor={{ fill: "#222" }}
                      />
                      <Bar
                        dataKey="openIssues"
                        fill="#5e6ad2"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted text-[13px]">
                    No active workload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
