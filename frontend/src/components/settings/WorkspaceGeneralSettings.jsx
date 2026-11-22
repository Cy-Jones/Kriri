import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Upload,
  Trash2,
  Check,
  Copy,
  AlertTriangle,
  Info,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { sileo } from "sileo";
import { playUiSound } from "@/lib/sound";
import { formatKririDate } from "@/lib/userPreferences";
import { ClerkSelect } from "./ClerkFormControls";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function formatTimezoneOffset(tz) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value || "UTC";
    return `${tz} (${offset})`;
  } catch {
    return tz;
  }
}

function getDatePreview(fmt) {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (fmt === "DD/MM/YYYY") return `${day}/${month}/${year}`;
  if (fmt === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  return `${year}-${month}-${day}`;
}

function getTimePreview(fmt) {
  const d = new Date();
  const hours24 = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  if (fmt === "12h") {
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = String(hours24 % 12 || 12).padStart(2, "0");
    return `${hours12}:${mins} ${period}`;
  }
  return `${String(hours24).padStart(2, "0")}:${mins}`;
}

export default function WorkspaceGeneralSettings({
  currentWorkspace,
  onWorkspaceUpdated,
  isAdminOrOwner = true,
  organization = null,
}) {
  const fileInputRef = useRef(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);

  // Preferences State
  const [defaultProjectView, setDefaultProjectView] = useState("board");
  const [defaultTaskView, setDefaultTaskView] = useState("board");
  const [defaultTaskPriority, setDefaultTaskPriority] = useState("Medium");
  const [defaultProjectVisibility, setDefaultProjectVisibility] = useState("private");
  const [defaultMemberRole, setDefaultMemberRole] = useState("Member");
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);
  const [notifyWorkspaceActivity, setNotifyWorkspaceActivity] = useState(true);

  // Regional Settings State
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [defaultTimezone, setDefaultTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("monday");

  // UI / Validation State
  const [isSaving, setIsSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: "" });
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Populate from currentWorkspace
  const initializeFromWorkspace = useCallback((ws) => {
    if (!ws) return;
    setName(ws.name || "");
    setDescription(ws.description || "");
    setSlug(ws.slug || "");
    setLogoUrl(ws.logo_url || organization?.imageUrl || null);
    setLogoPreview(null);
    setIsLogoRemoved(false);

    setDefaultProjectView(ws.default_project_view || "board");
    setDefaultTaskView(ws.default_task_view || "board");
    const rawWsPriority = String(ws.default_task_priority || "Medium").trim().toLowerCase();
    const priorityDisplayMap = {
      "no priority": "No priority",
      "no_priority": "No priority",
      "no-priority": "No priority",
      "none": "No priority",
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent",
    };
    setDefaultTaskPriority(priorityDisplayMap[rawWsPriority] || "Medium");
    setDefaultProjectVisibility(ws.default_project_visibility || "private");
    setDefaultMemberRole(ws.default_member_role || "Member");
    setNotifyNewMembers(ws.notify_new_members !== false);
    setNotifyWorkspaceActivity(ws.notify_workspace_activity !== false);

    setDefaultLanguage(ws.default_language || "en");
    setDefaultTimezone(ws.default_timezone || "UTC");
    setDateFormat(ws.date_format || "YYYY-MM-DD");
    setTimeFormat(ws.time_format || "24h");
    setFirstDayOfWeek(ws.first_day_of_week ? ws.first_day_of_week.toLowerCase() : "monday");

    setFieldErrors({});
    setHasManuallyEditedSlug(false);
  }, [organization?.imageUrl]);

  useEffect(() => {
    if (currentWorkspace) {
      initializeFromWorkspace(currentWorkspace);
    }
  }, [currentWorkspace, initializeFromWorkspace]);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (!currentWorkspace) return false;
    const baseLogo = currentWorkspace.logo_url || organization?.imageUrl || null;
    const logoChanged = isLogoRemoved ? baseLogo !== null : logoPreview !== null;

    const rawWsPriority = String(currentWorkspace.default_task_priority || "Medium").trim().toLowerCase();
    const priorityDisplayMap = {
      "no priority": "No priority",
      "no_priority": "No priority",
      "no-priority": "No priority",
      "none": "No priority",
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent",
    };
    const normalizedWsPriority = priorityDisplayMap[rawWsPriority] || "Medium";

    return (
      (!organization && name.trim() !== (currentWorkspace.name || "").trim()) ||
      (!organization && logoChanged) ||
      description.trim() !== (currentWorkspace.description || "").trim() ||
      slug.trim().toLowerCase() !== (currentWorkspace.slug || "").trim().toLowerCase() ||
      defaultProjectView !== (currentWorkspace.default_project_view || "board") ||
      defaultTaskView !== (currentWorkspace.default_task_view || "board") ||
      defaultTaskPriority !== normalizedWsPriority ||
      defaultProjectVisibility !== (currentWorkspace.default_project_visibility || "private") ||
      defaultMemberRole !== (currentWorkspace.default_member_role || "Member") ||
      notifyNewMembers !== (currentWorkspace.notify_new_members !== false) ||
      notifyWorkspaceActivity !== (currentWorkspace.notify_workspace_activity !== false) ||
      defaultLanguage !== (currentWorkspace.default_language || "en") ||
      defaultTimezone !== (currentWorkspace.default_timezone || "UTC") ||
      dateFormat !== (currentWorkspace.date_format || "YYYY-MM-DD") ||
      timeFormat !== (currentWorkspace.time_format || "24h") ||
      firstDayOfWeek !== (currentWorkspace.first_day_of_week ? currentWorkspace.first_day_of_week.toLowerCase() : "monday")
    );
  }, [
    currentWorkspace,
    organization,
    name,
    description,
    slug,
    logoPreview,
    isLogoRemoved,
    defaultProjectView,
    defaultTaskView,
    defaultTaskPriority,
    defaultProjectVisibility,
    defaultMemberRole,
    notifyNewMembers,
    notifyWorkspaceActivity,
    defaultLanguage,
    defaultTimezone,
    dateFormat,
    timeFormat,
    firstDayOfWeek,
  ]);

  // Warn before unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Live auto-suggest slug from name when user hasn't explicitly customized slug
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setFieldErrors((prev) => ({ ...prev, name: null }));

    if (!hasManuallyEditedSlug && (!currentWorkspace?.slug || currentWorkspace.slug === slug)) {
      const suggested = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (suggested) {
        setSlug(`kriri-${suggested}`);
      }
    }
  };

  // Validate slug as user edits
  const handleSlugChange = (e) => {
    setHasManuallyEditedSlug(true);
    const rawVal = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(rawVal);
    setFieldErrors((prev) => ({ ...prev, slug: null }));

    if (rawVal.length < 2) {
      setSlugStatus({ checking: false, available: false, message: "Minimum 2 characters" });
      return;
    }

    if (rawVal === currentWorkspace?.slug) {
      setSlugStatus({ checking: false, available: true, message: "Current workspace slug" });
      return;
    }

    setSlugStatus({ checking: true, available: false, message: "Checking availability..." });
  };

  // Debounced slug uniqueness check
  useEffect(() => {
    if (!slug || slug.length < 2 || slug === currentWorkspace?.slug) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/workspaces/check-slug?slug=${encodeURIComponent(slug)}`);
        if (res?.available) {
          setSlugStatus({ checking: false, available: true, message: "Slug is available" });
        } else {
          setSlugStatus({
            checking: false,
            available: false,
            message: "Slug is already taken by another workspace",
          });
        }
      } catch (err) {
        setSlugStatus({ checking: false, available: true, message: "" });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [slug, currentWorkspace?.slug]);

  // Handle Logo file select
  const handleLogoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      sileo.error({
        title: "Unsupported Format",
        description: "Please upload a PNG, JPG, or WebP image.",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      sileo.error({
        title: "File Too Large",
        description: "Workspace logo cannot exceed 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
      setIsLogoRemoved(false);
      playUiSound("pop");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoUrl(null);
    setIsLogoRemoved(true);
    playUiSound("delete");
  };

  // Copy helper
  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    playUiSound("copy");
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    }
    sileo.success({
      title: "Copied to clipboard",
      description: text,
    });
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!isAdminOrOwner || !isDirty || isSaving) return;

    const errors = {};
    const trimmedName = name.trim();
    if (!organization && (trimmedName.length < 2 || trimmedName.length > 60)) {
      errors.name = "Workspace name must be between 2 and 60 characters.";
    }

    const cleanSlug = slug.toLowerCase().trim();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(cleanSlug) || cleanSlug.length < 2 || cleanSlug.length > 60) {
      errors.slug = "Slug must be 2-60 characters and contain only lowercase letters, numbers, and hyphens.";
    } else if (slugStatus.available === false && cleanSlug !== currentWorkspace?.slug) {
      errors.slug = "This slug is currently unavailable.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      playUiSound("error");
      sileo.error({
        title: "Validation Error",
        description: "Please check the highlighted fields before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      let finalLogoUrl = logoUrl;
      if (!organization) {
        if (isLogoRemoved) {
          await api.delete("/workspaces/current/logo");
          finalLogoUrl = null;
        } else if (logoPreview) {
          const logoRes = await api.post("/workspaces/current/logo", { image: logoPreview });
          if (logoRes?.logo_url) {
            finalLogoUrl = logoRes.logo_url;
          }
        }
      }

      const payload = {
        description: description.trim(),
        slug: cleanSlug,
        default_project_view: defaultProjectView,
        default_task_view: defaultTaskView,
        default_task_priority: defaultTaskPriority,
        default_project_visibility: defaultProjectVisibility,
        default_member_role: defaultMemberRole,
        notify_new_members: notifyNewMembers,
        notify_workspace_activity: notifyWorkspaceActivity,
        default_language: defaultLanguage,
        default_timezone: defaultTimezone,
        date_format: dateFormat,
        time_format: timeFormat,
        first_day_of_week: firstDayOfWeek.toLowerCase(),
      };

      if (!organization) {
        payload.name = trimmedName;
        payload.logo_url = finalLogoUrl;
      }

      const updated = await api.patch("/workspaces/current", payload);

      if (typeof window !== "undefined") {
        if (dateFormat) localStorage.setItem("kriri-calendar-date-order", dateFormat.toLowerCase());
        if (timeFormat) localStorage.setItem("kriri-time-format", timeFormat);
        if (firstDayOfWeek) localStorage.setItem("kriri-first-day", firstDayOfWeek.toLowerCase());
        if (defaultTimezone) localStorage.setItem("kriri-timezone", defaultTimezone);
        window.dispatchEvent(new Event("storage"));
      }

      playUiSound("success");
      sileo.success({
        title: "Settings Saved",
        description: "Workspace configuration has been successfully updated.",
      });

      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(updated);
      }
      initializeFromWorkspace(updated);
    } catch (err) {
      console.error("Save workspace error:", err);
      const msg = err.message || "Failed to save workspace settings.";
      setFieldErrors((prev) => ({ ...prev, general: msg }));
      sileo.error({
        title: "Save Failed",
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentDisplayLogo = isLogoRemoved
    ? null
    : logoPreview || logoUrl || organization?.imageUrl;

  // Options configuration
  const languageOptions = [{ value: "en", label: "English (US)" }];

  const timezoneOptions = useMemo(
    () => TIMEZONES.map((tz) => ({ value: tz, label: formatTimezoneOffset(tz) })),
    []
  );

  const dateFormatOptions = useMemo(
    () => [
      { value: "YYYY-MM-DD", label: `YYYY-MM-DD (${getDatePreview("YYYY-MM-DD")})` },
      { value: "DD/MM/YYYY", label: `DD/MM/YYYY (${getDatePreview("DD/MM/YYYY")})` },
      { value: "MM/DD/YYYY", label: `MM/DD/YYYY (${getDatePreview("MM/DD/YYYY")})` },
    ],
    []
  );

  const timeFormatOptions = useMemo(
    () => [
      { value: "12h", label: `12-hour (${getTimePreview("12h")})` },
      { value: "24h", label: `24-hour (${getTimePreview("24h")})` },
    ],
    []
  );

  const firstDayOptions = [
    { value: "sunday", label: "Sunday" },
    { value: "monday", label: "Monday" },
    { value: "saturday", label: "Saturday" },
  ];

  const projectViewOptions = [
    { value: "board", label: "Board (Kanban)" },
    { value: "list", label: "List" },
    { value: "timeline", label: "Timeline" },
  ];

  const taskViewOptions = [
    { value: "board", label: "Board" },
    { value: "list", label: "List" },
  ];

  const taskPriorityOptions = [
    { value: "No priority", label: "No Priority" },
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Urgent", label: "Urgent" },
  ];

  const projectVisibilityOptions = [
    { value: "private", label: "Private (Invite only)" },
    { value: "workspace", label: "Workspace (All members)" },
  ];

  const memberRoleOptions = [
    { value: "Member", label: "Member (Create, edit, assign)" },
    { value: "Viewer", label: "Viewer (Read-only access)" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Page Header (No pills here - pill is kept on the main container) */}
      <div className="pb-4 border-b border-border-subtle">
        <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
          Settings
        </h3>
        <p className="text-[12px] text-text-muted mt-0.5">
          Configure workspace identity, regional standards, and default behaviors.
        </p>
      </div>

      {!isAdminOrOwner && (
        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[12px] flex items-center gap-2.5">
          <Info size={14} className="shrink-0" />
          <span>
            You are viewing this workspace as a team member. Administrative configuration settings are read-only.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WORKSPACE IDENTITY                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <div className="pt-2 pb-2">
          <h4 className="text-[13px] font-semibold text-foreground">
            Workspace Identity
          </h4>
          <p className="text-[11.5px] text-text-muted mt-0.5">
            Public workspace URL slug and canonical address.
          </p>
        </div>

        <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
          {/* Logo & Name for Personal Workspaces ONLY */}
          {!organization && (
            <>
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-[13px] font-medium text-foreground block">
                    Workspace Logo
                  </span>
                  <span className="text-[11.5px] text-text-muted block">
                    PNG, JPG, or WebP up to 5MB.
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                  <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {currentDisplayLogo ? (
                      <img
                        src={currentDisplayLogo}
                        alt={name || "Workspace Logo"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-sm text-foreground">
                        {name?.[0]?.toUpperCase() || "W"}
                      </span>
                    )}
                  </div>

                  {isAdminOrOwner && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoFileSelect}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-2.5 rounded-lg bg-surface-hover hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground border border-border text-[11.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={12} />
                        <span>{currentDisplayLogo ? "Replace" : "Upload"}</span>
                      </button>
                      {currentDisplayLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-1.5 h-8 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove logo"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-[13px] font-medium text-foreground block">
                    Workspace Name <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11.5px] text-text-muted block">
                    Display name throughout Kriri wherever workspace is referenced.
                  </span>
                </div>

                <div className="w-full sm:w-64 space-y-1 shrink-0 self-start sm:self-auto">
                  <input
                    type="text"
                    value={name}
                    maxLength={60}
                    disabled={!isAdminOrOwner}
                    onChange={handleNameChange}
                    placeholder="e.g. Acme Engineering"
                    className="w-full h-8 px-2.5 rounded-lg bg-surface-hover border border-border text-[12px] text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60 transition-colors"
                  />
                  <div className="flex items-center justify-between text-[10.5px]">
                    {fieldErrors.name ? (
                      <span className="text-red-500">{fieldErrors.name}</span>
                    ) : (
                      <span className="text-text-muted">Min 2, max 60 chars</span>
                    )}
                    <span className="text-text-muted">{name.length}/60</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Workspace Description */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Workspace Description
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Brief description of this workspace's mission, team focus, or responsibilities.
              </span>
            </div>

            <div className="w-full sm:w-72 space-y-1 shrink-0 self-start sm:self-auto">
              <textarea
                value={description}
                maxLength={250}
                rows={3}
                disabled={!isAdminOrOwner}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this workspace..."
                className="w-full p-2.5 rounded-lg bg-surface-hover border border-border text-[12px] text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60 transition-colors resize-none"
              />
              <div className="flex justify-end text-[10.5px] text-text-muted">
                <span>{description.length}/250</span>
              </div>
            </div>
          </div>

          {/* Canonical Slug / URL */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Workspace URL & Slug <span className="text-red-500">*</span>
              </span>
              <span className="text-[11.5px] text-text-muted block">
                The unique web address for accessing your workspace boards and tasks.
              </span>
              {slugStatus.message && (
                <span
                  className={`text-[11px] inline-flex items-center gap-1 mt-0.5 ${
                    slugStatus.available ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {slugStatus.available ? <Check size={11} /> : <AlertTriangle size={11} />}
                  <span>{slugStatus.message}</span>
                </span>
              )}
              {fieldErrors.slug && (
                <span className="text-[11px] text-red-500 block">{fieldErrors.slug}</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 self-start sm:self-auto">
              <div className="flex items-center h-8 px-2.5 rounded-lg bg-surface-hover border border-border text-[12.5px] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-colors">
                <span className="text-text-muted select-none shrink-0 pr-1 text-[11.5px]">
                  kriri.app/
                </span>
                <input
                  type="text"
                  value={slug}
                  disabled={!isAdminOrOwner}
                  onChange={handleSlugChange}
                  placeholder="workspace-slug"
                  className="bg-transparent text-[12.5px] text-foreground font-medium focus:outline-none lowercase w-32 sm:w-44"
                />
              </div>

              <button
                type="button"
                onClick={() => handleCopy(`https://kriri.app/${slug}`, "slug")}
                className="h-8 px-3 rounded-lg bg-surface-hover hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground border border-border text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                {copiedSlug ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REGIONAL SETTINGS (Clerk Dropdowns)                                    */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <div className="pt-4 pb-2">
          <h4 className="text-[13px] font-semibold text-foreground">
            Regional Settings
          </h4>
          <p className="text-[11.5px] text-text-muted mt-0.5">
            Configure default workspace time zones, calendar week starting days, and timestamp formatting.
          </p>
        </div>

        <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
          {/* Default Language */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Default Language
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Workspace default language for automated summaries, notices, and UI labels.
              </span>
            </div>
            <ClerkSelect
              value={defaultLanguage}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              options={languageOptions}
              minWidth="min-w-[130px]"
            />
          </div>

          {/* Workspace Time Zone */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Workspace Time Zone
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Timestamps, daily standup summaries, cycle boundaries, and task due dates align to this zone.
              </span>
            </div>
            <ClerkSelect
              value={defaultTimezone}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultTimezone(e.target.value)}
              options={timezoneOptions}
              minWidth="min-w-[180px]"
            />
          </div>

          {/* Date Format (No pill - live preview formatted in dropdown option) */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Date Format
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Preferred presentation for roadmap dates, deadlines, and issue creation headers.
              </span>
            </div>
            <ClerkSelect
              value={dateFormat}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDateFormat(e.target.value)}
              options={dateFormatOptions}
              minWidth="min-w-[190px]"
            />
          </div>

          {/* Time Format (No pill - live preview formatted in dropdown option) */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Time Format
              </span>
              <span className="text-[11.5px] text-text-muted block">
                12-hour (AM/PM) or 24-hour timestamp rendering across workspace activity logs.
              </span>
            </div>
            <ClerkSelect
              value={timeFormat}
              disabled={!isAdminOrOwner}
              onChange={(e) => setTimeFormat(e.target.value)}
              options={timeFormatOptions}
              minWidth="min-w-[160px]"
            />
          </div>

          {/* First Day of the Week */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                First Day of the Week
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Configures the initial calendar column in sprint roadmaps, cycles, and scheduling pickers.
              </span>
            </div>
            <ClerkSelect
              value={firstDayOfWeek.toLowerCase()}
              disabled={!isAdminOrOwner}
              onChange={(e) => setFirstDayOfWeek(e.target.value)}
              options={firstDayOptions}
              minWidth="min-w-[130px]"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. WORKSPACE PREFERENCES (Clerk Dropdowns & Switches)                     */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <div className="pt-4 pb-2">
          <h4 className="text-[13px] font-semibold text-foreground">
            Workspace Preferences
          </h4>
          <p className="text-[11.5px] text-text-muted mt-0.5">
            Set default views, issue priorities, visibility levels, and notification triggers.
          </p>
        </div>

        <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
          {/* Default Project View */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Default Project View
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Initial layout presented when collaborators open a new workspace project.
              </span>
            </div>
            <ClerkSelect
              value={defaultProjectView}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultProjectView(e.target.value)}
              options={projectViewOptions}
              minWidth="min-w-[150px]"
            />
          </div>

          {/* Default Task View */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Default Task View
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Standard presentation for workspace task queues and team backlog items.
              </span>
            </div>
            <ClerkSelect
              value={defaultTaskView}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultTaskView(e.target.value)}
              options={taskViewOptions}
              minWidth="min-w-[130px]"
            />
          </div>

          {/* Default Task Priority */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Default Task Priority
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Default urgency assigned to tasks created without an explicit priority tag.
              </span>
            </div>
            <ClerkSelect
              value={defaultTaskPriority}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultTaskPriority(e.target.value)}
              options={taskPriorityOptions}
              minWidth="min-w-[130px]"
            />
          </div>

          {/* Default Project Visibility */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Default Project Visibility
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Controls whether newly created projects are workspace-visible or private invite-only.
              </span>
            </div>
            <ClerkSelect
              value={defaultProjectVisibility}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultProjectVisibility(e.target.value)}
              options={projectVisibilityOptions}
              minWidth="min-w-[180px]"
            />
          </div>

          {/* Default Member Role */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Default Member Role
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Initial authority granted when new teammates accept a workspace invitation.
              </span>
            </div>
            <ClerkSelect
              value={defaultMemberRole}
              disabled={!isAdminOrOwner}
              onChange={(e) => setDefaultMemberRole(e.target.value)}
              options={memberRoleOptions}
              minWidth="min-w-[210px]"
            />
          </div>

          {/* New Member Notifications */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                New member notifications
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Notify workspace administrators when a new colleague joins or accepts an invitation.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyNewMembers}
              disabled={!isAdminOrOwner}
              onClick={() => setNotifyNewMembers((prev) => !prev)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:opacity-50 ${
                notifyNewMembers ? "bg-[var(--accent,#5e6ad2)]" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  notifyNewMembers ? "left-4.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Workspace Activity Notifications */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-sm">
              <span className="text-[13px] font-medium text-foreground block">
                Workspace activity notifications
              </span>
              <span className="text-[11.5px] text-text-muted block">
                Send alerts and cycle digests for major project milestones and milestone completions.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyWorkspaceActivity}
              disabled={!isAdminOrOwner}
              onClick={() => setNotifyWorkspaceActivity((prev) => !prev)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:opacity-50 ${
                notifyWorkspaceActivity ? "bg-[var(--accent,#5e6ad2)]" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  notifyWorkspaceActivity ? "left-4.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. WORKSPACE INFORMATION (READ-ONLY METADATA)                             */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <div className="pt-4 pb-2">
          <h4 className="text-[13px] font-semibold text-foreground">
            Workspace Information
          </h4>
          <p className="text-[11.5px] text-text-muted mt-0.5">
            Technical metadata, ownership attribution, and subscription details.
          </p>
        </div>

        <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
          {/* Workspace ID */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              Workspace ID
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-mono text-text-muted select-all">
                {currentWorkspace?.id || "—"}
              </span>
              {currentWorkspace?.id && (
                <button
                  type="button"
                  onClick={() => handleCopy(currentWorkspace.id, "id")}
                  className="text-text-muted hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  title="Copy ID"
                >
                  {copiedId ? (
                    <Check size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Workspace Type & Tier */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              Workspace Type & Tier
            </span>
            <span className="text-[12.5px] text-foreground font-medium">
              {organization ? "Organization Workspace" : "Personal Workspace"} · {currentWorkspace?.plan || "Free Tier"}
            </span>
          </div>

          {/* Active Members */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              Active Members
            </span>
            <span className="text-[12.5px] text-foreground font-medium">
              {currentWorkspace?.member_count || (organization?.membersCount ?? 1)} members
            </span>
          </div>

          {/* Workspace Owner */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              Workspace Owner
            </span>
            <span className="text-[12.5px] text-foreground font-medium">
              {currentWorkspace?.owner_name || currentWorkspace?.owner_email || "Organization Admin"}
            </span>
          </div>

          {/* Created Date */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              Created Date
            </span>
            <span className="text-[12.5px] text-foreground font-medium">
              {currentWorkspace?.created_at
                ? formatKririDate(currentWorkspace.created_at)
                : "—"}
            </span>
          </div>

          {/* Last Configuration Update */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              Last Configuration Update
            </span>
            <span className="text-[12.5px] text-foreground font-medium">
              {currentWorkspace?.updated_at
                ? formatKririDate(currentWorkspace.updated_at, "relative")
                : "Just now"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. STICKY SAVE / RESET ACTION BAR                                         */}
      {/* ========================================================================= */}
      {isDirty && isAdminOrOwner && (
        <div className="sticky bottom-4 z-30 mt-6 p-3 rounded-xl bg-surface/95 backdrop-blur-md border border-border shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent,#5e6ad2)] animate-pulse" />
            <span className="text-[12px] font-medium text-foreground">
              You have unsaved changes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => initializeFromWorkspace(currentWorkspace)}
              className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveChanges}
              className="px-3.5 py-1.5 rounded-lg kriri-primary-btn text-[11.5px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={12} className="text-white" />
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
