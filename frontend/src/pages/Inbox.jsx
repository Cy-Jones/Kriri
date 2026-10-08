import { useState, useEffect } from 'react';
import { CheckCircle, Bell } from 'lucide-react';
import { api } from '../lib/api';
import { useUser } from '@clerk/clerk-react';

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { organization, isLoaded } = useUser();

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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-full w-full min-w-0 min-h-0 animate-in fade-in duration-300">
      
      {/* Header - Full Width */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white tracking-tight">Inbox</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-500/20">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-xs text-text-muted hover:text-white transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Content - Centered */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full pb-20 pt-6 px-4">

        {loading ? (
          <div className="text-text-muted text-sm py-10 text-center">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden mb-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/20 blur-xl rounded-full" />
              <CheckCircle size={28} className="text-[#8a8f98]" />
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight mb-2">You're all caught up.</h2>
            <p className="text-[14px]">No new notifications or mentions at the moment.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.is_read 
                    ? 'bg-transparent border-transparent opacity-60' 
                    : 'bg-surface-elevated border-border shadow-sm hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${notif.is_read ? 'bg-transparent' : 'bg-blue-500'}`} />
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-sm font-medium text-white">{notif.title}</p>
                    <p className="text-[13px] text-text-muted">{notif.message}</p>
                    <span className="text-[11px] text-text-tertiary mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
