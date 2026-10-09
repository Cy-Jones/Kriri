import React from "react";
import {
  Plus,
  Layers,
  Filter,
  Settings2,
  ListFilter,
  Signal,
  CircleDashed,
  Hexagon,
  CheckCircle2,
  XCircle,
  User,
  Tag,
  Activity,
  Calendar,
  Users,
  UserPen,
  Contact,
  Diamond,
  Box,
  Check,
  ChevronRight,
  ChevronDown,
  Feather,
  AlignJustify,
  LayoutGrid,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/registry/components/button/button";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";

export default function ProjectToolbar({
  canManageProjects,
  setIsCreateModalOpen,
  activeView,
  setActiveView,
  currentViewConfig,
  updateViewSetting,
  toggleProperty,
  resetToDefaults,
  setWorkspaceDefaultConfig,
  viewConfig,
  isNonDefaultDisplay,
  activeFilters,
  setActiveFilters,
  toggleFilter,
  searchQuery,
  setSearchQuery,
  projects,
  isFilterOpen,
  setIsFilterOpen,
  isDisplayOptionsOpen,
  setIsDisplayOptionsOpen,
  filterRef,
  displayOptionsRef,
  activeFilterMenu,
  setActiveFilterMenu,
  activeNestedFilterMenu,
  setActiveNestedFilterMenu,
  filterSearchTerm,
  setFilterSearchTerm,
  labelSearchTerm,
  setLabelSearchTerm,
  setCustomDateCategory,
  setIsCustomDateModalOpen,
}) {
  const uniqueLeadsMap = new Map();
  const uniqueMembersMap = new Map();
  const uniqueCreatorsMap = new Map();
  const uniqueLabelsSet = new Set();

  projects.forEach((p) => {
    if (p.lead) uniqueLeadsMap.set(p.lead.id, p.lead);
    if (p.creator) uniqueCreatorsMap.set(p.creator.id, p.creator);
    if (p.members) p.members.forEach((m) => uniqueMembersMap.set(m.id, m));
    if (p.labels) p.labels.forEach((l) => uniqueLabelsSet.add(l));
  });

  const userColors = [
    "#f26d78",
    "#3b82f6",
    "#f2c94c",
    "#22c55e",
    "#a855f7",
    "#ec4899",
    "#f97316",
    "#06b6d4",
  ];
  const dynamicLeads = Array.from(uniqueLeadsMap.values()).map((u, i) => ({
    label: u.name,
    user: { ...u, color: u.color || userColors[i % userColors.length] },
  }));
  const dynamicMembers = Array.from(uniqueMembersMap.values()).map((u, i) => ({
    label: u.name,
    user: { ...u, color: u.color || userColors[i % userColors.length] },
  }));
  const dynamicCreators = Array.from(uniqueCreatorsMap.values()).map(
    (u, i) => ({
      label: u.name,
      user: { ...u, color: u.color || userColors[i % userColors.length] },
    }),
  );

  const filteredLabels = Array.from(uniqueLabelsSet).filter((l) =>
    l.toLowerCase().includes(labelSearchTerm.toLowerCase()),
  );
  const dynamicLabels = filteredLabels.map((l) => ({
    label: l,
    icon: Tag,
    color: "text-[#e8e8e8]",
  }));

  if (
    labelSearchTerm &&
    !filteredLabels.some(
      (l) => l.toLowerCase() === labelSearchTerm.toLowerCase(),
    )
  ) {
    dynamicLabels.push({
      label: `Add "${labelSearchTerm}"`,
      actualValue: labelSearchTerm,
      icon: Tag,
      color: "text-[#3b82f6]",
      isCustom: true,
    });
  }

  return (
    <div className="flex flex-col gap-3 mb-6 z-30 flex-shrink-0 px-2">
      {/* ROW 1: Title & New Project */}
      <div className="flex items-center justify-between">
        <h1 className="text-[13.5px] font-medium tracking-tight text-[#e8e8e8]">
          Projects
        </h1>
        {canManageProjects && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
          >
            <Plus size={14} /> New Project
          </button>
        )}
      </div>

      <div className="h-px bg-white/[0.06] w-full" />

      {/* ROW 2: Scope Selector & View Controls */}
      <div className="flex items-center justify-between">
        {/* Workspace Scope Selector */}
        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            className="text-[12.5px] rounded-full h-[28px] px-3 bg-white/[0.04] hover:bg-white/[0.08] shadow-sm border-0"
          >
            <span>All projects</span>
            <Layers size={13} className="text-[#8a8f98]" />
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-1.5">
            <Button
              variant={isFilterOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setIsDisplayOptionsOpen(false);
                setIsFilterOpen(!isFilterOpen);
                if (isFilterOpen) {
                  setActiveFilterMenu(null);
                  setActiveNestedFilterMenu(null);
                  setFilterSearchTerm("");
                  setLabelSearchTerm("");
                }
              }}
              className={`flex-shrink-0 w-[28px] h-[28px] rounded-full p-0 flex items-center justify-center ${
                isFilterOpen
                  ? "bg-white/[0.1] text-white"
                  : "bg-white/[0.04] text-[#8a8f98] hover:text-[#e8e8e8]"
              }`}
            >
              <Filter size={13} />
            </Button>

            <Button
              variant={isDisplayOptionsOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setIsFilterOpen(false);
                setActiveFilterMenu(null);
                setActiveNestedFilterMenu(null);
                setFilterSearchTerm("");
                setLabelSearchTerm("");
                setIsDisplayOptionsOpen(!isDisplayOptionsOpen);
              }}
              className={`flex-shrink-0 relative w-[28px] h-[28px] rounded-full p-0 flex items-center justify-center ${
                isDisplayOptionsOpen
                  ? "bg-white/[0.1] text-white"
                  : "bg-white/[0.04] text-[#8a8f98] hover:text-[#e8e8e8]"
              }`}
            >
              <Settings2 size={13} />
              {isNonDefaultDisplay && (
                <div className="absolute top-[3px] right-[3px] w-[5px] h-[5px] bg-[#3b82f6] rounded-full ring-[2px] ring-[#1a1b1e]" />
              )}
            </Button>

            {/* Filter Menu Dropdown */}
            {isFilterOpen && (
              <div
                ref={filterRef}
                className="absolute top-[calc(100%+16px)] right-0 w-[240px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
              >
                <div className="px-2 pb-2 border-b border-white/5 mb-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Add Filter..."
                      value={filterSearchTerm}
                      onChange={(e) => setFilterSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const term = filterSearchTerm.trim().toLowerCase();
                          if (term) {
                            setSearchQuery(term);
                            setIsFilterOpen(false);
                            setFilterSearchTerm("");
                          }
                        }
                      }}
                      className="w-full bg-transparent text-[13px] text-white placeholder-[#8a8f98] pl-2 pr-2 py-1.5 outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <div
                  className="flex flex-col px-1 pb-1.5 border-b border-white/5 mb-1.5 gap-0.5 relative"
                  onMouseEnter={() => setActiveFilterMenu("Advanced filter")}
                >
                  <button className="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 hover:text-white rounded-md w-full transition-colors group">
                    <ListFilter
                      size={14}
                      className="text-[#8a8f98] group-hover:text-[#e8e8e8]"
                    />
                    Advanced filter
                  </button>
                  {activeFilterMenu === "Advanced filter" && (
                    <div className="absolute top-0 right-[calc(100%+8px)] w-[280px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-3 z-[60] animate-in fade-in zoom-in-95 flex flex-col gap-3">
                      <div className="text-[13px] text-white font-medium">
                        Advanced filter
                      </div>
                      <input
                        type="text"
                        className="w-full bg-[#1c1c1e] border border-[#3b82f6] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3b82f6] shadow-sm transition-shadow"
                        placeholder="e.g. is:open priority:high"
                        autoFocus
                        defaultValue={activeFilters.advanced || ""}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = e.target.value;
                            setActiveFilters((prev) => ({
                              ...prev,
                              advanced: val,
                            }));
                            setActiveFilterMenu(null);
                          }
                        }}
                        id="advanced-filter-input"
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => setActiveFilterMenu(null)}
                          className="px-3 py-1.5 text-[12px] text-[#e8e8e8] hover:bg-white/5 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const val = document.getElementById(
                              "advanced-filter-input",
                            ).value;
                            setActiveFilters((prev) => ({
                              ...prev,
                              advanced: val,
                            }));
                            setActiveFilterMenu(null);
                          }}
                          className="px-3 py-1.5 text-[12px] text-white bg-[#3b82f6] hover:bg-[#3b82f6]/90 rounded-md transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col px-1 pb-1.5 border-b border-white/5 mb-1.5 gap-0.5 overflow-y-auto max-h-[300px]">
                  {(() => {
                    const allOptions = [
                      {
                        label: "Priority",
                        icon: Signal,
                        category: "priority",
                        subItems: [
                          {
                            label: "Urgent",
                            icon: Signal,
                            color: "text-[#e27a4a]",
                          },
                          {
                            label: "High",
                            icon: Signal,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "Medium",
                            icon: Signal,
                            color: "text-[#8a8f98]",
                          },
                          {
                            label: "Low",
                            icon: Signal,
                            color: "text-[#8a8f98]/50",
                          },
                          {
                            label: "No priority",
                            icon: Signal,
                            color: "text-[#8a8f98]/30",
                          },
                        ],
                      },
                      {
                        label: "Status",
                        icon: CircleDashed,
                        category: "status",
                        subItems: [
                          {
                            label: "Backlog",
                            icon: CircleDashed,
                            color: "text-[#e27a4a]",
                          },
                          {
                            label: "Planned",
                            icon: Hexagon,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "In Progress",
                            icon: Hexagon,
                            color: "text-[#f2c94c]",
                          },
                          {
                            label: "Completed",
                            icon: CheckCircle2,
                            color: "text-[#3b82f6]",
                          },
                          {
                            label: "Canceled",
                            icon: XCircle,
                            color: "text-[#8a8f98]",
                          },
                        ],
                      },
                      {
                        label: "Lead",
                        icon: User,
                        category: "lead",
                        subItems:
                          dynamicLeads.length > 0
                            ? dynamicLeads
                            : [
                                {
                                  label: "No leads",
                                  icon: User,
                                  color: "text-[#8a8f98]",
                                },
                              ],
                      },
                      {
                        label: "Labels",
                        icon: Tag,
                        category: "label",
                        subItems:
                          dynamicLabels.length > 0
                            ? dynamicLabels
                            : [
                                {
                                  label: "No labels",
                                  icon: Tag,
                                  color: "text-[#8a8f98]",
                                },
                              ],
                      },
                      {
                        label: "Health",
                        icon: Activity,
                        category: "health",
                        subItems: [
                          {
                            label: "On Track",
                            icon: Activity,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "At Risk",
                            icon: Activity,
                            color: "text-[#e27a4a]",
                          },
                          {
                            label: "Off Track",
                            icon: Activity,
                            color: "text-[#e24a4a]",
                          },
                        ],
                      },
                      {
                        label: "Dates",
                        icon: Calendar,
                        category: "dates",
                        subItems: [
                          {
                            label: "Start date",
                            icon: Calendar,
                            color: "text-[#e8e8e8]",
                            nestedItems: [
                              { label: "Today" },
                              { label: "Last 3 days" },
                              { label: "This week" },
                              { label: "This month" },
                              { label: "Last 3 months" },
                              { label: "Specific date..." },
                            ],
                          },
                          {
                            label: "Target date",
                            icon: Calendar,
                            color: "text-[#e8e8e8]",
                            nestedItems: [
                              { label: "Today" },
                              { label: "Last 3 days" },
                              { label: "This week" },
                              { label: "This month" },
                              { label: "Last 3 months" },
                              { label: "Specific date..." },
                            ],
                          },
                          {
                            label: "Created at",
                            icon: Calendar,
                            color: "text-[#e8e8e8]",
                            nestedItems: [
                              { label: "Today" },
                              { label: "Last 3 days" },
                              { label: "This week" },
                              { label: "This month" },
                              { label: "Last 3 months" },
                              { label: "Specific date..." },
                            ],
                          },
                          {
                            label: "Last modified",
                            icon: Calendar,
                            color: "text-[#e8e8e8]",
                            nestedItems: [
                              { label: "Today" },
                              { label: "Last 3 days" },
                              { label: "This week" },
                              { label: "This month" },
                              { label: "Last 3 months" },
                              { label: "Specific date..." },
                            ],
                          },
                          {
                            label: "Completion date",
                            icon: Calendar,
                            color: "text-[#e8e8e8]",
                            nestedItems: [
                              { label: "Today" },
                              { label: "Last 3 days" },
                              { label: "This week" },
                              { label: "This month" },
                              { label: "Last 3 months" },
                              { label: "Specific date..." },
                            ],
                          },
                        ],
                      },
                      {
                        label: "Members",
                        icon: Users,
                        category: "members",
                        subItems:
                          dynamicMembers.length > 0
                            ? dynamicMembers
                            : [
                                {
                                  label: "No members",
                                  icon: Users,
                                  color: "text-[#8a8f98]",
                                },
                              ],
                      },
                      {
                        label: "Creator",
                        icon: UserPen,
                        category: "creator",
                        subItems:
                          dynamicCreators.length > 0
                            ? dynamicCreators
                            : [
                                {
                                  label: "No creators",
                                  icon: UserPen,
                                  color: "text-[#8a8f98]",
                                },
                              ],
                      },
                      {
                        label: "Lead team",
                        icon: Contact,
                        category: "lead_team",
                        subItems: [
                          {
                            label: "Engineering",
                            icon: Contact,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "Design",
                            icon: Contact,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "Product",
                            icon: Contact,
                            color: "text-[#e8e8e8]",
                          },
                        ],
                      },
                      {
                        label: "Milestones",
                        icon: Diamond,
                        category: "milestones",
                        subItems: [
                          {
                            label: "Alpha Release",
                            icon: Diamond,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "Beta Launch",
                            icon: Diamond,
                            color: "text-[#e8e8e8]",
                          },
                          {
                            label: "App Store Submission",
                            icon: Diamond,
                            color: "text-[#e8e8e8]",
                          },
                        ],
                      },
                      {
                        label: "Specific project",
                        icon: Box,
                        category: "specific_project",
                        subItems: projects.map((p) => ({
                          label: p.name,
                          icon: Box,
                          color: "text-[#e8e8e8]",
                        })),
                      },
                    ];

                    const filterQuery = filterSearchTerm.trim().toLowerCase();

                    if (filterQuery) {
                      const matches = [];
                      allOptions.forEach((opt) => {
                        if (opt.subItems) {
                          opt.subItems.forEach((sub) => {
                            if (
                              sub.label.toLowerCase().includes(filterQuery) ||
                              opt.label.toLowerCase().includes(filterQuery)
                            ) {
                              matches.push({
                                ...sub,
                                category: opt.category,
                                categoryLabel: opt.label,
                                parentIcon: opt.icon,
                              });
                            }
                          });
                        }
                      });

                      if (matches.length === 0) {
                        return (
                          <div className="px-3 py-2 text-[12px] text-[#8a8f98]">
                            No results found
                          </div>
                        );
                      }

                      return matches.map((match, idx) => {
                        const valToToggle = match.actualValue || match.label;
                        const isSelected =
                          activeFilters[match.category]?.includes(valToToggle);
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              if (
                                !match.nestedItems &&
                                match.label !== "No leads" &&
                                match.label !== "No labels" &&
                                match.label !== "No members" &&
                                match.label !== "No creators"
                              ) {
                                e.stopPropagation();
                                toggleFilter(match.category, valToToggle);
                                setIsFilterOpen(false);
                                setFilterSearchTerm("");
                              }
                            }}
                            className={`flex flex-col items-start px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group ${
                              match.label === "No leads" ||
                              match.label === "No labels" ||
                              match.label === "No members" ||
                              match.label === "No creators" ||
                              match.nestedItems
                                ? "cursor-default opacity-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-[#8a8f98] font-medium uppercase mb-0.5 tracking-wider">
                              <match.parentIcon size={10} />
                              {match.categoryLabel}
                            </div>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? "bg-[#3b82f6] border-[#3b82f6]"
                                      : "bg-transparent border-white/10 group-hover:border-white/20"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={10} className="text-white" />
                                  )}
                                </div>
                                {match.user ? (
                                  <div
                                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        match.user.color || "#f26d78",
                                    }}
                                  >
                                    {match.user.avatar ||
                                      match.user.name?.charAt(0) ||
                                      "?"}
                                  </div>
                                ) : match.icon ? (
                                  <match.icon
                                    size={13}
                                    className={`${match.color || ""} flex-shrink-0`}
                                  />
                                ) : null}
                                <span className="whitespace-nowrap truncate">
                                  {match.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      });
                    }

                    return allOptions.map((item) => (
                      <div
                        key={item.label}
                        className="relative"
                        onMouseEnter={() => setActiveFilterMenu(item.label)}
                      >
                        <button className="flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 hover:text-white rounded-md w-full transition-colors group">
                          <div className="flex items-center gap-2.5">
                            <item.icon
                              size={14}
                              className="text-[#8a8f98] group-hover:text-[#e8e8e8]"
                            />
                            {item.label}
                          </div>
                          {item.subItems && (
                            <ChevronRight
                              size={12}
                              className="text-[#8a8f98] opacity-50 group-hover:opacity-100"
                            />
                          )}
                        </button>

                        {activeFilterMenu === item.label && item.subItems && (
                          <div className="absolute top-0 right-[calc(100%+8px)] min-w-[180px] w-max bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-1 z-[60] animate-in fade-in zoom-in-95 flex flex-col gap-0.5 before:absolute before:-right-[8px] before:top-0 before:w-[8px] before:h-full">
                            {item.category === "label" && (
                              <div className="px-1 py-1 pb-1.5 border-b border-white/5 mb-1">
                                <input
                                  type="text"
                                  placeholder="Search or add custom label..."
                                  value={labelSearchTerm}
                                  onChange={(e) =>
                                    setLabelSearchTerm(e.target.value)
                                  }
                                  className="w-full bg-[#2a2a2c] text-[#e8e8e8] placeholder:text-[#8a8f98] text-[12px] rounded-md px-2 py-1 outline-none border border-transparent focus:border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                            {item.subItems.map((subItem) => {
                              const valToToggle =
                                subItem.actualValue || subItem.label;
                              const isSelected =
                                activeFilters[item.category]?.includes(
                                  valToToggle,
                                );
                              return (
                                <div
                                  key={subItem.label}
                                  className="relative"
                                  onMouseEnter={() =>
                                    subItem.nestedItems &&
                                    setActiveNestedFilterMenu(subItem.label)
                                  }
                                >
                                  <button
                                    onClick={(e) => {
                                      if (
                                        !subItem.nestedItems &&
                                        subItem.label !== "No leads" &&
                                        subItem.label !== "No labels" &&
                                        subItem.label !== "No members" &&
                                        subItem.label !== "No creators"
                                      ) {
                                        e.stopPropagation();
                                        toggleFilter(
                                          item.category,
                                          valToToggle,
                                        );
                                      }
                                    }}
                                    className={`flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group ${
                                      subItem.label === "No leads" ||
                                      subItem.label === "No labels" ||
                                      subItem.label === "No members" ||
                                      subItem.label === "No creators"
                                        ? "cursor-default opacity-50"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${
                                          isSelected
                                            ? "bg-[#3b82f6] border-[#3b82f6]"
                                            : "bg-transparent border-white/10 group-hover:border-white/20"
                                        }`}
                                      >
                                        {isSelected && (
                                          <Check
                                            size={10}
                                            className="text-white"
                                          />
                                        )}
                                      </div>
                                      {subItem.user ? (
                                        <div
                                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0"
                                          style={{
                                            backgroundColor:
                                              subItem.user.color || "#f26d78",
                                          }}
                                        >
                                          {subItem.user.avatar ||
                                            subItem.user.name?.charAt(0) ||
                                            "?"}
                                        </div>
                                      ) : subItem.icon ? (
                                        <subItem.icon
                                          size={13}
                                          className={`${subItem.color || ""} flex-shrink-0`}
                                        />
                                      ) : null}
                                      <span className="whitespace-nowrap truncate">
                                        {subItem.label}
                                      </span>
                                    </div>
                                    {subItem.count && !subItem.nestedItems && (
                                      <span className="text-[#8a8f98] text-[11px] ml-3">
                                        {subItem.count}
                                      </span>
                                    )}
                                    {subItem.nestedItems && (
                                      <ChevronRight
                                        size={12}
                                        className="text-[#8a8f98] opacity-50 group-hover:opacity-100 flex-shrink-0 ml-3"
                                      />
                                    )}
                                  </button>

                                  {activeNestedFilterMenu === subItem.label &&
                                    subItem.nestedItems && (
                                      <div className="absolute top-0 right-[calc(100%+8px)] min-w-[200px] w-max bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-1 z-[70] animate-in fade-in zoom-in-95 flex flex-col gap-0.5 before:absolute before:-right-[8px] before:top-0 before:w-[8px] before:h-full">
                                        <div className="px-2 py-1.5 border-b border-white/5 mb-0.5">
                                          <input
                                            type="text"
                                            placeholder="Filter..."
                                            className="w-full bg-transparent text-[13px] text-white placeholder-[#8a8f98] outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        {subItem.nestedItems.map(
                                          (nestedItem) => {
                                            const isNestedSelected =
                                              activeFilters[
                                                item.category
                                              ]?.includes(nestedItem.label);
                                            return (
                                              <button
                                                key={nestedItem.label}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (
                                                    nestedItem.label ===
                                                    "Specific date..."
                                                  ) {
                                                    setCustomDateCategory(
                                                      subItem.label,
                                                    );
                                                    setIsCustomDateModalOpen(
                                                      true,
                                                    );
                                                    setIsFilterOpen(false);
                                                  } else {
                                                    toggleFilter(
                                                      item.category,
                                                      nestedItem.label,
                                                    );
                                                  }
                                                }}
                                                className="flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group"
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <div
                                                    className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${
                                                      isNestedSelected
                                                        ? "bg-[#3b82f6] border-[#3b82f6]"
                                                        : "bg-transparent border-white/10 group-hover:border-white/20"
                                                    }`}
                                                  >
                                                    {isNestedSelected && (
                                                      <Check
                                                        size={10}
                                                        className="text-white"
                                                      />
                                                    )}
                                                  </div>
                                                  <span className="truncate">
                                                    {nestedItem.label}
                                                  </span>
                                                </div>
                                                {nestedItem.count && (
                                                  <span className="text-[#8a8f98] text-[11px] ml-3">
                                                    {nestedItem.count}
                                                  </span>
                                                )}
                                              </button>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                <div className="flex flex-col px-1 pb-1.5 border-b border-white/5 mb-1.5 gap-0.5">
                  {[
                    {
                      label: "Title & summary",
                      icon: Feather,
                      category: "title_summary",
                      isCustomInput: true,
                      placeholder: "Filter by title & summary...",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setActiveFilterMenu(item.label)}
                    >
                      <button className="flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 hover:text-white rounded-md w-full transition-colors group">
                        <div className="flex items-center gap-2.5">
                          <item.icon
                            size={14}
                            className="text-[#8a8f98] group-hover:text-[#e8e8e8]"
                          />
                          {item.label}
                        </div>
                      </button>

                      {activeFilterMenu === item.label &&
                        item.isCustomInput && (
                          <div className="absolute top-0 right-[calc(100%+8px)] w-[280px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-3 z-[60] animate-in fade-in zoom-in-95 flex flex-col gap-3">
                            <div className="text-[13px] text-white font-medium">
                              {item.placeholder}
                            </div>
                            <input
                              type="text"
                              className="w-full bg-[#1c1c1e] border border-[#3b82f6] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3b82f6] shadow-sm transition-shadow"
                              autoFocus
                              defaultValue={
                                activeFilters[item.category]?.[0] || ""
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = e.target.value.trim();
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    [item.category]: val ? [val] : [],
                                  }));
                                  setActiveFilterMenu(null);
                                }
                              }}
                              id={`custom-input-${item.category}`}
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFilterMenu(null);
                                }}
                                className="px-3 py-1.5 text-[12px] text-[#e8e8e8] hover:bg-white/5 rounded-md transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const val = document
                                    .getElementById(
                                      `custom-input-${item.category}`,
                                    )
                                    ?.value.trim();
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    [item.category]: val ? [val] : [],
                                  }));
                                  setActiveFilterMenu(null);
                                }}
                                className="px-3 py-1.5 text-[12px] text-white bg-[#3b82f6] hover:bg-[#3b82f6]/90 rounded-md transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Options Panel Popover */}
            {isDisplayOptionsOpen && (
              <div
                ref={displayOptionsRef}
                className="absolute top-[calc(100%+16px)] right-0 w-[310px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-3"
              >
                <SegmentedControl
                  value={activeView}
                  onValueChange={setActiveView}
                  className="w-full bg-[#2c2d30] border border-white/5 rounded-lg"
                  options={[
                    {
                      value: "list",
                      label: "List",
                      accessory: (
                        <AlignJustify
                          size={14}
                          className="ml-1 text-[#8a8f98]"
                        />
                      ),
                    },
                    {
                      value: "board",
                      label: "Board",
                      accessory: (
                        <LayoutGrid size={14} className="ml-1 text-[#8a8f98]" />
                      ),
                    },
                    {
                      value: "timeline",
                      label: "Timeline",
                      accessory: (
                        <AlignLeft size={14} className="ml-1 text-[#8a8f98]" />
                      ),
                    },
                  ]}
                />

                <div className="px-1 flex flex-col gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[#8a8f98]">
                      {activeView === "board"
                        ? "Columns Grouping"
                        : activeView === "timeline"
                          ? "Row Grouping"
                          : "Grouping"}
                    </label>
                    <div className="relative">
                      <select
                        value={
                          currentViewConfig.grouping ||
                          currentViewConfig.columnsGrouping ||
                          "status"
                        }
                        onChange={(e) =>
                          updateViewSetting(
                            activeView,
                            activeView === "board"
                              ? "columnsGrouping"
                              : "grouping",
                            e.target.value,
                          )
                        }
                        className="bg-[#2c2d30] border border-transparent hover:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-white outline-none h-[26px] w-[130px] appearance-none cursor-pointer"
                      >
                        <option value="none">No grouping</option>
                        <option value="status">Status</option>
                        <option value="priority">Priority</option>
                        <option value="lead">Lead</option>
                        <option value="health">Health</option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] pointer-events-none"
                        size={13}
                      />
                    </div>
                  </div>

                  {activeView === "list" && (
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#8a8f98]">
                        Ordering
                      </label>
                      <div className="relative">
                        <select
                          value={currentViewConfig.ordering || "manual"}
                          onChange={(e) =>
                            updateViewSetting(
                              "list",
                              "ordering",
                              e.target.value,
                            )
                          }
                          className="bg-[#2c2d30] border border-transparent hover:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-white outline-none h-[26px] w-[130px] appearance-none cursor-pointer"
                        >
                          <option value="manual">Manual</option>
                          <option value="status">Status</option>
                          <option value="priority">Priority</option>
                        </select>
                        <ChevronDown
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] pointer-events-none"
                          size={13}
                        />
                      </div>
                    </div>
                  )}

                  {activeView === "board" && (
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#8a8f98]">
                        Swimlanes
                      </label>
                      <div className="relative">
                        <select
                          value={currentViewConfig.rowsSubgrouping || "none"}
                          onChange={(e) =>
                            updateViewSetting(
                              "board",
                              "rowsSubgrouping",
                              e.target.value,
                            )
                          }
                          className="bg-[#2c2d30] border border-transparent hover:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-white outline-none h-[26px] w-[130px] appearance-none cursor-pointer"
                        >
                          <option value="none">None</option>
                          <option value="lead">Lead</option>
                          <option value="priority">Priority</option>
                        </select>
                        <ChevronDown
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] pointer-events-none"
                          size={13}
                        />
                      </div>
                    </div>
                  )}

                  {activeView === "timeline" && (
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#8a8f98]">
                        Zoom Level
                      </label>
                      <div className="relative">
                        <select
                          value={currentViewConfig.zoom || "Quarter"}
                          onChange={(e) =>
                            updateViewSetting(
                              "timeline",
                              "zoom",
                              e.target.value,
                            )
                          }
                          className="bg-[#2c2d30] border border-transparent hover:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-white outline-none h-[26px] w-[130px] appearance-none cursor-pointer"
                        >
                          <option value="Year">Year</option>
                          <option value="Quarter">Quarter</option>
                          <option value="Month">Month</option>
                          <option value="Week">Week</option>
                        </select>
                        <ChevronDown
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] pointer-events-none"
                          size={13}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-1 flex flex-col gap-3 pb-3 border-b border-white/5">
                  {activeView !== "timeline" && (
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#8a8f98]">
                        Show closed projects
                      </label>
                      <div className="relative">
                        <select
                          value={currentViewConfig.showClosedProjects || "all"}
                          onChange={(e) =>
                            updateViewSetting(
                              activeView,
                              "showClosedProjects",
                              e.target.value,
                            )
                          }
                          className="bg-[#2c2d30] border border-transparent hover:border-white/10 rounded-md pl-2.5 pr-6 py-1 text-[12px] text-white outline-none h-[26px] w-[130px] appearance-none cursor-pointer"
                        >
                          <option value="all">All</option>
                          <option value="none">None</option>
                        </select>
                        <ChevronDown
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] pointer-events-none"
                          size={13}
                        />
                      </div>
                    </div>
                  )}

                  {activeView === "timeline" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#8a8f98]">
                          Show project list
                        </span>
                        <input
                          type="checkbox"
                          checked={!!currentViewConfig.showProjectList}
                          onChange={(e) =>
                            updateViewSetting(
                              "timeline",
                              "showProjectList",
                              e.target.checked,
                            )
                          }
                          className="rounded border-white/20 bg-white/5 text-[#6e8eeb] checked:bg-[#6e8eeb] focus:ring-0 w-3.5 h-3.5 cursor-pointer transition-colors"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#8a8f98]">
                          Show milestones
                        </span>
                        <input
                          type="checkbox"
                          checked={!!currentViewConfig.showMilestones}
                          onChange={(e) =>
                            updateViewSetting(
                              "timeline",
                              "showMilestones",
                              e.target.checked,
                            )
                          }
                          className="rounded border-white/20 bg-white/5 text-[#6e8eeb] checked:bg-[#6e8eeb] focus:ring-0 w-3.5 h-3.5 cursor-pointer transition-colors"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#8a8f98]">
                          Show dependencies
                        </span>
                        <input
                          type="checkbox"
                          checked={!!currentViewConfig.showDependencies}
                          onChange={(e) =>
                            updateViewSetting(
                              "timeline",
                              "showDependencies",
                              e.target.checked,
                            )
                          }
                          className="rounded border-white/20 bg-white/5 text-[#6e8eeb] checked:bg-[#6e8eeb] focus:ring-0 w-3.5 h-3.5 cursor-pointer transition-colors"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="px-1 flex flex-col gap-2">
                  <div className="text-[13px] font-medium text-[#e8e8e8] mb-0.5">
                    {activeView.charAt(0).toUpperCase() + activeView.slice(1)}{" "}
                    options
                  </div>
                  {activeView === "board" && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-[#8a8f98]">
                          Show empty columns
                        </span>
                        <button
                          onClick={() =>
                            updateViewSetting(
                              "board",
                              "showEmptyColumns",
                              !currentViewConfig.showEmptyColumns,
                            )
                          }
                          className={`w-7 h-4 rounded-full transition-colors flex items-center px-[2px] ${
                            currentViewConfig.showEmptyColumns
                              ? "bg-white/40"
                              : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white transition-transform ${
                              currentViewConfig.showEmptyColumns
                                ? "translate-x-3"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-[#8a8f98]">
                          Column backgrounds
                        </span>
                        <button
                          onClick={() =>
                            updateViewSetting(
                              "board",
                              "showColumnBackgrounds",
                              !currentViewConfig.showColumnBackgrounds,
                            )
                          }
                          className={`w-7 h-4 rounded-full transition-colors flex items-center px-[2px] ${
                            currentViewConfig.showColumnBackgrounds
                              ? "bg-white/40"
                              : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white transition-transform ${
                              currentViewConfig.showColumnBackgrounds
                                ? "translate-x-3"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}
                  <div className="text-[12px] font-medium text-[#8a8f98] mb-1.5">
                    Display properties
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(currentViewConfig.properties || {}).map(
                      ([propKey, isChecked]) => (
                        <button
                          key={propKey}
                          onClick={() => toggleProperty(activeView, propKey)}
                          className={`px-3 py-1 text-[11px] rounded-full transition-colors font-medium border ${
                            isChecked
                              ? "bg-white text-black border-transparent"
                              : "bg-transparent text-[#8a8f98] border-white/10 hover:bg-white/5 hover:text-[#e8e8e8]"
                          }`}
                        >
                          {propKey
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())
                            .replace(/_/g, " ")}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {isNonDefaultDisplay && (
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                    <button
                      onClick={resetToDefaults}
                      className="text-[12px] font-medium text-[#8a8f98] hover:text-[#e8e8e8] px-1"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setWorkspaceDefaultConfig(viewConfig)}
                      className="text-[12px] font-medium text-[#6e8eeb] hover:text-[#84a1f5] px-1"
                    >
                      Set default for everyone
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
