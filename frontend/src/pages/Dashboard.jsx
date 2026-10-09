import { useState, useEffect } from 'react';
import { Folder, CheckSquare, Clock, AlertCircle, Plus, MoreHorizontal, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { Drawer, Basket } from '@lucasmarkes/hairline/react';
import CreateProjectModal from '../components/CreateProjectModal';
import { api } from '../lib/api';
import posthog from '../lib/posthog';

// Arc Components
import { Button } from '../registry/components/button/button';
import { Badge } from '../registry/components/badge/badge';
import { Sparkline } from '../registry/components/sparkline/sparkline';
import { Progress } from '../registry/components/progress/progress';
import { AnimatedCounter } from '../registry/components/animated-counter/animated-counter';

export default function Dashboard() {
  const { user } = useUser();
  const userName = user?.fullName || 'User';
  
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const canManageProjects = ['Owner', 'Admin', 'Project Manager', 'Member', 'Team Lead'].includes(currentUserRole) || !organization;

  useEffect(() => {
    const fetchRole = async () => {
      if (!organization) {
        setCurrentUserRole('Owner');
        return;
      }
      try {
        const response = await api.get(`/workspaces/${organization.id}/members`);
        const members = Array.isArray(response) ? response : response.data?.members || [];
        const currentMember = members.find(m => m.email === user?.primaryEmailAddress?.emailAddress);
        if (currentMember) setCurrentUserRole(currentMember.role);
      } catch (err) {
        console.error("Failed to fetch role", err);
      }
    };
    if (user) {
      fetchRole();
    }
  }, [organization, user]);

  useEffect(() => {
    if (!user) return; // Wait until user is loaded

    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/workspaces/current/summary');
        setSummary(res);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [organization?.id, user?.id]);

  useEffect(() => {
    posthog.capture('dashboard_viewed');
  }, []);

  if (loading) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

  const hasData = summary && summary.activeProjectCount > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
             <Drawer theme="dark" intensity={0.7} className="w-full h-full text-text-muted opacity-80" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">Create your first project</h2>
            <p className="text-[14px] text-text-muted leading-relaxed">
              Projects group your tasks, milestones, and team members together. Get started by creating a new project.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {canManageProjects && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 px-4 bg-white text-black rounded-md font-medium text-[13px] hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
              >
                <Plus size={14} />
                New Project
              </button>
            )}
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

  const hour = today.getHours();
  let greeting = 'Good evening';
  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pb-20 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-medium text-text-muted">{dateString}</span>
            <h1 className="text-3xl font-semibold text-white tracking-tight">{greeting}, {userName || 'User'}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {canManageProjects && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
              >
                <Plus size={14} /> New Project
              </button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tasks Due Today', value: summary.stats.dueToday, change: 'Today', tone: 'text-white/60' },
            { label: 'Overdue', value: summary.stats.overdue, change: 'Needs attention', tone: 'text-red-400' },
            { label: 'In Progress', value: summary.stats.inProgress, change: 'Active', tone: 'text-amber-400' },
            { label: 'Completed (7d)', value: summary.stats.completedLast7Days, change: 'This week', tone: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] transition-colors group flex flex-col gap-2">
              <span className="text-[13px] font-medium text-text-muted">{stat.label}</span>
              <div className="flex items-end justify-between mt-1">
                <div className="text-3xl font-semibold text-white">
                  <AnimatedCounter value={stat.value} />
                </div>
                <span className={`text-[12px] font-medium ${stat.tone}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Projects */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-text-muted flex items-center gap-2 uppercase tracking-wider">
              Recent Projects
            </h3>
            <Button variant="ghost" className="text-[12px] h-7 px-3" onClick={() => navigate('/projects')}>
              View all projects &rarr;
            </Button>
          </div>
          {summary.recentProjects && summary.recentProjects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summary.recentProjects.map((project) => (
                <div 
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer group flex flex-col justify-between min-h-[120px]"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">{project.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-text-muted font-mono">{project.slug}</span>
                    <Badge variant="outline" tone={project.status === 'In Progress' ? 'warning' : 'neutral'} className="text-[10px] px-1.5 py-0">
                      {project.status || 'Planned'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
               <div className="flex flex-col gap-1">
                 <span className="text-white font-medium">You have {summary.activeProjectCount} active project{summary.activeProjectCount !== 1 && 's'}</span>
                 <span className="text-text-muted text-sm">Navigate to the projects page to view their progress and milestones.</span>
               </div>
               <Button variant="outline" onClick={() => navigate('/projects')}>Go to Projects</Button>
            </div>
          )}
        </div>

        {/* My Priorities (Tasks) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h3 className="text-[13px] font-medium text-text-muted flex items-center gap-2 uppercase tracking-wider">
               My Priorities
             </h3>
             <Button variant="ghost" className="text-[12px] h-7 px-3" onClick={() => navigate('/tasks')}>
               View all issues &rarr;
             </Button>
          </div>
          
          <div className="flex flex-col border border-white/[0.06] rounded-xl bg-white/[0.01] overflow-hidden min-h-[160px]">
            {summary.myIssues.length > 0 ? summary.myIssues.map((task, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between p-3 px-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="outline" tone={task.status === 'In Progress' ? 'warning' : 'neutral'} className="w-24 justify-center truncate">
                    {task.status}
                  </Badge>
                  
                  <span className="text-[12px] font-mono text-text-muted w-16 truncate">{task.project_slug}-{task.id}</span>
                  <span className="text-[13.5px] text-white font-medium group-hover:text-white transition-colors line-clamp-1">{task.title}</span>
                </div>
                
                <div className="flex items-center gap-4 min-w-[120px] justify-end">
                  <Badge tone={
                    task.priority === 'High' ? 'danger' :
                    task.priority === 'Medium' ? 'warning' : 'neutral'
                  } variant="soft">
                    {task.priority}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center p-8 gap-4 flex-1">
                <div className="w-32 h-32 relative">
                  <Basket theme="dark" intensity={0.7} className="w-full h-full text-text-muted opacity-70" />
                </div>
                <div className="text-center text-text-muted text-sm">No active tasks assigned to you right now.</div>
              </div>
            )}
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
