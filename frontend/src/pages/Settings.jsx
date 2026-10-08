import { useState, useEffect } from 'react';
import { useOrganization, UserProfile } from '@clerk/clerk-react';
import { api } from '../lib/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General');
  const { organization, isLoaded } = useOrganization();
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (organization?.name) {
      setWorkspaceName(organization.name);
    } else if (isLoaded && !organization) {
      setWorkspaceName('Personal Workspace');
    }
  }, [organization, isLoaded]);
  
  const tabs = ['General', 'Profile'];

  const handleSaveWorkspace = async () => {
    if (!organization) {
      setError("Cannot rename personal workspace");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await organization.update({ name: workspaceName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update workspace name');
    } finally {
      setIsSaving(false);
    }
  };

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
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!organization}
                  className="w-full max-w-sm h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.05] text-[13px] text-white focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="w-full h-px bg-white/[0.04]" />

              {error && <div className="text-danger text-[13px]">{error}</div>}
              {success && <div className="text-success text-[13px]">Workspace updated successfully.</div>}
              
              <div className="flex justify-end mt-4">
                 <button 
                   onClick={handleSaveWorkspace}
                   disabled={isSaving || !organization || !workspaceName.trim()}
                   className="h-8 px-4 rounded-md bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                 >
                   {isSaving ? 'Saving...' : 'Save Changes'}
                 </button>
              </div>
            </div>
          )}
          
          {activeTab === 'Profile' && (
             <div className="animate-in fade-in duration-200">
               <UserProfile 
                 appearance={{
                   elements: {
                     rootBox: "shadow-none w-full max-w-full",
                     card: "shadow-none bg-transparent rounded-none",
                     navbar: "hidden",
                     pageScrollBox: "px-0"
                   }
                 }}
               />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
