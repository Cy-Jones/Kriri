import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Search,
} from "lucide-react";
import { api } from "../../lib/api";
import { KririAgentIcon } from "./KririAgentIcon";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatHistoryPopover({
  isOpen,
  onClose,
  onSelectConversation,
  onNewChat,
}) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ai/conversations");
      setConversations(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-11 right-3 sm:right-4 z-50 w-[280px] bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.85)] p-1.5 select-none text-zinc-900 dark:text-[#f4f4f5]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
            <div className="flex items-center gap-1.5">
              <KririAgentIcon size={18} strokeWidth={1.85} className="text-zinc-400 dark:text-[#8a8f98]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-[#71717a]">
                Chat History
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onNewChat?.();
                onClose?.();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 dark:text-[#c4c7cc] hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Plus size={11} strokeWidth={2.4} />
              <span>New chat</span>
            </button>
          </div>

          {/* Search input if > 3 chats */}
          {conversations.length > 3 && (
            <div className="px-1 pb-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                <Search size={11} className="text-zinc-400 dark:text-[#71717a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-transparent text-[11.5px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#6f737c] focus:outline-none w-full"
                />
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="max-h-[260px] overflow-y-auto space-y-[2px] custom-scrollbar my-1">
            {loading ? (
              <div className="flex flex-col gap-1 p-1 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.06] flex items-center px-2">
                    <div className="w-3/4 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 dark:text-[#71717a]">
                {searchQuery ? "No matching chats" : "No past chats yet"}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation?.(conv.id);
                    onClose?.();
                  }}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[12.5px] text-zinc-700 dark:text-[#c4c7cc] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare size={12} className="text-zinc-400 dark:text-[#71717a] shrink-0" />
                    <span className="truncate">{conv.title || "Untitled Conversation"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10.5px] font-mono text-zinc-400 dark:text-[#71717a]">
                      {formatRelativeTime(conv.updated_at || conv.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 rounded transition-opacity cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="h-[1px] bg-black/[0.06] dark:bg-white/[0.06] my-1" />

          {/* Footer */}
          <button
            type="button"
            onClick={() => {
              navigate("/agent");
              onClose?.();
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[12px] text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <ExternalLink size={12} />
              <span>Open Agent workspace</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.08] text-zinc-400 dark:text-[#71717a]">
              ⌘J
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
