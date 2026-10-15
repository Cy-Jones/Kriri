"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileText, Home, Plus, Search, Settings, User } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { EASE_OUT } from "@/lib/ease";
import { useOnOpen } from "@/lib/hooks/use-on-open";
import { useRowCursor } from "@/lib/hooks/use-row-cursor";
import { useTouchCapable } from "@/lib/hooks/use-touch-capable";
import { PresenceGate } from "@/lib/presence-gate";
import { cn } from "@/lib/utils";
import { searchCommands } from "@/lib/command-search";

// Tight spring entrance, instant exit
const PANEL_SPRING = {
  type: "spring",
  stiffness: 560,
  damping: 40,
  mass: 0.5,
};

export function CommandPalette({
  items = [],
  shortcut = "k",
  placeholder = "Type a command or search…",
  emptyMessage = "No results found.",
  open: controlledOpen,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (v) => {
      if (!controlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [controlled, onOpenChange],
  );

  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const uid = useId();
  const reduce = useReducedMotion();
  const canTouch = useTouchCapable();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === shortcut.toLowerCase()
      ) {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    const handleCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [open, shortcut, setOpen]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  const filtered = useMemo(() => searchCommands(items, query), [items, query]);

  const hasIcons = useMemo(() => items.some((it) => it.icon), [items]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((it) => {
      const g = it.group ?? "Results";
      const groupItems = map.get(g) ?? [];
      groupItems.push(it);
      map.set(g, groupItems);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const rows = useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

  const { activeIndex: active, moveTo, moveActive } = useRowCursor(rows, query);

  useOnOpen(open, () => {
    setQuery("");
    moveTo(null);
  });

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = rows[active];
      if (it) {
        it.onSelect();
        setOpen(false);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <PresenceGate key="backdrop">
          {({ gate }) => (
            <motion.button
              type="button"
              aria-label="Close command palette"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.12, ease: EASE_OUT },
              }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              {...gate}
              onClick={() => setOpen(false)}
              className="pointer-events-auto fixed inset-0 z-[100] bg-black/60 [backdrop-filter:blur(12px)_saturate(140%)] [-webkit-backdrop-filter:blur(12px)_saturate(140%)]"
            />
          )}
        </PresenceGate>
      ) : null}

      {open ? (
        <PresenceGate key="panel-layer">
          {({ isPresent, gate }) => (
            <div
              inert={!isPresent ? "" : undefined}
              className="pointer-events-none fixed inset-x-4 bottom-4 top-[14vh] sm:top-[18vh] z-[100] flex items-start justify-center"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                initial={{
                  opacity: 0,
                  y: reduce ? 0 : -8,
                  scale: reduce ? 1 : 0.97,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: reduce ? 0 : -8,
                  scale: reduce ? 1 : 0.97,
                  transition: { duration: 0.12, ease: EASE_OUT },
                }}
                transition={reduce ? { duration: 0.1 } : PANEL_SPRING}
                {...gate}
                onKeyDown={onKeyDown}
                className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 [data-theme=light]:border-black/10 bg-[#131416] [data-theme=light]:bg-white text-foreground shadow-[0_24px_64px_rgba(0,0,0,0.5)] [data-theme=light]:shadow-[0_24px_64px_rgba(0,0,0,0.18)] will-change-transform"
              >
                <div className="flex items-center gap-3 border-b border-white/10 [data-theme=light]:border-black/10 px-4 h-14">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={`${uid}-list`}
                    aria-activedescendant={
                      rows.length > 0 ? `${uid}-opt-${active}` : undefined
                    }
                    aria-autocomplete="list"
                    className={cn(
                      "h-full flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none",
                      canTouch && "text-base",
                    )}
                  />
                  <kbd className="hidden rounded border border-white/10 [data-theme=light]:border-black/10 bg-white/5 [data-theme=light]:bg-black/5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
                    ESC
                  </kbd>
                </div>
                <div
                  ref={listRef}
                  id={`${uid}-list`}
                  role="listbox"
                  aria-label="Commands"
                  className="max-h-[55vh] overflow-y-auto overscroll-contain p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {rows.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </div>
                  ) : (
                    grouped.map(([group, list]) => (
                      <div key={group} className="mb-2 last:mb-0">
                        <div
                          aria-hidden
                          className="px-3 py-1.5 text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          {group}
                        </div>
                        {list.map((it) => {
                          const idx = rows.indexOf(it);
                          const isActive = idx === active;
                          const Icon = it.icon;
                          return (
                            <button
                              key={it.id}
                              type="button"
                              id={`${uid}-opt-${idx}`}
                              role="option"
                              aria-selected={isActive}
                              data-index={idx}
                              onMouseEnter={() => moveTo(it.id)}
                              onClick={() => {
                                it.onSelect();
                                setOpen(false);
                              }}
                              className={cn(
                                "relative isolate flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors outline-none",
                                isActive
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {isActive ? (
                                <motion.span
                                  layoutId={`${uid}-active`}
                                  className="absolute inset-0 z-0 rounded-lg bg-white/[0.08] [data-theme=light]:bg-black/[0.06]"
                                  transition={
                                    reduce
                                      ? { duration: 0 }
                                      : {
                                          type: "spring",
                                          stiffness: 480,
                                          damping: 38,
                                        }
                                  }
                                />
                              ) : null}
                              {Icon ? (
                                <Icon className="relative z-10 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                              ) : hasIcons ? (
                                <span className="relative z-10 h-4 w-4 shrink-0" />
                              ) : null}
                              <span className="relative z-10 flex-1 truncate">
                                {it.label}
                              </span>
                              {it.badge ? (
                                <span className="relative z-10 shrink-0">
                                  {it.badge}
                                </span>
                              ) : null}
                              {it.hint ? (
                                <kbd className="relative z-10 rounded border border-white/10 [data-theme=light]:border-black/10 bg-white/5 [data-theme=light]:bg-black/5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                                  {it.hint}
                                </kbd>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </PresenceGate>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function CommandPalettePreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-full border border-white/10 [data-theme=light]:border-black/10 bg-white/5 [data-theme=light]:bg-black/5 px-5 text-sm font-medium text-foreground hover:border-white/20 [data-theme=light]:hover:border-black/20 transition-colors"
      >
        Open command palette
      </button>
      <p className="text-sm text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-white/10 [data-theme=light]:border-black/10 bg-white/5 [data-theme=light]:bg-black/5 px-1.5 py-0.5 text-xs text-foreground font-mono">
          ⌘ J
        </kbd>{" "}
        (or{" "}
        <kbd className="rounded border border-white/10 [data-theme=light]:border-black/10 bg-white/5 [data-theme=light]:bg-black/5 px-1.5 py-0.5 text-xs text-foreground font-mono">
          Ctrl J
        </kbd>
        ) to open.
      </p>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        shortcut="j"
        items={[
          {
            id: "home",
            label: "Go to Home",
            group: "Navigation",
            icon: Home,
            hint: "G H",
            onSelect: () => {},
          },
          {
            id: "profile",
            label: "Open profile",
            group: "Navigation",
            icon: User,
            hint: "G P",
            onSelect: () => {},
          },
          {
            id: "settings",
            label: "Settings",
            group: "Navigation",
            icon: Settings,
            onSelect: () => {},
          },
          {
            id: "new-doc",
            label: "Create document",
            group: "Actions",
            icon: FileText,
            hint: "⌘ N",
            onSelect: () => {},
          },
          {
            id: "new-project",
            label: "New project",
            group: "Actions",
            icon: Plus,
            hint: "⌘ ⇧ N",
            onSelect: () => {},
          },
        ]}
      />
    </div>
  );
}

export default CommandPalette;
