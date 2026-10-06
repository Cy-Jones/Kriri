import { useState, useRef, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { XSquare, LayoutGrid, Calendar, User, Activity, Bookmark, Star, Info } from 'lucide-react';
import { api } from '../lib/api';
import DatePicker from './DatePicker';
import LabelPicker from './LabelPicker';
import LeadPicker from './LeadPicker';
import MemberPicker from './MemberPicker';
import PriorityPicker, { getPriorityIcon } from './PriorityPicker';
import StatusPicker, { getStatusIcon } from './StatusPicker';
import SelectPicker from './SelectPicker';

const PillTooltip = ({ text, show, children }) => (
  <div className="relative flex group/tooltip">
    {children}
    {show && (
      <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#25272a] border border-[#333538] rounded-md text-[12px] text-[#d1d2d5] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 delay-[400ms] pointer-events-none whitespace-nowrap z-[60] shadow-xl font-normal tracking-wide">
        {text}
      </div>
    )}
  </div>
);

const loadDraft = () => {
  try {
    const saved = localStorage.getItem('kriri_project_draft');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { user } = useUser();
  const userName = user?.fullName || '';
  const firstName = userName ? userName.split(' ')[0] : 'there';

  const draft = loadDraft();

  const [name, setName] = useState(draft?.name ?? '');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [shortSummary, setShortSummary] = useState(draft?.shortSummary ?? '');
  
  const { organization } = useOrganization();
  const [availableMembers, setAvailableMembers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (organization?.id) {
        api.get(`/workspaces/${organization.id}/members`)
          .then(data => setAvailableMembers(data))
          .catch(err => console.error('Failed to load members', err));
      } else if (user) {
        setAvailableMembers([{
          id: user.id || 'personal',
          name: user.fullName || 'User',
          email: user.primaryEmailAddress?.emailAddress || '',
          avatar_url: user.imageUrl,
          role: 'Owner'
        }]);
      }
    }
  }, [isOpen, organization?.id, user]);
  
  // Status, Priority, Health
  const [status, setStatus] = useState(draft?.status ?? 'Planned');
  const [priority, setPriority] = useState(draft?.priority ?? 'No priority');
  const [health, setHealth] = useState(draft?.health ?? 'On Track');
  
  // Linear specific pills
  const [lead, setLead] = useState(draft?.lead ?? null);
  const [members, setMembers] = useState(draft?.members ?? []);
  const [startDate, setStartDate] = useState(draft?.startDate ?? null);
  const [targetDate, setTargetDate] = useState(draft?.targetDate ?? null);
  const [labels, setLabels] = useState(draft?.labels ?? []);
  const [milestones, setMilestones] = useState(draft?.milestones ?? []);
  
  // Popovers
  const [activePicker, setActivePicker] = useState(null); // 'lead', 'members', 'start', 'target', 'labels', 'dependencies', 'milestoneTarget'
  
  // Milestone
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneTargetDate, setMilestoneTargetDate] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const draftData = {
      name, description, shortSummary, status, priority, health, lead, members, startDate, targetDate, labels, milestones
    };
    localStorage.setItem('kriri_project_draft', JSON.stringify(draftData));
  }, [name, description, shortSummary, status, priority, health, lead, members, startDate, targetDate, labels, milestones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ title: 'Project name required', message: 'The project name cannot be empty.' });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    try {
      const finalDescription = shortSummary 
        ? `${shortSummary}\n\n${description}`.trim()
        : description.trim();

      const data = await api.post('/projects', { 
        name, 
        description: finalDescription, 
        status, 
        priority, 
        health,
        start_date: startDate,
        due_date: targetDate,
        labels,
        lead,
        members
      });
      // In a real app we'd save milestones too.
      onProjectCreated(data);
      
      // Clear draft on successful save
      localStorage.removeItem('kriri_project_draft');
      setName('');
      setDescription('');
      setShortSummary('');
      setStatus('Planned');
      setPriority('No priority');
      setHealth('On Track');
      setLead(null);
      setMembers([]);
      setStartDate(null);
      setTargetDate(null);
      setLabels([]);
      setMilestones([]);

      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
      setToast({ title: 'Failed to create project', message: err.message || 'An unexpected error occurred.' });
      setTimeout(() => setToast(null), 4000);
    }
  };
  
  const handleAddMilestone = () => {
    if(milestoneName) {
      setMilestones([...milestones, { name: milestoneName, desc: milestoneDesc, date: milestoneTargetDate }]);
      setMilestoneName('');
      setMilestoneDesc('');
      setMilestoneTargetDate(null);
      setIsCreatingMilestone(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] w-full max-w-4xl h-[85vh] rounded-xl flex flex-col shadow-2xl overflow-hidden border border-[#2a2a2a]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-[#85868a]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
            </div>
            <div className="text-[#85868a] text-[14px] flex items-center gap-1.5 font-medium">
              <span>Workspace</span>
              <span className="text-[#55565a]">›</span>
              <span className="text-[#d1d2d5]">New project</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(name || description || shortSummary || labels.length > 0 || members.length > 0 || startDate || targetDate) ? (
              <button 
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[#d1d2d5] hover:text-white text-[12px] font-medium rounded-full transition-colors border border-white/5"
              >
                Save as draft
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center text-[#a1a1aa] hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-10 pt-6">
          <form id="create-project-form" onSubmit={handleSubmit} className="h-full flex flex-col">
            
            <input
              autoFocus
              type="text"
              placeholder="Project Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-none text-[32px] font-bold text-white focus:outline-none placeholder:text-[#5f6368] mb-2"
            />
            
            <input
              type="text"
              placeholder="Add a brief summary of this project..."
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              className="w-full bg-transparent border-none text-[15px] text-[#d1d2d5] focus:outline-none placeholder:text-[#85868a] mb-4"
            />
            
            {/* Top Pills Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              
              {/* Status Pill */}
              <div className="relative">
                <PillTooltip text="Set project status" show={activePicker !== 'status'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'status' ? null : 'status')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    {getStatusIcon(status)}
                    <span>{status}</span>
                  </div>
                </PillTooltip>
                {activePicker === 'status' && (
                  <StatusPicker value={status} onChange={setStatus} onClose={() => setActivePicker(null)} />
                )}
              </div>

              {/* Priority Pill */}
              <div className="relative">
                <PillTooltip text="Set project priority" show={activePicker !== 'priority'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'priority' ? null : 'priority')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    {getPriorityIcon(priority)}
                    <span>{priority === 'No priority' ? 'Priority' : priority}</span>
                  </div>
                </PillTooltip>
                {activePicker === 'priority' && (
                  <PriorityPicker value={priority} onChange={setPriority} onClose={() => setActivePicker(null)} />
                )}
              </div>

              {/* Lead Pill */}
              <div className="relative">
                <PillTooltip text="Set project lead" show={activePicker !== 'lead'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'lead' ? null : 'lead')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    {lead ? (
                      <>
                         {lead.avatar_url ? (
                           <img src={lead.avatar_url} alt={lead.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                         ) : (
                           <div className="w-3.5 h-3.5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[7px] font-medium">
                             {lead.name ? lead.name[0].toUpperCase() : (lead.email ? lead.email[0].toUpperCase() : 'U')}
                           </div>
                         )}
                         <span>{lead.name || lead.email?.split('@')[0]}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#85868a]">
                          <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="2.5"/>
                          <path d="M6 21v-2a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                          <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
                          <circle cx="6.5" cy="5.5" r="1.5" fill="currentColor"/>
                          <circle cx="17.5" cy="5.5" r="1.5" fill="currentColor"/>
                          <circle cx="3.5" cy="10.5" r="1.5" fill="currentColor"/>
                          <circle cx="20.5" cy="10.5" r="1.5" fill="currentColor"/>
                        </svg>
                        <span>Lead</span>
                      </>
                    )}
                  </div>
                </PillTooltip>
                {activePicker === 'lead' && (
                  <LeadPicker onClose={() => setActivePicker(null)} onChange={setLead} value={lead} availableMembers={availableMembers} />
                )}
              </div>
              
              {/* Members Pill */}
              <div className="relative">
                <PillTooltip text="Add project members" show={activePicker !== 'members'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'members' ? null : 'members')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    {members.length > 0 ? (
                      <>
                         {members[0].avatar_url ? (
                           <img src={members[0].avatar_url} alt={members[0].name} className="w-3.5 h-3.5 rounded-full object-cover" />
                         ) : (
                           <div className="w-3.5 h-3.5 rounded-full bg-[#ff7b93] text-white flex items-center justify-center text-[7px] font-medium">
                             {members[0].name ? members[0].name[0].toUpperCase() : (members[0].email ? members[0].email[0].toUpperCase() : 'U')}
                           </div>
                         )}
                         <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#85868a]">
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        <span>Members</span>
                      </>
                    )}
                  </div>
                </PillTooltip>
                {activePicker === 'members' && (
                  <MemberPicker onClose={() => setActivePicker(null)} onSelect={setMembers} currentMembers={members} availableMembers={availableMembers} />
                )}
              </div>

              {/* Start Date Pill */}
              <div className="relative">
                <PillTooltip text="Set project start date" show={activePicker !== 'start'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#85868a]">
                      <path d="M18 4H6C4.895 4 4 4.895 4 6V11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M4 17V20C4 21.105 4.895 22 6 22H18C19.105 22 20 21.105 20 20V6C20 4.895 19.105 4 18 4Z" stroke="currentColor" strokeWidth="2.5"/>
                      <path d="M4 10H20V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V10Z" fill="currentColor"/>
                      <path d="M2 14.5H10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M9 10.5L15 14.5L9 18.5Z" fill="currentColor"/>
                    </svg>
                    <span>{startDate || 'Start'}</span>
                  </div>
                </PillTooltip>
                {activePicker === 'start' && (
                  <DatePicker placeholder="Start date" value={startDate} onChange={setStartDate} onClose={() => setActivePicker(null)} />
                )}
              </div>

              {/* Target Date Pill */}
              <div className="relative">
                <PillTooltip text="Set project target date" show={activePicker !== 'target'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'target' ? null : 'target')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#85868a]">
                      <path d="M18 4H6C4.895 4 4 4.895 4 6V20C4 21.105 4.895 22 6 22H18C19.105 22 20 21.105 20 20V6C20 4.895 19.105 4 18 4Z" stroke="currentColor" strokeWidth="2.5"/>
                      <path d="M4 10H20V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V10Z" fill="currentColor"/>
                    </svg>
                    <span>{targetDate || 'Target'}</span>
                  </div>
                </PillTooltip>
                {activePicker === 'target' && (
                  <DatePicker align="right" placeholder="Target date" value={targetDate} onChange={setTargetDate} onClose={() => setActivePicker(null)} />
                )}
              </div>

              {/* Labels Pill */}
              <div className="relative">
                <PillTooltip text="Add labels" show={activePicker !== 'labels'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'labels' ? null : 'labels')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#85868a]">
                      <path d="M4 12L10 6H20C21.1046 6 22 6.89543 22 8V16C22 17.1046 21.1046 18 20 18H10L4 12Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="10" cy="12" r="2" fill="currentColor"/>
                    </svg>
                    <span>{labels.length > 0 ? (labels.length === 1 ? labels[0] : `${labels.length} labels`) : 'Labels'}</span>
                  </div>
                </PillTooltip>
                {activePicker === 'labels' && (
                  <LabelPicker 
                    selectedLabels={labels} 
                    onChange={setLabels} 
                    onClose={() => setActivePicker(null)} 
                  />
                )}
              </div>

              {/* Health Pill */}
              <div className="relative">
                <PillTooltip text="Set project health" show={activePicker !== 'health'}>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'health' ? null : 'health')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-transparent bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors text-[#d1d2d5] text-[13px] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={health === 'On Track' ? 'text-[#4caf50]' : health === 'At Risk' ? 'text-[#f5a623]' : 'text-[#e53935]'}><circle cx="12" cy="12" r="8"/></svg>
                    <span>{health}</span>
                  </div>
                </PillTooltip>
                {activePicker === 'health' && (
                  <SelectPicker 
                    value={health} 
                    onChange={setHealth} 
                    onClose={() => setActivePicker(null)} 
                    options={[
                      { value: 'On Track', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#4caf50]"><circle cx="12" cy="12" r="8"/></svg> },
                      { value: 'At Risk', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#f5a623]"><circle cx="12" cy="12" r="8"/></svg> },
                      { value: 'Off Track', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#e53935]"><circle cx="12" cy="12" r="8"/></svg> }
                    ]}
                  />
                )}
              </div>

            </div>
            
            <textarea
              placeholder="What are you building? Add context, goals, and key details here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full flex-1 bg-transparent border-none text-[15px] text-[#d1d2d5] focus:outline-none placeholder:text-[#85868a] resize-none min-h-[120px]"
            />
            
            {/* Added Milestones list */}
            {milestones.length > 0 && (
               <div className="mt-4 mb-4">
                 {milestones.map((m, i) => (
                   <div key={i} className="flex items-center gap-2 mb-2 text-[13px] text-[#d1d2d5]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      <span className="font-medium">{m.name}</span>
                      {m.date && <span className="text-[#85868a]">Target: {m.date}</span>}
                   </div>
                 ))}
               </div>
            )}
            
          </form>
        </div>

        {/* Footer Area */}
        <div className="mt-auto px-5 py-4 border-t border-[#2a2a2a] shrink-0">
          
          {isCreatingMilestone ? (
            <div className="bg-[#202225] border border-[#333538] rounded-xl p-4 mb-4 shadow-lg relative">
              <div className="text-[13px] text-[#d1d2d5] font-medium mb-3">Create milestone</div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#85868a]"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                   <input 
                     autoFocus
                     placeholder="Milestone name"
                     value={milestoneName}
                     onChange={(e) => setMilestoneName(e.target.value)}
                     className="bg-transparent border-none text-[14px] text-white focus:outline-none placeholder:text-[#55565a] w-full"
                   />
                </div>
                <div className="relative">
                  <div 
                    onClick={() => setActivePicker(activePicker === 'milestoneTarget' ? null : 'milestoneTarget')}
                    className={`cursor-pointer flex items-center gap-1.5 ${milestoneTargetDate ? 'text-[#d1d2d5] bg-white/[0.04] px-2 py-1 rounded-md' : 'text-[#85868a] hover:text-white'}`}
                  >
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14v4M10 16h4"/></svg>
                     {milestoneTargetDate && <span className="text-[13px] font-medium">{milestoneTargetDate}</span>}
                  </div>
                  {activePicker === 'milestoneTarget' && (
                    <DatePicker placement="top" align="right" placeholder="Target date" value={milestoneTargetDate} onChange={setMilestoneTargetDate} onClose={() => setActivePicker(null)} />
                  )}
                </div>
              </div>
              
              <textarea
                placeholder="Add a description..."
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
                className="w-full bg-transparent border-none text-[13px] text-[#85868a] focus:outline-none placeholder:text-[#55565a] resize-none h-16 mb-2 ml-6"
              />
              
              <div className="flex items-center justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCreatingMilestone(false)}
                  className="px-4 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-[13px] font-medium rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-4 py-1.5 bg-white hover:bg-[#e8e8e8] text-black text-[13px] font-medium rounded-full transition-colors"
                >
                  Add milestone
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsCreatingMilestone(true)}
              className="bg-[#202225] border border-[#333538] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#25272a] transition-colors mb-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-white text-[13px] font-medium">Milestones +</span>
                <span className="text-[#85868a] text-[12px]">Use milestones to track progress</span>
              </div>
              <div className="text-[#55565a]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#2a2a2a] pt-4">
            {(name.trim() || description.trim() || shortSummary.trim()) && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#25272a] hover:bg-[#333538] text-white text-[13px] font-medium rounded-full transition-colors border border-[#333538]"
              >
                Save as draft
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-white hover:bg-[#e8e8e8] text-black text-[13px] font-medium rounded-full transition-colors shadow-lg shadow-white/10"
            >
              Create project
            </button>
          </div>
        </div>
        
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#202225] border border-[#333538] rounded-xl shadow-2xl p-3 flex items-start gap-3 min-w-[300px] z-[60] animate-in slide-in-from-bottom-5">
          <div className="mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff6b6b">
              <circle cx="12" cy="12" r="12" />
              <rect x="11" y="6" width="2" height="6" fill="#202225" rx="1" />
              <circle cx="12" cy="16" r="1.5" fill="#202225" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-[#d1d2d5] font-medium mb-0.5">{toast.title}</div>
            <div className="text-[12px] text-[#85868a]">{toast.message}</div>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-[#85868a] hover:text-white transition-colors">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
