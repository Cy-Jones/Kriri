/**
 * Central User Preferences Engine for Kriri
 * Provides reactive getters, formatters, and DOM synchronizers for:
 * - Accent Color (Indigo, Blue, Emerald, Violet, Amber, Rose, Zinc)
 * - Density (Comfortable vs Compact)
 * - Display Format (Full names vs Usernames)
 * - First day of week (Monday vs Sunday)
 * - Time format (12h vs 24h)
 * - Date format (Relative vs Absolute)
 * - Sound effects (Enabled vs Disabled)
 * - Fluid animations (Enabled vs Disabled)
 */

import { useState, useEffect } from "react";

export const ACCENT_PRESETS = [
  { id: "indigo", name: "Linear Indigo", hex: "#5e6ad2", hover: "#4f5ac0", rgb: "94, 106, 210" },
  { id: "blue", name: "Electric Blue", hex: "#3b82f6", hover: "#2563eb", rgb: "59, 130, 246" },
  { id: "emerald", name: "Emerald Mint", hex: "#10b981", hover: "#059669", rgb: "16, 185, 129" },
  { id: "violet", name: "Royal Violet", hex: "#8b5cf6", hover: "#7c3aed", rgb: "139, 92, 246" },
  { id: "amber", name: "Sunset Amber", hex: "#f59e0b", hover: "#d97706", rgb: "245, 158, 11" },
  { id: "rose", name: "Crimson Rose", hex: "#f43f5e", hover: "#e11d48", rgb: "244, 63, 94" },
  { id: "zinc", name: "Monochrome Zinc", hex: "#71717a", hover: "#52525b", rgb: "113, 113, 122" },
];

export function hexToRgb(hex) {
  let c = (hex || "#5e6ad2").replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return "94, 106, 210";
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export function hexToRgbObj(rawHex) {
  let c = (rawHex || "").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return null;
  const num = parseInt(c, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export const NAMED_COLOR_PALETTE = [
  // Presets & Neutrals
  { name: "Linear Indigo", hex: "#5e6ad2" },
  { name: "Electric Blue", hex: "#3b82f6" },
  { name: "Emerald Mint", hex: "#10b981" },
  { name: "Royal Violet", hex: "#8b5cf6" },
  { name: "Sunset Amber", hex: "#f59e0b" },
  { name: "Crimson Rose", hex: "#f43f5e" },
  { name: "Monochrome Zinc", hex: "#71717a" },
  { name: "Charcoal", hex: "#27272a" },
  { name: "Slate Gray", hex: "#64748b" },
  { name: "Silver", hex: "#cbd5e1" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#ffffff" },

  // Purples & Violets
  { name: "Amethyst Violet", hex: "#7f49d0" },
  { name: "Deep Violet", hex: "#7c3aed" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Lavender", hex: "#c084fc" },
  { name: "Plum", hex: "#581c87" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Deep Indigo", hex: "#4338ca" },

  // Blues & Cyans
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Ocean Blue", hex: "#0284c7" },
  { name: "Cobalt Blue", hex: "#1d4ed8" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Ice Blue", hex: "#bae6fd" },

  // Teals & Greens
  { name: "Teal", hex: "#14b8a6" },
  { name: "Aquamarine", hex: "#2dd4bf" },
  { name: "Turquoise", hex: "#0d9488" },
  { name: "Jade Green", hex: "#059669" },
  { name: "Mint Green", hex: "#34d399" },
  { name: "Forest Green", hex: "#15803d" },
  { name: "Lime Green", hex: "#84cc16" },
  { name: "Olive", hex: "#65a30d" },

  // Yellows, Ambers & Oranges
  { name: "Gold", hex: "#eab308" },
  { name: "Lemon Yellow", hex: "#facc15" },
  { name: "Amber", hex: "#d97706" },
  { name: "Orange", hex: "#f97316" },
  { name: "Tangerine", hex: "#ea580c" },
  { name: "Peach", hex: "#fdba74" },
  { name: "Terracotta", hex: "#c2410c" },

  // Pinks & Reds
  { name: "Hot Pink", hex: "#ec4899" },
  { name: "Rose Pink", hex: "#f472b6" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Magenta", hex: "#c026d3" },
  { name: "Berry", hex: "#9d174d" },
  { name: "Ruby Red", hex: "#e11d48" },
  { name: "Scarlet Red", hex: "#ef4444" },
  { name: "Coral", hex: "#fb7185" },
];

export function getColorNameFromHex(rawHex) {
  if (!rawHex) return "Custom Color";
  let hex = rawHex.trim().toLowerCase();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  // Exact match first
  const exact = NAMED_COLOR_PALETTE.find((c) => c.hex.toLowerCase() === hex);
  if (exact) return exact.name;

  const rgb = hexToRgbObj(hex);
  if (!rgb) return "Custom Color";

  // Perceptually weighted Euclidean distance
  let closestName = "Custom Color";
  let minDistance = Infinity;

  for (const item of NAMED_COLOR_PALETTE) {
    const itemRgb = hexToRgbObj(item.hex);
    if (!itemRgb) continue;
    const dR = rgb.r - itemRgb.r;
    const dG = rgb.g - itemRgb.g;
    const dB = rgb.b - itemRgb.b;
    const dist = 2 * dR * dR + 4 * dG * dG + 3 * dB * dB;
    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

export function getPreferences() {
  if (typeof window === "undefined") {
    return {
      accentColor: "indigo",
      customAccentHex: "#5e6ad2",
      density: "comfortable",
      nameFormat: "full",
      firstDayOfWeek: "monday",
      timeFormat: "12h",
      dateFormat: "relative",
      calendarDateOrder: "dd/mm/yyyy",
      soundEffects: true,
      fluidAnimations: true,
      defaultView: "dashboard",
      shortcutScheme: "linear",
    };
  }

  return {
    accentColor: localStorage.getItem("kriri-accent-color") || "indigo",
    customAccentHex: localStorage.getItem("kriri-custom-accent-hex") || "#5e6ad2",
    density: localStorage.getItem("kriri-density") || "comfortable",
    nameFormat: localStorage.getItem("kriri-name-format") || "full",
    firstDayOfWeek: localStorage.getItem("kriri-first-day") || "monday",
    timeFormat: localStorage.getItem("kriri-time-format") || "12h",
    dateFormat: localStorage.getItem("kriri-date-format") || "relative",
    calendarDateOrder: localStorage.getItem("kriri-calendar-date-order") || "dd/mm/yyyy",
    soundEffects: localStorage.getItem("kriri-sound-effects") !== "false",
    fluidAnimations: localStorage.getItem("kriri-animations") !== "false",
    defaultView: localStorage.getItem("kriri-default-view") || "dashboard",
    shortcutScheme: localStorage.getItem("kriri-shortcut-scheme") || "linear",
  };
}

export function getLuminance(hex) {
  let c = (hex || "#000000").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return 0;
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function isColorDark(hex) {
  return getLuminance(hex) < 0.08;
}

/**
 * Apply CSS variables and dataset attributes to document.documentElement
 */
export function applyPreferencesToDom() {
  if (typeof document === "undefined") return;

  const prefs = getPreferences();
  const root = document.documentElement;

  // If in custom theme mode, applyCustomThemeToRoot manages accent tokens
  const activeTheme = localStorage.getItem("arc-theme") || "dark";
  if (activeTheme !== "custom") {
    // 1. Accent color
    if (prefs.accentColor === "custom") {
      const customHex = prefs.customAccentHex || "#5e6ad2";
      const rgb = hexToRgb(customHex);
      const isDark = isColorDark(customHex);
      const fg = isDark ? "#ffffff" : "#09090b";
      root.setAttribute("data-accent", "custom");
      root.style.setProperty("--kriri-accent", customHex);
      root.style.setProperty("--kriri-accent-hover", customHex);
      root.style.setProperty("--kriri-accent-rgb", rgb);
      root.style.setProperty("--ring", customHex);
      root.style.setProperty("--accent", customHex);
      root.style.setProperty("--accent-foreground", fg);
      root.style.setProperty("--primary", customHex);
      root.style.setProperty("--primary-foreground", fg);
      root.style.setProperty("--primary-border", isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.14)");
    } else {
      const accent = ACCENT_PRESETS.find((c) => c.id === prefs.accentColor) || ACCENT_PRESETS[0];
      const isDark = isColorDark(accent.hex);
      const fg = isDark ? "#ffffff" : "#09090b";
      root.setAttribute("data-accent", accent.id);
      root.style.setProperty("--kriri-accent", accent.hex);
      root.style.setProperty("--kriri-accent-hover", accent.hover);
      root.style.setProperty("--kriri-accent-rgb", accent.rgb);
      root.style.setProperty("--ring", accent.hex);
      root.style.setProperty("--accent", accent.hex);
      root.style.setProperty("--accent-foreground", fg);
      root.style.setProperty("--primary", accent.hex);
      root.style.setProperty("--primary-foreground", fg);
      root.style.setProperty("--primary-border", isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.14)");
    }
  }

  // 2. Density
  root.setAttribute("data-density", prefs.density);

  // 3. Fluid animations
  root.setAttribute("data-animations", String(prefs.fluidAnimations));
  if (!prefs.fluidAnimations) {
    root.classList.add("reduce-motion-override");
  } else {
    root.classList.remove("reduce-motion-override");
  }

  // 4. Enhanced focus
  const enhancedFocus = localStorage.getItem("kriri-enhanced-focus") === "true";
  if (enhancedFocus) {
    root.classList.add("enhanced-focus");
  } else {
    root.classList.remove("enhanced-focus");
  }

  // 5. Interface scaling
  const interfaceScale = localStorage.getItem("kriri-interface-scale") || "100%";
  if (interfaceScale === "90%") {
    root.style.fontSize = "14px";
  } else if (interfaceScale === "110%") {
    root.style.fontSize = "17px";
  } else {
    root.style.fontSize = "";
  }

  // 6. Dispatch event for reactive components
  window.dispatchEvent(new CustomEvent("kriri-preferences-changed", { detail: prefs }));
}

/**
 * React Hook for consuming preferences reactively
 */
export function usePreferences() {
  const [prefs, setPrefs] = useState(getPreferences);

  useEffect(() => {
    const handleUpdate = () => {
      setPrefs(getPreferences());
    };

    window.addEventListener("kriri-preferences-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("kriri-preferences-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const setPreference = (key, value) => {
    const storageKeys = {
      accentColor: "kriri-accent-color",
      density: "kriri-density",
      nameFormat: "kriri-name-format",
      firstDayOfWeek: "kriri-first-day",
      timeFormat: "kriri-time-format",
      dateFormat: "kriri-date-format",
      soundEffects: "kriri-sound-effects",
      fluidAnimations: "kriri-animations",
      defaultView: "kriri-default-view",
      shortcutScheme: "kriri-shortcut-scheme",
    };

    const sKey = storageKeys[key];
    if (sKey) {
      localStorage.setItem(sKey, String(value));
      applyPreferencesToDom();
      setPrefs(getPreferences());
    }
  };

  return { ...prefs, setPreference };
}

/**
 * Format member name according to User Preferences:
 * - 'full': "Cyrus Jones"
 * - 'username': "@cyrus" or "@cyrusjones"
 */
export function formatMemberDisplayName(nameOrUser, formatOverride) {
  if (!nameOrUser) return "Unassigned";

  const rawName =
    typeof nameOrUser === "object"
      ? nameOrUser.fullName ||
        nameOrUser.name ||
        `${nameOrUser.firstName || ""} ${nameOrUser.lastName || ""}`.trim() ||
        nameOrUser.primaryEmailAddress?.emailAddress ||
        nameOrUser.email ||
        "Member"
      : String(nameOrUser).trim();

  if (!rawName) return "Unassigned";

  const format =
    formatOverride ||
    (typeof window !== "undefined"
      ? localStorage.getItem("kriri-name-format") || "full"
      : "full");

  if (format === "username") {
    // Check if it's already an email or handle
    if (rawName.includes("@")) {
      const handle = rawName.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
      return `@${handle}`;
    }
    // Clean name to handle: "Cyrus Jones" -> "@cyrusjones"
    const handle = rawName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");
    return handle ? `@${handle}` : `@user`;
  }

  return rawName;
}

/**
 * Format dates according to User Preferences:
 * - 'relative': "2h ago", "Today", "Yesterday", "in 3 days"
 * - 'absolute': formatted by calendar order ("DD/MM/YYYY", "MM/DD/YYYY", or "YYYY-MM-DD")
 */
export function formatKririDate(dateInput, formatOverride, calendarOrderOverride) {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const format =
    formatOverride ||
    (typeof window !== "undefined"
      ? localStorage.getItem("kriri-date-format") || "relative"
      : "relative");

  const calendarOrder =
    calendarOrderOverride ||
    (typeof window !== "undefined"
      ? localStorage.getItem("kriri-calendar-date-order") || "dd/mm/yyyy"
      : "dd/mm/yyyy");

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const formatCalendar = () => {
    if (calendarOrder === "mm/dd/yyyy") {
      return `${month}/${day}/${year}`;
    }
    if (calendarOrder === "yyyy-mm-dd") {
      return `${year}-${month}-${day}`;
    }
    return `${day}/${month}/${year}`;
  };

  if (format === "absolute") {
    return formatCalendar();
  }

  // Relative mode
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Same calendar day check
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return "Today";
  }

  // Yesterday / Tomorrow
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return "Tomorrow";
  }

  // Future
  if (diffDays > 1) {
    if (diffDays <= 6) return `in ${diffDays}d`;
    if (diffDays <= 27) return `in ${Math.round(diffDays / 7)}w`;
    if (diffDays <= 345) return `in ${Math.round(diffDays / 30)}mo`;
    return `in ${Math.max(1, Math.round(diffDays / 365))}y`;
  }

  // Past
  if (diffDays < -1) {
    const absDays = Math.abs(diffDays);
    if (absDays <= 6) return `${absDays}d ago`;
    if (absDays <= 27) return `${Math.round(absDays / 7)}w ago`;
    if (absDays <= 345) return `${Math.round(absDays / 30)}mo ago`;
    return `${Math.max(1, Math.round(absDays / 365))}y ago`;
  }

  // Fallback to calendar date
  return formatCalendar();
}

/**
 * Format timestamps according to User Preferences:
 * - '12h': "1:30 PM"
 * - '24h': "13:30"
 */
export function formatKririTime(dateInput, formatOverride) {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const format =
    formatOverride ||
    (typeof window !== "undefined"
      ? localStorage.getItem("kriri-time-format") || "12h"
      : "12h");

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
  });
}

/**
 * Get first day of week setting: 'monday' or 'sunday'
 */
export function getFirstDayOfWeek() {
  if (typeof window === "undefined") return "monday";
  return localStorage.getItem("kriri-first-day") || "monday";
}

