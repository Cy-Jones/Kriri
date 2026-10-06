import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General');
  
  const tabs = ['General', 'Profile', 'Security', 'Notifications'];

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-1">Settings</h1>
          <p className="text-[13px] text-text-muted">Manage your workspace and account preferences.</p>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Sidebar Nav */}
        <div className="w-48 flex flex-col gap-1">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-white/[0.06] text-white' 
                  : 'text-text-secondary hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'General' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-200">
              {/* Workspace Name */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[14px] font-medium text-white">Workspace Name</h3>
                <p className="text-[13px] text-text-muted mb-1">This is your team's workspace name, visible to all members.</p>
                <input 
                  type="text" 
                  defaultValue="Linear Replica"
                  className="w-full max-w-sm h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.05] text-[13px] text-white focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div className="w-full h-px bg-white/[0.04]" />

              {/* Theme */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[14px] font-medium text-white">Theme Preference</h3>
                <p className="text-[13px] text-text-muted mb-1">Choose how the application looks to you.</p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="theme" className="accent-white" defaultChecked />
                    <span className="text-[13px] text-text-secondary">System Default</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="theme" className="accent-white" />
                    <span className="text-[13px] text-text-secondary">Dark</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="theme" className="accent-white" />
                    <span className="text-[13px] text-text-secondary">Light</span>
                  </label>
                </div>
              </div>

              <div className="w-full h-px bg-white/[0.04]" />

              {/* Danger Zone */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[14px] font-medium text-danger">Danger Zone</h3>
                <p className="text-[13px] text-text-muted mb-2">Once you delete your workspace, there is no going back. Please be certain.</p>
                <button className="h-8 px-4 rounded-md bg-danger/10 text-danger border border-danger/20 text-[13px] font-medium hover:bg-danger/20 transition-colors self-start">
                  Delete Workspace
                </button>
              </div>
              
              <div className="flex justify-end mt-4">
                 <button className="h-8 px-4 rounded-md bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors">
                   Save Changes
                 </button>
              </div>
            </div>
          )}
          
          {activeTab !== 'General' && (
             <div className="flex flex-col items-center justify-center py-20 text-text-muted animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.05] rounded-xl mb-4 flex items-center justify-center">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="text-[14px] text-white font-medium mb-1">{activeTab}</h3>
                <p className="text-[13px]">This section is coming soon.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
