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
    s.off("PROJECT_CREATED", this.handleProjectCreated);
    s.off("PROJECT_UPDATED", this.handleProjectUpdated);
    s.off("PROJECT_DELETED", this.handleProjectDeleted);
    this.attachedSocket = null;
  };

  // Asynchronous fetch coordinators
  fetchTasks = async (scopeKey = "", options = {}) => {
    if (this.tasks.length === 0) {
      this.tasksLoading = true;
      this.notify();
    }

    try {
      const data = await api.get("/tasks", options);
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

  return {
    tasks,
    setTasks,
    fetchTasks,
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
