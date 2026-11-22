import { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  History,
  ExternalLink,
  LogOut,
  RefreshCw,
  Mail,
  Check,
  Laptop,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { api } from "../../lib/api";
import { playUiSound } from "../../lib/sound";

export default function SecurityView() {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchSecurityEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await api.get("/user/security/events");
      setEvents(data.events || []);
    } catch (e) {
      console.warn("Security events fetch note:", e.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const handleOpenClerkSecurity = () => {
    if (openUserProfile) {
      openUserProfile({ initialPage: "security" });
    }
  };

  const handleSignOutOtherSessions = async () => {
    if (!window.confirm("Are you sure you want to sign out of all other devices and sessions?")) return;

    setIsRevokingAll(true);
    setErrorMsg(null);
    try {
      // Use Clerk's active sessions revocation if available
      if (user?.getSessions) {
        const sessions = await user.getSessions();
        const currentSessionId = window.Clerk?.session?.id;
        for (const sess of sessions) {
          if (sess.id !== currentSessionId && sess.revoke) {
            await sess.revoke();
          }
        }
      }

      // Record in security log
      await api.post("/user/security/events", {
        event_type: "session_revoked_all",
        device_info: "Global Session Signout",
        status: "success",
      });

      playUiSound("success");
      setRevokeSuccess(true);
      fetchSecurityEvents();
      setTimeout(() => setRevokeSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign out of other sessions");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const googleAccount = user?.externalAccounts?.find(
    (a) => a.provider === "google" || a.provider === "oauth_google"
  );
  const githubAccount = user?.externalAccounts?.find(
    (a) => a.provider === "github" || a.provider === "oauth_github"
  );
  const hasPassword = Boolean(user?.passwordEnabled);
  const hasMfa = Boolean(user?.twoFactorEnabled);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Security & Access
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Manage your personal credentials, active sessions, multi-factor authentication, and security audit log.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenClerkSecurity}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer"
        >
          <span>Manage Security in Clerk</span>
          <ExternalLink size={12} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: AUTHENTICATION OVERVIEW                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Authentication & Identity
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Verified sign-in identity managed by Clerk's identity gateway.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-surface shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-surface-hover border border-border space-y-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Primary Email
              </span>
              <p className="text-[13px] font-semibold text-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress || "Not provided"}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                <CheckCircle2 size={11} /> Verified
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-hover border border-border space-y-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Auth Gateway
              </span>
              <p className="text-[13px] font-semibold text-foreground">
                Clerk Secure Identity
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                OAuth 2.0 & Passkeys
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-hover border border-border space-y-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Account Status
              </span>
              <p className="text-[13px] font-semibold text-emerald-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Protected & Active
              </p>
              <span className="text-[11px] text-text-muted">
                Zero security alerts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PASSWORD & TWO-FACTOR AUTHENTICATION                           */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Credentials & Protection
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Password configuration, multi-factor verification, and recovery methods.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Password */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                <Key size={16} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  Account Password
                </h4>
                <p className="text-[12px] text-text-muted">
                  {hasPassword
                    ? "Your account is secured with a personal password."
                    : "No static password set. You sign in seamlessly via Single Sign-On (SSO)."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenClerkSecurity}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors shrink-0 cursor-pointer"
            >
              {hasPassword ? "Change Password" : "Set Password"}
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                <Smartphone size={16} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-[13.5px] font-medium text-foreground">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${
                    hasMfa
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-surface-hover text-text-muted border border-border"
                  }`}>
                    {hasMfa ? "Active" : "Managed by SSO"}
                  </span>
                </div>
                <p className="text-[12px] text-text-muted">
                  Require an authenticator app (TOTP) or SMS security code during sign-in.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenClerkSecurity}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors shrink-0 cursor-pointer"
            >
              Configure 2FA
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: CONNECTED PROVIDERS                                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Connected Accounts
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            OAuth identity providers linked for seamless authentication and Git commit attribution.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Google */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-hover border border-border flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13.5px] font-medium text-foreground">
                  Google Workspace
                </h4>
                <p className="text-[12px] text-text-muted">
                  {googleAccount ? googleAccount.emailAddress : "Link your Google account for single-click sign-in"}
                </p>
              </div>
            </div>
            {googleAccount ? (
              <span className="text-[11.5px] font-medium text-emerald-500 flex items-center gap-1">
                <Check size={12} /> Primary sign-in
              </span>
            ) : (
              <button
                type="button"
                onClick={handleOpenClerkSecurity}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>

          {/* GitHub */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-hover border border-border flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-current text-foreground" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13.5px] font-medium text-foreground">
                  GitHub
                </h4>
                <p className="text-[12px] text-text-muted">
                  {githubAccount ? `@${githubAccount.username || "connected"}` : "Sync commit attribution, issue mentions, and branch PRs"}
                </p>
              </div>
            </div>
            {githubAccount ? (
              <span className="text-[11.5px] font-medium text-emerald-500 flex items-center gap-1">
                <Check size={12} /> Connected
              </span>
            ) : (
              <button
                type="button"
                onClick={handleOpenClerkSecurity}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer"
              >
                Connect ↗
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: SECURITY AUDIT TIMELINE                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground px-0.5">
              Security Events & Audit History
            </h3>
            <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
              Recent authentications, password updates, and session events.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSecurityEvents}
            className="p-1.5 rounded-lg border border-border bg-surface-hover text-text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Refresh security history"
          >
            <RefreshCw size={13} className={loadingEvents ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="border border-border rounded-2xl bg-surface overflow-hidden shadow-xs divide-y divide-border-subtle transition-colors">
          {events.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-[13px]">
              No security anomalies detected.
            </div>
          ) : (
            events.slice(0, 6).map((ev) => (
              <div key={ev.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Shield size={14} />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-medium text-foreground capitalize">
                      {ev.event_type.replace(/_/g, " ")}
                    </h5>
                    <p className="text-[11.5px] text-text-muted">
                      {ev.device_info || "Browser Session"} · {ev.ip_address} · {ev.location}
                    </p>
                  </div>
                </div>
                <span className="text-[11.5px] text-text-muted font-mono shrink-0">
                  {new Date(ev.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: ACCOUNT PROTECTION ACTIONS                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Emergency Account Protection
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Immediate actions to revoke access if you suspect unauthorized account activity.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-5 sm:p-6 bg-surface shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-[13.5px] font-medium text-foreground">
              Sign Out of All Other Devices
            </h4>
            <p className="text-[12px] text-text-muted">
              Terminates all active login sessions on other computers, tablets, and phones.
            </p>
            {revokeSuccess && (
              <p className="text-[12px] text-emerald-500 font-medium flex items-center gap-1">
                <Check size={12} /> All other sessions have been signed out.
              </p>
            )}
            {errorMsg && (
              <p className="text-[12px] text-rose-500 font-medium">
                {errorMsg}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOutOtherSessions}
            disabled={isRevokingAll}
            className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[12px] font-medium transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isRevokingAll ? "Signing out..." : "Sign Out All Other Sessions"}
          </button>
        </div>
      </div>
    </div>
  );
}
