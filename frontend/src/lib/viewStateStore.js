import { trackAsync, debounceTrack } from "./posthog.js";

/**
 * KRIRI View State Store
 * 
 * Preserves lightweight navigation context (active view, filters, search queries,
 * visible properties, grouping, collapsed groups, and scroll coordinates) in memory
 * outside the React DOM tree.
 * 
 * Allows heavy UI components (<Tasks />, <Projects />) to unmount completely, freeing
 * thousands of DOM nodes from V8 heap, while guaranteeing 0ms restoration without visual jump.
 * 
 * Integrated with asynchronous telemetry triggers for contextual view and filter tracking
 * without blocking UI threads or forcing React re-renders.
 */

class ViewStateStore {
  constructor() {
    this.tasksView = {
      activeView: null,
      filterState: null,
      activeFilter: "all",
      searchQuery: "",
      grouping: null,
      collapsedGroups: {},
      visibleProperties: null,
      showSubIssues: null,
      showColumnBackgrounds: null,
      showEmptyColumns: null,
      selectedTaskIds: new Set(),
      scrollTop: 0,
      scrollLeft: 0,
    };

    this.projectsView = {
      activeView: null,
      searchQuery: "",
      activeFilters: null,
      viewConfig: null,
      scrollTop: 0,
      scrollLeft: 0,
    };
  }

  getTasksView = () => this.tasksView;

  setTasksView = (updates) => {
    if (!updates || typeof updates !== "object") return;

    // Asynchronous Contextual Telemetry: Track view mode changes
    if (
      updates.activeView &&
      this.tasksView.activeView !== null &&
      updates.activeView !== this.tasksView.activeView
    ) {
      trackAsync("view_mode_switched", {
        scope: "tasks",
        from_view: this.tasksView.activeView,
        to_view: updates.activeView,
      });
    }

    // Asynchronous Contextual Telemetry: Track filter adjustments (Debounced)
    if (
      updates.activeFilter !== undefined &&
      updates.activeFilter !== this.tasksView.activeFilter
    ) {
      debounceTrack("tasks_filter_applied", {
        scope: "tasks",
        activeFilter: updates.activeFilter,
      }, 400);
    } else if (
      updates.filterState !== undefined &&
      updates.filterState !== this.tasksView.filterState
    ) {
      debounceTrack("tasks_custom_filter_applied", {
        scope: "tasks",
        hasCustomFilters: Boolean(updates.filterState),
      }, 500);
    }

    Object.assign(this.tasksView, updates);
  };

  getProjectsView = () => this.projectsView;

  setProjectsView = (updates) => {
    if (!updates || typeof updates !== "object") return;

    // Asynchronous Contextual Telemetry: Track view mode changes
    if (
      updates.activeView &&
      this.projectsView.activeView !== null &&
      updates.activeView !== this.projectsView.activeView
    ) {
      trackAsync("view_mode_switched", {
        scope: "projects",
        from_view: this.projectsView.activeView,
        to_view: updates.activeView,
      });
    }

    // Asynchronous Contextual Telemetry: Track filter adjustments (Debounced)
    if (
      updates.activeFilters !== undefined &&
      updates.activeFilters !== this.projectsView.activeFilters
    ) {
      debounceTrack("projects_filter_applied", {
        scope: "projects",
        hasActiveFilters: Boolean(updates.activeFilters),
      }, 400);
    }

    Object.assign(this.projectsView, updates);
  };

  reset = () => {
    this.tasksView.selectedTaskIds = new Set();
    this.tasksView.scrollTop = 0;
    this.projectsView.scrollTop = 0;
  };
}

export const viewStateStore = new ViewStateStore();
