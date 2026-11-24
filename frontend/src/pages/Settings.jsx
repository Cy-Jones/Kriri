import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOrganization, useUser, useClerk, useReverification, UserProfile, OrganizationProfile } from "@clerk/react";
import { isReverificationCancelledError } from "@clerk/react/errors";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  User,
  Mail,
  Building,
  Check,
  LogOut,
  ExternalLink,
  Users,
  Copy,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal,
  Bell,
  Shield,
  Search,
  ArrowLeft,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Laptop,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Pipette,
  Menu,
  X,
  Key,
  History,
  Activity,
  Brain,
  Bot,
  Zap,
  RotateCcw,
  FileText,
  Wand2,
  Waves,
  Palette,
  ChevronsUpDown,
  Link2,
  Pencil,
  Camera,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { applyPreferencesToDom, getColorNameFromHex } from "../lib/userPreferences";
import { SleekSlider } from "../components/ui/SleekSlider";
import { SettingsSkeleton } from "../components/skeletons/PageSkeletons";
import ConfirmModal from "../components/ConfirmModal";
import AISettingsView from "../components/ai/AISettingsView";
const AIAssistantModal = lazy(() => import("../components/ai/AIAssistantModal"));
const ChatHistoryPopover = lazy(() => import("../components/ai/ChatHistoryPopover"));
import { KririAgentIcon } from "../components/ai/KririAgentIcon";
import { useTheme, applyCustomThemeToRoot, syncDomTheme } from "../contexts/ThemeContext";
import { copyTextToClipboard } from "@/lib/use-copy-feedback";
import { api, setActiveWorkspaceId, clearUserSessionData } from "@/lib/api";
import { clearActiveThemeStorage } from "../lib/userTheme";
import { sileo } from "sileo";
import { playUiSound } from "@/lib/sound";
import { Button } from "@/registry/components/button/button";
import WorkspaceGeneralSettings from "../components/settings/WorkspaceGeneralSettings";
import {
  ClerkCard,
  ClerkSection,
  ClerkRow,
  ClerkSelect,
  ClerkSwitch,
} from "../components/settings/ClerkFormControls";

const ACCENT_COLORS = [
  { id: "indigo", name: "Linear Indigo", hex: "#5e6ad2" },
  { id: "blue", name: "Electric Blue", hex: "#3b82f6" },
  { id: "emerald", name: "Emerald Mint", hex: "#10b981" },
  { id: "violet", name: "Royal Violet", hex: "#8b5cf6" },
  { id: "amber", name: "Sunset Amber", hex: "#f59e0b" },
  { id: "rose", name: "Crimson Rose", hex: "#f43f5e" },
  { id: "zinc", name: "Monochrome Zinc", hex: "#71717a" },
];

const QUICK_PALETTE = [
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#84cc16", // Lime
  "#eab308", // Yellow
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#d946ef", // Fuchsia
  "#a855f7", // Purple
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

const formatKririSlug = (raw) => {
  let text = (raw || "workspace")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (!text) text = "workspace";
  if (text.startsWith("kriri-")) text = text.slice(6);
  const match = text.match(/^(.*?)-(\d+)$/);
  if (match) {
    const base = match[1] || "workspace";
    const num = String(parseInt(match[2], 10) || 1).padStart(2, "0");
    return `kriri-${base}-${num}`;
  }
  return `kriri-${text}-01`;
};

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    const lastWorkspacePath = sessionStorage.getItem("kriri-last-workspace-path");
    if (lastWorkspacePath && !lastWorkspacePath.startsWith("/settings")) {
      navigate(lastWorkspacePath);
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  const initialTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam === "ai") return "agent";
      const lower = tabParam.toLowerCase();
      if (lower === "connected-accounts" || lower === "connected" || lower === "accounts" || lower === "security") return "profile";
      if (lower === "general" || lower === "members") return "organization";
      return tabParam;
    }
    const path = location.pathname.toLowerCase();
    if (path.includes("preferences")) return "preferences";
    if (path.includes("profile") || path.includes("connected-accounts") || path.includes("connected") || path.includes("security")) return "profile";
    if (path.includes("notifications")) return "notifications";
    if (path.includes("organization") || path.includes("general") || path.includes("members")) return "organization";
    if (path.includes("agent")) return "agent";
    if (path.includes("usage")) return "usage";
    if (path.includes("ai")) return "agent";
    if (path.includes("danger")) return "danger";
    return "preferences";
  }, [searchParams, location.pathname]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  useEffect(() => {
    const handleOpenAI = () => setIsAIAssistantOpen(true);
    const handleKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAIAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener("open-ai-assistant", handleOpenAI);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("open-ai-assistant", handleOpenAI);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { openUserProfile, openCreateOrganization, signOut, setActive } = useClerk();

  // Clerk Sensitive Action Reverification Handlers
  const createExternalAccountWithReverification = useReverification((params) =>
    user?.createExternalAccount(params)
  );
  const createEmailAddressWithReverification = useReverification((params) =>
    user?.createEmailAddress(params)
  );
  const destroyExternalAccountWithReverification = useReverification((account) =>
    account?.destroy()
  );
  const destroyEmailAddressWithReverification = useReverification((emailObj) =>
    emailObj?.destroy()
  );

  const primaryEmail = useMemo(() => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      localStorage.getItem("kriri-user-email") ||
      ""
    );
  }, [user]);
  const {
    theme,
    onThemeChange,
    effectiveTheme,
    darkFlavor,
    setDarkFlavor,
    lightFlavor,
    setLightFlavor,
    saveCustomTheme,
  } = useTheme();

  // Workspace form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  const [orgError, setOrgError] = useState(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState(() => {
    const saved = localStorage.getItem("kriri-user-title");
    if (!saved || saved === "Software engineer") return "";
    return saved;
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("kriri-user-username") || "";
  });
  const [usernameStatus, setUsernameStatus] = useState({
    status: "idle", // 'idle' | 'checking' | 'available' | 'taken' | 'error'
    message: "",
    suggestions: [],
  });
  const checkUsernameTimeoutRef = useRef(null);
  const initialUsernameRef = useRef("");

  // Connected accounts modal states
  const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailVerificationStep, setEmailVerificationStep] = useState("input"); // 'input' | 'verify'
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessingEmail, setIsProcessingEmail] = useState(false);
  const [pendingEmailObj, setPendingEmailObj] = useState(null);

  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLeaveWorkspaceModalOpen, setIsLeaveWorkspaceModalOpen] = useState(false);
  const [isLeavingWorkspace, setIsLeavingWorkspace] = useState(false);
  const avatarInputRef = useRef(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // User Preferences State (persisted in localStorage)
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem("kriri-accent-color") || "indigo";
  });
  const [customAccentHex, setCustomAccentHex] = useState(() => {
    return localStorage.getItem("kriri-custom-accent-hex") || "#5e6ad2";
  });
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tempCustomHex, setTempCustomHex] = useState(() => {
    return localStorage.getItem("kriri-custom-accent-hex") || "#5e6ad2";
  });
  const accentMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accentMenuRef.current && !accentMenuRef.current.contains(e.target)) {
        setIsAccentMenuOpen(false);
        setIsColorPickerOpen(false);
      }
    };
    if (isAccentMenuOpen || isColorPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccentMenuOpen, isColorPickerOpen]);
  const [density, setDensity] = useState(() => {
    return localStorage.getItem("kriri-density") || "comfortable";
  });
  const [nameFormat, setNameFormat] = useState(() => {
    return localStorage.getItem("kriri-name-format") || "full";
  });
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(() => {
    return localStorage.getItem("kriri-first-day") || "monday";
  });
  const [timeFormat, setTimeFormat] = useState(() => {
    return localStorage.getItem("kriri-time-format") || "12h";
  });
  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem("kriri-date-format") || "relative";
  });
  const [calendarDateOrder, setCalendarDateOrder] = useState(() => {
    return localStorage.getItem("kriri-calendar-date-order") || "dd/mm/yyyy";
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    return localStorage.getItem("kriri-sound-effects") !== "false";
  });
  const [fluidAnimations, setFluidAnimations] = useState(() => {
    return localStorage.getItem("kriri-animations") !== "false";
  });
  const [defaultView, setDefaultView] = useState(() => {
    return localStorage.getItem("kriri-default-view") || "dashboard";
  });
  const [shortcutScheme, setShortcutScheme] = useState(() => {
    return localStorage.getItem("kriri-shortcut-scheme") || "linear";
  });

  // Custom theme controls (Linear style)
  const [customThemeAccent, setCustomThemeAccent] = useState(() => {
    return localStorage.getItem("kriri-custom-theme-accent") || "#575AC6";
  });
  const [customThemeBg, setCustomThemeBg] = useState(() => {
    return localStorage.getItem("kriri-custom-theme-bg") || "#191A22";
  });
  const [customThemeContrast, setCustomThemeContrast] = useState(() => {
    return Number(localStorage.getItem("kriri-custom-theme-contrast") || "30");
  });
  const [customSidebarEnabled, setCustomSidebarEnabled] = useState(() => {
    return localStorage.getItem("kriri-custom-sidebar-enabled") === "true";
  });
  const [customSidebarAccent, setCustomSidebarAccent] = useState(() => {
    return localStorage.getItem("kriri-custom-sidebar-accent") || "#575AC6";
  });
  const [customSidebarBg, setCustomSidebarBg] = useState(() => {
    return localStorage.getItem("kriri-custom-sidebar-bg") || "#191A22";
  });
  const [customSidebarContrast, setCustomSidebarContrast] = useState(() => {
    return Number(localStorage.getItem("kriri-custom-sidebar-contrast") || "30");
  });

  const handleUpdateCustomTheme = (updates) => {
    const nextAccent = updates.accent !== undefined ? updates.accent : customThemeAccent;
    const nextBg = updates.bg !== undefined ? updates.bg : customThemeBg;
    const nextContrast = updates.contrast !== undefined ? updates.contrast : customThemeContrast;
    const nextSidebarEnabled =
      updates.sidebarEnabled !== undefined ? updates.sidebarEnabled : customSidebarEnabled;
    const nextSidebarAccent =
      updates.sidebarAccent !== undefined ? updates.sidebarAccent : customSidebarAccent;
    const nextSidebarBg = updates.sidebarBg !== undefined ? updates.sidebarBg : customSidebarBg;
    const nextSidebarContrast =
      updates.sidebarContrast !== undefined ? updates.sidebarContrast : customSidebarContrast;

    if (updates.accent !== undefined) {
      setCustomThemeAccent(nextAccent);
      localStorage.setItem("kriri-custom-theme-accent", nextAccent);
    }
    if (updates.bg !== undefined) {
      setCustomThemeBg(nextBg);
      localStorage.setItem("kriri-custom-theme-bg", nextBg);
    }
    if (updates.contrast !== undefined) {
      setCustomThemeContrast(nextContrast);
      localStorage.setItem("kriri-custom-theme-contrast", String(nextContrast));
    }
    if (updates.sidebarEnabled !== undefined) {
      setCustomSidebarEnabled(nextSidebarEnabled);
      localStorage.setItem("kriri-custom-sidebar-enabled", String(nextSidebarEnabled));
    }
    if (updates.sidebarAccent !== undefined) {
      setCustomSidebarAccent(nextSidebarAccent);
      localStorage.setItem("kriri-custom-sidebar-accent", nextSidebarAccent);
    }
    if (updates.sidebarBg !== undefined) {
      setCustomSidebarBg(nextSidebarBg);
      localStorage.setItem("kriri-custom-sidebar-bg", nextSidebarBg);
    }
    if (updates.sidebarContrast !== undefined) {
      setCustomSidebarContrast(nextSidebarContrast);
      localStorage.setItem("kriri-custom-sidebar-contrast", String(nextSidebarContrast));
    }

    if (typeof saveCustomTheme === "function") {
      saveCustomTheme({
        customAccent: nextAccent,
        customBg: nextBg,
        customContrast: nextContrast,
        sidebarEnabled: nextSidebarEnabled,
        sidebarAccent: nextSidebarAccent,
        sidebarBg: nextSidebarBg,
        sidebarContrast: nextSidebarContrast,
      });
    }

    if (theme === "custom") {
      applyCustomThemeToRoot(document.documentElement, {
        accent: nextAccent,
        bg: nextBg,
        contrast: nextContrast,
        sidebarEnabled: nextSidebarEnabled,
        sidebarAccent: nextSidebarAccent,
        sidebarBg: nextSidebarBg,
        sidebarContrast: nextSidebarContrast,
      });
    }
  };

  // Agent Personalization State
  const [agentTone, setAgentTone] = useState(() => {
    return localStorage.getItem("kriri-agent-tone") || "concise";
  });
  const [agentInstructions, setAgentInstructions] = useState(() => {
    return (
      localStorage.getItem("kriri-agent-instructions") ||
      "Focus on clean code, idiomatic React and Tailwind CSS patterns, and concise explanations."
    );
  });
  const [agentReasoningDepth, setAgentReasoningDepth] = useState(() => {
    return localStorage.getItem("kriri-agent-reasoning-depth") || "balanced";
  });
  const [agentAutoSubtasks, setAgentAutoSubtasks] = useState(() => {
    return localStorage.getItem("kriri-agent-auto-subtasks") !== "false";
  });
  const [agentArchBlueprints, setAgentArchBlueprints] = useState(() => {
    return localStorage.getItem("kriri-agent-arch-blueprints") !== "false";
  });
  const [agentClarifyingDecisions, setAgentClarifyingDecisions] = useState(() => {
    return localStorage.getItem("kriri-agent-clarifying-decisions") !== "false";
  });
  const [agentProactiveRisk, setAgentProactiveRisk] = useState(() => {
    return localStorage.getItem("kriri-agent-proactive-risk") !== "false";
  });
  const [agentMemory, setAgentMemory] = useState(() => {
    return localStorage.getItem("kriri-agent-memory") !== "false";
  });
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [agentSavedSuccess, setAgentSavedSuccess] = useState(false);

  const handleSaveAgent = () => {
    setIsSavingAgent(true);
    localStorage.setItem("kriri-agent-tone", agentTone);
    localStorage.setItem("kriri-agent-instructions", agentInstructions);
    localStorage.setItem("kriri-agent-reasoning-depth", agentReasoningDepth);
    localStorage.setItem("kriri-agent-auto-subtasks", String(agentAutoSubtasks));
    localStorage.setItem("kriri-agent-arch-blueprints", String(agentArchBlueprints));
    localStorage.setItem("kriri-agent-clarifying-decisions", String(agentClarifyingDecisions));
    localStorage.setItem("kriri-agent-proactive-risk", String(agentProactiveRisk));
    localStorage.setItem("kriri-agent-memory", String(agentMemory));

    setTimeout(() => {
      setIsSavingAgent(false);
      setAgentSavedSuccess(true);
      playUiSound("success");
      sileo.success({
        title: "Agent personalization saved",
        description: "Your workspace AI instructions and persona are now active.",
      });
      setTimeout(() => setAgentSavedSuccess(false), 3000);
    }, 250);
  };

  const handleResetAgent = () => {
    setAgentTone("concise");
    setAgentInstructions(
      "Focus on clean code, idiomatic React and Tailwind CSS patterns, and concise explanations."
    );
    setAgentReasoningDepth("balanced");
    setAgentAutoSubtasks(true);
    setAgentArchBlueprints(true);
    setAgentClarifyingDecisions(true);
    setAgentProactiveRisk(true);
    setAgentMemory(true);
    playUiSound("toggle");
    sileo.info({
      title: "Agent settings reset",
      description: "Default workspace instructions restored.",
    });
  };

  // Notification preferences (persisted in localStorage)
  const [desktopAlerts, setDesktopAlerts] = useState(() => {
    return localStorage.getItem("kriri-notif-desktop") !== "false";
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem("kriri-notif-email") !== "false";
  });
  const [emailOnlyInactive, setEmailOnlyInactive] = useState(() => {
    return localStorage.getItem("kriri-notif-email-inactive") !== "false";
  });
  const [notifyAssignments, setNotifyAssignments] = useState(() => {
    return localStorage.getItem("kriri-notif-assignments") !== "false";
  });
  const [notifyMentions, setNotifyMentions] = useState(() => {
    return localStorage.getItem("kriri-notif-mentions") !== "false";
  });
  const [notifyStatusChanges, setNotifyStatusChanges] = useState(() => {
    return localStorage.getItem("kriri-notif-status") !== "false";
  });
  const [notifyMilestones, setNotifyMilestones] = useState(() => {
    return localStorage.getItem("kriri-notif-milestones") === "true";
  });
  const [copiedId, setCopiedId] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  // Sync tab with URL
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
    setIsMobileSidebarOpen(false);
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      const lower = tabFromUrl.toLowerCase();
      if (lower === "connected-accounts" || lower === "connected" || lower === "accounts" || lower === "security") {
        setActiveTab("profile");
        setSearchParams({ tab: "profile" }, { replace: true });
        return;
      }
      if (lower === "general" || lower === "members") {
        setActiveTab("organization");
        setSearchParams({ tab: "organization" }, { replace: true });
        return;
      }
      if (tabFromUrl === "ai") {
        setActiveTab("agent");
        setSearchParams({ tab: "agent" }, { replace: true });
        return;
      }
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, activeTab, setSearchParams]);

  useEffect(() => {
    let active = true;
    api
      .get("/workspaces/current")
      .then((data) => {
        if (active && data) {
          setCurrentWorkspace(data);
          if (data.id) {
            setActiveWorkspaceId(data.id);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load current workspace:", err.message);
      });
    return () => {
      active = false;
    };
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.name) {
      setWorkspaceName(organization.name);
    } else if (isOrgLoaded && !organization) {
      setWorkspaceName("Personal Workspace");
    }
  }, [organization, isOrgLoaded]);

  useEffect(() => {
    if (user) {
      const fName = user.firstName || "";
      const lName = user.lastName || "";
      setFirstName(fName);
      setLastName(lName);
      const computedFull = user.fullName || `${fName} ${lName}`.trim() || localStorage.getItem("kriri-user-fullname") || "Cyrus Jones";
      setFullName(computedFull);
      const userMail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || localStorage.getItem("kriri-user-email") || "";
      setEmail(userMail);
      if (user.username) {
        setUsername(user.username);
        initialUsernameRef.current = user.username;
      } else {
        api.get("/auth/me").then((me) => {
          if (me?.username) {
            setUsername(me.username);
            initialUsernameRef.current = me.username;
            localStorage.setItem("kriri-user-username", me.username);
          } else {
            const fallbackUsername = user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "cyruskjones";
            const saved = localStorage.getItem("kriri-user-username") || fallbackUsername;
            setUsername(saved);
            initialUsernameRef.current = saved;
          }
        }).catch(() => {
          const fallbackUsername = user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "cyruskjones";
          const saved = localStorage.getItem("kriri-user-username") || fallbackUsername;
          setUsername(saved);
          initialUsernameRef.current = saved;
        });
      }
      if (user.unsafeMetadata?.title) {
        setJobTitle(user.unsafeMetadata.title);
      }
    }
  }, [user]);

  // Preference change helpers
  const handleAccentChange = (id) => {
    const preset = ACCENT_COLORS.find((c) => c.id === id);
    const colorName = preset?.name || id;
    setAccentColor(id);
    localStorage.setItem("kriri-accent-color", id);
    applyPreferencesToDom();
    setIsAccentMenuOpen(false);
    playUiSound("toggle");
    sileo.success({
      title: "Accent color updated",
      description: `${colorName} had been set as accent color.`,
    });
  };

  const handleCustomAccentChange = (hex) => {
    if (!hex) return;
    const colorName = getColorNameFromHex(hex);
    setAccentColor("custom");
    setCustomAccentHex(hex);
    localStorage.setItem("kriri-accent-color", "custom");
    localStorage.setItem("kriri-custom-accent-hex", hex);
    applyPreferencesToDom();
    playUiSound("toggle");
    sileo.success({
      title: "Accent color updated",
      description: `${colorName} had been set as accent color.`,
    });
  };

  const currentAccentObj = useMemo(() => {
    if (accentColor === "custom") {
      const colorName = getColorNameFromHex(customAccentHex);
      return { id: "custom", name: `Custom (${colorName})`, hex: customAccentHex };
    }
    return ACCENT_COLORS.find((c) => c.id === accentColor) || ACCENT_COLORS[0];
  }, [accentColor, customAccentHex]);

  const handleDensityChange = (val) => {
    setDensity(val);
    localStorage.setItem("kriri-density", val);
    applyPreferencesToDom();
    playUiSound("toggle");
  };

  const handleSoundToggle = () => {
    const next = !soundEffects;
    setSoundEffects(next);
    localStorage.setItem("kriri-sound-effects", String(next));
    if (next) {
      playUiSound("chime");
      sileo.info({ title: "Sound effects enabled", description: "Audio cues active" });
    }
  };

  const handleDesktopAlertsToggle = async () => {
    const next = !desktopAlerts;
    setDesktopAlerts(next);
    localStorage.setItem("kriri-notif-desktop", String(next));
    playUiSound("toggle");
    if (next && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          sileo.success({ title: "Desktop notifications enabled" });
        }
      }
    }
  };

  const handleEmailToggle = () => {
    const next = !emailNotifications;
    setEmailNotifications(next);
    localStorage.setItem("kriri-notif-email", String(next));
    playUiSound("toggle");
  };

  const handleEmailOnlyInactiveToggle = () => {
    const next = !emailOnlyInactive;
    setEmailOnlyInactive(next);
    localStorage.setItem("kriri-notif-email-inactive", String(next));
    playUiSound("toggle");
  };

  const handleNotifyAssignmentsToggle = () => {
    const next = !notifyAssignments;
    setNotifyAssignments(next);
    localStorage.setItem("kriri-notif-assignments", String(next));
    playUiSound("toggle");
  };

  const handleNotifyMentionsToggle = () => {
    const next = !notifyMentions;
    setNotifyMentions(next);
    localStorage.setItem("kriri-notif-mentions", String(next));
    playUiSound("toggle");
  };

  const handleNotifyStatusChangesToggle = () => {
    const next = !notifyStatusChanges;
    setNotifyStatusChanges(next);
    localStorage.setItem("kriri-notif-status", String(next));
    playUiSound("toggle");
  };

  const handleNotifyMilestonesToggle = () => {
    const next = !notifyMilestones;
    setNotifyMilestones(next);
    localStorage.setItem("kriri-notif-milestones", String(next));
    playUiSound("toggle");
  };

  // Workspace save handler
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
      playUiSound("success");
      sileo.success({ title: "Workspace updated", description: workspaceName });
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch (err) {
      setOrgError(err.message || "Failed to update workspace name");
    } finally {
      setIsSavingOrg(false);
    }
  };

  // Deletion modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const isOrgWorkspace = Boolean(organization);
  const isOwnerOrAdmin =
    isOrgWorkspace &&
    (membership?.role === "org:admin" ||
      currentWorkspace?.role === "Owner" ||
      currentWorkspace?.role === "Admin" ||
      organization?.creatorId === user?.id);

  const handleDeleteWorkspaceClick = () => {
    if (!isOrgWorkspace) {
      sileo.info({
        title: "Personal Workspace",
        description:
          "Personal workspaces cannot be deleted as they are bound to your user account.",
      });
      return;
    }
    if (!isOwnerOrAdmin) {
      sileo.warning({
        title: "Action restricted",
        description:
          "Only the workspace owner or administrator can delete this workspace.",
      });
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);
    const workspaceTitle = workspaceName || organization?.name || "Workspace";
    try {
      await api.delete("/workspaces/current");
      if (organization?.destroy) {
        try {
          await organization.destroy();
        } catch (clerkErr) {
          console.warn("Clerk organization destroy note:", clerkErr);
        }
      }
      setActiveWorkspaceId(null);
      if (setActive) {
        try {
          await setActive({ organization: null });
        } catch (setActiveErr) {
          console.warn("Clerk setActive to personal error:", setActiveErr);
        }
      }
      setIsDeleteModalOpen(false);
      sileo.success({
        title: "Workspace deleted",
        description: `"${workspaceTitle}" has been permanently removed.`,
      });
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete workspace:", err);
      sileo.error({
        title: "Deletion failed",
        description: err.message || "Failed to delete workspace.",
      });
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api.delete("/auth/account");
      if (user?.delete) {
        try {
          await user.delete();
        } catch (clerkErr) {
          console.warn("Clerk user.delete note:", clerkErr);
        }
      }
      setActiveWorkspaceId(null);
      setIsDeleteAccountModalOpen(false);
      sileo.success({
        title: "Account deleted",
        description: "Your account and data have been removed.",
      });
      clearUserSessionData();
      clearActiveThemeStorage();
      signOut(() => navigate("/"));
    } catch (err) {
      console.error("Failed to delete account:", err);
      sileo.error({
        title: "Account deletion failed",
        description: err.message || "Failed to delete account.",
      });
    } finally {
      setIsDeletingAccount(false);
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
      playUiSound("success");
      sileo.success({ title: "Profile updated successfully" });
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);
  };

  const handleSaveFullName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) return;
    localStorage.setItem("kriri-user-fullname", trimmed);
    const parts = trimmed.split(/\s+/);
    const newFirst = parts[0] || "";
    const newLast = parts.slice(1).join(" ") || "";
    setFirstName(newFirst);
    setLastName(newLast);
    playUiSound("toggle");
    if (user) {
      try {
        await user.update({ firstName: newFirst, lastName: newLast });
        sileo.success({ title: "Name saved" });
      } catch (err) {
        console.error("Failed to update name:", err);
      }
    }
  };

  const handleJobTitleChange = (e) => {
    setJobTitle(e.target.value);
  };

  const handleSaveJobTitle = async () => {
    localStorage.setItem("kriri-user-title", jobTitle);
    playUiSound("toggle");
    sileo.success({ title: "Title saved" });
    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...(user.unsafeMetadata || {}),
            title: jobTitle,
          },
        });
      } catch (err) {
        console.error("Failed to update title:", err);
      }
    }
  };

  const handleUsernameChange = (e) => {
    const raw = e.target.value;
    setUsername(raw);
    const clean = raw.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");

    if (checkUsernameTimeoutRef.current) {
      clearTimeout(checkUsernameTimeoutRef.current);
    }

    if (!clean) {
      setUsernameStatus({ status: "idle", message: "", suggestions: [] });
      return;
    }

    if (clean === initialUsernameRef.current) {
      setUsernameStatus({
        status: "available",
        message: "This is your current username.",
        suggestions: [],
      });
      return;
    }

    if (clean.length < 5) {
      setUsernameStatus({
        status: "error",
        message: "Username must be at least 5 characters",
        suggestions: [],
      });
      return;
    }

    if (clean.length > 64) {
      setUsernameStatus({
        status: "error",
        message: "Username cannot exceed 64 characters",
        suggestions: [],
      });
      return;
    }

    if (/^\d+$/.test(clean)) {
      setUsernameStatus({
        status: "error",
        message: "Username cannot consist only of numbers",
        suggestions: [],
      });
      return;
    }

    setUsernameStatus((prev) => ({ ...prev, status: "checking" }));

    checkUsernameTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(clean)}`);
        if (res.available) {
          setUsernameStatus({
            status: "available",
            message: res.message || `@${clean} is available!`,
            suggestions: [],
          });
        } else {
          setUsernameStatus({
            status: "taken",
            message: res.message || `@${clean} is already taken.`,
            suggestions: res.suggestions || [],
          });
        }
      } catch (err) {
        setUsernameStatus({
          status: "taken",
          message: err.message || `@${clean} is unavailable.`,
          suggestions: err.suggestions || [
            `${clean}${Math.floor(10 + Math.random() * 90)}`,
            `${clean}_01`,
            `${clean}7`,
          ],
        });
      }
    }, 350);
  };

  const handleApplySuggestion = (sug) => {
    setUsername(sug);
    setUsernameStatus({
      status: "available",
      message: `@${sug} is available!`,
      suggestions: [],
    });
    handleSaveUsernameDirect(sug);
  };

  const handleSaveUsernameDirect = async (nameToSave) => {
    const cleanUsername = (nameToSave || username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 64);
    if (!cleanUsername || cleanUsername.length < 5 || /^\d+$/.test(cleanUsername)) return;

    try {
      const res = await api.patch("/auth/username", { username: cleanUsername });
      localStorage.setItem("kriri-user-username", cleanUsername);
      initialUsernameRef.current = cleanUsername;
      setUsername(cleanUsername);
      setUsernameStatus({
        status: "available",
        message: "Username saved successfully!",
        suggestions: [],
      });
      playUiSound("toggle");
      sileo.success({ title: "Username saved" });
      if (user) {
        try {
          await user.update({ username: cleanUsername });
        } catch (err) {
          console.warn("Clerk username update:", err.message);
        }
      }
    } catch (err) {
      const suggestions = err.suggestions || [];
      setUsernameStatus({
        status: "taken",
        message: err.message || `@${cleanUsername} is already taken.`,
        suggestions,
      });
      sileo.error({
        title: "Username already taken",
        description: err.message || "Please select an alternative username.",
      });
    }
  };

  const handleSaveUsername = () => {
    handleSaveUsernameDirect(username);
  };

  // Connected Accounts & Email Management Handlers
  const handleAddEmail = async (e) => {
    e?.preventDefault();
    const trimmed = newEmailInput.trim();
    if (!trimmed || !user) return;
    setIsProcessingEmail(true);
    try {
      const res = await createEmailAddressWithReverification({ email: trimmed });
      if (res && typeof res.prepareVerification === "function") {
        await res.prepareVerification({ strategy: "email_code" });
      }
      setPendingEmailObj(res);
      setEmailVerificationStep("verify");
      sileo.success({
        title: "Verification code sent",
        description: `Check your inbox at ${trimmed}`,
      });
    } catch (err) {
      if (isReverificationCancelledError(err) || err?.code === "reverification_cancelled") {
        return;
      }
      console.error("Create email error:", err);
      const isReverify =
        err.errors?.[0]?.code === "reverification_required" ||
        err.errors?.[0]?.code === "session_reverification_required" ||
        err.errors?.[0]?.message?.toLowerCase().includes("reverification") ||
        err.message?.toLowerCase().includes("reverification");
      if (isReverify && typeof openUserProfile === "function") {
        setIsAddEmailModalOpen(false);
        sileo.info({
          title: "Reverification required",
          description: "Please confirm your identity in the account manager.",
        });
        openUserProfile();
        return;
      }
      sileo.error({
        title: "Failed to add email",
        description: err.errors?.[0]?.message || err.message,
      });
    } finally {
      setIsProcessingEmail(false);
    }
  };

  const handleVerifyEmailCode = async (e) => {
    e?.preventDefault();
    if (!verificationCode.trim() || !pendingEmailObj) return;
    setIsProcessingEmail(true);
    try {
      await pendingEmailObj.attemptVerification({ code: verificationCode.trim() });
      await user.reload();
      sileo.success({ title: "Email verified & added successfully" });
      setIsAddEmailModalOpen(false);
      setNewEmailInput("");
      setVerificationCode("");
      setEmailVerificationStep("input");
      setPendingEmailObj(null);
    } catch (err) {
      console.error("Verification code error:", err);
      sileo.error({
        title: "Verification failed",
        description: err.errors?.[0]?.message || err.message,
      });
    } finally {
      setIsProcessingEmail(false);
    }
  };

  const handleSetPrimaryEmail = async (emailObj) => {
    if (!user || !emailObj) return;
    try {
      await user.update({ primaryEmailAddressId: emailObj.id });
      await user.reload();
      sileo.success({ title: "Primary email updated" });
    } catch (err) {
      sileo.error({
        title: "Failed to set primary email",
        description: err.errors?.[0]?.message || err.message,
      });
    }
  };

  const handleRemoveEmail = async (emailObj) => {
    if (!user || !emailObj) return;
    try {
      await destroyEmailAddressWithReverification(emailObj);
      await user.reload();
      sileo.success({ title: "Email removed" });
    } catch (err) {
      if (isReverificationCancelledError(err) || err?.code === "reverification_cancelled") {
        return;
      }
      console.error("Remove email error:", err);
      const isReverify =
        err.errors?.[0]?.code === "reverification_required" ||
        err.errors?.[0]?.code === "session_reverification_required" ||
        err.errors?.[0]?.message?.toLowerCase().includes("reverification") ||
        err.message?.toLowerCase().includes("reverification");
      if (isReverify && typeof openUserProfile === "function") {
        sileo.info({
          title: "Reverification required",
          description: "Please confirm your identity in the account manager.",
        });
        openUserProfile();
        return;
      }
      sileo.error({
        title: "Failed to remove email",
        description: err.errors?.[0]?.message || err.message,
      });
    }
  };

  const handleConnectOAuth = async (strategy) => {
    if (!user) return;
    try {
      const res = await createExternalAccountWithReverification({
        strategy,
        redirectUrl: window.location.href,
        redirect_url: window.location.href,
      });
      const url =
        res?.verification?.externalVerificationRedirectURL?.href ||
        res?.verification?.externalVerificationRedirectURL ||
        res?.externalVerificationRedirectURL?.href ||
        res?.externalVerificationRedirectURL;
      if (url) {
        window.location.href = typeof url === "string" ? url : url.toString();
      }
    } catch (err) {
      if (isReverificationCancelledError(err) || err?.code === "reverification_cancelled") {
        return;
      }
      console.error("Connect OAuth error:", err);
      const isReverify =
        err.errors?.[0]?.code === "reverification_required" ||
        err.errors?.[0]?.code === "session_reverification_required" ||
        err.errors?.[0]?.message?.toLowerCase().includes("reverification") ||
        err.message?.toLowerCase().includes("reverification");
      if (isReverify && typeof openUserProfile === "function") {
        sileo.info({
          title: "Reverification required",
          description: "Please confirm your identity in the account manager.",
        });
        openUserProfile();
        return;
      }
      sileo.error({
        title: "Connection failed",
        description: err.errors?.[0]?.message || err.message || "Failed to initiate provider connection.",
      });
    }
  };

  const handleConfirmDisconnectAccount = async () => {
    if (!accountToDisconnect) return;
    setIsDisconnecting(true);
    try {
      await destroyExternalAccountWithReverification(accountToDisconnect);
      await user.reload();
      sileo.success({ title: "Account disconnected" });
      setIsDisconnectModalOpen(false);
      setAccountToDisconnect(null);
    } catch (err) {
      if (isReverificationCancelledError(err) || err?.code === "reverification_cancelled") {
        return;
      }
      console.error("Disconnect account error:", err);
      const isReverify =
        err.errors?.[0]?.code === "reverification_required" ||
        err.errors?.[0]?.code === "session_reverification_required" ||
        err.errors?.[0]?.message?.toLowerCase().includes("reverification") ||
        err.message?.toLowerCase().includes("reverification");
      if (isReverify && typeof openUserProfile === "function") {
        setIsDisconnectModalOpen(false);
        sileo.info({
          title: "Reverification required",
          description: "Please confirm your identity in the account manager.",
        });
        openUserProfile();
        return;
      }
      sileo.error({
        title: "Cannot disconnect",
        description: err.errors?.[0]?.message || err.message || "You must have at least one authentication method.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSaveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    localStorage.setItem("kriri-user-email", trimmed);
    playUiSound("toggle");
    sileo.success({ title: "Email saved" });
    if (user && typeof user.createEmailAddress === "function") {
      try {
        await user.createEmailAddress({ email: trimmed });
      } catch (err) {
        console.warn("Clerk email update note:", err.message);
      }
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      if (typeof user.setProfileImage === "function") {
        await user.setProfileImage({ file });
        playUiSound("success");
        sileo.success({ title: "Profile picture updated" });
      }
    } catch (err) {
      console.error("Failed to update profile picture:", err);
      sileo.error({ title: "Upload failed", description: err.message });
    }
  };

  const isPersonalWorkspace = useMemo(() => {
    if (!organization) return true;
    const name = (organization.name || "").toLowerCase();
    const slug = (organization.slug || "").toLowerCase();
    return name.includes("personal") || slug.includes("personal") || !membership;
  }, [organization, membership]);

  const userRole = useMemo(() => {
    if (isPersonalWorkspace) return "personal_owner";
    const rawRole = (currentWorkspace?.role || membership?.role || "").toLowerCase();
    const isOwner =
      rawRole.includes("owner") ||
      rawRole === "org:admin" ||
      (currentWorkspace?.owner_id &&
        (String(currentWorkspace?.owner_id) === String(user?.id) ||
          String(currentWorkspace?.owner_id) === String(user?.publicMetadata?.userId)));
    if (isOwner) return "owner";
    if (rawRole.includes("admin")) return "admin";
    if (rawRole.includes("manager") || rawRole.includes("lead")) return "manager";
    return "member";
  }, [
    isPersonalWorkspace,
    membership?.role,
    currentWorkspace?.role,
    currentWorkspace?.owner_id,
    user?.id,
    user?.publicMetadata?.userId,
  ]);

  const isAdminOrOwner = userRole === "personal_owner" || userRole === "owner" || userRole === "admin";

  // Role Gate: Redirect unauthorized members away from Usage & Limits
  useEffect(() => {
    if (activeTab === "usage" && !isAdminOrOwner) {
      setActiveTab("preferences");
      setSearchParams({ tab: "preferences" });
    }
  }, [activeTab, isAdminOrOwner, setSearchParams]);

  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState("");

  useEffect(() => {
    if (isLeaveWorkspaceModalOpen && (currentWorkspace?.id || organization?.id)) {
      const targetId = currentWorkspace?.id || organization?.id;
      api
        .get(`/workspaces/${targetId}/members`)
        .then((members) => {
          if (Array.isArray(members)) {
            setWorkspaceMembers(members);
          }
        })
        .catch((err) => {
          console.warn("Could not load workspace members for transfer:", err.message);
        });
    }
  }, [isLeaveWorkspaceModalOpen, currentWorkspace?.id, organization?.id]);

  const eligibleNewOwners = useMemo(() => {
    return workspaceMembers.filter((m) => {
      const isCurrent =
        String(m.id) === String(currentWorkspace?.owner_id) ||
        m.email?.toLowerCase() === primaryEmail?.toLowerCase() ||
        (user?.id && m.clerk_user_id === user.id);
      return !isCurrent;
    });
  }, [workspaceMembers, currentWorkspace?.owner_id, primaryEmail, user?.id]);

  const handleTransferAndLeaveWorkspace = async () => {
    if (!selectedNewOwnerId) return;
    setIsLeavingWorkspace(true);
    try {
      await api.post("/workspaces/current/transfer-ownership", {
        newOwnerId: selectedNewOwnerId,
        leaveWorkspace: true,
      });

      if (membership) {
        try {
          await membership.destroy();
        } catch (e) {
          console.warn("Clerk membership destroy note:", e.message);
        }
      }

      playUiSound("delete");
      sileo.success({
        title: "Ownership transferred",
        description: `Ownership transferred and you have left ${organization?.name || workspaceName || "the workspace"}.`,
      });
      setIsLeaveWorkspaceModalOpen(false);
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("Failed to transfer ownership and leave:", err);
      sileo.error({
        title: "Transfer failed",
        description: err.message || "Could not transfer workspace ownership",
      });
    } finally {
      setIsLeavingWorkspace(false);
    }
  };

  const leaveModalContent = useMemo(() => {
    const wsName = organization?.name || workspaceName || "Workspace";
    if (isPersonalWorkspace) {
      return {
        title: "Cannot Leave Personal Workspace",
        message: "You cannot leave your personal workspace because you are the sole owner. Personal workspaces are permanently bound to your account. If you wish to delete your account entirely, navigate to the Danger Zone.",
        confirmText: "Understood",
        cancelText: null,
        isBlocked: true,
      };
    }
    if (userRole === "owner") {
      return {
        title: `Transfer Ownership of "${wsName}"`,
        message: `Notice: You are the Owner & Administrator of "${wsName}". You cannot leave this workspace without transferring ownership. Please select a team member to take over ownership before leaving.`,
        confirmText: isLeavingWorkspace ? "Transferring & Leaving..." : "Transfer Ownership & Leave Workspace",
        cancelText: "Cancel",
        isBlocked: false,
      };
    }
    if (userRole === "admin") {
      return {
        title: `Leave "${wsName}" as Administrator?`,
        message: `Notice: You are an Administrator of "${wsName}". Leaving will immediately revoke your management privileges over team members, workspace settings, integrations, and private boards.`,
        confirmText: isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace",
        cancelText: "Cancel",
        isBlocked: false,
      };
    }
    if (userRole === "manager") {
      return {
        title: `Leave "${wsName}" as Manager?`,
        message: `Notice: You are a Manager in "${wsName}". Leaving will remove your lead assignment on active milestones and sprint tasks you oversee. Teammates will need to reassign your managed projects.`,
        confirmText: isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace",
        cancelText: "Cancel",
        isBlocked: false,
      };
    }
    return {
      title: `Leave "${wsName}"?`,
      message: `Are you sure you want to remove yourself from "${wsName}"? You will immediately lose access to all projects, tasks, issues, and discussions within this workspace.`,
      confirmText: isLeavingWorkspace ? "Leaving..." : "Leave Workspace",
      cancelText: "Cancel",
      isBlocked: false,
    };
  }, [isPersonalWorkspace, userRole, organization?.name, workspaceName, isLeavingWorkspace]);

  const handleConfirmLeaveWorkspace = async () => {
    if (leaveModalContent.isBlocked) {
      setIsLeaveWorkspaceModalOpen(false);
      return;
    }
    setIsLeavingWorkspace(true);
    try {
      if (membership) {
        await membership.destroy();
      }
      playUiSound("delete");
      sileo.success({
        title: "Left workspace",
        description: `You have left ${organization?.name || "the workspace"}.`,
      });
      setIsLeaveWorkspaceModalOpen(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to leave workspace:", err);
      sileo.error({
        title: "Action failed",
        description: err.message || "Could not leave workspace.",
      });
    } finally {
      setIsLeavingWorkspace(false);
    }
  };

  const handleCopyId = async (id) => {
    const success = await copyTextToClipboard(id);
    if (success) {
      setCopiedId(true);
      playUiSound("toggle");
      sileo.success({ title: "Copied to clipboard", description: id });
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Nav categories conforming to Linear settings structure
  const navGroups = useMemo(() => {
    const workspaceTitle = organization?.name || "Workspace";
    return [
      {
        id: "account",
        label: "My Account",
        items: [
          {
            id: "preferences",
            label: "Preferences",
            icon: SlidersHorizontal,
            badge: null,
            keywords: "theme appearance dark light color density sound shortcuts first day format",
          },
          {
            id: "profile",
            label: "Profile",
            icon: User,
            badge: null,
            keywords: "name email avatar picture user account credentials title username google github oauth connected accounts security authentication login",
          },
          {
            id: "notifications",
            label: "Notifications",
            icon: Bell,
            badge: null,
            keywords: "email desktop alerts sounds mentions inbox notifications",
          },
        ],
      },
      {
        id: "workspace",
        label: workspaceTitle,
        items: [
          {
            id: "organization",
            label: "Organization",
            icon: Building,
            badge: null,
            keywords: "organization workspace profile members team collaborators invite roles permissions defaults slug url",
          },
          {
            id: "agent",
            label: "Agent",
            icon: KririAgentIcon,
            badge: null,
            keywords: "agent ai persona instructions prompt customization memory personality tone rules",
          },
          ...(isAdminOrOwner
            ? [
                {
                  id: "usage",
                  label: "Usage & Limits",
                  icon: Activity,
                  badge: null,
                  keywords: "usage limits tokens latency cost openrouter metrics models api gateway quota telemetry",
                },
              ]
            : []),
          {
            id: "danger",
            label: "Danger Zone",
            icon: AlertTriangle,
            badge: null,
            keywords: "delete remove erase workspace account permanent",
          },
        ],
      },
    ];
  }, [organization?.name, isAdminOrOwner]);

  // Filtered navigation when user types in search
  const filteredNavGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const query = searchQuery.toLowerCase();
    return navGroups
      .map((group) => {
        const matchedItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.keywords.toLowerCase().includes(query)
        );
        return { ...group, items: matchedItems };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchQuery]);

  const memberCode = useMemo(() => {
    const name = fullName || user?.fullName || `${firstName} ${lastName}`.trim() || "User";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || "KR").toUpperCase();
  }, [fullName, user?.fullName, firstName, lastName]);

  const isAuditMock = typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage?.getItem("audit_mock_auth") === "true");

  if ((!isOrgLoaded || !isUserLoaded) && !isAuditMock) {
    return <SettingsSkeleton />;
  }

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
    (acc) => acc.provider === "google" || acc.verification?.strategy?.includes("google")
  );
  const githubAccount = user?.externalAccounts?.find(
    (acc) => acc.provider === "github" || acc.verification?.strategy?.includes("github")
  );

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50 flex flex-col md:flex-row bg-[var(--sidebar,#fbfbfb)] dark:bg-[var(--sidebar,#000000)] text-text-primary select-none overflow-hidden transition-colors"
      style={{ backgroundColor: "var(--sidebar)" }}
    >
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-black shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 -ml-1 text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Menu size={18} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Settings
            </h1>
            <p className="text-[11px] text-text-muted">
              {navGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ||
                "Preferences"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-[12px] font-medium text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white px-2.5 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Exit</span>
        </button>
      </div>

      {/* ======================= SETTINGS SIDEBAR (BLACK IN DARK MODE) ======================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--sidebar,#fbfbfb)] dark:bg-[var(--sidebar,#000000)] flex flex-col transition-all duration-200 ease-in-out md:static md:translate-x-0 shrink-0 select-none ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: "var(--sidebar)" }}
      >
        {/* Top Header / Back Link */}
        <div className="p-3.5 pb-2 flex flex-col gap-3 border-b border-[var(--sidebar-border,rgba(255,255,255,0.06))]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-[12.5px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white px-2 py-1.5 -ml-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
            >
              <ArrowLeft
                size={14}
                strokeWidth={2}
                className="transition-transform group-hover:-translate-x-0.5 text-zinc-400 group-hover:text-zinc-700 dark:text-[#8a8f98] dark:group-hover:text-white"
              />
              <span className="tracking-tight">Back to workspace</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Settings Search Input */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#8a8f98]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--sidebar-border,rgba(255,255,255,0.06))] text-[12px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#8a8f98]/70 focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]"
            />
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-5">
          {filteredNavGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <div
                className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--sidebar-muted)" }}
              >
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer group relative hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                      style={{
                        backgroundColor: isActive
                          ? "var(--sidebar-active-bg, rgba(var(--sidebar-accent-rgb, 94, 106, 210), 0.16))"
                          : undefined,
                        border: isActive
                          ? "1px solid var(--sidebar-active-border, rgba(var(--sidebar-accent-rgb, 94, 106, 210), 0.32))"
                          : "1px solid transparent",
                        color: isActive
                          ? "var(--sidebar-foreground)"
                          : "var(--sidebar-muted)",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={15}
                          strokeWidth={isActive ? 2 : 1.75}
                          className="shrink-0 transition-colors"
                          style={{
                            color: isActive
                              ? "var(--sidebar-accent, var(--kriri-accent))"
                              : "var(--sidebar-muted)",
                          }}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: "var(--sidebar-active-bg, rgba(var(--kriri-accent-rgb, 94, 106, 210), 0.15))",
                            color: "var(--sidebar-accent, var(--kriri-accent))",
                            border: "1px solid var(--sidebar-active-border, rgba(var(--kriri-accent-rgb, 94, 106, 210), 0.25))",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ======================= MAIN CONTENT AREA (SLIGHTLY ELEVATED CONTAINER) ======================= */}
      <div className="flex-1 flex flex-col p-0 md:p-2 min-w-0 h-full overflow-hidden">
        <main
          className="flex-1 flex flex-col min-w-0 rounded-none md:rounded-xl relative z-0 border-0 md:border md:border-[var(--border,rgba(255,255,255,0.06))] shadow-none md:shadow-xs dark:shadow-none md:dark:shadow-2xl overflow-hidden transition-colors"
          style={{ backgroundColor: "var(--card-bg)" }}
        >
          <div className="flex-1 h-full overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
            <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* ========================================================================= */}
          {/* 1. ACCOUNT: PREFERENCES TAB (Requested: Linear Account Preferences)       */}
          {/* ========================================================================= */}
          {activeTab === "preferences" && (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Preferences
                </h1>
                <p className="text-[13px] text-zinc-500 dark:text-[#8a8f98] mt-1">
                  Manage your personal interface preferences and application behavior.
                </p>
              </div>

              {/* SECTION: INTERFACE THEME (Clerk Card Design) */}
              <div className="border border-border bg-surface rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
                <div className="pb-4 border-b border-border-subtle">
                  <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                    Interface Theme
                  </h3>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Select your interface theme or synchronize with your operating system.
                  </p>
                </div>

                {/* 4 Core Theme Cards Grid: System, Dark, Light, Custom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Theme Card 1: System */}
                  <div
                    onClick={(e) => onThemeChange("system", "eclipse", e.currentTarget)}
                    className={`relative rounded-xl border p-3 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 group ${
                      theme === "system"
                        ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                        : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden relative flex shadow-xs">
                      <div className="w-1/2 h-full bg-[#f8fafc] border-r border-slate-200 p-1.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="w-6 h-1.5 bg-slate-300 rounded-full" />
                          <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>
                        <div className="w-full h-6 bg-white rounded border border-slate-200 p-1 space-y-1 shadow-2xs">
                          <div className="w-8 h-1 bg-slate-300 rounded" />
                        </div>
                      </div>
                      <div className="w-1/2 h-full bg-[#18181b] p-1.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="w-6 h-1.5 bg-zinc-700 rounded-full" />
                          <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                        </div>
                        <div className="w-full h-6 bg-[#27272a] rounded border border-zinc-700/50 p-1 space-y-1 shadow-2xs">
                          <div className="w-8 h-1 bg-zinc-600 rounded" />
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[8.5px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs">
                        AUTO
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                          <Monitor size={13} className="text-text-muted" />
                          <span>System</span>
                        </div>
                        <p className="text-[10.5px] text-text-muted mt-0.5 line-clamp-1">
                          Sync with OS
                        </p>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          theme === "system"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)] text-white"
                            : "border-border"
                        }`}
                      >
                        {theme === "system" && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Theme Card 2: Dark Theme */}
                  <div
                    onClick={(e) => onThemeChange("dark", "eclipse", e.currentTarget)}
                    className={`relative rounded-xl border p-3 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 group ${
                      theme === "dark"
                        ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                        : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg bg-[#101114] border border-white/10 p-2 flex flex-col justify-between overflow-hidden shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
                          <div className="w-8 h-1.5 bg-zinc-700 rounded-full" />
                        </div>
                        <div className="w-3 h-1 bg-zinc-800 rounded-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-5 rounded bg-[#18191d] border border-white/5 p-1 flex items-center justify-between">
                          <div className="w-12 h-1 bg-zinc-400 rounded" />
                          <div className="w-3 h-2.5 rounded bg-[#5e6ad2]/30" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                          <Moon size={13} className="text-text-muted" />
                          <span>Dark</span>
                        </div>
                        <p className="text-[10.5px] text-text-muted mt-0.5 line-clamp-1 capitalize">
                          {darkFlavor === "pure-black"
                            ? "Pure Black (OLED)"
                            : darkFlavor === "midnight"
                              ? "Midnight Navy"
                              : "Linear Charcoal"}
                        </p>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          theme === "dark"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)] text-white"
                            : "border-border"
                        }`}
                      >
                        {theme === "dark" && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Theme Card 3: Light Theme */}
                  <div
                    onClick={(e) => onThemeChange("light", "eclipse", e.currentTarget)}
                    className={`relative rounded-xl border p-3 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 group ${
                      theme === "light"
                        ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                        : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg border border-slate-200 flex overflow-hidden shadow-xs">
                      {/* Sidebar */}
                      <div
                        className={`w-[32%] h-full border-r border-slate-200/80 p-1.5 flex flex-col justify-between ${
                          lightFlavor === "pure-white" ? "bg-white" : "bg-[#f1f3f5]"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
                        <div className="w-full h-1 bg-slate-300 rounded" />
                      </div>
                      {/* White Main Pane */}
                      <div className="flex-1 h-full bg-white p-2 flex flex-col justify-between">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        <div className="w-full h-5 rounded bg-white border border-slate-200 p-1 flex items-center justify-between shadow-2xs">
                          <div className="w-8 h-1 bg-slate-400 rounded" />
                          <div className="w-2.5 h-2.5 rounded bg-blue-100" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                          <Sun size={13} className="text-text-muted" />
                          <span>Light</span>
                        </div>
                        <p className="text-[10.5px] text-text-muted mt-0.5 line-clamp-1">
                          {lightFlavor === "pure-white" ? "Pure White (Seamless)" : "Shaded Sidebar"}
                        </p>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          theme === "light"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)] text-white"
                            : "border-border"
                        }`}
                      >
                        {theme === "light" && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Theme Card 4: Custom */}
                  <div
                    onClick={(e) => onThemeChange("custom", "eclipse", e.currentTarget)}
                    className={`relative rounded-xl border p-3 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 group ${
                      theme === "custom"
                        ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                        : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <div
                      className="w-full h-20 rounded-lg border border-black/10 dark:border-white/10 flex overflow-hidden shadow-xs"
                      style={{ backgroundColor: customThemeBg }}
                    >
                      <div
                        className="w-[32%] h-full border-r border-black/10 dark:border-white/10 p-1.5 flex flex-col justify-between"
                        style={{
                          backgroundColor: customSidebarEnabled ? customSidebarBg : customThemeBg,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: customSidebarEnabled
                              ? customSidebarAccent
                              : customThemeAccent,
                          }}
                        />
                        <div className="w-full h-1 bg-white/20 rounded" />
                      </div>
                      <div className="flex-1 h-full p-2 flex flex-col justify-between">
                        <div className="w-12 h-1.5 bg-white/25 rounded-full" />
                        <div
                          className="w-full h-5 rounded border border-white/10 p-1 flex items-center justify-between"
                          style={{
                            backgroundColor: customThemeAccent,
                            opacity: 0.85,
                          }}
                        >
                          <div className="w-8 h-1 bg-white rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                          <Palette size={13} className="text-text-muted" />
                          <span>Custom</span>
                        </div>
                        <p className="text-[10.5px] text-text-muted mt-0.5 line-clamp-1">
                          Personalized palette
                        </p>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          theme === "custom"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)] text-white"
                            : "border-border"
                        }`}
                      >
                        {theme === "custom" && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* DARK FLAVORS SUBPANEL (when theme is Dark, or System in Dark mode)        */}
                {/* ========================================================================= */}
                {(theme === "dark" || (theme === "system" && effectiveTheme === "dark")) && (
                  <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between px-0.5">
                      <div>
                        <span className="text-[12.5px] font-semibold text-foreground">
                          Dark appearance
                        </span>
                        <p className="text-[11px] text-text-muted">
                          {theme === "system"
                            ? "Used when your operating system is in dark mode"
                            : "Select your preferred dark mode flavor"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Flavor 1: Charcoal / Linear Dark */}
                      <button
                        type="button"
                        onClick={() => setDarkFlavor("default")}
                        className={`p-3 rounded-xl border flex flex-col gap-2.5 text-left transition-all cursor-pointer ${
                          darkFlavor === "default"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                            : "border-border bg-surface hover:border-black/20 dark:hover:border-white/15"
                        }`}
                      >
                        <div className="w-full h-12 rounded-lg bg-[#0d0e11] border border-white/10 p-1.5 flex flex-col justify-between">
                          <div className="w-full h-5 rounded bg-[#15171c] border border-white/5 p-1 flex items-center justify-between">
                            <div className="w-10 h-1 bg-zinc-400 rounded" />
                            <div className="w-2.5 h-2 rounded bg-[#5e6ad2]/40" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-foreground">
                              Linear Charcoal
                            </div>
                            <div className="text-[10px] text-text-muted">
                              Subtle gray elevations
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                              darkFlavor === "default"
                                ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)]"
                                : "border-border"
                            }`}
                          >
                            {darkFlavor === "default" && (
                              <div className="w-1 h-1 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Flavor 2: Pure Black (OLED Pitch Black) */}
                      <button
                        type="button"
                        onClick={() => setDarkFlavor("pure-black")}
                        className={`p-3 rounded-xl border flex flex-col gap-2.5 text-left transition-all cursor-pointer ${
                          darkFlavor === "pure-black"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                            : "border-border bg-surface hover:border-black/20 dark:hover:border-white/15"
                        }`}
                      >
                        <div className="w-full h-12 rounded-lg bg-[#000000] border border-white/10 p-1.5 flex flex-col justify-between">
                          <div className="w-full h-5 rounded bg-[#0c0c0e] border border-white/10 p-1 flex items-center justify-between">
                            <div className="w-10 h-1 bg-zinc-400 rounded" />
                            <div className="w-2.5 h-2 rounded bg-[#5e6ad2]/40" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-foreground">
                              Pure Black (OLED)
                            </div>
                            <div className="text-[10px] text-text-muted">
                              True #000000 pitch black
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                              darkFlavor === "pure-black"
                                ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)]"
                                : "border-border"
                            }`}
                          >
                            {darkFlavor === "pure-black" && (
                              <div className="w-1 h-1 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Flavor 3: Midnight (Deep Space Navy) */}
                      <button
                        type="button"
                        onClick={() => setDarkFlavor("midnight")}
                        className={`p-3 rounded-xl border flex flex-col gap-2.5 text-left transition-all cursor-pointer ${
                          darkFlavor === "midnight"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                            : "border-border bg-surface hover:border-black/20 dark:hover:border-white/15"
                        }`}
                      >
                        <div className="w-full h-12 rounded-lg bg-[#080b11] border border-blue-500/20 p-1.5 flex flex-col justify-between">
                          <div className="w-full h-5 rounded bg-[#121824] border border-blue-400/10 p-1 flex items-center justify-between">
                            <div className="w-10 h-1 bg-slate-400 rounded" />
                            <div className="w-2.5 h-2 rounded bg-indigo-500/40" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-foreground">
                              Midnight Navy
                            </div>
                            <div className="text-[10px] text-text-muted">
                              Deep space indigo undertones
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                              darkFlavor === "midnight"
                                ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)]"
                                : "border-border"
                            }`}
                          >
                            {darkFlavor === "midnight" && (
                              <div className="w-1 h-1 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* LIGHT FLAVORS SUBPANEL (when theme is Light, or System in Light mode)     */}
                {/* ========================================================================= */}
                {(theme === "light" || (theme === "system" && effectiveTheme === "light")) && (
                  <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between px-0.5">
                      <div>
                        <span className="text-[12.5px] font-semibold text-foreground">
                          Light appearance
                        </span>
                        <p className="text-[11px] text-text-muted">
                          {theme === "system"
                            ? "Used when your operating system is in light mode"
                            : "Choose your sidebar and workspace contrast"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Flavor 1: Shaded Sidebar (Image 3) */}
                      <button
                        type="button"
                        onClick={() => setLightFlavor("shaded")}
                        className={`p-3 rounded-xl border flex flex-col gap-2.5 text-left transition-all cursor-pointer ${
                          lightFlavor === "shaded"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                            : "border-border bg-surface hover:border-black/20 dark:hover:border-white/15"
                        }`}
                      >
                        <div className="w-full h-12 rounded-lg border border-slate-200 flex overflow-hidden">
                          <div className="w-[32%] h-full bg-[#f1f3f5] border-r border-slate-200/80 p-1 flex flex-col justify-between">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
                            <div className="w-full h-1 bg-slate-300 rounded" />
                          </div>
                          <div className="flex-1 h-full bg-white p-1.5 flex flex-col justify-between">
                            <div className="w-10 h-1.5 bg-slate-200 rounded" />
                            <div className="w-full h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-between">
                              <div className="w-6 h-1 bg-slate-400 rounded" />
                              <div className="w-2 h-2 rounded bg-blue-100" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-foreground">
                              Shaded Sidebar
                            </div>
                            <div className="text-[10px] text-text-muted">
                              Soft gray sidebar with pure white workspace
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                              lightFlavor === "shaded"
                                ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)]"
                                : "border-border"
                            }`}
                          >
                            {lightFlavor === "shaded" && (
                              <div className="w-1 h-1 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Flavor 2: Pure White (Image 4) */}
                      <button
                        type="button"
                        onClick={() => setLightFlavor("pure-white")}
                        className={`p-3 rounded-xl border flex flex-col gap-2.5 text-left transition-all cursor-pointer ${
                          lightFlavor === "pure-white"
                            ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-surface ring-2 ring-[var(--kriri-accent-color,#5e6ad2)]/25 shadow-xs"
                            : "border-border bg-surface hover:border-black/20 dark:hover:border-white/15"
                        }`}
                      >
                        <div className="w-full h-12 rounded-lg border border-slate-200 flex overflow-hidden bg-white">
                          <div className="w-[32%] h-full bg-white border-r border-slate-200 p-1 flex flex-col justify-between">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
                            <div className="w-full h-1 bg-slate-200 rounded" />
                          </div>
                          <div className="flex-1 h-full bg-white p-1.5 flex flex-col justify-between">
                            <div className="w-10 h-1.5 bg-slate-200 rounded" />
                            <div className="w-full h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-between">
                              <div className="w-6 h-1 bg-slate-400 rounded" />
                              <div className="w-2 h-2 rounded bg-blue-100" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[12px] font-semibold text-foreground">
                              Pure White (Seamless)
                            </div>
                            <div className="text-[10px] text-text-muted">
                              Seamless all-white sidebar and workspace
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                              lightFlavor === "pure-white"
                                ? "border-[var(--kriri-accent-color,#5e6ad2)] bg-[var(--kriri-accent-color,#5e6ad2)]"
                                : "border-border"
                            }`}
                          >
                            {lightFlavor === "pure-white" && (
                              <div className="w-1 h-1 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* CUSTOM THEME CONFIGURATION (Exact Linear Design from Image 2)            */}
                {/* ========================================================================= */}
                {theme === "custom" && (
                  <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-150">
                    {/* Card 1: Main Theme Controls (Unified Container 1 design) */}
                    <div className="rounded-2xl border border-border bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
                      {/* Row 1: Accent */}
                      <div className="px-6 py-4.5 flex items-center justify-between">
                        <div>
                          <label className="text-[13.5px] font-medium text-foreground">
                            Accent
                          </label>
                          <p className="text-[11.5px] text-text-muted">
                            Primary tint for buttons, badges, and focus indicators.
                          </p>
                        </div>
                        <label className="relative flex items-center justify-between gap-2.5 h-8.5 px-3 rounded-lg border border-border bg-surface-hover hover:bg-surface-active cursor-pointer transition-colors shadow-2xs group min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-border"
                              style={{ backgroundColor: customThemeAccent }}
                            />
                            <Pipette
                              size={12}
                              className="text-text-muted group-hover:text-foreground"
                            />
                            <span className="text-[12px] font-mono font-medium text-foreground uppercase">
                              {customThemeAccent}
                            </span>
                          </div>
                          <ChevronsUpDown size={12} className="text-text-muted shrink-0" />
                          <input
                            type="color"
                            value={customThemeAccent}
                            onChange={(e) => handleUpdateCustomTheme({ accent: e.target.value })}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            title="Pick custom accent"
                          />
                        </label>
                      </div>

                      {/* Row 2: Background */}
                      <div className="px-6 py-4.5 flex items-center justify-between">
                        <div>
                          <label className="text-[13.5px] font-medium text-foreground">
                            Background
                          </label>
                          <p className="text-[11.5px] text-text-muted">
                            Base canvas and application background color.
                          </p>
                        </div>
                        <label className="relative flex items-center justify-between gap-2.5 h-8.5 px-3 rounded-lg border border-border bg-surface-hover hover:bg-surface-active cursor-pointer transition-colors shadow-2xs group min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-border"
                              style={{ backgroundColor: customThemeBg }}
                            />
                            <Pipette
                              size={12}
                              className="text-text-muted group-hover:text-foreground"
                            />
                            <span className="text-[12px] font-mono font-medium text-foreground uppercase">
                              {customThemeBg}
                            </span>
                          </div>
                          <ChevronsUpDown size={12} className="text-text-muted shrink-0" />
                          <input
                            type="color"
                            value={customThemeBg}
                            onChange={(e) => handleUpdateCustomTheme({ bg: e.target.value })}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            title="Pick custom background"
                          />
                        </label>
                      </div>

                      {/* Row 3: Contrast */}
                      <div className="px-6 py-4.5 flex items-center justify-between gap-4">
                        <div>
                          <label className="text-[13.5px] font-medium text-foreground">
                            Contrast
                          </label>
                          <p className="text-[11.5px] text-text-muted">
                            Elevation depth between surface cards and background.
                          </p>
                        </div>
                        <SleekSlider
                          value={customThemeContrast}
                          min={0}
                          max={100}
                          onChange={(val) =>
                            handleUpdateCustomTheme({ contrast: val })
                          }
                          accentColor={customThemeAccent}
                          ariaLabel="Main theme contrast"
                          className="w-48 sm:w-60"
                        />
                      </div>
                    </div>

                    {/* Card 2: Custom Sidebar Theme Controls (Unified Container 1 design) */}
                    <div className="rounded-2xl border border-border bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
                      {/* Header with Switch */}
                      <div className="px-6 py-4.5 flex items-center justify-between">
                        <div>
                          <h3 className="text-[13.5px] font-medium text-foreground">
                            Custom sidebar theme
                          </h3>
                          <p className="text-[11.5px] text-text-muted">
                            Apply dedicated colors and contrast specifically to the navigation sidebar.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCustomTheme({ sidebarEnabled: !customSidebarEnabled })
                          }
                          className="w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0"
                          style={{
                            backgroundColor: customSidebarEnabled
                              ? (customThemeAccent || "var(--kriri-accent, #5e6ad2)")
                              : undefined,
                          }}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform shadow-xs ${
                              customSidebarEnabled ? "translate-x-5.5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Expanded Sidebar Controls when enabled */}
                      {customSidebarEnabled && (
                        <>
                          {/* Sidebar Accent */}
                          <div className="px-6 py-4.5 flex items-center justify-between">
                            <div>
                              <label className="text-[13px] font-medium text-foreground">
                                Accent
                              </label>
                              <p className="text-[11.5px] text-text-muted">
                                Active icon and selection highlight inside the sidebar.
                              </p>
                            </div>
                            <label className="relative flex items-center justify-between gap-2.5 h-8.5 px-3 rounded-lg border border-border bg-surface-hover hover:bg-surface-active cursor-pointer transition-colors shadow-2xs group min-w-[130px]">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-border"
                                  style={{ backgroundColor: customSidebarAccent }}
                                />
                                <Pipette
                                  size={12}
                                  className="text-text-muted group-hover:text-foreground"
                                />
                                <span className="text-[12px] font-mono font-medium text-foreground uppercase">
                                  {customSidebarAccent}
                                </span>
                              </div>
                              <ChevronsUpDown size={12} className="text-text-muted shrink-0" />
                              <input
                                type="color"
                                value={customSidebarAccent}
                                onChange={(e) =>
                                  handleUpdateCustomTheme({ sidebarAccent: e.target.value })
                                }
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                title="Pick sidebar accent"
                              />
                            </label>
                          </div>

                          {/* Sidebar Background */}
                          <div className="px-6 py-4.5 flex items-center justify-between">
                            <div>
                              <label className="text-[13px] font-medium text-foreground">
                                Background
                              </label>
                              <p className="text-[11.5px] text-text-muted">
                                Distinct background color for the sidebar rail.
                              </p>
                            </div>
                            <label className="relative flex items-center justify-between gap-2.5 h-8.5 px-3 rounded-lg border border-border bg-surface-hover hover:bg-surface-active cursor-pointer transition-colors shadow-2xs group min-w-[130px]">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-border"
                                  style={{ backgroundColor: customSidebarBg }}
                                />
                                <Pipette
                                  size={12}
                                  className="text-text-muted group-hover:text-foreground"
                                />
                                <span className="text-[12px] font-mono font-medium text-foreground uppercase">
                                  {customSidebarBg}
                                </span>
                              </div>
                              <ChevronsUpDown size={12} className="text-text-muted shrink-0" />
                              <input
                                type="color"
                                value={customSidebarBg}
                                onChange={(e) =>
                                  handleUpdateCustomTheme({ sidebarBg: e.target.value })
                                }
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                title="Pick sidebar background"
                              />
                            </label>
                          </div>

                          {/* Sidebar Contrast */}
                          <div className="px-6 py-4.5 flex items-center justify-between gap-4">
                            <div>
                              <label className="text-[13px] font-medium text-foreground">
                                Contrast
                              </label>
                              <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                                Sidebar item separation and border contrast.
                              </p>
                            </div>
                            <SleekSlider
                              value={customSidebarContrast}
                              min={0}
                              max={100}
                              onChange={(val) =>
                                handleUpdateCustomTheme({
                                  sidebarContrast: val,
                                })
                              }
                              accentColor={customSidebarAccent}
                              ariaLabel="Sidebar theme contrast"
                              className="w-48 sm:w-60"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: DISPLAY & FORMATTING */}
              <div className="border border-border bg-surface rounded-2xl overflow-hidden shadow-xs transition-colors">
                <div className="p-6 pb-4 border-b border-border-subtle">
                  <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                    Display & Formatting
                  </h3>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Customize the density, accents, and layout formatting of your workspace views.
                  </p>
                </div>

                <div className="divide-y divide-border-subtle">
                  {/* Row: Accent Color (when theme is not custom) */}
                  {theme !== "custom" && (
                    <div className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-[13.5px] font-medium text-zinc-900 dark:text-zinc-200">
                          Accent color
                        </h4>
                        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Choose an accent tint for badges, active states, and focus rings.
                        </p>
                      </div>

                      {/* Dropdown in front of Accent Color */}
                      <div className="relative shrink-0 self-start sm:self-auto" ref={accentMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsAccentMenuOpen((prev) => !prev)}
                          className="flex items-center gap-2.5 h-8 px-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-[12px] font-medium text-zinc-900 dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition-colors cursor-pointer shadow-2xs"
                          aria-expanded={isAccentMenuOpen}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/15 dark:ring-white/20"
                            style={{ backgroundColor: currentAccentObj.hex }}
                          />
                          <span className="truncate max-w-[130px]">{currentAccentObj.name}</span>
                          <ChevronDown
                            size={13}
                            className={`text-zinc-400 dark:text-[#8a8f98] transition-transform duration-150 ${
                              isAccentMenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Dropdown Menu */}
                        {isAccentMenuOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b1e] shadow-xl p-1.5 z-50 animate-in fade-in duration-100">
                            <div className="space-y-0.5">
                              {ACCENT_COLORS.map((col) => {
                                const isSelected = accentColor === col.id;
                                return (
                                  <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => handleAccentChange(col.id)}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-black/[0.05] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-semibold"
                                        : "text-zinc-600 dark:text-[#8a8f98] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-zinc-950 dark:hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/10 dark:ring-white/10"
                                        style={{ backgroundColor: col.hex }}
                                      />
                                      <span>{col.name}</span>
                                    </div>
                                    {isSelected && <Check size={13} className="text-[#5e6ad2]" />}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="h-px bg-black/[0.06] dark:bg-white/[0.08] my-1.5" />

                            {/* Custom Color Option with Color Picker */}
                            <div className="p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAccentMenuOpen(false);
                                  setTempCustomHex(customAccentHex || "#5e6ad2");
                                  setIsColorPickerOpen(true);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer group ${
                                  accentColor === "custom"
                                    ? "bg-black/[0.05] dark:bg-white/[0.1] text-zinc-950 dark:text-white font-semibold"
                                    : "text-zinc-600 dark:text-[#8a8f98] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-zinc-950 dark:hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/15 dark:ring-white/20 relative overflow-hidden"
                                    style={{ backgroundColor: customAccentHex }}
                                  />
                                  <div className="flex flex-col text-left">
                                    <span>Custom color...</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-[#8a8f98] font-mono">
                                      {customAccentHex.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-white">
                                  <Pipette size={13} />
                                  {accentColor === "custom" && <Check size={13} className="text-[#5e6ad2]" />}
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Dedicated Rounded Custom Color Picker */}
                        {isColorPickerOpen && (
                          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1b1e] shadow-2xl p-4 z-50 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                                  Custom Accent
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-[#8a8f98]">
                                  Pick any custom tint
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 bg-black/[0.02] dark:bg-white/[0.04]">
                                {tempCustomHex.toUpperCase()}
                              </span>
                            </div>

                            {/* Live Preview Box with underlying Native Picker Trigger */}
                            <div className="relative group w-full h-14 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-xs cursor-pointer flex items-center justify-center transition-transform hover:scale-[1.01]">
                              <div
                                className="absolute inset-0 transition-colors"
                                style={{ backgroundColor: tempCustomHex }}
                              />
                              <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11.5px] font-medium shadow-sm pointer-events-none">
                                <Pipette size={12} />
                                <span>Click to open color wheel</span>
                              </div>
                              <input
                                type="color"
                                value={
                                  tempCustomHex.startsWith("#") &&
                                  (tempCustomHex.length === 7 || tempCustomHex.length === 4)
                                    ? tempCustomHex
                                    : "#5e6ad2"
                                }
                                onChange={(e) => setTempCustomHex(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                title="Choose custom color"
                              />
                            </div>

                            {/* Quick Palette Swatches */}
                            <div>
                              <div className="text-[11px] font-medium text-zinc-400 dark:text-[#8a8f98] mb-1.5">
                                Quick swatches
                              </div>
                              <div className="grid grid-cols-6 gap-2">
                                {QUICK_PALETTE.map((hex) => {
                                  const isSelected =
                                    tempCustomHex.toLowerCase() === hex.toLowerCase();
                                  return (
                                    <button
                                      key={hex}
                                      type="button"
                                      onClick={() => setTempCustomHex(hex)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer relative"
                                      style={{ backgroundColor: hex }}
                                      title={hex}
                                    >
                                      {isSelected && (
                                        <Check size={12} className="text-white drop-shadow-sm" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Hex text input & Eyedropper */}
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-[12px]">
                                  #
                                </span>
                                <input
                                  type="text"
                                  value={tempCustomHex.replace(/^#/, "")}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[^0-9A-Fa-f]/g, "")
                                      .slice(0, 6);
                                    setTempCustomHex(`#${val}`);
                                  }}
                                  placeholder="5E6AD2"
                                  maxLength={6}
                                  className="w-full h-8 pl-6 pr-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[12px] font-mono text-zinc-900 dark:text-white uppercase focus:outline-none focus:ring-1.5 focus:ring-[#5e6ad2]"
                                />
                              </div>

                              {typeof window !== "undefined" && "EyeDropper" in window && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const eyeDropper = new window.EyeDropper();
                                      const result = await eyeDropper.open();
                                      if (result?.sRGBHex) {
                                        setTempCustomHex(result.sRGBHex);
                                      }
                                    } catch {
                                      // User cancelled eyedropper
                                    }
                                  }}
                                  className="h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-colors"
                                  title="Pick color from screen"
                                >
                                  <Pipette size={12} />
                                  <span>Eyedropper</span>
                                </button>
                              )}
                            </div>

                            {/* Actions: Cancel & Set color */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                              <button
                                type="button"
                                onClick={() => setIsColorPickerOpen(false)}
                                className="h-7.5 px-3 rounded-lg text-[12px] font-medium text-zinc-600 dark:text-[#8a8f98] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  let finalHex = tempCustomHex.trim();
                                  if (!finalHex.startsWith("#")) finalHex = `#${finalHex}`;
                                  if (
                                    /^#[0-9A-Fa-f]{3}$/.test(finalHex) ||
                                    /^#[0-9A-Fa-f]{6}$/.test(finalHex)
                                  ) {
                                    handleCustomAccentChange(finalHex);
                                    setIsColorPickerOpen(false);
                                  } else {
                                    sileo.error({
                                      title: "Invalid hex code",
                                      description: "Please enter a valid 3 or 6 digit hex code",
                                    });
                                  }
                                }}
                                className="h-7.5 px-3.5 rounded-lg text-[12px] font-semibold text-white transition-all cursor-pointer shadow-xs hover:opacity-95 active:scale-95 flex items-center gap-1.5"
                                style={{ backgroundColor: tempCustomHex }}
                              >
                                <Check size={12} />
                                <span>Set color</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Row 1: Density */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-medium text-zinc-900 dark:text-white">
                        Density
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                        Controls the spacing and row height across list views and tables.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleDensityChange("comfortable")}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          density === "comfortable"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Comfortable
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDensityChange("compact")}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          density === "compact"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Compact
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Name Display */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-medium text-zinc-900 dark:text-white">
                        Display format
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                        How member names are shown across tickets, comments, and assignments.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setNameFormat("full");
                          localStorage.setItem("kriri-name-format", "full");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          nameFormat === "full"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Full names
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNameFormat("username");
                          localStorage.setItem("kriri-name-format", "username");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          nameFormat === "username"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Usernames
                      </button>
                    </div>
                  </div>

                  {/* Row 3: First Day of the Week */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-medium text-zinc-900 dark:text-white">
                        First day of the week
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                        Used for calendar pickers, roadmap timelines, and cycle dates.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFirstDayOfWeek("monday");
                          localStorage.setItem("kriri-first-day", "monday");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          firstDayOfWeek === "monday"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Monday
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFirstDayOfWeek("sunday");
                          localStorage.setItem("kriri-first-day", "sunday");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          firstDayOfWeek === "sunday"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Sunday
                      </button>
                    </div>
                  </div>

                  {/* Row 4: Time Format */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-medium text-zinc-900 dark:text-white">
                        Time format
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                        Select your preferred 12-hour or 24-hour time display standard.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setTimeFormat("12h");
                          localStorage.setItem("kriri-time-format", "12h");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          timeFormat === "12h"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        12-hour (1:30 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimeFormat("24h");
                          localStorage.setItem("kriri-time-format", "24h");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          timeFormat === "24h"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        24-hour (13:30)
                      </button>
                    </div>
                  </div>

                  {/* Row 5: Date Display (Relative vs Absolute) */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-medium text-zinc-900 dark:text-white">
                        Date display
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                        Format timestamps as relative age or exact calendar dates.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setDateFormat("relative");
                          localStorage.setItem("kriri-date-format", "relative");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          dateFormat === "relative"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Relative (2h ago)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDateFormat("absolute");
                          localStorage.setItem("kriri-date-format", "absolute");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          dateFormat === "absolute"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        Absolute ({calendarDateOrder === "mm/dd/yyyy" ? "11/08/2026" : calendarDateOrder === "yyyy-mm-dd" ? "2026-11-08" : "08/11/2026"})
                      </button>
                    </div>
                  </div>

                  {/* Row 6: Calendar Date Format (DD/MM/YYYY vs MM/DD/YYYY vs YYYY-MM-DD) */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-medium text-zinc-900 dark:text-white">
                        Calendar date format
                      </h4>
                      <p className="text-[11.5px] text-zinc-500 dark:text-[#8a8f98]">
                        Ordering of day, month, and year across calendar dates.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarDateOrder("dd/mm/yyyy");
                          localStorage.setItem("kriri-calendar-date-order", "dd/mm/yyyy");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          calendarDateOrder === "dd/mm/yyyy"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        DD/MM/YYYY
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarDateOrder("mm/dd/yyyy");
                          localStorage.setItem("kriri-calendar-date-order", "mm/dd/yyyy");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          calendarDateOrder === "mm/dd/yyyy"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        MM/DD/YYYY
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarDateOrder("yyyy-mm-dd");
                          localStorage.setItem("kriri-calendar-date-order", "yyyy-mm-dd");
                          applyPreferencesToDom();
                          playUiSound("toggle");
                        }}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                          calendarDateOrder === "yyyy-mm-dd"
                            ? "bg-white dark:bg-white/[0.12] text-zinc-950 dark:text-white shadow-xs"
                            : "text-zinc-600 dark:text-[#8a8f98] hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        YYYY-MM-DD
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: SOUNDS & AUDIO FEEDBACK */}
              <div className="border border-border bg-surface rounded-2xl overflow-hidden shadow-xs transition-colors">
                <div className="p-6 pb-4 border-b border-border-subtle">
                  <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                    Sound Effects & Feedback
                  </h3>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Configure subtle auditory and haptic cues during daily interactions.
                  </p>
                </div>

                <div className="divide-y divide-border-subtle">
                  {/* Sound Toggle */}
                  <div className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-hover text-text-muted shrink-0 mt-0.5">
                        {soundEffects ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      </div>
                      <div>
                        <span className="text-[13px] font-medium text-foreground block">
                          Sound effects
                        </span>
                        <p className="text-[11.5px] text-text-muted">
                          Play subtle harmonic chimes when tasks complete, milestones update, or actions succeed.
                        </p>
                      </div>
                    </div>
                    <ClerkSwitch
                      checked={soundEffects}
                      onChange={handleSoundToggle}
                      ariaLabel="Sound effects"
                    />
                  </div>

                  {/* Micro Animations */}
                  <div className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-hover text-text-muted shrink-0 mt-0.5">
                        <Waves size={16} />
                      </div>
                      <div>
                        <span className="text-[13px] font-medium text-foreground block">
                          Fluid micro-animations
                        </span>
                        <p className="text-[11.5px] text-text-muted">
                          Enable high-framerate spring physics and visual state transitions.
                        </p>
                      </div>
                    </div>
                    <ClerkSwitch
                      checked={fluidAnimations}
                      onChange={() => {
                        const next = !fluidAnimations;
                        setFluidAnimations(next);
                        localStorage.setItem("kriri-animations", String(next));
                        applyPreferencesToDom();
                        playUiSound("toggle");
                      }}
                      ariaLabel="Fluid micro-animations"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: NAVIGATION & WORKFLOW */}
              <div className="border border-border bg-surface rounded-2xl overflow-hidden shadow-xs transition-colors">
                <div className="p-6 pb-4 border-b border-border-subtle">
                  <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                    Navigation & Startup
                  </h3>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Choose your default startup landing page and keyboard interaction behavior.
                  </p>
                </div>

                <div className="divide-y divide-border-subtle">
                  <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 max-w-sm">
                      <span className="text-[13px] font-medium text-foreground block">
                        Startup view
                      </span>
                      <p className="text-[11.5px] text-text-muted">
                        The page that opens automatically when you start your session.
                      </p>
                    </div>
                    <ClerkSelect
                      value={defaultView}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDefaultView(val);
                        localStorage.setItem("kriri-default-view", val);
                        playUiSound("toggle");
                      }}
                      options={[
                        { value: "dashboard", label: "Dashboard" },
                        { value: "inbox", label: "Inbox" },
                        { value: "tasks", label: "Issues" },
                        { value: "kanban", label: "Board" },
                        { value: "projects", label: "Projects" },
                        { value: "agent", label: "Agent" },
                      ]}
                      ariaLabel="Startup view"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ACCOUNT: PROFILE TAB (Personalized for Kriri)                          */}
          {/* ========================================================================= */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Profile
                </h1>
                <p className="text-[13px] text-zinc-500 dark:text-[#8a8f98] mt-1">
                  Manage your personal identity, engineering credentials, and workspace role in Kriri.
                </p>
              </div>

              {/* Embedded Clerk UserProfile with Custom Workspace Page */}
              <div className="w-full settings-clerk-container">
                {!isUserLoaded ? (
                  <div className="border border-border rounded-2xl bg-surface p-6 flex flex-col gap-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-black/[0.08] dark:bg-white/[0.1] shrink-0" />
                      <div className="flex flex-col gap-2">
                        <div className="w-24 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                        <div className="w-32 h-6 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="w-20 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                        <div className="w-full h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="w-20 h-3 rounded bg-black/[0.05] dark:bg-white/[0.07]" />
                        <div className="w-full h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
                      </div>
                    </div>
                  </div>
                ) : !user ? (
                  <div className="border border-border rounded-2xl bg-surface p-12 text-center space-y-3">
                    <p className="text-[13.5px] font-medium text-foreground">Sign-in Required</p>
                    <p className="text-[12px] text-text-muted">
                      Please sign in to access your personal profile and workspace credentials.
                    </p>
                  </div>
                ) : (
                  <UserProfile
                    routing="hash"
                    appearance={{
                      elements: {
                        rootBox: "w-full max-w-none shadow-none",
                        cardBox: "w-full max-w-none shadow-none flex flex-col sm:flex-row gap-0 items-stretch",
                        card: "flex-1 min-w-0 w-full shadow-none border border-border bg-surface rounded-2xl overflow-hidden",
                        navbar: "w-full sm:w-[200px] shrink-0 bg-transparent border-none p-0 m-0",
                        navbarButton: "text-text-muted hover:text-foreground",
                        navbarButtonActive: "text-foreground font-medium",
                        pageScrollBox: "p-6 sm:p-8 bg-transparent scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                        scrollBox: "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                        footer: "hidden",
                      },
                    }}
                  >
                    <UserProfile.Page label="account" />
                    <UserProfile.Page
                      label="Workspace"
                      url="workspace"
                      labelIcon={<Building size={16} />}
                    >
                      <div className="space-y-6 animate-in fade-in duration-200 pb-16">
                        <div className="pb-4 border-b border-border-subtle">
                          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                            Workspace Profile
                          </h3>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            Configure your role and handle within this Kriri workspace.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="pt-2 pb-2">
                            <h4 className="text-[13px] font-semibold text-foreground">
                              Role & Identity
                            </h4>
                          </div>

                          <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
                            {/* 1. Title & Role */}
                            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-0.5 max-w-sm">
                                <span className="text-[13px] font-medium text-foreground block">
                                  Title
                                </span>
                                <span className="text-[11.5px] text-text-muted block">
                                  Your job title or workspace role
                                </span>
                              </div>
                              <input
                                type="text"
                                value={jobTitle}
                                onChange={handleJobTitleChange}
                                onBlur={handleSaveJobTitle}
                                onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                                placeholder="Software engineer"
                                className="h-8 px-2.5 rounded-lg bg-surface-hover border border-border text-[12px] text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent w-full sm:w-60 transition-colors shrink-0"
                              />
                            </div>

                            {/* 2. Username */}
                            <div className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-0.5 max-w-sm">
                                <span className="text-[13px] font-medium text-foreground block">
                                  Username
                                </span>
                                <span className="text-[11.5px] text-text-muted block">
                                  Used for team mentions, comments, and project assignment tags
                                </span>
                              </div>
                              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                                <div className="relative w-full sm:w-60 shrink-0">
                                  <input
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    onBlur={handleSaveUsername}
                                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                                    placeholder="cyruskjones"
                                    className={`w-full h-8 px-2.5 pr-7 rounded-lg bg-surface-hover border text-[12px] text-foreground placeholder:text-text-muted focus:outline-none transition-colors ${
                                      usernameStatus.status === "taken"
                                        ? "border-red-500/60 focus:border-red-500"
                                        : usernameStatus.status === "available"
                                        ? "border-emerald-500/60 focus:border-emerald-500"
                                        : "border-border focus:border-accent"
                                    }`}
                                  />
                                  {usernameStatus.status === "checking" && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                      <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  )}
                                  {usernameStatus.status === "available" && (
                                    <Check size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500" />
                                  )}
                                  {usernameStatus.status === "taken" && (
                                    <AlertCircle size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                                  )}
                                </div>

                                {usernameStatus.status === "taken" && (
                                  <div className="w-full sm:w-60 mt-2 p-2 rounded-lg bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-left space-y-1.5 animate-in fade-in duration-150">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                                      <AlertCircle size={12} className="shrink-0" />
                                      <span>@{username} is already taken</span>
                                    </div>
                                    {usernameStatus.suggestions.length > 0 && (
                                      <div>
                                        <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 block mb-1">
                                          Available suggestions:
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {usernameStatus.suggestions.map((sug) => (
                                            <button
                                              key={sug}
                                              type="button"
                                              onClick={() => handleApplySuggestion(sug)}
                                              className="px-2 py-0.5 rounded text-[10.5px] font-mono font-medium bg-[#5e6ad2]/10 hover:bg-[#5e6ad2]/20 text-[#5e6ad2] dark:text-[#818cf8] border border-[#5e6ad2]/25 transition-all cursor-pointer"
                                              title={`Use @${sug}`}
                                            >
                                              @{sug}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {usernameStatus.status === "available" && username !== initialUsernameRef.current && (
                                  <div className="w-full sm:w-60 mt-1 text-left sm:text-right">
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                                      <Check size={11} strokeWidth={2.5} /> @{username} is available
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Workspace Access */}
                        <div className="space-y-1">
                          <div className="pt-2 pb-2">
                            <h4 className="text-[13px] font-semibold text-foreground">
                              Workspace Access
                            </h4>
                          </div>
                          <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
                            <div className="py-3.5 flex items-center justify-between gap-3">
                              <div className="space-y-0.5 max-w-sm">
                                <span className="text-[13px] font-medium text-foreground block">
                                  Leave Workspace
                                </span>
                                <span className="text-[11.5px] text-text-muted block">
                                  Remove yourself and relinquish your membership in this workspace.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsLeaveWorkspaceModalOpen(true)}
                                className="text-[12.5px] font-medium text-red-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                              >
                                Leave workspace
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </UserProfile.Page>
                    <UserProfile.Page label="security" />
                  </UserProfile>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. ACCOUNT: NOTIFICATIONS TAB                                             */}
          {/* ========================================================================= */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Notifications
                </h1>
                <p className="text-[13px] text-text-muted mt-1">
                  Configure delivery channels and trigger criteria for activity notifications.
                </p>
              </div>

              <ClerkCard
                title="Notification Settings"
                description="Manage how and when Kriri sends you notifications across channels."
              >
                <ClerkSection
                  title="Delivery Channels"
                  description="Choose where and how you receive workspace alerts."
                >
                  <ClerkRow
                    title="Desktop toast alerts"
                    description="Display browser pop-up toasts for real-time mentions and task updates."
                  >
                    <ClerkSwitch
                      checked={desktopAlerts}
                      onChange={handleDesktopAlertsToggle}
                      ariaLabel="Desktop toast alerts"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Email notifications"
                    description={`Receive issue digests, assignments, and critical updates via ${primaryEmail}.`}
                  >
                    <ClerkSwitch
                      checked={emailNotifications}
                      onChange={handleEmailToggle}
                      ariaLabel="Email notifications"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Email only when inactive"
                    description="Only send email notifications if you have not been active in Kriri during the last 15 minutes."
                    className={!emailNotifications ? "opacity-50 pointer-events-none" : ""}
                  >
                    <ClerkSwitch
                      checked={emailOnlyInactive}
                      disabled={!emailNotifications}
                      onChange={handleEmailOnlyInactiveToggle}
                      ariaLabel="Email only when inactive"
                    />
                  </ClerkRow>
                </ClerkSection>

                <ClerkSection
                  title="Activity Triggers"
                  description="Select which events generate notifications in your workspace inbox."
                >
                  <ClerkRow
                    title="Assignments & reassignments"
                    description="When an issue or task is assigned to you or transferred."
                  >
                    <ClerkSwitch
                      checked={notifyAssignments}
                      onChange={handleNotifyAssignmentsToggle}
                      ariaLabel="Assignments & reassignments"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Mentions & replies"
                    description={`When someone mentions @${username || user?.firstName?.toLowerCase() || "user"} or replies to your comments.`}
                  >
                    <ClerkSwitch
                      checked={notifyMentions}
                      onChange={handleNotifyMentionsToggle}
                      ariaLabel="Mentions & replies"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Status & completion changes"
                    description="When issues you created, are assigned to, or follow change status."
                  >
                    <ClerkSwitch
                      checked={notifyStatusChanges}
                      onChange={handleNotifyStatusChangesToggle}
                      ariaLabel="Status & completion changes"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Project & cycle milestones"
                    description="Weekly cycle summaries, milestone progress, and team roadmap updates."
                  >
                    <ClerkSwitch
                      checked={notifyMilestones}
                      onChange={handleNotifyMilestonesToggle}
                      ariaLabel="Project & cycle milestones"
                    />
                  </ClerkRow>
                </ClerkSection>
              </ClerkCard>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. WORKSPACE: ORGANIZATION (Identity, Members, Settings)                  */}
          {/* ========================================================================= */}
          {(activeTab === "organization" || activeTab === "general" || activeTab === "members") && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Organization
                </h1>
                <p className="text-[13px] text-text-muted mt-1">
                  Manage team identity, collaborators, access governance, and workspace defaults.
                </p>
              </div>

              {!isOrgLoaded ? (
                <div className="border border-border rounded-2xl bg-surface p-6 flex flex-col gap-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/[0.08] dark:bg-white/[0.1] shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="w-28 h-4 rounded bg-black/[0.08] dark:bg-white/[0.1]" />
                      <div className="w-40 h-3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
                    </div>
                  </div>
                  <div className="w-full h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.06]" />
                </div>
              ) : !organization ? (
                <div className="space-y-6">
                  <div className="border border-border rounded-2xl bg-surface p-8 text-center space-y-4 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto">
                      <Users size={22} />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-base font-semibold text-foreground">Personal Workspace</h3>
                      <p className="text-[12.5px] text-text-muted leading-relaxed">
                        You are currently in a personal single-user workspace. Convert or switch to an Organization to invite collaborators, manage roles, and share projects.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateOrganization?.() || navigate("/team")}
                      className="px-4 py-2 rounded-xl kriri-primary-btn text-[12.5px] font-medium transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Create Organization</span>
                    </button>
                  </div>

                  <div className="border border-border bg-surface rounded-2xl p-6 sm:p-8 shadow-xs">
                    <WorkspaceGeneralSettings
                      currentWorkspace={currentWorkspace}
                      onWorkspaceUpdated={(updated) => {
                        setCurrentWorkspace(updated);
                        if (updated?.name) {
                          setWorkspaceName(updated.name);
                        }
                      }}
                      isAdminOrOwner={isAdminOrOwner}
                      organization={organization}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full settings-clerk-container">
                  <OrganizationProfile
                    routing="hash"
                    appearance={{
                      elements: {
                        rootBox: "w-full max-w-none shadow-none",
                        cardBox: "w-full max-w-none shadow-none flex flex-col sm:flex-row gap-0 items-stretch",
                        card: "flex-1 min-w-0 w-full shadow-none border border-border bg-surface rounded-2xl overflow-hidden",
                        navbar: "w-full sm:w-[200px] shrink-0 bg-transparent border-none p-0 m-0",
                        navbarButton: "text-text-muted hover:text-foreground",
                        navbarButtonActive: "text-foreground font-medium",
                        pageScrollBox: "p-6 sm:p-8 bg-transparent scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                        scrollBox: "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                        footer: "hidden",
                      },
                    }}
                  >
                    <OrganizationProfile.Page label="general" />
                    <OrganizationProfile.Page label="members" />
                    <OrganizationProfile.Page
                      label="Settings"
                      url="settings"
                      labelIcon={<SlidersHorizontal size={16} />}
                    >
                      <WorkspaceGeneralSettings
                        currentWorkspace={currentWorkspace}
                        onWorkspaceUpdated={(updated) => {
                          setCurrentWorkspace(updated);
                          if (updated?.name) {
                            setWorkspaceName(updated.name);
                          }
                        }}
                        isAdminOrOwner={isAdminOrOwner}
                        organization={organization}
                      />
                    </OrganizationProfile.Page>
                  </OrganizationProfile>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. WORKSPACE: AGENT PERSONALIZATION                                       */}
          {/* ========================================================================= */}
          {activeTab === "agent" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <KririAgentIcon size={22} className="text-[#5e6ad2]" />
                  <span>Agent</span>
                </h1>
                <p className="text-[13px] text-text-muted mt-1">
                  Personalize how Kriri Agent reasons, communicates, and collaborates with your team.
                </p>
              </div>

              <ClerkCard
                title="Agent Configuration"
                description="Configure persona parameters, system instructions, and autonomous capabilities."
                badge={
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online & Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAIAssistantOpen(true)}
                      className="h-8 px-2.5 rounded-lg bg-surface-hover hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground border border-border text-[11.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <KririAgentIcon size={13} />
                      <span>Open Agent</span>
                    </button>
                  </div>
                }
              >
                {/* 1. Communication & Persona */}
                <ClerkSection
                  title="Communication & Persona"
                  description="Control how the agent formats responses, explanations, and action proposals."
                >
                  <ClerkRow
                    title="Response Style"
                    description="Tone and formatting depth for suggestions, summaries, and action plans."
                  >
                    <ClerkSelect
                      value={agentTone}
                      onChange={(e) => {
                        setAgentTone(e.target.value);
                        playUiSound("toggle");
                      }}
                      options={[
                        { value: "concise", label: "Concise & Direct (Linear speed)" },
                        { value: "collaborative", label: "Collaborative & Detailed" },
                        { value: "technical", label: "Technical & Rigorous" },
                      ]}
                      minWidth="min-w-[240px]"
                    />
                  </ClerkRow>
                </ClerkSection>

                {/* 2. Custom Workspace Instructions */}
                <div className="space-y-1">
                  <div className="pt-3 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">
                        Custom Workspace Instructions
                      </h4>
                      <p className="text-[11.5px] text-text-muted mt-0.5 leading-relaxed">
                        Project tech stack, coding standards, naming conventions, and team guidelines.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-text-muted">
                      {agentInstructions.length}/1000
                    </span>
                  </div>

                  <div className="border-t border-b border-border-subtle py-3.5 space-y-3">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={agentInstructions}
                      onChange={(e) => setAgentInstructions(e.target.value)}
                      placeholder="e.g. We use React 19 with Tailwind CSS. Propose concise modular components, adhere to TypeScript strictness, and format PR descriptions with bulleted verification checklists..."
                      className="w-full h-22 p-2.5 rounded-lg bg-surface-hover border border-border text-[12px] text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none transition-colors"
                    />

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-text-muted font-medium mr-1 flex items-center gap-1">
                          <Wand2 size={12} />
                          Quick insert:
                        </span>
                        {[
                          { label: "+ React & Tailwind", text: " Use React functional components with Tailwind CSS utility classes." },
                          { label: "+ Strict TypeScript", text: " Provide type-safe interfaces for all data structures and props." },
                          { label: "+ Bulleted summaries", text: " Format all plans and PR descriptions with punchy bullet points." },
                          { label: "+ Architecture first", text: " Provide high-level system diagrams before writing implementation details." },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              setAgentInstructions((prev) => {
                                const trimmed = prev.trim();
                                return trimmed ? `${trimmed}${chip.text}` : chip.text.trim();
                              });
                              playUiSound("toggle");
                            }}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-foreground transition-colors cursor-pointer"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                      {agentInstructions && (
                        <button
                          type="button"
                          onClick={() => setAgentInstructions("")}
                          className="text-[11px] text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Autonomous Capabilities */}
                <ClerkSection
                  title="Autonomous Capabilities"
                  description="Configure proactive reasoning behaviors and workflow automation triggers."
                >
                  <ClerkRow
                    title="Milestone Decomposition"
                    description="Proactively propose actionable subtasks, issue breakdowns, and estimated story points."
                  >
                    <ClerkSwitch
                      checked={agentAutoSubtasks}
                      onChange={() => {
                        setAgentAutoSubtasks(!agentAutoSubtasks);
                        playUiSound("toggle");
                      }}
                      ariaLabel="Milestone Decomposition"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="System Architecture & Blueprints"
                    description="Generate Mermaid dataflow diagrams, entity-relationship schemas, and module contracts."
                  >
                    <ClerkSwitch
                      checked={agentArchBlueprints}
                      onChange={() => {
                        setAgentArchBlueprints(!agentArchBlueprints);
                        playUiSound("toggle");
                      }}
                      ariaLabel="System Architecture & Blueprints"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Interactive Clarifying Decisions"
                    description="Surface structured multiple-choice decision cards when requests have ambiguous architectural trade-offs."
                  >
                    <ClerkSwitch
                      checked={agentClarifyingDecisions}
                      onChange={() => {
                        setAgentClarifyingDecisions(!agentClarifyingDecisions);
                        playUiSound("toggle");
                      }}
                      ariaLabel="Interactive Clarifying Decisions"
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Risk & Bottleneck Flagging"
                    description="Highlight blocked task dependencies, overdue milestones, and workload hotspots in workspace audits."
                  >
                    <ClerkSwitch
                      checked={agentProactiveRisk}
                      onChange={() => {
                        setAgentProactiveRisk(!agentProactiveRisk);
                        playUiSound("toggle");
                      }}
                      ariaLabel="Risk & Bottleneck Flagging"
                    />
                  </ClerkRow>
                </ClerkSection>

                {/* 4. Reasoning & Context */}
                <ClerkSection
                  title="Reasoning & Context"
                  description="Control model inference depth and long-term conversation continuity."
                >
                  <ClerkRow
                    title="Reasoning Depth"
                    description="Select inference depth for chat, planning, and task generation."
                  >
                    <ClerkSelect
                      value={agentReasoningDepth}
                      onChange={(e) => {
                        setAgentReasoningDepth(e.target.value);
                        playUiSound("toggle");
                      }}
                      options={[
                        { value: "balanced", label: "Balanced (Fast)" },
                        { value: "deep", label: "Deep Reasoning" },
                      ]}
                    />
                  </ClerkRow>

                  <ClerkRow
                    title="Cross-Session Context Memory"
                    description="Retain contextual project decisions and architectural guidelines across separate chat sessions."
                  >
                    <ClerkSwitch
                      checked={agentMemory}
                      onChange={() => {
                        setAgentMemory(!agentMemory);
                        playUiSound("toggle");
                      }}
                      ariaLabel="Cross-Session Context Memory"
                    />
                  </ClerkRow>
                </ClerkSection>

                {/* 5. Telemetry Link */}
                <ClerkSection>
                  <ClerkRow
                    title="Usage & Limits Telemetry"
                    description="Monitor live token consumption, average inference latency, and OpenRouter model routing."
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTab("usage")}
                      className="h-8 px-3 rounded-lg bg-surface-hover hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground border border-border text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Usage</span>
                      <ChevronRight size={13} />
                    </button>
                  </ClerkRow>
                </ClerkSection>
              </ClerkCard>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetAgent}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset to defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAgent}
                    disabled={isSavingAgent}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg kriri-primary-btn text-[13px] font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAgent ? (
                      <span>Saving...</span>
                    ) : agentSavedSuccess ? (
                      <>
                        <Check size={14} />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5b. WORKSPACE: USAGE & LIMITS (Telemetry & Gateway Metrics)               */}
          {/* ========================================================================= */}
          {activeTab === "usage" && isAdminOrOwner && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Usage & Limits
                </h1>
                <p className="text-[13px] text-zinc-500 dark:text-[#8a8f98] mt-1">
                  Monitor live token consumption, model routing, and OpenRouter API metrics.
                </p>
              </div>

              <AISettingsView />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. WORKSPACE & ACCOUNT: DANGER ZONE                                       */}
          {/* ========================================================================= */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Danger Zone
                </h1>
                <p className="text-[13px] text-text-muted mt-1">
                  Irreversible actions for workspace removal and personal account deletion.
                </p>
              </div>

              <ClerkCard
                title="Danger Zone"
                description="Irreversible actions for workspace removal and personal account deletion."
              >
                <ClerkSection>
                  <ClerkRow
                    title="Delete Workspace"
                    description="Permanently destroy this workspace along with all issues, projects, and milestones."
                  >
                    <button
                      type="button"
                      onClick={handleDeleteWorkspaceClick}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-[12.5px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      Delete workspace
                    </button>
                  </ClerkRow>

                  <ClerkRow
                    title="Delete Account"
                    description="Permanently delete your profile, user credentials, and personal workspaces."
                  >
                    <button
                      type="button"
                      onClick={() => setIsDeleteAccountModalOpen(true)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-[12.5px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      Delete account
                    </button>
                  </ClerkRow>
                </ClerkSection>
              </ClerkCard>
            </div>
          )}
            </div>
          </div>
        </main>

        {/* Bottom Agent Bar (outside of main container, transparent with no gray background) */}
        <div
          className="fixed md:static right-3 z-30 md:z-auto bg-white/90 dark:bg-[#18181b]/90 md:bg-transparent md:dark:bg-transparent backdrop-blur-md md:backdrop-blur-none border border-black/10 dark:border-white/10 md:border-0 rounded-full md:rounded-none shadow-md md:shadow-none h-8 md:h-8 px-2 md:px-2 flex items-center justify-end shrink-0 select-none transition-all"
          style={{
            bottom: "max(calc(env(safe-area-inset-bottom, 0px) + 12px), 14px)",
          }}
        >
          <div className="flex items-center gap-0.5 sm:gap-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#e8e8e8] transition-colors text-[13px]">
            <button
              type="button"
              onClick={() => {
                setIsHistoryOpen(false);
                setIsAIAssistantOpen((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-full md:rounded-md transition-colors group ${
                isAIAssistantOpen
                  ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                  : "hover:bg-black/[0.05] dark:hover:bg-white/[0.06] text-zinc-700 dark:text-[#c4c7cc] hover:text-zinc-950 dark:hover:text-white"
              }`}
              title="Open Kriri Agent (⌘J)"
            >
              <KririAgentIcon
                size={17}
                strokeWidth={1.85}
                className="transition-transform group-hover:scale-105"
              />
              <span className="font-medium text-[12.5px] md:text-[13px] tracking-tight">
                Agent
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className={`p-1 md:p-1.5 rounded-full md:rounded-md transition-colors cursor-pointer ${
                isHistoryOpen
                  ? "bg-black/[0.06] dark:bg-white/[0.1] text-zinc-950 dark:text-white"
                  : "text-zinc-500 dark:text-[#8a8f98] hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
              }`}
              title="Chat History"
              aria-label="Chat History"
              aria-expanded={isHistoryOpen}
            >
              <History size={16} strokeWidth={1.85} />
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {isHistoryOpen && (
          <ChatHistoryPopover
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectConversation={(convId) => {
              setSelectedConversationId(convId);
              setIsAIAssistantOpen(true);
            }}
            onNewChat={() => {
              setSelectedConversationId(null);
              setIsAIAssistantOpen(true);
            }}
          />
        )}

        {isAIAssistantOpen && (
          <AIAssistantModal
            isOpen={isAIAssistantOpen}
            onClose={() => {
              setIsAIAssistantOpen(false);
              setSelectedConversationId(null);
            }}
            selectedConversationId={selectedConversationId}
          />
        )}
      </Suspense>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteWorkspace}
        title={`Delete "${workspaceName || organization?.name || "Workspace"}"`}
        message="Are you sure you want to permanently delete this workspace? This will remove all associated projects, tasks, issues, and team data. This action cannot be undone."
        confirmMatchText={workspaceName || organization?.name || "Software Development"}
        confirmText={isDeletingWorkspace ? "Deleting..." : "Delete Workspace"}
        cancelText="Cancel"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
        title="Delete Your Account"
        message="Are you sure you want to delete your entire account? This will permanently delete your user profile, personal workspaces, projects, tasks, and data from the database. This action is irreversible."
        confirmMatchText={userEmail || "delete my account"}
        confirmText={isDeletingAccount ? "Deleting..." : "Delete Account"}
        cancelText="Cancel"
        isDanger={true}
      />

      {/* Leave / Transfer Workspace Modal */}
      {isLeaveWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[var(--surface-elevated,#1a1b1e)] border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.1))] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4.5 border-b border-black/10 dark:border-[#2a2a2a]">
              <h2 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                {isPersonalWorkspace
                  ? "Cannot Leave Personal Workspace"
                  : userRole === "owner"
                  ? `Transfer Ownership of "${organization?.name || workspaceName || "Workspace"}"`
                  : `Leave "${organization?.name || workspaceName || "Workspace"}"`}
              </h2>
              <button
                type="button"
                onClick={() => setIsLeaveWorkspaceModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex flex-col gap-4">
              {isPersonalWorkspace ? (
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  You cannot leave your personal workspace because you are the sole owner. Personal workspaces are permanently bound to your account. If you wish to delete your account entirely, navigate to the Danger Zone.
                </p>
              ) : userRole === "owner" ? (
                <div className="space-y-4">
                  <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                    Notice: You are the <span className="font-semibold text-zinc-900 dark:text-white">Owner & Administrator</span> of{" "}
                    <span className="font-semibold text-zinc-900 dark:text-white">"{organization?.name || workspaceName || "Software Development"}"</span>.
                    You cannot leave this workspace without transferring ownership. Please select a team member to take over ownership before leaving.
                  </p>

                  {eligibleNewOwners.length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 block">
                        Select new workspace owner:
                      </label>
                      <div className="relative">
                        <select
                          value={selectedNewOwnerId}
                          onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-[13px] text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--kriri-accent-color,#5e6ad2)] appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-white dark:bg-[#1a1b1e] text-zinc-400">
                            -- Choose a team member --
                          </option>
                          {eligibleNewOwners.map((m) => (
                            <option
                              key={m.id}
                              value={m.id}
                              className="bg-white dark:bg-[#1a1b1e] text-zinc-900 dark:text-white"
                            >
                              {m.name || m.email} ({m.role || "Member"})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
                        />
                      </div>
                      <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                        The selected member will be granted full Owner & Administrator privileges over this workspace.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12.5px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      There are currently no other members in this workspace to transfer ownership to. To leave, invite a colleague from the Members directory first, or permanently delete the workspace from the Danger Zone.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  {leaveModalContent.message}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                {isPersonalWorkspace ? (
                  <Button
                    variant="primary"
                    onClick={() => setIsLeaveWorkspaceModalOpen(false)}
                    className="text-[13px] h-9"
                  >
                    Understood
                  </Button>
                ) : userRole === "owner" ? (
                  eligibleNewOwners.length > 0 ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsLeaveWorkspaceModalOpen(false);
                          setSelectedNewOwnerId("");
                        }}
                        className="text-[13px] h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!selectedNewOwnerId || isLeavingWorkspace}
                        onClick={handleTransferAndLeaveWorkspace}
                        className={`text-[13px] h-9 transition-all ${
                          !selectedNewOwnerId
                            ? "opacity-50 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                            : "bg-[#ef4444] text-white hover:bg-[#dc2626] border-none shadow-sm font-medium"
                        }`}
                      >
                        {isLeavingWorkspace
                          ? "Transferring & Leaving..."
                          : selectedNewOwnerId
                          ? "Transfer Ownership & Leave"
                          : "Select Member to Transfer"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setIsLeaveWorkspaceModalOpen(false)}
                        className="text-[13px] h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsLeaveWorkspaceModalOpen(false);
                          navigate("/team");
                        }}
                        className="text-[13px] h-9"
                      >
                        Invite Members
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setIsLeaveWorkspaceModalOpen(false);
                          handleSelectTab("danger");
                        }}
                        className="text-[13px] h-9 bg-rose-600 hover:bg-rose-700 text-white border-none font-medium"
                      >
                        Delete Workspace
                      </Button>
                    </>
                  )
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setIsLeaveWorkspaceModalOpen(false)}
                      className="text-[13px] h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      disabled={isLeavingWorkspace}
                      onClick={handleConfirmLeaveWorkspace}
                      className="text-[13px] h-9 bg-[#ef4444] text-white hover:bg-[#dc2626] border-none shadow-sm font-medium"
                    >
                      {isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Disconnect Account Confirm Modal */}
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => {
          setIsDisconnectModalOpen(false);
          setAccountToDisconnect(null);
        }}
        onConfirm={handleConfirmDisconnectAccount}
        title={`Disconnect ${accountToDisconnect?.provider ? (accountToDisconnect.provider.charAt(0).toUpperCase() + accountToDisconnect.provider.slice(1)) : "Connected"} Account`}
        message={`Are you sure you want to disconnect ${accountToDisconnect?.emailAddress || accountToDisconnect?.username || "this provider"} from your Kriri account? You won't be able to sign in using this method unless you reconnect it.`}
        confirmText={isDisconnecting ? "Disconnecting..." : "Disconnect Account"}
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
