import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { Loupe } from "@lucasmarkes/hairline/react";
import { Plus, Settings2, X } from "lucide-react";

import CreateProjectModal from "../components/CreateProjectModal";
import ConfirmModal from "../components/ConfirmModal";
import { ErrorBoundary } from "../components/ErrorBoundary";

import ListViewRenderer from "../components/projects/ListViewRenderer";
import BoardViewRenderer from "../components/projects/BoardViewRenderer";
import TimelineViewRenderer from "../components/projects/TimelineViewRenderer";
import CustomDateFilterModal from "../components/projects/CustomDateFilterModal";
import BulkActionModal from "../components/projects/BulkActionModal";
import ProjectToolbar from "../components/projects/ProjectToolbar";

import { useProjectData } from "../hooks/useProjectData";
import { useProjectFilters } from "../hooks/useProjectFilters";

export default function Projects() {
  const navigate = useNavigate();
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
  const keyTimeout = useRef(null);

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
  const currentViewConfig =
    viewConfig[activeView] || workspaceDefaultConfig[activeView];
  const isNonDefaultDisplay =
    JSON.stringify(currentViewConfig) !==
    JSON.stringify(workspaceDefaultConfig[activeView]);

  return (
    <div className="w-full flex flex-col h-full min-h-0 min-w-0 animate-in fade-in duration-300 select-none text-[#e8e8e8]">
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
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 max-w-sm mx-auto text-center gap-6 mt-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-80 h-80 flex items-center justify-center relative overflow-visible">
              <Loupe
                theme="dark"
                intensity={0.7}
                className="w-full h-full text-[#8a8f98]"
              />
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
                <Plus size={14} /> New Project
              </button>
            )}
          </div>
        ) : (
          <>
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

      {/* 3. SELECTION BOTTOM BAR */}
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
}
