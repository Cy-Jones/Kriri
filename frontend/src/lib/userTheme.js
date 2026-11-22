export const STORAGE_KEY = "arc-theme";
export const DARK_FLAVOR_KEY = "kriri-dark-flavor";
export const LIGHT_FLAVOR_KEY = "kriri-light-flavor";

export function getUserThemeKey(userId) {
  return `kriri-user-theme-${userId}`;
}

export function getUserThemeSettings(userId) {
  if (!userId || typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getUserThemeKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveUserThemeSettings(userId, settings = {}) {
  if (!userId || typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = getUserThemeSettings(userId) || {};
    const updated = {
      ...existing,
      ...settings,
      customBg:
        settings.customBg ||
        settings.bg ||
        window.localStorage.getItem("kriri-custom-theme-bg") ||
        "#191a22",
      customAccent:
        settings.customAccent ||
        settings.accent ||
        window.localStorage.getItem("kriri-custom-theme-accent") ||
        "#5e6ad2",
      customContrast:
        settings.customContrast !== undefined
          ? settings.customContrast
          : Number(window.localStorage.getItem("kriri-custom-theme-contrast") || "30"),
      sidebarEnabled:
        settings.sidebarEnabled !== undefined
          ? settings.sidebarEnabled
          : window.localStorage.getItem("kriri-custom-sidebar-enabled") === "true",
      sidebarAccent:
        settings.sidebarAccent ||
        window.localStorage.getItem("kriri-custom-sidebar-accent") ||
        "#5e6ad2",
      sidebarBg:
        settings.sidebarBg ||
        window.localStorage.getItem("kriri-custom-sidebar-bg") ||
        "#121214",
      sidebarContrast:
        settings.sidebarContrast !== undefined
          ? settings.sidebarContrast
          : Number(window.localStorage.getItem("kriri-custom-sidebar-contrast") || "30"),
      accentColor:
        settings.accentColor ||
        window.localStorage.getItem("kriri-accent-color") ||
        "indigo",
      customAccentHex:
        settings.customAccentHex ||
        window.localStorage.getItem("kriri-custom-accent-hex") ||
        "#5e6ad2",
      hasCustomized: true,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(getUserThemeKey(userId), JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save user theme settings:", e);
  }
}

export function clearActiveThemeStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "system");
    window.localStorage.removeItem(DARK_FLAVOR_KEY);
    window.localStorage.removeItem(LIGHT_FLAVOR_KEY);
    window.localStorage.removeItem("kriri-custom-theme-bg");
    window.localStorage.removeItem("kriri-custom-theme-accent");
    window.localStorage.removeItem("kriri-custom-theme-contrast");
    window.localStorage.removeItem("kriri-custom-sidebar-enabled");
    window.localStorage.removeItem("kriri-custom-sidebar-accent");
    window.localStorage.removeItem("kriri-custom-sidebar-bg");
    window.localStorage.removeItem("kriri-custom-sidebar-contrast");
  } catch (e) {}
}

export function isAppRoute(pathname) {
  if (typeof window === "undefined") return false;
  const p = (pathname || (window.location && window.location.pathname) || "").toLowerCase();
  return (
    p.startsWith("/dashboard") ||
    p.startsWith("/inbox") ||
    p.startsWith("/tasks") ||
    p.startsWith("/projects") ||
    p.startsWith("/analytics") ||
    p.startsWith("/team") ||
    p.startsWith("/agent") ||
    p.startsWith("/settings")
  );
}

export function isPublicThemeRoute(pathname) {
  return !isAppRoute(pathname);
}

export const isLandingOrMarketingPath = isPublicThemeRoute;

