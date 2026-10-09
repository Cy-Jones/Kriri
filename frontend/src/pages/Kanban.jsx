import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreHorizontal,
  CheckSquare,
  Compass,
  FileText,
} from "lucide-react";
import { api } from "../lib/api";
import TaskDetailsModal from "../components/TaskDetailsModal";
import CreateTaskModal from "../components/CreateTaskModal";
import { Cabinet as Abacus } from "@lucasmarkes/hairline/react";
import { Button } from "../registry/components/button/button";
import { Badge } from "../registry/components/badge/badge";
import { AvatarGroup } from "../registry/components/avatar-group/avatar-group";
import { useUser } from "@clerk/clerk-react";
import { useSocket } from "../contexts/SocketContext";

const COLUMNS = ["Todo", "In Progress", "In Review", "Done"];

// We keep SortableTaskItem here

function SortableTaskItem({ task, onClick }) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group rounded-xl p-4 flex flex-col gap-3 transition-all ${
        isDragging
          ? "opacity-40 border-2 border-dashed border-white/20 bg-transparent scale-[1.02] shadow-2xl"
          : "bg-[#18191c] hover:bg-[#1c1d21] border border-white/[0.05] shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="font-mono text-[11px] text-[#8a8f98] font-medium tracking-wider">
          {task.project_slug ? `${task.project_slug}-${task.id}` : task.id}
        </div>
        <button className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-6 w-6 rounded-md hover:bg-white/[0.04]">
          <MoreHorizontal size={14} />
        </button>
      </div>
      <div className="text-[13px] font-medium text-[#e8e8e8] leading-relaxed">
        {task.title}
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge
          size="sm"
          tone={
            task.priority === "High"
              ? "danger"
              : task.priority === "Medium"
                ? "warning"
                : "neutral"
          }
        >
          {task.priority}
        </Badge>
        {task.assignee_name && (
          <AvatarGroup
            members={[{ name: task.assignee_name }]}
            size="sm"
            max={1}
          />
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ id, items, children }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto">
      <SortableContext
        id={id}
        items={items}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-[150px] pb-4">{children}</div>
      </SortableContext>
    </div>
  );
}

export default function Kanban() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState("Todo");
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        ),
      );
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
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

  useEffect(() => {
    api
      .get("/tasks")
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
    if (COLUMNS.includes(overId)) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeId ? { ...task, status: overId } : task,
        ),
      );
      api.put(`/tasks/${activeId}`, { status: overId }).catch(console.error);
      setActiveTask(null);
      return;
    }

    // Check if dropping onto another item
    const activeTaskData = tasks.find((t) => t.id === activeId);
    const overTaskData = tasks.find((t) => t.id === overId);

    if (activeTaskData && overTaskData) {
      if (activeTaskData.status !== overTaskData.status) {
        // Moved to a different column
        setTasks((prev) => {
          const newTasks = [...prev];
          const activeIndex = newTasks.findIndex((t) => t.id === activeId);
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            status: overTaskData.status,
          };
          return newTasks;
        });
        api
          .put(`/tasks/${activeId}`, { status: overTaskData.status })
          .catch(console.error);
      } else {
        // Reordering within same column
        setTasks((prev) => {
          const activeIndex = prev.findIndex((t) => t.id === activeId);
          const overIndex = prev.findIndex((t) => t.id === overId);
          return arrayMove(prev, activeIndex, overIndex);
        });
      }
    }
    setActiveTask(null);
  };

  const renderColumn = (status) => {
    const columnTasks = tasks.filter((t) => t.status === status);

    return (
      <div
        key={status}
        className="flex flex-col flex-1 min-w-[220px] max-w-[350px] rounded-2xl bg-white/[0.01] border border-white/[0.02] p-2"
      >
        <div className="flex items-center justify-between p-2 mb-2">
          <div className="flex items-center gap-2">
            {status === "Done" ? (
              <CheckSquare size={14} className="text-success" />
            ) : status === "In Progress" ? (
              <Compass size={14} className="text-warning fill-warning/20" />
            ) : status === "In Review" ? (
              <FileText size={14} className="text-info fill-info/20" />
            ) : (
              <Compass size={14} className="text-[#8a8f98]" />
            )}
            <h3 className="text-[13px] font-medium text-[#e8e8e8]">{status}</h3>
            <span className="text-[#8a8f98] text-xs ml-1 font-medium">
              {columnTasks.length}
            </span>
          </div>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-md text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/[0.04] transition-colors"
            onClick={() => {
              setCreateModalStatus(status);
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        <DroppableColumn id={status} items={columnTasks.map((t) => t.id)}>
          {columnTasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onClick={() => setSelectedTaskId(task.id)}
            />
          ))}
        </DroppableColumn>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col h-full min-h-0 min-w-0 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Board
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCreateModalStatus("Todo");
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
          >
            <Plus size={14} /> New Issue
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-80 h-80 flex items-center justify-center relative overflow-visible">
            <Abacus
              theme="dark"
              intensity={0.7}
              className="w-full h-full text-[#8a8f98]"
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
            <button
              className="h-8 px-4 bg-white text-black rounded-md font-medium text-[13px] hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
              onClick={() => {
                setCreateModalStatus("Todo");
                setIsCreateModalOpen(true);
              }}
            >
              <Plus size={14} />
              New Issue
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-4 min-h-0 min-w-0">
            {COLUMNS.map((status) => renderColumn(status))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-[#1e1f24] border-accent shadow-[0_8px_30px_rgba(255,255,255,0.1)] rounded-xl p-3 flex flex-col gap-3 cursor-grabbing rotate-3">
                <div className="font-mono text-[11px] text-[#8a8f98]">
                  {activeTask.project_slug
                    ? `${activeTask.project_slug}-${activeTask.id}`
                    : activeTask.id}
                </div>
                <div className="text-[13px] font-medium text-[#e8e8e8] leading-tight">
                  {activeTask.title}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        onTaskUpdated={(updatedTask) => {
          setTasks(
            tasks.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
            ),
          );
        }}
      />
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStatus={createModalStatus}
        onTaskCreated={(newTask) => {
          // Handled by socket, but we can do it optimistically too:
          if (!tasks.some((t) => t.id === newTask.id)) {
            setTasks([newTask, ...tasks]);
          }
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
