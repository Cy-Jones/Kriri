import React, { useState } from "react";
import {
  Calendar,
  Clock,
  ArrowRight,
  ChevronDown,
  Tag as TagIcon,
  User as UserIcon,
} from "lucide-react";
import PriorityPicker, { getPriorityIcon } from "../PriorityPicker";
import StatusPicker, { getStatusIcon } from "../StatusPicker";
import HealthPicker, { getHealthIcon } from "../HealthPicker";
import LeadPicker from "../LeadPicker";
import DatePicker from "../DatePicker";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";

export default function ExecutiveProjectCard({
  project: initialProject,
  teamMembers = [],
  currentUser = null,
  onUpdate = null,
}) {
  const [project, setProject] = useState(initialProject);
  const [activePicker, setActivePicker] = useState(null);

  if (!project) return null;

  const handleUpdate = async (key, val) => {
    setActivePicker(null);

    let updatedProject = { ...project };
    let apiPayload = { name: project.name };

    if (key === "lead") {
      const member = val;
      updatedProject = {
        ...updatedProject,
        lead_id: member?.id || null,
        lead_name: member?.name || null,
        lead: member || null,
      };
      apiPayload.lead = member ? { id: member.id } : null;
    } else {
      updatedProject[key] = val;
      apiPayload[key] = val;
    }

    // Optimistic UI update
    setProject(updatedProject);
    onUpdate?.(updatedProject);

    try {
      await api.put(`/projects/${project.id}`, apiPayload);
      const label = key.replace("_", " ");
      toast.success(`Project ${label} updated`);
    } catch (err) {
      console.error("Failed to update project property:", err);
      toast.error("Failed to update project");
      // Revert on error
      setProject(project);
      onUpdate?.(project);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("backlog")) {
      return "bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10";
    }
    if (s.includes("progress")) {
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40";
    }
    if (s.includes("done") || s.includes("completed")) {
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40";
    }
    if (s.includes("pause")) {
      return "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/40";
    }
    if (s.includes("cancel")) {
      return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40";
    }
    return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40";
  };

  const leadName =
    project.lead_name ||
    project.lead?.name ||
    (project.lead_id && currentUser ? currentUser.fullName || "Assigned" : "Unassigned");

  return (
    <div className="w-full max-w-xl my-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 shadow-sm dark:shadow-xl font-sans select-none transition-all">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-semibold border border-black/5 dark:border-white/10 tracking-tight">
            {project.identifier || "KRI-PROJECT"}
          </span>

          {/* Interactive Status Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePicker(activePicker === "status" ? null : "status")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-all cursor-pointer hover:opacity-90 active:scale-95 ${getStatusBadgeStyle(
                project.status
              )}`}
              title="Click to change status"
            >
              {getStatusIcon(project.status || "Planning")}
              <span>{project.status || "Planning"}</span>
              <ChevronDown size={11} className="opacity-60 shrink-0" />
            </button>
            {activePicker === "status" && (
              <StatusPicker
                align="left"
                value={project.status || "Planning"}
                onChange={(val) => handleUpdate("status", val)}
                onClose={() => setActivePicker(null)}
              />
            )}
          </div>
        </div>

        {/* Open Project CTA */}
        <a
          href={`/projects/${project.slug || project.id}`}
          className="px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 text-xs font-semibold transition-all inline-flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
        >
          <span>Open Project</span>
          <ArrowRight size={13} strokeWidth={2.2} />
        </a>
      </div>

      {/* Project Title & Scope Description */}
      <div className="mt-3.5">
        <h3 className="text-[15.5px] sm:text-[16px] font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-1.5 text-[12.5px] sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            {project.description}
          </p>
        )}
      </div>

      {/* Properties Grid with Proper Alignment & Dedicated Pickers */}
      <div className="mt-4 pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
        {/* 1. Priority */}
        <div className="relative min-w-0">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
            Priority
          </span>
          <button
            type="button"
            onClick={() => setActivePicker(activePicker === "priority" ? null : "priority")}
            className="w-full flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white px-2 py-1.5 -mx-2 -my-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left group"
            title="Click to change priority"
          >
            <div className="shrink-0 flex items-center">
              {getPriorityIcon(project.priority || "High")}
            </div>
            <span className="truncate">{project.priority || "High"}</span>
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-60 ml-auto shrink-0 transition-opacity" />
          </button>
          {activePicker === "priority" && (
            <PriorityPicker
              align="left"
              value={project.priority || "High"}
              onChange={(val) => handleUpdate("priority", val)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {/* 2. Health */}
        <div className="relative min-w-0">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
            Health
          </span>
          <button
            type="button"
            onClick={() => setActivePicker(activePicker === "health" ? null : "health")}
            className="w-full flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white px-2 py-1.5 -mx-2 -my-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left group"
            title="Click to change health"
          >
            <div className="shrink-0 flex items-center">
              {getHealthIcon(project.health || "On Track")}
            </div>
            <span className="truncate">{project.health || "On Track"}</span>
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-60 ml-auto shrink-0 transition-opacity" />
          </button>
          {activePicker === "health" && (
            <HealthPicker
              align="left"
              value={project.health || "On Track"}
              onChange={(val) => handleUpdate("health", val)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {/* 3. Lead */}
        <div className="relative min-w-0">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
            Lead
          </span>
          <button
            type="button"
            onClick={() => setActivePicker(activePicker === "lead" ? null : "lead")}
            className="w-full flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white px-2 py-1.5 -mx-2 -my-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left group"
            title="Click to assign lead"
          >
            <UserIcon size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate">{leadName}</span>
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-60 ml-auto shrink-0 transition-opacity" />
          </button>
          {activePicker === "lead" && (
            <LeadPicker
              align="left"
              currentLead={project.lead}
              availableMembers={teamMembers}
              onChange={(member) => handleUpdate("lead", member)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {/* 4. Start Date */}
        <div className="relative min-w-0">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
            Start Date
          </span>
          <button
            type="button"
            onClick={() => setActivePicker(activePicker === "start_date" ? null : "start_date")}
            className="w-full flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white px-2 py-1.5 -mx-2 -my-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left group"
            title="Click to change start date"
          >
            <Clock size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate whitespace-nowrap">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Today"}
            </span>
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-60 ml-auto shrink-0 transition-opacity" />
          </button>
          {activePicker === "start_date" && (
            <DatePicker
              align="left"
              value={project.start_date}
              placeholder="Start date"
              onChange={(val) => handleUpdate("start_date", val)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {/* 5. Target Date (Fixed horizontal arrangement without line breaks) */}
        <div className="relative min-w-0">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
            Target Date
          </span>
          <button
            type="button"
            onClick={() => setActivePicker(activePicker === "target_date" ? null : "target_date")}
            className="w-full flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white px-2 py-1.5 -mx-2 -my-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left group"
            title="Click to set target delivery date"
          >
            <Calendar size={13} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate whitespace-nowrap">
              {project.due_date
                ? new Date(project.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Set target date"}
            </span>
            <ChevronDown size={11} className="opacity-0 group-hover:opacity-60 ml-auto shrink-0 transition-opacity" />
          </button>
          {activePicker === "target_date" && (
            <DatePicker
              align="right"
              value={project.due_date}
              placeholder="Target date"
              onChange={(val) => handleUpdate("due_date", val)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>
      </div>

      {/* Project Labels / Tags */}
      {Array.isArray(project.labels) && project.labels.length > 0 && (
        <div className="mt-3.5 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-1.5 flex-wrap">
          <TagIcon size={11} className="text-zinc-400 dark:text-zinc-500 mr-0.5 shrink-0" />
          {project.labels.map((lbl, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 text-[11px] font-medium border border-black/5 dark:border-white/5"
            >
              {lbl}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

