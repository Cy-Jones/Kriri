import { useState, useEffect, useMemo } from "react";
import { useOrganization, useUser, useClerk } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { Building, ChevronDown, X, Pencil, Check } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { api } from "@/lib/api";
import { sileo } from "sileo";
import { playUiSound } from "@/lib/sound";

export default function WorkspaceProfileGeneralPage() {
  const { organization, membership } = useOrganization();
  const { user } = useUser();
  const { setActive } = useClerk();
  const navigate = useNavigate();

  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState("");

  const [isEditingName, setIsEditingName] = useState(false);
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeavingWorkspace, setIsLeavingWorkspace] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [deleteMatchText, setDeleteMatchText] = useState("");

  useEffect(() => {
    if (organization?.name) {
      setOrgName(organization.name);
    }
  }, [organization?.name]);

  useEffect(() => {
    let active = true;
    api
      .get("/workspaces/current")
      .then((data) => {
        if (active && data) setCurrentWorkspace(data);
      })
      .catch((err) => console.warn("Failed to load current workspace:", err));
    return () => {
      active = false;
    };
  }, [organization?.id]);

  useEffect(() => {
    if (isLeaveModalOpen && (currentWorkspace?.id || organization?.id)) {
      const targetId = currentWorkspace?.id || organization?.id;
      api
        .get(`/workspaces/${targetId}/members`)
        .then((members) => {
          if (Array.isArray(members)) setWorkspaceMembers(members);
        })
        .catch((err) => console.warn("Failed to load members for transfer:", err));
    }
  }, [isLeaveModalOpen, currentWorkspace?.id, organization?.id]);

  const isPersonalWorkspace = useMemo(() => {
    if (!organization) return true;
    const name = (organization.name || "").toLowerCase();
    const slug = (organization.slug || "").toLowerCase();
    return name.includes("personal") || slug.includes("personal") || !membership;
  }, [organization, membership]);

  const userRole = useMemo(() => {
    if (isPersonalWorkspace) return "personal_owner";
    const rawRole = (currentWorkspace?.role || membership?.role || "").toLowerCase();
    const isOwner =
      rawRole.includes("owner") ||
      rawRole === "org:admin" ||
      (currentWorkspace?.owner_id &&
        (String(currentWorkspace?.owner_id) === String(user?.id) ||
          String(currentWorkspace?.owner_id) === String(user?.publicMetadata?.userId)));
    if (isOwner) return "owner";
    if (rawRole.includes("admin")) return "admin";
    if (rawRole.includes("manager") || rawRole.includes("lead")) return "manager";
    return "member";
  }, [
    isPersonalWorkspace,
    membership?.role,
    currentWorkspace?.role,
    currentWorkspace?.owner_id,
    user?.id,
    user?.publicMetadata?.userId,
  ]);

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  const eligibleNewOwners = useMemo(() => {
    const primaryEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "";
    return workspaceMembers.filter((m) => {
      const isCurrent =
        String(m.id) === String(currentWorkspace?.owner_id) ||
        m.email?.toLowerCase() === primaryEmail?.toLowerCase() ||
        (user?.id && m.clerk_user_id === user.id);
      return !isCurrent;
    });
  }, [workspaceMembers, currentWorkspace?.owner_id, user]);

  const leaveModalContent = useMemo(() => {
    const targetName = organization?.name || currentWorkspace?.name || "Workspace";
    if (isPersonalWorkspace) {
      return {
        title: "Cannot Leave Personal Workspace",
        message:
          "You cannot leave your personal workspace because you are the sole owner. Personal workspaces are permanently bound to your account.",
        confirmText: "Understood",
        cancelText: null,
        isBlocked: true,
      };
    }
    if (userRole === "owner") {
      return {
        title: `Transfer Ownership of "${targetName}"`,
        message: `Notice: You are the Owner & Administrator of "${targetName}". You cannot leave this workspace without transferring ownership. Please select a team member to take over ownership before leaving.`,
        confirmText: isLeavingWorkspace
          ? "Transferring & Leaving..."
          : "Transfer Ownership & Leave Workspace",
        cancelText: "Cancel",
        isBlocked: false,
      };
    }
    if (userRole === "admin") {
      return {
        title: `Leave "${targetName}" as Administrator?`,
        message: `Notice: You are an Administrator of "${targetName}". Leaving will immediately revoke your management privileges over team members, workspace settings, integrations, and private boards.`,
        confirmText: isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace",
        cancelText: "Cancel",
        isBlocked: false,
      };
    }
    if (userRole === "manager") {
      return {
        title: `Leave "${targetName}" as Manager?`,
        message: `Notice: You are a Manager in "${targetName}". Leaving will remove your lead assignment on active milestones and sprint tasks you oversee. Teammates will need to reassign your managed projects.`,
        confirmText: isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace",
        cancelText: "Cancel",
        isBlocked: false,
      };
    }
    return {
      title: `Leave "${targetName}"?`,
      message: `Are you sure you want to remove yourself from "${targetName}"? You will immediately lose access to all projects, tasks, issues, and discussions within this workspace.`,
      confirmText: isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace",
      cancelText: "Cancel",
      isBlocked: false,
    };
  }, [isPersonalWorkspace, userRole, organization?.name, currentWorkspace?.name, isLeavingWorkspace]);

  const handleSaveName = async () => {
    const trimmed = orgName.trim();
    if (!trimmed || trimmed === organization?.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      if (organization?.update) {
        await organization.update({ name: trimmed });
      }
      await api.patch("/workspaces/current", { name: trimmed });
      sileo.success({ title: "Workspace renamed", description: trimmed });
      setIsEditingName(false);
    } catch (err) {
      sileo.error({ title: "Failed to rename", description: err.message });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleTransferAndLeave = async () => {
    if (!selectedNewOwnerId) return;
    setIsLeavingWorkspace(true);
    try {
      await api.post("/workspaces/current/transfer-ownership", {
        newOwnerId: selectedNewOwnerId,
        leaveWorkspace: true,
      });

      if (membership) {
        try {
          await membership.destroy();
        } catch (e) {
          console.warn("Clerk membership destroy note:", e.message);
        }
      }

      if (setActive) {
        try {
          await setActive({ organization: null });
        } catch (e) {
          console.warn("Could not setActive to personal:", e);
        }
      }

      playUiSound("delete");
      sileo.success({
        title: "Ownership transferred",
        description: `Ownership transferred and you have left ${organization?.name || "the workspace"}.`,
      });
      setIsLeaveModalOpen(false);
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("Transfer error:", err);
      sileo.error({
        title: "Transfer failed",
        description: err.message || "Could not transfer workspace ownership",
      });
    } finally {
      setIsLeavingWorkspace(false);
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeavingWorkspace(true);
    try {
      if (membership) {
        await membership.destroy();
      }
      if (setActive) {
        try {
          await setActive({ organization: null });
        } catch (e) {}
      }
      playUiSound("delete");
      sileo.success({
        title: "Left workspace",
        description: `You have left ${organization?.name || "the workspace"}.`,
      });
      setIsLeaveModalOpen(false);
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      sileo.error({ title: "Failed to leave", description: err.message });
    } finally {
      setIsLeavingWorkspace(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeletingWorkspace(true);
    const wsTitle = organization?.name || currentWorkspace?.name || "Workspace";
    try {
      await api.delete("/workspaces/current");
      if (organization?.destroy) {
        try {
          await organization.destroy();
        } catch (e) {}
      }
      if (setActive) {
        try {
          await setActive({ organization: null });
        } catch (e) {}
      }
      setIsDeleteModalOpen(false);
      sileo.success({
        title: "Workspace deleted",
        description: `"${wsTitle}" has been permanently removed.`,
      });
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      sileo.error({ title: "Deletion failed", description: err.message });
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const wsName = organization?.name || currentWorkspace?.name || "Software Development";

  return (
    <div className="space-y-6 text-zinc-900 dark:text-white p-1">
      {/* 1. Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">General</h2>
        <p className="text-[12.5px] text-zinc-500 dark:text-[#8a8f98] mt-0.5">
          Manage workspace identity, membership access, and administrative settings.
        </p>
      </div>

      {/* 2. Organization Profile Card */}
      <div className="border border-[var(--border,rgba(0,0,0,0.08))] dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-xl p-4 sm:p-5 bg-white dark:bg-[var(--surface,#131416)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
            style={{ backgroundColor: "var(--kriri-accent-color, #5e6ad2)" }}
          >
            {organization?.imageUrl ? (
              <img
                src={organization.imageUrl}
                alt={wsName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              wsName[0]?.toUpperCase() || "W"
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Organization Profile
              </span>
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  autoFocus
                  className="h-8 px-2.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/15 dark:border-white/15 text-[13px] text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--kriri-accent-color,#5e6ad2)]"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                {wsName}
              </h3>
            )}
          </div>
        </div>

        {isOwnerOrAdmin && !isEditingName && (
          <button
            type="button"
            onClick={() => setIsEditingName(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] hover:bg-black/[0.05] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-[12px] font-medium text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Pencil size={12} />
            <span>Update profile</span>
          </button>
        )}
      </div>

      {/* 3. Workspace Access (Exact match to Image 5 & Main Settings) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white px-0.5">
          Workspace access
        </h3>
        <div className="border border-[var(--border,rgba(0,0,0,0.08))] dark:border-[var(--border,rgba(255,255,255,0.08))] rounded-xl px-5 py-4 bg-white dark:bg-[var(--surface,#131416)] shadow-xs flex items-center justify-between transition-colors">
          <span className="text-[13px] text-zinc-500 dark:text-[#8a8f98]">
            Remove yourself from workspace
          </span>
          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            className="text-[13px] font-medium text-zinc-600 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            Leave workspace
          </button>
        </div>
      </div>

      {/* 4. Delete Organization (For Owner/Admin) */}
      {isOwnerOrAdmin && !isPersonalWorkspace && (
        <div className="space-y-2.5 pt-1">
          <h3 className="text-[13px] font-semibold text-rose-600 dark:text-rose-400 px-0.5">
            Delete organization
          </h3>
          <div className="border border-red-500/15 dark:border-red-500/20 rounded-xl px-5 py-4 bg-red-500/[0.02] dark:bg-red-500/[0.04] shadow-xs flex items-center justify-between">
            <span className="text-[12.5px] text-zinc-500 dark:text-[#8a8f98] pr-4">
              Permanently delete this workspace, sprint tickets, and project data
            </span>
            <button
              type="button"
              onClick={() => {
                setDeleteMatchText("");
                setIsDeleteModalOpen(true);
              }}
              className="text-[13px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer shrink-0"
            >
              Delete organization
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAVE / TRANSFER WORKSPACE MODAL                                          */}
      {/* ========================================================================= */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4.5 border-b border-black/10 dark:border-[#2a2a2a]">
              <h2 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                {leaveModalContent.title}
              </h2>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4">
              {isPersonalWorkspace ? (
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  {leaveModalContent.message}
                </p>
              ) : userRole === "owner" ? (
                <div className="space-y-4">
                  <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                    {leaveModalContent.message}
                  </p>

                  {eligibleNewOwners.length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 block">
                        Select new workspace owner:
                      </label>
                      <div className="relative">
                        <select
                          value={selectedNewOwnerId}
                          onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-[13px] text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--kriri-accent-color,#5e6ad2)] appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-white dark:bg-[#1a1b1e] text-zinc-400">
                            -- Choose a team member --
                          </option>
                          {eligibleNewOwners.map((m) => (
                            <option
                              key={m.id}
                              value={m.id}
                              className="bg-white dark:bg-[#1a1b1e] text-zinc-900 dark:text-white"
                            >
                              {m.name || m.email} ({m.role || "Member"})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
                        />
                      </div>
                      <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                        The selected member will be granted full Owner & Administrator privileges over this workspace.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12.5px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      There are currently no other members in this workspace to transfer ownership to. To leave, invite a colleague from the Members directory first, or permanently delete the workspace.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                  {leaveModalContent.message}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                {isPersonalWorkspace ? (
                  <Button
                    variant="primary"
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="text-[13px] h-9"
                  >
                    Understood
                  </Button>
                ) : userRole === "owner" ? (
                  eligibleNewOwners.length > 0 ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsLeaveModalOpen(false);
                          setSelectedNewOwnerId("");
                        }}
                        className="text-[13px] h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!selectedNewOwnerId || isLeavingWorkspace}
                        onClick={handleTransferAndLeave}
                        className={`text-[13px] h-9 transition-all ${
                          !selectedNewOwnerId
                            ? "opacity-50 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                            : "bg-[#ef4444] text-white hover:bg-[#dc2626] border-none shadow-sm font-medium"
                        }`}
                      >
                        {isLeavingWorkspace
                          ? "Transferring & Leaving..."
                          : selectedNewOwnerId
                          ? "Transfer Ownership & Leave"
                          : "Select Member to Transfer"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setIsLeaveModalOpen(false)}
                        className="text-[13px] h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setIsLeaveModalOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-[13px] h-9 bg-rose-600 hover:bg-rose-700 text-white border-none font-medium"
                      >
                        Delete Workspace
                      </Button>
                    </>
                  )
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setIsLeaveModalOpen(false)}
                      className="text-[13px] h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      disabled={isLeavingWorkspace}
                      onClick={handleConfirmLeave}
                      className="text-[13px] h-9 bg-[#ef4444] text-white hover:bg-[#dc2626] border-none shadow-sm font-medium"
                    >
                      {isLeavingWorkspace ? "Leaving..." : "Confirm & Leave Workspace"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ORGANIZATION MODAL                                                 */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#1a1b1e] border border-black/10 dark:border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-[#2a2a2a]">
              <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-white">
                Delete "{wsName}"
              </h2>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-[#85868a] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <p className="text-[13px] text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
                Are you sure you want to permanently delete this workspace? This will remove all associated projects, tasks, issues, and team data. This action cannot be undone.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] text-zinc-500 dark:text-[#85868a]">
                  To confirm, enter{" "}
                  <span className="font-semibold text-zinc-900 dark:text-white select-all">
                    "{wsName}"
                  </span>{" "}
                  below:
                </label>
                <input
                  type="text"
                  value={deleteMatchText}
                  onChange={(e) => setDeleteMatchText(e.target.value)}
                  placeholder={wsName}
                  autoFocus
                  className="w-full px-3 py-1.5 text-[13px] rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-[13px] h-8"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmDelete}
                  disabled={deleteMatchText.trim() !== wsName.trim() || isDeletingWorkspace}
                  className={`text-[13px] h-8 transition-all ${
                    deleteMatchText.trim() !== wsName.trim()
                      ? "opacity-40 cursor-not-allowed"
                      : "bg-[#ef4444] text-white hover:bg-[#dc2626] border-none shadow-sm font-medium"
                  }`}
                >
                  {isDeletingWorkspace ? "Deleting..." : "Delete Organization"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
