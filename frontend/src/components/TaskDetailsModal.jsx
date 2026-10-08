import { useState, useEffect } from 'react';
import { XSquare, MessageSquare, Send, Calendar, User, FileText, Star } from 'lucide-react';
import { api } from '../lib/api';
import posthog from '../lib/posthog';

export default function TaskDetailsModal({ isOpen, onClose, taskId, onTaskUpdated }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const taskData = await api.get(`/tasks/${taskId}`);
      setTask(taskData);
      const commentsData = await api.get(`/comments/task/${taskId}`);
      setComments(commentsData);
      posthog.capture('task_viewed', { task_id: taskId, project_id: taskData.project_id });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const addedComment = await api.post('/comments', {
        task_id: taskId,
        content: newComment
      });
      setComments([...comments, addedComment]);
      setNewComment('');
      posthog.capture('comment_added', { task_id: taskId });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (e) => {
    const newStatus = e.target.value;
    try {
      const updatedTask = await api.put(`/tasks/${taskId}`, { ...task, status: newStatus });
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePriority = async (e) => {
    const newPriority = e.target.value;
    try {
      const updatedTask = await api.put(`/tasks/${taskId}`, { ...task, priority: newPriority });
      setTask(updatedTask);
      if (onTaskUpdated) onTaskUpdated(updatedTask);
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-surface border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
               <FileText size={20} />
             </div>
             <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {loading ? 'Loading...' : `Task #${task?.id}`}
                </h2>
                <div className="text-sm text-text-secondary">Project ID: {task?.project_id}</div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            <XSquare size="medium" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-8 text-center text-text-secondary">Loading details...</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left side: Main Content */}
            <div className="flex-1 border-r border-border flex flex-col overflow-y-auto">
              <div className="p-6">
                <h1 className="text-xl font-semibold text-text-primary mb-4">{task?.title}</h1>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    Description
                  </h3>
                  <div className="text-[13px] text-text-secondary bg-surface-elevated p-4 rounded-lg min-h-[100px] whitespace-pre-wrap">
                    {task?.description || "No description provided."}
                  </div>
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
                    <MessageSquare size={16} /> Activity & Comments
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-accent/20 flex flex-shrink-0 items-center justify-center text-accent text-xs font-bold">
                           {comment.user_name?.charAt(0)}
                         </div>
                         <div className="flex-1 bg-surface-elevated p-3 rounded-lg rounded-tl-none">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[12px] font-medium text-text-primary">{comment.user_name}</span>
                              <span className="text-[10px] text-text-muted">{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <div className="text-[13px] text-text-secondary">
                              {comment.content}
                            </div>
                         </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-[13px] text-text-muted text-center py-4">No comments yet. Be the first to start the discussion!</div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Right side: Properties */}
            <div className="w-[280px] bg-surface-elevated flex-shrink-0 flex flex-col">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                 <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Status</label>
                    <select 
                      value={task?.status}
                      onChange={handleUpdateStatus}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Priority</label>
                    <select 
                      value={task?.priority}
                      onChange={handleUpdatePriority}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Assignee</label>
                    <div className="flex items-center gap-2 p-2 rounded bg-surface border border-border">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                        {task?.assignee_name ? task.assignee_name.charAt(0) : '?'}
                      </div>
                      <span className="text-[13px] text-text-primary">{task?.assignee_name || 'Unassigned'}</span>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">Due Date</label>
                    <div className="flex items-center gap-2 p-2 rounded bg-surface border border-border text-text-primary text-[13px]">
                      <Calendar size="small" />
                      {task?.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </div>
                 </div>
              </div>

              {/* Comment Input Sticky at Bottom of Right Sidebar or Main Area - putting it in main area bottom is better, but this layout has split. We'll stick it to the bottom of the left pane. */}
            </div>
            
            {/* Fix Comment Input to left pane */}
            <div className="absolute bottom-0 left-0 w-[calc(100%-280px)] border-t border-border bg-surface p-4">
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-surface-elevated border border-border rounded-lg px-4 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size="small" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
