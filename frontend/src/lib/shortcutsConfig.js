import { matchesShortcut, normalizeShortcut } from "@/registry/components/shortcut-recorder/shortcut-recorder";

const STORAGE_KEY_SHORTCUTS = "kriri_custom_shortcuts";
const STORAGE_KEY_PLATFORM = "kriri_shortcut_platform";

export const DEFAULT_SHORTCUTS = {
  openCommandMenu: "mod+k",
  createIssue: "c",
  toggleSidebar: "mod+b",
};

export function detectDefaultPlatform() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "mac";
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mac" : "other";
}

export function getPlatformPreference() {
  if (typeof window === "undefined") return "mac";
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PLATFORM);
    if (saved === "mac" || saved === "other") return saved;
  } catch (err) {
    // ignore local storage errors
  }
  return detectDefaultPlatform();
}

export function setPlatformPreference(platform) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PLATFORM, platform);
    window.dispatchEvent(new CustomEvent("kriri-platform-changed", { detail: { platform } }));
  } catch (err) {
    // ignore
  }
}

export function getCustomShortcuts() {
  if (typeof window === "undefined") return { ...DEFAULT_SHORTCUTS };
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SHORTCUTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate away from old demo shortcuts
      const createIssue = parsed.createIssue === "alt+n" ? DEFAULT_SHORTCUTS.createIssue : (parsed.createIssue || DEFAULT_SHORTCUTS.createIssue);
      const toggleSidebar = parsed.toggleSidebar === "mod+." ? DEFAULT_SHORTCUTS.toggleSidebar : (parsed.toggleSidebar || DEFAULT_SHORTCUTS.toggleSidebar);

      return {
        openCommandMenu: parsed.openCommandMenu || DEFAULT_SHORTCUTS.openCommandMenu,
        createIssue,
        toggleSidebar,
      };
    }
  } catch (err) {
    // ignore
  }
  return { ...DEFAULT_SHORTCUTS };
}

export function saveCustomShortcut(actionKey, shortcutValue) {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomShortcuts();
    const updated = {
      ...current,
      [actionKey]: shortcutValue,
    };
    localStorage.setItem(STORAGE_KEY_SHORTCUTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("kriri-shortcuts-changed", { detail: updated }));
  } catch (err) {
    // ignore
  }
}

export function resetCustomShortcuts() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_SHORTCUTS);
    window.dispatchEvent(new CustomEvent("kriri-shortcuts-changed", { detail: DEFAULT_SHORTCUTS }));
  } catch (err) {
    // ignore
  }
}
