import { useState, useRef, useEffect } from "react";

const DEFAULT_CATEGORIES = [
  {
    name: "PRODUCT & DEVELOPMENT",
    labels: [
      "Frontend",
      "Backend",
      "Database",
      "Mobile",
      "Web",
      "AI/ML",
      "Research",
      "Testing",
      "Bug",
      "Feature",
    ],
  },
  {
    name: "DESIGN & CREATIVE",
    labels: [
      "UI/UX",
      "Design",
      "Branding",
      "Content",
      "Copywriting",
      "Creative",
      "Media",
      "Video",
      "Photography",
    ],
  },
  {
    name: "BUSINESS & OPERATIONS",
    labels: [
      "Business",
      "Operations",
      "Finance",
      "Sales",
      "Marketing",
      "Strategy",
      "Planning",
      "Administration",
      "Legal",
      "HR",
    ],
  },
  {
    name: "COLLABORATION & MANAGEMENT",
    labels: [
      "Meeting",
      "Team",
      "Client",
      "Internal",
      "External",
      "Communication",
      "Review",
      "Approval",
      "Decision",
    ],
  },
  {
    name: "PROJECT LIFECYCLE",
    labels: [
      "Planning",
      "Research",
      "Execution",
      "Launch",
      "Maintenance",
      "Documentation",
      "Reporting",
    ],
  },
];

export default function LinearLabelPicker({
  selectedLabels = [],
  onChange,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const toggleLabel = (label) => {
    if (selectedLabels.includes(label)) {
      onChange(selectedLabels.filter((l) => l !== label));
    } else {
      onChange([...selectedLabels, label]);
    }
  };

  const cleanSearch = search.trim();
  const searchLower = cleanSearch.toLowerCase();

  // Load custom labels from local storage (or start empty)
  const [customLabels, setCustomLabels] = useState(() => {
    const saved = localStorage.getItem("kriri_custom_labels");
    return saved ? JSON.parse(saved) : [];
  });

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!cleanSearch || cleanSearch.length > 30) return;

      const isExistingPredefined = DEFAULT_CATEGORIES.some((cat) =>
        cat.labels.some((l) => l.toLowerCase() === searchLower),
      );
      const isExistingCustom = customLabels.some(
        (l) => l.toLowerCase() === searchLower,
      );

      let labelToAdd = cleanSearch;

      // Find the exact cased version if it exists
      if (isExistingPredefined) {
        labelToAdd =
          DEFAULT_CATEGORIES.flatMap((c) => c.labels).find(
            (l) => l.toLowerCase() === searchLower,
          ) || labelToAdd;
      } else if (isExistingCustom) {
        labelToAdd =
          customLabels.find((l) => l.toLowerCase() === searchLower) ||
          labelToAdd;
      } else {
        // Add to custom labels if brand new
        const newCustom = [...customLabels, labelToAdd];
        setCustomLabels(newCustom);
        localStorage.setItem("kriri_custom_labels", JSON.stringify(newCustom));
      }

      if (!selectedLabels.some((l) => l.toLowerCase() === searchLower)) {
        onChange([...selectedLabels, labelToAdd]);
      }
      setSearch("");
    }
  };

  const filteredCategories = DEFAULT_CATEGORIES.map((cat) => ({
    name: cat.name,
    labels: cat.labels.filter((label) =>
      label.toLowerCase().includes(searchLower),
    ),
  })).filter((cat) => cat.labels.length > 0);

  const filteredCustom = customLabels.filter((label) =>
    label.toLowerCase().includes(searchLower),
  );

  const exactMatchExists =
    DEFAULT_CATEGORIES.some((cat) =>
      cat.labels.some((l) => l.toLowerCase() === searchLower),
    ) || customLabels.some((l) => l.toLowerCase() === searchLower);

  const showCreateOption =
    cleanSearch.length > 0 && cleanSearch.length <= 30 && !exactMatchExists;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 bg-[#202225] border border-[#333538] rounded-xl shadow-2xl w-[320px] max-w-[90vw] z-50 text-white overflow-hidden text-[13px] flex flex-col"
    >
      <div className="p-3 border-b border-[#333538] flex items-center justify-between">
        <input
          autoFocus
          placeholder="Search or add a label..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={30}
          className="w-full bg-transparent border-none text-[13px] text-white focus:outline-none placeholder:text-[#85868a]"
        />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar p-2">
        {filteredCategories.map((cat) => (
          <div key={cat.name} className="mb-4 last:mb-1">
            <div className="text-[11px] font-semibold text-[#85868a] tracking-wider mb-2 px-1">
              {cat.name}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.labels.map((label) => {
                const isSelected = selectedLabels.includes(label);
                return (
                  <button
                    type="button"
                    key={`${cat.name}-${label}`}
                    onClick={() => toggleLabel(label)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors border ${
                      isSelected
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-[#333538] text-[#d1d2d5] hover:bg-white/5 hover:border-[#4d4f54]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCustom.length > 0 && (
          <div className="mb-4 last:mb-1">
            <div className="text-[11px] font-semibold text-[#85868a] tracking-wider mb-2 px-1">
              CUSTOM LABELS
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredCustom.map((label) => {
                const isSelected = selectedLabels.includes(label);
                return (
                  <button
                    type="button"
                    key={`custom-${label}`}
                    onClick={() => toggleLabel(label)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors border ${
                      isSelected
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-[#333538] text-[#d1d2d5] hover:bg-white/5 hover:border-[#4d4f54]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showCreateOption && (
          <div
            className="flex items-center gap-2 px-2 py-2 mt-2 hover:bg-white/[0.04] cursor-pointer rounded-lg text-[#d1d2d5] transition-colors"
            onClick={() =>
              handleKeyDown({ key: "Enter", preventDefault: () => {} })
            }
          >
            <span className="text-[#85868a]">+</span>
            <span>
              Create{" "}
              <span className="font-medium text-white">"{cleanSearch}"</span>
            </span>
          </div>
        )}

        {filteredCategories.length === 0 &&
          filteredCustom.length === 0 &&
          !showCreateOption && (
            <div className="text-center text-[#85868a] py-6 text-[12px]">
              No labels found
            </div>
          )}
      </div>
    </div>
  );
}
