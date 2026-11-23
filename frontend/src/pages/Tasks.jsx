import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, startTransition, memo } from "react";
import { useOutletContext, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  CheckSquare,
  FileText,
  Menu,
  X,
  AlignJustify,
  LayoutGrid,
  Filter,
  ListFilter,
  SlidersHorizontal,
  Settings2,
  Check,
  ChevronRight,
  ChevronDown,
  User,
  UserCheck,
  Calendar,
  Clock,
  Building,
  Box,
  Signal,
  CircleDashed,
  RotateCcw,
  Sparkles,
  GitFork,
  Type,
} from "lucide-react";
import StatusPicker, { getStatusIcon } from "../components/StatusPicker";
import PriorityPicker, { getPriorityIcon } from "../components/PriorityPicker";
import LeadPicker from "../components/LeadPicker";
import DatePicker from "../components/DatePicker";
import ViewSwitcher from "../components/ViewSwitcher";
import { playUiSound } from "../lib/sound";
import { getAvatarColor, getInitial } from "../lib/avatarUtils";
import { api } from "../lib/api";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import { TasksListSkeleton, TasksBoardSkeleton } from "../components/skeletons/PageSkeletons";
import { useDeferredSkeleton } from "../hooks/useDeferredSkeleton";
import Kanban from "./Kanban";
import { useUser, useOrganization } from "@clerk/react";
import { useSocket } from "../contexts/SocketContext";
import { useListShortcuts } from "../hooks/useListShortcuts";
import { useTheme } from "../contexts/ThemeContext";
import { formatKririDate, formatMemberDisplayName } from "../lib/userPreferences";
import { Format as Checklist } from "@lucasmarkes/hairline/react";
import { KririAgentIcon } from "../components/ai/KririAgentIcon";
import { useTasksStore, useProjectsStore, dataStore } from "../lib/dataStore";
import { viewStateStore } from "../lib/viewStateStore";

const SCOPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "assigned", label: "Assigned to me" },
  { value: "created", label: "Created by me" },
];

const QUICK_FILTERS = [
  { value: "all", label: "All priorities & dates" },
  { value: "high", label: "High & Urgent priority" },
  { value: "due_week", label: "Due this week" },
  { value: "overdue", label: "Overdue" },
];

const TASK_STATUS_OPTIONS = [
  { value: "Backlog", number: 1 },
  { value: "Todo", number: 2 },
  { value: "In Progress", number: 3 },
  { value: "In Review", number: 4 },
  { value: "Done", number: 5 },
  { value: "Canceled", number: 6 },
];

const calculateTimeInStatus = (task) => {
  if (!task) return "1h";
  const dateStr = task.updated_at || task.created_at;
  if (!dateStr) return "1h";
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
};

const areTaskRowPropsEqual = (prevProps, nextProps) => {
  if (prevProps.task !== nextProps.task) {
    const p = prevProps.task;
    const n = nextProps.task;
    if (p.id !== n.id) return false;
    if (p.title !== n.title) return false;
    if (p.status !== n.status) return false;
    if (p.priority !== n.priority) return false;
    if (p.due_date !== n.due_date) return false;
    if (p.assignee_id !== n.assignee_id) return false;
    if (p.assignee_name !== n.assignee_name) return false;
    if (p.assignee_avatar_url !== n.assignee_avatar_url) return false;
    if (p.subtask_count !== n.subtask_count) return false;
    if (p.completed_subtask_count !== n.completed_subtask_count) return false;
    if (p.blocked_count !== n.blocked_count) return false;
    if (p.project_identifier !== n.project_identifier) return false;
    if (p.project_name !== n.project_name) return false;
  }
  if (prevProps.isHighlighted !== nextProps.isHighlighted) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isChecked !== nextProps.isChecked) return false;
  if (prevProps.visibleProperties !== nextProps.visibleProperties) return false;
  if (prevProps.hoveredTooltipType !== nextProps.hoveredTooltipType) return false;
  if (prevProps.hoveredAssigneeTaskId !== nextProps.hoveredAssigneeTaskId) return false;
  if (prevProps.activePickerType !== nextProps.activePickerType) return false;
  if (prevProps.availableMembers !== nextProps.availableMembers) return false;
  if (prevProps.organization !== nextProps.organization) return false;
  if (prevProps.onMouseEnter !== nextProps.onMouseEnter) return false;
  if (prevProps.onMouseLeave !== nextProps.onMouseLeave) return false;
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps.onTaskClick !== nextProps.onTaskClick) return false;
  if (prevProps.onToggleSelection !== nextProps.onToggleSelection) return false;
  if (prevProps.onSetHoveredTooltip !== nextProps.onSetHoveredTooltip) return false;
  if (prevProps.onTogglePicker !== nextProps.onTogglePicker) return false;
  if (prevProps.onSetHoveredAssignee !== nextProps.onSetHoveredAssignee) return false;
  if (prevProps.onUpdateProperty !== nextProps.onUpdateProperty) return false;
  if (prevProps.onUpdateAssignee !== nextProps.onUpdateAssignee) return false;
  if (prevProps.getAssigneeUsername !== nextProps.getAssigneeUsername) return false;
  return true;
};

const TaskRow = memo(function TaskRow({
  task,
  idx,
  isHighlighted,
  isSelected,
  isChecked,
  visibleProperties,
  hoveredTooltipType,
  hoveredAssigneeTaskId,
  activePickerType,
  availableMembers,
  organization,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onTaskClick,
  onToggleSelection,
  onSetHoveredTooltip,
  onTogglePicker,
  onSetHoveredAssignee,
  onUpdateProperty,
  onUpdateAssignee,
  getAssigneeUsername,
}) {
  const isDone = task.status === "Done";
  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <div
      id={`task-row-desktop-${task.id}`}
      onMouseEnter={onMouseEnter ? () => onMouseEnter(task.id) : undefined}
      onMouseLeave={onMouseLeave}
      onClick={onClick || (() => onTaskClick?.(task.id))}
      className={`group relative flex items-center px-4 py-2.5 transition-colors cursor-pointer text-[13px] rounded-lg mx-1 ${
        isHighlighted
          ? "bg-black/[0.05] dark:bg-white/[0.08]"
          : isChecked
            ? "bg-black/[0.04] dark:bg-white/[0.06]"
            : isSelected
              ? "bg-black/[0.03] dark:bg-white/[0.05]"
              : "hover:bg-black/[0.025] dark:hover:bg-white/[0.035]"
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 40px" }}
    >
      {/* 1. Selection Checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelection(task.id);
        }}
        className={`w-4 shrink-0 mr-2 flex items-center justify-start text-zinc-400 cursor-pointer transition-opacity ${
          isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        title={isChecked ? "Deselect task" : "Select task"}
      >
        <div
          className={`w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center ${
            isChecked
              ? "bg-accent border-accent text-white"
              : "border-zinc-400/60 dark:border-zinc-600 hover:border-zinc-300"
          }`}
        >
          {isChecked && <Check size={10} strokeWidth={3} />}
        </div>
      </div>

      {/* 2. Priority Icon */}
      {visibleProperties.priority && (
        <div
          className="kriri-row-picker relative w-5 shrink-0 mr-2.5 sm:mr-3 flex items-center justify-center"
          onMouseEnter={() => onSetHoveredTooltip("priority")}
          onMouseLeave={() => onSetHoveredTooltip(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetHoveredTooltip(null);
              onTogglePicker("priority");
            }}
            className="w-5 h-5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] flex items-center justify-center text-zinc-400 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title={`Priority: ${task.priority || "No priority"}`}
          >
            {getPriorityIcon(task.priority || "No priority")}
          </button>

          {/* Hover Tooltip */}
          {hoveredTooltipType === "priority" && activePickerType !== "priority" && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-40 bg-zinc-900/95 dark:bg-[#1a1b1e] text-white text-[11px] px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap flex items-center gap-2 pointer-events-none border border-white/10 animate-in fade-in duration-100 font-medium">
              <span>Set priority</span>
              <span className="font-mono text-[9px] text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-semibold">P</span>
            </div>
          )}

          {/* Inline Priority Picker */}
          {activePickerType === "priority" && (
            <div className="absolute top-[calc(100%+4px)] left-0 z-50" onClick={(e) => e.stopPropagation()}>
              <PriorityPicker
                value={task.priority || "No priority"}
                onChange={(val) => onUpdateProperty(task.id, "priority", val)}
                onClose={() => onTogglePicker(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. Task Identifier */}
      {visibleProperties.id && (
        <div className="w-[115px] shrink-0 mr-3 sm:mr-3.5 font-mono text-[11px] text-zinc-500 dark:text-[#8a8f98] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate">
          {task.project_identifier
            ? `${task.project_identifier}-${task.id}`
            : `TASK-${task.id}`}
        </div>
      )}

      {/* 4. Status Circle Icon */}
      {visibleProperties.status && (
        <div
          className="kriri-row-picker relative w-5 shrink-0 mr-2.5 sm:mr-3 flex items-center justify-center"
          onMouseEnter={() => onSetHoveredTooltip("status")}
          onMouseLeave={() => onSetHoveredTooltip(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetHoveredTooltip(null);
              onTogglePicker("status");
            }}
            className="w-5 h-5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
            title={`Status: ${task.status}`}
          >
            {getStatusIcon(task.status)}
          </button>

          {/* Hover Tooltip */}
          {hoveredTooltipType === "status" && activePickerType !== "status" && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-40 bg-zinc-900/95 dark:bg-[#1a1b1e] text-white text-[11px] p-2.5 rounded-lg shadow-2xl whitespace-nowrap flex flex-col gap-1.5 pointer-events-none border border-white/10 animate-in fade-in duration-100 min-w-[155px]">
              <div className="text-[10px] text-zinc-400 font-medium">Time in status</div>
              <div className="flex items-center justify-between font-medium gap-3">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(task.status)}
                  <span className="text-[12px]">{task.status || "Todo"}</span>
                </div>
                <span className="text-zinc-400 text-[11px] font-mono">
                  {calculateTimeInStatus(task)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px] text-zinc-400">
                <span>Change status</span>
                <span className="font-mono text-[9px] text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-semibold">S</span>
              </div>
            </div>
          )}

          {/* Inline Status Picker */}
          {activePickerType === "status" && (
            <div className="absolute top-[calc(100%+4px)] left-0 z-50" onClick={(e) => e.stopPropagation()}>
              <StatusPicker
                value={task.status || "Todo"}
                options={TASK_STATUS_OPTIONS}
                onChange={(val) => onUpdateProperty(task.id, "status", val)}
                onClose={() => onTogglePicker(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* 5. Title & Subtask badge */}
      <div className="flex-1 min-w-0 md:flex-initial md:w-[280px] lg:w-[340px] xl:w-[400px] md:shrink-0 pr-6 lg:pr-8 flex items-center gap-2">
        <span
          className={`truncate font-medium transition-colors ${
            isDone
              ? "line-through text-zinc-400 dark:text-[#8a8f98]"
              : "text-zinc-900 dark:text-[#e8e8e8] group-hover:text-zinc-900 dark:group-hover:text-white"
          }`}
        >
          {task.title}
        </span>
        {visibleProperties.subtasks && task.subtask_count > 0 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-zinc-500 dark:text-[#8a8f98] px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] shrink-0">
            <CheckSquare size={10} className="text-emerald-500" />
            <span>
              {task.completed_subtask_count || 0}/{task.subtask_count}
            </span>
          </span>
        )}
      </div>

      {/* 6. Project Column */}
      {visibleProperties.project && (
        <div className="flex-1 min-w-0 hidden md:flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-[#8a8f98] truncate pr-6 lg:pr-8">
          {task.project_name ? (
            <>
              <FileText size={12} className="shrink-0 text-zinc-400 dark:text-[#6e737d]" />
              <span className="truncate">{task.project_name}</span>
            </>
          ) : null}
        </div>
      )}

      {/* 7. Assignee Avatar */}
      {visibleProperties.assignee && (
        <div
          className="kriri-row-picker relative w-6 shrink-0 mr-4 sm:mr-5 flex items-center justify-center"
          onMouseEnter={() => onSetHoveredAssignee(true)}
          onMouseLeave={() => onSetHoveredAssignee(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetHoveredAssignee(false);
              onTogglePicker("assignee");
            }}
            className="w-5 h-5 rounded-full hover:ring-2 hover:ring-accent/40 transition-all flex items-center justify-center cursor-pointer"
          >
            {task.assignee_name ? (
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase ${getAvatarColor(
                  task.assignee_name
                )}`}
                title={task.assignee_name}
              >
                {getInitial(task.assignee_name)}
              </div>
            ) : (
              <div
                className="w-5 h-5 rounded-full border border-dashed border-zinc-400/40 dark:border-zinc-700 flex items-center justify-center text-zinc-400 dark:text-[#8a8f98] hover:border-zinc-300"
                title="Unassigned"
              >
                <User size={10} />
              </div>
            )}
          </button>

          {/* Hover Profile Card */}
          {hoveredAssigneeTaskId && task.assignee_name && activePickerType !== "assignee" && (
            <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[210px] bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5 text-zinc-900 dark:text-white pointer-events-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase ${getAvatarColor(
                    task.assignee_name
                  )}`}
                >
                  {getInitial(task.assignee_name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12.5px] font-semibold truncate leading-tight">
                    {task.assignee_name}
                  </span>
                  <span className="text-[10.5px] text-zinc-500 dark:text-[#8a8f98] truncate">
                    @{getAssigneeUsername ? getAssigneeUsername(task) : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-[11px] text-zinc-500 dark:text-[#8a8f98] pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="shrink-0" />
                  <span>
                    {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} local time
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building size={11} className="shrink-0" />
                  <span className="truncate">{organization?.name || "Workspace"}</span>
                </div>
                {task.project_name && (
                  <div className="flex items-center gap-1.5">
                    <Box size={11} className="shrink-0" />
                    <span className="truncate">{task.project_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inline Assignee Picker */}
          {activePickerType === "assignee" && (
            <div className="absolute top-[calc(100%+4px)] right-0 z-50" onClick={(e) => e.stopPropagation()}>
              <LeadPicker
                value={task.assignee_id ? { id: task.assignee_id, name: task.assignee_name } : null}
                availableMembers={availableMembers}
                onChange={(member) => onUpdateAssignee(task.id, member)}
                onClose={() => onTogglePicker(null)}
                align="right"
                title="Assign to..."
                emptyLabel="No assignee"
                roleLabel=""
              />
            </div>
          )}
        </div>
      )}

      {/* 8. Due Date */}
      {visibleProperties.dueDate && (
        <div className="kriri-row-picker relative w-[115px] shrink-0 flex items-center justify-start">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePicker("due_date");
            }}
            className={`w-full flex items-center justify-start gap-1.5 text-[11.5px] font-medium whitespace-nowrap cursor-pointer py-0.5 px-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left ${
              isOverdue
                ? "text-rose-500 font-semibold"
                : "text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white"
            }`}
            title={task.due_date ? `Due: ${formatKririDate(task.due_date)}` : "Set due date"}
          >
            <Calendar
              size={12}
              strokeWidth={1.75}
              className={`shrink-0 ${
                isOverdue
                  ? "text-rose-500"
                  : "text-zinc-400 dark:text-[#6e737d] group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
              }`}
            />
            <span className="whitespace-nowrap">
              {task.due_date ? formatKririDate(task.due_date) : "---"}
            </span>
          </button>

          {/* Inline Date Picker */}
          {activePickerType === "due_date" && (
            <div className="absolute top-[calc(100%+4px)] right-0 z-50" onClick={(e) => e.stopPropagation()}>
              <DatePicker
                value={task.due_date}
                onChange={(date) =>
                  onUpdateProperty(task.id, "due_date", date ? date.toISOString() : null)
                }
                onClose={() => onTogglePicker(null)}
                align="right"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}, areTaskRowPropsEqual);

const TaskGroupSection = memo(function TaskGroupSection({
  groupTitle,
  groupTasks,
  isCollapsed,
  grouping,
  toggleGroupCollapse,
  setCreateInitialStatus,
  setIsCreateModalOpen,
  highlightedTaskId,
  selectedTaskId,
  activeIndex,
  selectedTaskIds,
  visibleProperties,
  hoveredTaskId,
  setHoveredTaskId,
  hoveredTooltip,
  setHoveredTooltip,
  activePicker,
  setActivePicker,
  hoveredAssignee,
  setHoveredAssignee,
  handleUpdateTaskProperty,
  handleUpdateTaskAssignee,
  toggleTaskSelection,
  navigate,
  availableMembers,
  organization,
  getAssigneeUsername,
}) {
  const [renderLimit, setRenderLimit] = useState(35);

  useEffect(() => {
    if (groupTasks.length <= 35) {
      setRenderLimit(groupTasks.length);
    } else {
      setRenderLimit((prev) => Math.min(Math.max(prev, 35), groupTasks.length));
    }
  }, [groupTasks.length]);

  const targetIdx = useMemo(() => {
    if (!highlightedTaskId) return -1;
    return groupTasks.findIndex((t) => String(t.id) === String(highlightedTaskId));
  }, [groupTasks, highlightedTaskId]);

  const effectiveLimit = Math.max(renderLimit, targetIdx >= 0 ? targetIdx + 5 : 0);
  const visibleTasks = groupTasks.slice(0, effectiveLimit);

  const handleTaskClick = useCallback((taskId) => {
    navigate(`/tasks/${taskId}`);
  }, [navigate]);

  const handleMouseEnter = useCallback((taskId) => {
    setHoveredTaskId(taskId);
  }, [setHoveredTaskId]);

  const handleMouseLeave = useCallback(() => {
    setHoveredTaskId(null);
    setHoveredTooltip(null);
    setHoveredAssignee(null);
  }, [setHoveredTaskId, setHoveredTooltip, setHoveredAssignee]);

  const handleSetHoveredTooltip = useCallback((taskId, type) => {
    setHoveredTooltip(type ? { type, taskId } : null);
  }, [setHoveredTooltip]);

  const handleTogglePicker = useCallback((taskId, type) => {
    setActivePicker((prev) =>
      prev.type === type && prev.taskId === taskId
        ? { type: null, taskId: null }
        : { type, taskId }
    );
  }, [setActivePicker]);

  const handleSetHoveredAssignee = useCallback((taskId, val) => {
    setHoveredAssignee(val ? taskId : null);
  }, [setHoveredAssignee]);

  return (
    <div className="flex flex-col mb-3">
      {grouping !== "none" && (
        <div
          onClick={() => toggleGroupCollapse(groupTitle)}
          className="flex items-center justify-between px-3 py-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer text-[12.5px] font-semibold text-zinc-900 dark:text-white transition-colors select-none group rounded-md"
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight size={13} className="text-zinc-400 dark:text-[#8a8f98]" />
            ) : (
              <ChevronDown size={13} className="text-zinc-400 dark:text-[#8a8f98]" />
            )}
            <div className="flex items-center gap-1.5">
              {grouping === "status" && getStatusIcon(groupTitle)}
              {grouping === "priority" && getPriorityIcon(groupTitle)}
              <span>{groupTitle}</span>
            </div>
            <span className="text-zinc-500 dark:text-[#8a8f98] text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
              {groupTasks.length}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCreateInitialStatus(grouping === "status" ? groupTitle : "Todo");
              setIsCreateModalOpen(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            title={`Add task to ${groupTitle}`}
          >
            <Plus size={13} />
          </button>
        </div>
      )}

      {!isCollapsed && (
        <>
          {visibleTasks.map((task, idx) => (
            <TaskRow
              key={task.id}
              task={task}
              idx={idx}
              isHighlighted={String(highlightedTaskId) === String(task.id)}
              isSelected={String(selectedTaskId) === String(task.id) || activeIndex === idx}
              isChecked={selectedTaskIds.has(task.id)}
              visibleProperties={visibleProperties}
              hoveredTooltipType={hoveredTooltip?.taskId === task.id ? hoveredTooltip.type : null}
              hoveredAssigneeTaskId={hoveredAssignee === task.id}
              activePickerType={activePicker.taskId === task.id ? activePicker.type : null}
              availableMembers={availableMembers}
              organization={organization}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTaskClick={handleTaskClick}
              onToggleSelection={toggleTaskSelection}
              onSetHoveredTooltip={handleSetHoveredTooltip}
              onTogglePicker={handleTogglePicker}
              onSetHoveredAssignee={handleSetHoveredAssignee}
              onUpdateProperty={handleUpdateTaskProperty}
              onUpdateAssignee={handleUpdateTaskAssignee}
              getAssigneeUsername={getAssigneeUsername}
            />
          ))}

          {groupTasks.length > effectiveLimit && (
            <div className="flex justify-center py-1.5">
              <button
                type="button"
                onClick={() => setRenderLimit((prev) => prev + 35)}
                className="text-[11.5px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white px-3 py-1 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Load {Math.min(35, groupTasks.length - effectiveLimit)} more ({groupTasks.length - effectiveLimit} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default memo(function Tasks({ isActive = true }) {
  const { effectiveTheme } = useTheme();
  const outletCtx = useOutletContext();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { organization } = useOrganization();
  const socket = useSocket();

  const [activeView, setActiveView] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.activeView) return savedViewState.activeView;
    const fromParam = searchParams.get("view");
    if (fromParam === "board" || fromParam === "list") return fromParam;
    try {
      const saved = localStorage.getItem("kriri-task-view");
      if (saved === "board" || saved === "list") return saved;
    } catch {}
    return "list";
  });

  // Synchronize browser back/forward buttons with activeView
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      if (view && (view === "board" || view === "list")) {
        setActiveView(view);
        viewStateStore.setTasksView({ activeView: view });
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleViewChange = (newView) => {
    if (newView === activeView) return;
    setActiveView(newView);
    viewStateStore.setTasksView({ activeView: newView });
    try {
      localStorage.setItem("kriri-task-view", newView);
    } catch {}

    try {
      playUiSound("pop");
    } catch {}

    // Update URL query parameter silently without triggering React Router page navigation / re-render lag
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", newView);
      window.history.replaceState(null, "", url.pathname + url.search);
    } catch {}
  };

  const isAuditMock = typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage?.getItem("audit_mock_auth") === "true");
  const scopeKey = user?.id ? `${user.id}:${organization?.id || "personal"}` : (isAuditMock ? "mock_user:personal" : null);

  // Authoritative server-state subscription (DataStore)
  const { tasks, setTasks, fetchTasks, tasksLoading } = useTasksStore();
  const loading = tasksLoading && tasks.length === 0;
  const showSkeleton = useDeferredSkeleton(loading, 180);

  useEffect(() => {
    const handleCreated = (e) => {
      if (e.detail) {
        dataStore.handleTaskCreated(e.detail);
      }
    };
    window.addEventListener("kriri:task-created", handleCreated);
    return () => window.removeEventListener("kriri:task-created", handleCreated);
  }, []);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState("Todo");

  const [searchQuery, setSearchQueryState] = useState(() => {
    return viewStateStore.getTasksView().searchQuery || "";
  });
  const setSearchQuery = useCallback((val) => {
    setSearchQueryState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      viewStateStore.setTasksView({ searchQuery: next });
      return next;
    });
  }, []);

  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
    return viewStateStore.getTasksView().selectedTaskIds || new Set();
  });

  const toggleTaskSelection = (id) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      viewStateStore.setTasksView({ selectedTaskIds: next });
      return next;
    });
  };

  const [activeFilter, setActiveFilterState] = useState(() => {
    return viewStateStore.getTasksView().activeFilter || "all";
  });
  const setActiveFilter = useCallback((val) => {
    setActiveFilterState(val);
    viewStateStore.setTasksView({ activeFilter: val });
  }, []);

  const [filterState, setFilterStateInternal] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.filterState) return savedViewState.filterState;
    try {
      const saved = localStorage.getItem("kriri_tasks_filters");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      status: [],
      priority: [],
      assignee: [],
      creator: [],
      project: [],
      dates: [],
      relations: [],
      content: "",
    };
  });

  const setFilterState = useCallback((updater) => {
    setFilterStateInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      viewStateStore.setTasksView({ filterState: next });
      return next;
    });
  }, []);

  const listScrollContainerRef = useRef(null);

  const handleListScroll = useCallback((e) => {
    viewStateStore.setTasksView({
      scrollTop: e.currentTarget.scrollTop,
      scrollLeft: e.currentTarget.scrollLeft,
    });
  }, []);

  useLayoutEffect(() => {
    const saved = viewStateStore.getTasksView();
    if (listScrollContainerRef.current && saved.scrollTop > 0) {
      listScrollContainerRef.current.scrollTop = saved.scrollTop;
    }
  }, [activeView]);

  const activeFiltersCount = useMemo(() => {
    return (
      (filterState.status?.length || 0) +
      (filterState.priority?.length || 0) +
      (filterState.assignee?.length || 0) +
      (filterState.creator?.length || 0) +
      (filterState.project?.length || 0) +
      (filterState.dates?.length || 0) +
      (filterState.relations?.length || 0) +
      (filterState.content?.trim() ? 1 : 0)
    );
  }, [filterState]);

  const toggleFilter = (category, value) => {
    playUiSound("toggle");
    setFilterState((prev) => {
      const currentList = prev[category] || [];
      const exists = currentList.includes(value);
      const nextList = exists
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];
      const nextState = { ...prev, [category]: nextList };
      try {
        localStorage.setItem("kriri_tasks_filters", JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  };

  const clearAllFilters = () => {
    playUiSound("toggle");
    setSearchQuery("");
    const emptyState = {
      status: [],
      priority: [],
      assignee: [],
      creator: [],
      project: [],
      dates: [],
      relations: [],
      content: "",
    };
    setFilterState(emptyState);
    try {
      localStorage.setItem("kriri_tasks_filters", JSON.stringify(emptyState));
    } catch {}
  };

  const [activeFilterCategory, setActiveFilterCategory] = useState(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
  const filterSearchInputRef = useRef(null);
  const [isAiFilterOpen, setIsAiFilterOpen] = useState(false);
  const [aiFilterQuery, setAiFilterQuery] = useState("");
  const aiFilterRef = useRef(null);
  const aiFilterInputRef = useRef(null);

  const applyAiFilter = (q) => {
    if (!q || !q.trim()) return;
    playUiSound("success");
    const lower = q.toLowerCase().trim();

    // Direct scope match
    if (lower.includes("assigned to me") || lower.includes("my tasks") || lower.includes("mine")) {
      setActiveFilter("assigned");
      setIsAiFilterOpen(false);
      setIsFilterOpen(false);
      setAiFilterQuery("");
      return;
    }
    if (lower.includes("created by me")) {
      setActiveFilter("created");
      setIsAiFilterOpen(false);
      setIsFilterOpen(false);
      setAiFilterQuery("");
      return;
    }

    const newPriorities = [];
    if (lower.includes("urgent")) newPriorities.push("Urgent");
    if (lower.includes("high") || lower.includes("important")) newPriorities.push("High");
    if (lower.includes("medium")) newPriorities.push("Medium");
    if (lower.includes("low")) newPriorities.push("Low");
    if (lower.includes("no priority")) newPriorities.push("No priority");

    const newStatuses = [];
    if (lower.includes("backlog")) newStatuses.push("Backlog");
    if (lower.includes("todo") || lower.includes("to do") || lower.includes("to-do")) newStatuses.push("Todo");
    if (lower.includes("in progress") || lower.includes("progress")) newStatuses.push("In Progress");
    if (lower.includes("in review") || lower.includes("review")) newStatuses.push("In Review");
    if (lower.includes("done") || lower.includes("completed") || lower.includes("finished")) newStatuses.push("Done");
    if (lower.includes("canceled") || lower.includes("cancelled")) newStatuses.push("Canceled");

    const newDates = [];
    if (lower.includes("overdue") || lower.includes("late")) newDates.push("overdue");
    if (lower.includes("today")) newDates.push("due_today");
    if (lower.includes("2 weeks") || lower.includes("next 2 weeks") || lower.includes("due in the next 2 weeks") || lower.includes("week") || lower.includes("this week")) newDates.push("due_week");
    if (lower.includes("month") || lower.includes("last month") || lower.includes("this month")) newDates.push("due_month");

    const newRelations = [];
    if (lower.includes("blocked")) newRelations.push("blocked");
    if (lower.includes("subtask") || lower.includes("sub-task")) newRelations.push("has_subtasks");

    const hasAnyParsed =
      newPriorities.length > 0 ||
      newStatuses.length > 0 ||
      newDates.length > 0 ||
      newRelations.length > 0;

    if (!hasAnyParsed) {
      setSearchQuery(q.trim());
    } else {
      setFilterState((prev) => {
        const next = {
          ...prev,
          priority: Array.from(new Set([...(prev.priority || []), ...newPriorities])),
          status: Array.from(new Set([...(prev.status || []), ...newStatuses])),
          dates: Array.from(new Set([...(prev.dates || []), ...newDates])),
          relations: Array.from(new Set([...(prev.relations || []), ...newRelations])),
        };
        try {
          localStorage.setItem("kriri_tasks_filters", JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    setIsAiFilterOpen(false);
    setIsFilterOpen(false);
    setAiFilterQuery("");
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDisplayOptionsOpen, setIsDisplayOptionsOpen] = useState(false);
  const [currentUserDb, setCurrentUserDb] = useState(null);

  const DEFAULT_VISIBLE_PROPERTIES = {
    id: true,
    status: true,
    assignee: true,
    priority: true,
    project: true,
    dueDate: true,
    subtasks: true,
  };

  const [visibleProperties, setVisibleProperties] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.visibleProperties) return savedViewState.visibleProperties;
    try {
      const saved = localStorage.getItem("kriri_tasks_display_properties");
      if (saved) return { ...DEFAULT_VISIBLE_PROPERTIES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VISIBLE_PROPERTIES;
  });

  const toggleVisibleProperty = (propKey) => {
    playUiSound("toggle");
    setVisibleProperties((prev) => {
      const next = { ...prev, [propKey]: !prev[propKey] };
      viewStateStore.setTasksView({ visibleProperties: next });
      try {
        localStorage.setItem("kriri_tasks_display_properties", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [showSubIssues, setShowSubIssues] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.showSubIssues !== null) return savedViewState.showSubIssues;
    try {
      const saved = localStorage.getItem("kriri_tasks_show_sub_issues");
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  const handleToggleSubIssues = () => {
    playUiSound("toggle");
    setShowSubIssues((prev) => {
      const next = !prev;
      viewStateStore.setTasksView({ showSubIssues: next });
      try {
        localStorage.setItem("kriri_tasks_show_sub_issues", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [showColumnBackgrounds, setShowColumnBackgrounds] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.showColumnBackgrounds !== null) return savedViewState.showColumnBackgrounds;
    try {
      return localStorage.getItem("kriri-task-show-column-backgrounds") === "true";
    } catch {
      return false;
    }
  });

  const handleToggleColumnBackgrounds = () => {
    playUiSound("toggle");
    setShowColumnBackgrounds((prev) => {
      const next = !prev;
      viewStateStore.setTasksView({ showColumnBackgrounds: next });
      try {
        localStorage.setItem("kriri-task-show-column-backgrounds", String(next));
      } catch {}
      return next;
    });
  };

  const [showEmptyColumns, setShowEmptyColumns] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.showEmptyColumns !== null) return savedViewState.showEmptyColumns;
    try {
      const val = localStorage.getItem("kriri-task-show-empty-columns");
      return val !== null ? val === "true" : false;
    } catch {
      return false;
    }
  });

  const handleToggleEmptyColumns = () => {
    playUiSound("toggle");
    setShowEmptyColumns((prev) => {
      const next = !prev;
      viewStateStore.setTasksView({ showEmptyColumns: next });
      try {
        localStorage.setItem("kriri-task-show-empty-columns", String(next));
      } catch {}
      return next;
    });
  };

  const { projects: availableProjects } = useProjectsStore();

  useEffect(() => {
    if (!user && !isAuditMock) return;
    if (currentUserDb?.id) return;
    api
      .get("/auth/me", { ttl: 300000 })
      .then((me) => {
        if (me?.id) setCurrentUserDb(me);
      })
      .catch((err) => console.error("Failed to load user profile:", err));
  }, [user, currentUserDb?.id]);

  // Inline Interactive Pickers & Tooltip State (Linear Style)
  const [activePicker, setActivePicker] = useState({ type: null, taskId: null });
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [hoveredAssignee, setHoveredAssignee] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);

  const currentDbUserId = useMemo(() => {
    if (currentUserDb?.id) return currentUserDb.id;
    if (availableMembers.length > 0 && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
      const matched = availableMembers.find(
        (m) =>
          (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase()) ||
          (user.fullName && m.name && m.name.toLowerCase() === user.fullName.toLowerCase())
      );
      if (matched?.id) return matched.id;
    }
    return null;
  }, [currentUserDb, availableMembers, user]);

  // Load available members for inline Assignee Picker
  useEffect(() => {
    if (organization?.id) {
      const cached = api.getCached(`/workspaces/${organization.id}/members`);
      if (Array.isArray(cached) && cached.length > 0) {
        setAvailableMembers(cached);
        return;
      }
      api
        .get(`/workspaces/${organization.id}/members`, { ttl: 300000 })
        .then((data) => {
          if (Array.isArray(data)) setAvailableMembers(data);
        })
        .catch((err) => console.error("Failed to load members", err));
    } else if (user) {
      const myUsername =
        (typeof window !== "undefined" && localStorage.getItem("kriri-user-username")) ||
        user.username ||
        user.unsafeMetadata?.username ||
        "";
      setAvailableMembers([
        {
          id: user.id || "personal",
          name: user.fullName || "User",
          username: myUsername,
          email: user.primaryEmailAddress?.emailAddress || "",
          avatar_url: user.imageUrl,
          role: "Owner",
        },
      ]);
    }
  }, [organization?.id, user]);

  const getAssigneeUsername = useCallback(
    (task) => {
      if (!task) return "";

      // 1. Direct from task assignee_username if available from backend
      if (task.assignee_username) {
        return task.assignee_username.replace(/^@/, "");
      }

      // 2. Check in availableMembers by matching id or name
      if (availableMembers && availableMembers.length > 0) {
        const member = availableMembers.find(
          (m) =>
            (task.assignee_id && (m.id === task.assignee_id || String(m.id) === String(task.assignee_id))) ||
            (task.assignee_name && m.name && m.name.toLowerCase() === task.assignee_name.toLowerCase())
        );
        if (member?.username) {
          return member.username.replace(/^@/, "");
        }
      }

      // 3. Check if assignee matches current logged-in user
      const isCurrentUser =
        (user && task.assignee_id && (task.assignee_id === user.id || task.assignee_id === "personal")) ||
        (user &&
          task.assignee_name &&
          (task.assignee_name === user.fullName ||
            task.assignee_name.toLowerCase() === (user.fullName || "").toLowerCase() ||
            task.assignee_name.toLowerCase() ===
              `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase()));

      if (isCurrentUser) {
        const savedUsername =
          (typeof window !== "undefined" && localStorage.getItem("kriri-user-username")) ||
          user?.username ||
          user?.unsafeMetadata?.username;
        if (savedUsername) {
          return savedUsername.replace(/^@/, "");
        }
      }

      // Check if current user's email matches the assignee member
      if (user && availableMembers && availableMembers.length > 0) {
        const member = availableMembers.find(
          (m) =>
            (task.assignee_id && (m.id === task.assignee_id || String(m.id) === String(task.assignee_id))) ||
            (task.assignee_name && m.name && m.name.toLowerCase() === task.assignee_name.toLowerCase())
        );
        const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
        if (member && userEmail && member.email && member.email.toLowerCase() === userEmail.toLowerCase()) {
          const savedUsername =
            (typeof window !== "undefined" && localStorage.getItem("kriri-user-username")) ||
            user?.username ||
            user?.unsafeMetadata?.username;
          if (savedUsername) {
            return savedUsername.replace(/^@/, "");
          }
        }
        if (member?.email) {
          return member.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "");
        }
      }

      // 4. Fallback to clean name handle
      if (task.assignee_name) {
        return task.assignee_name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_.-]/g, "");
      }

      return "user";
    },
    [availableMembers, user]
  );

  const handleUpdateTaskProperty = async (taskId, property, value) => {
    setActivePicker({ type: null, taskId: null });
    setHoveredTooltip(null);
    if (property === "status" && (value === "Done" || value === "Completed")) {
      playUiSound("success");
    } else {
      playUiSound("toggle");
    }

    // 0ms Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [property]: value } : t))
    );

    try {
      const updated = await api.put(`/tasks/${taskId}`, { [property]: value });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      console.error(`Failed to update task ${property}:`, err);
    }
  };

  const handleUpdateTaskAssignee = async (taskId, member) => {
    setActivePicker({ type: null, taskId: null });
    setHoveredAssignee(null);
    playUiSound("toggle");

    const patch = {
      assignee_id: member ? member.id : null,
      assignee_name: member ? member.name : null,
      assignee_username: member ? member.username : null,
      assignee_avatar_url: member ? member.avatar_url : null,
    };

    // 0ms Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );

    try {
      const updated = await api.put(`/tasks/${taskId}`, patch);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      console.error("Failed to update task assignee:", err);
    }
  };

  const [grouping, setGrouping] = useState(() => {
    const savedViewState = viewStateStore.getTasksView();
    if (savedViewState.grouping) return savedViewState.grouping;
    return (
      (typeof window !== "undefined" &&
        localStorage.getItem("kriri_tasks_grouping")) ||
      "status"
    );
  });
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    return viewStateStore.getTasksView().collapsedGroups || {};
  });
  const [sortOrder, setSortOrder] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("kriri-default-sort-order") || "priority_desc"
      : "priority_desc";
  });

  const toggleGroupCollapse = useCallback((groupKey) => {
    startTransition(() => {
      setCollapsedGroups((prev) => {
        const next = {
          ...prev,
          [groupKey]: !prev[groupKey],
        };
        viewStateStore.setTasksView({ collapsedGroups: next });
        return next;
      });
    });
  }, []);

  const handleGroupingChange = useCallback((val) => {
    startTransition(() => {
      setGrouping(val);
      viewStateStore.setTasksView({ grouping: val });
    });
    try {
      localStorage.setItem("kriri_tasks_grouping", val);
    } catch {}
  }, []);

  const filterRef = useRef(null);
  const displayOptionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
        setActiveFilterCategory(null);
        setFilterSearchTerm("");
      }
      if (aiFilterRef.current && !aiFilterRef.current.contains(e.target)) {
        setIsAiFilterOpen(false);
        setAiFilterQuery("");
      }
      if (displayOptionsRef.current && !displayOptionsRef.current.contains(e.target)) {
        setIsDisplayOptionsOpen(false);
      }
      if (!e.target.closest(".kriri-row-picker")) {
        setActivePicker({ type: null, taskId: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFilterShortcut = (e) => {
      if (window.location.pathname !== "/tasks" && window.location.pathname !== "/tasks/") return;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName);
      if (isInput) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsDisplayOptionsOpen(false);
        setIsAiFilterOpen(false);
        setIsFilterOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => filterSearchInputRef.current?.focus(), 50);
          } else {
            setActiveFilterCategory(null);
            setFilterSearchTerm("");
          }
          return next;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsFilterOpen(false);
        setIsDisplayOptionsOpen(false);
        setIsAiFilterOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => aiFilterInputRef.current?.focus(), 50);
          } else {
            setAiFilterQuery("");
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleFilterShortcut);
    return () => window.removeEventListener("keydown", handleFilterShortcut);
  }, []);

  // Asynchronous background revalidation using centralized DataStore
  useEffect(() => {
    if (!user && !isAuditMock) return;
    fetchTasks(scopeKey).catch((err) => {
      console.warn("Background tasks fetch error:", err);
    });
  }, [user?.id, organization?.id, scopeKey, fetchTasks, isAuditMock]);

  const availableCreators = useMemo(() => {
    const map = new Map();
    if (user) {
      map.set(user.id || "personal", {
        id: user.id || "personal",
        name: user.fullName || "User",
        avatar: user.imageUrl,
      });
    }
    tasks.forEach((t) => {
      const id = t.reporter_id || t.reporter_name;
      if (id && !map.has(id)) {
        map.set(id, {
          id: id,
          name: t.reporter_name || (typeof id === "string" ? id : "Creator"),
          avatar: null,
        });
      }
    });
    availableMembers.forEach((m) => {
      if (m.id && !map.has(m.id)) {
        map.set(m.id, {
          id: m.id,
          name: m.name || m.username || "Member",
          avatar: m.avatar_url,
        });
      }
    });
    return Array.from(map.values());
  }, [tasks, user, availableMembers]);

  const filterCounts = useMemo(() => {
    const counts = {
      status: {},
      priority: {},
      assignee: {},
      creator: {},
      relations: {},
      project: {},
      dates: {},
    };
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    tasks.forEach((t) => {
      // status
      const s = t.status || "Todo";
      counts.status[s] = (counts.status[s] || 0) + 1;

      // priority
      const p = t.priority || "No priority";
      counts.priority[p] = (counts.priority[p] || 0) + 1;

      // assignee
      if (!t.assignee_id && !t.assignee_name) {
        counts.assignee["unassigned"] = (counts.assignee["unassigned"] || 0) + 1;
      } else {
        if (t.assignee_id) counts.assignee[t.assignee_id] = (counts.assignee[t.assignee_id] || 0) + 1;
        if (t.assignee_name) counts.assignee[t.assignee_name] = (counts.assignee[t.assignee_name] || 0) + 1;
      }

      // creator
      if (!t.reporter_id && !t.reporter_name) {
        counts.creator["unknown"] = (counts.creator["unknown"] || 0) + 1;
      } else {
        if (t.reporter_id) counts.creator[t.reporter_id] = (counts.creator[t.reporter_id] || 0) + 1;
        if (t.reporter_name) counts.creator[t.reporter_name] = (counts.creator[t.reporter_name] || 0) + 1;
      }

      // relations
      if ((t.blocked_by_count || 0) > 0) {
        counts.relations["blocked"] = (counts.relations["blocked"] || 0) + 1;
      }
      if ((t.subtask_count || 0) > 0) {
        counts.relations["has_subtasks"] = (counts.relations["has_subtasks"] || 0) + 1;
      }
      if (t.parent_task_id) {
        counts.relations["is_subtask"] = (counts.relations["is_subtask"] || 0) + 1;
      }

      // project
      if (!t.project_id && !t.project_name) {
        counts.project["no_project"] = (counts.project["no_project"] || 0) + 1;
      } else {
        if (t.project_id) counts.project[t.project_id] = (counts.project[t.project_id] || 0) + 1;
        if (t.project_name) counts.project[t.project_name] = (counts.project[t.project_name] || 0) + 1;
      }

      // dates
      if (!t.due_date) {
        counts.dates["no_date"] = (counts.dates["no_date"] || 0) + 1;
      } else {
        counts.dates["has_date"] = (counts.dates["has_date"] || 0) + 1;
        const dueTime = new Date(t.due_date).getTime();
        if (t.status !== "Done" && dueTime < todayStart) {
          counts.dates["overdue"] = (counts.dates["overdue"] || 0) + 1;
        }
        if (dueTime >= todayStart && dueTime < todayStart + 24 * 60 * 60 * 1000) {
          counts.dates["due_today"] = (counts.dates["due_today"] || 0) + 1;
        }
        if (dueTime >= todayStart && dueTime <= nextWeek.getTime()) {
          counts.dates["due_week"] = (counts.dates["due_week"] || 0) + 1;
        }
        if (dueTime >= todayStart && dueTime <= nextMonth.getTime()) {
          counts.dates["due_month"] = (counts.dates["due_month"] || 0) + 1;
        }
      }
    });
    return counts;
  }, [tasks]);

  const FILTER_SECTIONS = useMemo(
    () => [
      {
        id: "core",
        categories: [
          {
            id: "status",
            label: "Status",
            icon: CircleDashed,
            items: [
              { value: "Backlog", label: "Backlog", icon: getStatusIcon("Backlog") },
              { value: "Todo", label: "Todo", icon: getStatusIcon("Todo") },
              { value: "In Progress", label: "In Progress", icon: getStatusIcon("In Progress") },
              { value: "In Review", label: "In Review", icon: getStatusIcon("In Review") },
              { value: "Done", label: "Done", icon: getStatusIcon("Done") },
              { value: "Canceled", label: "Canceled", icon: getStatusIcon("Canceled") },
            ],
          },
          {
            id: "assignee",
            label: "Assignee",
            icon: User,
            items: [
              { value: "unassigned", label: "Unassigned", isUnassigned: true },
              ...availableMembers.map((m) => ({
                value: m.id,
                label: m.name || m.username || "Member",
                name: m.name,
                avatar: m.avatar_url,
              })),
            ],
          },
          {
            id: "creator",
            label: "Creator",
            icon: UserCheck,
            items: availableCreators.map((c) => ({
              value: c.id,
              label: c.name,
              name: c.name,
              avatar: c.avatar,
            })),
          },
          {
            id: "priority",
            label: "Priority",
            icon: Signal,
            items: [
              { value: "Urgent", label: "Urgent", icon: getPriorityIcon("Urgent") },
              { value: "High", label: "High", icon: getPriorityIcon("High") },
              { value: "Medium", label: "Medium", icon: getPriorityIcon("Medium") },
              { value: "Low", label: "Low", icon: getPriorityIcon("Low") },
              { value: "No priority", label: "No priority", icon: getPriorityIcon("No priority") },
            ],
          },
          {
            id: "relations",
            label: "Relations",
            icon: GitFork,
            items: [
              { value: "blocked", label: "Blocked" },
              { value: "has_subtasks", label: "Has subtasks" },
              { value: "is_subtask", label: "Is a subtask" },
            ],
          },
          {
            id: "dates",
            label: "Dates",
            icon: Calendar,
            items: [
              { value: "due_today", label: "Due today" },
              { value: "due_week", label: "Due this week" },
              { value: "due_month", label: "Due this month" },
              { value: "overdue", label: "Overdue" },
              { value: "has_date", label: "Has due date" },
              { value: "no_date", label: "No due date" },
            ],
          },
        ],
      },
      {
        id: "projects",
        categories: [
          {
            id: "project",
            label: "Project",
            icon: Box,
            items: [
              { value: "no_project", label: "No project" },
              ...availableProjects.map((p) => ({
                value: p.id,
                label: p.name,
                identifier: p.identifier,
              })),
            ],
          },
        ],
      },
      {
        id: "content",
        categories: [
          {
            id: "content",
            label: "Content",
            icon: Type,
            isCustomContent: true,
            items: [],
          },
        ],
      },
    ],
    [availableMembers, availableCreators, availableProjects]
  );

  const FILTER_CATEGORIES = useMemo(
    () => FILTER_SECTIONS.flatMap((s) => s.categories),
    [FILTER_SECTIONS]
  );

  const flatSearchMatches = useMemo(() => {
    const q = filterSearchTerm.trim().toLowerCase();
    if (!q) return [];
    const matches = [];
    FILTER_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(q) ||
          cat.label.toLowerCase().includes(q)
        ) {
          matches.push({
            ...item,
            categoryId: cat.id,
            categoryLabel: cat.label,
            categoryIcon: cat.icon,
          });
        }
      });
    });
    return matches;
  }, [FILTER_CATEGORIES, filterSearchTerm]);

  const filteredTasks = useMemo(() => {
    let list = tasks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.assignee_name || "").toLowerCase().includes(q) ||
          (t.status || "").toLowerCase().includes(q) ||
          (t.project_name || "").toLowerCase().includes(q) ||
          (t.project_identifier || "").toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }

    // Ownership Scope filtering
    if (activeFilter === "assigned" || activeFilter === "mine") {
      const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
      const userName = user?.fullName?.toLowerCase();
      list = list.filter((t) => {
        if (currentDbUserId && (t.assignee_id === currentDbUserId || String(t.assignee_id) === String(currentDbUserId))) return true;
        if (user?.id && (t.assignee_id === user.id || t.assignee_id === "personal")) return true;
        if (t.assignee_email && t.assignee_email.toLowerCase() === userEmail) return true;
        if (t.assignee_name && userName && t.assignee_name.toLowerCase() === userName) return true;
        return false;
      });
    } else if (activeFilter === "created") {
      const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
      const userName = user?.fullName?.toLowerCase();
      list = list.filter((t) => {
        if (currentDbUserId && (t.reporter_id === currentDbUserId || String(t.reporter_id) === String(currentDbUserId))) return true;
        if (user?.id && (t.reporter_id === user.id || t.reporter_id === "personal")) return true;
        if (t.reporter_email && t.reporter_email.toLowerCase() === userEmail) return true;
        if (t.reporter_name && userName && t.reporter_name.toLowerCase() === userName) return true;
        return false;
      });
    }

    // Rich multi-filters:
    // Status filter
    if (filterState.status?.length > 0) {
      list = list.filter((t) => filterState.status.includes(t.status || "Todo"));
    }

    // Priority filter
    if (filterState.priority?.length > 0) {
      list = list.filter((t) => {
        const p = t.priority || "No priority";
        return filterState.priority.includes(p);
      });
    }

    // Assignee filter
    if (filterState.assignee?.length > 0) {
      list = list.filter((t) => {
        if (filterState.assignee.includes("unassigned") && !t.assignee_id && !t.assignee_name) {
          return true;
        }
        return filterState.assignee.some((val) => {
          return (
            t.assignee_id === val ||
            String(t.assignee_id) === String(val) ||
            (t.assignee_name && t.assignee_name.toLowerCase() === String(val).toLowerCase())
          );
        });
      });
    }

    // Creator filter
    if (filterState.creator?.length > 0) {
      list = list.filter((t) => {
        return filterState.creator.some((val) => {
          return (
            t.reporter_id === val ||
            String(t.reporter_id) === String(val) ||
            (t.reporter_name && t.reporter_name.toLowerCase() === String(val).toLowerCase())
          );
        });
      });
    }

    // Relations filter
    if (filterState.relations?.length > 0) {
      list = list.filter((t) => {
        return filterState.relations.some((rel) => {
          if (rel === "blocked") return (t.blocked_by_count || 0) > 0;
          if (rel === "has_subtasks") return (t.subtask_count || 0) > 0;
          if (rel === "is_subtask") return !!t.parent_task_id;
          return false;
        });
      });
    }

    // Content filter
    if (filterState.content && filterState.content.trim()) {
      const cq = filterState.content.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(cq) ||
          (t.description || "").toLowerCase().includes(cq)
      );
    }

    // Project filter
    if (filterState.project?.length > 0) {
      list = list.filter((t) => {
        if (filterState.project.includes("no_project") && !t.project_id && !t.project_name) {
          return true;
        }
        return filterState.project.some((val) => {
          return (
            t.project_id === val ||
            String(t.project_id) === String(val) ||
            (t.project_name && t.project_name.toLowerCase() === String(val).toLowerCase())
          );
        });
      });
    }

    // Dates filter
    if (filterState.dates?.length > 0) {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      list = list.filter((t) => {
        return filterState.dates.some((dFilter) => {
          if (dFilter === "no_date") return !t.due_date;
          if (dFilter === "has_date") return !!t.due_date;
          if (!t.due_date) return false;
          const dueTime = new Date(t.due_date).getTime();
          if (dFilter === "overdue") {
            return t.status !== "Done" && dueTime < todayStart;
          }
          if (dFilter === "due_today") {
            return dueTime >= todayStart && dueTime < todayStart + 24 * 60 * 60 * 1000;
          }
          if (dFilter === "due_week") {
            return dueTime >= todayStart && dueTime <= nextWeek.getTime();
          }
          if (dFilter === "due_month") {
            return dueTime >= todayStart && dueTime <= nextMonth.getTime();
          }
          return false;
        });
      });
    }

    // Show sub-issues toggle
    if (!showSubIssues) {
      list = list.filter((t) => !t.parent_task_id);
    }

    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };

    return [...list].sort((a, b) => {
      if (sortOrder === "priority_desc") {
        const pA = priorityWeights[(a.priority || "").toLowerCase()] || 0;
        const pB = priorityWeights[(b.priority || "").toLowerCase()] || 0;
        if (pA !== pB) return pB - pA;
      } else if (sortOrder === "due_date_asc") {
        if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
      } else if (sortOrder === "title_asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return (new Date(b.created_at || 0) - new Date(a.created_at || 0)) || ((b.id || 0) - (a.id || 0));
    });
  }, [tasks, searchQuery, activeFilter, filterState, showSubIssues, sortOrder, user, currentDbUserId]);

  // Group tasks based on grouping configuration
  const groupedTasks = useMemo(() => {
    if (grouping === "none") {
      return { "All Tasks": filteredTasks };
    }

    const groups = {};

    if (grouping === "status") {
      const statusOrder = ["Backlog", "Todo", "In Progress", "In Review", "Done", "Canceled"];
      statusOrder.forEach((s) => {
        groups[s] = [];
      });
      filteredTasks.forEach((t) => {
        const s = t.status || "Todo";
        if (!groups[s]) groups[s] = [];
        groups[s].push(t);
      });
      const result = {};
      Object.keys(groups).forEach((key) => {
        if (groups[key].length > 0) {
          result[key] = groups[key];
        }
      });
      return Object.keys(result).length > 0 ? result : { Todo: [] };
    }

    if (grouping === "priority") {
      const priorityOrder = ["Urgent", "High", "Medium", "Low", "No priority"];
      priorityOrder.forEach((p) => {
        groups[p] = [];
      });
      filteredTasks.forEach((t) => {
        const p = t.priority || "No priority";
        if (!groups[p]) groups[p] = [];
        groups[p].push(t);
      });
      const result = {};
      Object.keys(groups).forEach((key) => {
        if (groups[key].length > 0) {
          result[key] = groups[key];
        }
      });
      return Object.keys(result).length > 0 ? result : { "No priority": [] };
    }

    if (grouping === "project") {
      filteredTasks.forEach((t) => {
        const p = t.project_name || "No Project";
        if (!groups[p]) groups[p] = [];
        groups[p].push(t);
      });
      return groups;
    }

    return { Tasks: filteredTasks };
  }, [filteredTasks, grouping]);

  // Keyboard navigation & Shortcuts for inline properties (S, P, A, D, X, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (window.location.pathname !== "/tasks" && window.location.pathname !== "/tasks/") return;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName);
      if (isInput) return;

      if (e.key === "Escape") {
        if (activePicker.type) {
          e.preventDefault();
          setActivePicker({ type: null, taskId: null });
        }
        return;
      }

      // If an inline picker is open, let the picker handle its keys
      if (activePicker.type) return;

      const targetTask =
        filteredTasks.find((t) => t.id === hoveredTaskId) ||
        (activeIndex !== null && filteredTasks[activeIndex] ? filteredTasks[activeIndex] : null);

      if (!targetTask) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          setActivePicker({ type: "status", taskId: targetTask.id });
          setHoveredTooltip(null);
          break;
        case "p":
          e.preventDefault();
          setActivePicker({ type: "priority", taskId: targetTask.id });
          setHoveredTooltip(null);
          break;
        case "a":
          e.preventDefault();
          setActivePicker({ type: "assignee", taskId: targetTask.id });
          setHoveredAssignee(null);
          break;
        case "d":
          e.preventDefault();
          setActivePicker({ type: "due_date", taskId: targetTask.id });
          break;
        case "x":
        case " ":
          e.preventDefault();
          toggleTaskSelection(targetTask.id);
          break;
        case "enter":
          e.preventDefault();
          navigate(`/tasks/${targetTask.id}`);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredTasks, hoveredTaskId, activeIndex, activePicker, navigate]);

  const [, setPreferencesTick] = useState(0);

  useEffect(() => {
    const handlePrefChange = () => setPreferencesTick((t) => t + 1);
    window.addEventListener("kriri-preferences-changed", handlePrefChange);
    window.addEventListener("storage", handlePrefChange);
    return () => {
      window.removeEventListener("kriri-preferences-changed", handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
  }, []);

  useEffect(() => {
    const taskIdParam = searchParams.get("task") || location.state?.taskId;
    if (taskIdParam) {
      const parsedId = Number(taskIdParam) || taskIdParam;
      setHighlightedTaskId(parsedId);
      const targetIdx = filteredTasks.findIndex((t) => String(t.id) === String(parsedId));
      if (targetIdx !== -1) {
        setActiveIndex(targetIdx);
      }
      if (searchParams.get("modal") === "true") {
        startTransition(() => {
          setSelectedTaskId(parsedId);
        });
      } else {
        navigate(`/tasks/${parsedId}`, { replace: true });
      }
    }
  }, [location.search, location.state, filteredTasks.length, navigate]);

  useEffect(() => {
    if (!loading && highlightedTaskId) {
      const timer = setTimeout(() => {
        const desktopEl = document.getElementById(`task-row-desktop-${highlightedTaskId}`);
        const mobileEl = document.getElementById(`task-row-mobile-${highlightedTaskId}`);
        const el = (desktopEl && desktopEl.offsetParent !== null) ? desktopEl : (mobileEl && mobileEl.offsetParent !== null ? mobileEl : (desktopEl || mobileEl));
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loading, highlightedTaskId]);

  useListShortcuts({
    items: filteredTasks,
    activeIndex,
    setActiveIndex,
    onOpenItem: (task) => navigate(`/tasks/${task.id}`),
    onCreateItem: () => setIsCreateModalOpen(true),
  });


  const openMobileNav = () => {
    if (outletCtx?.openMobileNav) {
      outletCtx.openMobileNav();
    } else {
      window.dispatchEvent(new CustomEvent("open-mobile-nav"));
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
      {/* ROW 1: Title & New Task Button (Matches Linear & Projects) */}
      <div className="flex items-center justify-between gap-3 min-h-[38px] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={openMobileNav}
            className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
            Tasks
          </h1>
        </div>

        <button
          onClick={() => {
            setCreateInitialStatus("Todo");
            setIsCreateModalOpen(true);
          }}
          className="kriri-primary-btn h-[26px] sm:h-[28px] px-3 transition-all duration-300 text-[11.5px] sm:text-[12px] font-medium rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.08)] active:scale-[0.98] shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={13} strokeWidth={2.2} /> New Task
        </button>
      </div>

      <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] w-full my-3 shrink-0" />

      {/* ROW 2: Ownership Scope Tabs on Left & Controls on Right */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        {/* Left: Ownership Scope Tabs (Linear Style Pill Buttons) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full">
          {SCOPE_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setActiveFilter(opt.value);
                  });
                }}
                className={`relative px-3.5 py-1.5 text-[12.5px] font-medium rounded-full transition-colors cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 bg-black/[0.08] dark:bg-white/[0.12] rounded-full pointer-events-none"
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Controls (Filter & Display Options - Linear Style) */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative shrink-0">
          {/* Filter Popover Button (Linear ListFilter) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDisplayOptionsOpen(false);
                setIsFilterOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    if (availableProjects.length === 0) {
                      dataStore.fetchProjects().catch(() => {});
                    }
                    setTimeout(() => filterSearchInputRef.current?.focus(), 50);
                  } else {
                    setActiveFilterCategory(null);
                    setFilterSearchTerm("");
                  }
                  return next;
                });
              }}
              className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${
                isFilterOpen || activeFiltersCount > 0 || !!searchQuery
                  ? "bg-zinc-200 text-zinc-900 dark:bg-white/[0.12] dark:text-white"
                  : "bg-black/[0.04] dark:bg-white/[0.04] text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white"
              }`}
              title="Filter (F)"
            >
              <Filter size={13} />
              {(activeFiltersCount > 0 || !!searchQuery) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9.5px] font-bold flex items-center justify-center shadow-xs">
                  {activeFiltersCount + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Filter Popover (Linear Image 2) */}
            {isFilterOpen && (
              <div
                ref={filterRef}
                className="absolute top-[calc(100%+8px)] right-0 w-[230px] bg-white dark:bg-[#1a1b1e] border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 text-[12.5px] text-zinc-900 dark:text-white overflow-x-hidden"
              >
                {/* Search Filter Header */}
                <div className="relative flex items-center px-2 py-1.5 border-b border-black/[0.06] dark:border-white/[0.06] mb-1">
                  <input
                    ref={filterSearchInputRef}
                    type="text"
                    placeholder="Add Filter..."
                    value={filterSearchTerm}
                    onChange={(e) => setFilterSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const q = filterSearchTerm.trim();
                        if (q) {
                          setSearchQuery(q);
                          setIsFilterOpen(false);
                          setFilterSearchTerm("");
                        }
                      }
                    }}
                    className="w-full bg-transparent text-[12px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#8a8f98] outline-none pr-6 font-medium"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.2 rounded border border-black/10 dark:border-white/10 text-[9px] font-mono text-zinc-400 dark:text-[#8a8f98] pointer-events-none">
                    F
                  </span>
                </div>

                {/* Filter items: Flat search list when typing, otherwise Category rows */}
                {filterSearchTerm.trim() ? (
                  <div className="flex flex-col gap-0.5 max-h-[280px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {/* Instant Text Search Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(filterSearchTerm.trim());
                        setIsFilterOpen(false);
                        setFilterSearchTerm("");
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-[12px] bg-accent/10 text-accent hover:bg-accent/15 font-medium mb-1 w-full"
                    >
                      <Search size={12} className="shrink-0" />
                      <span className="truncate">Search tasks for "{filterSearchTerm.trim()}"</span>
                    </button>

                    {flatSearchMatches.length === 0 ? (
                      <div className="px-3 py-2 text-[12px] text-zinc-400 dark:text-[#8a8f98]">
                        No matching filters
                      </div>
                    ) : (
                      flatSearchMatches.map((match) => {
                        const isSelected = (filterState[match.categoryId] || []).includes(match.value);
                        return (
                          <button
                            key={`${match.categoryId}-${match.value}`}
                            type="button"
                            onClick={() => toggleFilter(match.categoryId, match.value)}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-[12px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-zinc-900 dark:text-[#e8e8e8] group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-accent border-accent text-white"
                                    : "border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400"
                                }`}
                              >
                                {isSelected && <Check size={10} strokeWidth={3} />}
                              </div>
                              {match.avatar ? (
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white uppercase shrink-0 ${getAvatarColor(
                                    match.name || match.label
                                  )}`}
                                >
                                  {getInitial(match.name || match.label)}
                                </div>
                              ) : match.icon ? (
                                <span className="shrink-0">{match.icon}</span>
                              ) : null}
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-medium text-zinc-400 dark:text-[#8a8f98] leading-none">
                                  {match.categoryLabel}
                                </span>
                                <span className="truncate leading-tight font-medium">
                                  {match.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 relative">
                    {/* Top: AI filter option (Matches Linear Image 2) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFilterOpen(false);
                        setIsAiFilterOpen(true);
                        setTimeout(() => aiFilterInputRef.current?.focus(), 50);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12.5px] font-medium transition-colors cursor-pointer text-zinc-700 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] group mb-0.5"
                    >
                      <Sparkles size={14} className="shrink-0 text-zinc-500 dark:text-[#8a8f98] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                      <span className="font-medium text-zinc-900 dark:text-white">AI filter</span>
                    </button>

                    {/* Category Sections (with Dividers like Linear Image 2) */}
                    {FILTER_SECTIONS.map((section, sIdx) => (
                      <div key={section.id}>
                        {sIdx > 0 && (
                          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] my-1 mx-1" />
                        )}
                        {section.categories.map((cat) => {
                          const CatIcon = cat.icon;
                          const isOpen = activeFilterCategory === cat.id;
                          const catActiveCount = cat.isCustomContent
                            ? filterState.content?.trim()
                              ? 1
                              : 0
                            : (filterState[cat.id] || []).length;
                          return (
                            <div
                              key={cat.id}
                              className="relative"
                              onMouseEnter={() => setActiveFilterCategory(cat.id)}
                            >
                              {/* Hover bridge */}
                              {isOpen && (
                                <div className="absolute top-0 -left-2 w-2 h-full z-[55] pointer-events-auto" />
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFilterCategory(isOpen ? null : cat.id);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[12.5px] font-medium transition-colors cursor-pointer group ${
                                  isOpen || catActiveCount > 0
                                    ? "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-900 dark:text-white"
                                    : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <CatIcon size={14} className="shrink-0 text-zinc-400 dark:text-[#8a8f98]" />
                                  <span>{cat.label}</span>
                                  {catActiveCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">
                                      {catActiveCount}
                                    </span>
                                  )}
                                </div>
                                <ChevronRight size={13} className="text-zinc-400 dark:text-[#8a8f98] opacity-60 group-hover:opacity-100" />
                              </button>

                              {/* Submenu Flyout to the Left */}
                              {isOpen && cat.isCustomContent ? (
                                <div
                                  className="absolute top-0 right-[calc(100%+8px)] w-[220px] bg-white dark:bg-[#1a1b1e] border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl p-2.5 z-[60] flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100 overflow-x-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-1 text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98]">
                                    Filter by content
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Title or description..."
                                    value={filterState.content || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFilterState((prev) => {
                                        const next = { ...prev, content: val };
                                        try {
                                          localStorage.setItem("kriri_tasks_filters", JSON.stringify(next));
                                        } catch {}
                                        return next;
                                      });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        setIsFilterOpen(false);
                                        setActiveFilterCategory(null);
                                      }
                                    }}
                                    className="w-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none font-medium"
                                    autoFocus
                                  />
                                  <div className="flex items-center justify-between px-1 text-[11px] pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
                                    {filterState.content ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFilterState((prev) => {
                                            const next = { ...prev, content: "" };
                                            try {
                                              localStorage.setItem("kriri_tasks_filters", JSON.stringify(next));
                                            } catch {}
                                            return next;
                                          });
                                        }}
                                        className="text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                                      >
                                        Clear
                                      </button>
                                    ) : (
                                      <span className="text-zinc-400">Type keywords</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsFilterOpen(false);
                                        setActiveFilterCategory(null);
                                      }}
                                      className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-medium cursor-pointer ml-auto"
                                    >
                                      Done
                                    </button>
                                  </div>
                                </div>
                              ) : isOpen && !cat.isCustomContent ? (
                                <div
                                  className="absolute top-0 right-[calc(100%+8px)] w-[200px] sm:w-[220px] bg-white dark:bg-[#1a1b1e] border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-[60] flex flex-col gap-0.5 max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98]">
                                    {cat.label}
                                  </div>
                                  {cat.items.map((item) => {
                                    const isSelected = (filterState[cat.id] || []).includes(item.value);
                                    const count = filterCounts[cat.id]?.[item.value];
                                    return (
                                      <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => toggleFilter(cat.id, item.value)}
                                        className="flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-[12px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-zinc-900 dark:text-[#e8e8e8] group"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <div
                                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                              isSelected
                                                ? "bg-accent border-accent text-white"
                                                : "border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400"
                                            }`}
                                          >
                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                          </div>
                                          {item.icon && <span className="shrink-0">{item.icon}</span>}
                                          {item.avatar ? (
                                            <div
                                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white uppercase shrink-0 ${getAvatarColor(
                                                item.name || item.label
                                              )}`}
                                            >
                                              {getInitial(item.name || item.label)}
                                            </div>
                                          ) : null}
                                          <span className="truncate font-medium">{item.label}</span>
                                        </div>
                                        {count !== undefined && (
                                          <span className="text-[10.5px] font-mono text-zinc-400 dark:text-[#8a8f98] ml-2">
                                            {count}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Clear All Filters */}
                {activeFiltersCount > 0 && (
                  <div className="pt-1 mt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-[11.5px] font-medium transition-colors cursor-pointer"
                    >
                      <span>Clear all filters</span>
                      <RotateCcw size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dedicated AI Filter Popover (Linear Image 5) */}
            {isAiFilterOpen && (
              <div
                ref={aiFilterRef}
                className="absolute top-[calc(100%+8px)] right-0 w-[270px] sm:w-[280px] bg-white dark:bg-[#1a1b1e] border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 text-[12.5px] text-zinc-900 dark:text-white overflow-x-hidden"
              >
                {/* Header (Not all caps) */}
                <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98]">
                  AI filter
                </div>

                {/* Text input with AI Filter Icon */}
                <div className="relative flex items-center px-2 py-1.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 rounded-lg">
                  <Sparkles size={14} className="text-zinc-400 dark:text-[#8a8f98] shrink-0 mr-2" />
                  <input
                    ref={aiFilterInputRef}
                    type="text"
                    placeholder="Ask AI to filter..."
                    value={aiFilterQuery}
                    onChange={(e) => setAiFilterQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyAiFilter(aiFilterQuery);
                      } else if (e.key === "Escape") {
                        setIsAiFilterOpen(false);
                        setAiFilterQuery("");
                      }
                    }}
                    className="w-full bg-transparent text-[12px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#8a8f98] outline-none font-medium"
                    autoFocus
                  />
                  {aiFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setAiFilterQuery("")}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Quick start reference points (Linear Image 5) */}
                <div className="flex flex-col gap-0.5 pt-0.5">
                  {[
                    { label: "assigned to me", query: "assigned to me" },
                    { label: "completed in the last month", query: "completed in the last month" },
                    { label: "due in the next 2 weeks", query: "due in the next 2 weeks" },
                    { label: "high priority tasks", query: "high priority" },
                    { label: "overdue tasks", query: "overdue" },
                  ].map((refPoint) => (
                    <button
                      key={refPoint.label}
                      type="button"
                      onClick={() => applyAiFilter(refPoint.query)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer group"
                    >
                      <Search size={13} className="text-zinc-400 dark:text-[#6e737d] group-hover:text-zinc-700 dark:group-hover:text-zinc-300 shrink-0" />
                      <span className="truncate">{refPoint.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Display Options Popover Button (Linear style with view switcher inside) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen(false);
                setIsDisplayOptionsOpen(!isDisplayOptionsOpen);
              }}
              className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${
                isDisplayOptionsOpen
                  ? "bg-zinc-200 text-zinc-900 dark:bg-white/[0.12] dark:text-white"
                  : "bg-black/[0.04] dark:bg-white/[0.04] text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white"
              }`}
              title="Display options"
            >
              <SlidersHorizontal size={13} strokeWidth={2} />
            </button>

            {/* Display Options Popover (Linear Image 3) */}
            {isDisplayOptionsOpen && (
              <div
                ref={displayOptionsRef}
                className="absolute top-[calc(100%+8px)] right-0 w-[270px] bg-white dark:bg-[#1a1b1e] border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-3 text-zinc-900 dark:text-white overflow-x-hidden"
              >
                {/* Centralized ViewSwitcher matching Project screen */}
                <ViewSwitcher
                  views={[
                    {
                      value: "list",
                      label: "List",
                      icon: <AlignJustify size={14} />,
                    },
                    {
                      value: "board",
                      label: "Board",
                      icon: <LayoutGrid size={14} />,
                    },
                  ]}
                  activeView={activeView}
                  onViewChange={handleViewChange}
                  layoutId="tasksViewActivePill"
                />

                {/* Grouping Select */}
                <div className="flex items-center justify-between text-[12px] pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-zinc-500 dark:text-[#8a8f98] font-medium">Grouping</span>
                  <div className="relative">
                    <select
                      value={grouping}
                      onChange={(e) => handleGroupingChange(e.target.value)}
                      className="bg-zinc-100 dark:bg-[#2c2d30] border border-black/[0.08] dark:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-zinc-900 dark:text-white outline-none h-[26px] appearance-none cursor-pointer font-medium"
                    >
                      <option value="status" className="dark:bg-[#1c1c1e]">Status</option>
                      <option value="priority" className="dark:bg-[#1c1c1e]">Priority</option>
                      <option value="project" className="dark:bg-[#1c1c1e]">Project</option>
                      <option value="none" className="dark:bg-[#1c1c1e]">No grouping</option>
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-[#8a8f98] pointer-events-none"
                      size={12}
                    />
                  </div>
                </div>

                {/* Ordering Select */}
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-zinc-500 dark:text-[#8a8f98] font-medium">Ordering</span>
                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) => {
                        setSortOrder(e.target.value);
                        localStorage.setItem("kriri-default-sort-order", e.target.value);
                      }}
                      className="bg-zinc-100 dark:bg-[#2c2d30] border border-black/[0.08] dark:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-zinc-900 dark:text-white outline-none h-[26px] appearance-none cursor-pointer font-medium"
                    >
                      <option value="priority_desc" className="dark:bg-[#1c1c1e]">Priority</option>
                      <option value="due_date_asc" className="dark:bg-[#1c1c1e]">Due date</option>
                      <option value="created_desc" className="dark:bg-[#1c1c1e]">Newest first</option>
                      <option value="title_asc" className="dark:bg-[#1c1c1e]">Title</option>
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-[#8a8f98] pointer-events-none"
                      size={12}
                    />
                  </div>
                </div>

                {/* Show sub-issues Toggle Switch */}
                <div className="flex items-center justify-between text-[12px] pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-zinc-500 dark:text-[#8a8f98] font-medium">Show sub-issues</span>
                  <button
                    type="button"
                    onClick={handleToggleSubIssues}
                    className={`w-7 h-4 rounded-full transition-colors flex items-center px-[2px] cursor-pointer ${
                      showSubIssues
                        ? "bg-zinc-900 dark:bg-white"
                        : "bg-zinc-200 dark:bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-transform ${
                        showSubIssues
                          ? "translate-x-3 bg-white dark:bg-zinc-900"
                          : "translate-x-0 bg-zinc-400 dark:bg-zinc-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Board options (visible when activeView === 'board') */}
                {activeView === "board" && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                    <span className="text-[11.5px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                      Board options
                    </span>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-zinc-500 dark:text-[#8a8f98] font-medium">
                        Show empty columns
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleEmptyColumns}
                        className={`w-7 h-4 rounded-full transition-colors flex items-center px-[2px] cursor-pointer ${
                          showEmptyColumns
                            ? "bg-zinc-900 dark:bg-white"
                            : "bg-zinc-200 dark:bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full transition-transform ${
                            showEmptyColumns
                              ? "translate-x-3 bg-white dark:bg-zinc-900"
                              : "translate-x-0 bg-zinc-400 dark:bg-zinc-400"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-zinc-500 dark:text-[#8a8f98] font-medium">
                        Show background
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleColumnBackgrounds}
                        className={`w-7 h-4 rounded-full transition-colors flex items-center px-[2px] cursor-pointer ${
                          showColumnBackgrounds
                            ? "bg-zinc-900 dark:bg-white"
                            : "bg-zinc-200 dark:bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full transition-transform ${
                            showColumnBackgrounds
                              ? "translate-x-3 bg-white dark:bg-zinc-900"
                              : "translate-x-0 bg-zinc-400 dark:bg-zinc-400"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Display Properties Pills */}
                <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-[11.5px] font-medium text-zinc-500 dark:text-[#8a8f98]">
                    Display properties
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "id", label: "ID" },
                      { key: "status", label: "Status" },
                      { key: "assignee", label: "Assignee" },
                      { key: "priority", label: "Priority" },
                      { key: "project", label: "Project" },
                      { key: "dueDate", label: "Due date" },
                      { key: "subtasks", label: "Subtasks" },
                    ].map((prop) => {
                      const isVisible = visibleProperties[prop.key];
                      return (
                        <button
                          key={prop.key}
                          type="button"
                          onClick={() => toggleVisibleProperty(prop.key)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer border ${
                            isVisible
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs"
                              : "bg-transparent text-zinc-500 dark:text-[#8a8f98] border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                          }`}
                        >
                          {prop.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar (Linear Style) */}
      {(activeFiltersCount > 0 || !!searchQuery) && (
        <div className="flex items-center flex-wrap gap-1.5 mb-3 px-1 text-[11.5px] animate-in fade-in duration-150 shrink-0">
          <span className="text-zinc-400 dark:text-[#8a8f98] text-[11px] font-medium mr-1">
            Filtered by:
          </span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 border border-black/[0.06] dark:border-white/10">
              <span className="text-zinc-400 dark:text-[#8a8f98] font-medium">Search:</span>
              <span className="font-semibold truncate max-w-[140px]">"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/15 rounded-full cursor-pointer text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title="Clear search"
              >
                <X size={11} />
              </button>
            </span>
          )}
          {filterState.content && filterState.content.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 border border-black/[0.06] dark:border-white/10">
              <span className="text-zinc-400 dark:text-[#8a8f98] font-medium">Content:</span>
              <span className="font-semibold truncate max-w-[140px]">"{filterState.content}"</span>
              <button
                type="button"
                onClick={() =>
                  setFilterState((prev) => {
                    const next = { ...prev, content: "" };
                    try {
                      localStorage.setItem("kriri_tasks_filters", JSON.stringify(next));
                    } catch {}
                    return next;
                  })
                }
                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/15 rounded-full cursor-pointer text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title="Remove filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
          {Object.entries(filterState).map(([catKey, values]) => {
            if (!Array.isArray(values)) return null;
            const category = FILTER_CATEGORIES.find((c) => c.id === catKey);
            return values.map((val) => {
              const item = category?.items.find((i) => i.value === val);
              const label = item?.label || String(val);
              return (
                <span
                  key={`${catKey}-${val}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 border border-black/[0.06] dark:border-white/10"
                >
                  <span className="text-zinc-400 dark:text-[#8a8f98] font-medium">
                    {category?.label || catKey}:
                  </span>
                  <span className="font-semibold">{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleFilter(catKey, val)}
                    className="p-0.5 hover:bg-black/10 dark:hover:bg-white/15 rounded-full cursor-pointer text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    title="Remove filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              );
            });
          })}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-zinc-500 hover:text-rose-500 dark:text-[#8a8f98] dark:hover:text-rose-400 ml-1.5 text-[11px] font-medium cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Content Area: Board & Linear List */}
      {activeView === "board" ? (
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <Kanban
            embedded={true}
            tasks={tasks}
            setTasks={setTasks}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            showColumnBackgrounds={showColumnBackgrounds}
            showEmptyColumns={showEmptyColumns}
            onSelectTask={(id) => navigate(`/tasks/${id}`)}
            availableMembers={availableMembers}
            onUpdateTaskProperty={handleUpdateTaskProperty}
            onUpdateTaskAssignee={handleUpdateTaskAssignee}
            visibleProperties={visibleProperties}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {showSkeleton ? (
            <TasksListSkeleton />
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
            <Checklist theme={effectiveTheme} intensity={0.7} className="w-full h-full text-zinc-400 dark:text-[#8a8f98] opacity-80" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
              Create your first task
            </h2>
            <p className="text-[14px] text-zinc-500 dark:text-[#8a8f98] leading-relaxed">
              Tasks are used to track work, bugs, and feature requests. Get
              started by organizing your work.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="kriri-primary-btn h-8 px-4 rounded-full font-medium text-[13px] transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.2} />
              New Task
            </button>
          </div>
        </div>
      ) : (
        /* Linear Style List View (Matches Images 4, 9, 10 & ListViewRenderer.jsx) */
        <div
          ref={listScrollContainerRef}
          onScroll={handleListScroll}
          className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-16 min-h-0"
        >
          {Object.entries(groupedTasks).map(([groupTitle, groupTasks]) => (
            <TaskGroupSection
              key={groupTitle}
              groupTitle={groupTitle}
              groupTasks={groupTasks}
              isCollapsed={collapsedGroups[groupTitle]}
              grouping={grouping}
              toggleGroupCollapse={toggleGroupCollapse}
              setCreateInitialStatus={setCreateInitialStatus}
              setIsCreateModalOpen={setIsCreateModalOpen}
              highlightedTaskId={highlightedTaskId}
              selectedTaskId={selectedTaskId}
              activeIndex={activeIndex}
              selectedTaskIds={selectedTaskIds}
              visibleProperties={visibleProperties}
              hoveredTaskId={hoveredTaskId}
              setHoveredTaskId={setHoveredTaskId}
              hoveredTooltip={hoveredTooltip}
              setHoveredTooltip={setHoveredTooltip}
              activePicker={activePicker}
              setActivePicker={setActivePicker}
              hoveredAssignee={hoveredAssignee}
              setHoveredAssignee={setHoveredAssignee}
              handleUpdateTaskProperty={handleUpdateTaskProperty}
              handleUpdateTaskAssignee={handleUpdateTaskAssignee}
              toggleTaskSelection={toggleTaskSelection}
              navigate={navigate}
              availableMembers={availableMembers}
              organization={organization}
              getAssigneeUsername={getAssigneeUsername}
            />
          ))}
        </div>
          )}
        </div>
      )}

      {/* Task Details Modal (Always accessible from both List and Board) */}
      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => {
          setSelectedTaskId(null);
          if (searchParams.has("task") || location.state?.taskId) {
            navigate("/tasks", { replace: true });
          }
        }}
        taskId={selectedTaskId}
        onTaskUpdated={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t
            )
          );
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t.id !== deletedId && String(t.id) !== String(deletedId)));
          setSelectedTaskId(null);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        initialStatus={createInitialStatus}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
});
