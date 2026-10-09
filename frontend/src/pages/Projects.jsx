import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { Loupe } from '@lucasmarkes/hairline/react';
import {
  Plus,
  LayoutGrid,
  FileText,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Settings,
  Settings2,
  PanelRight,
  Layers,
  MoreHorizontal,
  CheckSquare,
  Compass,
  AlignJustify,
  AlignLeft,
  Sparkles,
  ListFilter,
  CircleDashed,
  Signal,
  Tag,
  User,
  Activity,
  Contact,
  Users,
  UserPen,
  Umbrella,
  Diamond,
  Flag,
  File,
  Feather,
  Box,
  Hexagon,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Edit2,
  Network,
  Link2,
  Sidebar,
  Layout
} from "lucide-react";
import { api } from "../lib/api";
import { ProjectsEmptyIcon } from "../components/EmptyStateIcons";
import CreateProjectModal from "../components/CreateProjectModal";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Button } from "@/registry/components/button/button";
import { Tabs, TabsList, TabsTrigger } from "@/registry/components/tabs/tabs";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import DropdownMenu from "@/registry/components/dropdown-menu/dropdown-menu";
import { Progress } from "@/registry/components/progress/progress";
import { Badge } from "@/registry/components/badge/badge";
import { AvatarGroup } from "@/registry/components/avatar-group/avatar-group";
import PriorityPicker, { getPriorityIcon } from "../components/PriorityPicker";
import ConfirmModal from '../components/ConfirmModal';
import LeadPicker from "../components/LeadPicker";
import DatePicker from "../components/DatePicker";
import ActionTooltip from "../components/ActionTooltip";
import StatusPicker, { getStatusIcon } from "../components/StatusPicker";
import HealthPicker, { getHealthIcon } from "../components/HealthPicker";
import ProgressPicker from "../components/ProgressPicker";
import LabelPicker from "../components/LabelPicker";
import MemberPicker from "../components/MemberPicker";
import PickerWrapper from "../components/PickerWrapper";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";
import { useSocket } from "../contexts/SocketContext";


import ListViewRenderer from "../components/projects/ListViewRenderer";
import BoardViewRenderer from "../components/projects/BoardViewRenderer";
import TimelineViewRenderer from "../components/projects/TimelineViewRenderer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// --- DEFAULT VIEW CONFIGURATION ---
const DEFAULT_VIEW_CONFIG = {
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

const STORAGE_KEY_CONFIG = "kriri_project_view_config";

// Safe Config Merger to prevent null key exceptions
const loadViewConfig = () => {
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

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { organization } = useOrganization();
  const userName = user?.fullName || "User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "user@example.com";

  // --- STATE ---
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const canManageProjects = ['Owner', 'Admin', 'Project Manager', 'Member', 'Team Lead'].includes(currentUserRole) || !organization;

  useEffect(() => {
    const fetchRole = async () => {
      if (!organization) {
        setCurrentUserRole('Owner');
        return;
      }
      try {
        const response = await api.get(`/workspaces/${organization.id}/members`);
        const members = Array.isArray(response) ? response : response.data?.members || [];
        const currentMember = members.find(m => m.email === user?.primaryEmailAddress?.emailAddress);
        if (currentMember) setCurrentUserRole(currentMember.role);
      } catch (err) {
        console.error("Failed to fetch role", err);
      }
    };
    if (user) {
      fetchRole();
    }
  }, [organization, user]);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, projectId: null });
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);
  const [commandPaletteState, setCommandPaletteState] = useState(null);
  const [commandPaletteSearch, setCommandPaletteSearch] = useState("");
  const [commandPaletteIndex, setCommandPaletteIndex] = useState(0);
  const handleBulkUpdate = async (field, value) => {
    try {
      await Promise.all(selectedProjects.map((id) => handleUpdateProject(id, { [field]: value })));
      setIsBulkActionMenuOpen(false);
      setCommandPaletteState(null);
      setSelectedProjects([]); // clear selection
    } catch (err) {
      console.error("Bulk update failed", err);
    }
  };

  const keyBuffer = useRef("");
  const keyTimeout = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Modal keyboard navigation is handled by the input's onKeyDown handler

      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        if (!isBulkActionMenuOpen) return;
      }

      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !isBulkActionMenuOpen) {
        e.preventDefault();
        setIsCreateModalOpen(true);
        return;
      }

      if (selectedProjects.length > 0 && !isBulkActionMenuOpen) {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          const key = e.key.toLowerCase();
          
          if (key === 'd' && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState('target_date');
            return;
          }
          if (key === 'd' && e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState('start_date');
            return;
          }
          if (key === 's' && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState('status');
            return;
          }
          if (key === 'p' && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState('priority');
            return;
          }
          if (key === 'l' && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState('labels');
            return;
          }
          if (key === 'r' && e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState('rename');
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(keyTimeout.current);
    };
  }, [selectedProjects, setIsCreateModalOpen, isBulkActionMenuOpen]);
  const [searchQuery, setSearchQuery] = useState("");

  // View & Filter Configurations
  const [viewConfig, setViewConfig] = useState(loadViewConfig);
  const [workspaceDefaultConfig, setWorkspaceDefaultConfig] = useState(DEFAULT_VIEW_CONFIG);

  // Filter State
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

  // Popover Toggle States
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

  // Collapsed Groups State
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Hovered Project Tooltip for Timeline
  const [hoveredProject, setHoveredProject] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Refs for click outside
  const filterRef = useRef(null);
  const displayOptionsRef = useRef(null);
  const workspaceRef = useRef(null);
  const timelineScrollRef = useRef(null);

  // Drag State for Board / Manual List
  const [draggedProject, setDraggedProject] = useState(null);
  
  // Inline Pickers State
  const [activePicker, setActivePicker] = useState({ type: null, projectId: null });
  // --- PERSIST CONFIGURATION ---
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(viewConfig));
    } catch (err) {
      console.warn("Could not save view config to localStorage:", err);
    }
  }, [viewConfig]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleProjectCreated = (newProject) => {
      setProjects((prev) => {
        // Prevent duplicate addition
        if (prev.some(p => p.id === newProject.id)) return prev;
        return [newProject, ...prev];
      });
    };

    const handleProjectUpdated = (updatedProject) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p))
      );
    };

    const handleProjectDeleted = ({ id }) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    };

    socket.on('PROJECT_CREATED', handleProjectCreated);
    socket.on('PROJECT_UPDATED', handleProjectUpdated);
    socket.on('PROJECT_DELETED', handleProjectDeleted);

    return () => {
      socket.off('PROJECT_CREATED', handleProjectCreated);
      socket.off('PROJECT_UPDATED', handleProjectUpdated);
      socket.off('PROJECT_DELETED', handleProjectDeleted);
    };
  }, [socket]);

  // --- FETCH PROJECTS FROM API ---
  useEffect(() => {
    setLoading(true);
    api
      .get("/projects")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enriched = data.map((p, idx) => ({
            ...p,
            id: p.id,
            name: p.name || `Project ${idx + 1}`,
            status: p.status || "Planned",
            priority: p.priority || "No priority",
            health: p.health || "No updates",
            start_date: p.start_date || null,
            due_date: p.due_date || null,
            progress: p.progress ?? 0,
            position: p.position ?? idx + 1,
            members: p.members || [],
            labels: p.labels || [],
            milestones: p.milestones || [],
            dependencies: p.dependencies || [],
          }));
          setProjects(enriched);
        } else {
          setProjects([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn(
          "API get projects failed:",
          err,
        );
        setProjects([]);
        setLoading(false);
      });
  }, []);

  // Handle Close Popovers on Click Outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
        setActiveFilterMenu(null);
        setActiveNestedFilterMenu(null);
        setFilterSearchTerm("");
        setLabelSearchTerm("");
      }
      if (
        displayOptionsRef.current &&
        !displayOptionsRef.current.contains(e.target)
      )
        setIsDisplayOptionsOpen(false);
      if (workspaceRef.current && !workspaceRef.current.contains(e.target))
        setIsWorkspaceOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MUTATION HANDLERS ---
  const handleUpdateProject = async (projectId, updatedFields) => {
    if (!canManageProjects) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, ...updatedFields, updated_at: new Date().toISOString() }
          : p,
      ),
    );
    try {
      await api.put(`/projects/${projectId}`, updatedFields);
    } catch (err) {
      console.warn("API update failed, state preserved locally:", err);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    if (!canManageProjects) return;
    if (e) e.stopPropagation();
    setConfirmModal({ isOpen: true, projectId });
  };

  const confirmDeleteProject = async () => {
    const projectId = confirmModal.projectId;
    setConfirmModal({ isOpen: false, projectId: null });
    if (!projectId) return;

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    try {
      await api.delete(`/projects/${projectId}`);
    } catch (err) {
      console.warn("API delete failed, removed locally:", err);
    }
  };

  const handleCreateProject = (newProject) => {
    const enriched = {
      ...newProject,
      name: newProject.name,
      description: newProject.description || "",
      status: newProject.status || "Planned",
      priority: newProject.priority || "Medium",
      health: newProject.health || "On Track",
      lead: newProject.lead || {
        id: "usr-1",
        name: userName,
        avatar: userName[0]?.toUpperCase() || "C",
      },
      members: newProject.members || [
        {
          id: "usr-1",
          name: userName,
          avatar: userName[0]?.toUpperCase() || "C",
        },
      ],
      start_date:
        newProject.start_date || new Date().toISOString().split("T")[0],
      due_date:
        newProject.due_date ||
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      progress: 0,
      labels: newProject.labels || [],
      milestones: newProject.milestones || [],
      dependencies: [],
      position: newProject.position || projects.length + 1,
      created_at: newProject.created_at || new Date().toISOString(),
      updated_at: newProject.updated_at || new Date().toISOString(),
    };
    setProjects((prev) => {
      // Prevent duplicate addition in case socket got here first
      if (prev.some(p => p.id === enriched.id)) return prev;
      return [enriched, ...prev];
    });
  };

  // --- FILTERED AND SORTED DATASET ---
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
        activeFilters.label && activeFilters.label.length > 0 &&
        (!p.labels || !p.labels.some(l => activeFilters.label.includes(l)))
      )
        return false;

      if (
        activeFilters.dates.length > 0 &&
        !activeFilters.dates.some(year => p.start_date?.includes(year) || p.due_date?.includes(year))
      )
        return false;

      if (
        activeFilters.members.length > 0 &&
        (!p.members || !p.members.some(m => activeFilters.members.includes(m.name)))
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
        (!p.milestones || !p.milestones.some(m => activeFilters.milestones.includes(m.name)))
      )
        return false;

      if (
        activeFilters.title_summary.length > 0 &&
        !activeFilters.title_summary.some(term => p.name?.includes(term) || p.description?.includes(term))
      )
        return false;

      if (
        activeFilters.specific_project.length > 0 &&
        !activeFilters.specific_project.includes(p.name)
      )
        return false;

      if (activeFilters.advanced && activeFilters.advanced.trim() !== "") {
        const advQuery = activeFilters.advanced.toLowerCase();
        // Custom simple logic for advanced filter (e.g. status:"in progress" priority:urgent)
        const regex = /(?:(\w+):(?:(["'])(.*?)\2|([^ ]+)))|([^ ]+)/g;
        let match;
        while ((match = regex.exec(advQuery)) !== null) {
          if (match[1]) {
            const key = match[1];
            const val = match[3] || match[4]; // value inside quotes or without quotes
            if (key === "status" && p.status?.toLowerCase() !== val) return false;
            if (key === "priority" && (p.priority || "No priority").toLowerCase() !== val && !(val === "none" && !p.priority)) return false;
            if (key === "health" && p.health?.toLowerCase() !== val) return false;
            if (key === "lead" && p.lead?.name?.toLowerCase() !== val) return false;
          } else if (match[5]) {
            // fallback generic search
            const part = match[5];
            if (!p.name?.toLowerCase().includes(part) && !p.description?.toLowerCase().includes(part)) {
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

  // Helper: Grouping projects safely
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

  // Helper: Ordering projects
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


  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#8a8f98]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading KRIRI Projects...</span>
        </div>
      </div>
    );
  }

  const activeView = viewConfig.activeView || "list";
  const currentViewConfig = viewConfig[activeView] || workspaceDefaultConfig[activeView];
  const isNonDefaultDisplay =
    JSON.stringify(currentViewConfig) !==
    JSON.stringify(workspaceDefaultConfig[activeView]);

  const uniqueLeadsMap = new Map();
  const uniqueMembersMap = new Map();
  const uniqueCreatorsMap = new Map();
  const uniqueLabelsSet = new Set();
  
  projects.forEach(p => {
    if (p.lead) uniqueLeadsMap.set(p.lead.id, p.lead);
    if (p.creator) uniqueCreatorsMap.set(p.creator.id, p.creator);
    if (p.members) p.members.forEach(m => uniqueMembersMap.set(m.id, m));
    if (p.labels) p.labels.forEach(l => uniqueLabelsSet.add(l));
  });

  const userColors = ['#f26d78', '#3b82f6', '#f2c94c', '#22c55e', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];
  const dynamicLeads = Array.from(uniqueLeadsMap.values()).map((u, i) => ({ label: u.name, user: { ...u, color: u.color || userColors[i % userColors.length] } }));
  const dynamicMembers = Array.from(uniqueMembersMap.values()).map((u, i) => ({ label: u.name, user: { ...u, color: u.color || userColors[i % userColors.length] } }));
  const dynamicCreators = Array.from(uniqueCreatorsMap.values()).map((u, i) => ({ label: u.name, user: { ...u, color: u.color || userColors[i % userColors.length] } }));
  
  const filteredLabels = Array.from(uniqueLabelsSet).filter(l => l.toLowerCase().includes(labelSearchTerm.toLowerCase()));
  const dynamicLabels = filteredLabels.map(l => ({ label: l, icon: Tag, color: "text-[#e8e8e8]" }));
  
  if (labelSearchTerm && !filteredLabels.some(l => l.toLowerCase() === labelSearchTerm.toLowerCase())) {
    dynamicLabels.push({ label: `Add "${labelSearchTerm}"`, actualValue: labelSearchTerm, icon: Tag, color: "text-[#3b82f6]", isCustom: true });
  }

  return (
    <div className="w-full flex flex-col h-full min-h-0 min-w-0 animate-in fade-in duration-300 select-none text-[#e8e8e8]">
      {/* 1. TOP TOOLBAR & CONTROLS */}
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
              onClick={() => {
                /* Toggle scope menu */
              }}
              className="text-[12.5px] rounded-full h-[28px] px-3 bg-white/[0.04] hover:bg-white/[0.08] shadow-sm border-0"
            >
              <span>All projects</span>
              <Layers size={13} className="text-[#8a8f98]" />
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* View Options Menu (Filter / Display) */}
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
                className={`flex-shrink-0 w-[28px] h-[28px] rounded-full p-0 flex items-center justify-center ${isFilterOpen ? "bg-white/[0.1] text-white" : "bg-white/[0.04] text-[#8a8f98] hover:text-[#e8e8e8]"}`}
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
                className={`flex-shrink-0 relative w-[28px] h-[28px] rounded-full p-0 flex items-center justify-center ${isDisplayOptionsOpen ? "bg-white/[0.1] text-white" : "bg-white/[0.04] text-[#8a8f98] hover:text-[#e8e8e8]"}`}
              >
                <Settings2 size={13} />
                {isNonDefaultDisplay && <div className="absolute top-[3px] right-[3px] w-[5px] h-[5px] bg-[#3b82f6] rounded-full ring-[2px] ring-[#1a1b1e]" />}
              </Button>

            {/* Filter Menu Dropdown */}
            {isFilterOpen && (
              <div
                ref={filterRef}
                className="absolute top-[calc(100%+16px)] right-0 w-[240px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
              >
                {/* Search Input */}
                <div className="px-2 pb-2 border-b border-white/5 mb-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Add Filter..."
                      value={filterSearchTerm}
                      onChange={(e) => setFilterSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const term = filterSearchTerm.trim().toLowerCase();
                          if (term) {
                            // Let's add it to advanced search string or generic searchQuery?
                            // Best: add it to generic search query if it doesn't perfectly match a drop-down.
                            // The user wants filtering by text.
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

                {/* Advanced filter */}
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
                       <div className="text-[13px] text-white font-medium">Advanced filter</div>
                       <input
                         type="text"
                         className="w-full bg-[#1c1c1e] border border-[#3b82f6] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3b82f6] shadow-sm transition-shadow"
                         placeholder="e.g. is:open priority:high"
                         autoFocus
                         defaultValue={activeFilters.advanced || ""}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             const val = e.target.value;
                             setActiveFilters(prev => ({ ...prev, advanced: val }));
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
                             const val = document.getElementById('advanced-filter-input').value;
                             setActiveFilters(prev => ({ ...prev, advanced: val }));
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

                {/* Main options list tailored to app */}
                <div className="flex flex-col px-1 pb-1.5 border-b border-white/5 mb-1.5 gap-0.5 overflow-y-auto max-h-[300px]">
                  {(() => {
                    const allOptions = [
                      { label: "Priority", icon: Signal, category: "priority", subItems: [
                        { label: "Urgent", icon: Signal, color: "text-[#e27a4a]" },
                        { label: "High", icon: Signal, color: "text-[#e8e8e8]" },
                        { label: "Medium", icon: Signal, color: "text-[#8a8f98]" },
                        { label: "Low", icon: Signal, color: "text-[#8a8f98]/50" },
                        { label: "No priority", icon: Signal, color: "text-[#8a8f98]/30" }
                      ]},
                      { label: "Status", icon: CircleDashed, category: "status", subItems: [
                        { label: "Backlog", icon: CircleDashed, color: "text-[#e27a4a]" },
                        { label: "Planned", icon: Hexagon, color: "text-[#e8e8e8]" },
                        { label: "In Progress", icon: Hexagon, color: "text-[#f2c94c]" },
                        { label: "Completed", icon: CheckCircle2, color: "text-[#3b82f6]" },
                        { label: "Canceled", icon: XCircle, color: "text-[#8a8f98]" },
                      ]},
                      { label: "Lead", icon: User, category: "lead", subItems: dynamicLeads.length > 0 ? dynamicLeads : [{label: "No leads", icon: User, color: "text-[#8a8f98]"}] },
                      { label: "Labels", icon: Tag, category: "label", subItems: dynamicLabels.length > 0 ? dynamicLabels : [{label: "No labels", icon: Tag, color: "text-[#8a8f98]"}] },
                      { label: "Health", icon: Activity, category: "health", subItems: [
                        { label: "On Track", icon: Activity, color: "text-[#e8e8e8]" },
                        { label: "At Risk", icon: Activity, color: "text-[#e27a4a]" },
                        { label: "Off Track", icon: Activity, color: "text-[#e24a4a]" }
                      ]},
                      { label: "Dates", icon: Calendar, category: "dates", subItems: [
                        { label: "Start date", icon: Calendar, color: "text-[#e8e8e8]", nestedItems: [
                          { label: "Today" },
                          { label: "Last 3 days" },
                          { label: "This week" },
                          { label: "This month" },
                          { label: "Last 3 months" },
                          { label: "Specific date..." },
                        ]},
                        { label: "Target date", icon: Calendar, color: "text-[#e8e8e8]", nestedItems: [
                          { label: "Today" },
                          { label: "Last 3 days" },
                          { label: "This week" },
                          { label: "This month" },
                          { label: "Last 3 months" },
                          { label: "Specific date..." },
                        ]},
                        { label: "Created at", icon: Calendar, color: "text-[#e8e8e8]", nestedItems: [
                          { label: "Today" },
                          { label: "Last 3 days" },
                          { label: "This week" },
                          { label: "This month" },
                          { label: "Last 3 months" },
                          { label: "Specific date..." },
                        ]},
                        { label: "Last modified", icon: Calendar, color: "text-[#e8e8e8]", nestedItems: [
                          { label: "Today" },
                          { label: "Last 3 days" },
                          { label: "This week" },
                          { label: "This month" },
                          { label: "Last 3 months" },
                          { label: "Specific date..." },
                        ]},
                        { label: "Completion date", icon: Calendar, color: "text-[#e8e8e8]", nestedItems: [
                          { label: "Today" },
                          { label: "Last 3 days" },
                          { label: "This week" },
                          { label: "This month" },
                          { label: "Last 3 months" },
                          { label: "Specific date..." },
                        ]},
                      ]},
                      { label: "Members", icon: Users, category: "members", subItems: dynamicMembers.length > 0 ? dynamicMembers : [{label: "No members", icon: Users, color: "text-[#8a8f98]"}] },
                      { label: "Creator", icon: UserPen, category: "creator", subItems: dynamicCreators.length > 0 ? dynamicCreators : [{label: "No creators", icon: UserPen, color: "text-[#8a8f98]"}] },
                      { label: "Lead team", icon: Contact, category: "lead_team", subItems: [
                        { label: "Engineering", icon: Contact, color: "text-[#e8e8e8]" },
                        { label: "Design", icon: Contact, color: "text-[#e8e8e8]" },
                        { label: "Product", icon: Contact, color: "text-[#e8e8e8]" }
                      ]},
                      { label: "Milestones", icon: Diamond, category: "milestones", subItems: [
                        { label: "Alpha Release", icon: Diamond, color: "text-[#e8e8e8]" },
                        { label: "Beta Launch", icon: Diamond, color: "text-[#e8e8e8]" },
                        { label: "App Store Submission", icon: Diamond, color: "text-[#e8e8e8]" }
                      ]},
                      { label: "Specific project", icon: Box, category: "specific_project", subItems: projects.map(p => ({
                        label: p.name, icon: Box, color: "text-[#e8e8e8]"
                      }))},
                    ];

                    const searchQuery = filterSearchTerm.trim().toLowerCase();

                    if (searchQuery) {
                      // Flatten the structure for searching
                      const matches = [];
                      allOptions.forEach(opt => {
                        if (opt.subItems) {
                          opt.subItems.forEach(sub => {
                            if (sub.label.toLowerCase().includes(searchQuery) || opt.label.toLowerCase().includes(searchQuery)) {
                              matches.push({ ...sub, category: opt.category, categoryLabel: opt.label, parentIcon: opt.icon });
                            }
                          });
                        }
                      });

                      if (matches.length === 0) {
                        return <div className="px-3 py-2 text-[12px] text-[#8a8f98]">No results found</div>;
                      }

                      return matches.map((match, idx) => {
                        const valToToggle = match.actualValue || match.label;
                        const isSelected = activeFilters[match.category]?.includes(valToToggle);
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              if (!match.nestedItems && match.label !== "No leads" && match.label !== "No labels" && match.label !== "No members" && match.label !== "No creators") {
                                e.stopPropagation();
                                toggleFilter(match.category, valToToggle);
                                setIsFilterOpen(false);
                                setFilterSearchTerm("");
                              }
                            }}
                            className={`flex flex-col items-start px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group ${
                              (match.label === "No leads" || match.label === "No labels" || match.label === "No members" || match.label === "No creators" || match.nestedItems) ? "cursor-default opacity-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-[#8a8f98] font-medium uppercase mb-0.5 tracking-wider">
                                <match.parentIcon size={10} />
                                {match.categoryLabel}
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-transparent border-white/10 group-hover:border-white/20'}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  {match.user ? (
                                    <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0`} style={{ backgroundColor: match.user.color || '#f26d78' }}>
                                      {match.user.avatar || match.user.name?.charAt(0) || '?'}
                                    </div>
                                  ) : match.icon ? (
                                    <match.icon size={13} className={`${match.color || ''} flex-shrink-0`} />
                                  ) : null}
                                  <span className="whitespace-nowrap truncate">{match.label}</span>
                                </div>
                            </div>
                          </button>
                        );
                      });
                    }

                    // Not searching, render standard categories
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
                                  onChange={(e) => setLabelSearchTerm(e.target.value)}
                                  className="w-full bg-[#2a2a2c] text-[#e8e8e8] placeholder:text-[#8a8f98] text-[12px] rounded-md px-2 py-1 outline-none border border-transparent focus:border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                            {item.subItems.map((subItem) => {
                              const valToToggle = subItem.actualValue || subItem.label;
                              const isSelected = activeFilters[item.category]?.includes(valToToggle);
                              return (
                                <div
                                  key={subItem.label}
                                  className="relative"
                                  onMouseEnter={() => subItem.nestedItems && setActiveNestedFilterMenu(subItem.label)}
                                >
                                  <button
                                    onClick={(e) => {
                                      if (!subItem.nestedItems && subItem.label !== "No leads" && subItem.label !== "No labels" && subItem.label !== "No members" && subItem.label !== "No creators") {
                                        e.stopPropagation();
                                        toggleFilter(item.category, valToToggle);
                                      }
                                    }}
                                    className={`flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group ${
                                      (subItem.label === "No leads" || subItem.label === "No labels" || subItem.label === "No members" || subItem.label === "No creators") ? "cursor-default opacity-50" : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-transparent border-white/10 group-hover:border-white/20'}`}>
                                        {isSelected && <Check size={10} className="text-white" />}
                                      </div>
                                      {subItem.user ? (
                                        <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0`} style={{ backgroundColor: subItem.user.color || '#f26d78' }}>
                                          {subItem.user.avatar || subItem.user.name?.charAt(0) || '?'}
                                        </div>
                                      ) : subItem.icon ? (
                                        <subItem.icon size={13} className={`${subItem.color || ''} flex-shrink-0`} />
                                      ) : null}
                                      <span className="whitespace-nowrap truncate">{subItem.label}</span>
                                    </div>
                                    {subItem.count && !subItem.nestedItems && <span className="text-[#8a8f98] text-[11px] ml-3">{subItem.count}</span>}
                                    {subItem.nestedItems && (
                                      <ChevronRight size={12} className="text-[#8a8f98] opacity-50 group-hover:opacity-100 flex-shrink-0 ml-3" />
                                    )}
                                  </button>
                                  
                                  {activeNestedFilterMenu === subItem.label && subItem.nestedItems && (
                                    <div className="absolute top-0 right-[calc(100%+8px)] min-w-[200px] w-max bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-1 z-[70] animate-in fade-in zoom-in-95 flex flex-col gap-0.5 before:absolute before:-right-[8px] before:top-0 before:w-[8px] before:h-full">
                                      <div className="px-2 py-1.5 border-b border-white/5 mb-0.5">
                                        <input
                                          type="text"
                                          placeholder="Filter..."
                                          className="w-full bg-transparent text-[13px] text-white placeholder-[#8a8f98] outline-none"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      {subItem.nestedItems.map((nestedItem) => {
                                        const isNestedSelected = activeFilters[item.category]?.includes(nestedItem.label);
                                        return (
                                          <button
                                            key={nestedItem.label}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (nestedItem.label === "Specific date...") {
                                                setCustomDateCategory(subItem.label);
                                                setIsCustomDateModalOpen(true);
                                                setIsFilterOpen(false);
                                              } else {
                                                toggleFilter(item.category, nestedItem.label);
                                              }
                                            }}
                                            className="flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group"
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <div className={`flex-shrink-0 w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${isNestedSelected ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-transparent border-white/10 group-hover:border-white/20'}`}>
                                                {isNestedSelected && <Check size={10} className="text-white" />}
                                              </div>
                                              <span className="truncate">{nestedItem.label}</span>
                                            </div>
                                            {nestedItem.count && <span className="text-[#8a8f98] text-[11px] ml-3">{nestedItem.count}</span>}
                                          </button>
                                        );
                                      })}
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
                    { label: "Title & summary", icon: Feather, category: "title_summary", isCustomInput: true, placeholder: "Filter by title & summary..." },
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
                        {item.subItems && (
                          <ChevronRight
                            size={12}
                            className="text-[#8a8f98] opacity-50 group-hover:opacity-100"
                          />
                        )}
                      </button>

                      {activeFilterMenu === item.label && item.subItems && (
                        <div className="absolute top-0 right-[calc(100%+8px)] w-[180px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-1 z-[60] animate-in fade-in zoom-in-95 flex flex-col gap-0.5">
                          {item.subItems.map((subItem) => {
                            const isSelected = activeFilters[item.category]?.includes(subItem.label);
                            return (
                              <button
                                key={subItem.label}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFilter(item.category, subItem.label);
                                }}
                                className="flex items-center justify-between px-2.5 py-1.5 text-[13px] text-[#e8e8e8] hover:bg-white/5 rounded-md w-full transition-colors group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-transparent border-white/10 group-hover:border-white/20'}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  <subItem.icon size={13} className={subItem.color} />
                                  {subItem.label}
                                </div>
                                {subItem.count && <span className="text-[#8a8f98] text-[11px]">{subItem.count}</span>}
                              </button>
                            );
                          })}
                            </div>
                      )}

                      {activeFilterMenu === item.label && item.isCustomInput && (
                        <div className="absolute top-0 right-[calc(100%+8px)] w-[280px] bg-[#1c1c1e] border border-white/5 rounded-xl shadow-2xl p-3 z-[60] animate-in fade-in zoom-in-95 flex flex-col gap-3">
                           <div className="text-[13px] text-white font-medium">{item.placeholder}</div>
                           <input
                             type="text"
                             className="w-full bg-[#1c1c1e] border border-[#3b82f6] rounded-md px-3 py-1.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3b82f6] shadow-sm transition-shadow"
                             autoFocus
                             defaultValue={activeFilters[item.category]?.[0] || ""}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 const val = e.target.value.trim();
                                 setActiveFilters(prev => ({
                                   ...prev,
                                   [item.category]: val ? [val] : []
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
                                 const val = document.getElementById(`custom-input-${item.category}`)?.value.trim();
                                 setActiveFilters(prev => ({
                                   ...prev,
                                   [item.category]: val ? [val] : []
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
                  {/* Segmented Control */}
                  <SegmentedControl
                    value={activeView}
                    onValueChange={setActiveView}
                    className="w-full bg-[#2c2d30] border border-white/5 rounded-lg"
                    options={[
                      { value: "list", label: "List", accessory: <AlignJustify size={14} className="ml-1 text-[#8a8f98]" /> },
                      { value: "board", label: "Board", accessory: <LayoutGrid size={14} className="ml-1 text-[#8a8f98]" /> },
                      { value: "timeline", label: "Timeline", accessory: <AlignLeft size={14} className="ml-1 text-[#8a8f98]" /> },
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
                            value={
                              currentViewConfig.showClosedProjects || "all"
                            }
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
                              currentViewConfig.showEmptyColumns ? "bg-white/40" : "bg-white/10"
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                currentViewConfig.showEmptyColumns ? "translate-x-3" : "translate-x-0"
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
                              currentViewConfig.showColumnBackgrounds ? "bg-white/40" : "bg-white/10"
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                currentViewConfig.showColumnBackgrounds ? "translate-x-3" : "translate-x-0"
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

                  {/* Footer */}
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

      {/* MAIN CONTENT VIEWS */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
              <Loupe theme="dark" intensity={0.7} className="w-full h-full text-[#8a8f98] opacity-80" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-white">
                No projects found
              </h2>
              <p className="text-[13px] text-[#8a8f98] leading-relaxed">
                Try adjusting your search keywords or active filters to view
                existing projects.
              </p>
            </div>
          {canManageProjects && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-4 bg-white text-black rounded-md font-medium text-[13px] hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={14} />
              New Project
            </button>
          )}
          </div>
        ) : (
          <>
            {/* LIST VIEW */}
            {activeView === "list" && (
              <ListViewRenderer
                projects={filteredProjects}
                config={currentViewConfig}
                groupProjects={groupProjects}
                sortProjects={sortProjects}
                collapsedGroups={collapsedGroups}
                toggleGroupCollapse={toggleGroupCollapse}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                navigate={navigate}
                activePicker={activePicker}
                setActivePicker={canManageProjects ? setActivePicker : () => {}}
                canManageProjects={canManageProjects}
              />
            )}

            {/* BOARD VIEW */}
            {activeView === "board" && (
              <BoardViewRenderer
                projects={filteredProjects}
                config={currentViewConfig}
                groupProjects={groupProjects}
                sortProjects={sortProjects}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                draggedProject={draggedProject}
                setDraggedProject={setDraggedProject}
                navigate={navigate}
                setIsCreateModalOpen={setIsCreateModalOpen}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                activePicker={activePicker}
                setActivePicker={canManageProjects ? setActivePicker : () => {}}
                canManageProjects={canManageProjects}
              />
            )}

            {/* TIMELINE VIEW */}
            {activeView === "timeline" && (
              <ErrorBoundary>
                <TimelineViewRenderer
                  projects={filteredProjects}
                  config={currentViewConfig}
                  groupProjects={groupProjects}
                  collapsedGroups={collapsedGroups}
                  toggleGroupCollapse={toggleGroupCollapse}
                  onUpdateProject={handleUpdateProject}
                  timelineScrollRef={timelineScrollRef}
                  hoveredProject={hoveredProject}
                  setHoveredProject={setHoveredProject}
                  tooltipPos={tooltipPos}
                  setTooltipPos={setTooltipPos}
                  navigate={navigate}
                  canManageProjects={canManageProjects}
                />
              </ErrorBoundary>
            )}
          </>
        )}
      </div>

      {/* SELECTION BOTTOM BAR */}
      {selectedProjects && selectedProjects.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#141517]/90 backdrop-blur-xl border border-white/[0.08] rounded-full px-4 py-2.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(255,255,255,0.02)] z-[100] animate-in slide-in-from-bottom-8 duration-300">
          <span className="text-[13px] font-medium text-white px-2">
            {selectedProjects.length} selected
          </span>
          <button
            onClick={() => setIsBulkActionMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-[13px] text-white font-medium transition-colors"
          >
            <Settings2 size={14} /> Actions
          </button>
          <button
            onClick={() => setSelectedProjects([])}
            className="p-1.5 hover:bg-white/10 rounded-md text-[#8a8f98] hover:text-white transition-colors ml-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* BULK ACTION MODAL */}
      {isBulkActionMenuOpen && (() => {
        const searchLower = commandPaletteSearch.toLowerCase();
        
        let flattenedCommands = [];
        let statusCommands = [];
        let priorityCommands = [];

        if (!commandPaletteState) {
          const allCommands = [
            { id: 'status', label: 'Change project status...', icon: <Hexagon size={14} className="text-[#8a8f98]" />, shortcut: 'P then S', action: () => { setCommandPaletteState('status'); setCommandPaletteSearch(""); setCommandPaletteIndex(0); } },
            { id: 'members', label: 'Change project members...', icon: <Users size={14} className="text-[#8a8f98]" />, shortcut: 'P then M', action: () => {} },
            { id: 'priority', label: 'Change project priority...', icon: <Signal size={14} className="text-[#8a8f98]" />, shortcut: 'P then P', action: () => { setCommandPaletteState('priority'); setCommandPaletteSearch(""); setCommandPaletteIndex(0); } },
            { id: 'dependencies', label: 'Change project dependencies...', icon: <Link2 size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'labels', label: 'Add labels...', icon: <Tag size={14} className="text-[#8a8f98]" />, shortcut: 'P then L', action: () => { setCommandPaletteState('labels'); setCommandPaletteSearch(""); setCommandPaletteIndex(0); } },
            { id: 'target_date', label: 'Set project target date...', icon: <Calendar size={14} className="text-[#8a8f98]" />, shortcutKeys: ['Ctrl', 'D'], action: () => { setCommandPaletteState('target_date'); setCommandPaletteSearch(""); setCommandPaletteIndex(0); } },
            { id: 'start_date', label: 'Set project start date...', icon: <Calendar size={14} className="text-[#8a8f98]" />, shortcutKeys: ['Ctrl', 'S'], action: () => { setCommandPaletteState('start_date'); setCommandPaletteSearch(""); setCommandPaletteIndex(0); } },
            { id: 'rename', label: 'Rename project', icon: <Edit2 size={14} className="text-[#8a8f98]" />, shortcutKeys: ['⇧', 'R'], action: () => {} },
            { id: 'copy_url', label: 'Copy project URL', icon: <Link2 size={14} className="text-[#8a8f98]" />, shortcutKeys: ['Cmd', '⇧', ','], action: () => {} },
            { id: 'copy_id', label: 'Copy project ID', icon: <Link2 size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'delete', label: 'Delete project...', icon: <X size={14} className="text-[#e2483d]" />, shortcutKeys: ['Cmd', 'Backspace'], action: () => {} },
            { id: 'archive', label: 'Archive project', icon: <Box size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'collapse_sidebar', label: 'Collapse navigation sidebar', icon: <Sidebar size={14} className="text-[#8a8f98]" />, shortcutKeys: ['['], action: () => {} },
            { id: 'hide_empty', label: 'Hide empty columns', icon: <Layout size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'change_properties', label: 'Change displayed properties...', icon: <Settings2 size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'theme_light', label: 'Switch to light theme', icon: <Layout size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'theme_dark', label: 'Switch to dark theme', icon: <Layout size={14} className="text-[#8a8f98]" />, action: () => {} },
            { id: 'theme_system', label: 'Switch to system theme', icon: <Layout size={14} className="text-[#8a8f98]" />, action: () => {} },
          ];

          if (searchLower) {
            allCommands.forEach(cmd => {
              if (cmd.label.toLowerCase().includes(searchLower)) {
                flattenedCommands.push(cmd);
              }
            });

            ["Backlog", "Planned", "In Progress", "Completed", "Canceled"].forEach(s => {
              const label = `Change project status > ${s}`;
              if (label.toLowerCase().includes(searchLower)) {
                flattenedCommands.push({
                  id: `status_${s}`,
                  label,
                  icon: getStatusIcon(s),
                  action: () => handleBulkUpdate('status', s)
                });
              }
            });

            ["Urgent", "High", "Medium", "Low", "No priority"].forEach(p => {
              const label = `Change project priority > ${p}`;
              if (label.toLowerCase().includes(searchLower)) {
                flattenedCommands.push({
                  id: `priority_${p}`,
                  label,
                  icon: getPriorityIcon(p),
                  action: () => handleBulkUpdate('priority', p)
                });
              }
            });
          } else {
            flattenedCommands.push(...allCommands);
          }
        } else if (commandPaletteState === 'status') {
          statusCommands = ["Backlog", "Planned", "In Progress", "Completed", "Canceled"]
            .filter(s => s.toLowerCase().includes(searchLower))
            .map(status => ({
              id: status, label: status, icon: getStatusIcon(status), action: () => handleBulkUpdate('status', status)
            }));
        } else if (commandPaletteState === 'priority') {
          priorityCommands = ["Urgent", "High", "Medium", "Low", "No priority"]
            .filter(p => p.toLowerCase().includes(searchLower))
            .map(p => ({
              id: p, label: p, icon: getPriorityIcon(p), action: () => handleBulkUpdate('priority', p)
            }));
        }

        const handleInputKeyDown = (e) => {
          let list = [];
          if (!commandPaletteState) list = flattenedCommands;
          else if (commandPaletteState === 'status') list = statusCommands;
          else if (commandPaletteState === 'priority') list = priorityCommands;
          
          if (e.key === 'Enter') {
            e.preventDefault();
            if (list[commandPaletteIndex]) {
              list[commandPaletteIndex].action();
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCommandPaletteIndex(prev => Math.min(prev + 1, Math.max(0, list.length - 1)));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCommandPaletteIndex(prev => Math.max(0, prev - 1));
          } else if (e.key === 'Backspace' && commandPaletteSearch === '' && commandPaletteState) {
            setCommandPaletteState(null);
            setCommandPaletteSearch("");
            setCommandPaletteIndex(0);
          }
        };

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsBulkActionMenuOpen(false); setCommandPaletteState(null); }}></div>
            <div className="relative w-full max-w-[540px] bg-[#18191b]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8),_inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center px-4 py-3 border-b border-white/[0.06]">
                {commandPaletteState && (
                  <div className="flex items-center mr-2">
                    <span className="bg-white/10 text-white text-[12px] px-2 py-1 rounded capitalize">{commandPaletteState.replace('_', ' ')}</span>
                  </div>
                )}
                <input
                  type="text"
                  placeholder={commandPaletteState ? "Search..." : "Type a command or search..."}
                  className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder-[#8a8f98]"
                  autoFocus
                  value={commandPaletteSearch}
                  onChange={(e) => { setCommandPaletteSearch(e.target.value); setCommandPaletteIndex(0); }}
                  onKeyDown={handleInputKeyDown}
                />
              </div>
              
              <div className="flex flex-col py-2 max-h-[400px] overflow-y-auto">
                {!commandPaletteState ? (
                  flattenedCommands.length === 0 ? (
                    <div className="flex flex-col pb-4">
                      <div className="px-4 py-2 text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider mb-1">Quick results for "{commandPaletteSearch}"</div>
                      <div className="px-4 py-2 flex items-center gap-3 text-[13px] text-[#e8e8e8]">
                        <Search size={14} className="text-[#8a8f98]" />
                        No results found
                        <span className="text-[#8a8f98] ml-2 text-[12px]">Go to advanced search</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {flattenedCommands.map((cmd, idx) => (
                        <button key={cmd.id} onClick={cmd.action} onMouseEnter={() => setCommandPaletteIndex(idx)} className={`flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#e8e8e8] hover:bg-white/10 hover:text-white transition-colors text-left w-full justify-between group ${commandPaletteIndex === idx ? 'bg-white/10' : ''}`}>
                          <div className="flex items-center gap-3">{cmd.icon} {cmd.label}</div>
                          {cmd.shortcut && <div className="text-[11px] font-mono text-[#8a8f98] opacity-0 group-hover:opacity-100 transition-opacity">{cmd.shortcut}</div>}
                          {cmd.shortcutKeys && <div className="text-[11px] font-mono text-[#8a8f98] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{cmd.shortcutKeys.map((k, i) => <span key={i} className="bg-white/10 px-1 rounded">{k}</span>)}</div>}
                        </button>
                      ))}
                    </>
                  )
                ) : commandPaletteState === 'status' ? (
                  <>
                    {statusCommands.map((cmd, idx) => (
                      <button key={cmd.id} onClick={cmd.action} onMouseEnter={() => setCommandPaletteIndex(idx)} className={`flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#e8e8e8] hover:bg-white/10 hover:text-white transition-colors text-left w-full ${commandPaletteIndex === idx ? 'bg-white/10' : ''}`}>
                        {cmd.icon} {cmd.label}
                      </button>
                    ))}
                  </>
                ) : commandPaletteState === 'priority' ? (
                  <>
                    {priorityCommands.map((cmd, idx) => (
                      <button key={cmd.id} onClick={cmd.action} onMouseEnter={() => setCommandPaletteIndex(idx)} className={`flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#e8e8e8] hover:bg-white/10 hover:text-white transition-colors text-left w-full ${commandPaletteIndex === idx ? 'bg-white/10' : ''}`}>
                        {cmd.icon} {cmd.label}
                      </button>
                    ))}
                  </>
                ) : commandPaletteState === 'target_date' || commandPaletteState === 'start_date' ? (
                  <div className="p-4 text-center text-[13px] text-[#8a8f98]">
                    <input type="date" className="bg-[#0e0f11] border border-white/10 rounded px-3 py-1.5 text-white" onChange={(e) => handleBulkUpdate(commandPaletteState, e.target.value)} />
                  </div>
                ) : (
                  <div className="p-4 text-center text-[13px] text-[#8a8f98]">Not implemented yet</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE PROJECT MODAL */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleCreateProject}
      />

      {/* Custom Date Modal */}
      {isCustomDateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-[640px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <h2 className="text-[15px] font-medium text-white">{customDateCategory}</h2>
              <div className="flex bg-white/5 rounded-full p-0.5">
                {["on", "before", "after"].map((modifier) => (
                  <button
                    key={modifier}
                    onClick={() => setCustomDateModifier(modifier)}
                    className={`px-3 py-1 text-[12px] rounded-full transition-colors ${customDateModifier === modifier ? "bg-white/10 text-white" : "text-[#8a8f98] hover:text-[#e8e8e8]"}`}
                  >
                    {modifier}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <input
                type="text"
                value={customDateSearch}
                onChange={(e) => setCustomDateSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const finalSelection = customDateSearch || customDateSelection;
                    if (finalSelection) {
                      const appliedValue = customDateModifier === "on" ? finalSelection : `${customDateModifier} ${finalSelection}`;
                      toggleFilter(customDateCategory, appliedValue);
                    }
                    setIsCustomDateModalOpen(false);
                    setCustomDateSelection("");
                    setCustomDateSearch("");
                    setCustomDateModifier("on");
                  }
                }}
                placeholder="Try: May 2027, Q4, 05/20/2027"
                className="w-full bg-[#1c1c1e] border border-white/20 rounded-lg text-[13px] text-white placeholder-[#8a8f98] px-3 py-2 outline-none focus:border-[#3b82f6] transition-colors"
              />
              
              <div className="flex items-center gap-1.5">
                {["Day", "Month", "Quarter", "Half-year", "Year"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCustomDateMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${customDateMode === mode ? "bg-white/10 text-white" : "text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/5"}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-4 mt-2 overflow-y-auto max-h-[350px] pr-2" style={{ scrollbarWidth: 'thin' }}>
                {customDateMode === "Quarter" && ["2024", "2025", "2026", "2027", "2028"].map((year) => (
                  <div key={year} className="flex flex-col gap-2">
                    <div className="text-[12px] text-[#8a8f98]">{year}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                        const val = `${year} ${q}`;
                        const isSelected = customDateSelection === val;
                        return (
                          <button 
                            key={`${year}-${q}`}
                            onClick={() => setCustomDateSelection(val)}
                            className={`border rounded-full py-1.5 text-[12px] transition-colors ${isSelected ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]" : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"}`}
                          >
                            {q}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {customDateMode === "Month" && ["2024", "2025", "2026", "2027", "2028"].map((year) => (
                  <div key={year} className="flex flex-col gap-2">
                    <div className="text-[12px] text-[#8a8f98]">{year}</div>
                    <div className="grid grid-cols-6 gap-2">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => {
                        const val = `${m} ${year}`;
                        const isSelected = customDateSelection === val;
                        return (
                          <button 
                            key={`${year}-${m}`}
                            onClick={() => setCustomDateSelection(val)}
                            className={`border rounded-full py-1.5 text-[12px] transition-colors ${isSelected ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]" : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"}`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {customDateMode === "Year" && (
                  <div className="flex flex-col gap-2">
                    <div className="text-[12px] text-[#8a8f98]">Select Year</div>
                    <div className="grid grid-cols-4 gap-2">
                      {["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031"].map((y) => {
                        const isSelected = customDateSelection === y;
                        return (
                          <button 
                            key={y}
                            onClick={() => setCustomDateSelection(y)}
                            className={`border rounded-full py-1.5 text-[12px] transition-colors ${isSelected ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]" : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"}`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {customDateMode === "Half-year" && ["2024", "2025", "2026", "2027", "2028"].map((year) => (
                  <div key={year} className="flex flex-col gap-2">
                    <div className="text-[12px] text-[#8a8f98]">{year}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {["H1", "H2"].map((h) => {
                        const val = `${year} ${h}`;
                        const isSelected = customDateSelection === val;
                        return (
                          <button 
                            key={`${year}-${h}`}
                            onClick={() => setCustomDateSelection(val)}
                            className={`border rounded-full py-1.5 text-[12px] transition-colors ${isSelected ? "border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]" : "border-white/5 text-[#e8e8e8] hover:bg-white/5 hover:border-white/10"}`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {customDateMode === "Day" && (() => {
                  const getMonthData = (offset) => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() + offset);
                    const year = d.getFullYear();
                    const month = d.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const firstDay = new Date(year, month, 1).getDay();
                    const monthName = d.toLocaleString('default', { month: 'long' });
                    return { year, month, daysInMonth, firstDay, monthName };
                  };

                  const left = getMonthData(customDateMonthOffset);
                  const right = getMonthData(customDateMonthOffset + 1);

                  const renderCalendar = (data, isRight) => {
                    return (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="text-[13px] text-[#e8e8e8] font-medium">{data.monthName} {data.year}</div>
                          {isRight && (
                            <div className="flex gap-2">
                              <button onClick={() => setCustomDateMonthOffset(prev => prev - 1)} className="text-[#8a8f98] hover:text-white"><ChevronLeft size={14} /></button>
                              <button onClick={() => setCustomDateMonthOffset(prev => prev + 1)} className="text-[#8a8f98] hover:text-white"><ChevronRight size={14} /></button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-7 text-[12px] text-center">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                            <div key={d} className={`py-1.5 ${d === "Su" || d === "Sa" ? "bg-white/[0.02]" : ""} text-[#8a8f98]`}>{d}</div>
                          ))}
                          
                          {Array.from({length: data.firstDay}).map((_, i) => (
                            <div key={`empty-${i}`} className={`py-1.5 ${i === 0 ? "bg-white/[0.02]" : ""}`}></div>
                          ))}
                          
                          {Array.from({length: data.daysInMonth}, (_, i) => i + 1).map(day => {
                            const isWeekend = (day + data.firstDay - 1) % 7 === 0 || (day + data.firstDay) % 7 === 0;
                            const val = `${data.monthName.substring(0, 3)} ${day}, ${data.year}`;
                            const isSelected = customDateSelection === val;
                            return (
                              <div key={day} className={`flex items-center justify-center py-1.5 ${isWeekend ? "bg-white/[0.02]" : ""}`}>
                                <button 
                                  onClick={() => setCustomDateSelection(val)}
                                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isSelected ? "bg-[#3b82f6] text-white" : "text-[#e8e8e8] hover:bg-white/10 hover:text-white"}`}
                                >
                                  {day}
                                </button>
                              </div>
                            );
                          })}
                          
                          {Array.from({length: (42 - (data.firstDay + data.daysInMonth)) % 7}).map((_, i) => {
                            const total = data.firstDay + data.daysInMonth;
                            const isWeekend = (total + i) % 7 === 0 || (total + i + 1) % 7 === 0;
                            return <div key={`empty-end-${i}`} className={`py-1.5 ${isWeekend ? "bg-white/[0.02]" : ""}`}></div>;
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="flex gap-8">
                      {renderCalendar(left, false)}
                      {renderCalendar(right, true)}
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2 bg-white/5 rounded-b-xl">
              <button
                onClick={() => {
                  setIsCustomDateModalOpen(false);
                  setCustomDateSelection("");
                }}
                className="px-4 py-1.5 text-[13px] text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/5 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalSelection = customDateSearch || customDateSelection;
                  if (finalSelection) {
                    const appliedValue = customDateModifier === "on" ? finalSelection : `${customDateModifier} ${finalSelection}`;
                    toggleFilter(customDateCategory, appliedValue);
                  }
                  setIsCustomDateModalOpen(false);
                  setCustomDateSelection("");
                  setCustomDateSearch("");
                  setCustomDateModifier("on");
                }}
                className="px-4 py-1.5 text-[13px] bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, projectId: null })}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
