import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Globe,
  Clock,
  Calendar,
  Layers,
  Keyboard,
  Eye,
  Volume2,
  VolumeX,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib/api";
import { playUiSound } from "../../lib/sound";
import {
  getPreferences,
  applyPreferencesToDom,
} from "../../lib/userPreferences";
import {
  getCustomShortcuts,
  resetCustomShortcuts,
} from "../../lib/shortcutsConfig";

const LANDING_PAGES = [
  { id: "dashboard", label: "Dashboard", desc: "Overview of your workspace activity and metrics" },
  { id: "tasks", label: "Issues & Tasks", desc: "List of all workspace issues, bugs, and backlog" },
  { id: "kanban", label: "Board", desc: "Kanban board view with drag-and-drop status lanes" },
  { id: "inbox", label: "Inbox", desc: "Notifications, mentions, and activity stream" },
  { id: "agent", label: "Kriri Agent", desc: "Autonomous AI assistant and intelligence workspace" },
  { id: "projects", label: "Projects", desc: "Roadmaps, active project milestones, and cycles" },
  { id: "analytics", label: "Analytics", desc: "Sprint velocity, cycle times, and throughput graphs" },
  { id: "team", label: "Team", desc: "Team directory, workloads, and capacity planning" },
];

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

const LANGUAGES = [
  { code: "en-US", name: "English (United States)" },
  { code: "en-GB", name: "English (United Kingdom)" },
  { code: "es-ES", name: "Español (Spanish)" },
  { code: "fr-FR", name: "Français (French)" },
  { code: "de-DE", name: "Deutsch (German)" },
  { code: "ja-JP", name: "日本語 (Japanese)" },
];

export default function PreferencesView() {
  const initialPrefs = getPreferences();

  // 1. General Preferences
  const [defaultLandingPage, setDefaultLandingPage] = useState(
    () => localStorage.getItem("kriri-default-view") || "dashboard"
  );
  const [startPageBehavior, setStartPageBehavior] = useState(
    () => localStorage.getItem("kriri-start-page-behavior") || "default_view"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("kriri-sidebar-collapsed") === "true"
  );
  const [rememberLastPage, setRememberLastPage] = useState(
    () => localStorage.getItem("kriri-remember-last-page") !== "false"
  );
  const [openLinksInNewTab, setOpenLinksInNewTab] = useState(
    () => localStorage.getItem("kriri-open-links-new-tab") === "true"
  );

  // 2. Language & Region
  const [language, setLanguage] = useState(
    () => localStorage.getItem("kriri-language") || "en-US"
  );
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(
    () => localStorage.getItem("kriri-first-day") || "monday"
  );
  const [nameFormat, setNameFormat] = useState(
    () => localStorage.getItem("kriri-name-format") || "full"
  );

  // 3. Date & Time
  const [dateFormat, setDateFormat] = useState(
    () => localStorage.getItem("kriri-date-format") || "relative"
  );
  const [calendarDateOrder, setCalendarDateOrder] = useState(
    () => localStorage.getItem("kriri-calendar-date-order") || "dd/mm/yyyy"
  );
  const [timeFormat, setTimeFormat] = useState(
    () => localStorage.getItem("kriri-time-format") || "12h"
  );
  const [timezone, setTimezone] = useState(() => {
    try {
      return (
        localStorage.getItem("kriri-timezone") ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC"
      );
    } catch (e) {
      return "UTC";
    }
  });

  // 4. Default Views
  const [defaultProjectView, setDefaultProjectView] = useState(
    () => localStorage.getItem("kriri-default-project-view") || "list"
  );
  const [defaultTaskView, setDefaultTaskView] = useState(
    () => localStorage.getItem("kriri-default-task-view") || "board"
  );
  const [defaultSortOrder, setDefaultSortOrder] = useState(
    () => localStorage.getItem("kriri-default-sort-order") || "created_desc"
  );
  const [rememberLastView, setRememberLastView] = useState(
    () => localStorage.getItem("kriri-remember-last-view") !== "false"
  );

  // 5. Shortcuts
  const [shortcutsEnabled, setShortcutsEnabled] = useState(
    () => localStorage.getItem("kriri-shortcuts-enabled") !== "false"
  );
  const [shortcutScheme, setShortcutScheme] = useState(
    () => localStorage.getItem("kriri-shortcut-scheme") || "linear"
  );
  const [isShortcutSheetOpen, setIsShortcutSheetOpen] = useState(false);

  // 6. Accessibility & Audio
  const [soundEffects, setSoundEffects] = useState(
    () => localStorage.getItem("kriri-sound-effects") !== "false"
  );
  const [reduceMotion, setReduceMotion] = useState(
    () => localStorage.getItem("kriri-animations") === "false"
  );
  const [enhancedFocus, setEnhancedFocus] = useState(
    () => localStorage.getItem("kriri-enhanced-focus") === "true"
  );
  const [interfaceScale, setInterfaceScale] = useState(
    () => localStorage.getItem("kriri-interface-scale") || "100%"
  );

  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync to backend DB when changed
  const syncPreferenceToDb = async (patch) => {
    try {
      await api.patch("/user/preferences", patch);
    } catch (err) {
      console.warn("Preference background sync note:", err.message);
    }
  };

  const handleUpdateSetting = (key, value, storageKey, dbField) => {
    localStorage.setItem(storageKey, String(value));
    playUiSound("toggle");
    applyPreferencesToDom();

    if (dbField) {
      syncPreferenceToDb({ [dbField]: value });
    }

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  // Restore factory defaults
  const handleResetDefaults = async () => {
    if (!window.confirm("Restore all general preferences to default settings?")) return;

    localStorage.setItem("kriri-default-view", "dashboard");
    setDefaultLandingPage("dashboard");

    localStorage.setItem("kriri-start-page-behavior", "default_view");
    setStartPageBehavior("default_view");

    localStorage.setItem("kriri-sidebar-collapsed", "false");
    setSidebarCollapsed(false);

    localStorage.setItem("kriri-remember-last-page", "true");
    setRememberLastPage(true);

    localStorage.setItem("kriri-open-links-new-tab", "false");
    setOpenLinksInNewTab(false);

    localStorage.setItem("kriri-language", "en-US");
    setLanguage("en-US");

    localStorage.setItem("kriri-first-day", "monday");
    setFirstDayOfWeek("monday");

    localStorage.setItem("kriri-name-format", "full");
    setNameFormat("full");

    localStorage.setItem("kriri-date-format", "relative");
    setDateFormat("relative");

    localStorage.setItem("kriri-calendar-date-order", "dd/mm/yyyy");
    setCalendarDateOrder("dd/mm/yyyy");

    localStorage.setItem("kriri-time-format", "12h");
    setTimeFormat("12h");

    localStorage.setItem("kriri-default-project-view", "list");
    setDefaultProjectView("list");

    localStorage.setItem("kriri-default-task-view", "board");
    setDefaultTaskView("board");

    localStorage.setItem("kriri-default-sort-order", "created_desc");
    setDefaultSortOrder("created_desc");

    localStorage.setItem("kriri-remember-last-view", "true");
    setRememberLastView(true);

    localStorage.setItem("kriri-shortcuts-enabled", "true");
    setShortcutsEnabled(true);

    localStorage.setItem("kriri-shortcut-scheme", "linear");
    setShortcutScheme("linear");
    resetCustomShortcuts();

    localStorage.setItem("kriri-sound-effects", "true");
    setSoundEffects(true);

    localStorage.setItem("kriri-animations", "true");
    setReduceMotion(false);

    localStorage.setItem("kriri-enhanced-focus", "false");
    setEnhancedFocus(false);

    localStorage.setItem("kriri-interface-scale", "100%");
    setInterfaceScale("100%");

    applyPreferencesToDom();
    playUiSound("success");

    syncPreferenceToDb({
      default_landing_page: "dashboard",
      start_page_behavior: "default_view",
      sidebar_collapsed: false,
      remember_last_page: true,
      open_links_in_new_tab: false,
      language: "en-US",
      first_day_of_week: "monday",
      name_format: "full",
      date_format: "relative",
      calendar_date_order: "dd/mm/yyyy",
      time_format: "12h",
      default_project_view: "list",
      default_task_view: "board",
      default_sort_order: "created_desc",
      remember_last_view: true,
      shortcuts_enabled: true,
      shortcut_scheme: "linear",
      sound_effects: true,
      fluid_animations: true,
      reduce_motion: false,
      enhanced_focus: false,
      interface_scale: "100%",
    });

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Preferences
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Customize your everyday KRIRI interface, workflow behaviors, dates, and navigation defaults.
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
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: GENERAL PREFERENCES                                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            General Preferences
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Configure default startup behavior and navigation settings.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Default Landing Page */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Default Landing Page
              </h4>
              <p className="text-[12px] text-text-muted">
                The initial screen shown whenever you sign in or navigate to the workspace home.
              </p>
            </div>
            <select
              value={defaultLandingPage}
              onChange={(e) => {
                const val = e.target.value;
                setDefaultLandingPage(val);
                handleUpdateSetting(
                  "defaultLandingPage",
                  val,
                  "kriri-default-view",
                  "default_landing_page"
                );
              }}
              className="h-9 px-3 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer shrink-0"
            >
              {LANDING_PAGES.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface text-foreground">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Page Behavior */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Resume Last Visited Page
              </h4>
              <p className="text-[12px] text-text-muted">
                Automatically return to the exact project, task, or board you were viewing before closing.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={startPageBehavior === "last_visited"}
              onClick={() => {
                const next = startPageBehavior === "last_visited" ? "default_view" : "last_visited";
                setStartPageBehavior(next);
                handleUpdateSetting(
                  "startPageBehavior",
                  next,
                  "kriri-start-page-behavior",
                  "start_page_behavior"
                );
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                startPageBehavior === "last_visited"
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  startPageBehavior === "last_visited" ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Open Links in New Tab */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Open External Links in New Tab
              </h4>
              <p className="text-[12px] text-text-muted">
                Always open attached URLs, PR links, and Figma specs in a separate browser tab.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={openLinksInNewTab}
              onClick={() => {
                const next = !openLinksInNewTab;
                setOpenLinksInNewTab(next);
                handleUpdateSetting(
                  "openLinksInNewTab",
                  next,
                  "kriri-open-links-new-tab",
                  "open_links_in_new_tab"
                );
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                openLinksInNewTab
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  openLinksInNewTab ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: LANGUAGE & REGION                                              */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Language & Region
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Set your preferred interface locale and user name display format.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Language */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Application Language
              </h4>
              <p className="text-[12px] text-text-muted">
                Primary interface language used for system labels, actions, and messages.
              </p>
            </div>
            <select
              value={language}
              onChange={(e) => {
                const val = e.target.value;
                setLanguage(val);
                handleUpdateSetting("language", val, "kriri-language", "language");
              }}
              className="h-9 px-3 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer shrink-0"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-surface text-foreground">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name Display Format */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Teammate Name Format
              </h4>
              <p className="text-[12px] text-text-muted">
                How teammates are identified in task lists, issue assignees, and comment threads.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNameFormat("full");
                  handleUpdateSetting("nameFormat", "full", "kriri-name-format", "name_format");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  nameFormat === "full"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Full names
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameFormat("username");
                  handleUpdateSetting("nameFormat", "username", "kriri-name-format", "name_format");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  nameFormat === "username"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Usernames (@handle)
              </button>
            </div>
          </div>

          {/* First day of week */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                First Day of the Week
              </h4>
              <p className="text-[12px] text-text-muted">
                Determines start column for calendar pickers, cycle sprint dates, and roadmaps.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFirstDayOfWeek("monday");
                  handleUpdateSetting("firstDayOfWeek", "monday", "kriri-first-day", "first_day_of_week");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  firstDayOfWeek === "monday"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Monday
              </button>
              <button
                type="button"
                onClick={() => {
                  setFirstDayOfWeek("sunday");
                  handleUpdateSetting("firstDayOfWeek", "sunday", "kriri-first-day", "first_day_of_week");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  firstDayOfWeek === "sunday"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Sunday
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: DATE & TIME                                                    */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Date & Time Format
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Standardize timestamps, calendar ordering, and timezone localization.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Time Zone */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Account Time Zone
              </h4>
              <p className="text-[12px] text-text-muted">
                Used to compute accurate task deadlines, milestone timers, and cycle dates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timezone}
                onChange={(e) => {
                  const val = e.target.value;
                  setTimezone(val);
                  handleUpdateSetting("timezone", val, "kriri-timezone", "timezone");
                }}
                className="h-9 px-3 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-surface text-foreground">
                    {tz}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  try {
                    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    if (detected) {
                      setTimezone(detected);
                      handleUpdateSetting("timezone", detected, "kriri-timezone", "timezone");
                    }
                  } catch (e) {}
                }}
                className="h-9 px-2.5 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-text-muted hover:text-foreground text-[11px] font-medium transition-colors"
                title="Detect timezone from browser"
              >
                Auto-detect
              </button>
            </div>
          </div>

          {/* Time Format */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Time Format
              </h4>
              <p className="text-[12px] text-text-muted">
                Choose between 12-hour AM/PM and 24-hour international military time.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTimeFormat("12h");
                  handleUpdateSetting("timeFormat", "12h", "kriri-time-format", "time_format");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  timeFormat === "12h"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                12-hour (1:30 PM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeFormat("24h");
                  handleUpdateSetting("timeFormat", "24h", "kriri-time-format", "time_format");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  timeFormat === "24h"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                24-hour (13:30)
              </button>
            </div>
          </div>

          {/* Date Format */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Relative vs Absolute Dates
              </h4>
              <p className="text-[12px] text-text-muted">
                Show relative timestamps ("2 hours ago") or explicit dates ("15 Nov 2026").
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDateFormat("relative");
                  handleUpdateSetting("dateFormat", "relative", "kriri-date-format", "date_format");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  dateFormat === "relative"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Relative
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFormat("absolute");
                  handleUpdateSetting("dateFormat", "absolute", "kriri-date-format", "date_format");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  dateFormat === "absolute"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Absolute
              </button>
            </div>
          </div>

          {/* Calendar Date Order */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Calendar Date Order
              </h4>
              <p className="text-[12px] text-text-muted">
                Order of day, month, and year across table columns and date pickers.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCalendarDateOrder("dd/mm/yyyy");
                  handleUpdateSetting("calendarDateOrder", "dd/mm/yyyy", "kriri-calendar-date-order", "calendar_date_order");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  calendarDateOrder === "dd/mm/yyyy"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                DD/MM/YYYY
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarDateOrder("mm/dd/yyyy");
                  handleUpdateSetting("calendarDateOrder", "mm/dd/yyyy", "kriri-calendar-date-order", "calendar_date_order");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  calendarDateOrder === "mm/dd/yyyy"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                MM/DD/YYYY
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarDateOrder("yyyy-mm-dd");
                  handleUpdateSetting("calendarDateOrder", "yyyy-mm-dd", "kriri-calendar-date-order", "calendar_date_order");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  calendarDateOrder === "yyyy-mm-dd"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                YYYY-MM-DD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: DEFAULT VIEWS                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Default Views
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Choose your preferred layouts for projects, tasks, and task sorting.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Default Task View */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Default Tasks Layout
              </h4>
              <p className="text-[12px] text-text-muted">
                Initial layout when opening the tasks and issues section.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDefaultTaskView("board");
                  handleUpdateSetting("defaultTaskView", "board", "kriri-default-task-view", "default_task_view");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  defaultTaskView === "board"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Board (Kanban)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultTaskView("list");
                  handleUpdateSetting("defaultTaskView", "list", "kriri-default-task-view", "default_task_view");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  defaultTaskView === "list"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Default Project View */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Default Projects Layout
              </h4>
              <p className="text-[12px] text-text-muted">
                Initial layout when navigating to project directories.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDefaultProjectView("list");
                  handleUpdateSetting("defaultProjectView", "list", "kriri-default-project-view", "default_project_view");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  defaultProjectView === "list"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                List View
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultProjectView("board");
                  handleUpdateSetting("defaultProjectView", "board", "kriri-default-project-view", "default_project_view");
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  defaultProjectView === "board"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Roadmap Board
              </button>
            </div>
          </div>

          {/* Default Sort Order */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Default Sort Order
              </h4>
              <p className="text-[12px] text-text-muted">
                How issues and tasks are initially ordered in lists.
              </p>
            </div>
            <select
              value={defaultSortOrder}
              onChange={(e) => {
                const val = e.target.value;
                setDefaultSortOrder(val);
                handleUpdateSetting("defaultSortOrder", val, "kriri-default-sort-order", "default_sort_order");
              }}
              className="h-9 px-3 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer shrink-0"
            >
              <option value="created_desc" className="bg-surface text-foreground">Date Created (Newest first)</option>
              <option value="priority_desc" className="bg-surface text-foreground">Priority (Urgent first)</option>
              <option value="due_date_asc" className="bg-surface text-foreground">Due Date (Soonest first)</option>
              <option value="title_asc" className="bg-surface text-foreground">Title (Alphabetical A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: KEYBOARD SHORTCUTS                                             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Keyboard Shortcuts
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Boost navigation speed using Linear-inspired single-key and modifier shortcuts.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Enable Global Shortcuts
              </h4>
              <p className="text-[12px] text-text-muted">
                Allow keyboard triggers like <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[11px]">⌘K</kbd> for Command Palette and <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[11px]">C</kbd> to create issue.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shortcutsEnabled}
              onClick={() => {
                const next = !shortcutsEnabled;
                setShortcutsEnabled(next);
                handleUpdateSetting("shortcutsEnabled", next, "kriri-shortcuts-enabled", "shortcuts_enabled");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                shortcutsEnabled
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  shortcutsEnabled ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Shortcut Scheme
              </h4>
              <p className="text-[12px] text-text-muted">
                Preset configuration mapping keys to common editor behaviors.
              </p>
            </div>
            <select
              value={shortcutScheme}
              onChange={(e) => {
                const val = e.target.value;
                setShortcutScheme(val);
                handleUpdateSetting("shortcutScheme", val, "kriri-shortcut-scheme", "shortcut_scheme");
              }}
              className="h-9 px-3 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer shrink-0"
            >
              <option value="linear" className="bg-surface text-foreground">Linear Default (Recommended)</option>
              <option value="notion" className="bg-surface text-foreground">Notion Style</option>
              <option value="vscode" className="bg-surface text-foreground">VS Code Style</option>
            </select>
          </div>

          {/* Quick Shortcuts Cheat-Sheet */}
          <div className="p-4 sm:p-5 bg-surface-hover/30">
            <div className="text-[12px] font-medium text-text-muted mb-3">
              Essential Shortcuts Reference
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-[12px]">
                <span className="text-foreground">Command Palette</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[10.5px]">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-[12px]">
                <span className="text-foreground">Create Issue</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[10.5px]">C</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-[12px]">
                <span className="text-foreground">Toggle AI Agent</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[10.5px]">⌘J</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-[12px]">
                <span className="text-foreground">Toggle Sidebar</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[10.5px]">⌘B</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-[12px]">
                <span className="text-foreground">Search Issues</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[10.5px]">/</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-[12px]">
                <span className="text-foreground">Go to Inbox</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-border font-mono text-[10.5px]">G then I</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: ACCESSIBILITY & AUDIO                                          */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Accessibility & Feedback
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Interface scaling, focus indicators, motion preferences, and sound effects.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Sound Effects */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <h4 className="text-[13.5px] font-medium text-foreground">
                  Sound Effects & Auditory Feedback
                </h4>
                <button
                  type="button"
                  onClick={() => playUiSound("success")}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-hover border border-border text-text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Test Sound
                </button>
              </div>
              <p className="text-[12px] text-text-muted">
                Subtle clicks and confirmation chimes when toggling options, completing issues, or saving.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEffects}
              onClick={() => {
                const next = !soundEffects;
                setSoundEffects(next);
                handleUpdateSetting("soundEffects", next, "kriri-sound-effects", "sound_effects");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                soundEffects
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  soundEffects ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Reduce Motion */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Reduce Motion
              </h4>
              <p className="text-[12px] text-text-muted">
                Minimizes animations, spring physics, and view transitions across the entire application.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              onClick={() => {
                const next = !reduceMotion;
                setReduceMotion(next);
                // Invert for animations storage key
                handleUpdateSetting("fluidAnimations", !next, "kriri-animations", "reduce_motion");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                reduceMotion
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  reduceMotion ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Enhanced Focus Indicators */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Enhanced Focus Indicators
              </h4>
              <p className="text-[12px] text-text-muted">
                Render high-contrast focus rings around active inputs and buttons for keyboard accessibility.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enhancedFocus}
              onClick={() => {
                const next = !enhancedFocus;
                setEnhancedFocus(next);
                handleUpdateSetting("enhancedFocus", next, "kriri-enhanced-focus", "enhanced_focus");
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                enhancedFocus
                  ? "bg-[var(--accent,#5e6ad2)]"
                  : "bg-black/10 dark:bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  enhancedFocus ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Interface Scale */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Interface Scale
              </h4>
              <p className="text-[12px] text-text-muted">
                Adjust overall typography and UI component sizing.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              {["90%", "100%", "110%"].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => {
                    setInterfaceScale(scale);
                    handleUpdateSetting("interfaceScale", scale, "kriri-interface-scale", "interface_scale");
                  }}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                    interfaceScale === scale
                      ? "bg-surface text-foreground shadow-xs"
                      : "text-text-muted hover:text-foreground"
                  }`}
                >
                  {scale === "90%" ? "Compact (90%)" : scale === "100%" ? "Default (100%)" : "Large (110%)"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
