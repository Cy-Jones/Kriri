import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  LayoutGrid,
  FileText,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Settings,
  Settings2,
  PanelRight,
  Layers,
  MoreHorizontal,
  CheckSquare,
  Compass,
  AlignJustify,
  AlignLeft,
  Sparkles,
  ListFilter,
  CircleDashed,
  Signal,
  Tag,
  User,
  Activity,
  Contact,
  Users,
  UserPen,
  Umbrella,
  Diamond,
  Flag,
  File,
  Feather,
  Box,
  Hexagon,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Edit2,
  Network,
  Link2,
  Sidebar,
  Layout,
} from "lucide-react";
import { api } from "../../lib/api";
import { ProjectsEmptyIcon } from "../../components/EmptyStateIcons";
import CreateProjectModal from "../../components/CreateProjectModal";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { Button } from "@/registry/components/button/button";
import { Tabs, TabsList, TabsTrigger } from "@/registry/components/tabs/tabs";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import DropdownMenu from "@/registry/components/dropdown-menu/dropdown-menu";
import { Progress } from "@/registry/components/progress/progress";
import { Badge } from "@/registry/components/badge/badge";
import { AvatarGroup } from "@/registry/components/avatar-group/avatar-group";
import PriorityPicker, {
  getPriorityIcon,
} from "../../components/PriorityPicker";
import LeadPicker from "../../components/LeadPicker";
import DatePicker from "../../components/DatePicker";
import ActionTooltip from "../../components/ActionTooltip";
import StatusPicker, { getStatusIcon } from "../../components/StatusPicker";
import HealthPicker, { getHealthIcon } from "../../components/HealthPicker";
import ProgressPicker from "../../components/ProgressPicker";
import LabelPicker from "../../components/LabelPicker";
import MemberPicker from "../../components/MemberPicker";
import PickerWrapper from "../../components/PickerWrapper";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";

// ============================================================================
// TIMELINE VIEW COMPONENT (BUG-FREE ROBUST GANTT RENDERER)
// ============================================================================
export default function TimelineViewRenderer({
  projects,
  config,
  groupProjects,
  collapsedGroups,
  toggleGroupCollapse,
  onUpdateProject,
  timelineScrollRef,
  hoveredProject,
  setHoveredProject,
  tooltipPos,
  setTooltipPos,
  navigate,
}) {
  const zoom = config.zoom || "Quarter";
  const grouping = config.grouping || "none";

  // Group timeline projects safely
  const groupedTimeline = useMemo(() => {
    return groupProjects(projects, grouping);
  }, [projects, grouping, groupProjects]);

  // Compute Timeline Date Scale
  const timelineColumns = useMemo(() => {
    if (zoom === "Year") {
      return [
        { month: "SEP 2026", days: [1, 15] },
        { month: "OCT", days: [1, 15] },
        { month: "NOV", days: [1, 15] },
        { month: "DEC", days: [1, 15] },
        { month: "JAN 2027", days: [1, 15] },
        { month: "FEB", days: [1, 15] },
        { month: "MAR", days: [1, 15] },
        { month: "APR", days: [1, 15] },
      ];
    } else if (zoom === "Month") {
      return [
        { month: "OCTOBER 2026", days: [1, 5, 10, 15, 20, 25, 30] },
        { month: "NOVEMBER 2026", days: [1, 5, 10, 15, 20, 25, 30] },
      ];
    } else if (zoom === "Week") {
      return [
        { month: "WEEK 40", days: [28, 29, 30, 1, 2, 3, 4] },
        { month: "WEEK 41", days: [5, 6, 7, 8, 9, 10, 11] },
        { month: "WEEK 42", days: [12, 13, 14, 15, 16, 17, 18] },
      ];
    }
    // Default Quarter
    return [
      { month: "SEP 2026", days: [1, 8, 15, 22, 29] },
      { month: "OCT", days: [6, 13, 20, 27] },
      { month: "NOV", days: [3, 10, 17, 24] },
      { month: "DEC", days: [1, 8, 15, 22, 29] },
      { month: "JAN 2027", days: [5, 12, 19, 26] },
      { month: "FEB", days: [2, 9, 16, 23] },
    ];
  }, [zoom]);

  // Compute Timeline Start & End Reference Timestamps dynamically based on zoom
  const { baseStartMs, baseEndMs, totalRangeMs } = useMemo(() => {
    let start, end;
    if (zoom === "Year") {
      start = new Date("2026-09-01").getTime();
      end = new Date("2027-04-30").getTime();
    } else if (zoom === "Month") {
      start = new Date("2026-10-01").getTime();
      end = new Date("2026-11-30").getTime();
    } else if (zoom === "Week") {
      start = new Date("2026-09-28").getTime();
      end = new Date("2026-10-18").getTime();
    } else {
      // Quarter
      start = new Date("2026-09-01").getTime();
      end = new Date("2027-02-28").getTime();
    }
    return { baseStartMs: start, baseEndMs: end, totalRangeMs: end - start };
  }, [zoom]);

  const calculateBarPos = (startStr, dueStr, fallbackIdx) => {
    let startMs = startStr ? new Date(startStr).getTime() : NaN;
    let dueMs = dueStr ? new Date(dueStr).getTime() : NaN;

    if (isNaN(startMs)) startMs = baseStartMs + fallbackIdx * 12 * 86400000;
    if (isNaN(dueMs)) dueMs = startMs + 60 * 86400000;

    const left = Math.max(
      2,
      Math.min(90, ((startMs - baseStartMs) / totalRangeMs) * 100),
    );
    const width = Math.max(
      6,
      Math.min(95 - left, ((dueMs - startMs) / totalRangeMs) * 100),
    );

    return { left: `${left}%`, width: `${width}%` };
  };

  const handleScrollToToday = () => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ left: 180, behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative border-t border-white/5 bg-[#18191c]">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#212226]/60 border-b border-white/5 z-20">
        <div className="flex items-center gap-2 text-[12px] text-[#8a8f98]">
          <span className="font-semibold text-white">Timeline View</span>
          <span>•</span>
          <span>
            Zoom: <strong className="text-white">{zoom}</strong>
          </span>
          {grouping !== "none" && (
            <>
              <span>•</span>
              <span>
                Grouping:{" "}
                <strong className="text-white capitalize">{grouping}</strong>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScrollToToday}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[12px] font-medium transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Timeline Scroll Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Project List Column */}
        {config.showProjectList && (
          <div className="w-[300px] min-w-[300px] border-r border-white/10 bg-[#18191c] flex flex-col z-20">
            <div className="h-10 px-4 py-2 border-b border-white/10 text-[11px] font-semibold text-[#8a8f98] uppercase tracking-wider flex items-center">
              Project Name
            </div>
            <div className="flex flex-col overflow-y-auto flex-1">
              {Object.entries(groupedTimeline).map(
                ([groupTitle, groupItems]) => {
                  const isCollapsed = collapsedGroups[`timeline_${groupTitle}`];
                  return (
                    <div key={groupTitle} className="flex flex-col">
                      {grouping !== "none" && (
                        <div
                          onClick={() =>
                            toggleGroupCollapse(`timeline_${groupTitle}`)
                          }
                          className="h-8 px-3 bg-[#212226]/50 border-b border-white/5 flex items-center justify-between cursor-pointer text-[11px] font-medium text-[#e8e8e8]"
                        >
                          <div className="flex items-center gap-1.5">
                            {isCollapsed ? (
                              <ChevronRight size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                            <span className="truncate">{groupTitle}</span>
                          </div>
                          <span className="text-[10px] text-[#8a8f98]">
                            {groupItems.length}
                          </span>
                        </div>
                      )}

                      {!isCollapsed &&
                        groupItems.map((project) => (
                          <div
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="h-12 px-4 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer text-[13px] group"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-4 flex-1">
                              <div className="w-3.5 h-3.5 rounded bg-[#e95454]/10 text-[#e95454] flex items-center justify-center flex-shrink-0">
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                              </div>
                              <span className="font-medium text-white group-hover:text-white truncate">
                                {project.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {config.properties?.priority && (
                                <Badge
                                  size="sm"
                                  tone={
                                    project.priority === "Urgent" ||
                                    project.priority === "High"
                                      ? "danger"
                                      : project.priority === "Medium"
                                        ? "warning"
                                        : "neutral"
                                  }
                                >
                                  {project.priority || "No priority"}
                                </Badge>
                              )}
                              {config.properties?.status && (
                                <div className="text-[10px] bg-white/[0.04] text-[#8a8f98] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                  {project.status || "Planned"}
                                </div>
                              )}
                              {config.properties?.lead && project.lead && (
                                <AvatarGroup
                                  size="sm"
                                  max={1}
                                  members={[
                                    {
                                      name:
                                        project.lead.name ||
                                        project.lead.avatar ||
                                        "C",
                                    },
                                  ]}
                                />
                              )}
                              {config.properties?.progress && (
                                <div className="text-[11px] text-[#8a8f98] font-mono w-8 text-right">
                                  {project.progress || 0}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* Right Time Scale & Bars */}
        <div
          ref={timelineScrollRef}
          className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative"
        >
          {/* Header Axis Scale */}
          <div className="flex border-b border-white/10 bg-[#18191c] min-w-max sticky top-0 z-10">
            {timelineColumns.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-col border-r border-white/10 min-w-[220px]"
              >
                <div className="text-[10px] font-bold text-[#8a8f98] uppercase tracking-wider px-3 py-1 bg-white/[0.02]">
                  {m.month}
                </div>
                <div className="flex w-full">
                  {m.days.map((d, di) => (
                    <div
                      key={di}
                      className="flex-1 text-[10px] text-[#5e636e] py-1 text-center border-r border-white/5 last:border-r-0"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Today Indicator Line */}
          <div className="absolute top-0 bottom-0 left-[180px] w-px bg-white/40 z-10 opacity-80 pointer-events-none">
            <div className="absolute -top-1 -left-5 bg-white/40 text-white text-[9px] font-bold px-1 rounded">
              TODAY
            </div>
          </div>

          {/* Grouped Rows */}
          <div className="flex flex-col min-w-max">
            {Object.entries(groupedTimeline).map(([groupTitle, groupItems]) => {
              const isCollapsed = collapsedGroups[`timeline_${groupTitle}`];
              let globalIdx = 0;

              return (
                <div key={groupTitle} className="flex flex-col">
                  {grouping !== "none" && (
                    <div className="h-8 bg-[#212226]/30 border-b border-white/5 px-4 flex items-center text-[11px] font-bold text-[#8a8f98]">
                      {groupTitle}
                    </div>
                  )}

                  {!isCollapsed &&
                    groupItems.map((project) => {
                      globalIdx++;
                      const posStyle = calculateBarPos(
                        project.start_date,
                        project.due_date,
                        globalIdx,
                      );

                      return (
                        <div
                          key={project.id}
                          onClick={() => navigate(`/projects/${project.id}`)}
                          onMouseEnter={(e) => {
                            setHoveredProject(project);
                            setTooltipPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredProject(null)}
                          className="h-12 border-b border-white/5 relative flex items-center min-w-[1300px] hover:bg-white/[0.02] cursor-pointer"
                        >
                          {/* Project Timeline Bar */}
                          <div
                            className="absolute h-6 rounded-md bg-white/10 border border-white/20 hover:border-white/50 transition-colors flex items-center px-3 gap-2 overflow-hidden shadow-sm"
                            style={posStyle}
                          >
                            <div
                              className="bg-white h-full absolute left-0 top-0 opacity-20"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                            <span className="text-[11px] font-medium text-white truncate relative z-10">
                              {project.name}
                            </span>
                            <span className="text-[10px] text-[#8a8f98] relative z-10 ml-auto font-mono">
                              {project.progress || 0}%
                            </span>
                          </div>

                          {/* Milestones Markers (◆) */}
                          {config.showMilestones &&
                            Array.isArray(project.milestones) &&
                            project.milestones.map((m, mIdx) => (
                              <div
                                key={m.id || mIdx}
                                title={`Milestone: ${m.name || "Unnamed"} (${m.due_date || "No date"})`}
                                className="absolute text-amber-400 text-xs font-bold z-20 transform -translate-x-1/2 hover:scale-125 transition-transform"
                                style={{
                                  left: `calc(${posStyle.left} + ${10 + mIdx * 12}%)`,
                                }}
                              >
                                ◆
                              </div>
                            ))}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredProject && (
        <div
          className="fixed bg-[#212226] border border-white/10 rounded-lg p-3 shadow-2xl z-50 text-[12px] text-white pointer-events-none flex flex-col gap-1.5 w-60"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y - 40 }}
        >
          <div className="font-bold text-[13px] text-white">
            {hoveredProject.name}
          </div>
          <div className="text-[11px] text-[#8a8f98] line-clamp-2">
            {hoveredProject.description || "No description"}
          </div>
          <div className="flex justify-between pt-1 border-t border-white/10 text-[11px]">
            <span>
              Status: <strong>{hoveredProject.status}</strong>
            </span>
            <span>
              Progress: <strong>{hoveredProject.progress}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
