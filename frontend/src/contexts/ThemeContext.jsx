"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  onThemeChange: () => {},
});

const STORAGE_KEY = "arc-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
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
  return theme === "light" ? "light" : "dark";
}

function syncDomTheme(theme) {
  if (typeof document === "undefined") return;
  const effectiveTheme = resolveEffectiveTheme(theme);
  const isDark = effectiveTheme === "dark";
  const root = document.documentElement;
  root.setAttribute("data-theme", effectiveTheme);
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.style.colorScheme = effectiveTheme;
  root.style.backgroundColor = isDark ? "#000000" : "#ffffff";
  if (document.body) {
    document.body.style.backgroundColor = isDark ? "#000000" : "#ffffff";
  }
}

export function runEclipseThemeTransition(nextTheme, trigger, onApplied) {
  const isReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof document === "undefined" || !document.startViewTransition || isReduced) {
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

  document.startViewTransition(() => {
    onApplied(nextTheme);
  });
}

export function ThemeProvider({ children, defaultTheme }) {
  const [theme, setThemeState] = useState(() => defaultTheme || getInitialTheme());

  useEffect(() => {
    syncDomTheme(theme);

    if (theme === "system" && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => syncDomTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const applyTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    syncDomTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {}
  }, []);

  const onThemeChange = useCallback(
    (nextTheme, variant = "eclipse", trigger) => {
      if (variant === "eclipse") {
        runEclipseThemeTransition(nextTheme, trigger, applyTheme);
      } else if (document.startViewTransition) {
        document.startViewTransition(() => applyTheme(nextTheme));
      } else {
        applyTheme(nextTheme);
      }
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(
    (variant = "eclipse", trigger) => {
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
        setTheme: applyTheme,
        toggleTheme,
        onThemeChange,
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
