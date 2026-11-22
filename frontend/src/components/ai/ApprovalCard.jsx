import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  LoaderCircle,
  MessageSquareText,
  X,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_ANSWER = { selected: [], custom: "" };

function getStatusLabel(status) {
  if (status === "submitting") return "Submitting";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "changes-requested") return "Changes requested";
  if (status === "answered") return "Response submitted";
  return "Input required";
}

function getStatusClass(status) {
  if (status === "approved" || status === "answered") {
    return "text-emerald-400";
  }
  if (status === "rejected") return "text-rose-400";
  if (status === "changes-requested") {
    return "text-amber-400";
  }
  return "text-zinc-400";
}

function getStatusBadgeClass(status) {
  if (status === "pending" || status === "changes-requested") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
  if (status === "submitting") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }
  if (status === "approved" || status === "answered") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }
  return "border-rose-500/30 bg-rose-500/10 text-rose-400";
}

function isAnswered(answer) {
  if (!answer) return false;
  return (answer.selected && answer.selected.length > 0) || Boolean(answer.custom?.trim());
}

function QuestionOptions({
  question,
  answer,
  disabled,
  onChange,
  onSingleSelect,
}) {
  const custom = answer?.custom ?? "";
  const selected = answer?.selected ?? [];

  return (
    <div className="mt-3.5 space-y-2">
      {question.options?.length > 0 ? (
        question.multiple ? (
          /* Multiple Choice (Checkboxes) */
          <div className="grid gap-1.5">
            {question.options.map((option) => {
              const isChecked = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled || option.disabled}
                  onClick={() => {
                    const nextSelected = isChecked
                      ? selected.filter((v) => v !== option.value)
                      : [...selected, option.value];
                    onChange({ ...answer, selected: nextSelected });
                  }}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-white/[0.08] border-white/25 text-white"
                      : "bg-[#1f1f23] border-white/5 text-zinc-300 hover:bg-white/[0.04] hover:border-white/10"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      isChecked
                        ? "bg-white border-white text-black"
                        : "border-zinc-500 bg-transparent"
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium leading-snug">{option.label}</div>
                    {option.description && (
                      <div className="text-[11.5px] text-zinc-400 leading-normal mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Single Choice (Radio) */
          <div className="grid gap-1.5">
            {question.options.map((option) => {
              const isSelected = selected[0] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled || option.disabled}
                  onClick={() => {
                    onChange({ selected: [option.value], custom: "" });
                    onSingleSelect?.();
                  }}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.08] border-white/25 text-white"
                      : "bg-[#1f1f23] border-white/5 text-zinc-300 hover:bg-white/[0.04] hover:border-white/10"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                      isSelected
                        ? "border-white bg-transparent"
                        : "border-zinc-500 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium leading-snug">{option.label}</div>
                    {option.description && (
                      <div className="text-[11.5px] text-zinc-400 leading-normal mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : null}

      {/* Freeform / Custom Input */}
      {question.allowCustom && (
        <div className="mt-2">
          <input
            type="text"
            value={custom}
            disabled={disabled}
            placeholder={question.customPlaceholder ?? "Add another response…"}
            onChange={(e) => {
              onChange({
                selected: question.multiple ? selected : [],
                custom: e.target.value,
              });
            }}
            className="w-full bg-[#161619] border border-white/10 focus:border-white/25 rounded-xl px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
        </div>
      )}
    </div>
  );
}

function ProgressDots({ current, total }) {
  return (
    <span className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, idx) => (
        <span
          key={idx}
          className={`h-1.5 rounded-full transition-all duration-200 ${
            idx === current
              ? "w-4 bg-white"
              : idx < current
              ? "w-1.5 bg-zinc-400"
              : "w-1.5 bg-zinc-700"
          }`}
        />
      ))}
    </span>
  );
}

export function ApprovalCard({
  title = "Approval required",
  description,
  children,
  questions = [],
  status = "pending",
  answers,
  defaultAnswers = {},
  onAnswersChange,
  step,
  defaultStep = 0,
  onStepChange,
  onSubmit,
  onApprove,
  onReject,
  onRequestChanges,
  onDismiss,
  approveLabel = "Approve",
  submitLabel = "Submit response",
  result,
  className = "",
}) {
  const [internalAnswers, setInternalAnswers] = useState(defaultAnswers);
  const [internalStep, setInternalStep] = useState(defaultStep);
  const autoAdvanceTimer = useRef(null);

  const currentAnswers = answers ?? internalAnswers;
  const currentStep = Math.min(
    Math.max(0, step ?? internalStep),
    Math.max(0, questions.length - 1)
  );

  const question = questions[currentStep];
  const questionMode = questions.length > 0;
  const multipleQuestions = questions.length > 1;

  const pending = status === "pending";
  const busy = status === "submitting";
  const interactive = pending || busy;

  const currentAnswer = question
    ? (currentAnswers[question.id] ?? EMPTY_ANSWER)
    : EMPTY_ANSWER;

  const displayTitle = question?.title ?? title;
  const statusLabel = getStatusLabel(status);

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  useEffect(() => clearAutoAdvance, [clearAutoAdvance]);

  const updateAnswers = (next) => {
    if (answers === undefined) setInternalAnswers(next);
    onAnswersChange?.(next);
  };

  const setStepHandler = (next) => {
    clearAutoAdvance();
    if (step === undefined) setInternalStep(next);
    onStepChange?.(next);
  };

  const updateCurrentAnswer = (next) => {
    if (!question) return;
    updateAnswers({ ...currentAnswers, [question.id]: next });
  };

  const continueQuestion = () => {
    if (currentStep < questions.length - 1) {
      setStepHandler(currentStep + 1);
      return;
    }
    onSubmit?.(currentAnswers);
  };

  const queueAutoAdvance = () => {
    if (
      !question ||
      question.multiple ||
      question.autoAdvance === false ||
      currentStep >= questions.length - 1 ||
      busy
    ) {
      return;
    }

    clearAutoAdvance();
    autoAdvanceTimer.current = setTimeout(() => {
      setStepHandler(currentStep + 1);
    }, 260);
  };

  return (
    <div
      data-state={status}
      aria-busy={busy}
      className={`w-full overflow-hidden rounded-2xl bg-[#141416] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-4 sm:p-5 text-sm text-zinc-100 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Status Icon */}
        <span
          className={`grid w-5 h-5 shrink-0 place-items-center mt-0.5 ${getStatusClass(
            status
          )}`}
        >
          {busy ? (
            <LoaderCircle size={18} className="animate-spin text-blue-400" />
          ) : interactive ? (
            questionMode ? (
              <CircleHelp size={18} />
            ) : (
              <MessageSquareText size={18} />
            )
          ) : status === "rejected" ? (
            <X size={18} />
          ) : (
            <Check size={18} />
          )}
        </span>

        {/* Main Card Body */}
        <div className="min-w-0 flex-1">
          {/* Header Row: Title, Step Indicator / Status Badge, Dismiss */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-white tracking-tight leading-snug">
              {displayTitle}
            </h3>

            {questionMode && interactive ? (
              multipleQuestions ? (
                <span className="shrink-0 text-xs tabular-nums text-zinc-400 font-mono">
                  {currentStep + 1}/{questions.length}
                </span>
              ) : null
            ) : (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${getStatusBadgeClass(
                  status
                )}`}
              >
                {statusLabel}
              </span>
            )}

            {onDismiss && (
              <button
                type="button"
                aria-label="Dismiss"
                onClick={onDismiss}
                className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Interactive Flow */}
          <AnimatePresence mode="wait">
            {interactive ? (
              <motion.div
                key={questionMode && question ? question.id : "review-flow"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="mt-1"
              >
                {questionMode && question ? (
                  <div>
                    {question.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                        {question.description}
                      </p>
                    )}
                    <QuestionOptions
                      question={question}
                      answer={currentAnswer}
                      disabled={busy}
                      onChange={updateCurrentAnswer}
                      onSingleSelect={queueAutoAdvance}
                    />
                  </div>
                ) : (
                  <div>
                    {description && (
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                        {description}
                      </p>
                    )}
                    {children && <div className="mt-3">{children}</div>}
                  </div>
                )}

                {/* Footer Controls */}
                {questionMode ? (
                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                    {multipleQuestions ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Previous question"
                          disabled={busy || currentStep === 0}
                          onClick={() => setStepHandler(currentStep - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <ProgressDots
                          current={currentStep}
                          total={questions.length}
                        />
                      </div>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      disabled={busy || !isAnswered(currentAnswer)}
                      onClick={continueQuestion}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium shadow transition-all cursor-pointer"
                    >
                      {busy ? (
                        <>
                          <LoaderCircle size={13} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : currentStep === questions.length - 1 ? (
                        <>
                          <span>{submitLabel}</span>
                          <ArrowRight size={13} />
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onApprove}
                      className="px-4 py-1.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-30 text-xs font-medium shadow transition-all cursor-pointer"
                    >
                      {approveLabel}
                    </button>
                    {onRequestChanges && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onRequestChanges}
                        className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
                      >
                        Request changes
                      </button>
                    )}
                    {onReject && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onReject}
                        className="px-3 py-1.5 rounded-full hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Completed / Outcome Summary View */
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-2 text-xs text-zinc-300 leading-relaxed bg-white/[0.03] rounded-xl p-3 border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-emerald-400">
                    {result ?? statusLabel}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ApprovalCard;

