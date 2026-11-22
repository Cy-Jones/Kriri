"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { playUiSound } from "../lib/sound";
import {
  generateThemePalette,
  applyThemeToElement,
  isColorDark,
  getLuminance as engineGetLuminance,
  getAccessibleTextColor as engineGetAccessibleTextColor,
  getAccessibleMutedColor as engineGetAccessibleMutedColor,
  adjustBrightness as engineAdjustBrightness,
} from "../lib/themeEngine";

const ThemeContext = createContext({
  theme: "system",
  effectiveTheme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  toggleThemeAppearance: () => {},
  onThemeChange: () => {},
  darkFlavor: "default",
  setDarkFlavor: () => {},
  lightFlavor: "shaded",
  setLightFlavor: () => {},
  setUserThemeContext: () => {},
  saveCustomTheme: () => {},
  activeUserId: null,
});

import {
  STORAGE_KEY,
  DARK_FLAVOR_KEY,
  LIGHT_FLAVOR_KEY,
  getUserThemeKey,
  getUserThemeSettings,
  saveUserThemeSettings,
  clearActiveThemeStorage,
  isAppRoute,
  isPublicThemeRoute,
  isLandingOrMarketingPath,
} from "../lib/userTheme";

export {
  STORAGE_KEY,
  DARK_FLAVOR_KEY,
  LIGHT_FLAVOR_KEY,
  getUserThemeKey,
  getUserThemeSettings,
  saveUserThemeSettings,
  clearActiveThemeStorage,
  isAppRoute,
  isPublicThemeRoute,
  isLandingOrMarketingPath,
};

export function getInitialDarkFlavor() {
  if (typeof window === "undefined") return "default";
  const stored = localStorage.getItem(DARK_FLAVOR_KEY);
  if (stored === "pure-black" || stored === "midnight" || stored === "default") {
    return stored;
  }
  return "default";
}

export function getInitialLightFlavor() {
  if (typeof window === "undefined") return "shaded";
  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === "pure-light") return "pure-white";
  const stored = localStorage.getItem(LIGHT_FLAVOR_KEY);
  if (stored === "pure-white" || stored === "shaded") {
    return stored;
  }
  return "shaded";
}

function getInitialTheme() {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "pure-light") {
    return "light";
  }
  if (
    stored === "light" ||
    stored === "dark" ||
    stored === "custom" ||
    stored === "system"
  ) {
    return stored;
  }
  return "system";
}

function resolveEffectiveTheme(theme) {
  if (theme === "system") {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }
  if (theme === "dark") return "dark";
  if (theme === "light" || theme === "pure-light") return "light";
  if (theme === "custom") {
    if (typeof window !== "undefined") {
      const customBg = localStorage.getItem("kriri-custom-theme-bg") || "#191a22";
      return isColorDark(customBg) ? "dark" : "light";
    }
    return "dark";
  }
  return "dark";
}

export function updateThemeColorMeta(color, isDark) {
  if (typeof document === "undefined") return;

  const scheme = isDark ? "dark" : "light";

  // 1. Synchronize or create the color-scheme meta tag
  let csMeta = document.querySelector('meta[name="color-scheme"]');
  if (!csMeta) {
    csMeta = document.createElement("meta");
    csMeta.setAttribute("name", "color-scheme");
    document.head.appendChild(csMeta);
  }
  csMeta.setAttribute("content", scheme);

  // 2. Set theme-color for default, light media query, and dark media query.
  // When an iPhone is in System Dark Mode, Safari strictly looks for (prefers-color-scheme: dark).
  // Setting all variants to the active color guarantees Safari tints the bars correctly in both light & dark modes.
  let defaultMeta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!defaultMeta) {
    defaultMeta = document.createElement("meta");
    defaultMeta.setAttribute("name", "theme-color");
    document.head.appendChild(defaultMeta);
  }
  defaultMeta.setAttribute("content", color);

  let lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
  if (!lightMeta) {
    lightMeta = document.createElement("meta");
    lightMeta.setAttribute("name", "theme-color");
    lightMeta.setAttribute("media", "(prefers-color-scheme: light)");
    document.head.appendChild(lightMeta);
  }
  lightMeta.setAttribute("content", color);

  let darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
  if (!darkMeta) {
    darkMeta = document.createElement("meta");
    darkMeta.setAttribute("name", "theme-color");
    darkMeta.setAttribute("media", "(prefers-color-scheme: dark)");
    document.head.appendChild(darkMeta);
  }
  darkMeta.setAttribute("content", color);

  // 3. Update apple status bar style
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!statusBarMeta) {
    statusBarMeta = document.createElement("meta");
    statusBarMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    document.head.appendChild(statusBarMeta);
  }
  statusBarMeta.setAttribute("content", isDark ? "black" : "default");

  // 4. Update root and body color scheme & backgrounds
  const root = document.documentElement;
  root.style.colorScheme = scheme;
  root.style.backgroundColor = color;
  if (document.body) {
    document.body.style.colorScheme = scheme;
    document.body.style.backgroundColor = color;
  }
}

export function applyCustomThemeToRoot(root, customOpts = {}) {
  if (!root && typeof document !== "undefined") {
    root = document.documentElement;
  }
  if (!root) return;

  const accent =
    customOpts.accent ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-custom-theme-accent") : null) ||
    "#575ac6";
  const bg =
    customOpts.bg ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-custom-theme-bg") : null) ||
    "#191a22";
  const contrast =
    customOpts.contrast !== undefined
      ? Number(customOpts.contrast)
      : Number((typeof window !== "undefined" ? localStorage.getItem("kriri-custom-theme-contrast") : null) || "30");
  const sidebarEnabled =
    customOpts.sidebarEnabled !== undefined
      ? Boolean(customOpts.sidebarEnabled)
      : (typeof window !== "undefined" ? localStorage.getItem("kriri-custom-sidebar-enabled") === "true" : false);
  const sidebarAccent =
    customOpts.sidebarAccent ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-custom-sidebar-accent") : null) ||
    accent;
  const sidebarBg =
    customOpts.sidebarBg ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-custom-sidebar-bg") : null) ||
    "#121214";
  const sidebarContrast =
    customOpts.sidebarContrast !== undefined
      ? Number(customOpts.sidebarContrast)
      : Number((typeof window !== "undefined" ? localStorage.getItem("kriri-custom-sidebar-contrast") : null) || "30");
  const palette = generateThemePalette({
    themeMode: "custom",
    bg,
    accent,
    contrast,
    sidebarEnabled,
    sidebarBg,
    sidebarAccent,
    sidebarContrast,
  });

  applyThemeToElement(palette, root);
}

export function clearCustomThemeProperties(root) {
  if (!root && typeof document !== "undefined") {
    root = document.documentElement;
  }
  if (!root) return;
  root.removeAttribute("data-accent");
}

export function syncLandingTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  clearCustomThemeProperties(root);
  root.setAttribute("data-dark-flavor", "default");
  root.removeAttribute("data-light-flavor");

  const palette = generateThemePalette({
    themeMode: "dark",
    darkFlavor: "default",
    accent: "#5e6ad2",
  });
  applyThemeToElement(palette, root);

  updateThemeColorMeta("#08090a", true);
}

export function syncDomTheme(theme, darkFlavor, lightFlavor, force = false) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // The ONLY place meant to follow the interface theme is when the user has logged in
  if (!force && isPublicThemeRoute()) {
    syncLandingTheme();
    return;
  }

  const currentDarkFlavor =
    darkFlavor ||
    (typeof window !== "undefined" ? localStorage.getItem(DARK_FLAVOR_KEY) : null) ||
    "default";
  const currentLightFlavor =
    lightFlavor ||
    (typeof window !== "undefined"
      ? localStorage.getItem(LIGHT_FLAVOR_KEY) || (theme === "pure-light" ? "pure-white" : "shaded")
      : "shaded");

  root.setAttribute("data-dark-flavor", currentDarkFlavor);
  root.setAttribute("data-light-flavor", currentLightFlavor);

  if (theme === "custom") {
    applyCustomThemeToRoot(root);
  } else {
    clearCustomThemeProperties(root);
    const effectiveTheme = resolveEffectiveTheme(theme);
    const resolvedMode = effectiveTheme === "light" ? "light" : "dark";
    const accent = typeof window !== "undefined" ? localStorage.getItem("kriri-accent-color") || "#5e6ad2" : "#5e6ad2";
    const palette = generateThemePalette({
      themeMode: resolvedMode,
      darkFlavor: currentDarkFlavor,
      lightFlavor: currentLightFlavor,
      accent,
    });
    applyThemeToElement(palette, root);

    // Refresh non-custom accent tint tokens from User Preferences
    if (typeof window !== "undefined") {
      import("../lib/userPreferences").then(({ applyPreferencesToDom }) => {
        applyPreferencesToDom();
      }).catch(() => {});
    }
  }
}

export function runEclipseThemeTransition(nextTheme, trigger, onApplied) {
  const isReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // On mobile viewports, skip startViewTransition so native iOS Safari status/toolbars do not freeze
  if (typeof document === "undefined" || !document.startViewTransition || isReduced || isMobile) {
    onApplied(nextTheme);
    return;
  }

  if (trigger && typeof trigger.getBoundingClientRect === "function") {
    const rect = trigger.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);
    document.documentElement.style.setProperty("--r", `${endRadius}px`);
  } else {
    document.documentElement.style.setProperty("--x", "50%");
    document.documentElement.style.setProperty("--y", "50%");
    document.documentElement.style.setProperty("--r", "150vmax");
  }

  try {
    const transition = document.startViewTransition(() => {
      onApplied(nextTheme);
    });
    if (transition && typeof transition.catch === "function") {
      transition.catch(() => {
        onApplied(nextTheme);
      });
    }
  } catch {
    onApplied(nextTheme);
  }
}

export function ThemeProvider({ children, defaultTheme }) {
  const [theme, setThemeState] = useState(() => defaultTheme || getInitialTheme());
  const [darkFlavor, setDarkFlavorState] = useState(getInitialDarkFlavor);
  const [lightFlavor, setLightFlavorState] = useState(getInitialLightFlavor);
  const activeUserIdRef = useRef(null);

  useEffect(() => {
    syncDomTheme(theme, darkFlavor, lightFlavor);

    if (theme === "system" && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => syncDomTheme("system", darkFlavor, lightFlavor);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, darkFlavor, lightFlavor]);

  const applyTheme = useCallback((nextTheme) => {
    const sanitizedTheme = nextTheme === "pure-light" ? "light" : nextTheme;
    setThemeState(sanitizedTheme);
    syncDomTheme(sanitizedTheme, darkFlavor, lightFlavor);
    try {
      localStorage.setItem(STORAGE_KEY, sanitizedTheme);
    } catch {}

    if (activeUserIdRef.current) {
      saveUserThemeSettings(activeUserIdRef.current, {
        theme: sanitizedTheme,
        darkFlavor,
        lightFlavor,
        hasCustomized: true,
      });
    }
  }, [darkFlavor, lightFlavor]);

  const setDarkFlavor = useCallback((nextFlavor) => {
    setDarkFlavorState(nextFlavor);
    try {
      localStorage.setItem(DARK_FLAVOR_KEY, nextFlavor);
    } catch {}
    syncDomTheme(theme, nextFlavor, lightFlavor);

    if (activeUserIdRef.current) {
      saveUserThemeSettings(activeUserIdRef.current, {
        theme,
        darkFlavor: nextFlavor,
        lightFlavor,
        hasCustomized: true,
      });
    }
  }, [theme, lightFlavor]);

  const setLightFlavor = useCallback((nextFlavor) => {
    setLightFlavorState(nextFlavor);
    try {
      localStorage.setItem(LIGHT_FLAVOR_KEY, nextFlavor);
    } catch {}
    syncDomTheme(theme, darkFlavor, nextFlavor);

    if (activeUserIdRef.current) {
      saveUserThemeSettings(activeUserIdRef.current, {
        theme,
        darkFlavor,
        lightFlavor: nextFlavor,
        hasCustomized: true,
      });
    }
  }, [theme, darkFlavor]);

  const saveCustomTheme = useCallback((customSettings = {}) => {
    if (activeUserIdRef.current) {
      saveUserThemeSettings(activeUserIdRef.current, {
        theme,
        darkFlavor,
        lightFlavor,
        ...customSettings,
        hasCustomized: true,
      });
    }
  }, [theme, darkFlavor, lightFlavor]);

  const setUserThemeContext = useCallback((userId) => {
    activeUserIdRef.current = userId || null;

    if (!userId) {
      // User logged out: restore defaults and pitch-dark landing
      setThemeState("system");
      setDarkFlavorState("default");
      setLightFlavorState("shaded");
      clearActiveThemeStorage();
      clearCustomThemeProperties();
      syncLandingTheme();
      return;
    }

    // User logged in: check if this user previously customized their app settings
    const saved = getUserThemeSettings(userId);
    if (saved && saved.hasCustomized) {
      const userTheme = saved.theme || "system";
      const userDarkFlavor = saved.darkFlavor || "default";
      const userLightFlavor = saved.lightFlavor || "shaded";

      setThemeState(userTheme);
      setDarkFlavorState(userDarkFlavor);
      setLightFlavorState(userLightFlavor);

      try {
        localStorage.setItem(STORAGE_KEY, userTheme);
        localStorage.setItem(DARK_FLAVOR_KEY, userDarkFlavor);
        localStorage.setItem(LIGHT_FLAVOR_KEY, userLightFlavor);
        if (saved.customBg) localStorage.setItem("kriri-custom-theme-bg", saved.customBg);
        if (saved.customAccent) localStorage.setItem("kriri-custom-theme-accent", saved.customAccent);
        if (saved.customContrast !== undefined) localStorage.setItem("kriri-custom-theme-contrast", String(saved.customContrast));
        if (saved.sidebarEnabled !== undefined) localStorage.setItem("kriri-custom-sidebar-enabled", String(saved.sidebarEnabled));
        if (saved.sidebarAccent) localStorage.setItem("kriri-custom-sidebar-accent", saved.sidebarAccent);
        if (saved.sidebarBg) localStorage.setItem("kriri-custom-sidebar-bg", saved.sidebarBg);
        if (saved.sidebarContrast !== undefined) localStorage.setItem("kriri-custom-sidebar-contrast", String(saved.sidebarContrast));
        if (saved.accentColor) localStorage.setItem("kriri-accent-color", saved.accentColor);
        if (saved.customAccentHex) localStorage.setItem("kriri-custom-accent-hex", saved.customAccentHex);
      } catch {}

      if (isAppRoute()) {
        syncDomTheme(userTheme, userDarkFlavor, userLightFlavor, true);
      } else {
        syncLandingTheme();
      }
    } else {
      // User has not customized their app from settings: default to system
      setThemeState("system");
      setDarkFlavorState("default");
      setLightFlavorState("shaded");
      clearActiveThemeStorage();
      clearCustomThemeProperties();

      if (isAppRoute()) {
        syncDomTheme("system", "default", "shaded", true);
      } else {
        syncLandingTheme();
      }
    }
  }, []);

  const onThemeChange = useCallback(
    (nextTheme, variant = "eclipse", trigger) => {
      const sanitizedTheme = nextTheme === "pure-light" ? "light" : nextTheme;
      const nextEffective = resolveEffectiveTheme(sanitizedTheme);
      const isDark = nextEffective === "dark";
      let nextBgColor = "#08090a";
      if (!isDark) {
        nextBgColor = (sanitizedTheme === "pure-light" || lightFlavor === "pure-white") ? "#ffffff" : "#fbfbfb";
      } else {
        if (darkFlavor === "pure-black") nextBgColor = "#000000";
        else if (darkFlavor === "midnight") nextBgColor = "#080b11";
        else nextBgColor = "#08090a";
      }

      if (sanitizedTheme === "custom" && typeof window !== "undefined") {
        nextBgColor = localStorage.getItem("kriri-custom-theme-bg") || "#191a22";
      }

      // Immediately synchronize theme-color meta so Safari mobile header and bottom bar change right away
      updateThemeColorMeta(nextBgColor, isDark);

      if (variant === "eclipse") {
        runEclipseThemeTransition(sanitizedTheme, trigger, applyTheme);
      } else if (document.startViewTransition) {
        try {
          const transition = document.startViewTransition(() => applyTheme(sanitizedTheme));
          if (transition && typeof transition.catch === "function") {
            transition.catch(() => applyTheme(sanitizedTheme));
          }
        } catch {
          applyTheme(sanitizedTheme);
        }
      } else {
        applyTheme(sanitizedTheme);
      }
    },
    [applyTheme, darkFlavor, lightFlavor]
  );

  const toggleTheme = useCallback(
    (variant = "eclipse", trigger) => {
      // In Custom Mode, toggle controls are hidden and disabled
      if (theme === "custom") return;

      playUiSound("toggle");
      const effectiveTheme = resolveEffectiveTheme(theme);
      const nextTheme = effectiveTheme === "dark" ? "light" : "dark";
      onThemeChange(nextTheme, variant, trigger);
    },
    [theme, onThemeChange]
  );

  const effectiveTheme = resolveEffectiveTheme(theme);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        darkFlavor,
        setDarkFlavor,
        lightFlavor,
        setLightFlavor,
        setTheme: applyTheme,
        toggleTheme,
        toggleThemeAppearance: toggleTheme,
        onThemeChange,
        setUserThemeContext,
        saveCustomTheme,
        activeUserId: activeUserIdRef.current,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
