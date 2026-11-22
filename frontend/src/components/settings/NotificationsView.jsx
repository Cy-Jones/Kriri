import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  Calendar,
  Clock,
  Check,
  RotateCcw,
  Volume2,
  AlertTriangle,
  Inbox,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib/api";
import { playUiSound } from "../../lib/sound";
import { useNavigate } from "react-router-dom";

export default function NotificationsView() {
  const navigate = useNavigate();

  // Channels
  const [inAppNotifications, setInAppNotifications] = useState(
    () => localStorage.getItem("kriri-notif-inapp") !== "false"
  );
  const [emailNotifications, setEmailNotifications] = useState(
    () => localStorage.getItem("kriri-email-notifications") !== "false"
  );
  const [emailOnlyInactive, setEmailOnlyInactive] = useState(
    () => localStorage.getItem("kriri-email-only-inactive") === "true"
  );
  const [pushNotifications, setPushNotifications] = useState(false);
  const [pushStatus, setPushStatus] = useState("unsupported"); // 'default', 'granted', 'denied', 'unsupported'

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission);
      setPushNotifications(Notification.permission === "granted");
    }
  }, []);

  const handleRequestPush = async () => {
    if (!("Notification" in window)) {
      alert("Browser push notifications are not supported by this browser.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPushStatus(res);
      setPushNotifications(res === "granted");
      if (res === "granted") {
        playUiSound("success");
      }
    } catch (e) {
      console.warn("Push permission request error:", e);
    }
  };

  // Task Notifications
  const [notifyAssignments, setNotifyAssignments] = useState(
    () => localStorage.getItem("kriri-notif-assignments") !== "false"
  );
  const [notifyStatusChanges, setNotifyStatusChanges] = useState(
    () => localStorage.getItem("kriri-notif-status") !== "false"
  );
  const [notifyCompletions, setNotifyCompletions] = useState(
    () => localStorage.getItem("kriri-notif-completions") !== "false"
  );
  const [notifyDueDates, setNotifyDueDates] = useState(
    () => localStorage.getItem("kriri-notif-duedates") !== "false"
  );
  const [notifyOverdue, setNotifyOverdue] = useState(
    () => localStorage.getItem("kriri-notif-overdue") !== "false"
  );
  const [notifyPriority, setNotifyPriority] = useState(
    () => localStorage.getItem("kriri-notif-priority") === "true"
  );

  // Project Notifications
  const [notifyProjectCreated, setNotifyProjectCreated] = useState(
    () => localStorage.getItem("kriri-notif-proj-created") !== "false"
  );
  const [notifyProjectUpdated, setNotifyProjectUpdated] = useState(
    () => localStorage.getItem("kriri-notif-proj-updated") === "true"
  );
  const [notifyProjectStatus, setNotifyProjectStatus] = useState(
    () => localStorage.getItem("kriri-notif-proj-status") !== "false"
  );
  const [notifyMemberAdded, setNotifyMemberAdded] = useState(
    () => localStorage.getItem("kriri-notif-member-added") !== "false"
  );
  const [notifyMilestones, setNotifyMilestones] = useState(
    () => localStorage.getItem("kriri-notif-milestones") !== "false"
  );

  // Collaboration Notifications
  const [notifyMentions, setNotifyMentions] = useState(
    () => localStorage.getItem("kriri-notif-mentions") !== "false"
  );
  const [notifyCommentsAssigned, setNotifyCommentsAssigned] = useState(
    () => localStorage.getItem("kriri-notif-comments-assigned") !== "false"
  );
  const [notifyCommentReplies, setNotifyCommentReplies] = useState(
    () => localStorage.getItem("kriri-notif-comment-replies") !== "false"
  );
  const [notifyTeamActivity, setNotifyTeamActivity] = useState(
    () => localStorage.getItem("kriri-notif-team-activity") === "true"
  );
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(
    () => localStorage.getItem("kriri-notif-announcements") !== "false"
  );

  // Digests & Reminders
  const [reminderFrequency, setReminderFrequency] = useState(
    () => localStorage.getItem("kriri-reminder-frequency") || "realtime"
  );
  const [dailySummary, setDailySummary] = useState(
    () => localStorage.getItem("kriri-notif-daily-summary") === "true"
  );
  const [weeklySummary, setWeeklySummary] = useState(
    () => localStorage.getItem("kriri-notif-weekly-summary") !== "false"
  );

  // Schedule & DND
  const [dndEnabled, setDndEnabled] = useState(
    () => localStorage.getItem("kriri-dnd-enabled") === "true"
  );
  const [dndStart, setDndStart] = useState(
    () => localStorage.getItem("kriri-dnd-start") || "22:00"
  );
  const [dndEnd, setDndEnd] = useState(
    () => localStorage.getItem("kriri-dnd-end") || "08:00"
  );
  const [dndDays, setDndDays] = useState(
    () => localStorage.getItem("kriri-dnd-days") || "everyday"
  );

  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isClearingRead, setIsClearingRead] = useState(false);

  const syncNotificationSetting = (key, value, storageKey, dbField) => {
    localStorage.setItem(storageKey, String(value));
    playUiSound("toggle");

    if (dbField) {
      api.patch("/user/notifications", { [dbField]: value }).catch(() => {});
    }

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleMarkAllRead = async () => {
    setIsClearingRead(true);
    try {
      await api.patch("/notifications/read-all");
      playUiSound("success");
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2000);
    } catch (e) {
      console.warn("Mark all notifications read note:", e.message);
    } finally {
      setIsClearingRead(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Control which workspace events generate alerts, configure email digests, and customize quiet hours.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isSavedRecently && (
            <span className="text-[12px] text-emerald-500 font-medium flex items-center gap-1 animate-in fade-in">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isClearingRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>{isClearingRead ? "Marking..." : "Mark All as Read"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/inbox")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer"
          >
            <Inbox size={13} />
            <span>Open Inbox</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: NOTIFICATION CHANNELS                                          */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Notification Delivery Channels
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Choose where KRIRI sends your activity updates and reminders.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* In-App Notifications */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                In-App Inbox & Activity Stream
              </h4>
              <p className="text-[12px] text-text-muted">
                Display unread badges and notifications directly inside your KRIRI workspace inbox.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={inAppNotifications}
              onClick={() => {
                const next = !inAppNotifications;
                setInAppNotifications(next);
                syncNotificationSetting("inAppNotifications", next, "kriri-notif-inapp", "in_app_enabled");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                inAppNotifications
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  inAppNotifications ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Email Notifications
              </h4>
              <p className="text-[12px] text-text-muted">
                Receive email alerts for important activity, assignments, and thread mentions.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => {
                const next = !emailNotifications;
                setEmailNotifications(next);
                syncNotificationSetting("emailNotifications", next, "kriri-email-notifications", "email_enabled");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                emailNotifications
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  emailNotifications ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Email Only When Inactive */}
          <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-opacity ${
            !emailNotifications ? "opacity-50 pointer-events-none" : ""
          }`}>
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Email Only When Inactive
              </h4>
              <p className="text-[12px] text-text-muted">
                Suppress email alerts if you are currently active in KRIRI or have been active within the last 15 minutes.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              disabled={!emailNotifications}
              aria-checked={emailOnlyInactive}
              onClick={() => {
                const next = !emailOnlyInactive;
                setEmailOnlyInactive(next);
                syncNotificationSetting("emailOnlyInactive", next, "kriri-email-only-inactive", "email_only_inactive");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                emailOnlyInactive && emailNotifications
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  emailOnlyInactive && emailNotifications ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Browser Push Notifications */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  Browser Desktop Push
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${
                  pushStatus === "granted"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : pushStatus === "denied"
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    : "bg-surface-hover text-text-muted border border-border"
                }`}>
                  {pushStatus === "granted" ? "Enabled" : pushStatus === "denied" ? "Blocked in Browser" : "Permission Required"}
                </span>
              </div>
              <p className="text-[12px] text-text-muted">
                Native OS banners when KRIRI is running in the background. Requires browser permission.
              </p>
            </div>
            {pushStatus !== "granted" ? (
              <button
                type="button"
                onClick={handleRequestPush}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors shrink-0 cursor-pointer"
              >
                Enable Push
              </button>
            ) : (
              <span className="text-[12px] text-emerald-500 font-medium flex items-center gap-1 shrink-0">
                <Check size={14} /> Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: TASK & ISSUE NOTIFICATIONS                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Task & Issue Activity
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Select which issue events trigger workspace notifications.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {[
            {
              id: "assignments",
              label: "Assignments & Reassignments",
              desc: "When an issue is assigned to you or transferred by a teammate.",
              val: notifyAssignments,
              toggle: () => {
                const next = !notifyAssignments;
                setNotifyAssignments(next);
                syncNotificationSetting("assignments", next, "kriri-notif-assignments", "notify_assignments");
              },
            },
            {
              id: "status",
              label: "Status Changes",
              desc: "When an issue you created, are assigned to, or follow changes state.",
              val: notifyStatusChanges,
              toggle: () => {
                const next = !notifyStatusChanges;
                setNotifyStatusChanges(next);
                syncNotificationSetting("status", next, "kriri-notif-status", "notify_status_changes");
              },
            },
            {
              id: "completions",
              label: "Task Completions",
              desc: "When issues in your active sprint or cycle are marked Done or Closed.",
              val: notifyCompletions,
              toggle: () => {
                const next = !notifyCompletions;
                setNotifyCompletions(next);
                syncNotificationSetting("completions", next, "kriri-notif-completions", "notify_completions");
              },
            },
            {
              id: "dueDates",
              label: "Due Date Approaching (24h Reminder)",
              desc: "Proactive alert 24 hours prior to scheduled deadline.",
              val: notifyDueDates,
              toggle: () => {
                const next = !notifyDueDates;
                setNotifyDueDates(next);
                syncNotificationSetting("dueDates", next, "kriri-notif-duedates", "notify_due_dates");
              },
            },
            {
              id: "overdue",
              label: "Overdue Task Alerts",
              desc: "Immediate reminder when an assigned issue exceeds its scheduled due date.",
              val: notifyOverdue,
              toggle: () => {
                const next = !notifyOverdue;
                setNotifyOverdue(next);
                syncNotificationSetting("overdue", next, "kriri-notif-overdue", "notify_overdue");
              },
            },
            {
              id: "priority",
              label: "Priority Changes",
              desc: "When an issue priority is escalated to Urgent or High.",
              val: notifyPriority,
              toggle: () => {
                const next = !notifyPriority;
                setNotifyPriority(next);
                syncNotificationSetting("priority", next, "kriri-notif-priority", "notify_priority_changes");
              },
            },
          ].map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  {item.label}
                </h4>
                <p className="text-[12px] text-text-muted">
                  {item.desc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.val}
                onClick={item.toggle}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  item.val ? "bg-[var(--accent,#5e6ad2)]" : "bg-black/10 dark:bg-white/10"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    item.val ? "left-5.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: PROJECT & MILESTONE NOTIFICATIONS                              */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Project & Roadmap Updates
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Receive summaries when project milestones are achieved or status shifts.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {[
            {
              id: "milestones",
              label: "Milestones & Roadmap Progress",
              desc: "When project milestones are achieved or target dates change.",
              val: notifyMilestones,
              toggle: () => {
                const next = !notifyMilestones;
                setNotifyMilestones(next);
                syncNotificationSetting("milestones", next, "kriri-notif-milestones", "notify_milestones");
              },
            },
            {
              id: "projectStatus",
              label: "Project Health & Status Changes",
              desc: "Alerts when a project transitions (e.g. On Track, At Risk, Completed).",
              val: notifyProjectStatus,
              toggle: () => {
                const next = !notifyProjectStatus;
                setNotifyProjectStatus(next);
                syncNotificationSetting("projectStatus", next, "kriri-notif-proj-status", "notify_project_status_changed");
              },
            },
            {
              id: "memberAdded",
              label: "Project Collaborator Additions",
              desc: "When you are added to a project team or assigned as Project Lead.",
              val: notifyMemberAdded,
              toggle: () => {
                const next = !notifyMemberAdded;
                setNotifyMemberAdded(next);
                syncNotificationSetting("memberAdded", next, "kriri-notif-member-added", "notify_project_member_added");
              },
            },
          ].map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  {item.label}
                </h4>
                <p className="text-[12px] text-text-muted">
                  {item.desc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.val}
                onClick={item.toggle}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  item.val ? "bg-[var(--accent,#5e6ad2)]" : "bg-black/10 dark:bg-white/10"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    item.val ? "left-5.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: COLLABORATION & MENTIONS                                       */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Mentions & Team Discussion
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Real-time triggers for discussions, @mentions, and replies.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {[
            {
              id: "mentions",
              label: "Direct @Mentions",
              desc: "When a colleague @mentions you in task descriptions or comment threads.",
              val: notifyMentions,
              toggle: () => {
                const next = !notifyMentions;
                setNotifyMentions(next);
                syncNotificationSetting("mentions", next, "kriri-notif-mentions", "notify_mentions");
              },
            },
            {
              id: "commentsAssigned",
              label: "Comments on Assigned Tasks",
              desc: "Whenever new feedback or discussion is posted on your issues.",
              val: notifyCommentsAssigned,
              toggle: () => {
                const next = !notifyCommentsAssigned;
                setNotifyCommentsAssigned(next);
                syncNotificationSetting("commentsAssigned", next, "kriri-notif-comments-assigned", "notify_comments_assigned");
              },
            },
            {
              id: "commentReplies",
              label: "Replies to Your Comments",
              desc: "Direct replies in threads you have participated in.",
              val: notifyCommentReplies,
              toggle: () => {
                const next = !notifyCommentReplies;
                setNotifyCommentReplies(next);
                syncNotificationSetting("commentReplies", next, "kriri-notif-comment-replies", "notify_comment_replies");
              },
            },
          ].map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  {item.label}
                </h4>
                <p className="text-[12px] text-text-muted">
                  {item.desc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.val}
                onClick={item.toggle}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  item.val ? "bg-[var(--accent,#5e6ad2)]" : "bg-black/10 dark:bg-white/10"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    item.val ? "left-5.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: SCHEDULE & DO NOT DISTURB                                      */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Do Not Disturb & Quiet Hours
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Automatically mute audio chimes and desktop banners during focused hours.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Enable Scheduled Quiet Hours
              </h4>
              <p className="text-[12px] text-text-muted">
                Silence non-urgent notifications during your configured quiet hours.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dndEnabled}
              onClick={() => {
                const next = !dndEnabled;
                setDndEnabled(next);
                syncNotificationSetting("dndEnabled", next, "kriri-dnd-enabled", "dnd_enabled");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                dndEnabled ? "bg-[var(--accent,#5e6ad2)]" : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  dndEnabled ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {dndEnabled && (
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
              <div className="space-y-0.5">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  Quiet Window
                </h4>
                <p className="text-[12px] text-text-muted">
                  Start time, end time, and active calendar days.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={dndStart}
                  onChange={(e) => {
                    setDndStart(e.target.value);
                    syncNotificationSetting("dndStart", e.target.value, "kriri-dnd-start", "dnd_start_time");
                  }}
                  className="h-9 px-2.5 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <span className="text-text-muted text-[12px]">to</span>
                <input
                  type="time"
                  value={dndEnd}
                  onChange={(e) => {
                    setDndEnd(e.target.value);
                    syncNotificationSetting("dndEnd", e.target.value, "kriri-dnd-end", "dnd_end_time");
                  }}
                  className="h-9 px-2.5 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <select
                  value={dndDays}
                  onChange={(e) => {
                    setDndDays(e.target.value);
                    syncNotificationSetting("dndDays", e.target.value, "kriri-dnd-days", "dnd_days");
                  }}
                  className="h-9 px-3 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                >
                  <option value="everyday" className="bg-surface text-foreground">Everyday</option>
                  <option value="weekdays" className="bg-surface text-foreground">Weekdays only</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
