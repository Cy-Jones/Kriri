"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Synchronous DOM-based copy that preserves transient user activation on mobile.
 * Works across iOS Safari (10+), Android Chrome, mobile webviews, and local HTTP IPs.
 */
function copyUsingDOM(text) {
  if (typeof document === "undefined" || !document.body) return false;

  let success = false;
  let textarea = null;

  try {
    textarea = document.createElement("textarea");
    textarea.value = text;
    // Set readonly to avoid virtual keyboard flashing on mobile
    textarea.setAttribute("readonly", "");
    // Keep in viewport with minimal dimensions so WebKit considers it visible & selectable,
    // but transparent and non-disruptive to page layout
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "2em";
    textarea.style.height = "2em";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.fontSize = "16px"; // Prevents iOS Safari auto-zoom
    textarea.style.opacity = "0.01";
    textarea.style.zIndex = "-9999";

    document.body.appendChild(textarea);

    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    success = document.execCommand("copy");
  } catch {
    success = false;
  } finally {
    if (textarea && textarea.parentNode) {
      document.body.removeChild(textarea);
    }
  }

  if (success) return true;

  // Secondary DOM fallback: <span> with Range (for WebKit when textarea execCommand is blocked)
  let span = null;
  try {
    span = document.createElement("span");
    span.textContent = text;
    span.style.position = "fixed";
    span.style.top = "0";
    span.style.left = "0";
    span.style.opacity = "0.01";
    span.style.zIndex = "-9999";
    span.style.whiteSpace = "pre";
    span.style.webkitUserSelect = "all";
    span.style.userSelect = "all";

    document.body.appendChild(span);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNode(span);
      selection.addRange(range);
    }

    success = document.execCommand("copy");
    if (selection) selection.removeAllRanges();
  } catch {
    success = false;
  } finally {
    if (span && span.parentNode) {
      document.body.removeChild(span);
    }
  }

  return success;
}

export async function copyTextToClipboard(text) {
  if (typeof text === "function") {
    try {
      text = text();
    } catch {
      text = "";
    }
  }
  if (typeof text !== "string") text = String(text ?? "");

  // 1. Try synchronous DOM copy FIRST.
  // This is CRITICAL for mobile (iOS Safari, Android Chrome, in-app webviews, HTTP LAN testing)
  // because it runs synchronously in the click event without losing the transient user gesture!
  if (copyUsingDOM(text)) {
    return true;
  }

  // 2. Fallback to modern navigator.clipboard.writeText if available
  if (
    typeof navigator !== "undefined" &&
    navigator?.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Both attempts failed
    }
  }

  return false;
}

/** Shared clipboard state for actions that render their own button or menu. */
export function useCopyFeedback(duration = 1900) {
  const [state, setState] = useState("idle");
  const [activeKey, setActiveKey] = useState(null);
  const timeout = useRef(null);

  const reset = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    setState("idle");
    setActiveKey(null);
  }, []);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  const copy = useCallback(
    async (value, key = "default") => {
      if (timeout.current) clearTimeout(timeout.current);
      setActiveKey(key);
      const success = await copyTextToClipboard(value);
      if (success) {
        setState("copied");
        timeout.current = setTimeout(reset, duration);
        return true;
      } else {
        setState("error");
        timeout.current = setTimeout(reset, duration);
        return false;
      }
    },
    [duration, reset],
  );

  return { state, activeKey, copy, reset };
}
