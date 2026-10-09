import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useSocket } from "../contexts/SocketContext";

export function useProjectData(user, organization) {
  const userName = user?.fullName || "User";
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    projectId: null,
  });

  const canManageProjects =
    ["Owner", "Admin", "Project Manager", "Member", "Team Lead"].includes(
      currentUserRole,
    ) || !organization;

  // Fetch current user role in organization
  useEffect(() => {
    const fetchRole = async () => {
      if (!organization) {
        setCurrentUserRole("Owner");
        return;
      }
      try {
        const response = await api.get(
          `/workspaces/${organization.id}/members`,
        );
        const members = Array.isArray(response)
          ? response
          : response.data?.members || [];
        const currentMember = members.find(
          (m) => m.email === user?.primaryEmailAddress?.emailAddress,
        );
        if (currentMember) setCurrentUserRole(currentMember.role);
      } catch (err) {
        console.error("Failed to fetch role", err);
      }
    };
    if (user) {
      fetchRole();
    }
  }, [organization, user]);

  // WebSocket subscriptions for real-time changes
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleProjectCreated = (newProject) => {
      setProjects((prev) => {
        if (prev.some((p) => p.id === newProject.id)) return prev;
        return [newProject, ...prev];
      });
    };

    const handleProjectUpdated = (updatedProject) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === updatedProject.id ? { ...p, ...updatedProject } : p,
        ),
      );
    };

    const handleProjectDeleted = ({ id }) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    };

    socket.on("PROJECT_CREATED", handleProjectCreated);
    socket.on("PROJECT_UPDATED", handleProjectUpdated);
    socket.on("PROJECT_DELETED", handleProjectDeleted);

    return () => {
      socket.off("PROJECT_CREATED", handleProjectCreated);
      socket.off("PROJECT_UPDATED", handleProjectUpdated);
      socket.off("PROJECT_DELETED", handleProjectDeleted);
    };
  }, [socket]);

  // Initial API fetch
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
        console.warn("API get projects failed:", err);
        setProjects([]);
        setLoading(false);
      });
  }, []);

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
      if (prev.some((p) => p.id === enriched.id)) return prev;
      return [enriched, ...prev];
    });
  };

  return {
    projects,
    setProjects,
    loading,
    currentUserRole,
    canManageProjects,
    confirmModal,
    setConfirmModal,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleCreateProject,
  };
}
