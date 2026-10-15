import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";
import {
  shortcutTokens,
  shortcutFromEvent,
  normalizeShortcut,
} from "@/registry/components/shortcut-recorder/shortcut-recorder";
import {
  getPlatformPreference,
  setPlatformPreference,
  getCustomShortcuts,
  saveCustomShortcut,
  DEFAULT_SHORTCUTS,
} from "../lib/shortcutsConfig";

export default function KeyboardShortcutsHelp({ isOpen, onOpenChange }) {
  const [platform, setPlatform] = useState(() => getPlatformPreference());
  const [shortcuts, setShortcuts] = useState(() => getCustomShortcuts());
  const [recordingField, setRecordingField] = useState(null);
  const [liveMods, setLiveMods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [heldKeys, setHeldKeys] = useState(() => new Set());
  const searchInputRef = useRef(null);

  // Sync with platform and custom shortcut updates
  useEffect(() => {
    const handlePlatformChange = (e) => {
      if (e.detail?.platform) setPlatform(e.detail.platform);
    };
    const handleShortcutsChange = (e) => {
      if (e.detail) setShortcuts(e.detail);
    };

    window.addEventListener("kriri-platform-changed", handlePlatformChange);
    window.addEventListener("kriri-shortcuts-changed", handleShortcutsChange);
    return () => {
      window.removeEventListener("kriri-platform-changed", handlePlatformChange);
      window.removeEventListener("kriri-shortcuts-changed", handleShortcutsChange);
    };
  }, []);

  const handleTogglePlatform = (newPlatform) => {
    setPlatform(newPlatform);
    setPlatformPreference(newPlatform);
  };

  const handleSaveShortcut = (fieldKey, nextShortcut) => {
    saveCustomShortcut(fieldKey, nextShortcut);
    setShortcuts((prev) => ({
      ...prev,
      [fieldKey]: nextShortcut,
    }));
  };

  // Track live keydown/keyup for highlighting held modifiers & recording
  useEffect(() => {
    if (!isOpen) {
      setRecordingField(null);
      setLiveMods([]);
      setHeldKeys(new Set());
      setSearchQuery("");
      return;
    }

    const handleKeyDown = (e) => {
      // If we are recording a core command
      if (recordingField) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") {
          setRecordingField(null);
          setLiveMods([]);
          return;
        }

        if (e.key === "Backspace" || e.key === "Delete") {
          handleSaveShortcut(recordingField, null);
          setRecordingField(null);
          setLiveMods([]);
          return;
        }

        // Check if modifiers only
        const isModOnly = ["Meta", "Control", "Alt", "Shift"].includes(e.key);
        if (isModOnly) {
          const currentMods = [];
          if (platform === "mac" ? e.metaKey : e.ctrlKey) currentMods.push("mod");
          if (platform === "mac" ? e.ctrlKey : false) currentMods.push("ctrl");
          if (e.altKey) currentMods.push("alt");
          if (e.shiftKey) currentMods.push("shift");
          if (platform === "other" && e.metaKey) currentMods.push("meta");
          setLiveMods(currentMods);
          return;
        }

        const newShortcut = shortcutFromEvent(e, platform);
        if (newShortcut) {
          handleSaveShortcut(recordingField, newShortcut);
          setRecordingField(null);
          setLiveMods([]);
        }
        return;
      }

      // Close on escape when not recording
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      // Held key detection for cheatsheet
      setHeldKeys((prev) => {
        const next = new Set(prev);
        if (e.metaKey) next.add("meta");
        if (e.ctrlKey) next.add("ctrl");
        if (e.altKey) next.add("alt");
        if (e.shiftKey) next.add("shift");
        const key = e.key.toLowerCase();
        if (!["meta", "control", "alt", "shift"].includes(key)) {
          next.add(key);
        }
        return next;
      });
    };

    const handleKeyUp = (e) => {
      if (recordingField) {
        const currentMods = [];
        if (platform === "mac" ? e.metaKey : e.ctrlKey) currentMods.push("mod");
        if (platform === "mac" ? e.ctrlKey : false) currentMods.push("ctrl");
        if (e.altKey) currentMods.push("alt");
        if (e.shiftKey) currentMods.push("shift");
        if (platform === "other" && e.metaKey) currentMods.push("meta");
        setLiveMods(currentMods);
        return;
      }

      setHeldKeys((prev) => {
        const next = new Set(prev);
        if (!e.metaKey) next.delete("meta");
        if (!e.ctrlKey) next.delete("ctrl");
        if (!e.altKey) next.delete("alt");
        if (!e.shiftKey) next.delete("shift");
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    const handleWindowBlur = () => {
      setHeldKeys(new Set());
      setLiveMods([]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isOpen, recordingField, platform, onOpenChange]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Cheatsheet Group Definitions (synced dynamically with actual Kriri commands)
  const cheatsheetGroups = useMemo(() => {
    return [
      {
        label: "Global",
        items: [
          {
            label: "Open command palette",
            shortcut: shortcuts.openCommandMenu || "mod+k",
            keywords: "search cmd k spotlight palette actions menu",
          },
          {
            label: "Create task",
            shortcut: shortcuts.createIssue || "c",
            keywords: "new task todo issue add create",
          },
          {
            label: "Toggle sidebar",
            shortcut: shortcuts.toggleSidebar || "mod+b",
            keywords: "collapse sidebar nav menu toggle expand",
          },
          {
            label: "Create project",
            shortcut: "shift+mod+p",
            keywords: "new project repo create add",
          },
          {
            label: "Focus search / filter",
            shortcut: "f",
            keywords: "filter search query find",
          },
          {
            label: "Global search",
            shortcut: "/",
            keywords: "search find query",
          },
          {
            label: "Show keyboard shortcuts",
            shortcut: "?",
            keywords: "help cheat sheet shortcuts hotkeys",
          },
        ],
      },
      {
        label: "Navigation",
        items: [
          {
            label: "Go to Dashboard",
            shortcut: "g then d",
            keywords: "home dashboard overview metrics",
          },
          {
            label: "Go to Projects",
            shortcut: "g then p",
            keywords: "projects list repositories workspaces",
          },
          {
            label: "Go to Issues / Tasks",
            shortcut: "g then t",
            keywords: "issues tasks backlog todos",
          },
          {
            label: "Go to Inbox",
            shortcut: "g then i",
            keywords: "inbox activity notifications unread feed",
          },
          {
            label: "Go to Board",
            shortcut: "g then b",
            keywords: "kanban board workflow cards status",
          },
          {
            label: "Go to Settings",
            shortcut: "g then s",
            keywords: "settings preferences account configuration",
          },
          {
            label: "Go to Team",
            shortcut: "g then m",
            keywords: "team members directory roles access",
          },
          {
            label: "Go to Analytics",
            shortcut: "g then a",
            keywords: "analytics charts reporting insights",
          },
        ],
      },
      {
        label: "Tasks & Issues",
        items: [
          {
            label: "Edit task",
            shortcut: "e",
            keywords: "edit update task modify",
          },
          {
            label: "Assign task",
            shortcut: "a",
            keywords: "assign assignee delegate member",
          },
          {
            label: "Change status",
            shortcut: "s",
            keywords: "status done in progress backlog workflow",
          },
          {
            label: "Set priority",
            shortcut: "p",
            keywords: "priority urgent high medium low",
          },
          {
            label: "Set due date",
            shortcut: "d",
            keywords: "date schedule deadline calendar",
          },
          {
            label: "Save changes",
            shortcut: "mod+enter",
            keywords: "save submit confirm done",
          },
          {
            label: "Cancel / Close",
            shortcut: "esc",
            keywords: "cancel close dismiss exit",
          },
        ],
      },
      {
        label: "Project View",
        items: [
          {
            label: "List view",
            shortcut: "mod+1",
            keywords: "list table view mode",
          },
          {
            label: "Board view",
            shortcut: "mod+2",
            keywords: "kanban board columns view",
          },
          {
            label: "Calendar / Timeline view",
            shortcut: "mod+3",
            keywords: "calendar timeline gantt view",
          },
          {
            label: "Toggle display options",
            shortcut: "o",
            keywords: "options display view filter toggle",
          },
        ],
      },
    ];
  }, [shortcuts]);

  // Filter cheatsheet items
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return cheatsheetGroups;
    const q = searchQuery.toLowerCase().trim();

    return cheatsheetGroups
      .map((group) => {
        const matchingItems = group.items.filter((item) => {
          const tokens = shortcutTokens(item.shortcut, platform);
          const keyLabels = tokens.map((t) => t.label.toLowerCase()).join(" ");
          return (
            item.label.toLowerCase().includes(q) ||
            group.label.toLowerCase().includes(q) ||
            (item.keywords && item.keywords.toLowerCase().includes(q)) ||
            keyLabels.includes(q)
          );
        });
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [cheatsheetGroups, searchQuery, platform]);

  const handleTestCommand = () => {
    onOpenChange(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-command-palette"));
    }, 120);
  };

  const isHeldModifierActive =
    heldKeys.has("meta") ||
    heldKeys.has("ctrl") ||
    heldKeys.has("alt") ||
    heldKeys.has("shift");

  // Helper to render keycap pill
  const renderKeyCap = (label, isLit = false, isSm = false, keyId = null) => {
    if (label === "then" || (keyId && keyId === "then")) {
      return (
        <span key="then" className="text-[10px] text-zinc-500 font-sans mx-0.5 select-none">
          then
        </span>
      );
    }

    const displayLabel = label.length === 1 ? label.toUpperCase() : label;

    return (
      <span
        key={label}
        className={`inline-flex items-center justify-center font-mono font-medium select-none transition-all ${
          isSm
            ? "min-w-[22px] h-[22px] px-1.5 rounded-[5px] text-[11px]"
            : "min-w-[26px] h-[26px] px-2 rounded-[7px] text-[12px]"
        } ${
          isLit
            ? "bg-white/20 border border-white/30 text-white translate-y-[1px] shadow-sm"
            : "bg-[#222428] border border-white/10 text-[#d4d4d8] shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        }`}
      >
        {displayLabel}
      </span>
    );
  };

  // Reusable Recorder Field Component
  const renderRecorderField = (label, fieldKey) => {
    const isRecording = recordingField === fieldKey;
    const currentValue = shortcuts[fieldKey];

    let tokens = [];
    if (isRecording) {
      if (liveMods.length > 0) {
        tokens = shortcutTokens(liveMods.join("+"), platform);
      }
    } else if (currentValue) {
      tokens = shortcutTokens(currentValue, platform);
    }

    return (
      <div key={fieldKey} className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#d1d2d5] block select-none">
          {label}
        </label>
        <div
          onClick={() => {
            setRecordingField(fieldKey);
            setLiveMods([]);
          }}
          className={`h-[42px] px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            isRecording
              ? "bg-[#1f2026] border-purple-500/80 ring-2 ring-purple-500/20"
              : "bg-[#18191c] border-white/[0.08] hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse mr-1 flex-none" />
            )}

            {isRecording && tokens.length === 0 ? (
              <span className="text-[13px] text-zinc-400 font-normal">
                Press keys...
              </span>
            ) : tokens.length > 0 ? (
              <div className="flex items-center gap-1">
                {tokens.map((token, idx) =>
                  renderKeyCap(token.label, isRecording, false, token.id)
                )}
              </div>
            ) : (
              <span className="text-[13px] text-zinc-500 font-normal">
                No shortcut
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-none ml-2">
            {currentValue && !isRecording && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveShortcut(fieldKey, null);
                }}
                className="p-1 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors"
                title="Clear shortcut"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
        >
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 [backdrop-filter:blur(8px)]"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[860px] bg-[#141517] border border-white/[0.08] rounded-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row p-7 sm:p-8 gap-8 sm:gap-10 max-h-[90vh]"
          >
            {/* LEFT COLUMN: Core Rebindable Commands */}
            <div className="w-full md:w-[310px] flex-none flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                {/* Header: Title + Mac/Windows Segmented Toggle */}
                <div className="flex items-center justify-between">
                  <h2
                    id="shortcuts-dialog-title"
                    className="text-lg font-semibold text-white tracking-tight"
                  >
                    Shortcuts
                  </h2>

                  {/* Segmented Pill Switcher */}
                  <div className="bg-[#1f2024] p-1 rounded-full border border-white/[0.06] flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePlatform("mac")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        platform === "mac"
                          ? "bg-[#2c2d33] text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Mac
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePlatform("other")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        platform === "other"
                          ? "bg-[#2c2d33] text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Windows
                    </button>
                  </div>
                </div>

                {/* 3 Core Commands Recorders */}
                <div className="space-y-4">
                  {renderRecorderField("Open command menu", "openCommandMenu")}
                  {renderRecorderField("Create task", "createIssue")}
                  {renderRecorderField("Toggle sidebar", "toggleSidebar")}
                </div>
              </div>

              {/* Bottom Test Link / Interactive Hint */}
              <div
                onClick={handleTestCommand}
                className="pt-4 border-t border-white/[0.06] group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span>Press</span>
                  <div className="inline-flex items-center gap-1">
                    {shortcutTokens(
                      shortcuts.openCommandMenu || "mod+k",
                      platform
                    ).map((token) => renderKeyCap(token.label, false, true, token.id))}
                  </div>
                </div>
                <div className="text-[12px] text-zinc-500 group-hover:text-zinc-300 transition-colors mt-0.5">
                  here to open the command menu
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Searchable Cheatsheet */}
            <div className="flex-1 min-w-0 flex flex-col space-y-3">
              {/* Search Bar */}
              <div className="relative flex items-center h-[42px] px-3.5 rounded-xl bg-[#18191c] border border-white/[0.08] focus-within:border-white/20 transition-colors flex-none">
                <Search className="w-4 h-4 text-zinc-400 flex-none mr-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shortcuts"
                  className="w-full bg-transparent text-[13px] text-white placeholder-zinc-500 outline-none"
                  spellCheck={false}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white transition-colors flex-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Grouped Shortcuts List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {filteredGroups.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    No shortcuts match “{searchQuery}”
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.label} className="space-y-1.5">
                      <div className="text-[12px] font-medium text-zinc-400 select-none">
                        {group.label}
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const tokens = shortcutTokens(item.shortcut, platform);
                          const tokenIds = tokens.map((t) => t.id);

                          // Holding modifier logic: light caps and dim non-matching rows
                          const hasHeldModifiers = isHeldModifierActive;
                          const matchesHeld =
                            hasHeldModifiers &&
                            tokenIds.some((id) => heldKeys.has(id));
                          const isDimmed =
                            hasHeldModifiers && !matchesHeld;

                          return (
                            <div
                              key={item.label}
                              className={`flex items-center justify-between py-2 px-2.5 -mx-2.5 rounded-lg transition-all ${
                                matchesHeld
                                  ? "bg-white/[0.06] text-white"
                                  : isDimmed
                                  ? "opacity-35"
                                  : "hover:bg-white/[0.03]"
                              }`}
                            >
                              <span className="text-[13px] text-zinc-300 truncate pr-3 select-none">
                                {item.label}
                              </span>

                              <div className="flex items-center gap-1 flex-none">
                                {tokens.map((token) => {
                                  const isCapLit =
                                    heldKeys.has(token.id) ||
                                    (token.id === "meta" && heldKeys.has("meta")) ||
                                    (token.id === "ctrl" && heldKeys.has("ctrl")) ||
                                    (token.id === "alt" && heldKeys.has("alt")) ||
                                    (token.id === "shift" && heldKeys.has("shift"));

                                  return renderKeyCap(
                                    token.label,
                                    isCapLit,
                                    false,
                                    token.id
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
