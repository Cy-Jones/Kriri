import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MoreHorizontal, X } from "lucide-react";
import {
  useUser,
  useOrganization,
  OrganizationProfile,
} from "@clerk/clerk-react";
import { api } from "../lib/api";
import ConfirmModal from "../components/ConfirmModal";

export default function Team() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    memberId: null,
  });

  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;
  const currentUserRole = members.find(
    (m) => m.email === currentUserEmail,
  )?.role;
  const canManageRoles =
    currentUserRole === "Admin" || currentUserRole === "Owner" || !organization;

  const fetchMembers = useCallback(async () => {
    if (!organization) {
      // If it's a personal account, there is no team, just the user
      setMembers([
        {
          id: user?.id || "personal",
          name: user?.fullName || "User",
          email: user?.primaryEmailAddress?.emailAddress || "",
          avatar_url: user?.imageUrl,
          role: "Owner",
          joined_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/workspaces/${organization.id}/members`);
      setMembers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, user?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateRole = async (userId, newRole) => {
    setActionError(null);
    try {
      await api.put(`/workspaces/${organization.id}/members/${userId}/role`, {
        role: newRole,
      });
      fetchMembers();
    } catch (err) {
      setActionError("Failed to update role: " + err.message);
    }
  };

  const removeMember = async (userId) => {
    setActionError(null);
    setConfirmModal({ isOpen: true, memberId: userId });
  };

  const confirmRemoveMember = async () => {
    const userId = confirmModal.memberId;
    setConfirmModal({ isOpen: false, memberId: null });
    if (!userId) return;
    try {
      await api.delete(`/workspaces/${organization.id}/members/${userId}`);
      setActiveActionMenu(null);
      fetchMembers();
    } catch (err) {
      setActionError("Failed to remove member: " + err.message);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveActionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getInitial = (name, email) => {
    if (name) return name[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  const getAvatarColor = (name, email) => {
    const str = name || email || "U";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-[#E91E63]",
      "bg-[#9C27B0]",
      "bg-[#673AB7]",
      "bg-[#3F51B5]",
      "bg-[#009688]",
      "bg-[#4CAF50]",
      "bg-[#FF9800]",
      "bg-[#795548]",
      "bg-[#607D8B]",
      "bg-[#F44336]",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const ASSIGNABLE_ROLES = [
    "Admin",
    "Project Manager",
    "Team Lead",
    "Member",
    "Viewer",
    "Guest",
  ];

  const filteredMembers = members.filter(
    (m) =>
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-300 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-1">
            {organization
              ? `${organization.name} Workspace`
              : "Personal Workspace"}
          </h1>
          <p className="text-[13px] text-text-muted">
            Manage your workspace members and their roles.
          </p>
        </div>
        {canManageRoles && (
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={!organization} // Cannot invite to personal workspace
            className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              organization
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/10 text-white/50 cursor-not-allowed"
            }`}
            title={
              !organization
                ? "Switch to a team workspace to invite members"
                : ""
            }
          >
            <Plus size={16} />
            Invite Member
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-[320px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Filter by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-md pl-9 pr-3 py-1.5 text-[13px] text-white placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {actionError && (
        <div className="mb-6 p-3 rounded-md bg-danger/10 border border-danger/20 text-danger text-[13px] flex items-center gap-2">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-auto hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col border border-white/[0.06] rounded-xl bg-transparent overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted text-[13px]">
            Loading members...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-danger text-[13px]">{error}</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-[13px]">
            No members found
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="font-normal text-text-muted text-[13px] px-4 py-3">
                  User
                </th>
                <th className="font-normal text-text-muted text-[13px] px-4 py-3">
                  Joined
                </th>
                <th className="font-normal text-text-muted text-[13px] px-4 py-3">
                  Role
                </th>
                <th className="font-normal text-text-muted text-[13px] px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full ${member.avatar_url ? "bg-white/10" : getAvatarColor(member.name, member.email)} flex items-center justify-center text-[16px] font-normal text-white overflow-hidden shrink-0`}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitial(member.name, member.email)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-[#e8e8e8]">
                            {member.name || member.email}
                          </span>
                          {member.email === currentUserEmail && (
                            <span className="text-[11px] text-text-muted bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-md">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] text-text-muted">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#e8e8e8]">
                    {member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#e8e8e8]">
                    {canManageRoles && member.role !== "Owner" ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateRole(member.id, e.target.value)}
                        disabled={member.email === currentUserEmail}
                        className="bg-transparent border border-white/[0.1] rounded px-2 py-1 text-[13px] text-white focus:outline-none focus:border-white/20 cursor-pointer disabled:opacity-50"
                        title={
                          member.email === currentUserEmail
                            ? "You cannot change your own role"
                            : ""
                        }
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option
                            key={r}
                            value={r}
                            className="bg-[#18191b] text-white"
                          >
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{member.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-muted">
                    {canManageRoles &&
                    member.role !== "Owner" &&
                    member.email !== currentUserEmail ? (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenu(
                              activeActionMenu === member.id ? null : member.id,
                            );
                          }}
                          className="w-8 h-8 rounded hover:bg-white/[0.04] transition-colors flex items-center justify-center text-text-muted hover:text-white"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {activeActionMenu === member.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-40 bg-[#18191b] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => removeMember(member.id)}
                              className="w-full text-left px-3 py-2 text-[13px] text-danger hover:bg-white/[0.04] transition-colors flex items-center"
                            >
                              Remove member
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8" /> // placeholder for alignment
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
            <button
              onClick={() => {
                setShowInviteModal(false);
                fetchMembers(); // refresh in case someone was added
              }}
              className="absolute top-4 right-4 z-10 p-2 rounded-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <OrganizationProfile
              appearance={{
                elements: {
                  rootBox: "w-full shadow-none",
                  card: "w-full shadow-none rounded-xl",
                },
              }}
            />
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, memberId: null })}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        message="Are you sure you want to remove this member? They will lose access to all projects and tasks in this workspace."
        confirmText="Remove"
        isDanger={true}
      />
    </div>
  );
}
