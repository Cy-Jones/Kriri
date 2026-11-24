import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function RoleDropdown({
  value,
  onChange,
  disabled = false,
  disabledTitle = "",
  options = ["Admin", "Project Manager", "Team Lead", "Member", "Viewer", "Guest"],
  className = "",
  dataTestId = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 220);
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (role, e) => {
    e.stopPropagation();
    if (role !== value) {
      onChange(role);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${isOpen ? "z-40" : "z-10"} ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title={disabled ? disabledTitle : undefined}
        data-testid={dataTestId || `role-dropdown-btn-${value}`}
        className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-normal transition-all duration-150 select-none border border-border ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-surface-muted text-text-muted"
            : "bg-surface-elevated hover:bg-surface-hover text-foreground cursor-pointer shadow-xs active:scale-[0.98]"
        }`}
      >
        <span>{value || "Member"}</span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-foreground" : "group-hover:text-foreground"
          }`}
        />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          data-testid="role-dropdown-menu"
          className={`absolute left-0 w-max min-w-[135px] max-w-[200px] bg-surface-elevated border border-border-popover rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap ${
            openUpwards ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          }`}
        >
          {options.map((role) => {
            const isSelected = role === value;
            return (
              <button
                key={role}
                type="button"
                onClick={(e) => handleSelect(role, e)}
                data-testid={`role-option-${role}`}
                className={`w-full text-left px-3.5 py-1.5 rounded-full text-[13px] transition-colors cursor-pointer select-none flex items-center ${
                  isSelected
                    ? "bg-surface-hover text-foreground font-medium"
                    : "text-text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
