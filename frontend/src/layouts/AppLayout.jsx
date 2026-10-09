import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, KanbanSquare, CheckSquare, Users, Settings, Search, Folder, LogOut, Inbox as InboxIcon, LineChart } from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';
import CommandPalette from '../components/CommandPalette';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import { useUser, useClerk, OrganizationSwitcher, useOrganization, useOrganizationList } from '@clerk/clerk-react';
import { api } from '../lib/api';
import posthog from '../lib/posthog';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const { userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({ userMemberships: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [initialOrg, setInitialOrg] = useState(null);

  useGlobalShortcuts({
    onOpenCommandPalette: () => window.dispatchEvent(new CustomEvent('open-command-palette')),
    onOpenHelp: () => setIsHelpOpen(true),
    onOpenCreateTask: () => setIsModalOpen(true),
  });

  useEffect(() => {
    if (
      isOrgListLoaded && 
      userMemberships &&
      !userMemberships.isLoading &&
      userMemberships.data !== undefined &&
      userMemberships.data.length === 0 && 
      location.pathname !== '/onboarding'
    ) {
      navigate('/onboarding', { replace: true });
    }
  }, [isOrgListLoaded, userMemberships?.isLoading, userMemberships?.data, location.pathname, navigate]);

  useEffect(() => {
    if (user) {
      api.post('/auth/sync', {}).then(() => {
        if (initialOrg === null) {
          setInitialOrg(organization?.id || "personal");
        } else if (initialOrg !== (organization?.id || "personal")) {
          // Organization changed, reload to fetch fresh data for everything
          window.location.reload();
        }
      }).catch(err => console.error("Sync error:", err));
    }
  }, [user, organization?.id]);

  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id);
    }
  }, [user?.id]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const userName = user?.fullName || user?.firstName || 'User';
  const initials = userName.substring(0, 2).toUpperCase();
  const avatarUrl = user?.imageUrl;

  const topNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Inbox', path: '/inbox', icon: InboxIcon },
    { name: 'Issues', path: '/tasks', icon: CheckSquare },
    { name: 'Board', path: '/kanban', icon: KanbanSquare },
  ];

  const workspaceItems = [
    { name: 'Projects', path: '/projects', icon: Folder },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSignOut = () => {
    posthog.capture('logout');
    posthog.reset();
    signOut(() => navigate('/'));
  };

  return (
    <div className="flex h-screen w-full bg-[#08090A] overflow-hidden text-text-primary text-[13px] font-sans selection:bg-accent/30 selection:text-white">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-transparent flex flex-col transition-all duration-300 relative">
        
        {/* Sidebar Header */}
        <div className="h-[48px] flex items-center justify-between px-3 mt-1">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2 text-[#e8e8e8] font-medium cursor-pointer px-2 py-1 -ml-2 rounded-md transition-colors ${isProfileOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]'}`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-[18px] h-[18px] rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-[#5e6ad2] flex items-center justify-center text-white text-[9px] font-bold tracking-tighter shadow-sm">
                {initials}
              </div>
            )}
            <span className="text-[13px] truncate max-w-[160px]">{userName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8a8f98] opacity-70"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          
          <div className="flex items-center gap-0.5 text-[#8a8f98]">
            <button 
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="p-1.5 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors"
            >
              <Search size={14} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="p-1.5 hover:bg-white/[0.04] hover:text-[#e8e8e8] rounded-md transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
          </div>
        </div>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className="absolute top-[50px] left-3 w-[240px] bg-[#212226] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-[13px]">
            <div 
              className="px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#e8e8e8]"
              onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
            >
              <span>Settings</span>
            </div>
            <div 
              className="px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer text-[#e8e8e8]"
              onClick={() => { navigate('/team'); setIsProfileOpen(false); }}
            >
              Invite and manage members
            </div>
            <div className="h-[1px] bg-white/[0.08] my-1"></div>
            <div 
              className="px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-[#e8e8e8]"
              onClick={handleSignOut}
            >
              <span>Log out</span>
              <div className="flex items-center gap-0.5 text-[#8a8f98] text-[11px] font-mono">
                <span>⌥</span><span>⇧</span><span>Q</span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Nav */}
        <div className="px-3 pb-3 flex-1 overflow-y-auto">
          <nav className="flex flex-col space-y-[2px] mt-1 text-[13px]">
            {topNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-white/[0.08] text-white font-medium' 
                      : 'text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]'
                  }`
                }
              >
                <item.icon size={15} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 flex items-center justify-between px-2.5 mb-2">
            <span className="text-[11px] font-medium tracking-wide text-[#8a8f98]">Workspace</span>
          </div>
          <div className="px-2 mb-4">
            <OrganizationSwitcher 
              hidePersonal={false}
              afterLeaveOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              afterCreateOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "w-full flex justify-between items-center px-2 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#e8e8e8] text-[13px] font-medium rounded-md transition-colors",
                  organizationSwitcherTriggerIcon: "text-[#8a8f98] w-3 h-3",
                  organizationPreviewMainIdentifier: "text-[#e8e8e8] font-medium text-[13px]",
                  organizationPreviewSecondaryIdentifier: "text-[#8a8f98] text-[11px]",
                }
              }}
            />
          </div>
          <nav className="flex flex-col space-y-[2px] text-[13px]">
            {workspaceItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-white/[0.08] text-white font-medium' 
                      : 'text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#e8e8e8]'
                  }`
                }
              >
                <item.icon size={15} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 mt-auto">
           <button 
             onClick={() => setIsHelpOpen(true)}
             className="w-[24px] h-[24px] flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
           >
             <span className="text-[11px] font-bold">?</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col py-2 pr-2 min-w-0">
        <main className="flex-1 flex flex-col min-w-0 bg-[#131416] rounded-xl relative z-0 border border-white/[0.05] shadow-2xl overflow-hidden">
          <div className={`flex-1 overflow-y-auto overflow-x-hidden bg-transparent ${location.pathname.startsWith('/inbox') ? '' : 'px-8 py-6'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTaskCreated={(newTask) => {
          window.location.reload();
        }}
      />
      
      <CommandPalette openCreateTask={() => setIsModalOpen(true)} />
      
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </div>
  );
}
