import { useState, useEffect, useMemo } from "react";
import {
  useOutletContext,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  DndContext,
  closestCorners,
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
} from "lucide-react";
import { getPriorityIcon } from "../components/PriorityPicker";
import { api } from "../lib/api";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import PageLoading from "../components/PageLoading";
import { Cabinet as Abacus } from "@lucasmarkes/hairline/react";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { useSocket } from "../contexts/SocketContext";
import { useTheme } from "../contexts/ThemeContext";

// Arc Components
import { Button } from "../registry/components/button/button";
import { Avatar } from "../registry/components/avatar/avatar";
import { motion, LayoutGroup } from "motion/react";

const COLUMNS = [
  { id: "Todo", label: "To Do", dotColor: "#8d9a92" },
  { id: "In Progress", label: "In Progress", dotColor: "#e8a317" },
  { id: "In Review", label: "In Review", dotColor: "#38bdf8" },
  { id: "Done", label: "Done", dotColor: "#10b981" },
];

function getTaskProgressDetails(task) {
  const isDone = task.status === "Done";
  const progressPct =
    isDone
      ? 100
      : task.status === "In Review"
        ? 85
        : task.status === "In Progress"
          ? 55
          : 15;

  const progressColor =
    isDone
      ? "bg-emerald-500"
      : task.status === "In Progress"
        ? "bg-amber-400"
        : task.status === "In Review"
          ? "bg-sky-400"
          : "bg-black/20 dark:bg-white/20";

  return { isDone, progressPct, progressColor };
}

function SortableTaskItem({ task, index, onClick, isSelected, isHighlighted }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: task });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    "--task-stagger": index,
  };

  const { isDone, progressPct, progressColor } = getTaskProgressDetails(task);
  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  const formattedDue = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No due date";

  return (
    <article
      ref={setNodeRef}
      id={`task-card-${task.id}`}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`kriri-task-card relative rounded-2xl p-3.5 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
        isDragging
          ? "opacity-20 border-2 border-dashed border-black/20 dark:border-white/20 bg-zinc-100/50 dark:bg-[#16171a]/50 scale-[0.98]"
          : isHighlighted
            ? "bg-zinc-50 dark:bg-[#1f2127] border-black/20 dark:border-white/[0.22] shadow-[0_12px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-emerald-500"
            : isSelected
              ? "bg-zinc-50 dark:bg-[#1c1d22] border-black/15 dark:border-white/15 shadow-sm"
              : "bg-white dark:bg-[#16171a] border border-black/[0.08] dark:border-white/[0.08] shadow-xs hover:border-black/20 dark:hover:border-white/15 hover:shadow-sm"
      }`}
    >
      <div>
        {/* Top Tag & Priority */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-zinc-600 dark:text-[#8a8f98] bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-md border border-black/[0.06] dark:border-white/[0.06]">
              {task.project_identifier
                ? `${task.project_identifier}-${task.id}`
                : task.project_slug
                  ? `${task.project_slug}-${task.id}`
                  : `TASK-${task.id}`}
            </span>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-[#8a8f98]">
              {getPriorityIcon(task.priority || "No priority")}
              {task.priority && task.priority !== "No priority" && (
                <span className="font-medium text-zinc-800 dark:text-[#d1d2d5]">{task.priority}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-900 dark:text-text-muted dark:hover:text-white opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center h-6 w-6 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
            aria-label="Task options"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Task Title */}
        <p
          className={`text-[13.5px] font-semibold tracking-tight leading-snug line-clamp-2 my-2.5 transition-colors ${
            isDone ? "text-text-muted line-through" : "text-zinc-900 dark:text-white/95"
          }`}
        >
          {task.title}
        </p>

        {/* Meter progress bar */}
        <div
          className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden my-2"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Task Footer: Due Date & Assignee */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.04] text-[11.5px]">
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-text-muted"
          }`}
        >
          <Clock size={12} />
          {isOverdue ? `${formattedDue} (Overdue)` : formattedDue}
        </span>

        {task.assignee_name && (
          <Avatar
            name={task.assignee_name}
            src={task.assignee_avatar}
            size="xs"
            className="shrink-0"
          />
        )}
      </div>
    </article>
  );
}

function TaskCardPreview({ task }) {
  const { isDone, progressPct, progressColor } = getTaskProgressDetails(task);
  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  const formattedDue = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No due date";

  return (
    <article className="kriri-task-card relative rounded-2xl p-3.5 flex flex-col justify-between select-none cursor-grabbing rotate-2 scale-[1.03] w-[280px] sm:w-[290px] bg-white dark:bg-[#1a1b20] border border-black/10 dark:border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.7)] pointer-events-none">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-zinc-600 dark:text-[#8a8f98] bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-md border border-black/[0.06] dark:border-white/[0.06]">
          {task.project_identifier
            ? `${task.project_identifier}-${task.id}`
            : `TASK-${task.id}`}
        </span>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-[#8a8f98]">
          {getPriorityIcon(task.priority || "No priority")}
          {task.priority && task.priority !== "No priority" && (
            <span className="font-medium text-zinc-800 dark:text-[#d1d2d5]">
              {task.priority}
            </span>
          )}
        </div>
      </div>

      <div className="text-[13.5px] font-semibold text-zinc-900 dark:text-white leading-snug my-2 line-clamp-2">
        {task.title}
      </div>

      {/* Progress Bar preserving real section status color */}
      <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden my-1">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Task Footer: Due Date & Assignee */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.04] text-[11.5px]">
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            isOverdue
              ? "text-rose-600 dark:text-rose-400 font-semibold"
              : "text-text-muted"
          }`}
        >
          <Clock size={12} />
          {isOverdue ? `${formattedDue} (Overdue)` : formattedDue}
        </span>

        {task.assignee_name && (
          <Avatar
            name={task.assignee_name}
            src={task.assignee_avatar}
            size="xs"
            className="shrink-0"
          />
        )}
      </div>
    </article>
  );
}

function KanbanColumn({
  col,
  colIndex,
  tasks,
  selectedTaskId,
  highlightedTaskId,
  onTaskClick,
  onCreateTask,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <section
      ref={setNodeRef}
      id={`kanban-column-${col.id}`}
      style={{ "--col-stagger": colIndex }}
      className={`kriri-kanban-col flex flex-col h-full max-h-full min-h-0 w-[84vw] sm:w-[300px] md:flex-1 md:min-w-[260px] md:max-w-[360px] shrink-0 md:shrink rounded-[20px] p-3.5 snap-center shadow-xs overflow-hidden transition-all duration-200 ${
        isOver
          ? "bg-emerald-500/[0.05] dark:bg-emerald-500/[0.07] border-2 border-emerald-500/70 dark:border-emerald-400/60 ring-4 ring-emerald-500/10 dark:ring-emerald-400/15"
          : "bg-[#fbfbfb] dark:bg-[#121316] border border-black/[0.08] dark:border-white/[0.07]"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 pb-2.5 mb-2 border-b border-black/[0.06] dark:border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: col.dotColor }}
            aria-hidden="true"
          />
          <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-white tracking-tight">
            {col.label}
          </h2>
          <span className="text-[11.5px] font-semibold text-zinc-600 dark:text-[#8a8f98] bg-black/[0.05] dark:bg-white/[0.05] px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          onClick={() => onCreateTask(col.id)}
          aria-label={`Add task to ${col.label}`}
        >
          <Plus size={13} strokeWidth={2.4} />
        </button>
      </div>

      {/* Droppable Task List */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden gap-2.5 p-1 pr-1.5 pb-6 sm:pb-1 rounded-xl custom-scrollbar">
        <SortableContext
          id={col.id}
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, taskIdx) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={taskIdx}
              isSelected={String(selectedTaskId) === String(task.id)}
              isHighlighted={String(highlightedTaskId) === String(task.id)}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-xl min-h-[140px] text-[12px] font-medium text-zinc-400 dark:text-text-muted">
            Drop a task here
          </div>
        )}
      </div>
    </section>
  );
}

export default function Kanban() {
  // Zero-latency instant hydration from in-memory and local cache
  const [tasks, setTasks] = useState(() => {
    const fromApiCache = api.getCached("/tasks");
    if (Array.isArray(fromApiCache) && fromApiCache.length > 0) return fromApiCache;
    try {
      const cached = localStorage.getItem("kriri:cache:board_tasks");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(tasks.length === 0);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState("Todo");
  const [activeFilter, setActiveFilter] = useState("all");

  const outletCtx = useOutletContext();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { organization } = useOrganization();
  const socket = useSocket();
  const { effectiveTheme } = useTheme();

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "mine", label: "My tasks", shortLabel: "Mine" },
    { value: "high", label: "High priority", shortLabel: "High" },
    { value: "week", label: "Due this week", shortLabel: "This week" },
  ];

  useEffect(() => {
    const taskIdParam = searchParams.get("task") || location.state?.taskId;
    if (taskIdParam) {
      const parsedId = Number(taskIdParam) || taskIdParam;
      setHighlightedTaskId(parsedId);
      if (searchParams.get("modal") === "true" || location.state?.openModal) {
        setSelectedTaskId(parsedId);
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
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        const updated = [newTask, ...prev];
        try {
          localStorage.setItem(
            "kriri:cache:board_tasks",
            JSON.stringify(updated),
          );
        } catch {}
        return updated;
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        );
        try {
          localStorage.setItem(
            "kriri:cache:board_tasks",
            JSON.stringify(updated),
          );
        } catch {}
        return updated;
      });
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        try {
          localStorage.setItem(
            "kriri:cache:board_tasks",
            JSON.stringify(updated),
          );
        } catch {}
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
  }, [socket]);

  // Fetch tasks with background revalidation
  useEffect(() => {
    if (!user) return;
    if (tasks.length === 0) setLoading(true);

    api
      .get("/tasks")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.tasks || [];
        setTasks(list);
        try {
          localStorage.setItem(
            "kriri:cache:board_tasks",
            JSON.stringify(list),
          );
        } catch {}
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, organization?.id]);

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

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    // Check if dragging over a column directly or another task card
    const isOverAColumn = COLUMNS.some((c) => c.id === overId);
    const overTaskData = tasks.find((t) => t.id === overId);

    const targetStatus = isOverAColumn ? overId : overTaskData?.status;
    if (!targetStatus || activeTaskData.status === targetStatus) return;

    // Fluid real-time column shift: update local state so cards slide out of the way smoothly
    setTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      const updated = [...prev];
      let newIndex = overTaskData
        ? updated.findIndex((t) => t.id === overId)
        : updated.length - 1;

      if (newIndex < 0) newIndex = updated.length - 1;

      updated[activeIndex] = {
        ...updated[activeIndex],
        status: targetStatus,
      };

      return arrayMove(updated, activeIndex, newIndex);
    });
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
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return prev;
        const reordered = arrayMove(prev, activeIndex, overIndex);
        try {
          localStorage.setItem("kriri:cache:board_tasks", JSON.stringify(reordered));
        } catch {}
        return reordered;
      });
    }

    // Persist final status to backend and cache
    if (activeTaskData.status !== targetStatus) {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus } : t,
        );
        try {
          localStorage.setItem("kriri:cache:board_tasks", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      api.put(`/tasks/${activeId}`, { status: targetStatus }).catch(console.error);
    } else {
      api.put(`/tasks/${activeId}`, { status: activeTaskData.status }).catch(console.error);
    }
  };

  // Filter tasks based on activeFilter
  const filteredTasks = useMemo(() => {
    if (activeFilter === "mine") {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const userName = user?.fullName;
      return tasks.filter(
        (t) =>
          (t.assignee_email && t.assignee_email === userEmail) ||
          (t.assignee_name && t.assignee_name === userName) ||
          t.assignee_id === user?.id,
      );
    }
    if (activeFilter === "high") {
      return tasks.filter(
        (t) => t.priority === "High" || t.priority === "Urgent",
      );
    }
    if (activeFilter === "week") {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return tasks.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d <= nextWeek;
      });
    }
    return tasks;
  }, [tasks, activeFilter, user]);

  const renderColumn = (col, colIndex) => {
    const columnTasks = filteredTasks.filter((t) => t.status === col.id);

    return (
      <KanbanColumn
        key={col.id}
        col={col}
        colIndex={colIndex}
        tasks={columnTasks}
        selectedTaskId={selectedTaskId}
        highlightedTaskId={highlightedTaskId}
        onTaskClick={(id) => {
          setSelectedTaskId(id);
          setHighlightedTaskId(id);
        }}
        onCreateTask={(status) => {
          setCreateModalStatus(status);
          setIsCreateModalOpen(true);
        }}
      />
    );
  };

  if (loading && tasks.length === 0) {
    return <PageLoading label="Board" />;
  }

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden animate-in fade-in duration-500">
      {/* Top Header Row matching Kriri Board Header */}
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
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
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

      {/* Empty State vs Kanban Board */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
            <Abacus
              theme={effectiveTheme}
              intensity={0.7}
              className="w-full h-full text-zinc-400 dark:text-[#8a8f98] opacity-80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
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
          {/* Toolbar: Fluid Filter Switcher & Tasks Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3.5 shrink-0">
            <LayoutGroup id="kanbanFilterGroup">
              <div className="w-full sm:w-fit grid grid-cols-4 sm:flex items-center p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm relative">
                {filterOptions.map((opt) => {
                  const isActive = activeFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActiveFilter(opt.value)}
                      className={`relative text-[11px] sm:text-[12px] px-1 sm:px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center justify-center text-center select-none ${
                        isActive
                          ? "text-zinc-900 dark:text-white font-semibold"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="kanbanFilterActivePill"
                          className="absolute inset-0 bg-white dark:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-full shadow-xs pointer-events-none"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                          }}
                        />
                      )}
                      <span className="relative z-10 hidden sm:inline whitespace-nowrap">{opt.label}</span>
                      <span className="relative z-10 sm:hidden truncate">{opt.shortLabel || opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            <div className="flex items-center justify-between px-0.5 text-[12px] sm:text-[12.5px] font-medium text-text-muted">
              <p>
                <b className="text-zinc-900 dark:text-white font-semibold">{filteredTasks.length}</b>{" "}
                {filteredTasks.length === 1 ? "task" : "tasks"} shown
              </p>
            </div>
          </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-3.5 sm:gap-4 overflow-x-auto overflow-y-hidden pb-3 sm:pb-1 min-h-0 min-w-0 snap-x snap-mandatory sm:snap-none custom-scrollbar">
            {COLUMNS.map((col, index) => renderColumn(col, index))}
          </div>

          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeTask ? <TaskCardPreview task={activeTask} /> : null}
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
          setTasks((prev) => {
            const updated = prev.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
            );
            try {
              localStorage.setItem(
                "kriri:cache:board_tasks",
                JSON.stringify(updated),
              );
            } catch {}
            return updated;
          });
        }}
      />
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStatus={createModalStatus}
        onTaskCreated={(newTask) => {
          setTasks((prev) => {
            if (prev.some((t) => t.id === newTask.id)) return prev;
            const updated = [newTask, ...prev];
            try {
              localStorage.setItem(
                "kriri:cache:board_tasks",
                JSON.stringify(updated),
              );
            } catch {}
            return updated;
          });
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
