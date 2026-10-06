import { useState } from 'react';
import { Folder, CheckSquare, Clock, AlertCircle, Plus, MoreHorizontal, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import CreateProjectModal from '../components/CreateProjectModal';

// Arc Components
import { Button } from '../registry/components/button/button';
import { Badge } from '../registry/components/badge/badge';
import { Sparkline } from '../registry/components/sparkline/sparkline';
import { Progress } from '../registry/components/progress/progress';
import { AnimatedCounter } from '../registry/components/animated-counter/animated-counter';

export default function Dashboard() {
  const { user } = useUser();
  const userName = user?.fullName || 'User';
  // Check if admin by comparing primary email for demo toggles
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'smartjones07@gmail.com';
  
  const [hasData, setHasData] = useState(isAdmin);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!hasData) {
    return (
      <div className="flex flex-col h-full relative">
        {/* State Toggle for demo */}
        {isAdmin && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button 
              variant="ghost"
              onClick={() => setHasData(true)}
              className="text-[11px] h-7 px-2"
            >
              Show Populated State
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-text-muted shadow-sm relative overflow-hidden">
             {/* Subtle internal glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
             <Folder size={28} />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">Create your first project</h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Projects group your tasks, milestones, and team members together. Get started by creating a new workspace.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 text-[13px] flex items-center gap-2"
            >
              <Plus size={14} />
              New Project
            </Button>
            <Button 
              variant="secondary"
              className="h-8 text-[13px]"
            >
              Invite Team
            </Button>
          </div>
        </div>
        <CreateProjectModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onProjectCreated={(newProject) => navigate('/projects')} 
        />
      </div>
    );
  }

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col h-full relative">
      {/* State Toggle for demo */}
      {isAdmin && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            variant="ghost"
            onClick={() => setHasData(false)}
            className="text-[11px] h-7 px-2"
          >
            Show Empty State
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pb-20 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-medium text-white">{dateString}</span>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Good morning, {userName || 'User'}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 text-[13px] flex items-center gap-2"
            >
              <Plus size={14} />
              New Project
            </Button>
            <Button 
              variant="secondary"
              className="h-8 text-[13px]"
            >
              Invite Team
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tasks Due Today', value: '5', change: '+2 from yesterday', data: [2, 3, 5, 4, 6, 4, 5], tone: 'accent' },
            { label: 'Overdue', value: '2', change: 'Needs attention', data: [1, 1, 2, 3, 2, 2, 2], tone: 'danger' },
            { label: 'In Progress', value: '12', change: 'Steady', data: [10, 11, 15, 14, 12, 11, 12], tone: 'warning' },
            { label: 'Completed (7d)', value: '34', change: '+12% this week', data: [15, 20, 25, 28, 30, 32, 34], tone: 'success' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
              <Sparkline
                data={stat.data}
                label={stat.label}
                value={stat.value}
                change={stat.change}
                tone={stat.tone}
                area={true}
                interactive={true}
              />
            </div>
          ))}
        </div>

        {/* Active Projects */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-medium text-text-muted flex items-center gap-2 uppercase tracking-wider">
            Active Projects
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Website Redesign', key: 'WEB', progress: 68, tone: 'accent' },
              { name: 'Mobile App V2', key: 'MOB', progress: 32, tone: 'warning' },
              { name: 'Marketing Assets', key: 'MKT', progress: 85, tone: 'success' },
            ].map((proj, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-[14px] text-white group-hover:text-white transition-colors">{proj.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted">{proj.key}</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[12px] font-medium">
                    <span className="text-text-muted">Progress</span>
                    <span className="text-white">
                      <AnimatedCounter value={proj.progress} />%
                    </span>
                  </div>
                  <Progress value={proj.progress} tone={proj.tone} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Priorities (Tasks) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h3 className="text-[13px] font-medium text-text-muted flex items-center gap-2 uppercase tracking-wider">
               My Priorities
             </h3>
             <Button variant="ghost" className="text-[12px] h-7 px-3">
               View all issues &rarr;
             </Button>
          </div>
          
          <div className="flex flex-col border border-white/[0.06] rounded-xl bg-white/[0.01] overflow-hidden">
            {[
              { id: 'WEB-142', title: 'Update hero section copy', status: 'In Progress', priority: 'High', tone: 'warning' },
              { id: 'WEB-145', title: 'Fix navigation z-index bug on mobile', status: 'Todo', priority: 'Urgent', tone: 'danger' },
              { id: 'MOB-89', title: 'Implement biometric auth', status: 'Todo', priority: 'Medium', tone: 'accent' },
              { id: 'MKT-12', title: 'Draft Q3 launch blog post', status: 'Todo', priority: 'Low', tone: 'neutral' },
            ].map((task, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3 px-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="outline" tone={task.status === 'In Progress' ? 'warning' : 'neutral'} className="w-24 justify-center">
                    {task.status}
                  </Badge>
                  
                  <span className="text-[12px] font-mono text-text-muted w-16">{task.id}</span>
                  <span className="text-[13.5px] text-white font-medium group-hover:text-white transition-colors">{task.title}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-text-muted hover:text-white transition-colors p-1"><MoreHorizontal size={14}/></button>
                  </div>
                  <Badge tone={task.tone} variant="soft">
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onProjectCreated={(newProject) => navigate('/projects')} 
      />
    </div>
  );
}
