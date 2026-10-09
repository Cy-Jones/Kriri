import React from "react";
import {
  Hexagon,
  Users,
  Signal,
  Link2,
  Tag,
  Calendar,
  Edit2,
  X,
  Box,
  Sidebar,
  Layout,
  Settings2,
  Search,
} from "lucide-react";
import { getStatusIcon } from "../StatusPicker";
import { getPriorityIcon } from "../PriorityPicker";

export default function BulkActionModal({
  isOpen,
  onClose,
  commandPaletteState,
  setCommandPaletteState,
  commandPaletteSearch,
  setCommandPaletteSearch,
  commandPaletteIndex,
  setCommandPaletteIndex,
  handleBulkUpdate,
}) {
  if (!isOpen) return null;

  const searchLower = commandPaletteSearch.toLowerCase();

  let flattenedCommands = [];
  let statusCommands = [];
  let priorityCommands = [];

  if (!commandPaletteState) {
    const allCommands = [
      {
        id: "status",
        label: "Change project status...",
        icon: <Hexagon size={14} className="text-[#8a8f98]" />,
        shortcut: "P then S",
        action: () => {
          setCommandPaletteState("status");
          setCommandPaletteSearch("");
          setCommandPaletteIndex(0);
        },
      },
      {
        id: "members",
        label: "Change project members...",
        icon: <Users size={14} className="text-[#8a8f98]" />,
        shortcut: "P then M",
        action: () => {},
      },
      {
        id: "priority",
        label: "Change project priority...",
        icon: <Signal size={14} className="text-[#8a8f98]" />,
        shortcut: "P then P",
        action: () => {
          setCommandPaletteState("priority");
          setCommandPaletteSearch("");
          setCommandPaletteIndex(0);
        },
      },
      {
        id: "dependencies",
        label: "Change project dependencies...",
        icon: <Link2 size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "labels",
        label: "Add labels...",
        icon: <Tag size={14} className="text-[#8a8f98]" />,
        shortcut: "P then L",
        action: () => {
          setCommandPaletteState("labels");
          setCommandPaletteSearch("");
          setCommandPaletteIndex(0);
        },
      },
      {
        id: "target_date",
        label: "Set project target date...",
        icon: <Calendar size={14} className="text-[#8a8f98]" />,
        shortcutKeys: ["Ctrl", "D"],
        action: () => {
          setCommandPaletteState("target_date");
          setCommandPaletteSearch("");
          setCommandPaletteIndex(0);
        },
      },
      {
        id: "start_date",
        label: "Set project start date...",
        icon: <Calendar size={14} className="text-[#8a8f98]" />,
        shortcutKeys: ["Ctrl", "S"],
        action: () => {
          setCommandPaletteState("start_date");
          setCommandPaletteSearch("");
          setCommandPaletteIndex(0);
        },
      },
      {
        id: "rename",
        label: "Rename project",
        icon: <Edit2 size={14} className="text-[#8a8f98]" />,
        shortcutKeys: ["⇧", "R"],
        action: () => {},
      },
      {
        id: "copy_url",
        label: "Copy project URL",
        icon: <Link2 size={14} className="text-[#8a8f98]" />,
        shortcutKeys: ["Cmd", "⇧", ","],
        action: () => {},
      },
      {
        id: "copy_id",
        label: "Copy project ID",
        icon: <Link2 size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "delete",
        label: "Delete project...",
        icon: <X size={14} className="text-[#e2483d]" />,
        shortcutKeys: ["Cmd", "Backspace"],
        action: () => {},
      },
      {
        id: "archive",
        label: "Archive project",
        icon: <Box size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "collapse_sidebar",
        label: "Collapse navigation sidebar",
        icon: <Sidebar size={14} className="text-[#8a8f98]" />,
        shortcutKeys: ["["],
        action: () => {},
      },
      {
        id: "hide_empty",
        label: "Hide empty columns",
        icon: <Layout size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "change_properties",
        label: "Change displayed properties...",
        icon: <Settings2 size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "theme_light",
        label: "Switch to light theme",
        icon: <Layout size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "theme_dark",
        label: "Switch to dark theme",
        icon: <Layout size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
      {
        id: "theme_system",
        label: "Switch to system theme",
        icon: <Layout size={14} className="text-[#8a8f98]" />,
        action: () => {},
      },
    ];

    if (searchLower) {
      allCommands.forEach((cmd) => {
        if (cmd.label.toLowerCase().includes(searchLower)) {
          flattenedCommands.push(cmd);
        }
      });

      ["Backlog", "Planned", "In Progress", "Completed", "Canceled"].forEach(
        (s) => {
          const label = `Change project status > ${s}`;
          if (label.toLowerCase().includes(searchLower)) {
            flattenedCommands.push({
              id: `status_${s}`,
              label,
              icon: getStatusIcon(s),
              action: () => handleBulkUpdate("status", s),
            });
          }
        },
      );

      ["Urgent", "High", "Medium", "Low", "No priority"].forEach((p) => {
        const label = `Change project priority > ${p}`;
        if (label.toLowerCase().includes(searchLower)) {
          flattenedCommands.push({
            id: `priority_${p}`,
            label,
            icon: getPriorityIcon(p),
            action: () => handleBulkUpdate("priority", p),
          });
        }
      });
    } else {
      flattenedCommands.push(...allCommands);
    }
  } else if (commandPaletteState === "status") {
    statusCommands = [
      "Backlog",
      "Planned",
      "In Progress",
      "Completed",
      "Canceled",
    ]
      .filter((s) => s.toLowerCase().includes(searchLower))
      .map((status) => ({
        id: status,
        label: status,
        icon: getStatusIcon(status),
        action: () => handleBulkUpdate("status", status),
      }));
  } else if (commandPaletteState === "priority") {
    priorityCommands = ["Urgent", "High", "Medium", "Low", "No priority"]
      .filter((p) => p.toLowerCase().includes(searchLower))
      .map((p) => ({
        id: p,
        label: p,
        icon: getPriorityIcon(p),
        action: () => handleBulkUpdate("priority", p),
      }));
  }

  const handleInputKeyDown = (e) => {
    let list = [];
    if (!commandPaletteState) list = flattenedCommands;
    else if (commandPaletteState === "status") list = statusCommands;
    else if (commandPaletteState === "priority") list = priorityCommands;

    if (e.key === "Enter") {
      e.preventDefault();
      if (list[commandPaletteIndex]) {
        list[commandPaletteIndex].action();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCommandPaletteIndex((prev) =>
        Math.min(prev + 1, Math.max(0, list.length - 1)),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCommandPaletteIndex((prev) => Math.max(0, prev - 1));
    } else if (
      e.key === "Backspace" &&
      commandPaletteSearch === "" &&
      commandPaletteState
    ) {
      setCommandPaletteState(null);
      setCommandPaletteSearch("");
      setCommandPaletteIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          onClose();
          setCommandPaletteState(null);
        }}
      ></div>
      <div
        className="relative w-full max-w-[540px] bg-[#18191b]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8),_inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/[0.06]">
          {commandPaletteState && (
            <div className="flex items-center mr-2">
              <span className="bg-white/10 text-white text-[12px] px-2 py-1 rounded capitalize">
                {commandPaletteState.replace("_", " ")}
              </span>
            </div>
          )}
          <input
            type="text"
            placeholder={
              commandPaletteState ? "Search..." : "Type a command or search..."
            }
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder-[#8a8f98]"
            autoFocus
            value={commandPaletteSearch}
            onChange={(e) => {
              setCommandPaletteSearch(e.target.value);
              setCommandPaletteIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
          />
        </div>

        <div className="flex flex-col py-2 max-h-[400px] overflow-y-auto">
          {!commandPaletteState ? (
            flattenedCommands.length === 0 ? (
              <div className="flex flex-col pb-4">
                <div className="px-4 py-2 text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider mb-1">
                  Quick results for "{commandPaletteSearch}"
                </div>
                <div className="px-4 py-2 flex items-center gap-3 text-[13px] text-[#e8e8e8]">
                  <Search size={14} className="text-[#8a8f98]" />
                  No results found
                  <span className="text-[#8a8f98] ml-2 text-[12px]">
                    Go to advanced search
                  </span>
                </div>
              </div>
            ) : (
              <>
                {flattenedCommands.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setCommandPaletteIndex(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#e8e8e8] hover:bg-white/10 hover:text-white transition-colors text-left w-full justify-between group ${
                      commandPaletteIndex === idx ? "bg-white/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cmd.icon} {cmd.label}
                    </div>
                    {cmd.shortcut && (
                      <div className="text-[11px] font-mono text-[#8a8f98] opacity-0 group-hover:opacity-100 transition-opacity">
                        {cmd.shortcut}
                      </div>
                    )}
                    {cmd.shortcutKeys && (
                      <div className="text-[11px] font-mono text-[#8a8f98] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cmd.shortcutKeys.map((k, i) => (
                          <span key={i} className="bg-white/10 px-1 rounded">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </>
            )
          ) : commandPaletteState === "status" ? (
            <>
              {statusCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setCommandPaletteIndex(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#e8e8e8] hover:bg-white/10 hover:text-white transition-colors text-left w-full ${
                    commandPaletteIndex === idx ? "bg-white/10" : ""
                  }`}
                >
                  {cmd.icon} {cmd.label}
                </button>
              ))}
            </>
          ) : commandPaletteState === "priority" ? (
            <>
              {priorityCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setCommandPaletteIndex(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#e8e8e8] hover:bg-white/10 hover:text-white transition-colors text-left w-full ${
                    commandPaletteIndex === idx ? "bg-white/10" : ""
                  }`}
                >
                  {cmd.icon} {cmd.label}
                </button>
              ))}
            </>
          ) : commandPaletteState === "target_date" ||
            commandPaletteState === "start_date" ? (
            <div className="p-4 text-center text-[13px] text-[#8a8f98]">
              <input
                type="date"
                className="bg-[#0e0f11] border border-white/10 rounded px-3 py-1.5 text-white"
                onChange={(e) =>
                  handleBulkUpdate(commandPaletteState, e.target.value)
                }
              />
            </div>
          ) : (
            <div className="p-4 text-center text-[13px] text-[#8a8f98]">
              Not implemented yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
