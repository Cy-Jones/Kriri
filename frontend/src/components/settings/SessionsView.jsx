import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Clock,
  MapPin,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  XCircle,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { api } from "@/lib/api";
import { sileo } from "sileo";
import { playUiSound } from "@/lib/sound";
import { Button } from "@/registry/components/button/button";
import ConfirmModal from "@/components/ConfirmModal";
import { formatKririDate, formatKririTime } from "@/lib/userPreferences";

export default function SessionsView() {
  const { user } = useUser();
  const { session: currentSession } = useClerk();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [showSignOutOthersModal, setShowSignOutOthersModal] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Helper to parse user agent when running locally
  const localDeviceInfo = useMemo(() => {
    if (typeof window === "undefined") return { os: "macOS", browser: "Chrome" };
    const ua = navigator.userAgent;
    let browser = "Web Browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Safari")) browser = "Apple Safari";

    let os = "Desktop";
    if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return { browser, os };
  }, []);

  const loadSessions = async () => {
    setRefreshing(true);
    try {
      if (user && typeof user.getSessions === "function") {
        const clerkSessions = await user.getSessions();
        setSessions(clerkSessions || []);
      } else {
        // Fallback to backend API
        const res = await api.get("/user/sessions", { noCache: true });
        setSessions(res.sessions || []);
      }
    } catch (err) {
      console.warn("Failed to retrieve sessions via Clerk:", err);
      // Fallback
      try {
        const res = await api.get("/user/sessions", { noCache: true });
        setSessions(res.sessions || []);
      } catch (backendErr) {
        console.error("Backend sessions error:", backendErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSecurityEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await api.get("/user/security/events", { noCache: true });
      if (res?.events) {
        setSecurityEvents(res.events);
      }
    } catch (err) {
      console.warn("Failed to load security events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadSecurityEvents();
  }, [user]);

  const handleRevokeSingle = async () => {
    if (!sessionToRevoke) return;
    const targetId = sessionToRevoke.id;
    setRevokingId(targetId);
    playUiSound("close");

    try {
      if (typeof sessionToRevoke.revoke === "function") {
        await sessionToRevoke.revoke();
      }
      // Record audit event
      await api
        .post("/user/security/events", {
          event_type: "session_revocation",
          device_info: `${sessionToRevoke.latestActivity?.browserName || "Remote device"} session terminated`,
          status: "success",
        })
        .catch(() => {});

      sileo.success({ title: "Session revoked successfully" });
      await loadSessions();
      await loadSecurityEvents();
    } catch (err) {
      console.error("Revoke error:", err);
      sileo.error({
        title: "Failed to revoke session",
        description: err.message || "An error occurred while revoking.",
      });
    } finally {
      setRevokingId(null);
      setSessionToRevoke(null);
    }
  };

  const handleSignOutOthers = async () => {
    setRefreshing(true);
    playUiSound("close");
    try {
      const currentId = currentSession?.id;
      let revokedCount = 0;

      for (const sess of sessions) {
        if (sess.id !== currentId && typeof sess.revoke === "function") {
          try {
            await sess.revoke();
            revokedCount++;
          } catch (e) {
            console.warn("Failed revoking session:", sess.id, e);
          }
        }
      }

      await api
        .post("/user/security/events", {
          event_type: "all_other_sessions_revocation",
          device_info: `Signed out of ${revokedCount} remote sessions`,
          status: "success",
        })
        .catch(() => {});

      sileo.success({
        title: "Signed out of all other sessions",
        description: "You remain safely signed in on this current browser.",
      });
      playUiSound("bell");
      await loadSessions();
      await loadSecurityEvents();
    } catch (err) {
      console.error("Sign out others error:", err);
      sileo.error({ title: "Failed to sign out of other devices" });
    } finally {
      setRefreshing(false);
      setShowSignOutOthersModal(false);
    }
  };

  const currentClerkId = currentSession?.id;
  const otherSessions = sessions.filter(
    (s) => s.id !== currentClerkId && (s.status === "active" || !s.status)
  );

  const getDeviceIcon = (activity) => {
    const isMobile = activity?.isMobile;
    const deviceType = activity?.deviceType?.toLowerCase() || "";
    if (isMobile || deviceType.includes("phone")) return Smartphone;
    if (deviceType.includes("tablet") || deviceType.includes("ipad")) return Tablet;
    return Laptop;
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Laptop className="w-5 h-5 text-[var(--accent)]" />
            Sessions & Devices
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Review active browser sessions, view connected devices, and remotely sign out of any
            unfamiliar location.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadSessions();
            loadSecurityEvents();
          }}
          disabled={refreshing}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* SECTION 1: Current Session Card */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Current Active Session</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  This Device (Active now)
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {localDeviceInfo.os} • {localDeviceInfo.browser}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/40">
            <span className="text-[11px] text-text-muted block flex items-center gap-1">
              <Globe className="w-3 h-3" /> Network & IP
            </span>
            <span className="font-mono text-foreground mt-1 block">
              {currentSession?.latestActivity?.ipAddress || "127.0.0.1 (Localhost)"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/40">
            <span className="text-[11px] text-text-muted block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </span>
            <span className="text-foreground mt-1 block font-medium">
              {currentSession?.latestActivity?.city && currentSession?.latestActivity?.country
                ? `${currentSession.latestActivity.city}, ${currentSession.latestActivity.country}`
                : "Active Local Session"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/40">
            <span className="text-[11px] text-text-muted block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last Active
            </span>
            <span className="text-foreground mt-1 block font-medium">Just now</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Other Active Sessions */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              Other Active Sessions ({otherSessions.length})
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Devices currently signed in to your account. Revoke any unrecognized session.
            </p>
          </div>

          {otherSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignOutOthersModal(true)}
              className="text-xs text-rose-400 hover:text-rose-300 hover:border-rose-500/30 flex items-center gap-1.5 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out All Other Devices
            </Button>
          )}
        </div>

        {otherSessions.length === 0 ? (
          <div className="py-8 text-center rounded-lg bg-surface-hover/20 border border-border/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-medium text-foreground">No other active sessions</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              You are currently only signed in on this browser.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherSessions.map((sess) => {
              const activity = sess.latestActivity;
              const Icon = getDeviceIcon(activity);
              const deviceName = activity?.browserName
                ? `${activity.browserName} on ${activity.deviceType || "Device"}`
                : "Active Web Session";

              return (
                <div
                  key={sess.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-surface-hover/40 border border-border/60 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{deviceName}</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {activity?.ipAddress || "Unknown IP"} •{" "}
                        {activity?.city
                          ? `${activity.city}, ${activity.country}`
                          : "Unknown Location"}{" "}
                        • Last seen{" "}
                        {sess.lastActiveAt
                          ? formatKririDate(sess.lastActiveAt)
                          : "Recently"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSessionToRevoke(sess)}
                    disabled={revokingId === sess.id}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:border-rose-500/30 self-start sm:self-auto shrink-0"
                  >
                    Revoke
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Security & Session Audit Timeline */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              Security Activity Timeline
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Audit log of authentication attempts, session revocations, and credentials updates.
            </p>
          </div>
        </div>

        {eventsLoading ? (
          <div className="flex flex-col divide-y divide-border/40 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.1]" />
                  <div className="w-36 h-3 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
                </div>
                <div className="w-16 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : securityEvents.length === 0 ? (
          <div className="py-6 text-center rounded-lg bg-surface-hover/20 border border-border/40">
            <Shield className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-xs text-text-muted">No security events recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {securityEvents.slice(0, 8).map((evt) => (
              <div key={evt.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground capitalize">
                      {evt.event_type.replace(/_/g, " ")}
                    </span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {evt.device_info || "Browser Session"} • IP {evt.ip_address}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-text-muted whitespace-nowrap">
                  {formatKririDate(evt.created_at)} at {formatKririTime(evt.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Single Session Revocation */}
      <ConfirmModal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleRevokeSingle}
        title="Revoke Session?"
        description="The selected device will be immediately signed out and must re-authenticate to access Kriri."
        confirmText="Revoke Session"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Confirm Sign Out All Others Modal */}
      <ConfirmModal
        isOpen={showSignOutOthersModal}
        onClose={() => setShowSignOutOthersModal(false)}
        onConfirm={handleSignOutOthers}
        title="Sign Out of All Other Devices?"
        description="This will terminate all other active browser and mobile sessions immediately. You will remain signed in on this current browser."
        confirmText="Sign Out Others"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
