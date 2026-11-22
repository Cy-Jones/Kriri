import { useEffect, useRef } from "react";

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;

  const tagName = el.tagName?.toLowerCase();
  const isInput =
    tagName === "input" || tagName === "textarea" || tagName === "select";
  const isContentEditable =
    el.isContentEditable || el.getAttribute?.("contenteditable") === "true";

  return isInput || isContentEditable;
}

export function useListShortcuts({
  items = [],
  activeIndex,
  setActiveIndex,
  onOpenItem,
  onEditItem,
  onAssignItem,
  onChangeStatus,
  onChangePriority,
  onChangeDueDate,
  onCreateItem,
}) {
  const callbacksRef = useRef({
    onOpenItem,
    onEditItem,
    onAssignItem,
    onChangeStatus,
    onChangePriority,
    onChangeDueDate,
    onCreateItem,
  });

  useEffect(() => {
    callbacksRef.current = {
      onOpenItem,
      onEditItem,
      onAssignItem,
      onChangeStatus,
      onChangePriority,
      onChangeDueDate,
      onCreateItem,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (typeof window !== "undefined" && window.location.pathname !== "/tasks" && window.location.pathname !== "/tasks/") return;
      if (e.defaultPrevented) return;
      if (isInputFocused()) return;

      // CRITICAL: NEVER intercept any modified keypress!
      // (e.g. Cmd+K for Command Palette, Cmd+J for Agent, Cmd+B, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key ? e.key.toLowerCase() : "";

      // List Navigation
      if (key === "arrowdown" || key === "j") {
        e.preventDefault();
        setActiveIndex?.((prev) => {
          if (!items || items.length === 0) return null;
          if (prev === null) return 0;
          return prev < items.length - 1 ? prev + 1 : prev;
        });
        return;
      }

      if (key === "arrowup" || key === "k") {
        e.preventDefault();
        setActiveIndex?.((prev) => {
          if (!items || items.length === 0) return null;
          if (prev === null) return items.length - 1;
          return prev > 0 ? prev - 1 : 0;
        });
        return;
      }

      // Actions on active item
      if (activeIndex !== null && items && items[activeIndex]) {
        const activeItem = items[activeIndex];

        switch (key) {
          case "enter":
            e.preventDefault();
            callbacksRef.current.onOpenItem?.(activeItem);
            return;
          case "e":
            e.preventDefault();
            callbacksRef.current.onEditItem?.(activeItem);
            return;
          case "a":
            e.preventDefault();
            callbacksRef.current.onAssignItem?.(activeItem);
            return;
          case "s":
            e.preventDefault();
            callbacksRef.current.onChangeStatus?.(activeItem);
            return;
          case "p":
            e.preventDefault();
            callbacksRef.current.onChangePriority?.(activeItem);
            return;
          case "d":
            e.preventDefault();
            callbacksRef.current.onChangeDueDate?.(activeItem);
            return;
        }
      }

      // Create new item in active list view: 'n'
      if (key === "n" && !e.shiftKey) {
        e.preventDefault();
        callbacksRef.current.onCreateItem?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, activeIndex, setActiveIndex]);

  // Smoothly scroll active list item into view when activeIndex changes
  useEffect(() => {
    if (activeIndex === null || !items || !items[activeIndex]) return;
    const activeItem = items[activeIndex];
    const itemId = activeItem?.id;
    if (!itemId) return;

    const el =
      document.getElementById(`task-row-desktop-${itemId}`) ||
      document.getElementById(`task-row-mobile-${itemId}`) ||
      document.getElementById(`item-row-${itemId}`) ||
      document.querySelector(`[data-task-id="${itemId}"]`) ||
      document.querySelector(`[data-item-id="${itemId}"]`);

    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIndex, items]);
}
