import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { matchesShortcut } from "@/registry/components/shortcut-recorder/shortcut-recorder";
import { getCustomShortcuts, getPlatformPreference } from "../lib/shortcutsConfig";

/**
 * Checks if the currently focused element is an input, textarea, select, or contenteditable.
 */
export function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;

  const tagName = el.tagName?.toLowerCase();
  const isInput =
    tagName === "input" || tagName === "textarea" || tagName === "select";
  const isContentEditable =
    el.isContentEditable || el.getAttribute?.("contenteditable") === "true";

  return isInput || isContentEditable;
}

export function useGlobalShortcuts({
  onOpenCommandPalette,
  onOpenHelp,
  onOpenCreateTask,
  onOpenCreateProject,
  onToggleSidebar,
  onToggleAgent,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const callbacksRef = useRef({
    onOpenCommandPalette,
    onOpenHelp,
    onOpenCreateTask,
    onOpenCreateProject,
    onToggleSidebar,
    onToggleAgent,
  });

  useEffect(() => {
    callbacksRef.current = {
      onOpenCommandPalette,
      onOpenHelp,
      onOpenCreateTask,
      onOpenCreateProject,
      onToggleSidebar,
      onToggleAgent,
    };
  });

  const sequenceRef = useRef("");
  const sequenceTimeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // If default was already prevented by an inner child, skip
      if (e.defaultPrevented) return;

      // Check if global shortcuts are disabled in user preferences
      if (typeof window !== "undefined" && localStorage.getItem("kriri-shortcuts-enabled") === "false") {
        return;
      }

      const platform = getPlatformPreference();
      const shortcuts = getCustomShortcuts();
      const key = e.key ? e.key.toLowerCase() : "";
      const isMod = e.metaKey || e.ctrlKey;
      const hasAnyMod = e.metaKey || e.ctrlKey || e.altKey;

      // ----------------------------------------------------------------------
      // 1. COMMAND PALETTE: mod+k, shift+mod+f, or custom shortcut
      // (Works everywhere, even when focused inside an input)
      // ----------------------------------------------------------------------
      if (
        (shortcuts.openCommandMenu && matchesShortcut(e, shortcuts.openCommandMenu, platform)) ||
        (isMod && key === "k") ||
        (isMod && e.shiftKey && key === "f")
      ) {
        e.preventDefault();
        sequenceRef.current = "";
        clearTimeout(sequenceTimeoutRef.current);
        callbacksRef.current.onOpenCommandPalette?.();
        return;
      }

      // ----------------------------------------------------------------------
      // 2. TOGGLE SIDEBAR: mod+b, mod+., or custom shortcut
      // (Works everywhere, even when focused inside an input)
      // ----------------------------------------------------------------------
      if (
        (shortcuts.toggleSidebar && matchesShortcut(e, shortcuts.toggleSidebar, platform)) ||
        (isMod && (key === "b" || key === "." || e.code === "Period"))
      ) {
        e.preventDefault();
        callbacksRef.current.onToggleSidebar?.();
        return;
      }

      // ----------------------------------------------------------------------
      // 3. TOGGLE KRIRI AGENT: mod+j
      // (Works everywhere)
      // ----------------------------------------------------------------------
      if (isMod && key === "j") {
        e.preventDefault();
        callbacksRef.current.onToggleAgent?.();
        return;
      }

      // ----------------------------------------------------------------------
      // 4. CREATE PROJECT: shift+mod+p
      // ----------------------------------------------------------------------
      if (isMod && e.shiftKey && key === "p") {
        e.preventDefault();
        callbacksRef.current.onOpenCreateProject?.();
        return;
      }

      // If user is currently typing in an input/textarea, ignore non-modifier shortcuts
      if (isInputFocused()) {
        return;
      }

      // ----------------------------------------------------------------------
      // 5. NAVIGATION CHORDS: "g then <key>"
      // ----------------------------------------------------------------------
      if (!hasAnyMod) {
        // If chord is currently waiting for 2nd key:
        if (sequenceRef.current === "g") {
          sequenceRef.current = "";
          clearTimeout(sequenceTimeoutRef.current);

          switch (key) {
            case "d":
              e.preventDefault();
              navigate("/dashboard");
              return;
            case "p":
              e.preventDefault();
              navigate("/projects");
              return;
            case "t":
              e.preventDefault();
              navigate("/tasks");
              return;
            case "i":
              e.preventDefault();
              navigate("/inbox");
              return;
            case "b":
              e.preventDefault();
              navigate("/tasks?view=board");
              return;
            case "s":
              e.preventDefault();
              navigate("/settings");
              return;
            case "m":
              e.preventDefault();
              navigate("/team");
              return;
            case "a":
              e.preventDefault();
              navigate("/agent");
              return;
            case "y":
            case "l":
              e.preventDefault();
              navigate("/analytics");
              return;
            default:
              break;
          }
        }

        // Start 'g' chord
        if (key === "g") {
          sequenceRef.current = "g";
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = setTimeout(() => {
            sequenceRef.current = "";
          }, 1500); // 1.5 seconds window to press 2nd key
          return;
        }
      }

      // Any other non-g key clears pending chord
      if (sequenceRef.current) {
        sequenceRef.current = "";
        clearTimeout(sequenceTimeoutRef.current);
      }

      // ----------------------------------------------------------------------
      // 6. CREATE TASK / ISSUE: "c" or custom shortcut
      // ----------------------------------------------------------------------
      if (
        (shortcuts.createIssue && matchesShortcut(e, shortcuts.createIssue, platform)) ||
        (!hasAnyMod && !e.shiftKey && key === "c")
      ) {
        // If on /projects page, let the projects page handler decide or open modal
        e.preventDefault();
        callbacksRef.current.onOpenCreateTask?.();
        return;
      }

      // ----------------------------------------------------------------------
      // 7. KEYBOARD SHORTCUTS HELP / CHEATSHEET: "?"
      // ----------------------------------------------------------------------
      if (
        !hasAnyMod &&
        (e.key === "?" || (e.shiftKey && (e.key === "/" || e.code === "Slash")))
      ) {
        e.preventDefault();
        callbacksRef.current.onOpenHelp?.();
        return;
      }

      // ----------------------------------------------------------------------
      // 8. GLOBAL SEARCH: "/"
      // ----------------------------------------------------------------------
      if (!hasAnyMod && !e.shiftKey && (e.key === "/" || e.code === "Slash")) {
        e.preventDefault();
        callbacksRef.current.onOpenCommandPalette?.();
        return;
      }

      // ----------------------------------------------------------------------
      // 9. FOCUS SEARCH / FILTER: "f"
      // ----------------------------------------------------------------------
      if (!hasAnyMod && !e.shiftKey && key === "f") {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]'
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          if (typeof searchInput.select === "function") searchInput.select();
          return;
        } else {
          e.preventDefault();
          callbacksRef.current.onOpenCommandPalette?.();
          return;
        }
      }

      // ----------------------------------------------------------------------
      // 10. ALTERNATIVE NAVIGATION SHORTCUTS FROM CHEATSHEET
      // Alt/Option + 1 -> Inbox, Alt/Option + 2 -> Projects
      // ----------------------------------------------------------------------
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        if (key === "1" || e.code === "Digit1") {
          e.preventDefault();
          navigate("/inbox");
          return;
        }
        if (key === "2" || e.code === "Digit2") {
          e.preventDefault();
          navigate("/projects");
          return;
        }
      }

      // ----------------------------------------------------------------------
      // 11. PROJECT VIEW SWITCHING: mod+1 (List), mod+2 (Board), mod+3 (Timeline)
      // and "o" (Toggle display options)
      // ----------------------------------------------------------------------
      if (location.pathname === "/projects" || location.pathname === "/projects/") {
        if (isMod && !e.shiftKey && !e.altKey) {
          if (key === "1" || e.code === "Digit1") {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("kriri-switch-view", { detail: { view: "list" } }));
            return;
          }
          if (key === "2" || e.code === "Digit2") {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("kriri-switch-view", { detail: { view: "board" } }));
            return;
          }
          if (key === "3" || e.code === "Digit3") {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("kriri-switch-view", { detail: { view: "timeline" } }));
            return;
          }
        }

        if (!hasAnyMod && !e.shiftKey && key === "o") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("kriri-toggle-display-options"));
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(sequenceTimeoutRef.current);
      sequenceRef.current = "";
    };
  }, [navigate, location.pathname]);
}
