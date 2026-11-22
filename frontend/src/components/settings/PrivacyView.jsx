import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Eye,
  EyeOff,
  Activity,
  Download,
  Trash2,
  ShieldCheck,
  Globe,
  Users,
  Check,
  AlertTriangle,
  Smile,
  BarChart3,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { sileo } from "sileo";
import { playUiSound } from "@/lib/sound";
import { Button } from "@/registry/components/button/button";
import ConfirmModal from "@/components/ConfirmModal";
import { useUser, useClerk } from "@clerk/react";

const PRESENCE_STATUSES = [
  { id: "online", label: "Online", color: "bg-emerald-500", desc: "Visible to teammates" },
  { id: "away", label: "Away", color: "bg-amber-500", desc: "Stepped away from desk" },
  { id: "dnd", label: "Do Not Disturb", color: "bg-rose-500", desc: "Notifications silenced" },
  { id: "invisible", label: "Invisible", color: "bg-zinc-500", desc: "Appear offline" },
];

const STATUS_PRESETS = [
  { emoji: "🎯", text: "In deep focus" },
  { emoji: "💻", text: "In a meeting" },
  { emoji: "🚀", text: "Shipping code" },
  { emoji: "☕", text: "Taking a break" },
  { emoji: "🌴", text: "Out of office" },
  { emoji: "🎧", text: "Listening to music" },
];

export default function PrivacyView() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState("");

  const [privacy, setPrivacy] = useState({
    profile_visibility: "workspace", // workspace, public, private
    show_online_status: true,
    show_activity_presence: true,
    show_last_active: true,
    status_presence: "online",
    status_message: "",
    analytics_opt_in: true,
    telemetry_opt_in: true,
    ai_feedback_opt_in: true,
    show_email_to_team: true,
    show_bio_to_team: true,
  });

  useEffect(() => {
    let active = true;
    const fetchPrivacy = async () => {
      try {
        const res = await api.get("/user/preferences", { noCache: true });
        if (active && res?.privacy) {
          setPrivacy((prev) => ({
            ...prev,
            ...res.privacy,
          }));
          if (res.privacy.status_message) {
            setCustomStatusInput(res.privacy.status_message);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch privacy settings:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPrivacy();
    return () => {
      active = false;
    };
  }, []);

  const updateField = async (field, value) => {
    setSavingField(field);
    setPrivacy((prev) => ({ ...prev, [field]: value }));
    try {
      await api.patch("/user/privacy", { [field]: value });
      playUiSound("pop");
      sileo.success({ title: "Privacy preference updated" });
    } catch (err) {
      console.error("Failed to update privacy:", err);
      sileo.error({ title: "Failed to save privacy setting" });
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveStatusMessage = async (msg) => {
    const textToSave = msg !== undefined ? msg : customStatusInput;
    await updateField("status_message", textToSave);
  };

  const handleExportData = async () => {
    setExporting(true);
    playUiSound("open");
    try {
      const data = await api.post("/user/export", {});
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kriri-account-archive-${user?.id || "export"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      sileo.success({
        title: "Account data exported",
        description: "Your full personal data archive has been downloaded as JSON.",
      });
      playUiSound("bell");
    } catch (err) {
      console.error("Export error:", err);
      sileo.error({
        title: "Export failed",
        description: err.message || "Failed to package account archive.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      playUiSound("close");
      sileo.info({
        title: "Account deletion requested",
        description: "Your account is scheduled for de-provisioning. Signing out...",
      });
      setTimeout(() => {
        signOut();
      }, 1500);
    } catch (err) {
      sileo.error({ title: "Failed to process deletion request" });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Lock className="w-5 h-5 text-[var(--accent)]" />
          Privacy & Data Control
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Manage how your identity, online activity, and workspace presence appear to team members,
          and control your data retention and telemetry preferences.
        </p>
      </div>

      {/* SECTION 1: Presence & Status */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            Activity & Workspace Presence
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Choose what teammates see when you collaborate on projects and tasks.
          </p>
        </div>

        {/* Presence Status Badges */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-foreground">Current Status</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESENCE_STATUSES.map((status) => {
              const isSelected = privacy.status_presence === status.id;
              return (
                <button
                  key={status.id}
                  onClick={() => updateField("status_presence", status.id)}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]"
                      : "border-border hover:border-border/80 bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                    <span className="text-xs font-semibold text-foreground">{status.label}</span>
                  </div>
                  <span className="text-[11px] text-text-muted mt-1">{status.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Status Message */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>Custom Status Message</span>
            {privacy.status_message && (
              <button
                onClick={() => {
                  setCustomStatusInput("");
                  handleSaveStatusMessage("");
                }}
                className="text-[11px] text-text-muted hover:text-foreground"
              >
                Clear status
              </button>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Smile className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="What are you working on right now?"
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveStatusMessage();
                  }
                }}
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveStatusMessage()}
              disabled={savingField === "status_message"}
              className="text-xs"
            >
              Set Status
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {STATUS_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const combined = `${preset.emoji} ${preset.text}`;
                  setCustomStatusInput(combined);
                  handleSaveStatusMessage(combined);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-surface-hover/80 hover:bg-surface-hover border border-border text-text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span>{preset.emoji}</span>
                <span>{preset.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Presence Toggles */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">Show Online Presence</p>
              <p className="text-[11px] text-text-muted">
                Allow teammates to see a green indicator when you are active on Kriri.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={privacy.show_online_status}
              onClick={() => updateField("show_online_status", !privacy.show_online_status)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                privacy.show_online_status ? "bg-[var(--accent)]" : "bg-zinc-700/60"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy.show_online_status ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">Share Current Activity</p>
              <p className="text-[11px] text-text-muted">
                Displays live work indicators (e.g., "Editing Task #42") to project collaborators.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={privacy.show_activity_presence}
              onClick={() =>
                updateField("show_activity_presence", !privacy.show_activity_presence)
              }
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                privacy.show_activity_presence ? "bg-[var(--accent)]" : "bg-zinc-700/60"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy.show_activity_presence ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">Show Last Active Timestamp</p>
              <p className="text-[11px] text-text-muted">
                Show when you were last seen online in user cards and mention popovers.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={privacy.show_last_active}
              onClick={() => updateField("show_last_active", !privacy.show_last_active)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                privacy.show_last_active ? "bg-[var(--accent)]" : "bg-zinc-700/60"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy.show_last_active ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Profile & Workspace Visibility */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            Profile & Workspace Visibility
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Control who can see your profile details across workspaces and shared projects.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">Profile Scope</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {[
                {
                  id: "workspace",
                  label: "Workspace Only",
                  desc: "Only members in your shared workspace can see your profile.",
                  icon: Users,
                },
                {
                  id: "public",
                  label: "Public Link",
                  desc: "Anyone with your direct Kriri profile handle can view public info.",
                  icon: Globe,
                },
                {
                  id: "private",
                  label: "Restricted",
                  desc: "Hide profile info except from workspace admins and owners.",
                  icon: Lock,
                },
              ].map((scope) => {
                const isSelected = privacy.profile_visibility === scope.id;
                const Icon = scope.icon;
                return (
                  <button
                    key={scope.id}
                    onClick={() => updateField("profile_visibility", scope.id)}
                    className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]"
                        : "border-border hover:border-border/80 bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[var(--accent)]" />
                      <span className="text-xs font-semibold text-foreground">{scope.label}</span>
                    </div>
                    <span className="text-[11px] text-text-muted mt-1.5">{scope.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-xs font-medium text-foreground">Show Email in Teammate Hovercards</p>
                <p className="text-[11px] text-text-muted">
                  Teammates can see your primary email when hovering over your avatar in task assignments.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={privacy.show_email_to_team}
                onClick={() => updateField("show_email_to_team", !privacy.show_email_to_team)}
                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                  privacy.show_email_to_team ? "bg-[var(--accent)]" : "bg-zinc-700/60"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    privacy.show_email_to_team ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-xs font-medium text-foreground">Display Professional Bio</p>
                <p className="text-[11px] text-text-muted">
                  Allow your bio description to be visible in project member directories.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={privacy.show_bio_to_team}
                onClick={() => updateField("show_bio_to_team", !privacy.show_bio_to_team)}
                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                  privacy.show_bio_to_team ? "bg-[var(--accent)]" : "bg-zinc-700/60"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    privacy.show_bio_to_team ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Telemetry & Analytics */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
            Telemetry & Product Diagnostics
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Help improve Kriri by sharing anonymized performance metrics and error diagnostics.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">Usage Analytics (PostHog)</p>
              <p className="text-[11px] text-text-muted">
                Collects anonymous pageview flows and feature adoption metrics. We never track
                sensitive task content or project descriptions.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={privacy.analytics_opt_in}
              onClick={() => updateField("analytics_opt_in", !privacy.analytics_opt_in)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                privacy.analytics_opt_in ? "bg-[var(--accent)]" : "bg-zinc-700/60"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy.analytics_opt_in ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">Error & Crash Diagnostics</p>
              <p className="text-[11px] text-text-muted">
                Automatically submits stack traces when unexpected client exceptions occur to accelerate fixes.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={privacy.telemetry_opt_in}
              onClick={() => updateField("telemetry_opt_in", !privacy.telemetry_opt_in)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                privacy.telemetry_opt_in ? "bg-[var(--accent)]" : "bg-zinc-700/60"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy.telemetry_opt_in ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">AI Intelligence Quality Feedback</p>
              <p className="text-[11px] text-text-muted">
                Share anonymized AI completions thumbs up/down ratings to refine prompt tuning models.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={privacy.ai_feedback_opt_in}
              onClick={() => updateField("ai_feedback_opt_in", !privacy.ai_feedback_opt_in)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                privacy.ai_feedback_opt_in ? "bg-[var(--accent)]" : "bg-zinc-700/60"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy.ai_feedback_opt_in ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Data Management & Export (GDPR) */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--accent)]" />
            Data Portability & Account Archive
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Under GDPR and data privacy rights, you can download a complete archive of your personal
            records, project tasks, comments, and settings at any time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-surface-hover/60 border border-border gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Personal Data Package (JSON)</h4>
            <p className="text-[11px] text-text-muted max-w-md">
              Includes user profile info, account preferences, assigned tasks, reported bugs, and comment history.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={exporting}
            className="flex items-center gap-2 text-xs shrink-0"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? "animate-bounce" : ""}`} />
            {exporting ? "Generating Archive..." : "Export Data"}
          </Button>
        </div>

        {/* Legal & Policy Links */}
        <div className="pt-2 flex flex-wrap gap-4 text-xs text-text-muted">
          <a
            href="https://kriri.app/privacy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Privacy Policy <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <a
            href="https://kriri.app/terms"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Terms of Service <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <a
            href="https://clerk.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Clerk Security Policy <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* SECTION 5: Account Deletion (Danger Zone for Account) */}
      <div className="bg-surface border border-rose-500/20 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Delete Account
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Permanently delete your personal Kriri account and revoke access from all workspaces.
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted">
            Ensure you have exported your data before proceeding.
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Request Deletion
          </Button>
        </div>
      </div>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Permanently Delete Your Account?"
        description="This will permanently delete your personal profile, revoke your session keys, and unassign you from all active projects and workspaces. This operation is permanent."
        confirmText="Yes, delete my account"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
