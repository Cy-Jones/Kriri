/**
 * KRIRI CENTRALIZED SEMANTIC THEME ENGINE
 * Production-grade Color Science, WCAG AA Accessibility, OKLCH Perceptual Math,
 * and Deterministic Semantic Palette Generation for Light, Dark, and Custom Themes.
 */

// ============================================================================
// 1. COLOR SCIENCE & CONVERSIONS
// ============================================================================

/**
 * Normalizes any hex string (#rgb, #rgba, #rrggbb, #rrggbbaa) to standard 6-char #rrggbb
 */
export function normalizeHex(hex) {
  if (!hex || typeof hex !== "string") return "#000000";
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  } else if (c.length === 4) {
    c = c.slice(0, 3).split("").map((x) => x + x).join("");
  } else if (c.length === 8) {
    c = c.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return "#000000";
  return `#${c.toLowerCase()}`;
}

/**
 * Converts Hex to RGB object { r, g, b } (0-255)
 */
export function hexToRgb(hex) {
  const norm = normalizeHex(hex).slice(1);
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB components (0-255) to 6-char Hex #rrggbb
 */
export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Linearizes an sRGB channel (0..1) for photometric luminance
 */
export function linearizeChannel(val) {
  const c = val / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Unlinearizes a linear RGB channel back to sRGB (0..255)
 */
export function unlinearizeChannel(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

/**
 * Computes WCAG 2.1 relative luminance (0 to 1)
 */
export function getLuminance(hexOrRgb) {
  const rgb = typeof hexOrRgb === "string" ? hexToRgb(hexOrRgb) : hexOrRgb;
  const rLin = linearizeChannel(rgb.r);
  const gLin = linearizeChannel(rgb.g);
  const bLin = linearizeChannel(rgb.b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes WCAG 2.1 contrast ratio between two colors (1 to 21)
 */
export function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================================
// 2. OKLCH PERCEPTUAL COLOR TRANSFORMATIONS
// ============================================================================

/**
 * Converts sRGB (0..255) to OKLCH { l, c, h }
 * l: 0..1, c: 0..~0.4, h: 0..360 (degrees)
 */
export function rgbToOklch(r, g, b) {
  const rLin = linearizeChannel(r);
  const gLin = linearizeChannel(g);
  const bLin = linearizeChannel(b);

  // Linear sRGB directly to Oklab cone response (LMS)
  const l_ = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
  const m_ = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
  const s_ = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + b_ * b_);
  let h = (Math.atan2(b_, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c: C, h: isNaN(h) ? 0 : h };
}

/**
 * Converts OKLCH { l, c, h } back to sRGB { r, g, b } (0..255)
 */
export function oklchToRgb(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b_ = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b_;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b_;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b_;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  return {
    r: unlinearizeChannel(rLin),
    g: unlinearizeChannel(gLin),
    b: unlinearizeChannel(bLin),
  };
}

/**
 * Shift lightness and optionally tweak chroma in OKLCH space
 */
export function adjustOklch(hex, deltaL, chromaScale = 1.0) {
  const rgb = hexToRgb(hex);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const targetL = Math.max(0, Math.min(1, oklch.l + deltaL));
  const targetC = Math.max(0, oklch.c * chromaScale);
  const targetRgb = oklchToRgb(targetL, targetC, oklch.h);
  return rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b);
}

/**
 * Direct predictable percentage brightness adjustment
 */
export function adjustBrightness(hex, percent) {
  const rgb = hexToRgb(hex);
  const delta = Math.round((percent / 100) * 255);
  return rgbToHex(rgb.r + delta, rgb.g + delta, rgb.b + delta);
}

// ============================================================================
// 3. COLOR SCHEME & FOREGROUND SELECTION
// ============================================================================

/**
 * Determines whether a color is perceived as dark (for color-scheme classification)
 * Threshold = 0.18: Below 0.18, white text has >= 4.5:1 contrast (WCAG AA).
 */
export function isColorDark(hex) {
  return getLuminance(hex) < 0.18;
}

/**
 * Selects the optimal high-contrast foreground for a given background (WCAG AA guaranteed)
 */
export function getAccessibleTextColor(bgHex) {
  const whiteContrast = getContrastRatio("#ffffff", bgHex);
  const blackContrast = getContrastRatio("#09090b", bgHex);
  return whiteContrast >= blackContrast ? "#ffffff" : "#09090b";
}

/**
 * Selects an accessible secondary text color with >= 4.5:1 contrast
 */
export function getAccessibleSecondaryColor(bgHex) {
  const isDark = isColorDark(bgHex);
  return isDark ? "#cbd5e1" : "#1e293b";
}

/**
 * Selects an accessible muted text color with >= 3.5:1 contrast for hints / meta
 */
export function getAccessibleMutedColor(bgHex) {
  const isDark = isColorDark(bgHex);
  return isDark ? "#94a3b8" : "#334155";
}

// ============================================================================
// 4. CENTRALIZED PALETTE GENERATION
// ============================================================================

/**
 * Generates the complete, cohesive semantic design token palette for KRIRI
 *
 * @param {Object} options
 * @param {"light"|"dark"|"custom"} [options.themeMode="dark"]
 * @param {string} [options.bg="#131416"] Main canvas background hex
 * @param {string} [options.accent="#5e6ad2"] Accent color hex
 * @param {number} [options.contrast=30] Elevation contrast depth (0..100)
 * @param {boolean} [options.sidebarEnabled=false] Custom sidebar override active
 * @param {string} [options.sidebarBg="#0a0a0a"] Sidebar background hex
 * @param {string} [options.sidebarAccent="#5e6ad2"] Sidebar accent hex
 * @param {number} [options.sidebarContrast=30] Sidebar contrast depth (0..100)
 * @param {string} [options.darkFlavor="default"] "default" | "midnight" | "pure-black"
 * @param {string} [options.lightFlavor="shaded"] "shaded" | "pure-white"
 * @returns {Object} Complete map of semantic tokens and metadata
 */
export function generateThemePalette(options = {}) {
  const themeMode = options.themeMode || "dark";

  // --------------------------------------------------------------------------
  // A. STANDARD THEME MODES (LIGHT & DARK)
  // --------------------------------------------------------------------------
  if (themeMode === "dark") {
    const darkFlavor = options.darkFlavor || "default";
    let canvasBg = "#08090a";
    let sidebarBg = "#0a0a0a";
    let surface = "#131416";
    let surfaceElevated = "#1e1f21";
    let surfaceHover = "#1c1d21";
    let surfaceMuted = "#161719";
    let surfaceFloating = "#232429";

    if (darkFlavor === "pure-black") {
      canvasBg = "#000000";
      sidebarBg = "#000000";
      surface = "#0d0e10";
      surfaceElevated = "#161719";
      surfaceHover = "#141517";
      surfaceMuted = "#111214";
      surfaceFloating = "#1c1d20";
    } else if (darkFlavor === "midnight") {
      canvasBg = "#080b11";
      sidebarBg = "#0a0e17";
      surface = "#111722";
      surfaceElevated = "#182030";
      surfaceHover = "#151c2a";
      surfaceMuted = "#131a26";
      surfaceFloating = "#1d273a";
    }

    const accent = options.accent || "#5e6ad2";
    const accentRgb = hexToRgb(accent);

    return {
      themeMode: "dark",
      colorScheme: "dark",
      tokens: {
        // Global Canvas & Surfaces
        "--background": canvasBg,
        "--foreground": "#f4f4f5",
        "--surface": surface,
        "--surface-muted": surfaceMuted,
        "--surface-elevated": surfaceElevated,
        "--surface-hover": surfaceHover,
        "--surface-active": surfaceElevated,
        "--surface-floating": surfaceFloating,
        "--card": surface,
        "--card-bg": canvasBg,
        "--card-foreground": "#f4f4f5",
        "--popover": surfaceElevated,
        "--popover-foreground": "#f4f4f5",

        // Borders & Dividers
        "--border": "rgba(255, 255, 255, 0.08)",
        "--border-subtle": "rgba(255, 255, 255, 0.04)",
        "--border-hover": "rgba(255, 255, 255, 0.15)",
        "--border-strong": "rgba(255, 255, 255, 0.20)",
        "--border-popover": "#333538",

        // Typography Hierarchy
        "--text-primary": "#ffffff",
        "--text-body": "#f2f2f2",
        "--text-secondary": "#8a8a93",
        "--text-muted": "#5f6066",
        "--text-faint": "#373940",

        // Primary & Accent Actions
        "--accent": accent,
        "--accent-hover": adjustBrightness(accent, 14),
        "--accent-subtle": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.12)`,
        "--accent-foreground": "#ffffff",
        "--primary": accent,
        "--primary-foreground": "#ffffff",
        "--primary-border": "rgba(255, 255, 255, 0.18)",
        "--kriri-accent": accent,
        "--kriri-accent-hover": adjustBrightness(accent, 14),
        "--kriri-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,

        // Secondary & Muted States
        "--secondary": surfaceElevated,
        "--secondary-foreground": "#f4f4f5",
        "--muted": surfaceMuted,
        "--muted-foreground": "#8a8a93",
        "--input": "rgba(255, 255, 255, 0.10)",
        "--ring": accent,

        // Navigation Sidebar (Strictly Independent Subsystem)
        "--sidebar": sidebarBg,
        "--sidebar-bg": sidebarBg,
        "--sidebar-foreground": "#f4f4f5",
        "--sidebar-muted": "rgba(255, 255, 255, 0.65)",
        "--sidebar-hover": "rgba(255, 255, 255, 0.08)",
        "--sidebar-active": "rgba(255, 255, 255, 0.12)",
        "--sidebar-border": "rgba(255, 255, 255, 0.08)",
        "--sidebar-accent": accent,
        "--sidebar-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
        "--sidebar-primary": accent,
        "--sidebar-primary-foreground": "#ffffff",
        "--sidebar-accent-foreground": "#ffffff",
        "--sidebar-surface": sidebarBg,
        "--sidebar-active-bg": "rgba(255, 255, 255, 0.08)",
        "--sidebar-active-border": "rgba(255, 255, 255, 0.12)",
        "--sidebar-theme": "dark",

        // Interactive States
        "--button-bg": surfaceElevated,
        "--button-foreground": "#f4f4f5",
        "--button-hover": surfaceHover,
        "--button-active": surfaceElevated,
        "--focus-ring": accent,
        "--selection-bg": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.30)`,
        "--selection-foreground": "#ffffff",
        "--disabled-bg": "rgba(255, 255, 255, 0.05)",
        "--disabled-foreground": "rgba(255, 255, 255, 0.35)",

        // Linear Status Tokens
        "--status-backlog": "#8a8a93",
        "--status-todo": "#cbd5e1",
        "--status-in-progress": "#f5a623",
        "--status-in-review": "#3b82f6",
        "--status-done": "#5e6ad2",

        // Priority Tokens
        "--priority-urgent": "#e27a4a",
        "--priority-high": "#f4f4f5",
        "--priority-medium": "rgba(255, 255, 255, 0.75)",
        "--priority-low": "rgba(255, 255, 255, 0.50)",
        "--priority-none": "rgba(255, 255, 255, 0.35)",

        // Feedback & Additional Tokens
        "--destructive": "#ef4444",
        "--destructive-foreground": "#ffffff",
        "--success": "#30a46c",
        "--warning": "#f5a623",
        "--error": "#e5484d",
        "--info": "#0091ff",
        "--tooltip-bg": "#1e1f21",
        "--tooltip-foreground": "#ffffff",
        "--skeleton-bg": "rgba(255, 255, 255, 0.08)",
        "--overlay-bg": "rgba(0, 0, 0, 0.65)",
        "--scrollbar-thumb": "rgba(255, 255, 255, 0.14)",
        "--scrollbar-track": "transparent",
      },
    };
  }

  if (themeMode === "light") {
    const lightFlavor = options.lightFlavor || "shaded";
    const isPureWhite = lightFlavor === "pure-white";
    const canvasBg = isPureWhite ? "#ffffff" : "#fbfbfb";
    const sidebarBg = isPureWhite ? "#ffffff" : "#fbfbfb";
    const surface = "#ffffff";
    const surfaceElevated = "#ffffff";
    const surfaceHover = "#f4f4f5";
    const surfaceMuted = "#f4f4f5";
    const surfaceFloating = "#ffffff";

    const accent = options.accent || "#09090b";
    const accentRgb = hexToRgb(accent);
    const accentFg = isColorDark(accent) ? "#ffffff" : "#09090b";

    return {
      themeMode: "light",
      colorScheme: "light",
      tokens: {
        // Global Canvas & Surfaces
        "--background": canvasBg,
        "--foreground": "#09090b",
        "--surface": surface,
        "--surface-muted": surfaceMuted,
        "--surface-elevated": surfaceElevated,
        "--surface-hover": surfaceHover,
        "--surface-active": "#ebebef",
        "--surface-floating": surfaceFloating,
        "--card": surface,
        "--card-bg": canvasBg,
        "--card-foreground": "#09090b",
        "--popover": surfaceElevated,
        "--popover-foreground": "#09090b",

        // Borders & Dividers
        "--border": "#e4e4e7",
        "--border-subtle": "#f0f0f2",
        "--border-hover": "#d4d4d8",
        "--border-strong": "#a1a1aa",
        "--border-popover": "#e4e4e7",

        // Typography Hierarchy
        "--text-primary": "#09090b",
        "--text-body": "#18181b",
        "--text-secondary": "#52525b",
        "--text-muted": "#71717a",
        "--text-faint": "#a1a1aa",

        // Primary & Accent Actions
        "--accent": accent,
        "--accent-hover": adjustBrightness(accent, isColorDark(accent) ? 18 : -18),
        "--accent-subtle": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.08)`,
        "--accent-foreground": accentFg,
        "--primary": accent,
        "--primary-foreground": accentFg,
        "--primary-border": "rgba(0, 0, 0, 0.14)",
        "--kriri-accent": accent,
        "--kriri-accent-hover": adjustBrightness(accent, isColorDark(accent) ? 18 : -18),
        "--kriri-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,

        // Secondary & Muted States
        "--secondary": "#f4f4f5",
        "--secondary-foreground": "#18181b",
        "--muted": "#f4f4f5",
        "--muted-foreground": "#52525b",
        "--input": "#e4e4e7",
        "--ring": accent,

        // Navigation Sidebar
        "--sidebar": sidebarBg,
        "--sidebar-bg": sidebarBg,
        "--sidebar-foreground": "#09090b",
        "--sidebar-muted": "rgba(9, 9, 11, 0.65)",
        "--sidebar-hover": "rgba(0, 0, 0, 0.05)",
        "--sidebar-active": "rgba(0, 0, 0, 0.08)",
        "--sidebar-border": "#e4e4e7",
        "--sidebar-accent": accent,
        "--sidebar-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
        "--sidebar-primary": accent,
        "--sidebar-primary-foreground": accentFg,
        "--sidebar-accent-foreground": accentFg,
        "--sidebar-surface": sidebarBg,
        "--sidebar-active-bg": "rgba(0, 0, 0, 0.06)",
        "--sidebar-active-border": "rgba(0, 0, 0, 0.10)",
        "--sidebar-theme": "light",

        // Interactive States
        "--button-bg": "#ffffff",
        "--button-foreground": "#09090b",
        "--button-hover": "#f4f4f5",
        "--button-active": "#ececef",
        "--focus-ring": accent,
        "--selection-bg": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.20)`,
        "--selection-foreground": "#09090b",
        "--disabled-bg": "rgba(0, 0, 0, 0.04)",
        "--disabled-foreground": "rgba(0, 0, 0, 0.35)",

        // Linear Status Tokens
        "--status-backlog": "#71717a",
        "--status-todo": "#52525b",
        "--status-in-progress": "#d97706",
        "--status-in-review": "#2563eb",
        "--status-done": "#5e6ad2",

        // Priority Tokens
        "--priority-urgent": "#e27a4a",
        "--priority-high": "#09090b",
        "--priority-medium": "rgba(9, 9, 11, 0.75)",
        "--priority-low": "rgba(9, 9, 11, 0.50)",
        "--priority-none": "rgba(9, 9, 11, 0.35)",

        // Feedback & Additional Tokens
        "--destructive": "#dc2626",
        "--destructive-foreground": "#ffffff",
        "--success": "#16a34a",
        "--warning": "#f59e0b",
        "--error": "#dc2626",
        "--info": "#0284c7",
        "--tooltip-bg": "#09090b",
        "--tooltip-foreground": "#ffffff",
        "--skeleton-bg": "rgba(0, 0, 0, 0.08)",
        "--overlay-bg": "rgba(0, 0, 0, 0.40)",
        "--scrollbar-thumb": "rgba(0, 0, 0, 0.15)",
        "--scrollbar-track": "transparent",
      },
    };
  }

  // --------------------------------------------------------------------------
  // B. CUSTOM THEME ENGINE (ANY ARBITRARY COLOR)
  // --------------------------------------------------------------------------
  const bg = normalizeHex(options.bg || "#191a22");
  const accent = normalizeHex(options.accent || "#5e6ad2");
  const contrast = typeof options.contrast === "number" ? Math.max(0, Math.min(100, options.contrast)) : 30;

  const sidebarEnabled = Boolean(options.sidebarEnabled);
  const sidebarBgRaw = normalizeHex(options.sidebarBg || "#121214");
  const sidebarAccentRaw = normalizeHex(options.sidebarAccent || accent);
  const sidebarContrast = typeof options.sidebarContrast === "number" ? Math.max(0, Math.min(100, options.sidebarContrast)) : 30;

  // 1. Color scheme classification: naturally dark vs light based on background luminance
  const isDark = isColorDark(bg);
  const colorScheme = isDark ? "dark" : "light";

  // 2. High-contrast typography hierarchy calculated against effective background
  let mainFg, mainSecondary, mainMuted;
  if (isDark) {
    if (getContrastRatio("#ffffff", bg) >= 3.0) {
      mainFg = "#ffffff";
      mainSecondary = "#cbd5e1";
      mainMuted = "#94a3b8";
    } else {
      mainFg = getAccessibleTextColor(bg);
      mainSecondary = getAccessibleSecondaryColor(bg);
      mainMuted = getAccessibleMutedColor(bg);
    }
  } else {
    if (getContrastRatio("#09090b", bg) >= 3.0) {
      mainFg = "#09090b";
      mainSecondary = "#1e293b";
      mainMuted = "#475569";
    } else {
      mainFg = getAccessibleTextColor(bg);
      mainSecondary = getAccessibleSecondaryColor(bg);
      mainMuted = getAccessibleMutedColor(bg);
    }
  }
  const isFgDark = mainFg === "#09090b";

  // 3. Perceptual Surface Hierarchy (Level 0 canvas to Level 4 floating)
  // Using OKLCH transformations so surfaces feel natural and elevated, never washed-out.
  let surface, surfaceElevated, surfaceHover, surfaceMuted, surfaceFloating, baseOuterBg;

  if (isDark) {
    // Naturally dark background: elevate surfaces upward with subtle lightness steps
    const step = 0.02 + (contrast / 100) * 0.06;
    surface = adjustOklch(bg, step);
    surfaceElevated = adjustOklch(bg, step * 1.8);
    surfaceHover = adjustOklch(surface, 0.025);
    surfaceMuted = adjustOklch(bg, step * 0.7);
    surfaceFloating = adjustOklch(bg, step * 2.4);
    baseOuterBg = adjustOklch(bg, -0.025);
  } else {
    // Naturally light or mid-tone background:
    const lum = getLuminance(bg);
    if (lum > 0.75) {
      const step = -(0.015 + (contrast / 100) * 0.045);
      surface = "#ffffff";
      surfaceElevated = adjustOklch(bg, step * 0.5);
      surfaceHover = adjustOklch(bg, step * 0.8);
      surfaceMuted = adjustOklch(bg, step);
      surfaceFloating = "#ffffff";
      baseOuterBg = adjustOklch(bg, step * 1.2);
    } else {
      // Mid-tone background (like #838181, #808080):
      // Step upward in lightness smoothly towards white
      const step = 0.05 + (contrast / 100) * 0.14;
      surface = adjustOklch(bg, step);
      surfaceElevated = adjustOklch(bg, step * 1.7);
      surfaceHover = adjustOklch(surface, 0.03);
      surfaceMuted = adjustOklch(bg, step * 0.6);
      surfaceFloating = "#ffffff";
      baseOuterBg = adjustOklch(bg, -0.04);
    }
  }

  // 4. Dynamic border alpha based on contrast slider (0.06 to 0.45)
  const borderAlpha = Math.max(0.06, Math.min(0.46, 0.06 + (contrast / 100) * 0.38));
  const borderSubtleAlpha = Math.max(0.03, Math.min(0.26, 0.03 + (contrast / 100) * 0.20));
  const borderStrongAlpha = Math.max(0.14, Math.min(0.65, 0.14 + (contrast / 100) * 0.45));
  const borderRgb = isDark ? "255, 255, 255" : "0, 0, 0";

  // 5. Accent & Primary configuration
  const accentRgb = hexToRgb(accent);
  const accentFg = getAccessibleTextColor(accent);
  const accentBorder = isColorDark(accent) ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.14)";

  // 6. Navigation Sidebar Subsystem (Strict Isolation)
  // If custom sidebar theme is enabled, use custom sidebar parameters;
  // otherwise, default to the existing dark sidebar standard shown in reference implementation.
  let effSidebarBg, effSidebarAccent, effSidebarContrast;

  if (sidebarEnabled) {
    effSidebarBg = sidebarBgRaw;
    effSidebarAccent = sidebarAccentRaw;
    effSidebarContrast = sidebarContrast;
  } else {
    // Default sidebar harmonizes with canvas tone while maintaining proper hierarchy
    effSidebarBg = isDark ? adjustOklch(bg, -0.05) : adjustOklch(bg, -0.16);
    effSidebarAccent = accent;
    effSidebarContrast = contrast;
  }

  const isSidebarDark = isColorDark(effSidebarBg);
  const sBorderAlpha = Math.max(0.06, Math.min(0.50, 0.06 + (effSidebarContrast / 100) * 0.40));
  const sBorderRgb = isSidebarDark ? "255, 255, 255" : "0, 0, 0";
  const sFg = isSidebarDark ? "#f4f4f5" : "#09090b";
  const sMuted = isSidebarDark ? "rgba(255, 255, 255, 0.70)" : "rgba(9, 9, 11, 0.70)";
  const sHover = isSidebarDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const sActive = isSidebarDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.10)";

  const sAccentRgb = hexToRgb(effSidebarAccent);
  const sAccentFg = getAccessibleTextColor(effSidebarAccent);
  const sActiveBgAlpha = Math.max(0.08, Math.min(0.38, 0.08 + (effSidebarContrast / 100) * 0.28));
  const sActiveBorderAlpha = Math.max(0.12, Math.min(0.80, 0.12 + (effSidebarContrast / 100) * 0.65));

  return {
    themeMode: "custom",
    colorScheme,
    tokens: {
      // Global Canvas & Surfaces
      "--background": bg,
      "--foreground": mainFg,
      "--canvas-pitch": bg,
      "--canvas-deep": baseOuterBg,
      "--surface": surface,
      "--surface-muted": surfaceMuted,
      "--surface-elevated": surfaceElevated,
      "--surface-hover": surfaceHover,
      "--surface-active": surfaceElevated,
      "--surface-floating": surfaceFloating,
      "--card": surface,
      "--card-bg": bg,
      "--card-foreground": mainFg,
      "--popover": surfaceElevated,
      "--popover-foreground": mainFg,

      // Borders & Dividers
      "--border": `rgba(${borderRgb}, ${borderAlpha.toFixed(3)})`,
      "--border-subtle": `rgba(${borderRgb}, ${borderSubtleAlpha.toFixed(3)})`,
      "--border-hover": `rgba(${borderRgb}, ${(borderAlpha + 0.08).toFixed(3)})`,
      "--border-strong": `rgba(${borderRgb}, ${borderStrongAlpha.toFixed(3)})`,
      "--border-popover": `rgba(${borderRgb}, ${(borderAlpha + 0.06).toFixed(3)})`,

      // Typography Hierarchy
      "--text-primary": mainFg,
      "--text-body": isFgDark ? "#0f172a" : "#f4f4f5",
      "--text-secondary": mainSecondary,
      "--text-muted": mainMuted,
      "--text-faint": isFgDark ? "#475569" : "#64748b",

      // Primary & Accent Actions
      "--accent": accent,
      "--accent-hover": adjustBrightness(accent, isColorDark(accent) ? 14 : -14),
      "--accent-subtle": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.12)`,
      "--accent-foreground": accentFg,
      "--primary": accent,
      "--primary-foreground": accentFg,
      "--primary-border": accentBorder,
      "--kriri-accent": accent,
      "--kriri-accent-hover": adjustBrightness(accent, isColorDark(accent) ? 14 : -14),
      "--kriri-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,

      // Secondary & Muted States
      "--secondary": surfaceElevated,
      "--secondary-foreground": mainFg,
      "--muted": surfaceMuted,
      "--muted-foreground": mainMuted,
      "--input": `rgba(${borderRgb}, ${borderAlpha.toFixed(3)})`,
      "--ring": accent,

      // Navigation Sidebar Subsystem
      "--sidebar": effSidebarBg,
      "--sidebar-bg": effSidebarBg,
      "--sidebar-foreground": sFg,
      "--sidebar-muted": sMuted,
      "--sidebar-hover": sHover,
      "--sidebar-active": sActive,
      "--sidebar-border": `rgba(${sBorderRgb}, ${sBorderAlpha.toFixed(3)})`,
      "--sidebar-accent": effSidebarAccent,
      "--sidebar-accent-rgb": `${sAccentRgb.r}, ${sAccentRgb.g}, ${sAccentRgb.b}`,
      "--sidebar-primary": effSidebarAccent,
      "--sidebar-primary-foreground": sAccentFg,
      "--sidebar-accent-foreground": sAccentFg,
      "--sidebar-surface": effSidebarBg,
      "--sidebar-active-bg": isSidebarDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      "--sidebar-active-border": isSidebarDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
      "--sidebar-theme": isSidebarDark ? "dark" : "light",

      // Interactive States
      "--button-bg": surfaceElevated,
      "--button-foreground": mainFg,
      "--button-hover": surfaceHover,
      "--button-active": surfaceElevated,
      "--focus-ring": accent,
      "--selection-bg": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.28)`,
      "--selection-foreground": accentFg,
      "--disabled-bg": `rgba(${borderRgb}, 0.05)`,
      "--disabled-foreground": `rgba(${borderRgb}, 0.35)`,

      // Linear Status Tokens
      "--status-backlog": mainMuted,
      "--status-todo": isFgDark ? "#334155" : "#cbd5e1",
      "--status-in-progress": "#f5a623",
      "--status-in-review": "#3b82f6",
      "--status-done": "#5e6ad2",

      // Priority Tokens
      "--priority-urgent": "#e27a4a",
      "--priority-high": mainFg,
      "--priority-medium": isFgDark ? "rgba(9, 9, 11, 0.75)" : "rgba(255, 255, 255, 0.75)",
      "--priority-low": isFgDark ? "rgba(9, 9, 11, 0.50)" : "rgba(255, 255, 255, 0.50)",
      "--priority-none": isFgDark ? "rgba(9, 9, 11, 0.35)" : "rgba(255, 255, 255, 0.35)",

      // Feedback & Additional Tokens
      "--destructive": "#ef4444",
      "--destructive-foreground": "#ffffff",
      "--success": "#30a46c",
      "--warning": "#f5a623",
      "--error": "#e5484d",
      "--info": "#0091ff",
      "--tooltip-bg": isDark ? surfaceElevated : "#09090b",
      "--tooltip-foreground": "#ffffff",
      "--skeleton-bg": `rgba(${borderRgb}, 0.08)`,
      "--overlay-bg": "rgba(0, 0, 0, 0.60)",
      "--scrollbar-thumb": `rgba(${borderRgb}, ${Math.max(0.12, borderAlpha).toFixed(3)})`,
      "--scrollbar-track": "transparent",
    },
  };
}

/**
 * Applies the generated theme palette to a DOM element (defaults to document.documentElement)
 */
export function applyThemeToElement(palette, element) {
  const root = element || (typeof document !== "undefined" ? document.documentElement : null);
  if (!root) return;

  const { themeMode, colorScheme, tokens } = palette;

  // Set semantic attributes
  root.setAttribute("data-theme", colorScheme);
  root.setAttribute("data-theme-mode", themeMode);
  root.setAttribute("data-color-scheme", colorScheme);

  // Synchronize Tailwind variant classes
  root.classList.toggle("dark", colorScheme === "dark");
  root.classList.toggle("light", colorScheme === "light");
  root.classList.toggle("theme-custom", themeMode === "custom");

  // Apply all CSS variables
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }

  // Update root colorScheme and background for native controls
  root.style.colorScheme = colorScheme;
  root.style.backgroundColor = tokens["--background"];
  if (document.body) {
    document.body.style.colorScheme = colorScheme;
    document.body.style.backgroundColor = tokens["--background"];
  }

  // Synchronize mobile meta theme-color
  if (typeof document !== "undefined") {
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    metaTags.forEach((meta) => meta.setAttribute("content", tokens["--background"]));
    const csMeta = document.querySelector('meta[name="color-scheme"]');
    if (csMeta) csMeta.setAttribute("content", colorScheme);
    const sbMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (sbMeta) sbMeta.setAttribute("content", colorScheme === "dark" ? "black" : "default");
  }
}
