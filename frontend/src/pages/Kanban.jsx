import { useState, useEffect, useMemo } from "react";
import {
  useOutletContext,
  useLocation,
  useSearchParams,
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

  const isDone = task.status === "Done";
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

  const progressPct =
    task.status === "Done"
      ? 100
      : task.status === "In Review"
        ? 85
        : task.status === "In Progress"
          ? 55
          : 15;

  return (
    <article
      ref={setNodeRef}
      id={`task-card-${task.id}`}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`fernly-task-card relative rounded-2xl p-3.5 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? "opacity-35 border-2 border-dashed border-emerald-500/40 bg-[#16171a] scale-[1.02] shadow-2xl"
          : isHighlighted
            ? "bg-[#1f2127] border-white/[0.22] shadow-[0_12px_32px_rgba(0,0,0,0.6)] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-emerald-400"
            : isSelected
              ? "bg-[#1c1d22] border-white/15 shadow-md"
              : "bg-[#16171a] border border-white/[0.08] shadow-xs"
      }`}
    >
      <div>
        {/* Top Tag & Priority */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[#8a8f98] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
              {task.project_identifier
                ? `${task.project_identifier}-${task.id}`
                : task.project_slug
                  ? `${task.project_slug}-${task.id}`
                  : `TASK-${task.id}`}
            </span>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8a8f98]">
              {getPriorityIcon(task.priority || "No priority")}
              {task.priority && task.priority !== "No priority" && (
                <span className="font-medium text-[#d1d2d5]">{task.priority}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="text-text-muted hover:text-white opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center h-6 w-6 rounded-md hover:bg-white/[0.06] cursor-pointer"
            aria-label="Task options"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Task Title */}
        <p
          className={`text-[13.5px] font-semibold tracking-tight leading-snug line-clamp-2 my-2.5 transition-colors ${
            isDone ? "text-text-muted line-through" : "text-white/95"
          }`}
        >
          {task.title}
        </p>

        {/* Meter progress bar */}
        <div
          className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden my-2"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDone
                ? "bg-emerald-500"
                : task.status === "In Progress"
                  ? "bg-amber-400"
                  : task.status === "In Review"
                    ? "bg-sky-400"
                    : "bg-white/20"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Task Footer: Due Date & Assignee */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04] text-[11.5px]">
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            isOverdue ? "text-rose-400 font-semibold" : "text-text-muted"
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

function DroppableColumn({ id, items, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden gap-2.5 p-1 pr-1.5 rounded-xl transition-colors duration-200 custom-scrollbar ${
        isOver ? "bg-emerald-500/[0.04]" : ""
      }`}
    >
      <SortableContext
        id={id}
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center border border-dashed border-white/[0.08] rounded-xl min-h-[140px] text-[12px] font-medium text-text-muted">
          Drop a task here
        </div>
      )}
    </div>
  );
}

export default function Kanban() {
  // Zero-latency instant hydration from local cache
  const [tasks, setTasks] = useState(() => {
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

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "mine", label: "My tasks" },
    { value: "high", label: "High priority" },
    { value: "week", label: "Due this week" },
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

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(tasks.find((t) => t.id === active.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Check if dropping into a column directly
    const columnMatch = COLUMNS.find((c) => c.id === overId);
    if (columnMatch) {
      setTasks((prev) => {
        const updated = prev.map((task) =>
          task.id === activeId ? { ...task, status: overId } : task,
        );
        try {
          localStorage.setItem(
            "kriri:cache:board_tasks",
            JSON.stringify(updated),
          );
        } catch {}
        return updated;
      });
      api.put(`/tasks/${activeId}`, { status: overId }).catch(console.error);
      setActiveTask(null);
      return;
    }

    // Check if dropping onto another item
    const activeTaskData = tasks.find((t) => t.id === activeId);
    const overTaskData = tasks.find((t) => t.id === overId);

    if (activeTaskData && overTaskData) {
      if (activeTaskData.status !== overTaskData.status) {
        setTasks((prev) => {
          const newTasks = [...prev];
          const activeIndex = newTasks.findIndex((t) => t.id === activeId);
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: overTaskData.status,
          };
          try {
            localStorage.setItem(
              "kriri:cache:board_tasks",
              JSON.stringify(newTasks),
            );
          } catch {}
          return newTasks;
        });
        api
          .put(`/tasks/${activeId}`, { status: overTaskData.status })
          .catch(console.error);
      } else {
        setTasks((prev) => {
          const activeIndex = prev.findIndex((t) => t.id === activeId);
          const overIndex = prev.findIndex((t) => t.id === overId);
          const reordered = arrayMove(prev, activeIndex, overIndex);
          try {
            localStorage.setItem(
              "kriri:cache:board_tasks",
              JSON.stringify(reordered),
            );
          } catch {}
          return reordered;
        });
      }
    }
    setActiveTask(null);
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
      <section
        key={col.id}
        id={`kanban-column-${col.id}`}
        style={{ "--col-stagger": colIndex }}
        className="fernly-kanban-col flex flex-col h-full max-h-full min-h-0 w-[84vw] sm:w-[300px] md:flex-1 md:min-w-[260px] md:max-w-[360px] shrink-0 md:shrink rounded-[20px] bg-[#121316] border border-white/[0.07] p-3.5 snap-center shadow-xs overflow-hidden"
      >
        {/* Column Header */}
        <div className="flex items-center justify-between px-1.5 pb-2.5 mb-2 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: col.dotColor }}
              aria-hidden="true"
            />
            <h2 className="text-[14px] font-semibold text-white tracking-tight">
              {col.label}
            </h2>
            <span className="text-[11.5px] font-semibold text-[#8a8f98] bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">
              {columnTasks.length}
            </span>
          </div>

          <button
            type="button"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#8a8f98] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            onClick={() => {
              setCreateModalStatus(col.id);
              setIsCreateModalOpen(true);
            }}
            aria-label={`Add task to ${col.label}`}
          >
            <Plus size={13} strokeWidth={2.4} />
          </button>
        </div>

        {/* Droppable Task List */}
        <DroppableColumn id={col.id} items={columnTasks.map((t) => t.id)}>
          {columnTasks.map((task, taskIdx) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={taskIdx}
              isSelected={String(selectedTaskId) === String(task.id)}
              isHighlighted={String(highlightedTaskId) === String(task.id)}
              onClick={() => {
                setSelectedTaskId(task.id);
                setHighlightedTaskId(task.id);
              }}
            />
          ))}
        </DroppableColumn>
      </section>
    );
  };

  if (loading && tasks.length === 0) {
    return <PageLoading label="Board" />;
  }

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden animate-in fade-in duration-500">
      {/* Top Header Row matching Fernly Board Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 min-h-[38px] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={openMobileNav}
            className="md:hidden p-1.5 -ml-1 text-[#8a8f98] hover:text-white rounded-md hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <h1 className="text-base font-semibold tracking-tight text-white truncate">
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
            className="h-[28px] px-3 text-[12px] font-medium rounded-full gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.14)] hover:shadow-[0_0_28px_rgba(255,255,255,0.22)] active:scale-[0.98] transition-all"
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
              theme="dark"
              intensity={0.7}
              className="w-full h-full text-[#8a8f98] opacity-80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 shrink-0">
            <LayoutGroup id="kanbanFilterGroup">
              <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm shrink-0">
                {filterOptions.map((opt) => {
                  const isActive = activeFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActiveFilter(opt.value)}
                      className={`relative text-[11.5px] sm:text-[12px] px-3 py-1 sm:py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? "text-white"
                          : "text-[#8a8f98] hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="kanbanFilterActivePill"
                          className="absolute inset-0 bg-white/[0.12] border border-white/10 rounded-md shadow-sm"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                          }}
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            <p className="text-[12.5px] font-medium text-text-muted">
              <b className="text-white font-semibold">{filteredTasks.length}</b>{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"} shown
            </p>
          </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-3.5 sm:gap-4 overflow-x-auto overflow-y-hidden pb-1 min-h-0 min-w-0 snap-x snap-mandatory sm:snap-none custom-scrollbar">
            {COLUMNS.map((col, index) => renderColumn(col, index))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="fernly-task-card bg-[#1a1b20] border-emerald-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-2xl p-3.5 flex flex-col justify-between cursor-grabbing rotate-2 w-[280px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-[#8a8f98] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                    {activeTask.project_identifier
                      ? `${activeTask.project_identifier}-${activeTask.id}`
                      : `TASK-${activeTask.id}`}
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8a8f98]">
                    {getPriorityIcon(activeTask.priority || "No priority")}
                    {activeTask.priority && activeTask.priority !== "No priority" && (
                      <span className="font-medium text-[#d1d2d5]">{activeTask.priority}</span>
                    )}
                  </div>
                </div>
                <div className="text-[13.5px] font-semibold text-white leading-snug my-2 line-clamp-2">
                  {activeTask.title}
                </div>
                <div className="w-full h-1.5 rounded-full bg-emerald-500/30 overflow-hidden my-1">
                  <div className="h-full rounded-full bg-emerald-400 w-1/2" />
                </div>
              </div>
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
