import React from "react";

// ============================================================================
// 1. TASKS LIST SKELETON
// ============================================================================
export function TasksListSkeleton({ rowCount = 8 }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-16 min-h-0 divide-y divide-black/[0.04] dark:divide-white/[0.04] animate-pulse motion-reduce:animate-none">
      {/* Group header skeleton */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-3.5 h-3.5 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
        <div className="w-24 h-3.5 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
        <div className="w-5 h-3 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
      </div>

      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2.5 h-[40px]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-4 h-4 rounded-full shrink-0 bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-16 h-3 rounded shrink-0 bg-black/[0.04] dark:bg-white/[0.06]" />
            <div
              className="h-3.5 rounded bg-black/[0.06] dark:bg-white/[0.08]"
              style={{ width: `${30 + ((i * 17) % 35)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-16 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-14 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 2. TASKS BOARD SKELETON
// ============================================================================
export function TasksBoardSkeleton({ columnCount = 4 }) {
  const columnTitles = ["To Do", "In Progress", "In Review", "Done"];
  return (
    <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-6 min-h-0 animate-pulse motion-reduce:animate-none">
      {Array.from({ length: columnCount }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="w-[300px] shrink-0 flex flex-col gap-2.5 bg-black/[0.02] dark:bg-white/[0.015] border border-black/[0.04] dark:border-white/[0.04] rounded-xl p-3"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-black/[0.08] dark:bg-white/[0.1]" />
              <span className="text-[12px] font-semibold text-zinc-400 dark:text-zinc-600">
                {columnTitles[colIdx] || "Column"}
              </span>
              <div className="w-4 h-3.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
            <div className="w-4 h-4 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>

          {/* Cards */}
          {Array.from({ length: 3 - (colIdx % 2) }).map((__, cardIdx) => (
            <div
              key={cardIdx}
              className="rounded-lg p-3 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                <div className="w-3.5 h-3.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
              </div>
              <div
                className="h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                style={{ width: `${60 + ((cardIdx * 23) % 35)}%` }}
              />
              <div className="flex items-center justify-between pt-1">
                <div className="w-12 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                <div className="w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 3. PROJECTS LIST SKELETON
// ============================================================================
export function ProjectsListSkeleton({ rowCount = 6 }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-16 min-h-0 divide-y divide-black/[0.04] dark:divide-white/[0.04] animate-pulse motion-reduce:animate-none">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-3 h-[48px]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-4 h-4 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-14 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div
              className="h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]"
              style={{ width: `${35 + ((i * 19) % 30)}%` }}
            />
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <div className="w-16 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-20 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-14 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 4. PROJECTS BOARD SKELETON
// ============================================================================
export function ProjectsBoardSkeleton({ columnCount = 3 }) {
  const columnTitles = ["Planned", "In Progress", "Completed"];
  return (
    <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-6 min-h-0 animate-pulse motion-reduce:animate-none">
      {Array.from({ length: columnCount }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="w-[320px] shrink-0 flex flex-col gap-3 bg-black/[0.02] dark:bg-white/[0.015] border border-black/[0.04] dark:border-white/[0.04] rounded-xl p-3.5"
        >
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-black/[0.08] dark:bg-white/[0.1]" />
              <span className="text-[12px] font-semibold text-zinc-400 dark:text-zinc-600">
                {columnTitles[colIdx]}
              </span>
            </div>
            <div className="w-4 h-4 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>

          {Array.from({ length: 3 }).map((__, cardIdx) => (
            <div
              key={cardIdx}
              className="rounded-lg p-3.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-16 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                <div className="w-4 h-4 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
              </div>
              <div
                className="h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                style={{ width: `${65 + ((cardIdx * 19) % 25)}%` }}
              />
              <div className="w-full h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
              <div className="flex items-center justify-between pt-1">
                <div className="w-14 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                <div className="w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 5. PROJECTS TIMELINE SKELETON (Gantt Scale + Milestone Tracks)
// ============================================================================
export function ProjectsTimelineSkeleton() {
  const months = ["Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027"];
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative border-t border-black/[0.06] dark:border-white/[0.06] animate-pulse motion-reduce:animate-none">
      {/* Controls Bar Skeleton */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-24 h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
          <div className="w-2 h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="w-20 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-14 h-6 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="w-16 h-6 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      </div>

      {/* Gantt Header Scale */}
      <div className="flex border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015]">
        <div className="w-[240px] shrink-0 px-4 py-2 text-[12px] font-medium text-zinc-400 dark:text-zinc-600 border-r border-black/[0.06] dark:border-white/[0.06]">
          Project
        </div>
        <div className="flex-1 flex divide-x divide-black/[0.04] dark:divide-white/[0.04]">
          {months.map((m, i) => (
            <div key={i} className="flex-1 px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-600 font-mono">
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Rows */}
      <div className="flex-1 overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {[
          { left: "15%", width: "45%" },
          { left: "25%", width: "35%" },
          { left: "40%", width: "50%" },
          { left: "10%", width: "30%" },
          { left: "30%", width: "40%" },
          { left: "55%", width: "35%" },
        ].map((bar, i) => (
          <div key={i} className="flex items-center h-[52px]">
            {/* Left Project Info */}
            <div className="w-[240px] shrink-0 px-4 flex items-center gap-2.5 border-r border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-4 h-4 rounded bg-black/[0.06] dark:bg-white/[0.08] shrink-0" />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div
                  className="h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                  style={{ width: `${50 + ((i * 19) % 40)}%` }}
                />
                <div className="w-12 h-2.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>

            {/* Right Timeline Bar Track */}
            <div className="flex-1 h-full relative px-4 flex items-center">
              <div
                className="h-6 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.04] relative flex items-center px-2.5"
                style={{ marginLeft: bar.left, width: bar.width }}
              >
                <div className="w-16 h-2 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. DASHBOARD SKELETON (12-Column Bento Grid: S1-S4, AN, RE, PR, TM)
// ============================================================================
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-full relative animate-pulse motion-reduce:animate-none">
      <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto w-full pb-6 sm:pb-20">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 min-h-[38px] mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-24 h-5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
          </div>
          <div className="w-24 h-7 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
        </div>

        {/* 12-Column Responsive Bento Grid */}
        <div className="kriri-grid w-full">
          {/* Card S1: Total Projects */}
          <div className="kriri-s1 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="w-24 h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
              <div className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
            </div>
            <div className="my-3 sm:my-4">
              <div className="w-16 h-9 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-14 h-5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
              <div className="w-24 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>

          {/* Card S2: Ended Projects */}
          <div className="kriri-s2 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="w-24 h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
              <div className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
            </div>
            <div className="my-3 sm:my-4">
              <div className="w-16 h-9 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-14 h-5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
              <div className="w-24 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>

          {/* Card S3: Running Projects */}
          <div className="kriri-s3 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="w-28 h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
              <div className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
            </div>
            <div className="my-3 sm:my-4">
              <div className="w-16 h-9 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-14 h-5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
              <div className="w-24 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>

          {/* Card S4: Pending / Attention */}
          <div className="kriri-s4 kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="w-32 h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
              <div className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
            </div>
            <div className="my-3 sm:my-4">
              <div className="w-16 h-9 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
              <div className="w-20 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>

          {/* Card AN: Analytics & Velocity Chart Frame */}
          <div className="kriri-an kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col gap-1.5">
                <div className="w-48 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-64 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
              <div className="w-28 h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
            {/* Chart Frame Placeholder */}
            <div className="w-full h-[210px] rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-end p-4 gap-3">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-black/[0.05] dark:bg-white/[0.07]"
                    style={{ height: `${h}%` }}
                  />
                  <div className="w-6 h-2 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>

          {/* Card RE: Reminders */}
          <div className="kriri-re kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-20 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-14 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <div className="w-3/4 h-5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-1/2 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full h-9 rounded-lg bg-black/[0.06] dark:bg-white/[0.08]" />
            </div>
          </div>

          {/* Card PR: Active Projects */}
          <div className="kriri-pr kriri-card rounded-2xl p-5 sm:p-6 border border-border bg-surface shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-28 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                  <div className="w-6 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                </div>
                <div className="w-12 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>

              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-black/[0.03] dark:border-white/[0.03]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div
                          className="h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                          style={{ width: `${40 + ((i * 17) % 35)}%` }}
                        />
                        <div className="w-24 h-2.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2.5">
                      <div className="w-24 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] hidden sm:block" />
                      <div className="w-7 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle mt-3">
              <div className="w-28 h-3.5 mx-auto rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>

          {/* Card TM: Team Collaboration */}
          <div className="kriri-tm kriri-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-border bg-surface shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-32 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-6 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>

              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-black/[0.07] dark:bg-white/[0.09] shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <div
                          className="h-3 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                          style={{ width: `${55 + ((i * 15) % 30)}px` }}
                        />
                        <div className="w-14 h-2 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                      </div>
                    </div>
                    <div className="w-12 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle mt-3">
              <div className="w-20 h-3.5 mx-auto rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. INBOX SKELETON (Split-Pane: 320px Notifications List + Detail Preview)
// ============================================================================
export function InboxSkeleton() {
  return (
    <div className="flex h-full w-full bg-[var(--card-bg)] text-foreground animate-pulse motion-reduce:animate-none">
      {/* Left Notifications List (320px) */}
      <div className="w-full md:w-[320px] md:flex-shrink-0 border-r border-black/[0.08] dark:border-white/[0.06] flex flex-col bg-transparent">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-black/[0.08] dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-16 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="w-5 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-black/[0.07] dark:bg-white/[0.09] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div
                    className="h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                    style={{ width: `${45 + ((i * 19) % 35)}%` }}
                  />
                  <div className="w-10 h-2.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                </div>
                <div
                  className="h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]"
                  style={{ width: `${60 + ((i * 13) % 30)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Preview Pane */}
      <div className="hidden md:flex flex-1 flex-col bg-transparent overflow-hidden">
        {/* Detail Header */}
        <div className="h-12 flex items-center justify-between px-6 border-b border-black/[0.08] dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-14 h-4 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-2 h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-24 h-4 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-7 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>

        {/* Detail Body */}
        <div className="flex-1 p-8 flex flex-col gap-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/[0.07] dark:bg-white/[0.09] shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="w-32 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
              <div className="w-20 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] flex flex-col gap-2.5">
            <div className="w-3/4 h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
            <div className="w-full h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-2/3 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. ANALYTICS SKELETON (4 KPI Cards + Velocity Chart + Flow Breakdown)
// ============================================================================
export function AnalyticsSkeleton() {
  return (
    <div className="w-full flex flex-col min-h-full md:h-full animate-pulse motion-reduce:animate-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 shrink-0 min-h-[38px]">
        <div className="w-24 h-5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
        <div className="w-32 h-7 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
      </div>

      <div className="w-full md:flex-1 md:overflow-y-auto">
        <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-6 sm:pb-16">
          {/* 4 Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {["Tasks completed", "Overall progress", "Cycle time (avg)", "Active projects"].map((label, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5.5 rounded-xl sm:rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs"
              >
                <div>
                  <span className="text-[12px] font-medium text-zinc-400 dark:text-zinc-600">
                    {label}
                  </span>
                  <div className="w-14 h-7 rounded bg-black/[0.08] dark:bg-white/[0.1] mt-1.5" />
                </div>
                <div className="mt-3">
                  <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
                </div>
              </div>
            ))}
          </div>

          {/* Sprint Velocity Chart Frame */}
          <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-border bg-surface shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="w-36 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-56 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                <div className="w-16 h-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>
            {/* Mock Chart Canvas */}
            <div className="w-full h-[220px] rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-end p-4 gap-4">
              {[30, 50, 45, 75, 60, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-black/[0.05] dark:bg-white/[0.07]"
                    style={{ height: `${h}%` }}
                  />
                  <div className="w-7 h-2 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown Table Frame */}
          <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-border bg-surface shadow-xs flex flex-col gap-3">
            <div className="w-40 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                    <div
                      className="h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                      style={{ width: `${120 + i * 30}px` }}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
                    <div className="w-10 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 9. TEAM SKELETON (Workload Card + Members Table)
// ============================================================================
export function TeamSkeleton() {
  return (
    <div className="w-full flex flex-col min-h-full md:h-full relative animate-pulse motion-reduce:animate-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-h-[38px] mb-2.5">
        <div className="w-40 h-5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
        <div className="w-28 h-7 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
      </div>

      {/* AI Workload Banner Placeholder */}
      <div className="w-full p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black/[0.07] dark:bg-white/[0.09]" />
          <div className="flex flex-col gap-1.5">
            <div className="w-36 h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="w-64 h-2.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>
        <div className="w-20 h-6 rounded-md bg-black/[0.05] dark:bg-white/[0.07]" />
      </div>

      {/* Filter / Subheader Row */}
      <div className="flex items-center justify-between gap-2 mb-4 min-h-[30px]">
        <div className="flex items-center gap-2">
          <div className="w-16 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="w-48 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
        <div className="w-44 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
      </div>

      {/* Members Table */}
      <div className="flex flex-col border border-border rounded-2xl bg-surface overflow-hidden shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {/* Table header */}
        <div className="px-5 py-3 flex items-center justify-between bg-black/[0.015] dark:bg-white/[0.015]">
          <div className="w-20 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
          <div className="flex items-center gap-12">
            <div className="w-14 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-16 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="w-6 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
          </div>
        </div>

        {/* Member rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/[0.07] dark:bg-white/[0.09] shrink-0" />
              <div className="flex flex-col gap-1">
                <div
                  className="h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]"
                  style={{ width: `${90 + ((i * 23) % 40)}px` }}
                />
                <div className="w-32 h-2.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="w-16 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
              <div className="w-20 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 10. PROJECT DETAILS SKELETON (Breadcrumbs + Tabs + 2-Column Overview)
// ============================================================================
export function ProjectDetailsSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[var(--card-bg)] overflow-hidden text-foreground animate-pulse motion-reduce:animate-none">
      {/* 1. Top Breadcrumb & Action Header */}
      <div className="h-[44px] shrink-0 flex items-center justify-between px-6 border-b border-border bg-[var(--card-bg)]">
        <div className="flex items-center gap-2">
          <div className="w-14 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
          <span className="text-zinc-400 dark:text-zinc-600">›</span>
          <div className="w-20 h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>
      </div>

      {/* 2. Navigation Tab Row */}
      <div className="h-[42px] shrink-0 flex items-center gap-2 px-6 border-b border-border bg-[var(--card-bg)]">
        {["Overview", "Issues", "Milestones"].map((tab, i) => (
          <div
            key={tab}
            className={`h-6 rounded-full px-3 flex items-center text-xs font-medium ${
              i === 0
                ? "bg-black/[0.08] dark:bg-white/[0.12] text-transparent"
                : "bg-transparent text-zinc-400 dark:text-zinc-600"
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* 3. 2-Column Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left: Main Overview Content */}
        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar px-6 sm:px-12 py-8 flex flex-col gap-6">
          {/* Large Title */}
          <div className="w-2/3 h-8 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />

          {/* Description Lines */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-5/6 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-3/5 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>

          {/* Milestones Box */}
          <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="w-24 h-4 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                    <div
                      className="h-3.5 rounded bg-black/[0.06] dark:bg-white/[0.08]"
                      style={{ width: `${100 + i * 25}px` }}
                    />
                  </div>
                  <div className="w-16 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Properties Sidebar (280px) */}
        <div className="w-full md:w-[280px] shrink-0 border-t md:border-t-0 md:border-l border-border p-5 flex flex-col gap-4 bg-[var(--card-bg)]">
          <div className="w-20 h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09] mb-2" />
          {["Status", "Priority", "Health", "Lead", "Target date", "Teams"].map((prop) => (
            <div key={prop} className="grid grid-cols-[90px_1fr] items-center">
              <span className="text-[12px] text-zinc-400 dark:text-zinc-600">{prop}</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                <div className="w-16 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. TASK DETAILS SKELETON (Full Page or Inside Modal)
// ============================================================================
export function TaskDetailsSkeleton({ isModal = false }) {
  return (
    <div
      className={`w-full flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[var(--card-bg)] overflow-hidden text-foreground animate-pulse motion-reduce:animate-none ${
        isModal ? "p-0" : ""
      }`}
    >
      {/* Header */}
      {!isModal && (
        <div className="h-[44px] shrink-0 flex items-center justify-between px-6 border-b border-border bg-[var(--card-bg)]">
          <div className="flex items-center gap-2">
            <div className="w-12 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <span className="text-zinc-400 dark:text-zinc-600">›</span>
            <div className="w-16 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <span className="text-zinc-400 dark:text-zinc-600">›</span>
            <div className="w-20 h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            <div className="w-6 h-6 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>
      )}

      {/* 2-Column Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left: Main Content (Title, Description, Sub-issues, Activity) */}
        <div
          className={`flex-1 min-w-0 overflow-y-auto custom-scrollbar flex flex-col gap-6 ${
            isModal ? "px-6 sm:px-10 py-6" : "px-6 sm:px-12 py-8"
          }`}
        >
          {/* Large Task Title */}
          <div className="w-3/4 h-8 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />

          {/* Description Lines */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-4/5 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-2/3 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>

          {/* Sub-issues Section */}
          <div className="flex flex-col gap-3 pt-3">
            <div className="w-24 h-4 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-black/[0.04] dark:border-white/[0.04] bg-black/[0.015] dark:bg-white/[0.015]"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                  <div
                    className="h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]"
                    style={{ width: `${140 + i * 40}px` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Activity / Comments Stream */}
          <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06] mt-4">
            <div className="w-20 h-3.5 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-black/[0.07] dark:bg-white/[0.09] shrink-0" />
              <div className="flex-1 p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.015] dark:bg-white/[0.015] flex flex-col gap-2">
                <div className="w-28 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                <div className="w-5/6 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Properties Sidebar (280px) */}
        <div
          className={`w-full md:w-[280px] shrink-0 border-t md:border-t-0 md:border-l border-border flex flex-col gap-4 bg-[var(--card-bg)] ${
            isModal ? "p-4" : "p-5"
          }`}
        >
          <div className="w-20 h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09] mb-1" />
          {["Status", "Assignee", "Priority", "Labels", "Project", "Due date"].map((prop) => (
            <div key={prop} className="grid grid-cols-[85px_1fr] items-center">
              <span className="text-[12px] text-zinc-400 dark:text-zinc-600">{prop}</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                <div className="w-16 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. SETTINGS SKELETON (Full-Screen 2-Column: Left Sidebar + Right Cards)
// ============================================================================
export function SettingsSkeleton() {
  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50 flex flex-col md:flex-row bg-[var(--sidebar,#fbfbfb)] dark:bg-[var(--sidebar,#000000)] text-foreground select-none overflow-hidden animate-pulse motion-reduce:animate-none"
      style={{ backgroundColor: "var(--sidebar)" }}
    >
      {/* Left Navigation Sidebar (w-64) */}
      <div className="w-full md:w-64 shrink-0 border-r border-black/[0.08] dark:border-white/[0.06] p-4 flex flex-col gap-6">
        {/* Workspace profile box */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-lg bg-black/[0.08] dark:bg-white/[0.1] shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="w-24 h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="w-16 h-2.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex flex-col gap-4">
          {["Account", "Workspace", "Preferences"].map((cat) => (
            <div key={cat} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider px-2">
                {cat}
              </span>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md"
                >
                  <div className="w-4 h-4 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                  <div
                    className="h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]"
                    style={{ width: `${60 + ((i * 17) % 30)}px` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right Settings Form Content */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-10 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-8">
          <div className="w-32 h-6 rounded-lg bg-black/[0.09] dark:bg-white/[0.12]" />
          <div className="w-64 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
        </div>

        {/* Form Cards */}
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141517] flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-black/[0.08] dark:bg-white/[0.1] shrink-0" />
              <div className="flex flex-col gap-2">
                <div className="w-24 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                <div className="w-32 h-6 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <div className="w-20 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                <div className="w-full h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="w-20 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                <div className="w-full h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141517] flex flex-col gap-4">
            <div className="w-28 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="flex items-center gap-3">
              <div className="w-24 h-8 rounded-lg bg-black/[0.06] dark:bg-white/[0.08]" />
              <div className="w-24 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 13. AGENT SKELETON (Suggestions + Message Stream + Bottom Prompt Input)
// ============================================================================
export function AgentSkeleton() {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--card-bg)] text-foreground overflow-hidden animate-pulse motion-reduce:animate-none">
      {/* Top Header */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-black/[0.08] dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
          <div className="w-24 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
        </div>
        <div className="w-28 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] flex flex-col gap-2"
            >
              <div className="w-24 h-3.5 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
              <div className="w-full h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>

        {/* Mock User Message */}
        <div className="flex justify-end">
          <div className="p-3.5 rounded-2xl bg-black/[0.06] dark:bg-white/[0.08] max-w-md w-2/3 flex flex-col gap-1.5">
            <div className="w-full h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="w-3/4 h-3.5 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
          </div>
        </div>

        {/* Mock Agent Response */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-black/[0.08] dark:bg-white/[0.1] shrink-0 mt-0.5" />
          <div className="flex-1 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-2.5 max-w-xl">
            <div className="w-24 h-3 rounded bg-black/[0.07] dark:bg-white/[0.09]" />
            <div className="w-full h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-5/6 h-3.5 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div className="w-3/5 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Bottom Fixed Prompt Input */}
      <div className="p-4 border-t border-black/[0.08] dark:border-white/[0.06] max-w-3xl mx-auto w-full">
        <div className="h-12 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-4 flex items-center justify-between">
          <div className="w-48 h-3.5 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="w-7 h-7 rounded-lg bg-black/[0.06] dark:bg-white/[0.08]" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 14. CONTEXTUAL ROUTE SKELETON DISPATCHER (Intelligent Deferred Threshold)
// ============================================================================
export function ContextualRouteSkeleton({ pathname = "", delayMs = 180 }) {
  const [show, setShow] = React.useState(delayMs <= 0);

  React.useEffect(() => {
    if (delayMs <= 0) {
      setShow(true);
      return;
    }
    const timer = setTimeout(() => {
      setShow(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!show) return null;

  const cleanPath = (pathname || "").toLowerCase().split("?")[0].replace(/\/+$/, "");

  if (cleanPath === "/dashboard" || cleanPath === "") {
    return <DashboardSkeleton />;
  }
  if (cleanPath === "/inbox") {
    return <InboxSkeleton />;
  }
  if (cleanPath === "/tasks") {
    return <TasksListSkeleton />;
  }
  if (cleanPath.startsWith("/tasks/")) {
    return <TaskDetailsSkeleton isModal={false} />;
  }
  if (cleanPath === "/projects") {
    return <ProjectsListSkeleton />;
  }
  if (cleanPath.startsWith("/projects/")) {
    return <ProjectDetailsSkeleton />;
  }
  if (cleanPath === "/analytics") {
    return <AnalyticsSkeleton />;
  }
  if (cleanPath === "/team") {
    return <TeamSkeleton />;
  }
  if (cleanPath === "/agent") {
    return <AgentSkeleton />;
  }
  if (cleanPath === "/settings" || cleanPath.startsWith("/settings/")) {
    return <SettingsSkeleton />;
  }

  // Graceful fallback: subtle layout with header and card rows
  return (
    <div className="flex-1 flex flex-col p-6 gap-6 animate-pulse motion-reduce:animate-none">
      <div className="w-36 h-6 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl border border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
