import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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
}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e) => {
      // If the user is typing in an input, ignore global shortcuts (unless it's a specific global override)
      if (isInputFocused()) {
        return;
      }

      // 1. Single Key Shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.key === "?") {
          e.preventDefault();
          onOpenHelp?.();
          return;
        }
        if (e.key === "/") {
          e.preventDefault();
          onOpenCommandPalette?.();
          return;
        }
        if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          onOpenCreateTask?.();
          return;
        }
      }

      // 2. Chords (G + key)
      // For this, we'll keep a small piece of state locally in a module variable or ref.
      // However, since it's simpler to manage this directly in the event listener, we can use a closure.
      // We attach this via a simple timer mechanism for chord sequences.
    },
    [onOpenCommandPalette, onOpenHelp, onOpenCreateTask, navigate],
  );

  useEffect(() => {
    // We need a way to track sequence state
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
          case "p":
            e.preventDefault();
            navigate("/projects");
            break;
          case "t":
            e.preventDefault();
            navigate("/tasks");
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
