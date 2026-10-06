import { useState } from 'react';
import { api } from '../lib/api';

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [createMore, setCreateMore] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const newTask = await api.post('/tasks', {
        title,
        description,
        status,
        priority,
        project_id: 1 // Default to first project for now
      });
      if (onTaskCreated) onTaskCreated(newTask);
      
      if (createMore) {
        setTitle('');
        setDescription('');
      } else {
        setTitle('');
        setDescription('');
        setStatus('Todo');
        setPriority('Medium');
        onClose();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><circle cx="12" cy="12" r="10" strokeDasharray="4 4"/></svg>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[720px] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" 
        style={{ backgroundColor: '#212226', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          {/* Top Bar */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors">
                <div className="w-[14px] h-[14px] bg-[#f54868] rounded-[3px] flex items-center justify-center border border-white/10 text-white text-[7px] font-bold">C</div>
                <span>CYJ</span>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-text-primary">New issue</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <button type="button" className="p-1 hover:text-white transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></button>
              <button type="button" onClick={onClose} className="p-1 hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
            </div>
          </div>

          {/* Inputs */}
          <div className="px-5 py-2 flex flex-col gap-2">
            <input 
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Issue title"
              className="w-full bg-transparent text-[18px] font-medium text-white placeholder:text-text-muted focus:outline-none"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full bg-transparent text-[14px] text-white placeholder:text-text-muted focus:outline-none resize-none min-h-[120px]"
            />
          </div>
          
          {/* Bottom Bar */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-white/5 mt-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-[12px] text-text-secondary bg-white/[0.02]">
                {statusIcon}
                <span>Todo</span>
              </button>
              
              <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-[12px] text-text-secondary bg-white/[0.02]">
                <span className="opacity-50">---</span>
                <span>Priority</span>
              </button>
              
              <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-[12px] text-text-primary bg-white/[0.02]">
                <div className="w-[14px] h-[14px] rounded-full bg-[#f54868] flex items-center justify-center text-white text-[7px] font-bold tracking-tighter">CY</div>
                <span>cyruskjones</span>
              </button>

              <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-[12px] text-text-secondary bg-white/[0.02]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M11 20 20 11a2.83 2.83 0 0 0 0-4L17 4a2.83 2.83 0 0 0-4 0L4 13v7h7Z"/><path d="M7 17h.01"/></svg>
                <span>Labels</span>
              </button>

              <button type="button" className="flex items-center justify-center w-[26px] h-[26px] rounded-full border border-white/10 hover:bg-white/5 transition-colors text-text-secondary bg-white/[0.02]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`relative w-[28px] h-[16px] rounded-full transition-colors ${createMore ? 'bg-accent' : 'bg-white/20'}`}>
                  <div className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] bg-white rounded-full transition-transform ${createMore ? 'translate-x-[12px]' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={createMore} 
                  onChange={e => setCreateMore(e.target.checked)} 
                />
                <span className="text-[12px] text-text-muted group-hover:text-text-secondary transition-colors select-none">Create more</span>
              </label>
              
              <button 
                type="submit" 
                disabled={loading || !title.trim()}
                className="px-4 py-1.5 rounded-full font-medium text-[13px] bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? 'Creating...' : 'Create issue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
