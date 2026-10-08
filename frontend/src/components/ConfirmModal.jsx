import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/registry/components/button/button';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if (e.key === 'Enter' && isOpen) onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-[#1a1b1e] border border-[#2a2a2a] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-[14px] font-semibold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="text-[#85868a] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <p className="text-[13px] text-[#a1a1aa] leading-relaxed">
            {message}
          </p>
          
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={onClose} className="text-[13px] h-8">
              {cancelText}
            </Button>
            <Button 
              variant="primary" 
              onClick={onConfirm} 
              className={`text-[13px] h-8 ${isDanger ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none' : ''}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
