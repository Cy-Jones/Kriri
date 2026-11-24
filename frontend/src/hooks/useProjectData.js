import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useSocket } from "../contexts/useSocket";
import { useProjectsStore, dataStore } from "../lib/dataStore";

export function useProjectData(user, organization) {
  const userName = user?.fullName || "User";
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const isAuditMock = typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage?.getItem("audit_mock_auth") === "true");
  const scopeKey = user?.id ? `${user.id}:${organization?.id || "personal"}` : (isAuditMock ? "mock_user:personal" : null);

  const { projects, setProjects, fetchProjects } = useProjectsStore();
  const [loading, setLoading] = useState(() => (isAuditMock ? false : projects.length === 0));

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    projectId: null,
  });

  const canManageProjects =
    ["Owner", "Admin", "Project Manager", "Member", "Team Lead"].includes(
      currentUserRole,
    ) || !organization;

  // Custom DOM event listener for project creation
  useEffect(() => {
    const handleCreated = (e) => {
      if (e.detail) {
        dataStore.handleProjectCreated(e.detail);
      }
    };
    window.addEventListener("kriri:project-created", handleCreated);
    return () => window.removeEventListener("kriri:project-created", handleCreated);
  }, []);

  // Fetch current user role and available members in organization
  useEffect(() => {
    const fetchRoleAndMembers = async () => {
      if (!organization?.id) {
        setCurrentUserRole("Owner");
        if (user) {
          setAvailableMembers([
            {
              id: user.id || "personal",
              name: user.fullName || "User",
              email: user.primaryEmailAddress?.emailAddress || "",
              avatar_url: user.imageUrl,
            },
          ]);
        }
        return;
      }
      try {
        const cachedMembers = api.getCached(`/workspaces/${organization.id}/members`);
        let members = Array.isArray(cachedMembers) ? cachedMembers : null;
        if (!members) {
          const response = await api.get(
            `/workspaces/${organization.id}/members`,
            { ttl: 300000 }
          );
          members = Array.isArray(response)
            ? response
            : response.data?.members || [];
        }
        if (Array.isArray(members)) {
          setAvailableMembers(members);
          const currentMember = members.find(
            (m) => m.email === user?.primaryEmailAddress?.emailAddress,
          );
          if (currentMember) setCurrentUserRole(currentMember.role);
        }
      } catch (err) {
        console.error("Failed to fetch role and members", err);
      }
    };
    if (user || organization?.id) {
      fetchRoleAndMembers();
    }
  }, [organization?.id, user]);

  // Fetch projects once user context is loaded or workspace changes
  useEffect(() => {
    if (!user && !isAuditMock) return;
    if (projects.length === 0) setLoading(true);
    fetchProjects(scopeKey)
      .then(() => setLoading(false))
      .catch((err) => {
        console.warn("API get projects failed:", err);
        setLoading(false);
      });
  }, [user?.id, organization?.id, scopeKey, fetchProjects, isAuditMock]);

  const handleUpdateProject = async (projectId, updatedFields) => {
    if (!canManageProjects) return;
    const patch = { ...updatedFields, updated_at: new Date().toISOString() };
    dataStore.handleProjectUpdated({ id: projectId, ...patch });
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

    dataStore.handleProjectDeleted(projectId);
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
    dataStore.handleProjectCreated(enriched);
  };

  return {
    projects,
    setProjects,
    loading,
    currentUserRole,
    canManageProjects,
    availableMembers,
    confirmModal,
    setConfirmModal,
    handleUpdateProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleCreateProject,
  };
}
