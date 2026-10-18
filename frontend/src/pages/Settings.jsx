import { useState, useEffect } from "react";
import { useOrganization, useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  Mail,
  Building,
  Check,
  LogOut,
  ExternalLink,
  Users,
  Copy,
  AlertTriangle,
} from "lucide-react";
import PageLoading from "../components/PageLoading";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("General");
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Workspace form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  const [orgError, setOrgError] = useState(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Preference toggles
  const [theme, setTheme] = useState("pitch-black");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (organization?.name) {
      setWorkspaceName(organization.name);
    } else if (isOrgLoaded && !organization) {
      setWorkspaceName("Personal Workspace");
    }
  }, [organization, isOrgLoaded]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const tabs = [
    { id: "General", label: "General", icon: Building },
    { id: "Profile", label: "Profile", icon: User },
  ];

  const handleSaveWorkspace = async () => {
    if (!organization) {
      setOrgError("Cannot rename personal workspace");
      return;
    }
    setIsSavingOrg(true);
    setOrgError(null);
    setOrgSuccess(false);
    try {
      await organization.update({ name: workspaceName });
      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch (err) {
      setOrgError(err.message || "Failed to update workspace name");
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfileSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isOrgLoaded || !isUserLoaded) {
    return <PageLoading label="Settings" />;
  }

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";
  const userInitials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    firstName?.[0]?.toUpperCase() ||
    primaryEmail?.[0]?.toUpperCase() ||
    "U";

  const googleAccount = user?.externalAccounts?.find(
    (acc) => acc.provider === "google" || acc.verification?.strategy?.includes("google"),
  );

  return (
    <div className="w-full flex flex-col min-h-full pb-16 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6 min-h-[38px]">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-mobile-nav"))
            }
            className="md:hidden p-1.5 -ml-1 text-[#8a8f98] hover:text-white rounded-md hover:bg-white/[0.06] transition-colors shrink-0 mt-0.5"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white mb-0.5">
              Settings
            </h1>
            <p className="text-[12.5px] sm:text-[13px] text-text-muted">
              Manage your workspace and account preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl w-full sm:w-fit mb-6 sm:mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-[#8a8f98] hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-[#8a8f98]"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Body */}
      <div className="w-full max-w-3xl">
        {/* ===================== GENERAL TAB ===================== */}
        {activeTab === "General" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Workspace Overview Card */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white font-semibold text-lg shadow-inner">
                    {workspaceName?.[0]?.toUpperCase() || "W"}
                  </div>
                  <div>
                    <h2 className="text-[14.5px] font-semibold text-white">
                      Workspace Profile
                    </h2>
                    <p className="text-[12px] text-text-muted">
                      General details and information about this workspace.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
                  Free Team Plan
                </span>
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Workspace Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium text-white flex items-center justify-between">
                  <span>Workspace Name</span>
                  <span className="text-[11.5px] text-[#8a8f98]">
                    {workspaceName.length}/32
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={workspaceName}
                    maxLength={32}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    disabled={!organization}
                    placeholder="Enter workspace name"
                    className="flex-1 h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSaveWorkspace}
                    disabled={
                      isSavingOrg || !organization || !workspaceName.trim()
                    }
                    className="h-9 px-4 rounded-lg bg-white hover:bg-[#e8e8e8] text-black text-[12.5px] font-medium transition-colors shadow-sm disabled:opacity-50 shrink-0"
                  >
                    {isSavingOrg ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                {orgError && (
                  <p className="text-danger text-[12px] mt-1">{orgError}</p>
                )}
                {orgSuccess && (
                  <p className="text-[#22c55e] text-[12px] mt-1 flex items-center gap-1.5">
                    <Check size={13} />
                    <span>Workspace updated successfully.</span>
                  </p>
                )}
              </div>

              {/* Workspace URL / Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-white">
                  Workspace URL
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[12.5px]">
                  <span className="text-[#8a8f98] truncate">
                    https://kriri.app/
                    <span className="text-white">
                      {organization?.slug ||
                        workspaceName?.toLowerCase().replace(/\s+/g, "-") ||
                        "software-development"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyId(
                        `https://kriri.app/${organization?.slug || workspaceName?.toLowerCase().replace(/\s+/g, "-")}`,
                      )
                    }
                    className="text-[#8a8f98] hover:text-white transition-colors text-[11.5px] flex items-center gap-1 pl-2"
                  >
                    {copiedId ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedId ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Team Members Shortcut */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-[#8a8f98]">
                  <Users size={17} />
                </div>
                <div>
                  <h3 className="text-[13.5px] font-medium text-white">
                    Members & Permissions
                  </h3>
                  <p className="text-[12px] text-text-muted">
                    Invite collaborators and manage roles in this workspace.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/team")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[12.5px] font-medium transition-colors border border-white/5 shrink-0"
              >
                <span>Manage Team</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#1a1213] border border-[#ef4444]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="text-[#ef4444] shrink-0 mt-0.5"
                />
                <div>
                  <h3 className="text-[13.5px] font-medium text-white">
                    Delete Workspace
                  </h3>
                  <p className="text-[12px] text-[#ef4444]/80">
                    Permanently delete this workspace and all associated issues,
                    projects, and views.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "To delete this workspace, please contact your workspace administrator or owner.",
                  )
                }
                className="px-3.5 py-1.5 rounded-lg bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] text-[12.5px] font-medium transition-colors border border-[#ef4444]/30 shrink-0 self-start sm:self-auto"
              >
                Delete workspace
              </button>
            </div>
          </div>
        )}

        {/* ===================== PROFILE TAB ===================== */}
        {activeTab === "Profile" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Account Details Card */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14.5px] font-semibold text-white">
                    Profile Details
                  </h2>
                  <p className="text-[12px] text-text-muted">
                    Manage your personal account credentials and display details.
                  </p>
                </div>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-3 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-white text-[12px] font-medium rounded-lg transition-colors border border-white/5"
                  >
                    Update profile
                  </button>
                )}
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Profile Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      className="w-14 h-14 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#10b981] text-white font-semibold text-xl flex items-center justify-center shadow-inner">
                      {userInitials}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-medium text-white truncate">
                      {user?.fullName ||
                        `${firstName} ${lastName}`.trim() ||
                        "Cyrus Jones"}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-white/[0.06] text-[#8a8f98]">
                      Account Owner
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#8a8f98] truncate">
                    {primaryEmail}
                  </p>
                </div>
              </div>

              {/* Inline Edit Profile Form */}
              {isEditingProfile && (
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex flex-col gap-3 mt-1 animate-in fade-in-0 duration-150"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11.5px] text-[#8a8f98]">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/10 text-[12.5px] text-white focus:outline-none focus:border-[#5e6ad2]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11.5px] text-[#8a8f98]">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/10 text-[12.5px] text-white focus:outline-none focus:border-[#5e6ad2]"
                      />
                    </div>
                  </div>

                  {profileError && (
                    <p className="text-danger text-[11.5px]">{profileError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-1 rounded-full text-[12px] text-[#8a8f98] hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-4 py-1 rounded-full text-[12px] font-medium bg-white text-black hover:bg-zinc-100 transition-all duration-300 shadow-[0_0_16px_rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(255,255,255,0.22)] active:scale-[0.98]"
                    >
                      {isSavingProfile ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {profileSuccess && (
                <p className="text-[#22c55e] text-[12px] flex items-center gap-1.5">
                  <Check size={13} />
                  <span>Profile updated successfully.</span>
                </p>
              )}
            </div>

            {/* Email Addresses */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-[14px] font-semibold text-white">
                  Email Addresses
                </h3>
                <p className="text-[12px] text-text-muted">
                  The email address associated with your notifications and login.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail size={15} className="text-[#8a8f98] shrink-0" />
                  <span className="text-[13px] text-white font-medium truncate">
                    {primaryEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
                    Primary
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#22c55e]/10 text-[#4ade80] border border-[#22c55e]/20 flex items-center gap-1">
                    <Check size={11} /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-[14px] font-semibold text-white">
                  Connected Accounts
                </h3>
                <p className="text-[12px] text-text-muted">
                  Identity providers connected to your Kriri account.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="shrink-0"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <div>
                    <span className="text-[13px] text-white font-medium block">
                      Google
                    </span>
                    <span className="text-[11.5px] text-[#8a8f98]">
                      {googleAccount?.emailAddress || primaryEmail}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.05] text-[#d1d2d5] border border-white/10">
                  Connected
                </span>
              </div>
            </div>

            {/* Preferences & Appearance */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-[14px] font-semibold text-white">
                  Preferences & Theme
                </h3>
                <p className="text-[12px] text-text-muted">
                  Customize the appearance and behavior of your interface.
                </p>
              </div>

              {/* Theme selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] text-[#8a8f98]">
                  Color Scheme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pitch-black", label: "Pitch Black", desc: "OLED optimized" },
                    { id: "dark", label: "Linear Dark", desc: "Classic slate" },
                    { id: "system", label: "System", desc: "Auto sync" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        theme === t.id
                          ? "bg-white/[0.08] border-white/20 text-white shadow-sm"
                          : "bg-white/[0.02] border-white/5 text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-[12.5px] font-medium">{t.label}</div>
                      <div className="text-[10.5px] opacity-60">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] text-white font-medium block">
                      Email Notifications
                    </span>
                    <span className="text-[11.5px] text-[#8a8f98]">
                      Receive issue updates and mentions via email
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      emailNotifications ? "bg-[#3b82f6]" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        emailNotifications ? "left-5.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] text-white font-medium block">
                      Desktop Alerts
                    </span>
                    <span className="text-[11.5px] text-[#8a8f98]">
                      Show desktop toast notifications for urgent activity
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDesktopAlerts(!desktopAlerts)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      desktopAlerts ? "bg-[#3b82f6]" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        desktopAlerts ? "left-5.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Session / Sign out */}
            <div className="bg-[#141517] border border-white/[0.06] rounded-2xl p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h3 className="text-[13.5px] font-medium text-white">
                  Sign out
                </h3>
                <p className="text-[12px] text-text-muted">
                  Log out of your Kriri session on this browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut(() => navigate("/"))}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[12.5px] font-medium transition-colors border border-white/5"
              >
                <LogOut size={13} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
