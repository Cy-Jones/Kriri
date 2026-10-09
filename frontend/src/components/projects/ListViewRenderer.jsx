import { useState, useEffect, useRef, useMemo } from "react";
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
  Layout
} from "lucide-react";
import { api } from "../../lib/api";
import { ProjectsEmptyIcon } from "../../components/EmptyStateIcons";
import CreateProjectModal from "../../components/CreateProjectModal";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { Button } from "@/registry/components/button/button";
import { Tabs, TabsList, TabsTrigger } from "@/registry/components/tabs/tabs";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import DropdownMenu from "@/registry/components/dropdown-menu/dropdown-menu";
import { Progress } from "@/registry/components/progress/progress";
import { Badge } from "@/registry/components/badge/badge";
import PriorityPicker, { getPriorityIcon } from "../../components/PriorityPicker";
import LeadPicker from "../../components/LeadPicker";
import DatePicker from "../../components/DatePicker";
import ActionTooltip from "../../components/ActionTooltip";
import StatusPicker, { getStatusIcon } from "../../components/StatusPicker";
import HealthPicker, { getHealthIcon } from "../../components/HealthPicker";
import ProgressPicker from "../../components/ProgressPicker";
import LabelPicker from "../../components/LabelPicker";
import MemberPicker from "../../components/MemberPicker";
import PickerWrapper from "../../components/PickerWrapper";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";


// ============================================================================
// LIST VIEW COMPONENT
// ============================================================================
export default function ListViewRenderer({
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
  canManageProjects
}) {
  const grouped = groupProjects(projects, config.grouping);
  const properties = config.properties || {};

  const handleDragStart = (e, project) => {
    if (!canManageProjects) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", project.id);
  };

  const handleDropOnRow = (e, targetProject) => {
    if (!canManageProjects) return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId === targetProject.id) return;

    const targetPos = targetProject.position || 1;
    onUpdateProject(sourceId, { position: targetPos - 0.5 });
  };

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
    properties.dependencies && "100px"
  ].filter(Boolean).join(" ");

  return (
    <div className="w-full flex flex-col h-full overflow-auto">
      <div className="min-w-max flex flex-col min-h-full">
        <div className="grid gap-8 items-center px-6 py-2.5 text-[12px] font-medium text-[#8a8f98] sticky top-0 z-20 border-b border-white/[0.05]"
          style={{ gridTemplateColumns: gridCols }}
        >
        <div>Name</div>
        {properties.health && <div>Health</div>}
        {properties.priority && <div>Priority</div>}
        {properties.lead && <div>Lead</div>}
        {properties.due_date && <div>Target date</div>}
        {properties.issues && <div>Issues</div>}
        {properties.progress && <div>Progress</div>}
        {properties.status && <div>Status</div>}
        {properties.members && <div>Members</div>}
        {properties.start_date && <div>Start date</div>}
        {properties.labels && <div>Labels</div>}
        {properties.milestones && <div>Milestones</div>}
        {properties.dependencies && <div>Dependencies</div>}
      </div>

      <div className="flex flex-col flex-1 pb-10">
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
                  className="flex items-center gap-2 px-6 py-2 bg-[#18191c] hover:bg-white/[0.02] cursor-pointer text-[13px] font-medium text-[#e8e8e8] transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight size={14} className="text-[#8a8f98]" />
                  ) : (
                    <ChevronDown size={14} className="text-[#8a8f98]" />
                  )}
                  <span>{groupTitle}</span>
                  <span className="text-[#8a8f98] text-[12px] ml-1">
                    {groupItems.length}
                  </span>
                </div>
              )}

              {!isCollapsed &&
                sortedItems.map((project, idx) => (
                  <div
                    key={project.id}
                    draggable={config.ordering === "manual"}
                    onDragStart={(e) => handleDragStart(e, project)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnRow(e, project)}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="grid gap-8 items-center px-6 py-2 hover:bg-white/[0.02] rounded-xl transition-colors cursor-pointer text-[13px] group mx-2"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#e95454]">
                          <path d="M7 1L12.5 4.17742V10.5323L7 13.7097L1.5 10.5323V4.17742L7 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          <circle cx="7" cy="7.35484" r="2" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[280px] sm:max-w-[350px] lg:max-w-[450px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#e8e8e8] truncate group-hover:text-white transition-colors">
                            {project.name}
                          </span>
                          {properties.id && (
                            <span className="text-[12px] text-[#8a8f98] font-mono whitespace-nowrap flex-shrink-0">
                              {project.id}
                            </span>
                          )}
                        </div>
                        {properties.summary && project.description && (
                          <span className="text-[12px] text-[#8a8f98] line-clamp-2 leading-tight mt-[1px] whitespace-normal break-words">
                            {project.description.split('\n\n')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {properties.health && (
                      <div className="relative">
                        <ActionTooltip label="Update health status">
                          <div 
                            className={`text-[12px] text-[#8a8f98] flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                            onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'health', projectId: project.id }); }}
                          >
                            {getHealthIcon(project.health || "No updates")}
                            <span>{project.health || "No updates"}</span>
                          </div>
                        </ActionTooltip>
                        {activePicker.type === 'health' && activePicker.projectId === project.id && (
                          <HealthPicker 
                            value={project.health || "No updates"} 
                            onChange={(val) => onUpdateProject(project.id, { health: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.priority && (
                      <div 
                        className={`relative flex items-center p-1 -ml-1 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'priority', projectId: project.id }); }}
                      >
                        {getPriorityIcon(project.priority)}
                        {activePicker.type === 'priority' && activePicker.projectId === project.id && (
                          <PriorityPicker 
                            value={project.priority} 
                            onChange={(val) => onUpdateProject(project.id, { priority: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.lead && (
                      <div 
                        className={`relative flex items-center p-1 -ml-1 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'lead', projectId: project.id }); }}
                      >
                        {project.lead ? (
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white uppercase overflow-hidden ${getAvatarColor(project.lead.name, project.lead.email)}`}>
                            {project.lead.avatar_url ? (
                              <img src={project.lead.avatar_url} alt={project.lead.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitial(project.lead.name, project.lead.email)
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/[0.1] border-dashed text-white/[0.3]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                        )}
                        {activePicker.type === 'lead' && activePicker.projectId === project.id && (
                          <LeadPicker 
                            value={project.lead} 
                            onChange={(val) => onUpdateProject(project.id, { lead: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.due_date && (
                      <div 
                        className={`relative text-[12px] text-[#8a8f98] flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'dueDate', projectId: project.id }); }}
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
                        {activePicker.type === 'dueDate' && activePicker.projectId === project.id && (
                          <DatePicker 
                            value={project.due_date} 
                            onChange={(val) => onUpdateProject(project.id, { due_date: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                            placeholder="Target date"
                          />
                        )}
                      </div>
                    )}



                    {properties.issues && (
                      <div 
                        className={`flex items-center gap-1.5 text-[12px] text-[#8a8f98] px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}?tab=issues`); }}
                      >
                        <CheckCircle2 size={12} className="opacity-60" />
                        <span>{project.issues || "0"}</span>
                      </div>
                    )}

                    {properties.progress && (
                      <div className="relative">
                        <ActionTooltip label="Update progress">
                          <div 
                            className={`flex items-center gap-1.5 text-[12px] text-[#8a8f98] px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                            onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'progress', projectId: project.id }); }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeDasharray="2 2"
                              className="text-[#c28431]"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                            <span>{project.progress || 0}%</span>
                          </div>
                        </ActionTooltip>
                        {activePicker.type === 'progress' && activePicker.projectId === project.id && (
                          <ProgressPicker 
                            value={project.progress || 0} 
                            onChange={(val) => onUpdateProject(project.id, { progress: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.status && (
                      <div className="relative">
                        <ActionTooltip label={project.status || "Planned"} shortcut="P then S">
                          <div 
                            className={`text-[12px] text-[#8a8f98] whitespace-nowrap px-2 py-1 -ml-2 rounded-full transition-colors flex items-center gap-1.5 ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                            onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'status', projectId: project.id }); }}
                          >
                            {getStatusIcon(project.status || "Planned")}
                            <span>{project.status || "Planned"}</span>
                          </div>
                        </ActionTooltip>
                        {activePicker.type === 'status' && activePicker.projectId === project.id && (
                          <StatusPicker 
                            value={project.status || "Planned"} 
                            onChange={(val) => onUpdateProject(project.id, { status: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.members && (
                      <div 
                        className={`relative flex items-center px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'members', projectId: project.id }); }}
                      >
                        {project.members && (
                          <MembersAvatarStack members={project.members} max={3} />
                        )}
                        {!project.members?.length && <User size={12} className="text-[#8a8f98]" />}
                        {activePicker.type === 'members' && activePicker.projectId === project.id && (
                          <MemberPicker 
                            currentMembers={project.members || []} 
                            onSelect={(val) => onUpdateProject(project.id, { members: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.start_date && (
                      <div 
                        className={`relative text-[12px] text-[#8a8f98] flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'start_date', projectId: project.id }); }}
                      >
                        <Calendar size={12} className="opacity-60" />
                        {project.start_date
                          ? new Date(project.start_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "---"}
                        {activePicker.type === 'start_date' && activePicker.projectId === project.id && (
                          <DatePicker 
                            value={project.start_date} 
                            onChange={(val) => onUpdateProject(project.id, { start_date: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                            placeholder="Start date"
                          />
                        )}
                      </div>
                    )}

                    {properties.labels && (
                      <div 
                        className={`relative flex items-center gap-1 overflow-hidden px-2 py-1 -ml-2 rounded-full transition-colors ${canManageProjects ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'labels', projectId: project.id }); }}
                      >
                        {project.labels?.slice(0, 2).map((label, i) => (
                          <div key={i} className="px-1.5 py-0.5 bg-white/[0.04] rounded-sm text-[10px] text-[#8a8f98] whitespace-nowrap">
                            {label}
                          </div>
                        ))}
                        {project.labels?.length > 2 && <span className="text-[10px] text-[#8a8f98]">+{project.labels.length - 2}</span>}
                        {!project.labels?.length && <Tag size={12} className="text-[#8a8f98]" />}
                        {activePicker.type === 'labels' && activePicker.projectId === project.id && (
                          <LabelPicker 
                            selectedLabels={project.labels || []} 
                            onChange={(val) => onUpdateProject(project.id, { labels: val })} 
                            onClose={() => setActivePicker({ type: null, projectId: null })} 
                          />
                        )}
                      </div>
                    )}

                    {properties.milestones && (
                      <div className="text-[11px] text-[#8a8f98]">
                        {project.milestones?.length || 0}
                      </div>
                    )}

                    {properties.dependencies && (
                      <div className="text-[11px] text-[#8a8f98]">
                        {project.dependencies?.length || 0}
                      </div>
                    )}

                    {/* Optional delete button could go here or on context menu */}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
