import { useState, useEffect, useRef, useMemo, useCallback, startTransition, memo } from "react";
import { useNavigate } from "react-router-dom";
import { getAvatarColor, getInitial } from "../../lib/avatarUtils";
import MembersAvatarStack from "./MembersAvatarStack";
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
  Layout,
} from "lucide-react";
import { api } from "../../lib/api";
import { ProjectsEmptyIcon } from "../../components/EmptyStateIcons";
import CreateProjectModal from "../../components/CreateProjectModal";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { Button } from "@/registry/components/button/button";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import DropdownMenu from "@/registry/components/dropdown-menu/dropdown-menu";
import { Progress } from "@/registry/components/progress/progress";
import { Badge } from "@/registry/components/badge/badge";
import PriorityPicker, {
  getPriorityIcon,
} from "../../components/PriorityPicker";
import LeadPicker from "../../components/LeadPicker";
import DatePicker from "../../components/DatePicker";
import ActionTooltip from "../../components/ActionTooltip";
import StatusPicker, { getStatusIcon } from "../../components/StatusPicker";
import HealthPicker, { getHealthIcon } from "../../components/HealthPicker";
import ProgressPicker from "../../components/ProgressPicker";
import LabelPicker from "../../components/LabelPicker";
import MemberPicker from "../../components/MemberPicker";
import PickerWrapper from "../../components/PickerWrapper";

// ============================================================================
// DND & ROW MEMOIZATION HELPERS
// ============================================================================
const areProjectListRowPropsEqual = (prevProps, nextProps) => {
  if (prevProps.project !== nextProps.project) {
    const p = prevProps.project;
    const n = nextProps.project;
    if (p.id !== n.id) return false;
    if (p.name !== n.name) return false;
    if (p.identifier !== n.identifier) return false;
    if (p.description !== n.description) return false;
    if (p.status !== n.status) return false;
    if (p.priority !== n.priority) return false;
    if (p.health !== n.health) return false;
    if (p.lead?.id !== n.lead?.id) return false;
    if (p.lead?.name !== n.lead?.name) return false;
    if (p.lead?.avatar_url !== n.lead?.avatar_url) return false;
    if (p.start_date !== n.start_date) return false;
    if (p.due_date !== n.due_date) return false;
    if (p.issue_count !== n.issue_count) return false;
    if (p.progress !== n.progress) return false;
    if (p.members !== n.members) return false;
    if (p.labels !== n.labels) return false;
    if (p.milestones !== n.milestones) return false;
    if (p.dependencies !== n.dependencies) return false;
    if (p.dependencies_count !== n.dependencies_count) return false;
    if (p.blocked_tasks_count !== n.blocked_tasks_count) return false;
  }
  if (prevProps.activePicker !== nextProps.activePicker) {
    const prevPickerActive =
      prevProps.activePicker?.projectId === prevProps.project.id
        ? prevProps.activePicker.type
        : null;
    const nextPickerActive =
      nextProps.activePicker?.projectId === nextProps.project.id
        ? nextProps.activePicker.type
        : null;
    if (prevPickerActive !== nextPickerActive) return false;
  }
  if (prevProps.availableMembers !== nextProps.availableMembers) return false;
  if (prevProps.gridCols !== nextProps.gridCols) return false;
  if (prevProps.properties !== nextProps.properties) return false;
  if (prevProps.config !== nextProps.config) return false;
  if (prevProps.canManageProjects !== nextProps.canManageProjects) return false;
  if (prevProps.onProjectClick !== nextProps.onProjectClick) return false;
  if (prevProps.onUpdateProject !== nextProps.onUpdateProject) return false;
  if (prevProps.onDeleteProject !== nextProps.onDeleteProject) return false;
  if (prevProps.setActivePicker !== nextProps.setActivePicker) return false;
  if (prevProps.onDragStart !== nextProps.onDragStart) return false;
  if (prevProps.onDropOnRow !== nextProps.onDropOnRow) return false;
  return true;
};

const ProjectListRow = memo(function ProjectListRow({
  project,
  config,
  properties,
  gridCols,
  activePicker,
  canManageProjects,
  onUpdateProject,
  onDeleteProject,
  setActivePicker,
  onProjectClick,
  onDragStart,
  onDropOnRow,
  availableMembers = [],
}) {
  const hasActivePicker = activePicker?.projectId === project.id;
  return (
    <div
      draggable={config.ordering === "manual"}
      onDragStart={(e) => onDragStart(e, project)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDropOnRow(e, project)}
      onClick={() => onProjectClick(project)}
      className={`grid gap-8 items-center px-6 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.02] rounded-xl transition-colors cursor-pointer text-[13px] group mx-2 text-foreground select-none ${
        hasActivePicker ? "relative z-30" : ""
      }`}
      style={{
        gridTemplateColumns: gridCols,
        ...(hasActivePicker
          ? { position: "relative", zIndex: 30 }
          : { contentVisibility: "auto", containIntrinsicSize: "0 44px" }),
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#e95454]"
          >
            <path
              d="M7 1L12.5 4.17742V10.5323L7 13.7097L1.5 10.5323V4.17742L7 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle
              cx="7"
              cy="7.35484"
              r="2"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="flex flex-col min-w-0 max-w-[280px] sm:max-w-[350px] lg:max-w-[450px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate group-hover:text-foreground transition-colors">
              {project.name}
            </span>
            {properties.id && (
              <ActionTooltip label={`Project ID: ${project.identifier || project.id}`}>
                <span className="text-[12px] text-text-muted font-mono whitespace-nowrap flex-shrink-0 px-1 py-0.5 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                  {project.identifier || project.id}
                </span>
              </ActionTooltip>
            )}
          </div>
          {properties.summary && project.description && (
            <span className="text-[12px] text-text-muted line-clamp-2 leading-tight mt-[1px] whitespace-normal break-words">
              {project.description.split("\n\n")[0]}
            </span>
          )}
        </div>
      </div>

      {properties.health && (
        <div className="relative">
          <ActionTooltip label="Update health status">
            <div
              className={`text-[12px] text-text-muted flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                setActivePicker({
                  type: "health",
                  projectId: project.id,
                });
              }}
            >
              {getHealthIcon(project.health || "No updates")}
              <span>{project.health || "No updates"}</span>
            </div>
          </ActionTooltip>
          {activePicker.type === "health" &&
            activePicker.projectId === project.id && (
              <HealthPicker
                value={project.health || "No updates"}
                onChange={(val) =>
                  onUpdateProject(project.id, { health: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.priority && (
        <div className="relative">
          <ActionTooltip
            label={
              project.priority
                ? `Priority: ${project.priority}`
                : "Set priority"
            }
            shortcut="P then P"
          >
            <div
              className={`flex items-center p-1 -ml-1 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                setActivePicker({
                  type: "priority",
                  projectId: project.id,
                });
              }}
            >
              {getPriorityIcon(project.priority)}
            </div>
          </ActionTooltip>
          {activePicker.type === "priority" &&
            activePicker.projectId === project.id && (
              <PriorityPicker
                value={project.priority}
                onChange={(val) =>
                  onUpdateProject(project.id, { priority: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.lead && (
        <div className="relative">
          <ActionTooltip
            label={
              project.lead
                ? `Lead: ${project.lead.name || project.lead.email || "Assigned"}`
                : "Assign project lead"
            }
          >
            <div
              className={`flex items-center p-1 -ml-1 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "lead" &&
                      activePicker.projectId === project.id
                        ? null
                        : "lead",
                    projectId:
                      activePicker.type === "lead" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              {project.lead ? (
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white uppercase overflow-hidden ${getAvatarColor(project.lead.name, project.lead.email)}`}
                >
                  {project.lead.avatar_url ? (
                    <img
                      src={project.lead.avatar_url}
                      alt={project.lead.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitial(
                      project.lead.name,
                      project.lead.email,
                    )
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-black/[0.15] dark:border-white/[0.1] border-dashed text-zinc-400 dark:text-white/[0.3]">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
          </ActionTooltip>
          {activePicker.type === "lead" &&
            activePicker.projectId === project.id && (
              <LeadPicker
                value={project.lead}
                availableMembers={availableMembers}
                onChange={(val) =>
                  onUpdateProject(project.id, { lead: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.due_date && (
        <div className="relative">
          <ActionTooltip
            label={
              project.due_date
                ? `Target date: ${new Date(project.due_date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}`
                : "Set target date"
            }
          >
            <div
              className={`text-[12px] text-text-muted flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "dueDate" &&
                      activePicker.projectId === project.id
                        ? null
                        : "dueDate",
                    projectId:
                      activePicker.type === "dueDate" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                ></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {project.due_date
                ? new Date(project.due_date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )
                : "---"}
            </div>
          </ActionTooltip>
          {activePicker.type === "dueDate" &&
            activePicker.projectId === project.id && (
              <DatePicker
                value={project.due_date}
                onChange={(val) =>
                  onUpdateProject(project.id, { due_date: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
                placeholder="Target date"
              />
            )}
        </div>
      )}

      {properties.issues && (
        <div className="relative">
          <ActionTooltip
            label={`${
              project.issue_count ??
              project.issues_count ??
              project.issuesCount ??
              0
            } active issue${
              (project.issue_count ??
                project.issues_count ??
                project.issuesCount ??
                0) === 1
                ? ""
                : "s"
            }`}
          >
            <div className="text-[12px] text-text-muted inline-flex items-center px-2 py-1 -ml-2 rounded-full transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-default w-fit">
              {project.issue_count ??
                project.issues_count ??
                project.issuesCount ??
                0}
            </div>
          </ActionTooltip>
        </div>
      )}

      {properties.progress && (
        <div className="relative">
          <ActionTooltip label={`Progress: ${project.progress || 0}%`}>
            <div
              className={`flex items-center gap-2 group/prog px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "progress" &&
                      activePicker.projectId === project.id
                        ? null
                        : "progress",
                    projectId:
                      activePicker.type === "progress" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              <div className="flex-1 w-12 bg-black/[0.06] dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (project.progress || 0) === 100
                      ? "bg-[#5e6ad2]"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-text-muted w-7 text-right">
                {project.progress || 0}%
              </span>
            </div>
          </ActionTooltip>
          {activePicker.type === "progress" &&
            activePicker.projectId === project.id && (
              <ProgressPicker
                value={project.progress || 0}
                onChange={(val) =>
                  onUpdateProject(project.id, { progress: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.status && (
        <div className="relative">
          <ActionTooltip
            label={project.status || "Planned"}
            shortcut="P then S"
          >
            <div
              className={`text-[12px] text-text-muted whitespace-nowrap px-2 py-1 -ml-2 rounded-full transition-colors flex items-center gap-1.5 ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "status" &&
                      activePicker.projectId === project.id
                        ? null
                        : "status",
                    projectId:
                      activePicker.type === "status" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              {getStatusIcon(project.status || "Planned")}
              <span>{project.status || "Planned"}</span>
            </div>
          </ActionTooltip>
          {activePicker.type === "status" &&
            activePicker.projectId === project.id && (
              <StatusPicker
                value={project.status || "Planned"}
                onChange={(val) =>
                  onUpdateProject(project.id, { status: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.members && (
        <div className="relative">
          <ActionTooltip
            label={
              project.members?.length
                ? `${project.members.length} team member${project.members.length === 1 ? "" : "s"}`
                : "Add project members"
            }
          >
            <div
              className={`flex items-center px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "members" &&
                      activePicker.projectId === project.id
                        ? null
                        : "members",
                    projectId:
                      activePicker.type === "members" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              {project.members && (
                <MembersAvatarStack
                  members={project.members}
                  max={3}
                />
              )}
              {!project.members?.length && (
                <User size={12} className="text-text-muted" />
              )}
            </div>
          </ActionTooltip>
          {activePicker.type === "members" &&
            activePicker.projectId === project.id && (
              <MemberPicker
                align="right"
                currentMembers={project.members || []}
                availableMembers={availableMembers}
                onSelect={(val) =>
                  onUpdateProject(project.id, { members: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.start_date && (
        <div className="relative">
          <ActionTooltip
            label={
              project.start_date
                ? `Start date: ${new Date(project.start_date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}`
                : "Set start date"
            }
          >
            <div
              className={`text-[12px] text-text-muted flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "start_date" &&
                      activePicker.projectId === project.id
                        ? null
                        : "start_date",
                    projectId:
                      activePicker.type === "start_date" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              <Calendar size={12} className="opacity-60" />
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )
                : "---"}
            </div>
          </ActionTooltip>
          {activePicker.type === "start_date" &&
            activePicker.projectId === project.id && (
              <DatePicker
                align="right"
                value={project.start_date}
                onChange={(val) =>
                  onUpdateProject(project.id, {
                    start_date: val,
                  })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
                placeholder="Start date"
              />
            )}
        </div>
      )}

      {properties.labels && (
        <div className="relative">
          <ActionTooltip
            label={
              project.labels?.length
                ? `Labels: ${project.labels.join(", ")}`
                : "Manage labels"
            }
          >
            <div
              className={`flex items-center gap-1 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : "cursor-default"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canManageProjects) {
                  setActivePicker({
                    type:
                      activePicker.type === "labels" &&
                      activePicker.projectId === project.id
                        ? null
                        : "labels",
                    projectId:
                      activePicker.type === "labels" &&
                      activePicker.projectId === project.id
                        ? null
                        : project.id,
                  });
                }
              }}
            >
              {project.labels?.slice(0, 2).map((label, i) => (
                <div
                  key={i}
                  className="px-1.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-sm text-[10px] text-text-muted whitespace-nowrap"
                >
                  {label}
                </div>
              ))}
              {project.labels?.length > 2 && (
                <span className="text-[10px] text-text-muted">
                  +{project.labels.length - 2}
                </span>
              )}
              {!project.labels?.length && (
                <Tag size={12} className="text-text-muted" />
              )}
            </div>
          </ActionTooltip>
          {activePicker.type === "labels" &&
            activePicker.projectId === project.id && (
              <LabelPicker
                align="right"
                selectedLabels={project.labels || []}
                onChange={(val) =>
                  onUpdateProject(project.id, { labels: val })
                }
                onClose={() =>
                  setActivePicker({
                    type: null,
                    projectId: null,
                  })
                }
              />
            )}
        </div>
      )}

      {properties.milestones && (
        <div className="relative">
          <ActionTooltip
            label={`${project.milestones?.length || 0} milestone${(project.milestones?.length || 0) === 1 ? "" : "s"}`}
          >
            <div className="text-[11px] text-text-muted inline-flex items-center px-2 py-1 -ml-2 rounded-full transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-default w-fit">
              {project.milestones?.length || 0}
            </div>
          </ActionTooltip>
        </div>
      )}

      {properties.dependencies && (
        <div className="relative">
          <ActionTooltip
            label={`${Number(
              project.dependencies_count ??
                project.blocked_tasks_count ??
                (Array.isArray(project.dependencies)
                  ? project.dependencies.length
                  : 0),
            )} dependenc${
              Number(
                project.dependencies_count ??
                  project.blocked_tasks_count ??
                  (Array.isArray(project.dependencies)
                    ? project.dependencies.length
                    : 0),
              ) === 1
                ? "y"
                : "ies"
            }`}
          >
            <div
              className="text-[11px] text-text-muted inline-flex items-center px-2 py-1 -ml-2 rounded-full transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-default w-fit"
              data-testid={`project-dependencies-count-${project.id}`}
            >
              {Number(
                project.dependencies_count ??
                  project.blocked_tasks_count ??
                  (Array.isArray(project.dependencies)
                    ? project.dependencies.length
                    : 0),
              )}
            </div>
          </ActionTooltip>
        </div>
      )}
    </div>
  );
}, areProjectListRowPropsEqual);

// ============================================================================
// LIST VIEW COMPONENT
// ============================================================================
export default memo(function ListViewRenderer({
  projects,
  config,
  groupProjects,
  sortProjects,
  collapsedGroups,
  toggleGroupCollapse,
  onUpdateProject,
  onDeleteProject,
  navigate,
  activePicker,
  setActivePicker,
  canManageProjects,
  availableMembers = [],
  listScrollRef,
  onScroll,
}) {
  const grouped = useMemo(
    () => groupProjects(projects, config.grouping),
    [projects, config.grouping, groupProjects],
  );
  const properties = config.properties || {};

  const handleDragStart = useCallback((e, project) => {
    if (!canManageProjects) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", project.id);
  }, [canManageProjects]);

  const handleDropOnRow = useCallback((e, targetProject) => {
    if (!canManageProjects) return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId === targetProject.id) return;

    const targetPos = targetProject.position || 1;
    onUpdateProject(sourceId, { position: targetPos - 0.5 });
  }, [canManageProjects, onUpdateProject]);

  const handleProjectClick = useCallback(
    (project) => {
      navigate(`/projects/${project.id}`, {
        state: {
          loadingTitle: project.name || project.title || "Project Details",
        },
      });
    },
    [navigate],
  );

  const gridCols = [
    "minmax(200px, 1fr)",
    properties.health && "100px",
    properties.priority && "80px",
    properties.lead && "60px",
    properties.due_date && "110px",
    properties.issues && "60px",
    properties.progress && "80px",
    properties.status && "100px",
    properties.members && "100px",
    properties.start_date && "100px",
    properties.labels && "120px",
    properties.milestones && "100px",
    properties.dependencies && "100px",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={listScrollRef}
      onScroll={onScroll}
      className="w-full flex flex-col h-full overflow-auto"
    >
      <div className="min-w-max flex flex-col min-h-full">
        <div
          className="grid gap-8 items-center px-6 py-2.5 text-[12px] font-medium text-text-muted sticky top-0 z-20 bg-background select-none mx-2"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div>Name</div>
          {properties.health && <div>Health</div>}
          {properties.priority && <div>Priority</div>}
          {properties.lead && <div>Lead</div>}
          {properties.due_date && <div>Target Date</div>}
          {properties.issues && <div>Issues</div>}
          {properties.progress && <div>Progress</div>}
          {properties.status && <div>Status</div>}
          {properties.members && <div>Members</div>}
          {properties.start_date && <div>Start Date</div>}
          {properties.labels && <div>Labels</div>}
          {properties.milestones && <div>Milestones</div>}
          {properties.dependencies && <div>Dependencies</div>}
        </div>

        <div className="flex flex-col flex-1 pb-72">
          {Object.entries(grouped).map(([groupTitle, groupItems]) => {
            const sortedItems = sortProjects(
              groupItems,
              config.ordering,
              config.orderDirection,
            );
            const isCollapsed = collapsedGroups[`list_${groupTitle}`];

            return (
              <div key={groupTitle} className="flex flex-col">
                {config.grouping !== "none" && (
                  <div
                    onClick={() => toggleGroupCollapse(`list_${groupTitle}`)}
                    className="flex items-center gap-2 px-6 py-2 bg-surface-elevated hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer text-[13px] font-medium text-zinc-900 dark:text-[#e8e8e8] transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={14} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={14} className="text-text-muted" />
                    )}
                    <span>{groupTitle}</span>
                    <span className="text-text-muted text-[12px] ml-1">
                      {groupItems.length}
                    </span>
                  </div>
                )}

                {!isCollapsed &&
                  sortedItems.map((project) => (
                    <ProjectListRow
                      key={project.id}
                      project={project}
                      config={config}
                      properties={properties}
                      gridCols={gridCols}
                      activePicker={activePicker}
                      canManageProjects={canManageProjects}
                      onUpdateProject={onUpdateProject}
                      onDeleteProject={onDeleteProject}
                      setActivePicker={setActivePicker}
                      onProjectClick={handleProjectClick}
                      onDragStart={handleDragStart}
                      onDropOnRow={handleDropOnRow}
                      availableMembers={availableMembers}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
