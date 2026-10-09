import { useState, useEffect, useMemo } from 'react';
import { Lockers, Riffle } from '@lucasmarkes/hairline/react';
import { api } from '../lib/api';
import { useUser } from '@clerk/clerk-react';
import { Check, CheckCheck, ListFilter, SlidersHorizontal, MoreHorizontal, Clock, ChevronDown, ChevronRight, User, Box, Signal, Circle, Inbox as InboxIconLucide } from 'lucide-react';
import { useListShortcuts } from '../hooks/useListShortcuts';

const NotificationTypeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="10" height="10" rx="2" />
    <circle cx="10" cy="6" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const Toggle = ({ active, onChange }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); if (onChange) onChange(!active); }}
    className={`w-[28px] h-[16px] rounded-full relative transition-colors cursor-pointer outline-none ${active ? 'bg-[#5e6ad2]' : 'bg-white/[0.15]'}`}
  >
    <div className={`absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full transition-transform shadow-sm ${active ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
  </button>
);

const SelectDropdown = ({ value, options = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center justify-between gap-2 pl-2.5 pr-1.5 py-[3px] rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[#e8e8e8] text-[12px] font-medium transition-colors outline-none min-w-[60px]"
      >
        {value}
        <ChevronDown size={14} className="text-[#8a8f98]" strokeWidth={2.5} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          <div className="absolute top-full right-0 mt-1 z-[70] min-w-[140px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-1 flex flex-col text-[13px]">
            {options.map((opt, idx) => (
              <button 
                key={idx} 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); if(onChange) onChange(opt); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#5e6ad2] text-[#e8e8e8] hover:text-white transition-colors flex items-center justify-between group/opt"
              >
                {opt}
                {opt === value && <Check size={14} className="text-[#8a8f98] group-hover/opt:text-white" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const IssueIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

const EmptyInboxIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/>
    <path d="M3 8l6.5-6h5l6.5 6"/>
    <path d="M12 11v6"/>
    <path d="M9 14h6"/>
  </svg>
);

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Filter & Display States
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [activeFilterSubmenu, setActiveFilterSubmenu] = useState(null);
  
  const [filterState, setFilterState] = useState({
    types: [],
    teammates: [],
    projects: []
  });

  const [allTeammates, setAllTeammates] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  const uniqueTeammates = useMemo(() => {
    const teammates = notifications.map(n => n.actor_name).filter(Boolean);
    return [...new Set(teammates)].sort();
  }, [notifications]);

  const uniqueProjects = useMemo(() => {
    const projects = notifications.map(n => n.project_name).filter(Boolean);
    return [...new Set(projects)].sort();
  }, [notifications]);

  const [displayOptions, setDisplayOptions] = useState({
    priorityInbox: true,
    includeInPriority: 'All',
    badgeCount: 'Priority & Other',
    groupUnreadsBy: 'No grouping',
    ordering: 'Newest',
    showSnoozed: true,
    showUnreadFirst: true
  });
  
  const { organization, isLoaded } = useUser();

  const fetchFilterData = async () => {
    try {
      const [membersRes, projectsRes] = await Promise.all([
        organization ? api.get(`/workspaces/${organization.id}/members`) : Promise.resolve([]),
        api.get('/projects')
      ]);
      const members = Array.isArray(membersRes) ? membersRes : membersRes.data?.members || [];
      const teammates = members.map(m => {
        if (m.user?.name) return m.user.name;
        if (m.user?.firstName) return `${m.user.firstName} ${m.user.lastName || ''}`.trim();
        return m.email;
      }).filter(Boolean);
      setAllTeammates([...new Set(teammates)].sort());
      setAllProjects([...new Set(projectsRes.map(p => p.name).filter(Boolean))].sort());
    } catch (err) {
      console.error('Failed to fetch filter data', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get('/workspaces/current/notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchNotifications();
      fetchFilterData();
    }
  }, [organization?.id, isLoaded]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/workspaces/current/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/workspaces/current/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleSelect = (notif) => {
    setSelectedNotifId(notif.id);
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
  };

  useEffect(() => {
    const handleInboxShortcuts = (e) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;

      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setFilterOpen(prev => !prev);
          setDisplayOpen(false);
          setActiveFilterSubmenu(null);
        } else if (e.key.toLowerCase() === 'o') {
          e.preventDefault();
          setDisplayOpen(prev => !prev);
          setFilterOpen(false);
          setActiveFilterSubmenu(null);
        }
      }
    };
    window.addEventListener('keydown', handleInboxShortcuts);
    return () => window.removeEventListener('keydown', handleInboxShortcuts);
  }, []);

  const toggleFilter = (category, val) => {
    setFilterState(prev => {
      const arr = prev[category];
      const newArr = arr.includes(val)
        ? arr.filter(t => t !== val)
        : [...arr, val];
      return { ...prev, [category]: newArr };
    });
  };

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'unread' && n.is_read) return false;
      
      if (filterState.types.length > 0) {
        const typeMapping = {
          'task_assigned': 'Assignments',
          'task_comment': 'Comments',
          'task_completed': 'Status changes'
        };
        const mappedType = typeMapping[n.type];
        if (!mappedType || !filterState.types.includes(mappedType)) {
          return false;
        }
      }

      if (filterState.teammates.length > 0) {
        if (!n.actor_name || !filterState.teammates.includes(n.actor_name)) return false;
      }

      if (filterState.projects.length > 0) {
        if (!n.project_name || !filterState.projects.includes(n.project_name)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (displayOptions.showUnreadFirst) {
        if (!a.is_read && b.is_read) return -1;
        if (a.is_read && !b.is_read) return 1;
      }
      
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      if (displayOptions.ordering === 'Oldest') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });

  const selectedNotif = notifications.find(n => n.id === selectedNotifId);

  useListShortcuts({
    items: filteredNotifications,
    activeIndex,
    setActiveIndex,
    onOpenItem: (notif) => handleSelect(notif)
  });

  return (
    <div className="flex h-full w-full bg-[#1c1d21] text-[#e8e8e8] text-[13px] font-sans antialiased">
      
      {/* Left Sidebar */}
      <div className="w-[320px] flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-transparent relative z-10">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[13px] text-[#e8e8e8]">Inbox</span>
            <button className="h-5 w-5 flex items-center justify-center rounded-[4px] text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8] transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="relative group flex items-center justify-center">
              <button 
                onClick={() => setFilter(filter === 'unread' ? 'all' : 'unread')}
                className={`h-[24px] w-[24px] flex items-center justify-center rounded-md transition-all ${
                  filter === 'unread' 
                    ? 'text-[#5e6ad2] bg-[#5e6ad2]/10 hover:bg-[#5e6ad2]/20' 
                    : 'text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8]'
                }`}
              >
                <InboxIconLucide size={14} strokeWidth={2} />
              </button>
              <div className={`absolute top-full mt-1.5 items-center whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50 ${filter === 'unread' ? 'hidden' : 'hidden group-hover:flex'}`}>
                <span className="text-[12px] font-medium text-[#e8e8e8]">Show unreads only</span>
              </div>
            </div>

            <div className="relative group flex items-center justify-center">
              <button 
                onClick={() => { setFilterOpen(!filterOpen); setDisplayOpen(false); setActiveFilterSubmenu(null); }}
                className={`h-[24px] w-[24px] flex items-center justify-center rounded-md transition-colors ${
                  filterOpen ? 'bg-white/[0.08] text-[#e8e8e8]' : 'text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8]'
                }`}
              >
                <ListFilter size={15} strokeWidth={2} />
              </button>
              <div className={`absolute top-full mt-1.5 items-center gap-1.5 whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50 ${filterOpen ? 'hidden' : 'hidden group-hover:flex'}`}>
                <span className="text-[12px] font-medium text-[#e8e8e8]">Add Filter</span>
                <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">F</kbd>
              </div>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setFilterOpen(false); setActiveFilterSubmenu(null); }} />
                  <div className="absolute top-full left-0 mt-1.5 z-50 w-[240px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col text-[13px]">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
                      <input 
                        type="text" 
                        placeholder="Add Filter..." 
                        className="bg-transparent text-[#e8e8e8] placeholder-[#8a8f98] outline-none text-[13px] w-full font-medium"
                        autoFocus
                      />
                      <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">F</kbd>
                    </div>
                    <div className="py-1 relative" onMouseLeave={() => setActiveFilterSubmenu(null)}>
                      {[
                        { label: 'Notification type', icon: <NotificationTypeIcon size={14} /> },
                        { label: 'Teammate', icon: <User size={14} /> },
                        { label: 'Project', icon: <Box size={14} /> }
                      ].map((item, idx) => (
                        <div 
                          key={idx} 
                          onMouseEnter={() => setActiveFilterSubmenu(item.label)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors text-left group/item cursor-pointer ${activeFilterSubmenu === item.label ? 'bg-white/[0.06]' : 'hover:bg-white/[0.06]'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`transition-colors ${activeFilterSubmenu === item.label ? 'text-[#e8e8e8]' : 'text-[#8a8f98] group-hover/item:text-[#e8e8e8]'}`}>{item.icon}</div>
                            <span className="text-[#e8e8e8]">{item.label}</span>
                          </div>
                          <ChevronRight size={14} className={`transition-opacity ${activeFilterSubmenu === item.label ? 'opacity-100 text-[#e8e8e8]' : 'opacity-0 text-[#8a8f98] group-hover/item:opacity-100'}`} />
                        </div>
                      ))}

                      {activeFilterSubmenu && (
                        <div className="absolute top-0 left-[102%] w-[240px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col text-[13px] overflow-hidden z-50">
                          <div className="flex items-center px-3 py-2 border-b border-white/[0.08]">
                            <input type="text" placeholder="Filter..." className="bg-transparent text-[#e8e8e8] placeholder-[#8a8f98] outline-none text-[13px] w-full font-medium" />
                          </div>
                          <div className="py-1">
                            {(
                              activeFilterSubmenu === 'Notification type' 
                                ? ['Assignments', 'Comments', 'Status changes']
                                : activeFilterSubmenu === 'Teammate'
                                ? allTeammates
                                : activeFilterSubmenu === 'Project'
                                ? allProjects
                                : []
                            ).map(sub => {
                              const category = activeFilterSubmenu === 'Notification type' ? 'types' : activeFilterSubmenu === 'Teammate' ? 'teammates' : 'projects';
                              const isChecked = filterState[category].includes(sub);
                              return (
                                <button 
                                  key={sub} 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFilter(category, sub); }}
                                  className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer outline-none"
                                >
                                  <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${isChecked ? 'bg-[#5e6ad2] border-[#5e6ad2]' : 'border-white/[0.2]'}`}>
                                    {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                                  </div>
                                  <span className="text-[#e8e8e8] text-[13px] select-none">{sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="relative group flex items-center justify-center">
              <button 
                onClick={() => { setDisplayOpen(!displayOpen); setFilterOpen(false); setActiveFilterSubmenu(null); }}
                className={`h-[24px] w-[24px] flex items-center justify-center rounded-md transition-colors ${
                  displayOpen ? 'bg-white/[0.08] text-[#e8e8e8]' : 'text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8]'
                }`}
              >
                <SlidersHorizontal size={14} strokeWidth={2.2} />
              </button>
              <div className={`absolute top-full mt-1.5 left-0 items-center gap-1.5 whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50 ${displayOpen ? 'hidden' : 'hidden group-hover:flex'}`}>
                <span className="text-[12px] font-medium text-[#e8e8e8]">Show display options</span>
                <div className="flex gap-0.5">
                  <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">↑</kbd>
                  <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">V</kbd>
                </div>
              </div>
              {displayOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDisplayOpen(false)} />
                  <div className="absolute top-full right-0 mt-1.5 z-50 w-[280px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-1.5 flex flex-col text-[13px]">
                    
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#e8e8e8] font-medium">Enable priority inbox</span>
                      <Toggle active={displayOptions.priorityInbox} onChange={(val) => setDisplayOptions(prev => ({...prev, priorityInbox: val}))} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Include in priority inbox</span>
                      <SelectDropdown 
                        value={displayOptions.includeInPriority} 
                        options={['All', 'Unread', 'Mentions']}
                        onChange={(val) => setDisplayOptions(prev => ({...prev, includeInPriority: val}))}
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Badge count</span>
                      <SelectDropdown 
                        value={displayOptions.badgeCount} 
                        options={['Priority & Other', 'Priority only', 'None']}
                        onChange={(val) => setDisplayOptions(prev => ({...prev, badgeCount: val}))}
                      />
                    </div>
                    
                    <div className="my-1.5 h-[1px] bg-white/[0.04]" />
                    
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Group unreads by</span>
                      <SelectDropdown 
                        value={displayOptions.groupUnreadsBy} 
                        options={['No grouping', 'Project', 'Status', 'Priority']}
                        onChange={(val) => setDisplayOptions(prev => ({...prev, groupUnreadsBy: val}))}
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Ordering</span>
                      <SelectDropdown 
                        value={displayOptions.ordering} 
                        options={['Newest', 'Oldest', 'Priority']}
                        onChange={(val) => setDisplayOptions(prev => ({...prev, ordering: val}))}
                      />
                    </div>

                    <div className="my-1.5 h-[1px] bg-white/[0.04]" />

                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#e8e8e8] font-medium">Show snoozed</span>
                      <Toggle active={displayOptions.showSnoozed} onChange={(val) => setDisplayOptions(prev => ({...prev, showSnoozed: val}))} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#e8e8e8] font-medium">Show unread first</span>
                      <Toggle active={displayOptions.showUnreadFirst} onChange={(val) => setDisplayOptions(prev => ({...prev, showUnreadFirst: val}))} />
                    </div>

                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col p-2 gap-0.5">
              {[1, 2, 3].map(i => <div key={i} className="h-[60px] rounded bg-white/[0.02] animate-pulse" />)}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8a8f98] gap-4">
              <div className="w-40 h-40 relative overflow-visible">
                <Lockers theme="dark" intensity={0.5} className="w-full h-full opacity-60" />
              </div>
              <span className="text-[13px]">All caught up</span>
            </div>
          ) : (
            <div className="flex flex-col py-2">
              {filteredNotifications.map((notif, idx) => {
                const isSelected = selectedNotifId === notif.id;
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      handleSelect(notif);
                      setActiveIndex(idx);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors relative group outline-none ${
                      isSelected || isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                    } ${isActive ? 'ring-1 ring-inset ring-white/10' : ''}`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#5e6ad2]" />
                    )}
                    <div className="mt-0.5 flex-shrink-0 text-[#8a8f98] group-hover:text-[#e8e8e8] transition-colors">
                       <IssueIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className={`truncate text-[13px] tracking-tight ${notif.is_read ? 'text-[#8a8f98] font-normal' : 'text-[#e8e8e8] font-medium'}`}>
                          {notif.title}
                        </span>
                        <span className={`text-[12px] flex-shrink-0 transition-opacity ${notif.is_read ? 'text-[#8a8f98] opacity-60' : 'text-[#8a8f98] opacity-100'} group-hover:opacity-0`}>
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`text-[13px] truncate block mt-0.5 ${notif.is_read ? 'text-[#8a8f98] opacity-70' : 'text-[#8a8f98]'}`}>
                        {notif.message}
                      </span>
                    </div>
                    {!notif.is_read && (
                      <div className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-[#5e6ad2] mt-2 transition-opacity group-hover:opacity-0 shadow-[0_0_8px_rgba(94,106,210,0.6)]" />
                    )}

                    {/* Hover Actions */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-[#232429] border border-white/[0.08] shadow-sm rounded-md p-0.5 transition-all duration-200">
                      <div 
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                        className="relative group/action h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                      >
                        {notif.is_read ? <CheckCheck size={14} /> : <Check size={14} />}
                        <div className="absolute bottom-full mb-2 hidden group-hover/action:flex items-center whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50">
                          <span className="text-[12px] font-medium text-[#e8e8e8]">{notif.is_read ? 'Mark as unread' : 'Mark as read'}</span>
                          <kbd className="ml-2 h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">E</kbd>
                        </div>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); }}
                        className="relative group/action h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                      >
                        <Clock size={13} />
                        <div className="absolute bottom-full mb-2 hidden group-hover/action:flex items-center whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50">
                          <span className="text-[12px] font-medium text-[#e8e8e8]">Snooze</span>
                          <kbd className="ml-2 h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">H</kbd>
                        </div>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); }}
                        className="relative group/action h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                      >
                        <MoreHorizontal size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 flex flex-col bg-transparent overflow-y-auto relative z-0">
        {selectedNotif ? (
          <div className="flex-1 max-w-3xl w-full mx-auto p-8 md:p-12 flex flex-col">
            <div className="flex items-start gap-4 mb-8 border-b border-white/[0.06] pb-6">
              <div className="mt-0.5 text-[#8a8f98]">
                <IssueIcon size={20} />
              </div>
              <div className="flex-1">
                <h1 className="text-[18px] font-medium text-[#e8e8e8] tracking-tight">{selectedNotif.title}</h1>
                <p className="text-[13px] text-[#8a8f98] mt-1.5">
                  {new Date(selectedNotif.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-[14px] text-[#e8e8e8] leading-relaxed max-w-2xl whitespace-pre-wrap">
              {selectedNotif.message}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-48 h-48 relative mb-2 overflow-visible">
              <Riffle theme="dark" intensity={0.7} className="w-full h-full text-[#8a8f98] opacity-70" />
            </div>
            <h3 className="text-[14px] font-medium text-[#e8e8e8]">Inbox</h3>
            <p className="text-[13px] text-[#8a8f98] mt-1.5 max-w-[200px]">
              Select a notification to view its details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
