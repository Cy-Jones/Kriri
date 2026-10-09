import { ActionMenu, ActionMenuItem, ActionMenuSeparator } from "../ActionMenu";
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
import MembersAvatarStack from "./MembersAvatarStack";
import { getAvatarColor, getInitial } from "../../lib/avatarUtils";
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

import {
  DndContext,
  DragOverlay,
  closestCorners,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

// ============================================================================
// DND-KIT COMPONENTS FOR BOARD
// ============================================================================
function SortableProjectItem({
  project,
  onClick,
  config,
  onDeleteProject,
  isSelected,
  activePicker,
  setActivePicker,
  canManageProjects,
  onUpdateProject,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, data: project });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group rounded-xl p-3.5 flex flex-col gap-3 transition-all ${
        isDragging
          ? "opacity-40 border-2 border-dashed border-white/20 bg-transparent scale-[1.02] shadow-2xl"
          : isSelected
            ? "bg-[#3b82f6]/10 border border-[#3b82f6]/40 shadow-sm cursor-grab active:cursor-grabbing"
            : "bg-[#18191c] hover:bg-[#1c1d21] border border-white/[0.05] shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="font-mono text-[11px] text-[#8a8f98] font-medium tracking-wider pt-0.5">
          {config.properties.id ? project.id : ""}
        </div>

        <div className="flex items-center gap-1.5 -mr-1">
          {config.properties.status && (
            <PickerWrapper
              open={
                activePicker?.type === "status" &&
                activePicker.projectId === project.id
              }
              onOpenChange={(open) => {
                if (open)
                  setActivePicker({ type: "status", projectId: project.id });
                else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <div>
                  <ActionTooltip
                    label={project.status || "Planned"}
                    shortcut="P then S"
                  >
                    <div
                      className={`relative text-[#8a8f98] transition-colors flex items-center justify-center w-5 h-5 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/[0.04] hover:text-[#e8e8e8]" : "cursor-default"}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePicker({
                          type: "status",
                          projectId: project.id,
                        });
                      }}
                    >
                      {getStatusIcon(project.status || "Planned")}
                    </div>
                  </ActionTooltip>
                </div>
              }
            >
              <StatusPicker
                value={project.status || "Planned"}
                onChange={(val) => onUpdateProject(project.id, { status: val })}
                onClose={() => setActivePicker({ type: null, projectId: null })}
              />
            </PickerWrapper>
          )}

          {config.properties.priority && (
            <PickerWrapper
              open={
                activePicker?.type === "priority" &&
                activePicker.projectId === project.id
              }
              onOpenChange={(open) => {
                if (open)
                  setActivePicker({ type: "priority", projectId: project.id });
                else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <div>
                  <ActionTooltip
                    label="Change project priority"
                    shortcut="P then P"
                  >
                    <div
                      className={`relative text-[#8a8f98] transition-colors flex items-center justify-center w-5 h-5 rounded ${canManageProjects ? "cursor-pointer hover:bg-white/[0.04] hover:text-[#e8e8e8]" : "cursor-default"}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePicker({
                          type: "priority",
                          projectId: project.id,
                        });
                      }}
                    >
                      {getPriorityIcon(project.priority || "No priority")}
                    </div>
                  </ActionTooltip>
                </div>
              }
            >
              <PriorityPicker
                value={project.priority || "No priority"}
                onChange={(val) =>
                  onUpdateProject(project.id, { priority: val })
                }
                onClose={() => setActivePicker({ type: null, projectId: null })}
              />
            </PickerWrapper>
          )}

          {config.properties.lead && (
            <PickerWrapper
              open={
                activePicker?.type === "lead_top" &&
                activePicker.projectId === project.id
              }
              onOpenChange={(open) => {
                if (open)
                  setActivePicker({ type: "lead_top", projectId: project.id });
                else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <div
                  className="relative ml-0.5 cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePicker({
                      type: "lead_top",
                      projectId: project.id,
                    });
                  }}
                >
                  {project.lead ? (
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white uppercase overflow-hidden ${getAvatarColor(project.lead.name, project.lead.email)}`}
                    >
                      {project.lead.avatar_url ? (
                        <img
                          src={project.lead.avatar_url}
                          alt={project.lead.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitial(project.lead.name, project.lead.email)
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/[0.1] border-dashed text-white/[0.3]">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
              }
            >
              <LeadPicker
                value={project.lead}
                onChange={(val) => onUpdateProject(project.id, { lead: val })}
                onClose={() => setActivePicker({ type: null, projectId: null })}
              />
            </PickerWrapper>
          )}

          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <ActionMenu
              trigger={
                <ActionTooltip label="Project actions">
                  <button className="text-[#8a8f98] hover:text-[#e8e8e8] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-5 w-5 rounded-md hover:bg-white/[0.04] outline-none ml-1">
                    <MoreHorizontal size={13} />
                  </button>
                </ActionTooltip>
              }
            >
              {canManageProjects && (
                <>
                  <ActionMenuItem onClick={onClick}>
                    Edit project...
                  </ActionMenuItem>
                  <ActionMenuSeparator />
                  <ActionMenuItem
                    destructive
                    onClick={() =>
                      onDeleteProject && onDeleteProject(project.id)
                    }
                  >
                    Delete project
                  </ActionMenuItem>
                </>
              )}
            </ActionMenu>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 -mt-1">
        <Box size={16} className="text-[#f87171] min-w-[16px]" />
        <span
          className="text-[14px] font-medium text-[#e8e8e8] truncate"
          title={project.name}
        >
          {project.name || "Untitled"}
        </span>
      </div>

      <div className="text-[13px] text-[#8a8f98] leading-relaxed line-clamp-2 pr-2">
        {project.description || "No description provided."}
      </div>

      {config.properties.due_date && (
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#8a8f98] mt-1">
          <span className="relative flex items-center gap-1.5 rounded px-1 py-0.5 -ml-1">
            <PickerWrapper
              open={
                activePicker?.type === "startDate" &&
                activePicker.projectId === project.id
              }
              onOpenChange={(open) => {
                if (open)
                  setActivePicker({ type: "startDate", projectId: project.id });
                else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <span>
                  <ActionTooltip label="Set start date" shortcut="Ctrl S">
                    <span
                      className={`transition-colors rounded px-1 py-0.5 ${canManageProjects ? "cursor-pointer hover:bg-white/[0.04] hover:text-[#e8e8e8]" : "cursor-default"}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePicker({
                          type: "startDate",
                          projectId: project.id,
                        });
                      }}
                    >
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )
                        : "Sep 30th"}
                    </span>
                  </ActionTooltip>
                </span>
              }
            >
              <DatePicker
                value={project.start_date}
                onChange={(val) =>
                  onUpdateProject(project.id, { start_date: val })
                }
                onClose={() => setActivePicker({ type: null, projectId: null })}
                placeholder="Start date"
              />
            </PickerWrapper>

            <span className="text-[#5e636e]">&rarr;</span>

            <PickerWrapper
              open={
                activePicker?.type === "dueDate" &&
                activePicker.projectId === project.id
              }
              onOpenChange={(open) => {
                if (open)
                  setActivePicker({ type: "dueDate", projectId: project.id });
                else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <span>
                  <ActionTooltip label="Set target date" shortcut="Ctrl D">
                    <span
                      className={`transition-colors rounded px-1 py-0.5 ${canManageProjects ? "cursor-pointer hover:bg-white/[0.04] hover:text-[#e8e8e8]" : "cursor-default"}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePicker({
                          type: "dueDate",
                          projectId: project.id,
                        });
                      }}
                    >
                      {project.due_date
                        ? new Date(project.due_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )
                        : "---"}
                    </span>
                  </ActionTooltip>
                </span>
              }
            >
              <DatePicker
                value={project.due_date}
                onChange={(val) =>
                  onUpdateProject(project.id, { due_date: val })
                }
                onClose={() => setActivePicker({ type: null, projectId: null })}
                placeholder="Target date"
              />
            </PickerWrapper>
          </span>
          <ActionTooltip label="Created date">
            <span className="flex items-center gap-1.5 cursor-default hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5">
              <Calendar size={13} className="text-[#5e636e]" /> Sep 29
            </span>
          </ActionTooltip>
          <ActionTooltip label="Last updated">
            <span className="flex items-center gap-1.5 cursor-default hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#5e636e]"
              >
                <path d="M21 2v6h-6"></path>
                <path d="M21 13a9 9 0 1 1-3-7.7L21 8"></path>
              </svg>
              Sep 29
            </span>
          </ActionTooltip>
        </div>
      )}

      {config.properties.lead && (
        <div className="relative">
          <ActionTooltip label="Change project lead" shortcut="P then A">
            <div
              className={`flex items-center gap-2 mt-1 text-[13px] text-[#8a8f98]  px-1 py-0.5 -ml-1 rounded transition-colors w-fit ${canManageProjects ? "cursor-pointer hover:bg-white/[0.04] hover:text-[#e8e8e8]" : "cursor-default"}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setActivePicker({ type: "lead", projectId: project.id });
              }}
            >
              {project.lead ? (
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white uppercase overflow-hidden ${getAvatarColor(project.lead.name, project.lead.email)}`}
                >
                  {project.lead.avatar_url ? (
                    <img
                      src={project.lead.avatar_url}
                      alt={project.lead.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitial(project.lead.name, project.lead.email)
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center w-[16px] h-[16px] rounded-[4px] border border-[#e2483d] bg-transparent text-[#e2483d]">
                  <User size={10} />
                </div>
              )}
              <span>{project.lead?.name || "Unassigned"}</span>
            </div>
          </ActionTooltip>
          {activePicker?.type === "lead" &&
            activePicker.projectId === project.id && (
              <LeadPicker
                value={project.lead}
                onChange={(val) => onUpdateProject(project.id, { lead: val })}
                onClose={() => setActivePicker({ type: null, projectId: null })}
              />
            )}
        </div>
      )}

      <div className="mt-1 text-[13px] text-[#8a8f98]">0 issues</div>
    </div>
  );
}

function DroppableProjectColumn({ id, items, children, footer }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="flex-col gap-3 flex-1 overflow-y-auto scrollbar-hide pr-1 pb-40 flex min-h-[150px]"
    >
      <SortableContext
        id={id}
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
      {footer}
    </div>
  );
}

// ============================================================================
// BOARD VIEW COMPONENT
// ============================================================================
export default function BoardViewRenderer({
  projects,
  config,
  groupProjects,
  sortProjects,
  onUpdateProject,
  onDeleteProject,
  draggedProject,
  setDraggedProject,
  navigate,
  setIsCreateModalOpen,
  selectedProjects,
  setSelectedProjects,
  activePicker,
  setActivePicker,
  canManageProjects,
}) {
  const colDimension = config.columnsGrouping || "status";
  const rowDimension = config.rowsSubgrouping || "none";

  const [expandedHiddenRows, setExpandedHiddenRows] = useState({});
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState([]);
  const toggleHiddenRow = (rowTitle) => {
    setExpandedHiddenRows((prev) => ({ ...prev, [rowTitle]: !prev[rowTitle] }));
  };

  const columnKeys = useMemo(() => {
    if (colDimension === "status")
      return ["Backlog", "Planned", "In Progress", "Completed", "Canceled"];
    if (colDimension === "priority")
      return ["Urgent", "High", "Medium", "Low", "No priority"];
    if (colDimension === "health")
      return ["On Track", "At Risk", "Off Track", "No updates"];

    const set = new Set();
    projects.forEach((p) => {
      if (colDimension === "lead" && p.lead?.name) set.add(p.lead.name);
      else if (colDimension === "labels" && p.labels?.[0]) set.add(p.labels[0]);
    });
    return Array.from(set).length > 0 ? Array.from(set) : ["Default Column"];
  }, [colDimension, projects]);

  const swimlaneRows = useMemo(() => {
    if (rowDimension === "none") return { All: projects };
    return groupProjects(projects, rowDimension);
  }, [projects, rowDimension, groupProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeProject, setActiveProject] = useState(null);

  const handleDragStart = (event) => {
    const { active } = event;
    const project = projects.find((p) => p.id === active.id);
    setActiveProject(project || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveProject(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    let targetColKey = overId;
    if (typeof overId === "string" && overId.includes(":::")) {
      targetColKey = overId.split(":::")[1];
    } else {
      const overProject = projects.find((p) => p.id === overId);
      if (overProject) {
        targetColKey = overProject[colDimension] || "Backlog";
        if (colDimension === "lead")
          targetColKey = overProject.lead?.name || "Unassigned";
        if (colDimension === "labels")
          targetColKey = overProject.labels?.[0] || "None";
      }
    }

    if (
      activeProject &&
      targetColKey &&
      activeProject[colDimension] !== targetColKey
    ) {
      const updateField = {};
      if (colDimension === "status") updateField.status = targetColKey;
      else if (colDimension === "priority") updateField.priority = targetColKey;
      else if (colDimension === "health") updateField.health = targetColKey;
      else if (colDimension === "lead")
        updateField.lead = { ...activeProject.lead, name: targetColKey };

      onUpdateProject(activeId, updateField);
    }
    setActiveProject(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`flex-1 flex flex-col overflow-x-auto scrollbar-hide pb-4 min-h-0 min-w-0 bg-transparent ${rowDimension === "none" ? "overflow-y-hidden" : "overflow-y-auto"}`}
      >
        <div
          className={`flex flex-col min-w-max px-1 ${rowDimension === "none" ? "h-full min-h-0" : ""}`}
        >
          {Object.entries(swimlaneRows).map(([rowTitle, rowProjects]) => (
            <div
              key={rowTitle}
              className={`flex flex-col mb-8 last:mb-0 ${rowDimension === "none" ? "h-full min-h-0" : ""}`}
            >
              {rowDimension !== "none" && (
                <div className="text-[13px] font-bold text-white mb-3 pb-1 border-b border-white/10 flex items-center gap-2 sticky left-0 z-20 bg-[#0e0f11]">
                  <span>{rowTitle}</span>
                  <span className="text-[#8a8f98] text-[11px] font-normal">
                    ({rowProjects.length} projects)
                  </span>
                </div>
              )}

              <div
                className={`flex-1 flex gap-5 ${rowDimension === "none" ? "h-full min-h-0" : "items-start"}`}
              >
                {(() => {
                  const columnsData = columnKeys.map((colKey) => {
                    const colProjects = sortProjects(
                      rowProjects.filter((p) => {
                        if (colDimension === "status")
                          return (p.status || "Backlog") === colKey;
                        if (colDimension === "priority")
                          return (p.priority || "No priority") === colKey;
                        if (colDimension === "health")
                          return (p.health || "No updates") === colKey;
                        if (colDimension === "lead")
                          return p.lead?.name === colKey;
                        return true;
                      }),
                      config.ordering,
                    );

                    const droppableId =
                      rowDimension !== "none"
                        ? `${rowTitle}:::${colKey}`
                        : colKey;

                    return { colKey, colProjects, droppableId };
                  });

                  const initialVisible = config.showEmptyColumns
                    ? columnsData
                    : columnsData.filter((c) => c.colProjects.length > 0);
                  const initialHidden = config.showEmptyColumns
                    ? []
                    : columnsData.filter((c) => c.colProjects.length === 0);

                  const visibleColumns = initialVisible.filter(
                    (c) => !hiddenColumnKeys.includes(c.colKey),
                  );
                  const hiddenColumns = [
                    ...new Set([
                      ...initialHidden,
                      ...columnsData.filter((c) =>
                        hiddenColumnKeys.includes(c.colKey),
                      ),
                    ]),
                  ];

                  return (
                    <>
                      {visibleColumns.map(
                        ({ colKey, colProjects, droppableId }) => (
                          <div
                            key={colKey}
                            className={`flex flex-col flex-1 w-[320px] min-w-[320px] max-w-[320px] group transition-all duration-300 ${
                              config.showColumnBackgrounds
                                ? "bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3"
                                : ""
                            }`}
                          >
                            <div
                              className={`flex items-center justify-between py-1 mb-3 sticky top-0 z-10 transition-colors ${
                                config.showColumnBackgrounds
                                  ? "bg-transparent"
                                  : "bg-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-[13px] font-medium text-[#e8e8e8]">
                                {colKey === "Completed" ? (
                                  <CheckSquare
                                    size={14}
                                    className="text-success"
                                  />
                                ) : colKey === "In Progress" ? (
                                  <Compass
                                    size={14}
                                    className="text-warning fill-warning/20"
                                  />
                                ) : colKey === "Planned" ? (
                                  <FileText
                                    size={14}
                                    className="text-info fill-info/20"
                                  />
                                ) : (
                                  <Compass
                                    size={14}
                                    className="text-[#8a8f98]"
                                  />
                                )}
                                <span>{colKey}</span>
                                <span className="text-[#8a8f98] font-normal">
                                  {colProjects.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionMenu
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-[#8a8f98] hover:text-[#e8e8e8]"
                                    >
                                      <MoreHorizontal size={14} />
                                    </Button>
                                  }
                                >
                                  <ActionMenuItem
                                    onClick={() => {
                                      const ids = colProjects.map((p) => p.id);
                                      setSelectedProjects((prev) => [
                                        ...new Set([...prev, ...ids]),
                                      ]);
                                    }}
                                  >
                                    Select all in column
                                  </ActionMenuItem>
                                  <ActionMenuSeparator />
                                  <ActionMenuItem
                                    onClick={() =>
                                      setHiddenColumnKeys((prev) => [
                                        ...prev,
                                        colKey,
                                      ])
                                    }
                                  >
                                    Hide column
                                  </ActionMenuItem>
                                </ActionMenu>
                                <Button
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-[#8a8f98] hover:text-[#e8e8e8]"
                                  onClick={() => setIsCreateModalOpen(true)}
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>
                            </div>

                            <DroppableProjectColumn
                              id={droppableId}
                              items={colProjects.map((p) => p.id)}
                              footer={
                                <div
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCreateModalOpen(true);
                                  }}
                                  className="flex items-center gap-2 px-2 py-1.5 mt-1 bg-transparent hover:bg-white/[0.04] rounded-lg text-[#8a8f98] hover:text-[#e8e8e8] cursor-pointer transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                >
                                  <Plus size={14} />
                                  <span className="text-[13px] font-medium">
                                    New project
                                  </span>
                                </div>
                              }
                            >
                              {colProjects.map((project) => (
                                <SortableProjectItem
                                  key={project.id}
                                  project={project}
                                  config={config}
                                  isSelected={
                                    selectedProjects &&
                                    selectedProjects.includes(project.id)
                                  }
                                  activePicker={activePicker}
                                  setActivePicker={setActivePicker}
                                  onUpdateProject={onUpdateProject}
                                  canManageProjects={canManageProjects}
                                  onClick={(e) => {
                                    if (e.metaKey || e.ctrlKey || e.shiftKey) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedProjects((prev) =>
                                        prev.includes(project.id)
                                          ? prev.filter(
                                              (id) => id !== project.id,
                                            )
                                          : [...prev, project.id],
                                      );
                                    } else {
                                      navigate(`/projects/${project.id}`);
                                    }
                                  }}
                                  onDeleteProject={onDeleteProject}
                                />
                              ))}
                            </DroppableProjectColumn>
                          </div>
                        ),
                      )}

                      {hiddenColumns.length > 0 && (
                        <div className="flex flex-col flex-shrink-0 min-w-[240px] ml-2">
                          {!expandedHiddenRows[rowTitle] ? (
                            <button
                              onClick={() => toggleHiddenRow(rowTitle)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.02] text-[#8a8f98] text-[12px] font-medium hover:text-[#e8e8e8] hover:bg-white/[0.04] self-start transition-colors"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                              Hidden columns
                            </button>
                          ) : (
                            <div className="flex flex-col">
                              <button
                                onClick={() => toggleHiddenRow(rowTitle)}
                                className="flex items-center gap-1.5 mb-3 text-[12px] font-medium text-[#8a8f98] hover:text-[#e8e8e8] self-start transition-colors"
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polygon points="19 5 12 19 5 5 19 5"></polygon>
                                </svg>
                                Hidden columns
                              </button>
                              <div className="flex flex-col gap-1.5">
                                {hiddenColumns.map((col) => (
                                  <div
                                    key={col.colKey}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.01] border border-white/[0.02]"
                                  >
                                    <div className="flex items-center gap-2 text-[12px] text-[#e8e8e8] font-medium">
                                      {col.colKey === "Completed" ? (
                                        <CheckSquare
                                          size={13}
                                          className="text-success"
                                        />
                                      ) : col.colKey === "In Progress" ? (
                                        <Compass
                                          size={13}
                                          className="text-warning fill-warning/20"
                                        />
                                      ) : col.colKey === "Planned" ? (
                                        <FileText
                                          size={13}
                                          className="text-info fill-info/20"
                                        />
                                      ) : (
                                        <Compass
                                          size={13}
                                          className="text-[#8a8f98]"
                                        />
                                      )}
                                      {col.colKey}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[#8a8f98] text-[11px] font-medium px-1.5 bg-white/[0.04] rounded-md">
                                        {col.colProjects.length}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        className="h-6 px-2 text-[#8a8f98] hover:text-[#e8e8e8] text-[11px]"
                                        onClick={() => {
                                          if (
                                            hiddenColumnKeys.includes(
                                              col.colKey,
                                            )
                                          ) {
                                            setHiddenColumnKeys((prev) =>
                                              prev.filter(
                                                (k) => k !== col.colKey,
                                              ),
                                            );
                                          } else {
                                            setIsCreateModalOpen(true);
                                          }
                                        }}
                                      >
                                        {hiddenColumnKeys.includes(
                                          col.colKey,
                                        ) ? (
                                          "Show"
                                        ) : (
                                          <Plus size={12} />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeProject ? (
          <SortableProjectItem
            project={activeProject}
            config={config}
            canManageProjects={canManageProjects}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
