import { useState, useEffect, useMemo } from "react";

export const DEFAULT_VIEW_CONFIG = {
  activeView: "list",
  list: {
    grouping: "none",
    ordering: "manual",
    orderDirection: "asc",
    showClosedProjects: "all",
    properties: {
      id: true,
      health: true,
      priority: true,
      lead: true,
      due_date: true,
      issues: true,
      progress: true,
      status: false,
      members: false,
      start_date: false,
      labels: false,
      milestones: false,
      dependencies: false,
      summary: false,
    },
  },
  board: {
    columnsGrouping: "status",
    rowsSubgrouping: "none",
    ordering: "manual",
    showClosedProjects: "all",
    showEmptyColumns: true,
    showColumnBackgrounds: false,
    properties: {
      id: true,
      status: true,
      priority: true,
      health: true,
      lead: true,
      members: true,
      due_date: true,
      progress: true,
      labels: true,
    },
  },
  timeline: {
    grouping: "none",
    ordering: "start_date",
    showClosedProjects: "all",
    zoom: "Quarter",
    showProjectList: true,
    showWeekNumbers: true,
    showMilestones: true,
    showDependencies: true,
    properties: {
      id: true,
      status: true,
      priority: true,
      health: true,
      lead: true,
      due_date: true,
      progress: true,
    },
  },
};

export const STORAGE_KEY_CONFIG = "kriri_project_view_config";

export const loadViewConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!saved) return DEFAULT_VIEW_CONFIG;
    const parsed = JSON.parse(saved);
    return {
      activeView: parsed?.activeView || "list",
      list: {
        ...DEFAULT_VIEW_CONFIG.list,
        ...(parsed?.list || {}),
        properties: {
          ...DEFAULT_VIEW_CONFIG.list.properties,
          ...(parsed?.list?.properties || {}),
        },
      },
      board: {
        ...DEFAULT_VIEW_CONFIG.board,
        ...(parsed?.board || {}),
        properties: {
          ...DEFAULT_VIEW_CONFIG.board.properties,
          ...(parsed?.board?.properties || {}),
        },
      },
      timeline: {
        ...DEFAULT_VIEW_CONFIG.timeline,
        ...(parsed?.timeline || {}),
        properties: {
          ...DEFAULT_VIEW_CONFIG.timeline.properties,
          ...(parsed?.timeline?.properties || {}),
        },
      },
    };
  } catch {
    return DEFAULT_VIEW_CONFIG;
  }
};

export function useProjectFilters(projects) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewConfig, setViewConfig] = useState(loadViewConfig);
  const [workspaceDefaultConfig, setWorkspaceDefaultConfig] =
    useState(DEFAULT_VIEW_CONFIG);

  const [activeFilters, setActiveFilters] = useState({
    status: [],
    priority: [],
    lead: [],
    health: [],
    label: [],
    dates: [],
    members: [],
    creator: [],
    lead_team: [],
    milestones: [],
    title_summary: [],
    specific_project: [],
    advanced: "",
  });

  const toggleFilter = (category, value) => {
    setActiveFilters((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);
  const [activeNestedFilterMenu, setActiveNestedFilterMenu] = useState(null);
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customDateCategory, setCustomDateCategory] = useState("");
  const [customDateMode, setCustomDateMode] = useState("Quarter");
  const [customDateSelection, setCustomDateSelection] = useState("");
  const [customDateMonthOffset, setCustomDateMonthOffset] = useState(0);
  const [customDateModifier, setCustomDateModifier] = useState("on");
  const [customDateSearch, setCustomDateSearch] = useState("");
  const [labelSearchTerm, setLabelSearchTerm] = useState("");
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
  const [isDisplayOptionsOpen, setIsDisplayOptionsOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("KRIRI Workspace");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(viewConfig));
    } catch (err) {
      console.warn("Could not save view config to localStorage:", err);
    }
  }, [viewConfig]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        const matchesLead = p.lead?.name?.toLowerCase().includes(query);
        const matchesLabels = p.labels?.some((l) =>
          l.toLowerCase().includes(query),
        );
        if (!matchesName && !matchesDesc && !matchesLead && !matchesLabels)
          return false;
      }

      if (
        activeFilters.status.length > 0 &&
        !activeFilters.status.includes(p.status)
      )
        return false;
      if (
        activeFilters.priority.length > 0 &&
        !activeFilters.priority.includes(p.priority || "No priority")
      )
        return false;
      if (
        activeFilters.health.length > 0 &&
        !activeFilters.health.includes(p.health)
      )
        return false;
      if (
        activeFilters.lead.length > 0 &&
        (!p.lead || !activeFilters.lead.includes(p.lead.name))
      )
        return false;

      if (
        activeFilters.label &&
        activeFilters.label.length > 0 &&
        (!p.labels || !p.labels.some((l) => activeFilters.label.includes(l)))
      )
        return false;

      if (
        activeFilters.dates.length > 0 &&
        !activeFilters.dates.some(
          (year) => p.start_date?.includes(year) || p.due_date?.includes(year),
        )
      )
        return false;

      if (
        activeFilters.members.length > 0 &&
        (!p.members ||
          !p.members.some((m) => activeFilters.members.includes(m.name)))
      )
        return false;

      if (
        activeFilters.creator.length > 0 &&
        (!p.creator || !activeFilters.creator.includes(p.creator.name))
      )
        return false;

      if (
        activeFilters.lead_team.length > 0 &&
        (!p.lead_team || !activeFilters.lead_team.includes(p.lead_team))
      )
        return false;

      if (
        activeFilters.milestones.length > 0 &&
        (!p.milestones ||
          !p.milestones.some((m) => activeFilters.milestones.includes(m.name)))
      )
        return false;

      if (
        activeFilters.title_summary.length > 0 &&
        !activeFilters.title_summary.some(
          (term) => p.name?.includes(term) || p.description?.includes(term),
        )
      )
        return false;

      if (
        activeFilters.specific_project.length > 0 &&
        !activeFilters.specific_project.includes(p.name)
      )
        return false;

      if (activeFilters.advanced && activeFilters.advanced.trim() !== "") {
        const advQuery = activeFilters.advanced.toLowerCase();
        const regex = /(?:(\w+):(?:(["'])(.*?)\2|([^ ]+)))|([^ ]+)/g;
        let match;
        while ((match = regex.exec(advQuery)) !== null) {
          if (match[1]) {
            const key = match[1];
            const val = match[3] || match[4];
            if (key === "status" && p.status?.toLowerCase() !== val)
              return false;
            if (
              key === "priority" &&
              (p.priority || "No priority").toLowerCase() !== val &&
              !(val === "none" && !p.priority)
            )
              return false;
            if (key === "health" && p.health?.toLowerCase() !== val)
              return false;
            if (key === "lead" && p.lead?.name?.toLowerCase() !== val)
              return false;
          } else if (match[5]) {
            const part = match[5];
            if (
              !p.name?.toLowerCase().includes(part) &&
              !p.description?.toLowerCase().includes(part)
            ) {
              return false;
            }
          }
        }
      }

      const closedOption =
        viewConfig[viewConfig.activeView]?.showClosedProjects || "all";
      if (
        closedOption === "none" &&
        (p.status === "Completed" || p.status === "Canceled")
      ) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, activeFilters, viewConfig]);

  const groupProjects = (items, groupingDimension) => {
    if (!groupingDimension || groupingDimension === "none") {
      return { "All Projects": items };
    }

    const groups = {};
    items.forEach((project) => {
      let key = "Unassigned";
      if (groupingDimension === "status") key = project.status || "Backlog";
      else if (groupingDimension === "priority")
        key = project.priority || "No priority";
      else if (groupingDimension === "health")
        key = project.health || "No updates";
      else if (groupingDimension === "lead")
        key = project.lead?.name || "Unassigned";
      else if (groupingDimension === "labels") {
        if (project.labels && project.labels.length > 0)
          key = project.labels[0];
        else key = "No Labels";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(project);
    });

    return groups;
  };

  const sortProjects = (items, orderingKey, orderDir = "asc") => {
    return [...items].sort((a, b) => {
      let valA = a[orderingKey] ?? a.position ?? 0;
      let valB = b[orderingKey] ?? b.position ?? 0;

      if (orderingKey === "manual") {
        valA = a.position ?? 0;
        valB = b.position ?? 0;
      } else if (orderingKey === "priority") {
        const pMap = {
          Urgent: 4,
          High: 3,
          Medium: 2,
          Low: 1,
          "No priority": 0,
        };
        valA = pMap[a.priority] ?? 0;
        valB = pMap[b.priority] ?? 0;
      } else if (orderingKey === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      }

      if (valA < valB) return orderDir === "asc" ? -1 : 1;
      if (valA > valB) return orderDir === "asc" ? 1 : -1;
      return 0;
    });
  };

  const setActiveView = (view) => {
    setViewConfig((prev) => ({ ...prev, activeView: view }));
  };

  const updateViewSetting = (view, key, val) => {
    setViewConfig((prev) => ({
      ...prev,
      [view]: {
        ...prev[view],
        [key]: val,
      },
    }));
  };

  const toggleProperty = (view, propKey) => {
    setViewConfig((prev) => ({
      ...prev,
      [view]: {
        ...prev[view],
        properties: {
          ...prev[view].properties,
          [propKey]: !prev[view].properties[propKey],
        },
      },
    }));
  };

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const resetToDefaults = () => {
    setViewConfig(DEFAULT_VIEW_CONFIG);
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  };

  return {
    searchQuery,
    setSearchQuery,
    viewConfig,
    setViewConfig,
    workspaceDefaultConfig,
    setWorkspaceDefaultConfig,
    activeFilters,
    setActiveFilters,
    toggleFilter,
    isFilterOpen,
    setIsFilterOpen,
    activeFilterMenu,
    setActiveFilterMenu,
    activeNestedFilterMenu,
    setActiveNestedFilterMenu,
    isCustomDateModalOpen,
    setIsCustomDateModalOpen,
    customDateCategory,
    setCustomDateCategory,
    customDateMode,
    setCustomDateMode,
    customDateSelection,
    setCustomDateSelection,
    customDateMonthOffset,
    setCustomDateMonthOffset,
    customDateModifier,
    setCustomDateModifier,
    customDateSearch,
    setCustomDateSearch,
    labelSearchTerm,
    setLabelSearchTerm,
    filterSearchTerm,
    setFilterSearchTerm,
    isDisplayOptionsOpen,
    setIsDisplayOptionsOpen,
    isWorkspaceOpen,
    setIsWorkspaceOpen,
    selectedWorkspace,
    setSelectedWorkspace,
    collapsedGroups,
    setCollapsedGroups,
    toggleGroupCollapse,
    filteredProjects,
    groupProjects,
    sortProjects,
    setActiveView,
    updateViewSetting,
    toggleProperty,
    resetToDefaults,
  };
}
