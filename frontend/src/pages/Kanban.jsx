import React, { useState, useEffect, useMemo, useCallback, startTransition, memo } from "react";
import {
  useOutletContext,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreHorizontal,
  Clock,
  Menu,
  CheckSquare,
  AlertCircle,
  Calendar,
  User,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import ActionTooltip from "../components/ActionTooltip";
import StatusPicker, { getStatusIcon } from "../components/StatusPicker";
import PriorityPicker, { getPriorityIcon } from "../components/PriorityPicker";
import LeadPicker from "../components/LeadPicker";
import DatePicker from "../components/DatePicker";
import PickerWrapper from "../components/PickerWrapper";
import { playUiSound } from "../lib/sound";
import { getAvatarColor, getInitial } from "../lib/avatarUtils";
import { api } from "../lib/api";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import { TasksBoardSkeleton } from "../components/skeletons/PageSkeletons";
import { useDeferredSkeleton } from "../hooks/useDeferredSkeleton";
import ViewSwitcher from "../components/ViewSwitcher";
import { Cabinet as Abacus } from "@lucasmarkes/hairline/react";
import { useUser, useOrganization } from "@clerk/react";
import { useSocket } from "../contexts/SocketContext";
import { useTheme } from "../contexts/ThemeContext";

// Arc Components
import { Button } from "../registry/components/button/button";
import { Avatar } from "../registry/components/avatar/avatar";

const COLUMNS = [
  { id: "Backlog", label: "Backlog", dotColor: "#8a8f98" },
  { id: "Todo", label: "Todo", dotColor: "#cbd5e1" },
  { id: "In Progress", label: "In Progress", dotColor: "#f5a623" },
  { id: "In Review", label: "In Review", dotColor: "#38bdf8" },
  { id: "Done", label: "Done", dotColor: "#5e6ad2" },
  { id: "Canceled", label: "Canceled", dotColor: "#8a8f98" },
];

const matchesColumnStatus = (taskStatus, columnId) => {
  const s = (taskStatus || "Todo").toLowerCase().trim();
  const c = columnId.toLowerCase().trim();
  if (c === "todo") return s === "todo" || s === "to do" || s === "planned" || s === "planning";
  if (c === "done") return s === "done" || s === "completed";
  if (c === "in progress") return s === "in progress" || s === "in-progress" || s === "active";
  if (c === "in review") return s === "in review" || s === "review";
  if (c === "backlog") return s === "backlog";
  if (c === "canceled") return s === "canceled" || s === "cancelled";
  return s === c;
};

import { formatKririDate, formatMemberDisplayName } from "../lib/userPreferences";

function getTaskProgressDetails(task) {
  const isDone = task.status === "Done" || task.status === "Completed";
  const isCanceled = task.status === "Canceled" || task.status === "Cancelled";
  const progressPct =
    isDone
      ? 100
      : isCanceled
        ? 0
        : task.status === "In Review"
          ? 85
          : task.status === "In Progress"
            ? 55
            : task.status === "Backlog"
              ? 5
              : 15;

  const progressColor =
    isDone
      ? "bg-emerald-500"
      : isCanceled
        ? "bg-zinc-400 dark:bg-zinc-600"
        : task.status === "In Progress"
          ? "bg-amber-400"
          : task.status === "In Review"
            ? "bg-sky-400"
            : "bg-black/20 dark:bg-white/20";

  return { isDone, progressPct, progressColor };
}

const DEFAULT_VISIBLE_PROPERTIES = {
  id: true,
  status: true,
  assignee: true,
  priority: true,
  project: true,
  dueDate: true,
  subtasks: true,
};

const areTaskPropsEqual = (prevProps, nextProps) => {
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
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isHighlighted !== nextProps.isHighlighted) return false;
  if (prevProps.activePickerType !== nextProps.activePickerType) return false;
  if (prevProps.visibleProperties !== nextProps.visibleProperties) return false;
  if (prevProps.availableMembers !== nextProps.availableMembers) return false;
  return true;
};

const SortableTaskItem = memo(function SortableTaskItem({
  task,
  index,
  onClick,
  onTaskClick,
  isSelected,
  isHighlighted,
  activePickerType,
  setActivePicker,
  onUpdateTaskProperty,
  onUpdateTaskAssignee,
  availableMembers = [],
  visibleProperties = DEFAULT_VISIBLE_PROPERTIES,
}) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: task });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : transition,
    ...(isDragging ? { willChange: "transform", zIndex: 50 } : {}),
  };

  const { isDone, progressPct, progressColor } = getTaskProgressDetails(task);
  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  const formattedDue = task.due_date
    ? formatKririDate(task.due_date)
    : "No due date";

  const taskIdentifier = task.project_identifier
    ? `${task.project_identifier}-${task.id}`
    : task.project_slug
      ? `${task.project_slug}-${task.id}`
      : `TASK-${task.id}`;

  const assigneeAvatarUrl = task.assignee_avatar_url || task.assignee_avatar;

  return (
    <article
      ref={setNodeRef}
      id={`task-card-${task.id}`}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick || (() => onTaskClick?.(task.id))}
      className={`group rounded-xl p-3.5 flex flex-col gap-3 select-none ${
        isDragging
          ? "!transition-none opacity-30 border-2 border-dashed border-black/20 dark:border-white/20 bg-transparent scale-[0.98]"
          : isHighlighted
            ? "bg-surface-hover border-border shadow-[0_12px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-emerald-500 cursor-grab active:cursor-grabbing transition-colors"
            : isSelected
              ? "bg-[#3b82f6]/10 border border-[#3b82f6]/40 shadow-sm cursor-grab active:cursor-grabbing transition-colors"
              : "bg-white dark:bg-[#18191c] hover:bg-zinc-50 dark:hover:bg-[#1c1d21] border border-black/[0.08] dark:border-white/[0.05] shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing text-zinc-900 dark:text-zinc-100 transition-colors"
      }`}
    >
      {/* Top Header: Identifier, Interactive Priority, Options (No duplicate avatar, No text) */}
      <div className="flex items-center justify-between gap-2">
        {visibleProperties?.id !== false ? (
          <div
            className="font-mono text-[11px] text-zinc-400 dark:text-[#8a8f98] font-medium tracking-wider pt-0.5 whitespace-nowrap shrink-0 rounded px-1 -ml-1 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            title={taskIdentifier}
          >
            {taskIdentifier}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5 -mr-1 shrink-0">
          {visibleProperties?.status !== false && (
            <PickerWrapper
              open={activePickerType === "status"}
              onOpenChange={(open) => {
                if (open) {
                  setActivePicker({ type: "status", taskId: task.id });
                } else {
                  setActivePicker({ type: null, taskId: null });
                }
              }}
              trigger={
                <div>
                  <ActionTooltip
                    label={task.status ? `Status: ${task.status}` : "Change status"}
                    shortcut="S"
                  >
                    <button
                      type="button"
                      className="relative text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer outline-none active:scale-95"
                      aria-label="Change status"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePicker({ type: "status", taskId: task.id });
                      }}
                    >
                      {getStatusIcon(task.status || "Todo")}
                    </button>
                  </ActionTooltip>
                </div>
              }
            >
              <StatusPicker
                value={task.status || "Todo"}
                onChange={(val) => {
                  onUpdateTaskProperty?.(task.id, "status", val);
                  setActivePicker({ type: null, taskId: null });
                }}
                onClose={() => setActivePicker({ type: null, taskId: null })}
              />
            </PickerWrapper>
          )}

          {visibleProperties?.priority !== false && (
            <PickerWrapper
              open={activePickerType === "priority"}
              onOpenChange={(open) => {
                if (open) {
                  setActivePicker({ type: "priority", taskId: task.id });
                } else {
                  setActivePicker({ type: null, taskId: null });
                }
              }}
              trigger={
                <div>
                  <ActionTooltip
                    label={task.priority ? `Priority: ${task.priority}` : "Change priority"}
                    shortcut="P"
                  >
                    <button
                      type="button"
                      className="relative text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer outline-none active:scale-95"
                      aria-label="Change priority"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePicker({ type: "priority", taskId: task.id });
                      }}
                    >
                      {getPriorityIcon(task.priority || "No priority")}
                    </button>
                  </ActionTooltip>
                </div>
              }
            >
              <PriorityPicker
                value={task.priority || "No priority"}
                onChange={(val) => {
                  onUpdateTaskProperty?.(task.id, "priority", val);
                  setActivePicker({ type: null, taskId: null });
                }}
                onClose={() => setActivePicker({ type: null, taskId: null })}
              />
            </PickerWrapper>
          )}

          <ActionTooltip label="Task actions">
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] opacity-60 group-hover:opacity-100 transition-opacity flex items-center justify-center h-5 w-5 rounded-md hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer outline-none ml-0.5 active:scale-95"
              aria-label="Task options"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal size={13} />
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3
          className={`text-[14px] font-medium leading-snug line-clamp-2 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${
            isDone
              ? "text-zinc-400 dark:text-[#8a8f98] line-through"
              : "text-zinc-900 dark:text-[#e8e8e8]"
          }`}
          title={task.title}
        >
          {task.title}
        </h3>
      </div>

      {/* Description if present */}
      {task.description && (
        <div className="text-[13px] text-zinc-500 dark:text-[#8a8f98] leading-relaxed line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Status-colored Progress Meter */}
      <div
        className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Dates, Subtask count, Project badge, and Blocked indicators */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-zinc-600 dark:text-[#8a8f98]">
        {visibleProperties?.dueDate !== false && (
          <PickerWrapper
            open={activePickerType === "dueDate"}
            onOpenChange={(open) => {
              if (open) {
                setActivePicker({ type: "dueDate", taskId: task.id });
              } else {
                setActivePicker({ type: null, taskId: null });
              }
            }}
            trigger={
              <span>
                <ActionTooltip label={isOverdue ? "Overdue - click to reschedule" : "Change due date"} shortcut="D">
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium rounded px-1.5 py-0.5 -ml-1 cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all ${
                      isOverdue
                        ? "text-rose-600 dark:text-rose-400 font-semibold"
                        : "text-zinc-500 dark:text-[#8a8f98]"
                    }`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePicker({ type: "dueDate", taskId: task.id });
                    }}
                  >
                    <Clock
                      size={12}
                      className={isOverdue ? "text-rose-500 shrink-0" : "text-[#5e636e] shrink-0"}
                    />
                    <span>{isOverdue ? `${formattedDue} (Overdue)` : formattedDue}</span>
                  </span>
                </ActionTooltip>
              </span>
            }
          >
            <DatePicker
              value={task.due_date}
              onChange={(date) => {
                onUpdateTaskProperty?.(
                  task.id,
                  "due_date",
                  date ? (date instanceof Date ? date.toISOString() : date) : null
                );
                setActivePicker({ type: null, taskId: null });
              }}
              onClose={() => setActivePicker({ type: null, taskId: null })}
              placeholder="Due date"
            />
          </PickerWrapper>
        )}

        {visibleProperties?.project !== false && (task.project_name || task.project_identifier) && (
          <ActionTooltip label={`Project: ${task.project_name || task.project_identifier}`}>
            <span
              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white rounded px-1.5 py-0.5 -ml-1 cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors truncate max-w-[150px]"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                if (task.project_id) {
                  e.stopPropagation();
                  navigate(`/projects/${task.project_id}`);
                }
              }}
            >
              <FileText size={11} className="text-zinc-400 dark:text-[#6e737d] shrink-0" />
              <span className="truncate">{task.project_name || task.project_identifier}</span>
            </span>
          </ActionTooltip>
        )}

        {task.created_at && (
          <ActionTooltip label="Created date">
            <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white rounded px-1.5 py-0.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-default">
              <Calendar size={12} className="text-[#5e636e] shrink-0" />
              <span>
                {new Date(task.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </span>
          </ActionTooltip>
        )}

        {visibleProperties?.subtasks !== false && task.subtask_count > 0 && (
          <ActionTooltip label={`${task.completed_subtask_count || 0} of ${task.subtask_count} subtasks completed`}>
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-mono text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] px-1.5 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.06] transition-colors cursor-pointer"
            >
              <CheckSquare size={10} className="shrink-0" />
              <span>
                {task.completed_subtask_count || 0}/{task.subtask_count}
              </span>
            </span>
          </ActionTooltip>
        )}

        {task.blocked_by_count > 0 && !isDone && (
          <ActionTooltip label={`Blocked by ${task.blocked_by_count} incomplete task(s)`}>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20 transition-colors cursor-pointer"
            >
              <AlertCircle size={10} className="shrink-0" />
              <span>Blocked</span>
            </span>
          </ActionTooltip>
        )}
      </div>

      {/* Footer: Assignee with Name on Left, Subtasks (if any) on Right - No "0 issues" */}
      {(visibleProperties?.assignee !== false || (visibleProperties?.subtasks !== false && task.subtask_count > 0)) && (
        <div className="flex items-center justify-between pt-1 border-t border-black/[0.06] dark:border-white/[0.04] text-[12.5px] text-zinc-600 dark:text-[#8a8f98]">
          {visibleProperties?.assignee !== false ? (
            <div className="relative min-w-0">
              <PickerWrapper
                open={activePickerType === "assignee"}
                onOpenChange={(open) => {
                  if (open) {
                    setActivePicker({ type: "assignee", taskId: task.id });
                  } else {
                    setActivePicker({ type: null, taskId: null });
                  }
                }}
                trigger={
                  <div>
                    <ActionTooltip label={task.assignee_name ? `Assigned to ${task.assignee_name}` : "Assign task"} shortcut="A">
                      <div
                        className="flex items-center gap-2 px-1.5 py-0.5 -ml-1 rounded-md transition-all w-fit cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-zinc-900 dark:hover:text-[#e8e8e8] active:scale-95"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePicker({ type: "assignee", taskId: task.id });
                        }}
                      >
                        {task.assignee_name ? (
                          <>
                            <div
                              className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white uppercase overflow-hidden shrink-0 ${getAvatarColor(task.assignee_name, task.assignee_email)}`}
                            >
                              {assigneeAvatarUrl ? (
                                <img
                                  src={assigneeAvatarUrl}
                                  alt={task.assignee_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitial(task.assignee_name, task.assignee_email)
                              )}
                            </div>
                            <span className="text-[13px] text-zinc-600 dark:text-[#8a8f98] truncate max-w-[150px]">
                              {task.assignee_name}
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-[#8a8f98]">
                            <div className="flex items-center justify-center w-4 h-4 rounded-[4px] border border-zinc-400 dark:border-white/20 bg-transparent">
                              <User size={10} />
                            </div>
                            <span className="text-[12px]">Unassigned</span>
                          </div>
                        )}
                      </div>
                    </ActionTooltip>
                  </div>
                }
              >
                <LeadPicker
                  value={
                    task.assignee_id
                      ? {
                          id: task.assignee_id,
                          name: task.assignee_name,
                          email: task.assignee_email,
                          avatar_url: assigneeAvatarUrl,
                        }
                      : null
                  }
                  availableMembers={availableMembers}
                  onChange={(member) => {
                    onUpdateTaskAssignee?.(task.id, member);
                    setActivePicker({ type: null, taskId: null });
                  }}
                  onClose={() => setActivePicker({ type: null, taskId: null })}
                />
              </PickerWrapper>
            </div>
          ) : (
            <div />
          )}

          {visibleProperties?.subtasks !== false && task.subtask_count > 0 && (
            <div className="text-[12.5px] text-zinc-500 dark:text-[#8a8f98] shrink-0 font-normal">
              {task.subtask_count} subtask{task.subtask_count === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}
    </article>
  );
}, areTaskPropsEqual);

function TaskCardPreview({ task, visibleProperties = DEFAULT_VISIBLE_PROPERTIES }) {
  const { isDone, progressPct, progressColor } = getTaskProgressDetails(task);
  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  const formattedDue = task.due_date
    ? formatKririDate(task.due_date)
    : "No due date";

  const taskIdentifier = task.project_identifier
    ? `${task.project_identifier}-${task.id}`
    : task.project_slug
      ? `${task.project_slug}-${task.id}`
      : `TASK-${task.id}`;

  const assigneeAvatarUrl = task.assignee_avatar_url || task.assignee_avatar;

  return (
    <article
      style={{ willChange: "transform" }}
      className="group rounded-xl p-3.5 flex flex-col gap-3 select-none pointer-events-none rotate-1 scale-[1.02] w-[320px] bg-white dark:bg-[#18191c] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.7)] text-zinc-900 dark:text-zinc-100 !transition-none"
    >
      {/* Top Header: Identifier, Priority Icon, Options (No duplicate avatar, No text) */}
      <div className="flex items-center justify-between gap-2">
        {visibleProperties?.id !== false ? (
          <div className="font-mono text-[11px] text-zinc-400 dark:text-[#8a8f98] font-medium tracking-wider pt-0.5 whitespace-nowrap shrink-0">
            {taskIdentifier}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5 -mr-1 shrink-0">
          {visibleProperties?.status !== false && (
            <div className="text-zinc-600 dark:text-[#8a8f98] flex items-center justify-center w-5 h-5">
              {getStatusIcon(task.status || "Todo")}
            </div>
          )}

          {visibleProperties?.priority !== false && (
            <div className="inline-flex items-center text-[11px] text-zinc-500 dark:text-[#8a8f98]">
              {getPriorityIcon(task.priority || "No priority")}
            </div>
          )}

          <div className="text-zinc-400 dark:text-[#8a8f98] flex items-center justify-center h-5 w-5 rounded-md ml-0.5">
            <MoreHorizontal size={13} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <h4
          className={`text-[14px] font-medium leading-snug line-clamp-2 ${
            isDone
              ? "text-zinc-400 dark:text-[#8a8f98] line-through"
              : "text-zinc-900 dark:text-[#e8e8e8]"
          }`}
        >
          {task.title}
        </h4>
      </div>

      {/* Description if present */}
      {task.description && (
        <div className="text-[13px] text-zinc-500 dark:text-[#8a8f98] leading-relaxed line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Status-colored Progress Meter */}
      <div
        className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full ${progressColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Dates, Subtask count, Project badge, and Blocked indicators */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-zinc-600 dark:text-[#8a8f98]">
        {visibleProperties?.dueDate !== false && (
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-zinc-500 dark:text-[#8a8f98]"
            }`}
          >
            <Clock size={12} className={isOverdue ? "text-rose-500 shrink-0" : "text-[#5e636e] shrink-0"} />
            <span>{isOverdue ? `${formattedDue} (Overdue)` : formattedDue}</span>
          </span>
        )}

        {visibleProperties?.project !== false && (task.project_name || task.project_identifier) && (
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-[#8a8f98] truncate max-w-[150px]">
            <FileText size={11} className="text-zinc-400 dark:text-[#6e737d] shrink-0" />
            <span className="truncate">{task.project_name || task.project_identifier}</span>
          </span>
        )}

        {task.created_at && (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-[#8a8f98]">
            <Calendar size={12} className="text-[#5e636e] shrink-0" />
            <span>
              {new Date(task.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </span>
        )}

        {visibleProperties?.subtasks !== false && task.subtask_count > 0 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-zinc-500 dark:text-[#8a8f98] bg-black/[0.03] dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.06]">
            <CheckSquare size={10} className="shrink-0" />
            <span>
              {task.completed_subtask_count || 0}/{task.subtask_count}
            </span>
          </span>
        )}

        {task.blocked_by_count > 0 && !isDone && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <AlertCircle size={10} className="shrink-0" />
            <span>Blocked</span>
          </span>
        )}
      </div>

      {/* Footer: Assignee with Name on Left, Subtasks (if any) on Right - No "0 issues" */}
      {(visibleProperties?.assignee !== false || (visibleProperties?.subtasks !== false && task.subtask_count > 0)) && (
        <div className="flex items-center justify-between pt-1 border-t border-black/[0.06] dark:border-white/[0.04] text-[12.5px] text-zinc-600 dark:text-[#8a8f98]">
          {visibleProperties?.assignee !== false ? (
            <div className="flex items-center gap-2 min-w-0">
              {task.assignee_name ? (
                <>
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white uppercase overflow-hidden shrink-0 ${getAvatarColor(task.assignee_name, task.assignee_email)}`}
                  >
                    {assigneeAvatarUrl ? (
                      <img
                        src={assigneeAvatarUrl}
                        alt={task.assignee_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitial(task.assignee_name, task.assignee_email)
                    )}
                  </div>
                  <span className="text-[13px] text-zinc-600 dark:text-[#8a8f98] truncate max-w-[150px]">
                    {task.assignee_name}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-[#8a8f98]">
                  <div className="flex items-center justify-center w-4 h-4 rounded-[4px] border border-zinc-400 dark:border-white/20 bg-transparent">
                    <User size={10} />
                  </div>
                  <span className="text-[12px]">Unassigned</span>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {visibleProperties?.subtasks !== false && task.subtask_count > 0 && (
            <div className="text-[12.5px] text-zinc-500 dark:text-[#8a8f98] shrink-0 font-normal">
              {task.subtask_count} subtask{task.subtask_count === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

const HiddenTaskColumnCard = memo(function HiddenTaskColumnCard({
  col,
  count,
  onCreateTask,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
        isOver
          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/40"
          : "bg-black/[0.01] dark:bg-white/[0.01] border-black/[0.06] dark:border-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-2 text-[12px] text-zinc-900 dark:text-[#e8e8e8] font-medium">
        <div className="flex items-center justify-center shrink-0 w-4 h-4">
          {getStatusIcon(col.id)}
        </div>
        <span>{col.label || col.id}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-600 dark:text-[#8a8f98] text-[11px] font-medium px-1.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-md">
          {count}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateTask(col.id);
          }}
          className="h-6 w-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          title={`New ${col.label || col.id} task`}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
});

const areColumnPropsEqual = (prevProps, nextProps) => {
  if (prevProps.col.id !== nextProps.col.id) return false;
  if (prevProps.col.label !== nextProps.col.label) return false;
  if (prevProps.tasks !== nextProps.tasks) return false;
  if (prevProps.selectedTaskId !== nextProps.selectedTaskId) return false;
  if (prevProps.highlightedTaskId !== nextProps.highlightedTaskId) return false;
  if (prevProps.showColumnBackgrounds !== nextProps.showColumnBackgrounds) return false;
  if (prevProps.visibleProperties !== nextProps.visibleProperties) return false;
  if (prevProps.availableMembers !== nextProps.availableMembers) return false;
  const prevPickerActive = prevProps.activePicker?.taskId
    ? prevProps.tasks.some((t) => t.id === prevProps.activePicker.taskId)
    : false;
  const nextPickerActive = nextProps.activePicker?.taskId
    ? nextProps.tasks.some((t) => t.id === nextProps.activePicker.taskId)
    : false;
  if (prevPickerActive !== nextPickerActive) return false;
  return true;
};

const KanbanColumn = memo(function KanbanColumn({
  col,
  colIndex,
  tasks,
  selectedTaskId,
  highlightedTaskId,
  showColumnBackgrounds = false,
  onTaskClick,
  onCreateTask,
  activePicker,
  setActivePicker,
  onUpdateTaskProperty,
  onUpdateTaskAssignee,
  availableMembers = [],
  visibleProperties,
}) {
  const { setNodeRef } = useDroppable({ id: col.id });

  const [renderLimit, setRenderLimit] = useState(25);

  useEffect(() => {
    if (tasks.length <= 25) {
      setRenderLimit(tasks.length);
    } else {
      setRenderLimit((prev) => Math.min(Math.max(prev, 25), tasks.length));
    }
  }, [tasks.length]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 350) {
      if (renderLimit < tasks.length) {
        setRenderLimit((prev) => Math.min(prev + 25, tasks.length));
      }
    }
  };

  const targetIndex = useMemo(() => {
    if (!highlightedTaskId) return -1;
    return tasks.findIndex((t) => String(t.id) === String(highlightedTaskId));
  }, [tasks, highlightedTaskId]);

  const effectiveLimit = Math.max(renderLimit, targetIndex >= 0 ? targetIndex + 5 : 0);
  const visibleTasks = tasks.slice(0, effectiveLimit);
  const visibleTaskIds = useMemo(() => visibleTasks.map((t) => t.id), [visibleTasks]);

  return (
    <section
      id={`kanban-column-${col.id}`}
      className={`flex flex-col h-full max-h-full min-h-0 w-[320px] min-w-[320px] max-w-[320px] shrink-0 ${
        showColumnBackgrounds
          ? "bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.05] rounded-2xl px-3 pt-3 pb-0 overflow-hidden"
          : "bg-transparent p-0 border border-transparent"
      }`}
    >
      {/* Column Header */}
      <div
        className={`flex items-center justify-between pb-2.5 mb-2 shrink-0 ${
          showColumnBackgrounds
            ? "px-1 border-b border-black/[0.06] dark:border-white/[0.05]"
            : "px-0.5"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center shrink-0 w-4 h-4">
            {getStatusIcon(col.id)}
          </div>
          <h2 className="text-[13.5px] font-medium text-zinc-900 dark:text-[#e8e8e8] tracking-tight">
            {col.label}
          </h2>
          <span className="text-[12px] font-normal text-zinc-500 dark:text-[#8a8f98]">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          onClick={() => onCreateTask(col.id)}
          aria-label={`Add task to ${col.label}`}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Droppable Task List */}
      <div
        ref={setNodeRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden gap-3 pb-24 scrollbar-hide min-h-[150px]"
      >
        <SortableContext
          id={col.id}
          items={visibleTaskIds}
          strategy={verticalListSortingStrategy}
        >
          {visibleTasks.map((task, taskIdx) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={taskIdx}
              isSelected={String(selectedTaskId) === String(task.id)}
              isHighlighted={String(highlightedTaskId) === String(task.id)}
              onTaskClick={onTaskClick}
              activePickerType={activePicker?.taskId === task.id ? activePicker.type : null}
              setActivePicker={setActivePicker}
              onUpdateTaskProperty={onUpdateTaskProperty}
              onUpdateTaskAssignee={onUpdateTaskAssignee}
              availableMembers={availableMembers}
              visibleProperties={visibleProperties}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-black/10 dark:border-white/10 rounded-xl min-h-[140px] text-[12px] font-medium text-zinc-400 dark:text-[#8a8f98]">
            Drop a task here
          </div>
        )}
      </div>
    </section>
  );
}, areColumnPropsEqual);

export default memo(function Kanban({
  embedded = false,
  activeFilter: propActiveFilter,
  searchQuery: propSearchQuery = "",
  showColumnBackgrounds: propShowColumnBackgrounds,
  showEmptyColumns: propShowEmptyColumns,
  onSelectTask,
  tasks: propTasks,
  setTasks: propSetTasks,
  availableMembers: propAvailableMembers,
  onUpdateTaskProperty: propOnUpdateTaskProperty,
  onUpdateTaskAssignee: propOnUpdateTaskAssignee,
  visibleProperties: propVisibleProperties,
}) {
  const navigate = useNavigate();
  const visibleProperties = useMemo(() => {
    if (propVisibleProperties) return propVisibleProperties;
    try {
      const saved = localStorage.getItem("kriri_tasks_display_properties");
      if (saved) return { ...DEFAULT_VISIBLE_PROPERTIES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VISIBLE_PROPERTIES;
  }, [propVisibleProperties]);
  const [activePicker, setActivePicker] = useState({ type: null, taskId: null });
  const [internalMembers, setInternalMembers] = useState([]);
  const isAuditMock = typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage?.getItem("audit_mock_auth") === "true");
  const { user } = useUser();
  const { organization } = useOrganization();

  useEffect(() => {
    if (propAvailableMembers && propAvailableMembers.length > 0) return;
    if (organization?.id) {
      const cached = api.getCached(`/workspaces/${organization.id}/members`);
      if (Array.isArray(cached) && cached.length > 0) {
        setInternalMembers(cached);
        return;
      }
      api
        .get(`/workspaces/${organization.id}/members`, { ttl: 300000 })
        .then((res) => {
          const list = Array.isArray(res) ? res : res.members || [];
          setInternalMembers(list);
        })
        .catch(() => {});
    }
  }, [propAvailableMembers, organization?.id]);

  const availableMembers = propAvailableMembers || internalMembers;
  const scopeKey = user?.id ? `${user.id}:${organization?.id || "personal"}` : (isAuditMock ? "mock_user:personal" : null);
  const boardCacheKey = scopeKey ? `kriri:cache:board_tasks_${scopeKey}` : null;

  const [localShowColumnBackgrounds, setLocalShowColumnBackgrounds] = useState(() => {
    try {
      return localStorage.getItem("kriri-task-show-column-backgrounds") === "true";
    } catch {
      return false;
    }
  });
  const showColumnBackgrounds =
    propShowColumnBackgrounds !== undefined
      ? propShowColumnBackgrounds
      : localShowColumnBackgrounds;

  const [localShowEmptyColumns, setLocalShowEmptyColumns] = useState(() => {
    try {
      const val = localStorage.getItem("kriri-task-show-empty-columns");
      return val !== null ? val === "true" : false;
    } catch {
      return false;
    }
  });
  const showEmptyColumns =
    propShowEmptyColumns !== undefined
      ? propShowEmptyColumns
      : localShowEmptyColumns;

  const [hiddenColumnsRevealed, setHiddenColumnsRevealed] = useState(false);

  const saveBoardTasksCache = (taskList) => {
    if (!boardCacheKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(boardCacheKey, JSON.stringify(taskList));
    } catch {}
  };

  const isControlled = Array.isArray(propTasks);

  // Zero-latency instant hydration from in-memory and local cache
  const [internalTasks, setInternalTasks] = useState(() => {
    if (isControlled) return propTasks;
    if (!boardCacheKey) return [];
    const fromApiCache = api.getCached("/tasks");
    if (Array.isArray(fromApiCache) && fromApiCache.length > 0) return fromApiCache;
    try {
      localStorage.removeItem("kriri:cache:board_tasks");
      const cached = localStorage.getItem(boardCacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const tasks = isControlled ? propTasks : internalTasks;

  const updateTasks = (updater) => {
    if (propSetTasks) {
      propSetTasks(updater);
    }
    setInternalTasks(updater);
  };

  useEffect(() => {
    if (isControlled) return;
    if (!boardCacheKey) {
      setInternalTasks([]);
      return;
    }
    try {
      localStorage.removeItem("kriri:cache:board_tasks");
      const cached = localStorage.getItem(boardCacheKey);
      setInternalTasks(cached ? JSON.parse(cached) : []);
    } catch {
      setInternalTasks([]);
    }
  }, [boardCacheKey, isControlled]);

  const [loading, setLoading] = useState(() => {
    if (isControlled) return false;
    return isAuditMock ? false : internalTasks.length === 0;
  });
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState("Todo");
  const [activeFilter, setActiveFilter] = useState("all");

  const outletCtx = useOutletContext();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const socket = useSocket();
  const { effectiveTheme } = useTheme();

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "assigned", label: "Assigned to me", shortLabel: "Assigned", mobileLabel: "Assigned" },
    { value: "created", label: "Created by me", shortLabel: "Created", mobileLabel: "Created" },
  ];

  useEffect(() => {
    const taskIdParam = searchParams.get("task") || location.state?.taskId;
    if (taskIdParam) {
      const parsedId = Number(taskIdParam) || taskIdParam;
      setHighlightedTaskId(parsedId);
      if (searchParams.get("modal") === "true" || location.state?.openModal) {
        startTransition(() => {
          setSelectedTaskId(parsedId);
        });
      }
    }
  }, [location.search, location.state]);

  useEffect(() => {
    if (!loading && highlightedTaskId) {
      const timer = setTimeout(() => {
        const targetTask = tasks.find(
          (t) => String(t.id) === String(highlightedTaskId),
        );
        if (targetTask) {
          const colEl = document.getElementById(
            `kanban-column-${targetTask.status}`,
          );
          if (colEl) {
            colEl.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest",
            });
          }
        }
        const cardEl = document.getElementById(`task-card-${highlightedTaskId}`);
        if (cardEl) {
          cardEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loading, highlightedTaskId, tasks]);

  const openMobileNav = () => {
    if (outletCtx?.openMobileNav) {
      outletCtx.openMobileNav();
    } else {
      window.dispatchEvent(new CustomEvent("open-mobile-nav"));
    }
  };

  useEffect(() => {
    if (!socket || isControlled) return;

    const handleTaskCreated = (newTask) => {
      updateTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        const updated = [newTask, ...prev];
        saveBoardTasksCache(updated);
        return updated;
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      updateTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        );
        saveBoardTasksCache(updated);
        return updated;
      });
    };

    const handleTaskDeleted = (data) => {
      const deletedId = typeof data === "object" && data !== null ? (data.id ?? data.taskId) : data;
      updateTasks((prev) => {
        const updated = prev.filter((t) => t.id !== deletedId && String(t.id) !== String(deletedId));
        saveBoardTasksCache(updated);
        return updated;
      });
    };

    socket.on("TASK_CREATED", handleTaskCreated);
    socket.on("TASK_UPDATED", handleTaskUpdated);
    socket.on("TASK_DELETED", handleTaskDeleted);

    return () => {
      socket.off("TASK_CREATED", handleTaskCreated);
      socket.off("TASK_UPDATED", handleTaskUpdated);
      socket.off("TASK_DELETED", handleTaskDeleted);
    };
  }, [socket, boardCacheKey, isControlled]);

  // Fetch tasks with background revalidation (only if uncontrolled)
  useEffect(() => {
    if (isControlled || (!user && !isAuditMock)) return;
    if (tasks.length === 0) setLoading(true);

    api
      .get("/tasks")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.tasks || [];
        updateTasks(list);
        saveBoardTasksCache(list);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, organization?.id, isControlled]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dropAnimationConfig = useMemo(
    () => ({
      duration: 0,
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: "0.3",
          },
        },
      }),
    }),
    [],
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    const isOverAColumn = COLUMNS.some((c) => c.id === overId);
    const overTaskData = tasks.find((t) => t.id === overId);
    const targetStatus = isOverAColumn ? overId : overTaskData?.status || activeTaskData.status;

    // If reordering within the same column
    if (activeId !== overId && overTaskData && activeTaskData.status === overTaskData.status) {
      updateTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return prev;
        const reordered = arrayMove(prev, activeIndex, overIndex);
        saveBoardTasksCache(reordered);
        return reordered;
      });
      return;
    }

    // Persist final status to backend and cache if moved to different status/column
    if (activeTaskData.status !== targetStatus) {
      if (targetStatus === "Done") {
        playUiSound("success");
      } else {
        playUiSound("toggle");
      }
      updateTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return prev;

        const updated = [...prev];
        updated[activeIndex] = {
          ...updated[activeIndex],
          status: targetStatus,
        };

        let newIndex = overTaskData
          ? updated.findIndex((t) => t.id === overId)
          : -1;

        if (newIndex < 0) {
          // If dropped on column container, find last task in target column
          const lastColTask = [...updated].reverse().find((t) => t.status === targetStatus && t.id !== activeId);
          newIndex = lastColTask ? updated.findIndex((t) => t.id === lastColTask.id) + 1 : updated.length - 1;
        }

        if (newIndex < 0) newIndex = 0;
        if (newIndex >= updated.length) newIndex = updated.length - 1;

        const reordered = arrayMove(updated, activeIndex, newIndex);
        saveBoardTasksCache(reordered);
        return reordered;
      });
      api.put(`/tasks/${activeId}`, { status: targetStatus }).catch(console.error);
    }
  };

  const currentFilter = propActiveFilter !== undefined ? propActiveFilter : activeFilter;
  const currentSearch = propSearchQuery !== undefined ? propSearchQuery : "";

  // Filter tasks based on currentFilter and currentSearch
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (currentSearch.trim()) {
      const q = currentSearch.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.assignee_name || "").toLowerCase().includes(q) ||
          (t.project_identifier || "").toLowerCase().includes(q) ||
          String(t.id).includes(q),
      );
    }
    if (currentFilter === "assigned" || currentFilter === "mine") {
      const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
      const userName = user?.fullName?.toLowerCase();
      return list.filter(
        (t) =>
          (user?.id && (t.assignee_id === user.id || t.assignee_id === "personal")) ||
          (t.assignee_email && t.assignee_email.toLowerCase() === userEmail) ||
          (t.assignee_name && userName && t.assignee_name.toLowerCase() === userName),
      );
    }
    if (currentFilter === "created") {
      const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
      const userName = user?.fullName?.toLowerCase();
      return list.filter(
        (t) =>
          (user?.id && (t.reporter_id === user.id || t.reporter_id === "personal")) ||
          (t.reporter_email && t.reporter_email.toLowerCase() === userEmail) ||
          (t.reporter_name && userName && t.reporter_name.toLowerCase() === userName),
      );
    }
    return list;
  }, [tasks, currentFilter, currentSearch, user]);

  const tasksByColumn = useMemo(() => {
    const map = {};
    COLUMNS.forEach((col) => {
      map[col.id] = [];
    });
    filteredTasks.forEach((t) => {
      const col = COLUMNS.find((c) => matchesColumnStatus(t.status, c.id));
      if (col && map[col.id]) {
        map[col.id].push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  const emptyColumns = useMemo(() => {
    return COLUMNS.filter((col) => {
      const columnTasks = tasksByColumn[col.id] || [];
      return columnTasks.length === 0;
    });
  }, [tasksByColumn]);

  const nonEmptyColumns = useMemo(() => {
    return COLUMNS.filter((col) => {
      const columnTasks = tasksByColumn[col.id] || [];
      return columnTasks.length > 0;
    });
  }, [tasksByColumn]);

  const hasHiddenColumns = !showEmptyColumns && emptyColumns.length > 0;

  const handleUpdateTaskProperty = useCallback(async (taskId, property, value) => {
    setActivePicker({ type: null, taskId: null });
    if (propOnUpdateTaskProperty) {
      return propOnUpdateTaskProperty(taskId, property, value);
    }
    if (property === "status" && (value === "Done" || value === "Completed")) {
      playUiSound("success");
    } else {
      playUiSound("toggle");
    }
    updateTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [property]: value } : t))
    );
    try {
      const updated = await api.put(`/tasks/${taskId}`, { [property]: value });
      updateTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      console.error(`Failed to update task ${property}:`, err);
    }
  }, [propOnUpdateTaskProperty]);

  const handleUpdateTaskAssignee = useCallback(async (taskId, member) => {
    setActivePicker({ type: null, taskId: null });
    if (propOnUpdateTaskAssignee) {
      return propOnUpdateTaskAssignee(taskId, member);
    }
    playUiSound("toggle");
    const patch = {
      assignee_id: member ? member.id : null,
      assignee_name: member ? member.name : null,
      assignee_username: member ? member.username : null,
      assignee_avatar_url: member ? member.avatar_url : null,
    };
    updateTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
    try {
      const updated = await api.put(`/tasks/${taskId}`, patch);
      updateTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      console.error("Failed to update task assignee:", err);
    }
  }, [propOnUpdateTaskAssignee]);

  const handleTaskClick = useCallback((id) => {
    if (onSelectTask) {
      onSelectTask(id);
    } else {
      navigate(`/tasks/${id}`);
    }
  }, [onSelectTask, navigate]);

  const handleCreateTask = useCallback((status) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  }, []);

  const renderColumn = (col, colIndex) => {
    const columnTasks = tasksByColumn[col.id] || [];

    return (
      <KanbanColumn
        key={col.id}
        col={col}
        colIndex={colIndex}
        tasks={columnTasks}
        selectedTaskId={selectedTaskId}
        highlightedTaskId={highlightedTaskId}
        showColumnBackgrounds={showColumnBackgrounds}
        onTaskClick={handleTaskClick}
        onCreateTask={handleCreateTask}
        activePicker={activePicker}
        setActivePicker={setActivePicker}
        onUpdateTaskProperty={handleUpdateTaskProperty}
        onUpdateTaskAssignee={handleUpdateTaskAssignee}
        availableMembers={availableMembers}
        visibleProperties={visibleProperties}
      />
    );
  };

  const showSkeleton = useDeferredSkeleton(loading && tasks.length === 0, 180);

  if (showSkeleton) {
    return <TasksBoardSkeleton />;
  }

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
      {/* Top Header Row matching Kriri Board Header (hidden if embedded in Tasks page) */}
      {!embedded && (
        <div className="flex items-center justify-between gap-3 mb-3.5 min-h-[38px] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={openMobileNav}
              className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-foreground truncate">
              Board
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCreateModalStatus("Todo");
                setIsCreateModalOpen(true);
              }}
              className="h-[28px] px-3 text-[12px] font-medium rounded-full gap-1.5 shadow-xs active:scale-[0.98] transition-all"
            >
              <Plus size={13} strokeWidth={2.2} />
              New Task
            </Button>
          </div>
        </div>
      )}

      {/* Empty State vs Kanban Board */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
            <Abacus
              theme={effectiveTheme}
              intensity={0.7}
              className="w-full h-full text-zinc-400 dark:text-[#8a8f98] opacity-80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Create your first board item
            </h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Boards give you a visual overview of your tasks. Create your first
              issue to see it organized by status.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setCreateModalStatus("Todo");
                setIsCreateModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus size={14} />
              New Task
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar: Fluid Filter Switcher & Tasks Count (only when not embedded) */}
          {!embedded && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3.5 shrink-0">
              <div className="w-full sm:w-fit grid grid-cols-4 sm:flex items-center p-1 rounded-full bg-surface border border-border backdrop-blur-sm relative">
                {filterOptions.map((opt) => {
                  const isActive = activeFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActiveFilter(opt.value)}
                      className={`relative text-[11px] sm:text-[12px] px-1 sm:px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center justify-center text-center select-none ${
                        isActive
                          ? "text-foreground font-semibold"
                          : "text-text-muted hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <div
                          className="absolute inset-0 bg-surface-elevated border border-border-subtle rounded-full shadow-xs pointer-events-none"
                        />
                      )}
                      <span className="relative z-10 hidden sm:inline whitespace-nowrap">{opt.label}</span>
                      <span className="relative z-10 sm:hidden truncate">{opt.shortLabel || opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-0.5 text-[12px] sm:text-[12.5px] font-medium text-text-muted">
                <p>
                  <b className="text-foreground font-semibold">{filteredTasks.length}</b>{" "}
                  {filteredTasks.length === 1 ? "task" : "tasks"} shown
                </p>
              </div>
            </div>
          )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-5 overflow-x-auto overflow-y-hidden pb-0 min-h-0 min-w-0 scrollbar-hide">
            {(showEmptyColumns ? COLUMNS : nonEmptyColumns).map((col, index) =>
              renderColumn(col, index),
            )}
            {hasHiddenColumns && (
              <div
                className={`flex flex-col flex-shrink-0 ${
                  hiddenColumnsRevealed ? "w-[260px] min-w-[260px]" : "shrink-0"
                } ml-1`}
              >
                <button
                  type="button"
                  onClick={() => setHiddenColumnsRevealed((prev) => !prev)}
                  className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md text-[12.5px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] self-start transition-colors whitespace-nowrap cursor-pointer select-none ${
                    hiddenColumnsRevealed ? "mb-2.5" : ""
                  }`}
                >
                  {hiddenColumnsRevealed ? (
                    <ChevronDown
                      size={13}
                      className="text-zinc-400 dark:text-[#8a8f98] shrink-0"
                    />
                  ) : (
                    <ChevronRight
                      size={13}
                      className="text-zinc-400 dark:text-[#8a8f98] shrink-0"
                    />
                  )}
                  <span>Hidden columns</span>
                  <span className="text-zinc-400 dark:text-[#5e636e] ml-0.5">
                    {emptyColumns.length}
                  </span>
                </button>

                {hiddenColumnsRevealed && (
                  <div className="flex flex-col gap-1.5">
                    {emptyColumns.map((col) => {
                      const count = filteredTasks.filter((t) =>
                        matchesColumnStatus(t.status, col.id),
                      ).length;
                      return (
                        <HiddenTaskColumnCard
                          key={col.id}
                          col={col}
                          count={count}
                          onCreateTask={handleCreateTask}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeTask ? (
              <TaskCardPreview
                task={activeTask}
                visibleProperties={visibleProperties}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </>
    )}

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => {
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        onTaskUpdated={(updatedTask) => {
          updateTasks((prev) => {
            const updated = prev.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
            );
            saveBoardTasksCache(updated);
            return updated;
          });
        }}
      />
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStatus={createModalStatus}
        onTaskCreated={(newTask) => {
          updateTasks((prev) => {
            if (prev.some((t) => t.id === newTask.id)) return prev;
            const updated = [newTask, ...prev];
            saveBoardTasksCache(updated);
            return updated;
          });
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
});
