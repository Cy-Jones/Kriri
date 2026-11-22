import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUser, useOrganization } from "@clerk/react";
import {
  X,
  Minus,
  Maximize2,
  ArrowUp,
  ArrowRight,
  Plus,
  Mic,
  Paperclip,
  AtSign,
  Activity,
  CheckSquare,
} from "lucide-react";
import { api } from "../../lib/api";
import KririPromptInput from "./KririPromptInput";
import InlineDecisionCard from "./InlineDecisionCard";
import TodoList from "../agents/todo-list";
import FormattedAIMessage from "./FormattedAIMessage";
import { generatePlanForPrompt, startPlanStepper } from "../../lib/agentPlanHelper";
import { playUiSound } from "../../lib/sound";

const QUICK_EXAMPLES = [
  {
    label: "Audit health & risks",
    prompt: "Audit project health across our active milestones and identify critical blockers.",
  },
  {
    label: "Create a project",
    prompt: "Create a new project",
  },
  {
    label: "Analyze workload",
    prompt: "Analyze current team workload across workspace members and highlight capacity imbalances.",
  },
];

export default function AIAssistantModal({
  isOpen,
  onClose,
  selectedConversationId = null,
  projectId = null,
  projectName = null,
}) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { organization } = useOrganization();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [accessMode, setAccessMode] = useState(() => {
    try {
      return localStorage.getItem("kriri_ai_access_mode") || "read_write";
    } catch {
      return "read_write";
    }
  });

  const handleAccessModeChange = (mode) => {
    setAccessMode(mode);
    try {
      localStorage.setItem("kriri_ai_access_mode", mode);
    } catch {}
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const stepperRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setActivePlan(null);
  }, [organization?.id]);

  useEffect(() => {
    if (selectedConversationId) {
      setConversationId(selectedConversationId);
      loadConversationMessages(selectedConversationId);
    } else if (isOpen && !conversationId) {
      setMessages([]);
    }
  }, [selectedConversationId, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadConversationMessages = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/ai/conversations/${id}/messages`);
      const list = Array.isArray(res) ? res : res.data || [];
      const formatted = list.map((m) => {
        let meta = m.metadata;
        if (typeof meta === "string") {
          try {
            meta = JSON.parse(meta);
          } catch {}
        }
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          card: meta?.card || m.card,
          plan: meta?.plan || m.plan,
          createdProject: meta?.createdProject || m.createdProject,
          createdTask: meta?.createdTask || m.createdTask,
          cardConfirmed: meta?.cardConfirmed !== undefined ? meta.cardConfirmed : (m.cardConfirmed || false),
        };
      });
      setMessages(formatted);
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInput((prev) => (prev ? `${prev} [Attached: ${file.name}]` : `Analyze file: ${file.name}`));
    setIsPlusMenuOpen(false);
    inputRef.current?.focus();
  };

  const handleVoiceToggle = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      inputRef.current?.focus();
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalTranscript = input ? input + " " : "";

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // Restart
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition warning:", e.error);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const trans = e.results[i][0]?.transcript || "";
          if (e.results[i].isFinal) {
            finalTranscript += trans.trim() + " ";
          } else {
            interim += trans;
          }
        }
        const fullText = (finalTranscript + interim).trim();
        if (fullText) {
          setInput(fullText);
        }
      };

      isListeningRef.current = true;
      recognition.start();
    } catch (err) {
      console.error("Voice recognition failed:", err);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = { id: `user-${Date.now()}`, role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    playUiSound("toggle");

    const lower = textToSend.toLowerCase().trim();
    const pItems = generatePlanForPrompt(textToSend);
    let planItems = [];
    if (pItems && pItems.length > 0) {
      planItems = pItems;
      if (stepperRef.current) stepperRef.current.cancel();
      stepperRef.current = startPlanStepper(planItems, (updatedPlan) => {
        setActivePlan([...updatedPlan]);
      });
    } else {
      if (stepperRef.current) stepperRef.current.cancel();
      setActivePlan(null);
    }

    // 1. Image 2: Inline Icon Style Decision Card
    if (lower.includes("icon style") || lower.includes("choose an icon")) {
      setLoading(false);
      setTimeout(() => {
        const completedPlan = stepperRef.current?.finish() || planItems.map((p) => ({ ...p, status: "completed" }));
        setActivePlan(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            plan: completedPlan,
            card: {
              id: "icon-style-card",
              type: "single_choice",
              title: "Choose an icon style for KRIRI",
              subtitle: "Select your preferred design direction.",
              submitLabel: "Confirm selection",
              options: [
                { id: "lucide", label: "Lucide", description: "Minimal, thin outline icons", icon: "lucide" },
                { id: "phosphor", label: "Phosphor", description: "Flexible weights and styles", icon: "phosphor" },
                { id: "radix", label: "Radix", description: "Simple, understated UI icons", icon: "radix" },
              ],
              initialSelected: "phosphor",
            },
            afterText: "These are conversational UI controls, rather than a separate icon pack.",
          },
        ]);
      }, 350);
      return;
    }

    // 2. Images 3, 4, 5: Inline Multi-Step Project Creation Flow (Populating an entirely new project)
    if (
      lower.includes("create a project") ||
      lower.includes("create project") ||
      lower.includes("create a new project") ||
      lower.includes("new project")
    ) {
      setLoading(false);
      setTimeout(() => {
        const completedPlan = stepperRef.current?.finish() || planItems.map((p) => ({ ...p, status: "completed" }));
        setActivePlan(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: "Let's configure and initialize your new project in Kriri.",
            plan: completedPlan,
            card: {
              id: "create-project-step-1",
              type: "single_choice",
              step: 1,
              totalSteps: 3,
              title: "What type of project are you creating?",
              subtitle: "Select a project archetype or define a custom project name to initialize.",
              footerLeft: "Step 1: Project Archetype",
              submitLabel: "Next",
              options: [
                {
                  id: "web-app",
                  label: "Web Application / SaaS Platform",
                  description: "Full-stack web product with dashboard, user authentication, and API backend.",
                },
                {
                  id: "mobile-app",
                  label: "Mobile Application",
                  description: "Cross-platform mobile experience (iOS & Android) with offline sync and gestures.",
                },
                {
                  id: "design-system",
                  label: "Design System & UI Library",
                  description: "Design tokens, accessible primitives, and living pattern documentation.",
                },
                {
                  id: "custom",
                  label: "Custom Project",
                  description: "Define a unique project name, category, and target domain.",
                  allowCustomInput: true,
                  customPlaceholder: "Enter custom project name (e.g. AI Workflow Platform)...",
                },
              ],
              initialSelected: "web-app",
            },
            afterText: "After you choose an archetype, we'll configure:\n• 2/3: Delivery scope and milestone timeline.\n• 3/3: Governance, quality gates, and automated task decomposition.",
          },
        ]);
      }, 300);
      return;
    }

    setLoading(true);

    try {
      const agentInstructions = localStorage.getItem("kriri-agent-instructions");
      const agentTone = localStorage.getItem("kriri-agent-tone");
      const res = await api.post("/ai/chat", {
        message: textToSend,
        conversation_id: conversationId,
        project_id: projectId,
        custom_instructions: agentInstructions || undefined,
        tone: agentTone || undefined,
        access_mode: accessMode,
      });

      if (res.conversation_id && !conversationId) {
        setConversationId(res.conversation_id);
      }

      const completedPlan = planItems.length > 0
        ? (stepperRef.current?.finish() || planItems.map((p) => ({ ...p, status: "completed" })))
        : null;
      setActivePlan(null);

      let meta = res.message?.metadata;
      if (typeof meta === "string") {
        try {
          meta = JSON.parse(meta);
        } catch {}
      }

      const assistantMsg = {
        id: res.message?.id || `ai-${Date.now()}`,
        role: "assistant",
        content: res.message?.content || "Action completed successfully.",
        plan: completedPlan,
        card: meta?.card || null,
        createdProject: meta?.createdProject || null,
        createdTask: meta?.createdTask || null,
        requiresProject: meta?.requiresProject || false,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      playUiSound("chime");
    } catch (err) {
      stepperRef.current?.cancel();
      setActivePlan(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${err.message || "Failed to reach AI engine."}`,
        },
      ]);
    } finally {
      setLoading(false);
      setActivePlan(null);
    }
  };

  const handleCardConfirm = async (msgId, card, result) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, cardConfirmed: true } : m))
    );

    if (card.id === "create-project-step-1") {
      const projectName = result.customText?.trim() || result.selectedLabel;
      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `I want to create: "${projectName}". Continue to step 2.`,
      };

      const step2Msg = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: `Great! Initializing **${projectName}**. Now let's establish the delivery scope and milestone timeline.`,
        card: {
          id: "create-project-step-2",
          type: "single_choice",
          step: 2,
          totalSteps: 3,
          title: "What is the delivery scope and timeline?",
          subtitle: "Define the operational depth and release target for this project.",
          footerLeft: `Project: ${projectName}`,
          submitLabel: "Next",
          projectName,
          options: [
            {
              id: "starter-mvp",
              label: "Focused Starter MVP (2–4 weeks)",
              description: "Ship a few polished core pieces first. Keep scope compact and release fast.",
            },
            {
              id: "milestone-release",
              label: "Comprehensive Milestone Release (6–12 weeks)",
              description: "Full feature set across architecture, frontend, backend, database schema, and test suites.",
            },
            {
              id: "flagship",
              label: "Flagship Enterprise Initiative (Quarterly)",
              description: "Evaluate full architecture, multi-role security permissions, and long-term roadmap.",
            },
            {
              id: "custom-scope",
              label: "Custom Scope & Deadlines",
              description: "Specify custom deliverables, target launch date, or team constraints.",
              allowCustomInput: true,
              customPlaceholder: "Describe specific deliverables, deadlines, or constraints...",
            },
          ],
          initialSelected: "milestone-release",
        },
        afterText: "This establishes sprint boundaries and milestone velocity before tasks are decomposed.",
      };

      setMessages((prev) => [...prev, userBubble, step2Msg]);
    } else if (card.id === "create-project-step-2") {
      const projectName = card.projectName || "New Project";
      const scopeDesc = result.customText ? `${result.selectedLabel}: ${result.customText}` : result.selectedLabel;
      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `Scope: "${scopeDesc}". Continue to step 3.`,
      };

      const step3Msg = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: `Step 3 of 3: Configure quality gates and initial deliverables for **${projectName}**.`,
        card: {
          id: "create-project-step-3",
          type: "multi_choice",
          step: 3,
          totalSteps: 3,
          title: "Which governance & quality gates should be configured?",
          subtitle: "Select all standards the agent should automatically enforce and scaffold.",
          footerLeft: `Final Approval • ${projectName}`,
          submitLabel: "Confirm & create project",
          projectName,
          scopeDesc,
          initialSelected: ["tasks", "architecture", "quality"],
          options: [
            {
              id: "tasks",
              label: "Automated Task Decomposition & Milestones",
              description: "Generate prioritized tickets with estimates, sprint milestones, and team assignments.",
            },
            {
              id: "architecture",
              label: "Architecture & Schema Blueprint",
              description: "Generate database ERD models, API endpoint specifications, and component layout.",
            },
            {
              id: "quality",
              label: "Quality Gates & Test Standards",
              description: "Lint rules, automated test verification gates, and PR review checklists.",
            },
            {
              id: "priority",
              label: "High Priority & Health Monitoring",
              description: "Mark project as High priority with automated milestone health alerts and blocker flags.",
            },
          ],
        },
        afterText: "Once confirmed, Kriri will create the project in your workspace and generate the initial milestone backlog.",
      };

      setMessages((prev) => [...prev, userBubble, step3Msg]);
    } else if (card.id === "create-project-step-3") {
      const projectName = card.projectName || "New Project";
      const scopeDesc = card.scopeDesc || "Standard Milestone Release";
      const checks = result.selectedLabels?.join(", ") || "Task decomposition, architecture blueprint, quality gates";

      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `Confirm & create project "${projectName}" with scope "${scopeDesc}" and criteria: ${checks}.`,
      };

      setMessages((prev) => [...prev, userBubble]);
      setLoading(true);

      const projectPlan = [
        { id: "cp1", title: `Verify parameters for "${projectName}"`, detail: "Validation", status: "pending" },
        { id: "cp2", title: "Provision project database records in Postgres", detail: "Postgres", status: "pending" },
        { id: "cp3", title: "Generate initial milestones & delivery backlog", detail: "Milestones", status: "pending" },
        { id: "cp4", title: "Establish quality gates & health monitoring", detail: "Governance", status: "pending" },
      ];
      if (stepperRef.current) stepperRef.current.cancel();
      stepperRef.current = startPlanStepper(projectPlan, (updatedPlan) => {
        setActivePlan([...updatedPlan]);
      });

      try {
        const isHighPriority = result.selectedIds?.includes("priority");
        const newProj = await api.post("/projects", {
          name: projectName,
          description: `Created via Kriri AI Agent.\n\nScope: ${scopeDesc}\nGovernance & Standards: ${checks}`,
          short_summary: `AI initialized project with ${scopeDesc}`,
          status: "Planning",
          priority: isHighPriority ? "High" : "Medium",
          health: "On Track",
          milestones: [
            { name: "Phase 1: Architecture & Foundation", desc: "System design, core schema, and initial setup" },
            { name: "Phase 2: Core Feature Implementation", desc: "Key user flows and primary components" },
            { name: "Phase 3: Quality Gates & Launch", desc: "Testing, security validation, and release" },
          ],
        });

        const completedPlan = stepperRef.current?.finish() || projectPlan.map((p) => ({ ...p, status: "completed" }));
        setActivePlan(null);

        const successMsg = {
          id: `ai-${Date.now() + 1}`,
          role: "assistant",
          content: `🎉 **Project Created Successfully!**\n\n**${projectName}** has been initialized in your Kriri workspace:\n• **Identifier:** \`${newProj?.identifier || "KRI-PROJ"}\`\n• **Status:** Planning • **Health:** On Track\n• **Scope:** ${scopeDesc}\n• **Configured Gates:** ${checks}\n\nInitial milestones and task structure have been provisioned.`,
          createdProject: newProj,
          plan: completedPlan,
        };

        setMessages((prev) => [...prev, successMsg]);
      } catch (err) {
        stepperRef.current?.cancel();
        setActivePlan(null);
        console.warn("Direct project creation fallback to AI chat:", err);
        const prompt = `Initialize a new project named "${projectName}" with scope "${scopeDesc}" and governance: ${checks}. Generate the project architecture, milestones, and initial task breakdown.`;
        handleSend(prompt);
      } finally {
        setLoading(false);
      }
    } else if (card.id && (card.id.startsWith("task-status-") || card.taskId)) {
      const selection = result.selectedId || result.selectedLabel;
      handleSend(`Update status of task #${card.taskId} to "${selection}".`);
    } else {
      const selection = result.selectedLabel || result.selectedId || result.selectedIds?.join(", ");
      handleSend(`I choose "${selection}".`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExpandToPage = () => {
    onClose?.();
    if (conversationId) {
      navigate(`/agent?conversationId=${conversationId}`);
    } else {
      navigate("/agent");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-11 right-3 sm:right-4 z-50 w-[420px] max-w-[calc(100vw-24px)] h-[580px] max-h-[calc(100vh-76px)] rounded-2xl bg-[#fbfbfb] dark:bg-[#0d0d0d] border border-black/10 dark:border-white/[0.08] shadow-[0_28px_80px_rgba(0,0,0,0.2)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden select-none text-zinc-900 dark:text-zinc-100 font-sans"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 1. Window Header */}
        <div className="h-10 px-3.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              New chat
            </button>
            {projectName && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                / {projectName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              onClick={handleExpandToPage}
              className="p-1 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Expand to full workspace"
            >
              <Maximize2 size={12} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* 2. Body Area */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {messages.length === 0 ? (
            /* Empty / Landing State */
            <div className="flex-1 flex flex-col items-center justify-center p-5 relative overflow-y-auto">
              <div className="w-full flex flex-col items-center">
                {/* Personalized Assistant Heading */}
                <h2 className="text-[22px] font-normal text-zinc-900 dark:text-[#ececec] text-center tracking-tight mb-5">
                  How can I help you today{firstName ? `, ${firstName}` : ""}?
                </h2>

                {/* Dynamic Pill / Auto-expanding Card Input (Image 1 & Image 2) */}
                <KririPromptInput
                  value={input}
                  onChange={setInput}
                  onSubmit={() => handleSend()}
                  isListening={isListening}
                  onVoiceToggle={handleVoiceToggle}
                  loading={loading}
                  placeholder="Ask Kriri"
                  variant="compact"
                  onAttachFile={(file) => {
                    setInput((prev) => (prev ? `${prev} [Attached: ${file.name}]` : `Analyze file: ${file.name}`));
                  }}
                  onMention={() => {
                    setInput((prev) => (prev ? `${prev} @` : "@"));
                  }}
                  accessMode={accessMode}
                  onAccessModeChange={handleAccessModeChange}
                />

                {/* Horizontal Quick Kickstart Examples (Text Only, No Icons - Image 2) */}
                <div className="w-full px-1 mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  {QUICK_EXAMPLES.map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(example.prompt)}
                      className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#212121] hover:bg-zinc-50 dark:hover:bg-[#2a2a2a] border border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/10 text-[12px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Chat View */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5">
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex flex-col gap-1 w-full ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Dynamic Agent Todo Plan (Collapsible with morphing marks) */}
                  {msg.plan && (
                    <div className="w-full">
                      <TodoList
                        items={msg.plan}
                        title="Execution Plan"
                        collapseOnComplete={true}
                        defaultOpen={false}
                      />
                    </div>
                  )}

                  {/* Text bubble or introductory text */}
                  {msg.content && (
                    msg.role === "user" ? (
                      <div className="max-w-[85%] rounded-2xl px-3.5 py-2 whitespace-pre-wrap text-[13px] leading-relaxed bg-zinc-200 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 font-normal">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full text-zinc-900 dark:text-[#ececec] py-1 text-[13px]">
                        <FormattedAIMessage content={msg.content} />
                      </div>
                    )
                  )}

                  {/* Inline Conversational Decision Card (Images 2, 3, 4, 5) */}
                  {msg.card && (
                    <div className="w-full">
                      <InlineDecisionCard
                        card={msg.card}
                        disabled={msg.cardConfirmed}
                        onConfirm={(result) => handleCardConfirm(msg.id, msg.card, result)}
                      />
                    </div>
                  )}

                  {/* Supplementary text underneath card */}
                  {msg.afterText && (
                    <div className="text-[12px] text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed mt-1">
                      {msg.afterText}
                    </div>
                  )}

                  {/* Created Project Card Banner with Link */}
                  {msg.createdProject && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 w-full shadow-md dark:shadow-lg">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider">
                          {msg.createdProject.identifier || "PROJECT INITIALIZED"}
                        </div>
                        <div className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate mt-0.5">
                          {msg.createdProject.name}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                          <span>Status: {msg.createdProject.status || "Planning"}</span>
                        </div>
                      </div>
                      <a
                        href={`/projects/${msg.createdProject.slug || msg.createdProject.id}`}
                        className="px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-semibold transition-colors shrink-0 inline-flex items-center gap-1 shadow"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} strokeWidth={2.2} />
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="w-full py-1">
                  {activePlan ? (
                    <TodoList
                      items={activePlan}
                      title="Agent Working..."
                      open={true}
                      collapseOnComplete={false}
                    />
                  ) : (
                    <div className="flex gap-2 items-center text-zinc-500 dark:text-zinc-400 text-xs py-1">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400/30 dark:border-zinc-500/30 border-t-zinc-700 dark:border-t-zinc-200 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 3. Bottom Input Bar in Active Chat (Auto-expanding Card on multiline) */}
          {messages.length > 0 && (
            <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-[#fbfbfb] dark:bg-[#0d0d0d] shrink-0">
              <KririPromptInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSend()}
                isListening={isListening}
                onVoiceToggle={handleVoiceToggle}
                loading={loading}
                placeholder="Ask Kriri"
                variant="compact"
                onAttachFile={(file) => {
                  setInput((prev) => (prev ? `${prev} [Attached: ${file.name}]` : `Analyze file: ${file.name}`));
                }}
                onMention={() => {
                  setInput((prev) => (prev ? `${prev} @` : "@"));
                }}
                accessMode={accessMode}
                onAccessModeChange={handleAccessModeChange}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
