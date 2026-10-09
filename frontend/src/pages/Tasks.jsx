import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, AlertCircle, Compass, CheckSquare, FileText } from 'lucide-react';
import { api } from '../lib/api';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { Checklist } from '../components/figures/Checklist';
import { useUser } from '@clerk/clerk-react';
import { useSocket } from '../contexts/SocketContext';
import { useListShortcuts } from '../hooks/useListShortcuts';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);
  const { user } = useUser();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some(t => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    socket.on('TASK_CREATED', handleTaskCreated);
    socket.on('TASK_UPDATED', handleTaskUpdated);
    socket.on('TASK_DELETED', handleTaskDeleted);

    return () => {
      socket.off('TASK_CREATED', handleTaskCreated);
      socket.off('TASK_UPDATED', handleTaskUpdated);
      socket.off('TASK_DELETED', handleTaskDeleted);
    };
  }, [socket]);

  useEffect(() => {
    api.get('/tasks')
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredTasks = tasks.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.assignee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useListShortcuts({
    items: filteredTasks,
    activeIndex,
    setActiveIndex,
    onOpenItem: (task) => setSelectedTaskId(task.id),
    onCreateItem: () => setIsCreateModalOpen(true),
  });

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-white">All Issues</h1>
          <div className="px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary text-[11px] font-medium border border-border">
            {tasks.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
             <input
               type="text"
               placeholder="Filter tasks..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-[200px] bg-surface-elevated border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors"
             />
           </div>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
           >
             <Plus size={14} /> New Issue
           </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
             <Checklist theme="dark" intensity={0.7} className="w-full h-full text-[#8a8f98] opacity-80" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">Create your first issue</h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Issues are used to track tasks, bugs, and feature requests. Get started by organizing your work.
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-4 bg-white text-black rounded-md font-medium text-[13px] hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={14} />
              New Issue
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-hidden flex flex-col shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[80px_minmax(300px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.05] text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
            <div>ID</div>
            <div>Title</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Assignee</div>
            <div className="text-right">Due</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {filteredTasks.map((task, idx) => (
              <div 
                key={task.id} 
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setActiveIndex(idx);
                }}
                className={`grid grid-cols-[80px_minmax(300px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors items-center text-[13px] group cursor-pointer ${
                  activeIndex === idx ? 'bg-white/[0.08] ring-1 ring-inset ring-white/10' : ''
                }`}
              >
              <div className="font-mono text-[11px] text-text-muted">{task.project_slug ? `${task.project_slug}-${task.id}` : task.id}</div>
              <div className="text-text-primary font-medium truncate group-hover:text-accent transition-colors">
                {task.title}
              </div>
              <div className="flex items-center gap-2">
                {task.status === 'Done' ? <CheckSquare size={14} className="text-success" /> : 
                 task.status === 'In Progress' ? <Compass size={14} className="text-warning fill-warning/20" /> : 
                 task.status === 'In Review' ? <FileText size={14} className="text-info fill-info/20" /> : 
                 <Compass size={14} className="text-text-muted" />}
                <span className={task.status === 'Done' ? 'text-text-secondary' : 'text-text-primary'}>{task.status}</span>
              </div>
              <div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  task.priority === 'High' ? 'bg-danger/10 text-danger border-danger/20' :
                  task.priority === 'Medium' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-surface-elevated text-text-secondary border-border'
                }`}>
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary truncate">
                {task.assignee_name && (
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[9px] font-bold">
                    {task.assignee_name.charAt(0)}
                  </div>
                )}
                <span className="truncate">{task.assignee_name || 'Unassigned'}</span>
              </div>
              <div className="text-right text-text-muted text-xs">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      
      <TaskDetailsModal 
        isOpen={!!selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
        taskId={selectedTaskId}
        onTaskUpdated={(updatedTask) => {
          setTasks(tasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
        }}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={(newTask) => {
          setTasks([newTask, ...tasks]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
