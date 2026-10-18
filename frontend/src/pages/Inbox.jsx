import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useUser, useOrganization } from "@clerk/clerk-react";
import {
  Check,
  CheckCheck,
  CheckCircle2,
  CircleDot,
  ListFilter,
  SlidersHorizontal,
  MoreHorizontal,
  Clock,
  ChevronDown,
  ChevronRight,
  User,
  Box,
  Signal,
  Circle,
  Inbox as InboxIconLucide,
  Menu,
  ArrowLeft,
  MessageSquare,
  FolderKanban,
  BellOff,
  Send,
  AtSign,
  RotateCw,
  UserCheck,
  Link,
  Copy,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useListShortcuts } from "../hooks/useListShortcuts";
import PageLoading from "../components/PageLoading";
import { Lockers, Riffle } from "@lucasmarkes/hairline/react";
import { Avatar } from "@/registry/components/avatar/avatar";
import { Badge } from "@/registry/components/badge/badge";
import { Button } from "@/registry/components/button/button";
import ActionTooltip from "../components/ActionTooltip";

const formatDetailDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const IssueIcon = ({ size = 16, className = "" }) => (
  <CircleDot size={size} className={className} strokeWidth={1.75} />
);

const NotificationIcon = ({ notif, type, title = "", size = 14, className = "" }) => {
  const notifType = (notif?.type || type || "").toLowerCase();
  const notifTitle = (notif?.title || title || "").toLowerCase();

  // 1. Mentions (@mention in comment)
  if (
    notifType === "mention" ||
    notifType.includes("mention") ||
    notifTitle.includes("mentioned")
  ) {
    return <AtSign size={size} className={`text-sky-400 ${className}`} strokeWidth={1.75} />;
  }

  // 2. Issue Completed
  if (
    notifType === "task_completed" ||
    notifType.includes("completed") ||
    notifTitle.includes("completed") ||
    notifTitle.includes("resolved") ||
    notifTitle.includes("closed")
  ) {
    return <CheckCircle2 size={size} className={`text-emerald-400 ${className}`} strokeWidth={1.75} />;
  }

  // 3. Status Changed (e.g. In Progress, active execution)
  if (
    notifType === "status_change" ||
    notifType.includes("status") ||
    notifTitle.includes("status") ||
    notifTitle.includes("changed")
  ) {
    return <RotateCw size={size} className={`text-[#f2994a] ${className}`} strokeWidth={1.75} />;
  }

  // 4. Assignments
  if (
    notifType === "assignment" ||
    notifType === "task_assigned" ||
    notifType.includes("assign") ||
    notifTitle.includes("assigned")
  ) {
    return <UserCheck size={size} className={`text-[#60a5fa] ${className}`} strokeWidth={1.75} />;
  }

  // 5. Comments
  if (
    notifType === "task_comment" ||
    notifType === "comment" ||
    notifType.includes("comment") ||
    notifTitle.includes("commented")
  ) {
    return <MessageSquare size={size} className={`text-[#8a8f98] ${className}`} strokeWidth={1.75} />;
  }

  return <CircleDot size={size} className={className} strokeWidth={1.75} />;
};

const NotificationTypeIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="10" height="10" rx="2" />
    <circle cx="10" cy="6" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const Toggle = ({ active, onChange }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      if (onChange) onChange(!active);
    }}
    className={`w-[28px] h-[16px] rounded-full relative transition-colors cursor-pointer outline-none ${active ? "bg-white" : "bg-white/[0.15]"}`}
  >
    <div
      className={`absolute top-[2px] w-[12px] h-[12px] rounded-full transition-transform shadow-sm ${active ? "translate-x-[14px] bg-black" : "translate-x-[2px] bg-white"}`}
    />
  </button>
);

const SelectDropdown = ({ value, options = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-between gap-2 pl-2.5 pr-1.5 py-[3px] rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[#e8e8e8] text-[12px] font-medium transition-colors outline-none min-w-[60px]"
      >
        {value}
        <ChevronDown size={14} className="text-[#8a8f98]" strokeWidth={2.5} />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute top-full right-0 mt-1 z-[70] min-w-[140px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-1 flex flex-col text-[13px]">
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onChange) onChange(opt);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] text-[#e8e8e8] hover:text-white transition-colors flex items-center justify-between group/opt"
              >
                {opt}
                {opt === value && (
                  <Check
                    size={14}
                    className="text-[#8a8f98] group-hover/opt:text-white"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};



const EmptyInboxIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
    <path d="M3 8l6.5-6h5l6.5 6" />
    <path d="M12 11v6" />
    <path d="M9 14h6" />
  </svg>
);

export default function Inbox() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  // Filter & Display States
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [activeFilterSubmenu, setActiveFilterSubmenu] = useState(null);

  const [filterState, setFilterState] = useState({
    types: [],
    teammates: [],
    projects: [],
  });

  const [allTeammates, setAllTeammates] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  const uniqueTeammates = useMemo(() => {
    const teammates = notifications.map((n) => n.actor_name).filter(Boolean);
    return [...new Set(teammates)].sort();
  }, [notifications]);

  const uniqueProjects = useMemo(() => {
    const projects = notifications.map((n) => n.project_name).filter(Boolean);
    return [...new Set(projects)].sort();
  }, [notifications]);

  const [displayOptions, setDisplayOptions] = useState({
    priorityInbox: true,
    includeInPriority: "All",
    badgeCount: "Priority & Other",
    groupUnreadsBy: "No grouping",
    ordering: "Newest",
    showSnoozed: true,
    showUnreadFirst: true,
  });

  const { user, isLoaded, isSignedIn } = useUser();
  const { organization } = useOrganization();

  const fetchFilterData = async () => {
    try {
      const [membersRes, projectsRes] = await Promise.all([
        organization
          ? api.get(`/workspaces/${organization.id}/members`)
          : Promise.resolve([]),
        api.get("/projects", { noCache: true }),
      ]);
      const members = Array.isArray(membersRes)
        ? membersRes
        : membersRes.data?.members || [];
      const teammates = members
        .map((m) => {
          if (m.user?.name) return m.user.name;
          if (m.user?.firstName)
            return `${m.user.firstName} ${m.user.lastName || ""}`.trim();
          return m.email;
        })
        .filter(Boolean);
      setAllTeammates([...new Set(teammates)].sort());
      setAllProjects(
        [...new Set(Array.isArray(projectsRes) ? projectsRes.map((p) => p.name).filter(Boolean) : [])].sort(),
      );
    } catch (err) {
      console.error("Failed to fetch filter data", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get("/workspaces/current/notifications", { noCache: true });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotifications([]);
      if (!error?.message?.includes("Unauthorized")) {
        console.error("Failed to fetch notifications", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications([]);
    setSelectedNotifId(null);
    setActiveIndex(null);

    if (isLoaded && isSignedIn && user) {
      fetchNotifications();
      fetchFilterData();
    }
  }, [organization?.id, isLoaded, isSignedIn, user?.id]);

  const markAsRead = async (id, status = true) => {
    try {
      await api.patch(`/workspaces/current/notifications/${id}/read`, { is_read: status });
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: status } : n)),
      );
    } catch (err) {
      console.error("Failed to mark read/unread", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/workspaces/current/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleSelect = (notif, idx) => {
    if (!notif) return;
    setSelectedNotifId(notif.id);
    if (idx !== undefined) {
      setActiveIndex(idx);
    }
    if (!notif.is_read) {
      markAsRead(notif.id, true);
    }
  };

  const handleBackToList = () => {
    setSelectedNotifId(null);
    setActiveIndex(null);
  };

  useEffect(() => {
    const handleInboxShortcuts = (e) => {
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;

      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          setFilterOpen((prev) => !prev);
          setDisplayOpen(false);
          setActiveFilterSubmenu(null);
        } else if (e.key.toLowerCase() === "o") {
          e.preventDefault();
          setDisplayOpen((prev) => !prev);
          setFilterOpen(false);
          setActiveFilterSubmenu(null);
        } else if (e.key.toLowerCase() === "e") {
          if (selectedNotifId) {
            e.preventDefault();
            const curr = notifications.find((n) => String(n.id) === String(selectedNotifId));
            if (curr) {
              markAsRead(curr.id, !curr.is_read);
            }
          }
        } else if (e.key === "Escape") {
          if (selectedNotifId) {
            e.preventDefault();
            handleBackToList();
          }
        }
      }
    };
    window.addEventListener("keydown", handleInboxShortcuts);
    return () => window.removeEventListener("keydown", handleInboxShortcuts);
  }, [selectedNotifId, notifications]);

  const toggleFilter = (category, val) => {
    setFilterState((prev) => {
      const arr = prev[category];
      const newArr = arr.includes(val)
        ? arr.filter((t) => t !== val)
        : [...arr, val];
      return { ...prev, [category]: newArr };
    });
  };

  const filteredNotifications = notifications
    .filter((n) => {
      if (filter === "unread" && n.is_read) return false;

      if (filterState.types.length > 0) {
        const typeMapping = {
          task_assigned: "Assignments",
          task_comment: "Comments",
          task_completed: "Status changes",
        };
        const mappedType = typeMapping[n.type];
        if (!mappedType || !filterState.types.includes(mappedType)) {
          return false;
        }
      }

      if (filterState.teammates.length > 0) {
        if (!n.actor_name || !filterState.teammates.includes(n.actor_name))
          return false;
      }

      if (filterState.projects.length > 0) {
        if (!n.project_name || !filterState.projects.includes(n.project_name))
          return false;
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

      if (displayOptions.ordering === "Oldest") {
        return dateA - dateB;
      }
      return dateB - dateA;
    });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const selectedNotif = notifications.find(
    (n) => String(n.id) === String(selectedNotifId),
  );

  const navigate = useNavigate();
  const [taskDetail, setTaskDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const replyInputRef = useRef(null);

  const handleCopyLink = () => {
    const url =
      selectedNotif?.entity_type === "task" && selectedNotif?.entity_id
        ? `${window.location.origin}/kanban?task=${selectedNotif.entity_id}`
        : `${window.location.origin}/inbox`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setOptionsMenuOpen(false);
    }, 1200);
  };

  const handleCopyKey = () => {
    const key =
      taskDetail?.project_identifier ||
      selectedNotif?.project_identifier ||
      (selectedNotif?.entity_type === "task"
        ? `KRI-${selectedNotif.entity_id}`
        : `NOTIF-${selectedNotif?.id || "0"}`);
    navigator.clipboard?.writeText(key);
    setCopiedKey(true);
    setTimeout(() => {
      setCopiedKey(false);
      setOptionsMenuOpen(false);
    }, 1200);
  };

  const handleSnooze = () => {
    if (selectedNotif?.id) {
      markAsRead(selectedNotif.id, true);
    }
    setOptionsMenuOpen(false);
  };

  const handleDeleteNotif = async () => {
    setOptionsMenuOpen(false);
    if (!selectedNotif?.id) return;
    try {
      await api.delete(`/workspaces/current/notifications/${selectedNotif.id}`);
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
    setSelectedNotifId(null);
  };

  useEffect(() => {
    if (!selectedNotif?.entity_id || selectedNotif?.entity_type !== "task") {
      setTaskDetail(null);
      setComments([]);
      return;
    }

    const loadTaskContext = async () => {
      try {
        const [taskRes, commentsRes] = await Promise.allSettled([
          api.get(`/tasks/${selectedNotif.entity_id}`),
          api.get(`/comments/task/${selectedNotif.entity_id}`),
        ]);
        if (taskRes.status === "fulfilled" && taskRes.value) {
          setTaskDetail(taskRes.value);
        }
        if (commentsRes.status === "fulfilled" && Array.isArray(commentsRes.value)) {
          setComments(commentsRes.value);
        }
      } catch (e) {
        // ignore
      }
    };
    loadTaskContext();
  }, [selectedNotif?.id, selectedNotif?.entity_id]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedNotif?.entity_id || isSubmittingReply) return;
    try {
      setIsSubmittingReply(true);
      const res = await api.post("/comments", {
        task_id: selectedNotif.entity_id,
        content: replyText.trim(),
      });
      if (res) {
        setComments((prev) => [
          ...prev,
          {
            ...res,
            user_name: user?.fullName || "You",
            avatar_url: user?.imageUrl,
          },
        ]);
        setReplyText("");
        if (replyInputRef.current) {
          replyInputRef.current.style.height = "auto";
        }
      }
    } catch (err) {
      console.error("Failed to post reply", err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  useListShortcuts({
    items: filteredNotifications,
    activeIndex,
    setActiveIndex,
    onOpenItem: (notif) => handleSelect(notif),
  });

  if (loading) {
    return <PageLoading label="Inbox" />;
  }

  return (
    <div className="flex h-full w-full bg-black md:bg-[#131416] text-[#e8e8e8] text-[13px] font-sans antialiased">
      {/* Left Sidebar */}
      <div
        className={`w-full md:w-[320px] md:flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-transparent relative z-10 ${selectedNotif ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
              className="md:hidden p-1.5 -ml-1 text-[#8a8f98] hover:text-white rounded-md hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-white">
              Inbox
            </h1>
            {unreadCount > 0 && (
              <Badge tone="neutral" size="sm" className="h-5 px-1.5 font-mono text-[11px]">
                {unreadCount}
              </Badge>
            )}
            <button className="h-6 w-6 flex items-center justify-center rounded-[4px] text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8] transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() =>
                  setFilter(filter === "unread" ? "all" : "unread")
                }
                className={`h-[24px] w-[24px] flex items-center justify-center rounded-md transition-all ${
                  filter === "unread"
                    ? "text-white bg-white/10 hover:bg-white/15"
                    : "text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8]"
                }`}
              >
                <InboxIconLucide size={14} strokeWidth={2} />
              </button>
              <div
                className={`absolute top-full mt-1.5 items-center whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50 ${filter === "unread" ? "hidden" : "hidden group-hover:flex"}`}
              >
                <span className="text-[12px] font-medium text-[#e8e8e8]">
                  Show unreads only
                </span>
              </div>
            </div>

            <div className="relative group flex items-center justify-center">
              <button
                onClick={() => {
                  setFilterOpen(!filterOpen);
                  setDisplayOpen(false);
                  setActiveFilterSubmenu(null);
                }}
                className={`h-[24px] w-[24px] flex items-center justify-center rounded-md transition-colors ${
                  filterOpen
                    ? "bg-white/[0.08] text-[#e8e8e8]"
                    : "text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8]"
                }`}
              >
                <ListFilter size={15} strokeWidth={2} />
              </button>
              <div
                className={`absolute top-full mt-1.5 items-center gap-1.5 whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50 ${filterOpen ? "hidden" : "hidden group-hover:flex"}`}
              >
                <span className="text-[12px] font-medium text-[#e8e8e8]">
                  Add Filter
                </span>
                <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">
                  F
                </kbd>
              </div>
              {filterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setFilterOpen(false);
                      setActiveFilterSubmenu(null);
                    }}
                  />
                  <div className="absolute top-full right-0 mt-1.5 z-50 w-[240px] max-w-[calc(100vw-24px)] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col text-[13px]">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
                      <input
                        type="text"
                        placeholder="Add Filter..."
                        className="bg-transparent text-[#e8e8e8] placeholder-[#8a8f98] outline-none text-[13px] w-full font-medium"
                        autoFocus
                      />
                      <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">
                        F
                      </kbd>
                    </div>
                    <div
                      className="py-1 relative"
                      onMouseLeave={() => setActiveFilterSubmenu(null)}
                    >
                      {[
                        {
                          label: "Notification type",
                          icon: <NotificationTypeIcon size={14} />,
                        },
                        { label: "Teammate", icon: <User size={14} /> },
                        { label: "Project", icon: <Box size={14} /> },
                      ].map((item, idx) => {
                        const isSubOpen = activeFilterSubmenu === item.label;
                        const subOptions =
                          item.label === "Notification type"
                            ? ["Assignments", "Comments", "Status changes"]
                            : item.label === "Teammate"
                              ? allTeammates
                              : item.label === "Project"
                                ? allProjects
                                : [];
                        const category =
                          item.label === "Notification type"
                            ? "types"
                            : item.label === "Teammate"
                              ? "teammates"
                              : "projects";

                        return (
                          <div key={idx} className="flex flex-col">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterSubmenu(isSubOpen ? null : item.label);
                              }}
                              onMouseEnter={() =>
                                setActiveFilterSubmenu(item.label)
                              }
                              className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors text-left group/item cursor-pointer ${isSubOpen ? "bg-white/[0.06]" : "hover:bg-white/[0.06]"}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`transition-colors ${isSubOpen ? "text-[#e8e8e8]" : "text-[#8a8f98] group-hover/item:text-[#e8e8e8]"}`}
                                >
                                  {item.icon}
                                </div>
                                <span className="text-[#e8e8e8]">{item.label}</span>
                              </div>
                              <ChevronRight
                                size={14}
                                className={`transition-all duration-200 ${isSubOpen ? "rotate-90 text-[#e8e8e8]" : "text-[#8a8f98] group-hover/item:opacity-100"}`}
                              />
                            </div>

                            {/* Mobile inline accordion */}
                            {isSubOpen && (
                              <div className="md:hidden flex flex-col py-1 pl-4 pr-1 bg-white/[0.02] border-y border-white/[0.04]">
                                {subOptions.map((sub) => {
                                  const isChecked = filterState[category]?.includes(sub);
                                  return (
                                    <button
                                      key={sub}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFilter(category, sub);
                                      }}
                                      className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer outline-none"
                                    >
                                      <div
                                        className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${isChecked ? "bg-white border-white" : "border-white/[0.2]"}`}
                                      >
                                        {isChecked && (
                                          <Check
                                            size={10}
                                            className="text-black stroke-[3]"
                                          />
                                        )}
                                      </div>
                                      <span className="text-[#e8e8e8] text-[12.5px] select-none truncate">
                                        {sub}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Desktop flyout inward */}
                      {activeFilterSubmenu && (
                        <div className="hidden md:flex absolute top-0 right-[calc(100%+6px)] w-[220px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex-col text-[13px] overflow-hidden z-50">
                          <div className="flex items-center px-3 py-2 border-b border-white/[0.08]">
                            <input
                              type="text"
                              placeholder="Filter..."
                              className="bg-transparent text-[#e8e8e8] placeholder-[#8a8f98] outline-none text-[13px] w-full font-medium"
                            />
                          </div>
                          <div className="py-1 max-h-56 overflow-y-auto">
                            {(activeFilterSubmenu === "Notification type"
                              ? ["Assignments", "Comments", "Status changes"]
                              : activeFilterSubmenu === "Teammate"
                                ? allTeammates
                                : activeFilterSubmenu === "Project"
                                  ? allProjects
                                  : []
                            ).map((sub) => {
                              const category =
                                activeFilterSubmenu === "Notification type"
                                  ? "types"
                                  : activeFilterSubmenu === "Teammate"
                                    ? "teammates"
                                    : "projects";
                              const isChecked =
                                filterState[category].includes(sub);
                              return (
                                <button
                                  key={sub}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFilter(category, sub);
                                  }}
                                  className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.06] cursor-pointer outline-none"
                                >
                                  <div
                                    className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${isChecked ? "bg-white border-white" : "border-white/[0.2]"}`}
                                  >
                                    {isChecked && (
                                      <Check
                                        size={10}
                                        className="text-black stroke-[3]"
                                      />
                                    )}
                                  </div>
                                  <span className="text-[#e8e8e8] text-[13px] select-none">
                                    {sub}
                                  </span>
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
                onClick={() => {
                  setDisplayOpen(!displayOpen);
                  setFilterOpen(false);
                  setActiveFilterSubmenu(null);
                }}
                className={`h-[24px] w-[24px] flex items-center justify-center rounded-md transition-colors ${
                  displayOpen
                    ? "bg-white/[0.08] text-[#e8e8e8]"
                    : "text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#e8e8e8]"
                }`}
              >
                <SlidersHorizontal size={14} strokeWidth={2.2} />
              </button>
              <div
                className={`absolute top-full mt-1.5 left-0 items-center gap-1.5 whitespace-nowrap px-2 py-1 bg-[#232429] border border-white/[0.08] rounded shadow-xl z-50 ${displayOpen ? "hidden" : "hidden group-hover:flex"}`}
              >
                <span className="text-[12px] font-medium text-[#e8e8e8]">
                  Show display options
                </span>
                <div className="flex gap-0.5">
                  <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">
                    ↑
                  </kbd>
                  <kbd className="h-[18px] px-1.5 rounded-[3px] flex items-center justify-center bg-white/[0.08] text-[10px] text-[#8a8f98] font-sans font-medium border border-white/[0.04]">
                    V
                  </kbd>
                </div>
              </div>
              {displayOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDisplayOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-1.5 z-50 w-[280px] bg-[#232429] border border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-1.5 flex flex-col text-[13px]">
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#e8e8e8] font-medium">
                        Enable priority inbox
                      </span>
                      <Toggle
                        active={displayOptions.priorityInbox}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            priorityInbox: val,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">
                        Include in priority inbox
                      </span>
                      <SelectDropdown
                        value={displayOptions.includeInPriority}
                        options={["All", "Unread", "Mentions"]}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            includeInPriority: val,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Badge count</span>
                      <SelectDropdown
                        value={displayOptions.badgeCount}
                        options={["Priority & Other", "Priority only", "None"]}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            badgeCount: val,
                          }))
                        }
                      />
                    </div>

                    <div className="my-1.5 h-[1px] bg-white/[0.04]" />

                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Group unreads by</span>
                      <SelectDropdown
                        value={displayOptions.groupUnreadsBy}
                        options={[
                          "No grouping",
                          "Project",
                          "Status",
                          "Priority",
                        ]}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            groupUnreadsBy: val,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#8a8f98]">Ordering</span>
                      <SelectDropdown
                        value={displayOptions.ordering}
                        options={["Newest", "Oldest", "Priority"]}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            ordering: val,
                          }))
                        }
                      />
                    </div>

                    <div className="my-1.5 h-[1px] bg-white/[0.04]" />

                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#e8e8e8] font-medium">
                        Show snoozed
                      </span>
                      <Toggle
                        active={displayOptions.showSnoozed}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            showSnoozed: val,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 hover:bg-white/[0.04]">
                      <span className="text-[#e8e8e8] font-medium">
                        Show unread first
                      </span>
                      <Toggle
                        active={displayOptions.showUnreadFirst}
                        onChange={(val) =>
                          setDisplayOptions((prev) => ({
                            ...prev,
                            showUnreadFirst: val,
                          }))
                        }
                      />
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
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[60px] rounded bg-white/[0.02] animate-pulse"
                />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8a8f98] gap-4">
              <div className="w-40 h-40 relative overflow-visible">
                <Lockers theme="dark" intensity={0.5} className="w-full h-full opacity-60" />
              </div>
              <span className="text-[13px]">All caught up</span>
            </div>
          ) : (
            <div className="flex flex-col py-1">
              {filteredNotifications.map((notif, idx) => {
                const isSelected = Boolean(
                  selectedNotifId && String(selectedNotifId) === String(notif.id),
                );
                const isActive = Boolean(selectedNotifId && activeIndex === idx);
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={notif.id}
                    onClick={() => {
                      handleSelect(notif, idx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(notif, idx);
                      }
                    }}
                    className={`w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-colors relative group outline-none cursor-pointer border-b border-white/[0.03] select-none ${
                      isSelected || isActive
                        ? "bg-white/[0.07]"
                        : "hover:bg-white/[0.035] active:bg-white/[0.05]"
                    } ${isActive ? "ring-1 ring-inset ring-white/10" : ""}`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    )}
                    <div className="mt-0.5 flex-shrink-0 text-[#8a8f98] group-hover:text-[#e8e8e8] transition-colors">
                      <NotificationIcon notif={notif} size={14} />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-baseline gap-2 transition-[padding] duration-150 group-hover:pr-20">
                        <span
                          className={`truncate text-[13px] tracking-tight ${
                            notif.is_read
                              ? "text-[#8a8f98] font-normal"
                              : "text-[#e8e8e8] font-medium"
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span
                          className={`text-[12px] flex-shrink-0 tabular-nums transition-opacity duration-150 ${
                            notif.is_read ? "text-[#8a8f98] opacity-60" : "text-[#8a8f98] opacity-100"
                          } group-hover:opacity-0`}
                        >
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span
                        className={`text-[13px] truncate block mt-0.5 ${
                          notif.is_read ? "text-[#8a8f98] opacity-70" : "text-[#8a8f98]"
                        }`}
                      >
                        {notif.message}
                      </span>
                    </div>
                    {!notif.is_read && (
                      <div className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-white mt-2 transition-opacity group-hover:opacity-0 shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                    )}

                    {/* Hover Actions Pill - positioned cleanly at top right aligned with first line */}
                    <div
                      className="absolute right-2.5 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-[#1a1b1f] border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] rounded-md p-0.5 transition-all duration-150 z-20 pointer-events-none group-hover:pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id, !notif.is_read);
                        }}
                        title={notif.is_read ? "Mark as unread" : "Mark as read"}
                        className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                      >
                        {notif.is_read ? (
                          <CheckCheck size={13} className="text-emerald-400" />
                        ) : (
                          <Check size={13} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        title="Snooze"
                        className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                      >
                        <Clock size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        title="More options"
                        className="h-6 w-6 flex items-center justify-center rounded-[4px] hover:bg-white/[0.08] text-[#8a8f98] hover:text-[#e8e8e8] transition-colors"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane */}
      <div
        className={`flex-1 flex flex-col bg-transparent overflow-hidden relative z-0 ${selectedNotif ? "flex" : "hidden md:flex"}`}
      >
        {selectedNotif ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Bar Navigation & Actions (Linear Header) */}
            <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-6 bg-[#131416]/90 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 mr-2">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="md:hidden shrink-0 flex items-center gap-1 text-xs text-[#8a8f98] hover:text-white px-2 py-1 -ml-1 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  <ArrowLeft size={15} className="shrink-0" />
                  <span className="font-medium">Back</span>
                </button>

                {/* Linear Breadcrumbs */}
                <div className="min-w-0 flex items-center gap-1.5 text-[12px] font-medium text-[#8a8f98] truncate">
                  {(taskDetail?.project_name || selectedNotif.project_name) && (
                    <>
                      <span className="hover:text-[#e8e8e8] transition-colors truncate max-w-[85px] sm:max-w-[160px]">
                        {taskDetail?.project_name || selectedNotif.project_name}
                      </span>
                      <span className="text-[#4e535e] shrink-0">/</span>
                    </>
                  )}
                  <span className="font-mono text-[#d0d3d9] truncate shrink-0">
                    {taskDetail?.project_identifier ||
                      selectedNotif.project_identifier ||
                      (selectedNotif.entity_type === "task"
                        ? `KRI-${selectedNotif.entity_id}`
                        : "NOTIFICATION")}
                  </span>
                </div>
              </div>

              {/* Options button: Sitting directly on the background without container box */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setOptionsMenuOpen((prev) => !prev)}
                  className={`p-1.5 flex items-center justify-center rounded-md text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/[0.06] transition-colors ${
                    optionsMenuOpen ? "text-[#e8e8e8] bg-white/[0.08]" : ""
                  }`}
                  title="Options"
                >
                  <MoreHorizontal size={16} />
                </button>

                  {optionsMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOptionsMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-52 py-1 bg-[#141517] border border-white/[0.1] rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Link size={13} className="text-[#8a8f98]" />
                            <span>Copy issue link</span>
                          </span>
                          {copiedLink && (
                            <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Copy size={13} className="text-[#8a8f98]" />
                            <span>Copy issue ID</span>
                          </span>
                          {copiedKey && (
                            <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
                          )}
                        </button>

                        {/* Open on Board -> /kanban */}
                        {Boolean(selectedNotif?.entity_id || taskDetail?.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              const tId = selectedNotif?.entity_id || taskDetail?.id;
                              if (!tId) return;
                              setOptionsMenuOpen(false);
                              navigate(`/kanban?task=${tId}`, { state: { taskId: tId } });
                            }}
                            className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                          >
                            <ExternalLink size={13} className="text-[#8a8f98]" />
                            <span>Open on Board</span>
                          </button>
                        )}

                        {/* Open in Issues -> /tasks */}
                        {Boolean(selectedNotif?.entity_id || taskDetail?.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              const tId = selectedNotif?.entity_id || taskDetail?.id;
                              if (!tId) return;
                              setOptionsMenuOpen(false);
                              navigate(`/tasks?task=${tId}`, { state: { taskId: tId } });
                            }}
                            className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                          >
                            <Box size={13} className="text-[#8a8f98]" />
                            <span>Open in Issues</span>
                          </button>
                        )}

                        {/* View Project -> /projects/:id if available, or /projects */}
                        {(selectedNotif.project_id || taskDetail?.project_id) && (
                          <button
                            type="button"
                            onClick={() => {
                              setOptionsMenuOpen(false);
                              const pId = selectedNotif.project_id || taskDetail?.project_id;
                              navigate(`/projects/${pId}`);
                            }}
                            className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                          >
                            <FolderKanban size={13} className="text-[#8a8f98]" />
                            <span>View Project</span>
                          </button>
                        )}

                        <div className="h-px bg-white/[0.08] my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            markAsRead(selectedNotif.id, !selectedNotif.is_read);
                            setOptionsMenuOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                        >
                          {selectedNotif.is_read ? (
                            <>
                              <CheckCheck size={13} className="text-emerald-400" />
                              <span>Mark as unread</span>
                            </>
                          ) : (
                            <>
                              <Check size={13} className="text-[#8a8f98]" />
                              <span>Mark as read</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSnooze}
                          className="w-full px-3 py-1.5 text-left text-[12.5px] text-[#d0d3d9] hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                        >
                          <Clock size={13} className="text-[#8a8f98]" />
                          <span>Snooze notification</span>
                        </button>

                        <div className="h-px bg-white/[0.08] my-1" />

                        <button
                          type="button"
                          onClick={handleDeleteNotif}
                          className="w-full px-3 py-1.5 text-left text-[12.5px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={13} className="text-rose-400" />
                          <span>Delete notification</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

            {/* Main Canvas: Sitting directly on the background, ZERO CARD CONTAINERS */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-5 sm:py-8">
              <div className="max-w-3xl w-full mx-auto">
                {/* Issue / Notification Identifier Header */}
                <div className="flex items-center gap-2 mb-2 text-[12px] font-mono text-[#8a8f98]">
                  <span>
                    {taskDetail?.project_identifier ||
                      selectedNotif.project_identifier ||
                      (selectedNotif.entity_type === "task"
                        ? `KRI-${selectedNotif.entity_id}`
                        : "INBOX")}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-[20px] sm:text-[25px] font-semibold text-[#f0f0f0] tracking-tight leading-snug">
                  {taskDetail?.title ||
                    selectedNotif.task_title ||
                    selectedNotif.title}
                </h1>

                {/* Linear Properties Ribbon using Arc Badges (Consistent 22px heights, no redundant project pill) */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {/* Status Badge */}
                  <Badge
                    tone={
                      (taskDetail?.status || "").toLowerCase() === "done"
                        ? "success"
                        : (taskDetail?.status || "").toLowerCase() === "in progress"
                          ? "warning"
                          : (taskDetail?.status || "").toLowerCase() === "in review"
                            ? "info"
                            : "neutral"
                    }
                    size="sm"
                    className="h-[22px] min-h-[22px]"
                    icon={
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          (taskDetail?.status || "").toLowerCase() === "done"
                            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                            : (taskDetail?.status || "").toLowerCase() === "in progress"
                              ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                              : (taskDetail?.status || "").toLowerCase() === "in review"
                                ? "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                                : "bg-zinc-400"
                        }`}
                      />
                    }
                  >
                    {taskDetail?.status || "In Progress"}
                  </Badge>

                  {/* Priority Badge */}
                  <Badge
                    tone="neutral"
                    size="sm"
                    className="h-[22px] min-h-[22px]"
                    icon={<Signal size={12} className="text-[#8a8f98] shrink-0" />}
                  >
                    {taskDetail?.priority || "Medium"}
                  </Badge>

                  {/* Assignee Badge: avatar sits flush in left corner, filling the space snugly with concentric margin */}
                  <Badge
                    tone="neutral"
                    size="sm"
                    className="h-[22px] min-h-[22px] !pl-[2px] !pr-2.5"
                    icon={
                      taskDetail?.assignee_avatar_url ? (
                        <img
                          src={taskDetail.assignee_avatar_url}
                          alt={taskDetail.assignee_name || "User"}
                          className="w-[18px] h-[18px] rounded-full object-cover shrink-0 ml-[1px]"
                        />
                      ) : (
                        <span className="w-[18px] h-[18px] rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 ml-[1px]">
                          <User size={11} className="text-[#8a8f98]" />
                        </span>
                      )
                    }
                  >
                    {taskDetail?.assignee_name || "Unassigned"}
                  </Badge>
                </div>

                {/* Hairline Divider */}
                <div className="h-px bg-white/[0.06] my-8" />

                {/* Activity Timeline Stream (Pure canvas text, NO card boxes) */}
                <div className="flex flex-col gap-6">
                  {/* Original Notification Event */}
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={selectedNotif.actor_name || "System"}
                      src={selectedNotif.actor_avatar}
                      size="sm"
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-medium text-[#f0f0f0]">
                          {selectedNotif.actor_name || "System"}
                        </span>
                        <span className="text-[13px] text-[#8a8f98]">
                          {selectedNotif.type === "mention" || selectedNotif.title?.toLowerCase().includes("mentioned")
                            ? "mentioned you in a comment"
                            : selectedNotif.type === "task_comment" || selectedNotif.type === "comment" || selectedNotif.title?.toLowerCase().includes("commented")
                              ? "commented on this issue"
                              : selectedNotif.type === "task_assigned" || selectedNotif.type === "assignment" || selectedNotif.title?.toLowerCase().includes("assigned")
                                ? "assigned you to this issue"
                                : selectedNotif.type === "task_completed" || selectedNotif.title?.toLowerCase().includes("completed")
                                  ? "completed this issue"
                                  : selectedNotif.type === "status_change" || selectedNotif.title?.toLowerCase().includes("status")
                                    ? "updated status"
                                    : selectedNotif.title}
                        </span>
                        <span className="text-[12px] text-[#6b6f76]">
                          {formatDetailDate(selectedNotif.created_at)}
                        </span>
                      </div>

                      {/* Message Content directly on the flat canvas */}
                      <div className="mt-2 text-[14px] text-[#d0d3d9] leading-relaxed whitespace-pre-wrap font-sans">
                        {selectedNotif.message}
                      </div>
                    </div>
                  </div>

                  {/* Task Comments Stream */}
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 pt-2">
                      <Avatar
                        name={c.user_name || "Teammate"}
                        src={c.avatar_url}
                        size="sm"
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-medium text-[#f0f0f0]">
                            {c.user_name || "Teammate"}
                          </span>
                          <span className="text-[12px] text-[#6b6f76]">
                            {formatDetailDate(c.created_at)}
                          </span>
                        </div>
                        <div className="mt-2 text-[14px] text-[#d0d3d9] leading-relaxed whitespace-pre-wrap font-sans">
                          {c.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Inline Reply Box (Linear Style) */}
                  {selectedNotif.entity_type === "task" &&
                    selectedNotif.entity_id && (
                      <div className="mt-6 pt-4 sm:pt-5 border-t border-white/[0.06] flex items-end gap-2.5 sm:gap-3 pb-6 sm:pb-2">
                        <Avatar
                          name={user?.fullName || user?.firstName || "You"}
                          src={user?.imageUrl}
                          size="sm"
                          className="flex-shrink-0 mb-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="relative flex items-end gap-2 sm:gap-2.5 rounded-[20px] bg-white/[0.02] border border-white/[0.08] focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all pl-3.5 sm:pl-4 pr-1.5 py-1.5 shadow-sm">
                            <textarea
                              ref={replyInputRef}
                              rows={1}
                              value={replyText}
                              onChange={(e) => {
                                setReplyText(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                              }}
                              onKeyDown={(e) => {
                                if (
                                  (e.metaKey || e.ctrlKey) &&
                                  e.key === "Enter"
                                ) {
                                  e.preventDefault();
                                  handleSendReply();
                                }
                              }}
                              placeholder="Leave a comment..."
                              className="flex-1 bg-transparent text-[13px] text-[#e8e8e8] placeholder-[#6b6f76] outline-none resize-none leading-relaxed py-1 min-h-[26px] max-h-[160px]"
                            />
                            <ActionTooltip label="Send comment" shortcut="⌘ ↵" side="top">
                              <span className="inline-flex mb-0.5 flex-shrink-0">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={
                                    !replyText.trim() || isSubmittingReply
                                  }
                                  loading={isSubmittingReply}
                                  onClick={handleSendReply}
                                  className="h-7 text-[12px] px-3.5 gap-1.5 flex-shrink-0 rounded-full"
                                >
                                  <Send size={12} />
                                  <span>Reply</span>
                                </Button>
                              </span>
                            </ActionTooltip>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-48 h-48 relative mb-2 overflow-visible">
              <Riffle
                theme="dark"
                intensity={0.7}
                className="w-full h-full text-[#8a8f98] opacity-70"
              />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-white">
              Inbox
            </h3>
            <p className="text-[13px] text-[#8a8f98] mt-1.5 max-w-[200px]">
              Select a notification to view its details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
