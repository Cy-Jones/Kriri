import { useSyncExternalStore, useCallback } from "react";
import { api } from "./api.js";

/**
 * KRIRI Server-State Store (Single Source of Truth)
 * 
 * Centralized, reactive in-memory cache for server data (tasks and projects).
 * Eliminates duplicate useState mirrors across views and hooks into React 18/19
 * via standard useSyncExternalStore.
 */

class ServerStateStore {
  constructor() {
    this.tasks = [];
    this.tasksMap = new Map();
    this.projects = [];
    this.projectsMap = new Map();
    this.subscribers = new Set();
    this.attachedSocket = null;
    this.tasksLoading = false;
    this.projectsLoading = false;
    this.tasksLoaded = false;
    this.projectsLoaded = false;

    // Synchronous initial pre-hydration from apiCache if already available
    if (typeof window !== "undefined") {
      this.hydrateFromInitialCache();
    }
  }

  hydrateFromInitialCache = () => {
    try {
      const cachedTasks = api.getCached("/tasks");
      if (Array.isArray(cachedTasks) && cachedTasks.length > 0) {
        this.setTasksInternal(cachedTasks, false);
        this.tasksLoaded = true;
      }
      const cachedProjects = api.getCached("/projects");
      if (Array.isArray(cachedProjects) && cachedProjects.length > 0) {
        this.setProjectsInternal(cachedProjects, false);
        this.projectsLoaded = true;
      }
    } catch (e) {
      // ignore
    }
  };

  subscribe = (callback) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  notify = () => {
    for (const callback of this.subscribers) {
      try {
        callback();
      } catch (err) {
        console.error("DataStore subscriber notification error:", err);
      }
    }
  };

  getTasksSnapshot = () => this.tasks;
  getProjectsSnapshot = () => this.projects;
  getTasksLoading = () => this.tasksLoading;
  getProjectsLoading = () => this.projectsLoading;

  setTasksInternal = (newTasks, notify = true) => {
    this.tasks = Array.isArray(newTasks) ? newTasks : [];
    this.tasksMap.clear();
    for (const t of this.tasks) {
      if (t && t.id != null) {
        this.tasksMap.set(String(t.id), t);
      }
    }
    if (notify) this.notify();
  };

  setProjectsInternal = (newProjects, notify = true) => {
    this.projects = Array.isArray(newProjects) ? newProjects : [];
    this.projectsMap.clear();
    for (const p of this.projects) {
      if (p && p.id != null) {
        this.projectsMap.set(String(p.id), p);
      }
    }
    if (notify) this.notify();
  };

  setTasks = (updater) => {
    const next = typeof updater === "function" ? updater(this.tasks) : updater;
    this.setTasksInternal(next, true);
    api.setCached("/tasks", this.tasks);
  };

  setProjects = (updater) => {
    const next = typeof updater === "function" ? updater(this.projects) : updater;
    this.setProjectsInternal(next, true);
    api.setCached("/projects", this.projects);
  };

  // Real-time & mutation handlers
  handleTaskCreated = (newTask) => {
    if (!newTask || newTask.id == null) return;
    const idKey = String(newTask.id);
    if (this.tasksMap.has(idKey)) return;

    this.tasks = [newTask, ...this.tasks];
    this.tasksMap.set(idKey, newTask);
    api.setCached("/tasks", this.tasks);
    this.notify();
  };

  handleTaskUpdated = (updatedTask) => {
    if (!updatedTask || updatedTask.id == null) return;
    const idKey = String(updatedTask.id);
    const existing = this.tasksMap.get(idKey);
    const merged = existing ? { ...existing, ...updatedTask } : updatedTask;

    this.tasksMap.set(idKey, merged);
    if (existing) {
      this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? merged : t));
    } else {
      this.tasks = [merged, ...this.tasks];
    }
    api.setCached("/tasks", this.tasks);
    this.notify();
  };

  handleTaskDeleted = (data) => {
    const rawId = typeof data === "object" && data !== null ? (data.id ?? data.taskId) : data;
    if (rawId == null) return;
    const idKey = String(rawId);

    if (this.tasksMap.has(idKey)) {
      this.tasksMap.delete(idKey);
      this.tasks = this.tasks.filter((t) => String(t.id) !== idKey);
      api.setCached("/tasks", this.tasks);
      this.notify();
    }
  };

  handleTaskDependencyAdded = (data) => {
    if (!data) return;
    const taskId = data.task_id;
    if (taskId == null) return;
    const idKey = String(taskId);
    const existing = this.tasksMap.get(idKey);
    if (existing) {
      const currentCount = Number(existing.blocked_by_count ?? existing.blocked_count ?? 0);
      const updated = {
        ...existing,
        blocked_by_count: currentCount + 1,
        blocked_count: currentCount + 1,
      };
      this.tasksMap.set(idKey, updated);
      this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? updated : t));
      api.setCached("/tasks", this.tasks);

      if (existing.project_id) {
        const projKey = String(existing.project_id);
        const proj = this.projectsMap.get(projKey);
        if (proj) {
          const currentProjDeps = Number(proj.dependencies_count ?? proj.blocked_tasks_count ?? 0);
          const updatedProj = {
            ...proj,
            dependencies_count: currentProjDeps + 1,
            blocked_tasks_count: currentProjDeps + 1,
          };
          this.projectsMap.set(projKey, updatedProj);
          this.projects = this.projects.map((p) => (String(p.id) === projKey ? updatedProj : p));
          api.setCached("/projects", this.projects);
        }
      }

      this.notify();
    }
  };

  handleTaskDependencyRemoved = (data) => {
    if (!data) return;
    const taskId = data.task_id;
    if (taskId == null) return;
    const idKey = String(taskId);
    const existing = this.tasksMap.get(idKey);
    if (existing) {
      const currentCount = Number(existing.blocked_by_count ?? existing.blocked_count ?? 0);
      const updated = {
        ...existing,
        blocked_by_count: Math.max(0, currentCount - 1),
        blocked_count: Math.max(0, currentCount - 1),
      };
      this.tasksMap.set(idKey, updated);
      this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? updated : t));
      api.setCached("/tasks", this.tasks);

      if (existing.project_id) {
        const projKey = String(existing.project_id);
        const proj = this.projectsMap.get(projKey);
        if (proj) {
          const currentProjDeps = Number(proj.dependencies_count ?? proj.blocked_tasks_count ?? 0);
          const updatedProj = {
            ...proj,
            dependencies_count: Math.max(0, currentProjDeps - 1),
            blocked_tasks_count: Math.max(0, currentProjDeps - 1),
          };
          this.projectsMap.set(projKey, updatedProj);
          this.projects = this.projects.map((p) => (String(p.id) === projKey ? updatedProj : p));
          api.setCached("/projects", this.projects);
        }
      }

      this.notify();
    }
  };

  handleProjectCreated = (newProject) => {
    if (!newProject || newProject.id == null) return;
    const idKey = String(newProject.id);
    if (this.projectsMap.has(idKey)) return;

    this.projects = [newProject, ...this.projects];
    this.projectsMap.set(idKey, newProject);
    api.setCached("/projects", this.projects);
    this.notify();
  };

  handleProjectUpdated = (updatedProject) => {
    if (!updatedProject || updatedProject.id == null) return;
    const idKey = String(updatedProject.id);
    const existing = this.projectsMap.get(idKey);
    const merged = existing ? { ...existing, ...updatedProject } : updatedProject;

    this.projectsMap.set(idKey, merged);
    if (existing) {
      this.projects = this.projects.map((p) => (String(p.id) === idKey ? merged : p));
    } else {
      this.projects = [merged, ...this.projects];
    }
    api.setCached("/projects", this.projects);
    this.notify();
  };

  handleProjectDeleted = (data) => {
    const rawId = typeof data === "object" && data !== null ? (data.id ?? data.projectId) : data;
    if (rawId == null) return;
    const idKey = String(rawId);

    if (this.projectsMap.has(idKey)) {
      this.projectsMap.delete(idKey);
      this.projects = this.projects.filter((p) => String(p.id) !== idKey);
      api.setCached("/projects", this.projects);
      this.notify();
    }
  };

  // Centralized WebSocket binding (attached once)
  attachSocket = (socket) => {
    if (!socket || this.attachedSocket === socket) return;

    if (this.attachedSocket) {
      this.detachSocket();
    }

    this.attachedSocket = socket;
    socket.on("TASK_CREATED", this.handleTaskCreated);
    socket.on("TASK_UPDATED", this.handleTaskUpdated);
    socket.on("TASK_DELETED", this.handleTaskDeleted);
    socket.on("TASK_DEPENDENCY_ADDED", this.handleTaskDependencyAdded);
    socket.on("TASK_DEPENDENCY_REMOVED", this.handleTaskDependencyRemoved);
    socket.on("PROJECT_CREATED", this.handleProjectCreated);
    socket.on("PROJECT_UPDATED", this.handleProjectUpdated);
    socket.on("PROJECT_DELETED", this.handleProjectDeleted);
  };

  detachSocket = () => {
    if (!this.attachedSocket) return;
    const s = this.attachedSocket;
    s.off("TASK_CREATED", this.handleTaskCreated);
    s.off("TASK_UPDATED", this.handleTaskUpdated);
    s.off("TASK_DELETED", this.handleTaskDeleted);
    s.off("TASK_DEPENDENCY_ADDED", this.handleTaskDependencyAdded);
    s.off("TASK_DEPENDENCY_REMOVED", this.handleTaskDependencyRemoved);
    s.off("PROJECT_CREATED", this.handleProjectCreated);
    s.off("PROJECT_UPDATED", this.handleProjectUpdated);
    s.off("PROJECT_DELETED", this.handleProjectDeleted);
    this.attachedSocket = null;
  };

  // Optimistic Dependency Mutation Methods (0ms immediate UI update)
  addDependency = async (taskId, dependsOnTaskId, type = "blocks") => {
    if (!taskId || !dependsOnTaskId) return null;
    const idKey = String(taskId);
    const existing = this.tasksMap.get(idKey);

    // 1. Instant optimistic update on local DataStore
    let previousCount = 0;
    let projKey = null;
    let previousProjDeps = 0;
    if (existing) {
      previousCount = Number(existing.blocked_by_count ?? existing.blocked_count ?? 0);
      const updated = {
        ...existing,
        blocked_by_count: previousCount + 1,
        blocked_count: previousCount + 1,
      };
      this.tasksMap.set(idKey, updated);
      this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? updated : t));
      api.setCached("/tasks", this.tasks);

      if (existing.project_id) {
        projKey = String(existing.project_id);
        const proj = this.projectsMap.get(projKey);
        if (proj) {
          previousProjDeps = Number(proj.dependencies_count ?? proj.blocked_tasks_count ?? 0);
          const updatedProj = {
            ...proj,
            dependencies_count: previousProjDeps + 1,
            blocked_tasks_count: previousProjDeps + 1,
          };
          this.projectsMap.set(projKey, updatedProj);
          this.projects = this.projects.map((p) => (String(p.id) === projKey ? updatedProj : p));
          api.setCached("/projects", this.projects);
        }
      }

      this.notify();
    }

    // 2. Background API call
    try {
      const result = await api.post(`/tasks/${taskId}/dependencies`, {
        dependsOnTaskId: parseInt(dependsOnTaskId, 10),
        type,
      });

      // Update cached single task if present
      const cachedDetail = api.getCached(`/tasks/${taskId}`);
      if (cachedDetail && cachedDetail.dependencies) {
        const blockedBy = Array.isArray(cachedDetail.dependencies.blocked_by)
          ? cachedDetail.dependencies.blocked_by
          : [];
        const exists = blockedBy.some(
          (d) => String(d.id || d.dependency_id) === String(result.id || result.dependency_id)
        );
        if (!exists) {
          cachedDetail.dependencies.blocked_by = [...blockedBy, result];
          api.setCached(`/tasks/${taskId}`, cachedDetail);
        }
      }

      return result;
    } catch (err) {
      // 3. Rollback on failure
      if (existing) {
        const reverted = {
          ...existing,
          blocked_by_count: previousCount,
          blocked_count: previousCount,
        };
        this.tasksMap.set(idKey, reverted);
        this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? reverted : t));
        api.setCached("/tasks", this.tasks);

        if (projKey && this.projectsMap.has(projKey)) {
          const proj = this.projectsMap.get(projKey);
          const revertedProj = {
            ...proj,
            dependencies_count: previousProjDeps,
            blocked_tasks_count: previousProjDeps,
          };
          this.projectsMap.set(projKey, revertedProj);
          this.projects = this.projects.map((p) => (String(p.id) === projKey ? revertedProj : p));
          api.setCached("/projects", this.projects);
        }

        this.notify();
      }
      throw err;
    }
  };

  removeDependency = async (taskId, dependsOnTaskId) => {
    if (!taskId || !dependsOnTaskId) return null;
    const idKey = String(taskId);
    const existing = this.tasksMap.get(idKey);

    // 1. Instant optimistic update on local DataStore
    let previousCount = 0;
    let projKey = null;
    let previousProjDeps = 0;
    if (existing) {
      previousCount = Number(existing.blocked_by_count ?? existing.blocked_count ?? 0);
      const updated = {
        ...existing,
        blocked_by_count: Math.max(0, previousCount - 1),
        blocked_count: Math.max(0, previousCount - 1),
      };
      this.tasksMap.set(idKey, updated);
      this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? updated : t));
      api.setCached("/tasks", this.tasks);

      if (existing.project_id) {
        projKey = String(existing.project_id);
        const proj = this.projectsMap.get(projKey);
        if (proj) {
          previousProjDeps = Number(proj.dependencies_count ?? proj.blocked_tasks_count ?? 0);
          const updatedProj = {
            ...proj,
            dependencies_count: Math.max(0, previousProjDeps - 1),
            blocked_tasks_count: Math.max(0, previousProjDeps - 1),
          };
          this.projectsMap.set(projKey, updatedProj);
          this.projects = this.projects.map((p) => (String(p.id) === projKey ? updatedProj : p));
          api.setCached("/projects", this.projects);
        }
      }

      this.notify();
    }

    // 2. Background API call
    try {
      const result = await api.delete(`/tasks/${taskId}/dependencies/${dependsOnTaskId}`);

      // Update cached single task if present
      const cachedDetail = api.getCached(`/tasks/${taskId}`);
      if (cachedDetail && cachedDetail.dependencies) {
        if (Array.isArray(cachedDetail.dependencies.blocked_by)) {
          cachedDetail.dependencies.blocked_by = cachedDetail.dependencies.blocked_by.filter(
            (d) =>
              String(d.id || d.dependency_id) !== String(dependsOnTaskId) &&
              String(d.depends_on_task_id) !== String(dependsOnTaskId)
          );
        }
        if (Array.isArray(cachedDetail.dependencies.blocking)) {
          cachedDetail.dependencies.blocking = cachedDetail.dependencies.blocking.filter(
            (d) =>
              String(d.id || d.dependency_id) !== String(dependsOnTaskId) &&
              String(d.task_id) !== String(dependsOnTaskId)
          );
        }
        api.setCached(`/tasks/${taskId}`, cachedDetail);
      }

      return result;
    } catch (err) {
      // 3. Rollback on failure
      if (existing) {
        const reverted = {
          ...existing,
          blocked_by_count: previousCount,
          blocked_count: previousCount,
        };
        this.tasksMap.set(idKey, reverted);
        this.tasks = this.tasks.map((t) => (String(t.id) === idKey ? reverted : t));
        api.setCached("/tasks", this.tasks);

        if (projKey && this.projectsMap.has(projKey)) {
          const proj = this.projectsMap.get(projKey);
          const revertedProj = {
            ...proj,
            dependencies_count: previousProjDeps,
            blocked_tasks_count: previousProjDeps,
          };
          this.projectsMap.set(projKey, revertedProj);
          this.projects = this.projects.map((p) => (String(p.id) === projKey ? revertedProj : p));
          api.setCached("/projects", this.projects);
        }

        this.notify();
      }
      throw err;
    }
  };

  // Asynchronous fetch coordinators
  fetchTasks = async (scopeKey = "", options = {}) => {
    if (this.tasks.length === 0) {
      this.tasksLoading = true;
      this.notify();
    }

    try {
      const data = await api.get("/tasks?include_description=true", options);
      if (Array.isArray(data)) {
        this.setTasksInternal(data, true);
        this.tasksLoaded = true;
        if (scopeKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(`kriri:cache:tasks_${scopeKey}`, JSON.stringify(data));
          } catch {}
        }
      }
      return data;
    } finally {
      this.tasksLoading = false;
      this.notify();
    }
  };

  fetchProjects = async (scopeKey = "", options = {}) => {
    if (this.projects.length === 0) {
      this.projectsLoading = true;
      this.notify();
    }

    try {
      const data = await api.get("/projects", options);
      if (Array.isArray(data)) {
        const enriched = data.map((p, idx) => ({
          ...p,
          id: p.id,
          identifier: p.identifier || `KRI-PRJ-${idx + 1}`,
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

        this.setProjectsInternal(enriched, true);
        this.projectsLoaded = true;
        if (scopeKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(`kriri:cache:projects_${scopeKey}`, JSON.stringify(enriched));
          } catch {}
        }
        return enriched;
      }
      return data;
    } finally {
      this.projectsLoading = false;
      this.notify();
    }
  };

  reset = () => {
    this.tasks = [];
    this.tasksMap.clear();
    this.projects = [];
    this.projectsMap.clear();
    this.tasksLoading = false;
    this.projectsLoading = false;
    this.tasksLoaded = false;
    this.projectsLoaded = false;
    this.notify();
  };
}

export const dataStore = new ServerStateStore();

/**
 * Hook to subscribe reactively to authoritative task data.
 */
export function useTasksStore() {
  const tasks = useSyncExternalStore(
    dataStore.subscribe,
    dataStore.getTasksSnapshot,
    dataStore.getTasksSnapshot
  );

  const setTasks = useCallback((updater) => {
    dataStore.setTasks(updater);
  }, []);

  const fetchTasks = useCallback((scopeKey, options) => {
    return dataStore.fetchTasks(scopeKey, options);
  }, []);

  const addDependency = useCallback((taskId, dependsOnTaskId, type) => {
    return dataStore.addDependency(taskId, dependsOnTaskId, type);
  }, []);

  const removeDependency = useCallback((taskId, dependsOnTaskId) => {
    return dataStore.removeDependency(taskId, dependsOnTaskId);
  }, []);

  return {
    tasks,
    setTasks,
    fetchTasks,
    addDependency,
    removeDependency,
    tasksLoading: dataStore.getTasksLoading(),
    tasksLoaded: dataStore.tasksLoaded,
  };
}

/**
 * Hook to subscribe reactively to authoritative project data.
 */
export function useProjectsStore() {
  const projects = useSyncExternalStore(
    dataStore.subscribe,
    dataStore.getProjectsSnapshot,
    dataStore.getProjectsSnapshot
  );

  const setProjects = useCallback((updater) => {
    dataStore.setProjects(updater);
  }, []);

  const fetchProjects = useCallback((scopeKey, options) => {
    return dataStore.fetchProjects(scopeKey, options);
  }, []);

  return {
    projects,
    setProjects,
    fetchProjects,
    projectsLoading: dataStore.getProjectsLoading(),
    projectsLoaded: dataStore.projectsLoaded,
  };
}
