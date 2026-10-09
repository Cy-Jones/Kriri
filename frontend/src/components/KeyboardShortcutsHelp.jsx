import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SHORTCUTS = [
  {
    category: "Global",
    items: [
      { keys: ["Cmd", "K"], description: "Open command palette" },
      { keys: ["/"], description: "Global search" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["C"], description: "Create task" },
      { keys: ["Cmd", "Shift", "P"], description: "Create project" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { keys: ["G", "Then", "D"], description: "Go to Dashboard" },
      { keys: ["G", "Then", "P"], description: "Go to Projects" },
      { keys: ["G", "Then", "T"], description: "Go to Issues" },
      { keys: ["G", "Then", "I"], description: "Go to Inbox" },
      { keys: ["G", "Then", "M"], description: "Go to Team" },
      { keys: ["G", "Then", "A"], description: "Go to Analytics" },
    ],
  },
  {
    category: "Tasks & Issues",
    items: [
      { keys: ["E"], description: "Edit task" },
      { keys: ["A"], description: "Assign task" },
      { keys: ["S"], description: "Change status" },
      { keys: ["P"], description: "Set priority" },
      { keys: ["D"], description: "Set due date" },
      { keys: ["Cmd", "Enter"], description: "Save changes" },
      { keys: ["Esc"], description: "Cancel / Close" },
    ],
  },
  {
    category: "Project View",
    items: [
      { keys: ["Cmd", "1"], description: "List view" },
      { keys: ["Cmd", "2"], description: "Board view" },
      { keys: ["Cmd", "3"], description: "Calendar/Timeline view" },
      { keys: ["F"], description: "Focus search/filter" },
      { keys: ["O"], description: "Toggle display options" },
    ],
  },
];

export default function KeyboardShortcutsHelp({ isOpen, onOpenChange }) {
  // Use "meta" key symbol on Mac, "Ctrl" on Windows/Linux
  const isMac =
    typeof window !== "undefined"
      ? navigator.platform.toUpperCase().indexOf("MAC") >= 0
      : true;

  const renderKey = (key) => {
    let displayKey = key;
    if (key === "Cmd") {
      displayKey = isMac ? "⌘" : "Ctrl";
    } else if (key === "Shift") {
      displayKey = isMac ? "⇧" : "Shift";
    }

    if (key === "Then") {
      return (
        <span
          key="then"
          className="text-[#8a8f98] mx-1 text-[11px] font-medium"
        >
          then
        </span>
      );
    }

    return (
      <kbd
        key={key}
        className="flex h-5 items-center justify-center rounded border border-[#2d313a] bg-[#1a1d24] px-1.5 text-[11px] font-medium text-[#e8e8e8] shadow-sm"
      >
        {displayKey}
      </kbd>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border border-[#2d313a] bg-[#12141a] shadow-2xl focus:outline-none"
              >
                <div className="flex items-center justify-between border-b border-[#2d313a] px-6 py-4">
                  <Dialog.Title className="text-base font-semibold text-[#e8e8e8]">
                    Keyboard Shortcuts
                  </Dialog.Title>
                  <Dialog.Close className="rounded-md p-1.5 text-[#8a8f98] hover:bg-[#2d313a] hover:text-[#e8e8e8] transition-colors focus:outline-none">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d313a] scrollbar-track-transparent">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {SHORTCUTS.map((section) => (
                      <div key={section.category}>
                        <h3 className="text-[12px] font-medium text-[#8a8f98] uppercase tracking-wider mb-3">
                          {section.category}
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {section.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between"
                            >
                              <span className="text-[13px] text-[#e8e8e8]">
                                {item.description}
                              </span>
                              <div className="flex items-center gap-1">
                                {item.keys.map((key, i) => renderKey(key))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#2d313a] bg-[#0f1115] px-6 py-3 flex justify-between items-center text-[12px] text-[#8a8f98]">
                  <span>
                    Pro tip: Press{" "}
                    <kbd className="px-1.5 py-0.5 rounded border border-[#2d313a] bg-[#1a1d24] mx-1">
                      ?
                    </kbd>{" "}
                    from anywhere to open this menu
                  </span>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
