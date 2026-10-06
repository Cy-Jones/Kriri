import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, AlertCircle, Compass, CheckSquare, FileText } from 'lucide-react';
import { api } from '../lib/api';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { IssuesEmptyIcon } from '../components/EmptyStateIcons';
import { useUser } from '@clerk/clerk-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'smartjones07@gmail.com';
  const [showDemo, setShowDemo] = useState(isAdmin);

  const displayTasks = showDemo ? [
    { id: 'TSK-001', title: 'Implement dark mode', status: 'In Progress', priority: 'High', assignee_name: 'Alex', due_date: new Date().toISOString() },
    { id: 'TSK-002', title: 'Fix navigation bug', status: 'Todo', priority: 'Medium', assignee_name: 'Sarah', due_date: new Date(Date.now() + 86400000).toISOString() },
    { id: 'TSK-003', title: 'Update dependencies', status: 'Done', priority: 'Low', assignee_name: 'Mike', due_date: new Date(Date.now() - 86400000).toISOString() },
  ] : tasks;

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
           {isAdmin && (
             <button 
               onClick={() => setShowDemo(!showDemo)}
               className="text-[11px] px-2 py-1 border border-white/10 rounded-md text-text-muted hover:text-white transition-colors"
             >
               {showDemo ? "Show Empty State" : "Show Populated State"}
             </button>
           )}
           <button className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors text-xs font-medium px-2 py-1">
             <Search size={14} /> Filter
           </button>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
           >
             <Plus size={14} /> New Issue
           </button>
        </div>
      </div>

      {displayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-[#8a8f98] shadow-sm relative overflow-hidden">
             {/* Subtle internal glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
             <IssuesEmptyIcon className="w-16 h-16" />
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
            {displayTasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTaskId(task.id)}
                className="grid grid-cols-[80px_minmax(300px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors items-center text-[13px] group cursor-pointer"
              >
              <div className="font-mono text-[11px] text-text-muted">{task.id}</div>
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
