import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { api } from '../lib/api';
import posthog from '../lib/posthog';
import { useSocket } from '../contexts/SocketContext';
import StatusPicker, { getStatusIcon } from '../components/StatusPicker';
import PriorityPicker, { getPriorityIcon } from '../components/PriorityPicker';
import HealthPicker, { getHealthIcon } from '../components/HealthPicker';
import LeadPicker from '../components/LeadPicker';
import DatePicker from '../components/DatePicker';
import MembersAvatarStack from '../components/projects/MembersAvatarStack';
import { getInitial, getAvatarColor } from '../lib/avatarUtils';
import { Plus, CheckSquare, Compass, FileText } from 'lucide-react';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { IssuesEmptyIcon } from '../components/EmptyStateIcons';
import { useListShortcuts } from '../hooks/useListShortcuts';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { organization } = useOrganization();
  const { socket } = useSocket();
  const userName = user?.fullName || 'cyrusjones';
  
  const [tasks, setTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
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
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam ? tabParam.charAt(0).toUpperCase() + tabParam.slice(1) : 'Overview');
  const tabs = ['Overview', 'Issues', 'Milestones'];
  const [activePicker, setActivePicker] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toLowerCase() });
    posthog.capture('project_tab_changed', { tab: tab.toLowerCase(), project_id: id });
  };

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(data => {
        setProject(data);
        posthog.capture('project_viewed', { project_id: id });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        if (err?.response?.data?.error === 'Project not found') {
          navigate('/projects');
        }
        setLoading(false);
      });
  }, [id, navigate]);

  useEffect(() => {
    if (activeTab === 'Issues' && id && !tasksLoaded) {
      api.get(`/tasks?project_id=${id}`)
        .then(data => {
          setTasks(data);
          setTasksLoaded(true);
        })
        .catch(err => console.error(err));
    }
  }, [activeTab, id, tasksLoaded]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleProjectUpdated = (updatedProject) => {
      if (updatedProject.id === id || updatedProject.id === parseInt(id, 10)) {
        setProject(prev => ({ ...prev, ...updatedProject }));
      }
    };

    const handleProjectDeleted = (deletedId) => {
      if (deletedId === id || deletedId === parseInt(id, 10)) {
        navigate('/projects');
      }
    };

    const handleTaskCreated = (newTask) => {
      if (newTask.project_id === id || newTask.project_id === parseInt(id, 10)) {
        setTasks((prev) => {
          if (prev.some(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    };

    const handleTaskDeleted = ({ id: taskId }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    socket.on('PROJECT_UPDATED', handleProjectUpdated);
    socket.on('PROJECT_DELETED', handleProjectDeleted);
    socket.on('TASK_CREATED', handleTaskCreated);
    socket.on('TASK_UPDATED', handleTaskUpdated);
    socket.on('TASK_DELETED', handleTaskDeleted);

    return () => {
      socket.off('PROJECT_UPDATED', handleProjectUpdated);
      socket.off('PROJECT_DELETED', handleProjectDeleted);
      socket.off('TASK_CREATED', handleTaskCreated);
      socket.off('TASK_UPDATED', handleTaskUpdated);
      socket.off('TASK_DELETED', handleTaskDeleted);
    };
  }, [socket, id, navigate]);

  useEffect(() => {
    const handleProjectShortcuts = (e) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;

      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); handleTabChange('Overview'); }
        if (e.key === '2') { e.preventDefault(); handleTabChange('Issues'); }
        if (e.key === '3') { e.preventDefault(); handleTabChange('Milestones'); }
      }
    };
    window.addEventListener('keydown', handleProjectShortcuts);
    return () => window.removeEventListener('keydown', handleProjectShortcuts);
  }, []);

  useListShortcuts({
    items: activeTab === 'Issues' ? tasks : [],
    activeIndex,
    setActiveIndex,
    onOpenItem: (task) => setSelectedTaskId(task.id),
    onCreateItem: () => setIsCreateModalOpen(true),
  });

  const updateProjectProperty = async (key, value) => {
    if (!canManageProjects || !project) return;
    
    // Optimistic update
    const prevProject = { ...project };
    setProject(prev => ({ ...prev, [key]: value }));
    
    try {
      await api.put(`/projects/${id}`, { [key]: value });
    } catch (err) {
      console.error('Failed to update project property:', err);
      // Revert on failure
      setProject(prevProject);
    }
  };

  if (loading) return null;
  
  if (!project) {
    return <div className="p-8 text-white">Project not found</div>;
  }

  return (
    <div className="w-full flex flex-col h-full bg-[#18191c] animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#18191c] z-10">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Link to="/projects" className="text-[#85868a] hover:text-white transition-colors">Projects</Link>
          <span className="text-[#55565a]">›</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-[4px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
            <span className="text-white">{project.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-[13px] font-medium text-[#85868a]">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => handleTabChange(tab)}
                className={`transition-colors ${activeTab === tab ? 'text-white' : 'hover:text-[#d1d2d5]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Dead settings gear button
          <button className="text-[#85868a] hover:text-white transition-colors ml-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          */}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 pr-6">
          {activeTab === 'Overview' && (
            <div className="max-w-3xl">
              <div className="w-10 h-10 rounded-[8px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
              <p className="text-[#85868a] text-[15px] mb-8">
                A collaborative workspace for managing projects, tasks, and team workflows.
              </p>

              {/* Quick Properties row */}
              <div className="flex items-center gap-6 text-[13px] text-[#85868a] font-medium border-b border-[#2a2a2a] pb-6 mb-6">
                 <div className="flex items-center gap-4">
                   <span className="w-20">Properties</span>
                   <div className="flex items-center gap-3 text-white">
                     <div className="flex items-center gap-1.5 border border-[#333538] bg-white/5 rounded-full px-2 py-0.5">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
                       {project.status}
                     </div>
                     <div className="flex items-center gap-1.5 border border-[#333538] bg-white/5 rounded-full px-2 py-0.5">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
                       {project.priority}
                     </div>
                     <div className="flex items-center gap-1.5 border border-[#333538] bg-white/5 rounded-full px-2 py-0.5">
                       {project.lead ? (
                         <>
                           <div className={`w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[8px] font-bold ${getAvatarColor(project.lead.name, project.lead.email)}`}>
                             {project.lead.avatar_url ? (
                               <img src={project.lead.avatar_url} alt={project.lead.name} className="w-full h-full rounded-full object-cover" />
                             ) : (
                               getInitial(project.lead.name, project.lead.email)
                             )}
                           </div>
                           {project.lead.name || project.lead.email.split('@')[0]}
                         </>
                       ) : (
                         <>
                           <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white/[0.1] border-dashed text-white/[0.3]">
                             <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                           </div>
                           Unassigned
                         </>
                       )}
                     </div>
                     <div className="flex items-center gap-1.5 border border-[#333538] bg-white/5 rounded-full px-2 py-0.5">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                       Sep 30th → Oct 20th
                     </div>
                   </div>
                 </div>
              </div>



              <h3 className="text-[13px] font-medium text-[#85868a] mb-4">Description</h3>
              {canManageProjects ? (
                <textarea
                  defaultValue={project.description || ''}
                  placeholder="Add a project description..."
                  onBlur={(e) => {
                    if (e.target.value !== project.description) {
                      updateProjectProperty('description', e.target.value);
                    }
                  }}
                  className="w-full min-h-[200px] text-[14px] leading-relaxed text-[#d1d2d5] mb-12 whitespace-pre-wrap bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 focus:outline-none rounded-md p-2 -ml-2 resize-none transition-colors"
                />
              ) : (
                <div className="text-[14px] leading-relaxed text-[#d1d2d5] mb-12 whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </div>
              )}


            </div>
          )}

          {activeTab === 'Milestones' && (
            project.milestones && project.milestones.length > 0 ? (
              <div className="flex flex-col gap-4 mt-6">
                {project.milestones.map((ms, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="text-[#5e6ad2]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        <span className="font-medium text-white text-[14px]">{ms.name || ms.title}</span>
                      </div>
                      <span className="text-xs text-[#8a8f98]">
                        {ms.due_date ? new Date(ms.due_date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    {ms.description && (
                      <p className="text-[13px] text-[#a1a1aa] ml-6">{ms.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center mt-20">
                <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-[#8a8f98] shadow-sm relative overflow-hidden mb-6">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </div>
                <h2 className="text-[16px] font-medium text-white mb-3">No milestones yet</h2>
                <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                  Project milestones such as key deliverables and dates will appear here.
                </p>
              </div>
            )
          )}

          {activeTab === 'Issues' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[16px] font-medium text-white">Project Issues</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
                >
                  <Plus size={14} /> New Issue
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10">
                  <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center text-[#8a8f98] shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
                     <IssuesEmptyIcon className="w-16 h-16" />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold text-white tracking-tight">Add issues to the project</h2>
                    <p className="text-[14px] text-text-muted leading-relaxed">
                      Start building your project by creating an issue. You can also add teams, team members, and project dates in the project sidebar.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="h-8 px-4 bg-[#5e6ad2] text-white rounded-md font-medium text-[13px] hover:bg-[#6f7bf7] transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Create new issue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-hidden flex flex-col shadow-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-[80px_minmax(200px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.05] text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                    <div>ID</div>
                    <div>Title</div>
                    <div>Status</div>
                    <div>Priority</div>
                    <div>Assignee</div>
                    <div className="text-right">Due</div>
                  </div>

                  {/* Table Body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] custom-scrollbar">
                    {tasks.map((task, idx) => (
                      <div 
                        key={task.id} 
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setActiveIndex(idx);
                        }}
                        className={`grid grid-cols-[80px_minmax(200px,1fr)_120px_100px_100px_80px] gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors items-center text-[13px] group cursor-pointer ${
                          activeIndex === idx ? 'bg-white/[0.08] ring-1 ring-inset ring-white/10' : ''
                        }`}
                      >
                      <div className="font-mono text-[11px] text-text-muted">{task.id}</div>
                      <div className="text-text-primary font-medium truncate group-hover:text-accent transition-colors">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'Done' ? <CheckSquare size={14} className="text-green-500" /> : 
                         task.status === 'In Progress' ? <Compass size={14} className="text-orange-400" /> : 
                         task.status === 'In Review' ? <FileText size={14} className="text-blue-400" /> : 
                         <Compass size={14} className="text-gray-500" />}
                        <span className={task.status === 'Done' ? 'text-gray-400' : 'text-white'}>{task.status}</span>
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          task.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 truncate">
                        {task.assignee_name && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(task.assignee_name, task.assignee_name)}`}>
                            {task.assignee_name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate">{task.assignee_name || 'Unassigned'}</span>
                      </div>
                      <div className="text-right text-gray-500 text-xs">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-[320px] shrink-0 border-l border-[#2a2a2a] overflow-y-auto custom-scrollbar bg-[#1a1b1e]">
          <div className="p-5 flex flex-col gap-8">
            
            {/* Properties section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-white">Properties</h3>

              </div>
              
              <div className="flex flex-col gap-3 text-[13px]">
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Status</span>
                  <div className="relative">
                    <div 
                      className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                      onClick={(e) => { e.stopPropagation(); if (canManageProjects) setActivePicker('status'); }}
                    >
                      {getStatusIcon(project.status || "Planned")}
                      {project.status || "Planned"}
                    </div>
                    {activePicker === 'status' && (
                      <StatusPicker 
                        value={project.status || "Planned"} 
                        onChange={(val) => updateProjectProperty('status', val)} 
                        onClose={() => setActivePicker(null)} 
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Priority</span>
                  <div className="relative">
                    <div 
                      className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                      onClick={(e) => { e.stopPropagation(); if (canManageProjects) setActivePicker('priority'); }}
                    >
                      {getPriorityIcon(project.priority || "No priority")}
                      {project.priority || "No priority"}
                    </div>
                    {activePicker === 'priority' && (
                      <PriorityPicker 
                        value={project.priority} 
                        onChange={(val) => updateProjectProperty('priority', val)} 
                        onClose={() => setActivePicker(null)}
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Health</span>
                  <div className="relative">
                    <div 
                      className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                      onClick={(e) => { e.stopPropagation(); if (canManageProjects) setActivePicker('health'); }}
                    >
                      {getHealthIcon(project.health || "On track")}
                      {project.health || "On track"}
                    </div>
                    {activePicker === 'health' && (
                      <HealthPicker 
                        value={project.health || "On track"} 
                        onChange={(val) => updateProjectProperty('health', val)} 
                        onClose={() => setActivePicker(null)} 
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Lead</span>
                  <div className="relative">
                    <div 
                      className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                      onClick={(e) => { e.stopPropagation(); if (canManageProjects) setActivePicker('lead'); }}
                    >
                      {project.lead ? (
                        <>
                          <div className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold ${getAvatarColor(project.lead.name, project.lead.email)}`}>
                            {project.lead.avatar_url ? (
                              <img src={project.lead.avatar_url} alt={project.lead.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitial(project.lead.name, project.lead.email)
                            )}
                          </div>
                          {project.lead.name || project.lead.email.split('@')[0]}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white/[0.1] border-dashed text-white/[0.3]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          Unassigned
                        </>
                      )}
                    </div>
                    {activePicker === 'lead' && (
                      <LeadPicker 
                        currentLead={project.lead} 
                        onSelect={(val) => updateProjectProperty('lead', val)} 
                        onClose={() => setActivePicker(null)} 
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Members</span>
                  <div className="flex items-center gap-2">
                    {project.members && project.members.length > 0 && (
                      <MembersAvatarStack members={project.members} max={3} />
                    )}
                    <div className={`flex items-center gap-1.5 transition-colors rounded p-1 ${project.members && project.members.length > 0 ? '' : '-ml-1'} ${canManageProjects ? 'hover:text-white cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                         onClick={canManageProjects ? () => {} : undefined}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      {project.members && project.members.length > 0 ? '' : 'Add members'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Target date</span>
                  <div className="relative">
                    <div 
                      className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                      onClick={(e) => { e.stopPropagation(); if (canManageProjects) setActivePicker('dueDate'); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                      {project.due_date 
                          ? new Date(project.due_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "Set target date"}
                    </div>
                    {activePicker === 'dueDate' && (
                      <DatePicker 
                        value={project.due_date} 
                        onChange={(val) => updateProjectProperty('due_date', val)} 
                        onClose={() => setActivePicker(null)} 
                        placeholder="Target date"
                      />
                    )}
                  </div>
                </div>
                {project.teams && project.teams.length > 0 && (
                  <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                    <span>Teams</span>
                    <div className={`flex items-center gap-2 text-white p-1 -ml-1 rounded ${canManageProjects ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}>
                      <div className="w-4 h-4 rounded-[3px] bg-[#e95454]/10 text-[#e95454] flex items-center justify-center font-bold text-[9px]">
                        {project.teams[0].charAt(0).toUpperCase()}
                      </div>
                      {project.teams[0]}
                      {project.teams.length > 1 && (
                        <span className="text-[#85868a] text-[12px]">+{project.teams.length - 1}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Slack</span>
                  <div className={`flex items-center gap-2 transition-colors rounded -ml-1 p-1 ${canManageProjects ? 'hover:text-white cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                       onClick={canManageProjects ? () => {} : undefined}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
                    Slack channel
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center text-[#85868a]">
                  <span>Labels</span>
                  <div className={`flex items-center gap-2 transition-colors rounded -ml-1 p-1 ${canManageProjects ? 'hover:text-white cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
                       onClick={canManageProjects ? () => {} : undefined}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    Add label
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#2a2a2a]" />

            {/* Milestones section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-white">Milestones</h3>

              </div>
              {project.milestones && project.milestones.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {project.milestones.map((ms, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[13px] text-[#d1d2d5]">
                      <svg className="mt-0.5 text-[#5e6ad2] shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                      <span>{ms.name || ms.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#85868a] leading-relaxed">
                  Add milestones to organize work within your project and break it into more granular stages. <span className="text-[#d1d2d5] cursor-pointer hover:underline">Learn more</span>
                </p>
              )}
            </div>

            <hr className="border-[#2a2a2a]" />

            {/* Activity section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-[13px] font-semibold text-white cursor-pointer hover:text-[#d1d2d5]">
                  Activity
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              
              <div className="flex gap-3 text-[12px]">
                <div className="w-5 h-5 rounded-full bg-[#f97373] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {(project.lead?.name || project.lead?.email || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="text-[#85868a]">
                  <span className="text-[#d1d2d5] font-medium mr-1">{project.lead?.name || project.lead?.email || 'cyrusjones'}</span> 
                  created the project <span className="ml-1">
                    {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
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
        initialProjectId={id}
        onTaskCreated={(newTask) => {
          setTasks([newTask, ...tasks]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
