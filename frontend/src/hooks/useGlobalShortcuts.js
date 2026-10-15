import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { matchesShortcut } from "@/registry/components/shortcut-recorder/shortcut-recorder";
import { getCustomShortcuts, getPlatformPreference } from "../lib/shortcutsConfig";

/**
 * Checks if the currently focused element is an input, textarea, or contenteditable.
 */
function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;

  const tagName = el.tagName.toLowerCase();
  const isInput =
    tagName === "input" || tagName === "textarea" || tagName === "select";
  const isContentEditable = el.isContentEditable;

  return isInput || isContentEditable;
}

export function useGlobalShortcuts({
  onOpenCommandPalette,
  onOpenHelp,
  onOpenCreateTask,
  onToggleSidebar,
}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e) => {
      const platform = getPlatformPreference();
      const shortcuts = getCustomShortcuts();

      // Check command palette shortcut first (works even inside inputs if mod+k is pressed)
      if (
        (shortcuts.openCommandMenu && matchesShortcut(e, shortcuts.openCommandMenu, platform)) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // Check toggle sidebar shortcut
      if (
        (shortcuts.toggleSidebar && matchesShortcut(e, shortcuts.toggleSidebar, platform)) ||
        ((e.metaKey || e.ctrlKey) && (e.key === "." || e.key.toLowerCase() === "b"))
      ) {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // If the user is typing in an input, ignore other global shortcuts
      if (isInputFocused()) {
        return;
      }

      // Check create issue shortcut
      if (
        (shortcuts.createIssue && matchesShortcut(e, shortcuts.createIssue, platform)) ||
        (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "c")
      ) {
        e.preventDefault();
        onOpenCreateTask?.();
        return;
      }

      // Navigation shortcuts from Cheatsheet:
      // Option / Alt + 1 -> Go to inbox
      if (matchesShortcut(e, "alt+1", platform)) {
        e.preventDefault();
        navigate("/inbox");
        return;
      }
      // Option / Alt + 2 -> Go to projects
      if (matchesShortcut(e, "alt+2", platform)) {
        e.preventDefault();
        navigate("/projects");
        return;
      }
      // Shift + Mod + F -> Search everything / command palette
      if (matchesShortcut(e, "shift+mod+f", platform)) {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // Help / Keyboard shortcuts: '?' (Shift + / on US keyboards or direct '?')
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (e.key === "?" || (e.shiftKey && (e.key === "/" || e.code === "Slash")))
      ) {
        e.preventDefault();
        onOpenHelp?.();
        return;
      }
    },
    [onOpenCommandPalette, onOpenHelp, onOpenCreateTask, onToggleSidebar, navigate],
  );

  useEffect(() => {
    let sequenceTimeout = null;
    let sequence = "";

    const handleKeySequence = (e) => {
      // Ignore sequences when typing
      if (isInputFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // If we press 'g', start the sequence
      if (key === "g" && sequence === "") {
        sequence = "g";
        clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          sequence = "";
        }, 1000); // 1 second to complete chord
        return;
      }

      // If we are in a sequence
      if (sequence === "g") {
        sequence = ""; // reset immediately
        clearTimeout(sequenceTimeout);

        switch (key) {
          case "d":
            e.preventDefault();
            navigate("/dashboard");
            break;
          case "b":
            e.preventDefault();
            navigate("/kanban");
            break;
          case "p":
            e.preventDefault();
            navigate("/projects");
            break;
          case "t":
            e.preventDefault();
            navigate("/tasks");
            break;
          case "s":
            e.preventDefault();
            navigate("/settings");
            break;
          case "i":
            e.preventDefault();
            navigate("/inbox");
            break;
          case "m":
            e.preventDefault();
            navigate("/team");
            break;
          case "a":
            e.preventDefault();
            navigate("/analytics");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeySequence);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeySequence);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, navigate]);
}
