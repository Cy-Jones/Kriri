import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, CheckSquare, Compass, FileText } from 'lucide-react';
import { api } from '../lib/api';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { BoardEmptyIcon } from '../components/EmptyStateIcons';
import { Button } from '../registry/components/button/button';
import { Badge } from '../registry/components/badge/badge';
import { AvatarGroup } from '../registry/components/avatar-group/avatar-group';
import { useUser } from '@clerk/clerk-react';

const COLUMNS = ['Todo', 'In Progress', 'In Review', 'Done'];

// We keep SortableTaskItem here

function SortableTaskItem({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
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
          ? 'opacity-40 border-2 border-dashed border-white/20 bg-transparent scale-[1.02] shadow-2xl' 
          : 'bg-[#18191c] hover:bg-[#1c1d21] border border-white/[0.05] shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start justify-between">
         <div className="font-mono text-[11px] text-[#8a8f98] font-medium tracking-wider">{task.id}</div>
         <button className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-6 w-6 rounded-md hover:bg-white/[0.04]">
           <MoreHorizontal size={14} />
         </button>
      </div>
      <div className="text-[13px] font-medium text-[#e8e8e8] leading-relaxed">{task.title}</div>
      <div className="flex items-center justify-between mt-2">
        <Badge 
          size="sm"
          tone={
            task.priority === 'High' ? 'danger' :
            task.priority === 'Medium' ? 'warning' :
            'neutral'
          }
        >
          {task.priority}
        </Badge>
        {task.assignee_name && (
          <AvatarGroup members={[{ name: task.assignee_name }]} size="sm" max={1} />
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
          <div className="flex flex-col gap-2 min-h-[150px] pb-4">
            {children}
          </div>
       </SortableContext>
    </div>
  );
}

export default function Kanban() {
  const [tasks, setTasks] = useState([]);
  const [originalTasks, setOriginalTasks] = useState([]);
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'smartjones07@gmail.com';
  const [showDemo, setShowDemo] = useState(isAdmin);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const handleToggleDemo = () => {
    if (showDemo) {
      setShowDemo(false);
      setTasks(originalTasks);
    } else {
      setShowDemo(true);
      setTasks([
        { id: 'TSK-001', title: 'Implement dark mode', status: 'In Progress', priority: 'High', assignee_name: 'Alex' },
        { id: 'TSK-002', title: 'Fix navigation bug', status: 'Todo', priority: 'Medium', assignee_name: 'Sarah' },
        { id: 'TSK-003', title: 'Update dependencies', status: 'Done', priority: 'Low', assignee_name: 'Mike' },
      ]);
    }
  };

  useEffect(() => {
    api.get('/tasks')
      .then(data => {
        setTasks(data);
        setOriginalTasks(data);
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
    })
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
        prev.map(task => 
          task.id === activeId ? { ...task, status: overId } : task
        )
      );
      api.put(`/tasks/${activeId}`, { status: overId }).catch(console.error);
      setActiveTask(null);
      return;
    }

    // Check if dropping onto another item
    const activeTaskData = tasks.find(t => t.id === activeId);
    const overTaskData = tasks.find(t => t.id === overId);

    if (activeTaskData && overTaskData) {
      if (activeTaskData.status !== overTaskData.status) {
         // Moved to a different column
         setTasks((prev) => {
            const newTasks = [...prev];
            const activeIndex = newTasks.findIndex(t => t.id === activeId);
            newTasks[activeIndex] = { ...newTasks[activeIndex], status: overTaskData.status };
            return newTasks;
         });
         api.put(`/tasks/${activeId}`, { status: overTaskData.status }).catch(console.error);
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
    const columnTasks = tasks.filter(t => t.status === status);
    
    return (
      <div key={status} className="flex flex-col flex-1 min-w-[220px] max-w-[350px] rounded-2xl bg-white/[0.01] border border-white/[0.02] p-2">
        <div className="flex items-center justify-between p-2 mb-2">
          <div className="flex items-center gap-2">
            {status === 'Done' ? <CheckSquare size={14} className="text-success" /> : 
             status === 'In Progress' ? <Compass size={14} className="text-warning fill-warning/20" /> : 
             status === 'In Review' ? <FileText size={14} className="text-info fill-info/20" /> : 
             <Compass size={14} className="text-[#8a8f98]" />}
            <h3 className="text-[13px] font-medium text-[#e8e8e8]">{status}</h3>
            <span className="text-[#8a8f98] text-xs ml-1 font-medium">{columnTasks.length}</span>
          </div>
          <Button variant="ghost" className="h-7 w-7 p-0 text-[#8a8f98] hover:text-[#e8e8e8]">
            <Plus size={14} />
          </Button>
        </div>

        <DroppableColumn id={status} items={columnTasks.map(t => t.id)}>
            {columnTasks.map(task => (
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
          <h1 className="text-xl font-semibold tracking-tight text-white">Board</h1>
        </div>
        <div className="flex items-center gap-3">
           {isAdmin && (
             <Button 
               variant="ghost"
               size="sm"
               onClick={handleToggleDemo}
               className="text-[11px] text-text-muted"
             >
               {showDemo ? "Show Empty State" : "Show Populated State"}
             </Button>
           )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-[#8a8f98] shadow-sm relative overflow-hidden">
             {/* Subtle internal glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
             <BoardEmptyIcon className="w-16 h-16" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">Create your first board item</h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Boards give you a visual overview of your tasks. Create your first issue to see it organized by status.
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <Button 
              className="shadow-sm flex items-center gap-2"
            >
              <Plus size={14} />
              New Issue
            </Button>
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
            {COLUMNS.map(status => renderColumn(status))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-[#1e1f24] border-accent shadow-[0_8px_30px_rgba(255,255,255,0.1)] rounded-xl p-3 flex flex-col gap-3 cursor-grabbing rotate-3">
                 <div className="font-mono text-[11px] text-[#8a8f98]">{activeTask.id}</div>
                 <div className="text-[13px] font-medium text-[#e8e8e8] leading-tight">{activeTask.title}</div>
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
          setTasks(tasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
        }}
      />
    </div>
  );
}
