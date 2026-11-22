import React, { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, Layers, Compass, Grid, Calendar, Clock, ChevronDown, User as UserIcon, UserX } from "lucide-react";
import DatePicker from "../DatePicker";
import { getPriorityIcon } from "../PriorityPicker";

// Optional icon rendering for icon styles or project templates
function OptionIcon({ name }) {
  if (name === "lucide") {
    return (
      <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
        <Sparkles size={16} strokeWidth={1.8} />
      </div>
    );
  }
  if (name === "phosphor") {
    return (
      <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
        <Layers size={16} strokeWidth={1.8} />
      </div>
    );
  }
  if (name === "radix") {
    return (
      <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
        <Grid size={16} strokeWidth={1.8} />
      </div>
    );
  }
  return null;
}

export default function InlineDecisionCard({
  card,
  onConfirm,
  onSelectChange,
  disabled = false,
  availableMembers = [],
}) {
  const {
    title,
    subtitle,
    step,
    totalSteps,
    options = [],
    footerLeft,
    submitLabel = "Confirm selection",
    type = "single_choice",
  } = card;

  // Selected option ID(s)
  const isMultiple = type === "multi_choice";
  const [selected, setSelected] = useState(
    isMultiple ? (card.initialSelected || []) : (card.initialSelected || options[0]?.id || "")
  );
  const [customText, setCustomText] = useState(card.initialCustomText || "");

  const todayIso = new Date().toISOString().split("T")[0];
  const targetDefaultIso = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [customStartDate, setCustomStartDate] = useState(card.initialStartDate || todayIso);
  const [customTargetDate, setCustomTargetDate] = useState(card.initialTargetDate || targetDefaultIso);
  const [activePicker, setActivePicker] = useState(null); // 'start' | 'target' | 'lead' | null

  // Team Lead selection state
  const [customLead, setCustomLead] = useState(() => {
    if (card.initialLead !== undefined) return card.initialLead;
    if (availableMembers && availableMembers.length > 0) return availableMembers[0];
    return null;
  });

  // Priority selection state
  const [customPriority, setCustomPriority] = useState(card.initialPriority || "High");

  useEffect(() => {
    if (!customLead && availableMembers && availableMembers.length > 0 && !card.initialLead) {
      setCustomLead(availableMembers[0]);
    }
  }, [availableMembers]);

  const notifyChange = (newSelected, extra = {}) => {
    onSelectChange?.(newSelected, {
      customText: extra.customText !== undefined ? extra.customText : customText,
      startDate: extra.startDate !== undefined ? extra.startDate : customStartDate,
      targetDate: extra.targetDate !== undefined ? extra.targetDate : customTargetDate,
      lead: extra.lead !== undefined ? extra.lead : customLead,
      priority: extra.priority !== undefined ? extra.priority : customPriority,
    });
  };

  const handleSelect = (optionId) => {
    if (disabled) return;
    if (isMultiple) {
      setSelected((prev) => {
        const next = prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];
        notifyChange(next);
        return next;
      });
    } else {
      setSelected(optionId);
      const opt = options.find((o) => o.id === optionId);
      const newStart = opt?.startDate || customStartDate;
      const newTarget = opt?.targetDate || customTargetDate;
      if (opt?.startDate) setCustomStartDate(opt.startDate);
      if (opt?.targetDate) setCustomTargetDate(opt.targetDate);
      notifyChange(optionId, { startDate: newStart, targetDate: newTarget });
    }
  };

  const handleConfirm = () => {
    if (disabled) return;

    let resultPayload = {};
    if (isMultiple) {
      if (selected.length === 0) return;
      const selectedOptions = options.filter((o) => selected.includes(o.id));
      resultPayload = {
        type: "multi",
        selectedIds: selected,
        selectedLabels: selectedOptions.map((o) => o.label),
        customText,
        startDate: customStartDate,
        targetDate: customTargetDate,
        lead: selected.includes("lead-me") ? customLead : null,
        priority: selected.includes("priority-high") ? customPriority : "Medium",
      };
    } else {
      if (!selected) return;
      const selectedOption = options.find((o) => o.id === selected);
      resultPayload = {
        type: "single",
        selectedId: selected,
        selectedLabel: selectedOption?.label || selected,
        customText: selectedOption?.allowCustomInput ? customText : null,
        startDate: selectedOption?.allowDateInput ? customStartDate : (selectedOption?.startDate || customStartDate),
        targetDate: selectedOption?.allowDateInput ? customTargetDate : (selectedOption?.targetDate || customTargetDate),
        lead: customLead,
        priority: customPriority,
      };
    }

    onConfirm?.(resultPayload);
  };

  const isConfirmed = disabled;

  return (
    <div className="w-full bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 text-zinc-900 dark:text-white my-3 shadow-md dark:shadow-xl select-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          {step && (
            <span className="w-4 h-4 rounded-full border border-zinc-400 dark:border-zinc-500 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
              ?
            </span>
          )}
          <h3 className="text-[15px] sm:text-[16px] font-semibold text-zinc-900 dark:text-white leading-snug">
            {title}
          </h3>
        </div>

        {step && totalSteps && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
            {step}/{totalSteps}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mb-4 ml-6 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Options List */}
      <div className="space-y-1.5 my-3">
        {options.map((option) => {
          const isOptionSelected = isMultiple
            ? selected.includes(option.id)
            : selected === option.id;

          // Dynamic label and description for lead and priority
          let optionLabel = option.label;
          let optionDesc = option.description;

          if (option.allowLeadPicker) {
            optionLabel = customLead
              ? `Project Lead: ${customLead.name}`
              : "Assign Project Lead";
            optionDesc = customLead
              ? `Set lead to ${customLead.name}${customLead.role ? ` (${customLead.role})` : ""} with automated accountability.`
              : "Assign a team member as project lead for milestone tracking.";
          } else if (option.allowPriorityPicker) {
            optionLabel = `${customPriority} Priority (Signal Indicator)`;
            optionDesc = `Mark project as ${customPriority} priority with active blocker tracking and priority signal bars.`;
          }

          return (
            <div key={option.id} className="flex flex-col">
              <button
                type="button"
                disabled={isConfirmed}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left flex items-start gap-3 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
                  isOptionSelected
                    ? "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-900 dark:text-white font-medium"
                    : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03] text-zinc-700 dark:text-zinc-300"
                } ${isConfirmed ? "cursor-default opacity-85" : ""}`}
              >
                {/* Radio or Checkbox */}
                {isMultiple ? (
                  <div
                    className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isOptionSelected
                        ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-black"
                        : "border-zinc-400 dark:border-zinc-600 bg-transparent"
                    }`}
                  >
                    {isOptionSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                ) : (
                  <div
                    className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isOptionSelected
                        ? "border-zinc-800 dark:border-zinc-400 bg-transparent"
                        : "border-zinc-400 dark:border-zinc-600 bg-transparent"
                    }`}
                  >
                    {isOptionSelected && (
                      <div className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-300" />
                    )}
                  </div>
                )}

                {/* Option icon if present */}
                {option.icon && <OptionIcon name={option.icon} />}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium leading-snug">
                    {optionLabel}
                  </div>
                  {optionDesc && (
                    <div className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5">
                      {optionDesc}
                    </div>
                  )}
                </div>
              </button>

              {/* 1. Team Lead Selection in Pills with Name & Picture */}
              {option.allowLeadPicker && isOptionSelected && !isConfirmed && (
                <div className="mt-2.5 ml-7 mr-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-zinc-50/90 to-zinc-100/50 dark:from-[#1c1d21] dark:to-[#16171a] border border-black/[0.08] dark:border-white/[0.08] shadow-sm backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
                        Project Lead
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200">
                      {customLead ? customLead.name : "Unassigned"}
                    </span>
                  </div>

                  {/* Team Members in Pills with Name & Picture */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {availableMembers && availableMembers.length > 0 ? (
                      availableMembers.map((m) => {
                        const isSelectedMember = customLead?.id === m.id || customLead?.email === m.email;
                        return (
                          <button
                            key={m.id || m.email}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomLead(m);
                              notifyChange(selected, { lead: m });
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                              isSelectedMember
                                ? "bg-white dark:bg-[#25262a] border-zinc-900/40 dark:border-white/30 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold"
                                : "bg-white/60 dark:bg-[#1a1b1e]/60 border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-[#202125] hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            <div className="relative w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (m.name || "U")[0].toUpperCase()
                              )}
                            </div>
                            <span className="truncate max-w-[140px]">{m.name}</span>
                            {m.role && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-normal">
                                {m.role}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-xs text-zinc-400">No team members loaded</span>
                    )}

                    {/* Unassigned Pill */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomLead(null);
                        notifyChange(selected, { lead: null });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                        !customLead
                          ? "bg-white dark:bg-[#25262a] border-zinc-900/40 dark:border-white/30 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold"
                          : "bg-white/60 dark:bg-[#1a1b1e]/60 border-black/5 dark:border-white/5 text-zinc-500 hover:bg-white dark:hover:bg-[#202125] hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <UserX size={13} className="text-zinc-400" />
                      <span>Unassigned</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Priority Selector Section (when Option 2 is selected & active) */}
              {option.allowPriorityPicker && isOptionSelected && !isConfirmed && (
                <div className="mt-2.5 ml-7 mr-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-zinc-50/90 to-zinc-100/50 dark:from-[#1c1d21] dark:to-[#16171a] border border-black/[0.08] dark:border-white/[0.08] shadow-sm backdrop-blur-md space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                    <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
                      Priority Level
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200">
                      {customPriority}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { value: "Urgent", label: "Urgent" },
                      { value: "High", label: "High" },
                      { value: "Medium", label: "Medium" },
                      { value: "Low", label: "Low" },
                      { value: "No priority", label: "None" },
                    ].map((p) => {
                      const isSelectedP = customPriority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomPriority(p.value);
                            notifyChange(selected, { priority: p.value });
                          }}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                            isSelectedP
                              ? "bg-white dark:bg-[#25262a] border-zinc-900/40 dark:border-white/30 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold"
                              : "bg-white/60 dark:bg-[#1a1b1e]/60 border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-[#202125]"
                          }`}
                        >
                          {getPriorityIcon(p.value)}
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Inline Custom Text Input (for Custom Option in Step 1, 2, or 4) */}
              {option.allowCustomInput && isOptionSelected && !isConfirmed && (
                <div className="mt-2.5 ml-7 mr-2">
                  <textarea
                    rows={2}
                    value={customText}
                    onChange={(e) => {
                      setCustomText(e.target.value);
                      notifyChange(selected, { customText: e.target.value });
                    }}
                    placeholder={option.customPlaceholder || "Specify custom rules, guidelines, or requirements..."}
                    className="w-full bg-zinc-100 dark:bg-[#111111] border border-black/10 dark:border-white/10 focus:border-black/20 dark:focus:border-white/20 rounded-xl p-2.5 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed custom-scrollbar"
                  />
                </div>
              )}

              {/* 4. Inline Date Pickers (for Step 2 Custom Timeline) */}
              {option.allowDateInput && isOptionSelected && !isConfirmed && (
                <div className="mt-2.5 ml-7 mr-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-black/5 dark:border-white/5 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Start Date Trigger */}
                    <div className="relative">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1 block">
                        Start date
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePicker(activePicker === "start" ? null : "start");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-[#1e1f21] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[12.5px] text-zinc-900 dark:text-white transition-colors cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock size={13} className="text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {customStartDate
                              ? new Date(customStartDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Set start date"}
                          </span>
                        </div>
                        <Calendar size={13} className="text-zinc-400 shrink-0 ml-1.5" />
                      </button>
                      {activePicker === "start" && (
                        <DatePicker
                          value={customStartDate}
                          onChange={(val) => {
                            setCustomStartDate(val);
                            setActivePicker(null);
                            notifyChange(selected, { startDate: val });
                          }}
                          onClose={() => setActivePicker(null)}
                          placeholder="Start date"
                          placement="bottom"
                          align="left"
                        />
                      )}
                    </div>

                    {/* Target Date Trigger */}
                    <div className="relative">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1 block">
                        Target date
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePicker(activePicker === "target" ? null : "target");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-[#1e1f21] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[12.5px] text-zinc-900 dark:text-white transition-colors cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar size={13} className="text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {customTargetDate
                              ? new Date(customTargetDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Set target date"}
                          </span>
                        </div>
                        <Calendar size={13} className="text-zinc-400 shrink-0 ml-1.5" />
                      </button>
                      {activePicker === "target" && (
                        <DatePicker
                          value={customTargetDate}
                          onChange={(val) => {
                            setCustomTargetDate(val);
                            setActivePicker(null);
                            notifyChange(selected, { targetDate: val });
                          }}
                          onClose={() => setActivePicker(null)}
                          placeholder="Target date"
                          placement="bottom"
                          align="right"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Action */}
      {!isConfirmed ? (
        footerLeft ? (
          /* Multi-step Footer with Left info and Right Next button */
          <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 mt-4">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {footerLeft}
            </span>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 dark:bg-[#262626] hover:bg-zinc-800 dark:hover:bg-[#303030] text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              <span>{submitLabel}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          /* Single Card Full-width button */
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full mt-3 py-2.5 px-4 rounded-full bg-zinc-900 dark:bg-[#262626] hover:bg-zinc-800 dark:hover:bg-[#303030] text-white font-medium text-[13.5px] transition-colors cursor-pointer text-center"
          >
            {submitLabel}
          </button>
        )
      ) : (
        /* Confirmed state indication */
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-2 border-t border-black/5 dark:border-white/5 mt-3">
          <Check size={13} />
          <span>Selection confirmed</span>
        </div>
      )}
    </div>
  );
}
