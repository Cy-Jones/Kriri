import { useState, useEffect, useLayoutEffect, useCallback, useRef, useDeferredValue, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useOrganization } from "@clerk/react";
import { Plus, Settings2, X } from "lucide-react";
import { Loupe } from "@lucasmarkes/hairline/react";
import { useTheme } from "../contexts/ThemeContext";

import CreateProjectModal from "../components/CreateProjectModal";
import ConfirmModal from "../components/ConfirmModal";
import { ErrorBoundary } from "../components/ErrorBoundary";
import {
  ProjectsListSkeleton,
  ProjectsBoardSkeleton,
  ProjectsTimelineSkeleton,
} from "../components/skeletons/PageSkeletons";
import { useDeferredSkeleton } from "../hooks/useDeferredSkeleton";

import ListViewRenderer from "../components/projects/ListViewRenderer";
import BoardViewRenderer from "../components/projects/BoardViewRenderer";
import TimelineViewRenderer from "../components/projects/TimelineViewRenderer";
import CustomDateFilterModal from "../components/projects/CustomDateFilterModal";
import BulkActionModal from "../components/projects/BulkActionModal";
import ProjectToolbar from "../components/projects/ProjectToolbar";

import { useProjectData } from "../hooks/useProjectData";
import { useProjectFilters } from "../hooks/useProjectFilters";
import { viewStateStore } from "../lib/viewStateStore";

export default memo(function Projects({ isActive = true }) {
  const navigate = useNavigate();
  const { effectiveTheme } = useTheme();
  const { user } = useUser();
  const { organization } = useOrganization();

  // 1. Data management (API, websockets, CRUD, roles)
  const {
    projects,
    loading,
    canManageProjects,
    confirmModal,
    setConfirmModal,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleCreateProject,
  } = useProjectData(user, organization);

  const showSkeleton = useDeferredSkeleton(loading && projects.length === 0, 180);

  // 2. Filters & View state management
  const {
    searchQuery,
    setSearchQuery,
    viewConfig,
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
    collapsedGroups,
    toggleGroupCollapse,
    filteredProjects,
    groupProjects,
    sortProjects,
    setActiveView,
    updateViewSetting,
    toggleProperty,
    resetToDefaults,
  } = useProjectFilters(projects);

  const activeView = viewConfig?.activeView || "list";



  // 3. Selection & Command Palette State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);
  const [commandPaletteState, setCommandPaletteState] = useState(null);
  const [commandPaletteSearch, setCommandPaletteSearch] = useState("");
  const [commandPaletteIndex, setCommandPaletteIndex] = useState(0);

  // Timeline / Board UI interaction states
  const [activePicker, setActivePicker] = useState({
    type: null,
    projectId: null,
  });
  const [draggedProject, setDraggedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const filterRef = useRef(null);
  const displayOptionsRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const listScrollRef = useRef(null);
  const keyTimeout = useRef(null);

  const handleListScroll = useCallback((e) => {
    viewStateStore.setProjectsView({
      scrollTop: e.currentTarget.scrollTop,
      scrollLeft: e.currentTarget.scrollLeft,
    });
  }, []);

  useLayoutEffect(() => {
    const saved = viewStateStore.getProjectsView();
    if (listScrollRef.current && saved.scrollTop > 0) {
      listScrollRef.current.scrollTop = saved.scrollTop;
    }
    if (listScrollRef.current && saved.scrollLeft > 0) {
      listScrollRef.current.scrollLeft = saved.scrollLeft;
    }
  }, [activeView]);

  // Enforce no timeline view on mobile devices
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768 && activeView === "timeline") {
        setActiveView("list");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [activeView, setActiveView]);

  // Bulk update handler
  const handleBulkUpdate = async (field, value) => {
    try {
      await Promise.all(
        selectedProjects.map((id) =>
          handleUpdateProject(id, { [field]: value }),
        ),
      );
      setIsBulkActionMenuOpen(false);
      setCommandPaletteState(null);
      setSelectedProjects([]);
    } catch (err) {
      console.error("Bulk update failed", err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (window.location.pathname !== "/projects" && window.location.pathname !== "/projects/") {
        return;
      }
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        if (!isBulkActionMenuOpen) return;
      }

      if (
        e.key.toLowerCase() === "c" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !isBulkActionMenuOpen
      ) {
        e.preventDefault();
        setIsCreateModalOpen(true);
        return;
      }

      if (selectedProjects.length > 0 && !isBulkActionMenuOpen) {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          const key = e.key.toLowerCase();

          if (key === "d" && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState("target_date");
            return;
          }
          if (key === "d" && e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState("start_date");
            return;
          }
          if (key === "s" && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState("status");
            return;
          }
          if (key === "p" && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState("priority");
            return;
          }
          if (key === "l" && !e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState("labels");
            return;
          }
          if (key === "r" && e.shiftKey) {
            e.preventDefault();
            setIsBulkActionMenuOpen(true);
            setCommandPaletteState("rename");
            return;
          }
        }
      }

      // View switching: mod+1 (List), mod+2 (Board), mod+3 (Timeline)
      if (e.metaKey || e.ctrlKey) {
        if (!e.shiftKey && !e.altKey) {
          if (e.key === "1" || e.code === "Digit1") {
            e.preventDefault();
            setActiveView("list");
            return;
          }
          if (e.key === "2" || e.code === "Digit2") {
            e.preventDefault();
            setActiveView("board");
            return;
          }
          if (e.key === "3" || e.code === "Digit3") {
            e.preventDefault();
            setActiveView("timeline");
            return;
          }
        }
      }

      // Toggle display options: 'o'
      if (
        e.key.toLowerCase() === "o" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isBulkActionMenuOpen
      ) {
        e.preventDefault();
        setIsDisplayOptionsOpen((prev) => !prev);
        return;
      }
    };

    const handleCustomSwitchView = (e) => {
      if (e.detail?.view) setActiveView(e.detail.view);
    };
    const handleCustomToggleDisplay = () => {
      setIsDisplayOptionsOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("kriri-switch-view", handleCustomSwitchView);
    window.addEventListener("kriri-toggle-display-options", handleCustomToggleDisplay);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("kriri-switch-view", handleCustomSwitchView);
      window.removeEventListener("kriri-toggle-display-options", handleCustomToggleDisplay);
      clearTimeout(keyTimeout.current);
    };
  }, [selectedProjects, isBulkActionMenuOpen]);

  // Click outside to close menus
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
      ) {
        setIsDisplayOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    setIsFilterOpen,
    setActiveFilterMenu,
    setActiveNestedFilterMenu,
    setFilterSearchTerm,
    setLabelSearchTerm,
    setIsDisplayOptionsOpen,
  ]);

  const currentViewConfig =
    viewConfig[activeView] || workspaceDefaultConfig[activeView];
  const isNonDefaultDisplay =
    JSON.stringify(currentViewConfig) !==
    JSON.stringify(workspaceDefaultConfig[activeView]);

  return (
    <div className="w-full flex flex-col min-h-full md:h-full min-w-0 select-none text-foreground">
      {/* 1. TOP TOOLBAR & CONTROLS */}
      <ProjectToolbar
        canManageProjects={canManageProjects}
        setIsCreateModalOpen={setIsCreateModalOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        currentViewConfig={currentViewConfig}
        updateViewSetting={updateViewSetting}
        toggleProperty={toggleProperty}
        resetToDefaults={resetToDefaults}
        setWorkspaceDefaultConfig={setWorkspaceDefaultConfig}
        viewConfig={viewConfig}
        isNonDefaultDisplay={isNonDefaultDisplay}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        toggleFilter={toggleFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        projects={projects}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        isDisplayOptionsOpen={isDisplayOptionsOpen}
        setIsDisplayOptionsOpen={setIsDisplayOptionsOpen}
        filterRef={filterRef}
        displayOptionsRef={displayOptionsRef}
        activeFilterMenu={activeFilterMenu}
        setActiveFilterMenu={setActiveFilterMenu}
        activeNestedFilterMenu={activeNestedFilterMenu}
        setActiveNestedFilterMenu={setActiveNestedFilterMenu}
        filterSearchTerm={filterSearchTerm}
        setFilterSearchTerm={setFilterSearchTerm}
        labelSearchTerm={labelSearchTerm}
        setLabelSearchTerm={setLabelSearchTerm}
        setCustomDateCategory={setCustomDateCategory}
        setIsCustomDateModalOpen={setIsCustomDateModalOpen}
      />

      {/* 2. MAIN CONTENT VIEWS */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {showSkeleton ? (
          activeView === "board" ? (
            <ProjectsBoardSkeleton />
          ) : activeView === "timeline" ? (
            <ProjectsTimelineSkeleton />
          ) : (
            <ProjectsListSkeleton />
          )
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-64 h-64 flex items-center justify-center relative overflow-visible">
              <Loupe theme={effectiveTheme} intensity={0.7} className="w-full h-full text-zinc-500 dark:text-[#8a8f98] opacity-80" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                No projects found
              </h2>
              <p className="text-[13px] text-zinc-500 dark:text-[#8a8f98] leading-relaxed">
                Try adjusting your search keywords or active filters to view
                existing projects.
              </p>
            </div>
            {canManageProjects && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="kriri-primary-btn h-8 px-4 rounded-full font-medium text-[13px] transition-all duration-300 shadow-sm active:scale-[0.98] flex items-center gap-2"
              >
                <Plus size={14} strokeWidth={2.2} /> New Project
              </button>
            )}
          </div>
        ) : (
          <>
            {activeView === "list" && (
              <div className="flex-1 flex flex-col min-h-0">
                <ListViewRenderer
                  projects={filteredProjects}
                  config={viewConfig.list || workspaceDefaultConfig.list}
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
                  listScrollRef={listScrollRef}
                  onScroll={handleListScroll}
                />
              </div>
            )}

            {activeView === "board" && (
              <div className="flex-1 flex flex-col min-h-0">
                <BoardViewRenderer
                  projects={filteredProjects}
                  config={viewConfig.board || workspaceDefaultConfig.board}
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
              </div>
            )}

            {activeView === "timeline" && typeof window !== "undefined" && window.innerWidth >= 768 && (
              <div className="flex-1 flex flex-col min-h-0">
                <ErrorBoundary>
                  <TimelineViewRenderer
                    projects={filteredProjects}
                    config={viewConfig.timeline || workspaceDefaultConfig.timeline}
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
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. SELECTION BOTTOM BAR */}
      {selectedProjects && selectedProjects.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/95 dark:bg-[var(--surface-elevated,#141517)]/90 backdrop-blur-xl border border-black/10 dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-full px-4 py-2.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)] z-[100] animate-in slide-in-from-bottom-8 duration-300">
          <span className="text-[13px] font-medium text-zinc-900 dark:text-white px-2">
            {selectedProjects.length} selected
          </span>
          <button
            onClick={() => setIsBulkActionMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-[13px] text-zinc-900 dark:text-white font-medium transition-all active:scale-[0.98]"
          >
            <Settings2 size={14} /> Actions
          </button>
          <button
            onClick={() => setSelectedProjects([])}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-white transition-all ml-1 active:scale-[0.95]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. MODALS & POPUPS */}
      <BulkActionModal
        isOpen={isBulkActionMenuOpen}
        onClose={() => setIsBulkActionMenuOpen(false)}
        commandPaletteState={commandPaletteState}
        setCommandPaletteState={setCommandPaletteState}
        commandPaletteSearch={commandPaletteSearch}
        setCommandPaletteSearch={setCommandPaletteSearch}
        commandPaletteIndex={commandPaletteIndex}
        setCommandPaletteIndex={setCommandPaletteIndex}
        handleBulkUpdate={handleBulkUpdate}
      />

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleCreateProject}
      />

      <CustomDateFilterModal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        customDateCategory={customDateCategory}
        customDateModifier={customDateModifier}
        setCustomDateModifier={setCustomDateModifier}
        customDateSearch={customDateSearch}
        setCustomDateSearch={setCustomDateSearch}
        customDateMode={customDateMode}
        setCustomDateMode={setCustomDateMode}
        customDateSelection={customDateSelection}
        setCustomDateSelection={setCustomDateSelection}
        customDateMonthOffset={customDateMonthOffset}
        setCustomDateMonthOffset={setCustomDateMonthOffset}
        onApply={(category, val) => toggleFilter(category, val)}
      />

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
});
