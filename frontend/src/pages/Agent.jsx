import { useState, useEffect, useRef } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { useUser, useOrganization } from "@clerk/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Plus,
  ChevronDown,
  Trash2,
  RotateCcw,
  Activity,
  CheckSquare,
  Mic,
  Paperclip,
  AtSign,
  Menu,
  Pencil,
  Pin,
  Check,
  X,
  Calendar,
  Clock,
  User as UserIcon,
  Tag as TagIcon,
  FolderPlus,
} from "lucide-react";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import KririPromptInput from "../components/ai/KririPromptInput";
import InlineDecisionCard from "../components/ai/InlineDecisionCard";
import TodoList from "../components/agents/todo-list";
import { MessageScroller } from "../components/agents/message-scroller";
import FormattedAIMessage from "../components/ai/FormattedAIMessage";
import ExecutiveProjectCard from "../components/ai/ExecutiveProjectCard";
import { generatePlanForPrompt, startPlanStepper } from "../lib/agentPlanHelper";

const QUICK_EXAMPLES = [
  {
    label: "Audit project health & risks",
    prompt: "Audit project health across our active milestones and identify critical blockers.",
  },
  {
    label: "Create a project",
    prompt: "Create a new project",
  },
  {
    label: "Analyze team workload",
    prompt: "Analyze current team workload across workspace members and highlight capacity imbalances.",
  },
];

export default function Agent() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0];
  const [searchParams, setSearchParams] = useSearchParams();
  const outletContext = useOutletContext();
  const openMobileNav = outletContext?.openMobileNav;

  const activeWorkspaceKey = organization?.id || "personal";
  const userScopeKey = user?.id ? `${activeWorkspaceKey}_${user.id}` : activeWorkspaceKey;
  const msgStorageKey = `kriri_agent_active_messages_${userScopeKey}`;
  const convStorageKey = `kriri_agent_active_conv_id_${userScopeKey}`;
  const getDraftKey = (cid, wsKey = userScopeKey) =>
    `kriri_agent_draft_${wsKey}_${cid && cid !== "null" && cid !== "undefined" ? cid : "new"}`;

  const [conversations, setConversations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(() => {
    try {
      const activeKey = organization?.id ? `${organization.id}_${user?.id || "guest"}` : (user?.id || "personal");
      const saved = localStorage.getItem(`kriri_agent_active_conv_id_${activeKey}`);
      return (saved && saved !== "null" && saved !== "undefined") ? saved : null;
    } catch {
      return null;
    }
  });
  const [messages, setMessages] = useState(() => {
    try {
      const activeKey = organization?.id ? `${organization.id}_${user?.id || "guest"}` : (user?.id || "personal");
      const saved = localStorage.getItem(`kriri_agent_active_messages_${activeKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState(() => {
    try {
      const activeKey = organization?.id ? `${organization.id}_${user?.id || "guest"}` : (user?.id || "personal");
      const savedConv = localStorage.getItem(`kriri_agent_active_conv_id_${activeKey}`);
      const draftKey = `kriri_agent_draft_${activeKey}_${savedConv && savedConv !== "null" && savedConv !== "undefined" ? savedConv : "new"}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft !== null && savedDraft !== undefined) return savedDraft;
      return localStorage.getItem(`kriri_agent_active_input_${activeKey}`) || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("kriri_pinned_chats");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);
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

  const scrollerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const plusMenuRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const stepperRef = useRef(null);
  const prevWorkspaceKeyRef = useRef(userScopeKey);
  const currentConvIdRef = useRef(currentConvId);
  const isStartingNewChatRef = useRef(false);

  useEffect(() => {
    currentConvIdRef.current = currentConvId;
  }, [currentConvId]);

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      try {
        if (organization?.id) {
          const res = await api.get(`/workspaces/${organization.id}/members`);
          const list = Array.isArray(res) ? res : res.data?.members || [];
          if (isMounted && list.length > 0) setTeamMembers(list);
        } else if (user) {
          if (isMounted) {
            setTeamMembers([
              {
                id: user.id || "personal",
                name: user.fullName || "User",
                email: user.primaryEmailAddress?.emailAddress || "",
                avatar_url: user.imageUrl,
                role: "Lead",
              },
            ]);
          }
        }
      } catch (err) {
        if (isMounted && user) {
          setTeamMembers([
            {
              id: user.id || "personal",
              name: user.fullName || "User",
              email: user.primaryEmailAddress?.emailAddress || "",
              avatar_url: user.imageUrl,
              role: "Lead",
            },
          ]);
        }
      }
    };
    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [organization?.id, user]);

  const openRenameModal = () => {
    const current = conversations.find((c) => c.id === currentConvId);
    const titleVal = (current?.title || "").replace(/\.\.\.$/, "");
    setRenameText(titleVal);
    setIsDropdownOpen(false);
    setIsRenameModalOpen(true);
  };

  const saveRename = async () => {
    if (!currentConvId || !renameText.trim()) {
      setIsRenameModalOpen(false);
      return;
    }
    const newTitle = renameText.trim();
    try {
      await api.patch(`/ai/conversations/${currentConvId}`, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (c.id === currentConvId ? { ...c, title: newTitle } : c))
      );
      toast.success("Chat renamed");
    } catch (err) {
      console.error("Failed to rename conversation:", err);
      toast.error("Failed to rename chat");
    } finally {
      setIsRenameModalOpen(false);
    }
  };

  const togglePin = (convId) => {
    const targetId = convId || currentConvId;
    if (!targetId) return;
    setPinnedIds((prev) => {
      const next = prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId];
      try {
        localStorage.setItem("kriri_pinned_chats", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 1. Initial mount & searchParams effect: load conversation list and background-refresh active messages
  useEffect(() => {
    // Purge legacy unscoped localStorage keys
    try {
      localStorage.removeItem("kriri_agent_active_messages");
      localStorage.removeItem("kriri_agent_active_conv_id");
      localStorage.removeItem("kriri_agent_active_input");
    } catch {}

    if (isStartingNewChatRef.current) {
      isStartingNewChatRef.current = false;
      return;
    }

    const urlCid = searchParams.get("conversationId");
    const savedConvId = localStorage.getItem(convStorageKey);

    loadConversations().then((list) => {
      if (urlCid) {
        selectConversation(urlCid);
        return;
      }
      if (savedConvId && savedConvId !== "null" && savedConvId !== "undefined") {
        selectConversation(savedConvId);
        return;
      }
      // If user had no active conversation selected in this workspace, restore their most recent conversation
      if (Array.isArray(list) && list.length > 0 && !currentConvIdRef.current) {
        selectConversation(list[0].id);
      }
    });
  }, [userScopeKey, searchParams, convStorageKey]);

  // 2. Handle workspace or user switching without losing chats or drafts
  useEffect(() => {
    const prevKey = prevWorkspaceKeyRef.current;
    if (prevKey && prevKey !== userScopeKey) {
      prevWorkspaceKeyRef.current = userScopeKey;
      try {
        const savedConvId = localStorage.getItem(convStorageKey);
        const savedMessages = localStorage.getItem(msgStorageKey);
        const targetDraftKey = getDraftKey(savedConvId, userScopeKey);
        const savedDraft = localStorage.getItem(targetDraftKey) || "";

        setInput(savedDraft);

        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setCurrentConvId(savedConvId && savedConvId !== "null" && savedConvId !== "undefined" ? savedConvId : null);
            return;
          }
        }

        if (savedConvId && savedConvId !== "null" && savedConvId !== "undefined") {
          selectConversation(savedConvId);
        } else {
          setMessages([]);
          setCurrentConvId(null);
          setActivePlan(null);
        }
      } catch (e) {
        setMessages([]);
        setCurrentConvId(null);
        setActivePlan(null);
        setInput("");
      }
    }
  }, [userScopeKey, convStorageKey, msgStorageKey]);

  // 3. Persist active messages when present
  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem(msgStorageKey, JSON.stringify(messages));
      }
    } catch {}
  }, [messages, msgStorageKey]);

  // 4. Persist active conversation ID when present
  useEffect(() => {
    try {
      if (currentConvId && currentConvId !== "null" && currentConvId !== "undefined") {
        localStorage.setItem(convStorageKey, String(currentConvId));
      }
    } catch {}
  }, [currentConvId, convStorageKey]);

  // 5. Persist per-chat draft input in real time
  useEffect(() => {
    try {
      const draftKey = getDraftKey(currentConvId, userScopeKey);
      if (input) {
        localStorage.setItem(draftKey, input);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch {}
  }, [input, currentConvId, userScopeKey]);

  useEffect(() => {
    if (isAtLiveEdge) {
      scrollerRef.current?.scrollToBottom?.("smooth");
    }
  }, [messages, loading, isAtLiveEdge]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.get("/ai/conversations");
      const list = Array.isArray(data) ? data : data.data || [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error("Failed to load conversations:", err);
      return [];
    }
  };

  const selectConversation = async (convId) => {
    // 1. Save current input draft before switching chats
    try {
      const oldDraftKey = getDraftKey(currentConvId, userScopeKey);
      if (input) {
        localStorage.setItem(oldDraftKey, input);
      } else {
        localStorage.removeItem(oldDraftKey);
      }
    } catch {}

    // 2. Load draft for the selected conversation
    const newDraftKey = getDraftKey(convId, userScopeKey);
    const savedDraft = localStorage.getItem(newDraftKey) || "";
    setInput(savedDraft);

    setCurrentConvId(convId);
    try {
      localStorage.setItem(convStorageKey, String(convId));
    } catch {}
    setIsDropdownOpen(false);

    try {
      const data = await api.get(`/ai/conversations/${convId}/messages`);
      const list = Array.isArray(data) ? data : data.data || [];
      const unpacked = list.map((m) => {
        let meta = m.metadata;
        if (typeof meta === "string") {
          try {
            meta = JSON.parse(meta);
          } catch {}
        }
        return {
          ...m,
          card: meta?.card || m.card,
          plan: meta?.plan || m.plan,
          createdProject: meta?.createdProject || m.createdProject,
          createdTask: meta?.createdTask || m.createdTask,
          requiresProject: meta?.requiresProject !== undefined ? meta.requiresProject : (m.requiresProject || false),
          afterText: meta?.afterText || m.afterText,
          cardConfirmed: meta?.cardConfirmed !== undefined ? meta.cardConfirmed : (m.cardConfirmed || false),
        };
      });
      setMessages(unpacked);
    } catch (err) {
      console.error("Failed to load messages:", err);
      // Only clear if conversation was permanently not found (404)
      if (err.status === 404 || err.response?.status === 404) {
        setCurrentConvId(null);
        setMessages([]);
        try {
          localStorage.removeItem(msgStorageKey);
          localStorage.removeItem(convStorageKey);
        } catch {}
        if (searchParams.get("conversationId")) {
          setSearchParams({}, { replace: true });
        }
      }
    }
  };

  const startNewChat = () => {
    isStartingNewChatRef.current = true;
    // 1. Save current draft if leaving an active conversation
    if (currentConvId) {
      try {
        const oldDraftKey = getDraftKey(currentConvId, userScopeKey);
        if (input) {
          localStorage.setItem(oldDraftKey, input);
        } else {
          localStorage.removeItem(oldDraftKey);
        }
      } catch {}
    }

    // 2. Load draft for "new" chat
    const newDraftKey = getDraftKey(null, userScopeKey);
    const savedDraft = localStorage.getItem(newDraftKey) || "";
    setInput(savedDraft);

    setCurrentConvId(null);
    setMessages([]);
    setActivePlan(null);
    setIsDropdownOpen(false);
    try {
      localStorage.removeItem(msgStorageKey);
      localStorage.removeItem(convStorageKey);
    } catch {}
    setSearchParams({}, { replace: true });
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${convId}`);
      try {
        localStorage.removeItem(getDraftKey(convId, userScopeKey));
      } catch {}
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConvId === convId) {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
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
            // Browser restarted session
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
      console.error("Voice recognition start error:", err);
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
    try {
      localStorage.removeItem(getDraftKey(currentConvId, userScopeKey));
    } catch {}
    setInput("");

    const lower = textToSend.toLowerCase().trim();
    const isProjectCreate = (
      lower.includes("create a project") ||
      lower.includes("create project") ||
      lower.includes("create a new project") ||
      lower.includes("new project")
    );

    // Only start a prompt stepper for truly complex multi-stage operations
    let planItems = [];
    if (!isProjectCreate) {
      const pItems = generatePlanForPrompt(textToSend);
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
    } else {
      if (stepperRef.current) stepperRef.current.cancel();
      setActivePlan(null);
    }

    // 1. Image 2: Inline Icon Style Decision Card
    if (lower.includes("icon style") || lower.includes("choose an icon")) {
      setLoading(false);
      setTimeout(() => {
        const completedPlan = stepperRef.current?.finish() || planItems.map(p => ({ ...p, status: "completed" }));
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
    if (isProjectCreate) {
      setLoading(false);
      if (stepperRef.current) stepperRef.current.cancel();
      setActivePlan(null);

      const step1Card = {
        id: "create-project-step-1",
        type: "single_choice",
        step: 1,
        totalSteps: 4,
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
      };

      const step1Msg = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "Let's configure and initialize your new project in Kriri.",
        card: step1Card,
        afterText: "After you choose an archetype, we'll configure:\n• 2/4: Start date & Target delivery timeline.\n• 3/4: Project labels & functional categories.\n• 4/4: Project lead, priority level & quality gates.",
      };

      setMessages((prev) => [...prev, step1Msg]);

      // Ensure conversation is persisted in chat history
      (async () => {
        try {
          let activeConvId = currentConvId;
          if (!activeConvId) {
            const convRes = await api.post("/ai/conversations", {
              title: "Create Project",
            });
            activeConvId = convRes.id;
            setCurrentConvId(activeConvId);
            loadConversations();
          }
          await api.post(`/ai/conversations/${activeConvId}/messages`, {
            role: "user",
            content: textToSend,
          });
          await api.post(`/ai/conversations/${activeConvId}/messages`, {
            role: "assistant",
            content: step1Msg.content,
            metadata: {
              plan: step1Msg.plan,
              card: step1Msg.card,
              afterText: step1Msg.afterText,
            },
          });
        } catch (e) {
          console.warn("Failed to persist project creation initiation:", e);
        }
      })();

      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: textToSend,
        conversation_id: currentConvId,
        access_mode: accessMode,
      });

      if (res.conversation_id) {
        if (!currentConvId) {
          setCurrentConvId(res.conversation_id);
          try {
            localStorage.setItem(convStorageKey, String(res.conversation_id));
            localStorage.removeItem(getDraftKey(null, userScopeKey));
          } catch {}
        }
        if (res.conversation_title) {
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === res.conversation_id);
            if (exists) {
              return prev.map((c) =>
                c.id === res.conversation_id ? { ...c, title: res.conversation_title } : c
              );
            }
            return [
              {
                id: res.conversation_id,
                title: res.conversation_title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              ...prev,
            ];
          });
        } else {
          loadConversations();
        }
      }

      const completedPlan = planItems.length > 0
        ? (stepperRef.current?.finish() || planItems.map(p => ({ ...p, status: "completed" })))
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

  // Handle URL deep-linked prompt (e.g. from Command Palette or shortcuts)
  const promptProcessedRef = useRef(false);
  useEffect(() => {
    const promptFromUrl = searchParams.get("prompt");
    if (promptFromUrl && !promptProcessedRef.current) {
      promptProcessedRef.current = true;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("prompt");
      setSearchParams(nextParams, { replace: true });
      const timer = setTimeout(() => {
        handleSend(promptFromUrl);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  const handleCardConfirm = async (msgId, card, result) => {
    // Mark card as confirmed
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, cardConfirmed: true } : m))
    );

    if (card.id === "create-project-step-1") {
      const projectName = result.customText?.trim() || result.selectedLabel;
      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `I want to create: "${projectName}". Continue to Step 2.`,
      };

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const todayFormatted = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const d2w = new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000);
      const d2wStr = d2w.toISOString().split("T")[0];
      const d2wFormatted = d2w.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const d4w = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000);
      const d4wStr = d4w.toISOString().split("T")[0];
      const d4wFormatted = d4w.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const d8w = new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000);
      const d8wStr = d8w.toISOString().split("T")[0];
      const d8wFormatted = d8w.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const d12w = new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000);
      const d12wStr = d12w.toISOString().split("T")[0];
      const d12wFormatted = d12w.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const step2Card = {
        id: "create-project-step-2",
        type: "single_choice",
        step: 2,
        totalSteps: 4,
        title: "Select Start Date & Target Delivery Date",
        subtitle: "Define when work begins and the deadline for completion.",
        footerLeft: `Project: ${projectName}`,
        submitLabel: "Next",
        projectName,
        options: [
          {
            id: "start-today-target-4w",
            label: `Start: Today (${todayFormatted}) → Target Date: 4 Weeks (${d4wFormatted})`,
            description: "Kick off immediately with a 4-week delivery sprint for the initial MVP.",
            startDate: todayStr,
            targetDate: d4wStr,
            weeks: 4,
          },
          {
            id: "start-today-target-8w",
            label: `Start: Today (${todayFormatted}) → Target Date: 8 Weeks (${d8wFormatted})`,
            description: "Standard production cadence with 8 weeks across architecture, features, and test suites.",
            startDate: todayStr,
            targetDate: d8wStr,
            weeks: 8,
          },
          {
            id: "start-today-target-2w",
            label: `Start: Today (${todayFormatted}) → Target Date: 2 Weeks (${d2wFormatted})`,
            description: "Fast-track rapid delivery sprint with an accelerated 2-week deadline.",
            startDate: todayStr,
            targetDate: d2wStr,
            weeks: 2,
          },
          {
            id: "start-today-target-12w",
            label: `Start: Today (${todayFormatted}) → Target Date: Quarterly (${d12wFormatted})`,
            description: "Quarterly enterprise initiative with a 12-week comprehensive roadmap.",
            startDate: todayStr,
            targetDate: d12wStr,
            weeks: 12,
          },
          {
            id: "custom-timeline",
            label: "Custom Start Date & Target Date",
            description: "Pick your exact start date and target completion date using the calendar.",
            allowDateInput: true,
            startDate: todayStr,
            targetDate: d4wStr,
            weeks: 4,
          },
        ],
        initialSelected: "start-today-target-4w",
      };

      const step2Msg = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: `Great! For **${projectName}**, let's set the **Start date** and **Target completion date**.`,
        card: step2Card,
        afterText: "This establishes sprint start schedules, velocity targets, and delivery milestones.",
      };

      setMessages((prev) => [...prev, userBubble, step2Msg]);

      if (currentConvId) {
        api.post(`/ai/conversations/${currentConvId}/messages`, {
          role: "user",
          content: userBubble.content,
        }).catch(() => {});
        api.post(`/ai/conversations/${currentConvId}/messages`, {
          role: "assistant",
          content: step2Msg.content,
          metadata: { card: step2Card, afterText: step2Msg.afterText },
        }).catch(() => {});
      }
    } else if (card.id === "create-project-step-2") {
      const projectName = card.projectName || "New Project";
      const selectedOpt = card.options?.find((o) => o.id === result.selectedId);

      let startDate = selectedOpt?.startDate || new Date().toISOString().split("T")[0];
      let targetDate = selectedOpt?.targetDate || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const weeks = selectedOpt?.weeks || 4;

      if (result.customText) {
        const dates = result.customText.match(/\d{4}-\d{2}-\d{2}/g);
        if (dates && dates.length >= 2) {
          startDate = dates[0];
          targetDate = dates[1];
        } else if (dates && dates.length === 1) {
          targetDate = dates[0];
        }
      }

      const timelineDesc = result.customText ? `${result.selectedLabel}: ${result.customText}` : result.selectedLabel;
      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `Start: ${startDate}, Target: ${targetDate}. Continue to Step 3.`,
      };

      // Intelligent default labels based on projectName
      const lowerName = projectName.toLowerCase();
      const defaultLabels = ["Engineering"];
      if (lowerName.includes("design") || lowerName.includes("ui")) {
        defaultLabels.push("Design System", "Frontend");
      } else if (lowerName.includes("api") || lowerName.includes("backend")) {
        defaultLabels.push("Backend", "API");
      } else if (lowerName.includes("mobile") || lowerName.includes("app")) {
        defaultLabels.push("Mobile", "Frontend");
      } else {
        defaultLabels.push("Platform", "Frontend");
      }

      const step3Card = {
        id: "create-project-step-3",
        type: "multi_choice",
        step: 3,
        totalSteps: 4,
        title: "Select Project Labels & Categories",
        subtitle: "Choose the labels to categorize, filter, and organize this project in your workspace.",
        footerLeft: `Project: ${projectName}`,
        submitLabel: "Next",
        projectName,
        startDate,
        targetDate,
        weeks,
        timelineDesc,
        initialSelected: defaultLabels,
        options: [
          {
            id: "Frontend",
            label: "Frontend",
            description: "User interfaces, React components, Tailwind styling, accessibility, and client state.",
          },
          {
            id: "Backend",
            label: "Backend & API",
            description: "Server routes, database models, business logic, authentication, and microservices.",
          },
          {
            id: "Design System",
            label: "Design System",
            description: "UI primitives, design tokens, icons, and reusable component libraries.",
          },
          {
            id: "Mobile",
            label: "Mobile Application",
            description: "Cross-platform mobile features, offline caching, and responsive mobile viewports.",
          },
          {
            id: "Infrastructure",
            label: "Infrastructure & DevOps",
            description: "CI/CD automation, cloud hosting, Docker deployments, and telemetry observability.",
          },
          {
            id: "AI & Automation",
            label: "AI & Intelligence",
            description: "LLM agent integration, automated workflows, intelligent reasoning, and prompt engineering.",
          },
          {
            id: "Security",
            label: "Security & Governance",
            description: "Authentication policies, RBAC roles, audit event logging, and compliance gates.",
          },
          {
            id: "custom-labels",
            label: "Custom Labels & Categories",
            description: "Define custom tags or category names tailored for this project.",
            allowCustomInput: true,
            customPlaceholder: "e.g., Growth, Marketing, Data-Warehouse, Core-Services...",
          },
        ],
      };

      const step3Msg = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: `Timeline set: Start **${startDate}**, Target **${targetDate}**.\n\nNow select the **labels** for **${projectName}**.`,
        card: step3Card,
        afterText: "Labels help your team filter, search, and organize workspace issues and roadmaps.",
      };

      setMessages((prev) => [...prev, userBubble, step3Msg]);

      if (currentConvId) {
        api.post(`/ai/conversations/${currentConvId}/messages`, {
          role: "user",
          content: userBubble.content,
        }).catch(() => {});
        api.post(`/ai/conversations/${currentConvId}/messages`, {
          role: "assistant",
          content: step3Msg.content,
          metadata: { card: step3Card, afterText: step3Msg.afterText },
        }).catch(() => {});
      }
    } else if (card.id === "create-project-step-3") {
      const projectName = card.projectName || "New Project";
      const startDate = card.startDate;
      const targetDate = card.targetDate;
      const weeks = card.weeks || 4;
      const timelineDesc = card.timelineDesc;

      const baseLabels = (result.selectedIds || ["Engineering"]).filter((id) => id !== "custom-labels");
      const customLabelsText = result.customText?.trim() || "";
      if (result.selectedIds?.includes("custom-labels") && customLabelsText) {
        const parsed = customLabelsText.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
        baseLabels.push(...parsed);
      }

      const selectedLabels = baseLabels.length > 0 ? baseLabels : ["Engineering"];
      const labelsSummary = selectedLabels.join(", ");

      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `Labels: [${labelsSummary}]. Continue to Step 4.`,
      };

      const defaultLead =
        teamMembers.find((m) => m.email === user?.primaryEmailAddress?.emailAddress) ||
        teamMembers[0] ||
        (user ? { id: user.id, name: user.fullName || "User", email: user.primaryEmailAddress?.emailAddress, avatar_url: user.imageUrl } : null);

      const step4Card = {
        id: "create-project-step-4",
        type: "multi_choice",
        step: 4,
        totalSteps: 4,
        title: "Configure Project Lead, Priority & Governance",
        subtitle: "Assign project lead, set priority level, and configure automated standards.",
        footerLeft: `Final Approval • ${projectName}`,
        submitLabel: "Confirm & create project",
        projectName,
        startDate,
        targetDate,
        weeks,
        timelineDesc,
        labels: selectedLabels,
        initialSelected: ["lead-me", "priority-high", "tasks", "architecture", "quality"],
        initialLead: defaultLead,
        initialPriority: "High",
        options: [
          {
            id: "lead-me",
            label: defaultLead ? `Project Lead: ${defaultLead.name}` : "Assign Project Lead",
            description: defaultLead
              ? `Set lead to ${defaultLead.name}${defaultLead.role ? ` (${defaultLead.role})` : ""} with automated accountability.`
              : "Set a team member as project lead for milestone tracking.",
            allowLeadPicker: true,
          },
          {
            id: "priority-high",
            label: "High Priority (Signal Indicator)",
            description: "Mark project as High priority with active blocker tracking and priority signal bars.",
            allowPriorityPicker: true,
          },
          {
            id: "tasks",
            label: "Automated Task Decomposition & Milestones",
            description: "Generate phased milestones and initial backlog tickets with estimates.",
          },
          {
            id: "architecture",
            label: "Architecture & Schema Blueprint",
            description: "Generate technical specifications, database schema models, and API blueprints.",
          },
          {
            id: "quality",
            label: "Quality Gates & Test Standards",
            description: "Lint validation, automated test verification gates, and PR checklists.",
          },
          {
            id: "custom-governance",
            label: "Custom Governance & Scope Rules",
            description: "Specify custom quality gates, compliance protocols, or review criteria.",
            allowCustomInput: true,
            customPlaceholder: "e.g., Mandatory code review from 2 seniors, zero critical vulnerabilities SLA...",
          },
        ],
      };

      const step4Msg = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: `Step 4 of 4: Finalize ownership and governance standards for **${projectName}**.`,
        card: step4Card,
        afterText: "Once confirmed, Kriri will provision the project record, generate the tailored description, and scaffold initial milestones.",
      };

      setMessages((prev) => [...prev, userBubble, step4Msg]);

      if (currentConvId) {
        api.post(`/ai/conversations/${currentConvId}/messages`, {
          role: "user",
          content: userBubble.content,
        }).catch(() => {});
        api.post(`/ai/conversations/${currentConvId}/messages`, {
          role: "assistant",
          content: step4Msg.content,
          metadata: { card: step4Card, afterText: step4Msg.afterText },
        }).catch(() => {});
      }
    } else if (card.id === "create-project-step-4") {
      const projectName = card.projectName || "New Project";
      const startDate = card.startDate || new Date().toISOString().split("T")[0];
      const targetDate = card.targetDate || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const labels = card.labels || ["Engineering"];
      const isLeadChecked = result.selectedIds?.includes("lead-me");
      const chosenLead = isLeadChecked ? (result.lead || card.initialLead || null) : null;
      const chosenPriority = result.priority || card.initialPriority || (result.selectedIds?.includes("priority-high") ? "High" : "Medium");
      const customGovernance = result.customText?.trim() || "";
      const checks = result.selectedLabels?.join(", ") || "Task decomposition, architecture blueprint, quality gates";

      const userBubble = {
        id: `user-${Date.now()}`,
        role: "user",
        content: `Confirm & create project "${projectName}" (Start: ${startDate}, Target: ${targetDate}, Priority: ${chosenPriority}, Lead: ${chosenLead ? chosenLead.name : "Unassigned"}, Labels: [${labels.join(", ")}]${customGovernance ? `, Custom Rules: "${customGovernance}"` : ""}).`,
      };

      setMessages((prev) => [...prev, userBubble]);
      setLoading(true);

      const projectPlan = [
        { id: "cp1", title: `Analyze project properties for "${projectName}"`, detail: "Validation", status: "pending" },
        { id: "cp2", title: "Generate AI project blueprint & topic description", detail: "AI Blueprint", status: "pending" },
        { id: "cp3", title: "Provision project database records in Postgres", detail: "Postgres", status: "pending" },
        { id: "cp4", title: "Establish milestones, quality gates & health tracking", detail: "Governance", status: "pending" },
      ];
      if (stepperRef.current) stepperRef.current.cancel();
      stepperRef.current = startPlanStepper(projectPlan, (updatedPlan) => {
        setActivePlan([...updatedPlan]);
      });

      try {
        // Step 1 & 2: Generate rich AI topic-based description & blueprint
        let blueprint = null;
        try {
          const bpRes = await api.post("/ai/projects/blueprint", {
            name: projectName,
            scope: `Start: ${startDate}, Target: ${targetDate}, Labels: ${labels.join(", ")}${customGovernance ? `, Rules: ${customGovernance}` : ""}`,
            priority: chosenPriority,
            targetDate,
          });
          blueprint = bpRes?.blueprint;
        } catch (bpErr) {
          console.warn("AI blueprint call error, using local generator:", bpErr);
        }

        const projectDescription = blueprint?.description || `${projectName} establishes a high-performance foundation tailored for enterprise scalability and reliability. This initiative unifies architectural patterns, delivers automated workflows, and enforces rigorous quality standards across the workspace.`;
        const projectSummary = blueprint?.short_summary || `Enterprise initiative focused on delivering ${projectName}.`;
        const projectLabels = labels.length > 0 ? labels : (blueprint?.labels || ["Engineering"]);
        const projectMilestones = blueprint?.milestones || [
          { name: "Phase 1: Architecture & Technical Blueprint", desc: "Define specifications, interface schemas, and technical blueprint." },
          { name: "Phase 2: Core Feature Implementation", desc: "Deliver primary modules, operational endpoints, and automated tests." },
          { name: "Phase 3: Hardening, Quality Gates & Launch", desc: "Conduct security review, end-to-end verification, and release launch." },
        ];

        // Step 3: Create the project in database with all properties
        const newProj = await api.post("/projects", {
          name: projectName,
          description: projectDescription,
          short_summary: projectSummary,
          status: "Planning",
          priority: chosenPriority,
          health: "On Track",
          start_date: startDate,
          due_date: targetDate,
          lead: chosenLead ? { id: chosenLead.id, name: chosenLead.name } : null,
          labels: projectLabels,
          milestones: projectMilestones,
        });

        // Step 4: Finalize plan & update conversation title
        const completedPlan = stepperRef.current?.finish() || projectPlan.map((p) => ({ ...p, status: "completed" }));
        setActivePlan(null);

        let activeConvId = currentConvId;
        if (activeConvId) {
          api.patch(`/ai/conversations/${activeConvId}`, {
            title: `Project: ${projectName}`,
          }).catch(() => {});
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? { ...c, title: `Project: ${projectName}` } : c))
          );
        }

        const successMsg = {
          id: `ai-${Date.now() + 1}`,
          role: "assistant",
          content: "Project successfully initialized in your workspace.",
          createdProject: {
            ...newProj,
            start_date: startDate,
            due_date: targetDate,
            labels: projectLabels,
            priority: chosenPriority,
            lead_name: chosenLead ? chosenLead.name : "Unassigned",
          },
          plan: completedPlan,
        };

        setMessages((prev) => [...prev, successMsg]);

        // Save turns in PostgreSQL database
        if (activeConvId) {
          api.post(`/ai/conversations/${activeConvId}/messages`, {
            role: "user",
            content: userBubble.content,
          }).catch(() => {});

          api.post(`/ai/conversations/${activeConvId}/messages`, {
            role: "assistant",
            content: successMsg.content,
            metadata: {
              createdProject: successMsg.createdProject,
              plan: successMsg.plan,
            },
          }).catch(() => {});
        }

        toast.success(`Project "${projectName}" created successfully!`);
      } catch (err) {
        stepperRef.current?.cancel();
        setActivePlan(null);
        console.warn("Direct project creation fallback to AI chat:", err);
        const prompt = `Initialize a new project named "${projectName}" with start date ${startDate}, target date ${targetDate}, labels ${labels.join(", ")}, priority ${priority}.`;
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

  const currentTitle =
    conversations.find((c) => c.id === currentConvId)?.title || "New chat";

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--card-bg,#fbfbfb)] dark:bg-[var(--card-bg,#0d0d0d)] text-zinc-900 dark:text-zinc-100 select-none overflow-hidden font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 1. Top Bar with Mobile Safe Area & Drawer Navigation */}
      <div
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 8px)" }}
        className="px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 bg-transparent z-20 border-b border-black/[0.04] dark:border-white/[0.04] md:border-b-0 min-h-[46px]"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Navigation Drawer Trigger */}
          {openMobileNav && (
            <button
              type="button"
              onClick={openMobileNav}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              <Menu size={18} strokeWidth={1.85} />
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer max-w-[calc(100vw-120px)] sm:max-w-none"
            >
              <span className="truncate sm:overflow-visible sm:whitespace-normal font-medium text-zinc-900 dark:text-zinc-100">
                {currentConvId ? currentTitle : "New chat"}
              </span>
              <ChevronDown size={13} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-xl">
                {/* Active Chat Actions (when inside a chat) */}
                {currentConvId && (
                  <div className="space-y-0.5 pb-1">
                    {/* Rename option */}
                    <button
                      type="button"
                      onClick={openRenameModal}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <Pencil size={13} strokeWidth={1.8} className="text-zinc-500 shrink-0" />
                      <span>Rename</span>
                    </button>

                    {/* Pin chat option */}
                    <button
                      type="button"
                      onClick={() => togglePin(currentConvId)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <Pin
                        size={13}
                        strokeWidth={1.8}
                        className={`shrink-0 ${
                          pinnedIds.includes(currentConvId)
                            ? "text-amber-500 fill-amber-500"
                            : "text-zinc-500"
                        }`}
                      />
                      <span>{pinnedIds.includes(currentConvId) ? "Unpin chat" : "Pin chat"}</span>
                    </button>

                    {/* Delete chat option */}
                    <button
                      type="button"
                      onClick={(e) => {
                        deleteConversation(e, currentConvId);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} strokeWidth={1.8} className="shrink-0" />
                      <span>Delete</span>
                    </button>

                    <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.06]" />
                  </div>
                )}

                {/* List of conversations/chats */}
                {conversations.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    No recent chats
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-[2px] custom-scrollbar">
                    {[...conversations]
                      .sort((a, b) => {
                        const aPinned = pinnedIds.includes(a.id);
                        const bPinned = pinnedIds.includes(b.id);
                        if (aPinned && !bPinned) return -1;
                        if (!aPinned && bPinned) return 1;
                        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
                      })
                      .map((c) => {
                        const isPinned = pinnedIds.includes(c.id);
                        const isSelected = currentConvId === c.id;

                        return (
                          <div
                            key={c.id}
                            onClick={() => selectConversation(c.id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group ${
                              isSelected
                                ? "bg-black/[0.06] dark:bg-white/10 text-zinc-900 dark:text-white font-medium"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate pr-2 min-w-0">
                              {isPinned && (
                                <Pin size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                              )}
                              <span className="truncate">{c.title || "Untitled Conversation"}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(c.id);
                                }}
                                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer ${
                                  isPinned ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                }`}
                                title={isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => deleteConversation(e, c.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5 transition-opacity text-zinc-400 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 min-h-[32px]">
          {(messages.length > 0 || currentConvId !== null) && (
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer animate-in fade-in duration-150"
              title="New chat"
            >
              <Plus size={15} strokeWidth={2} />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {messages.length === 0 ? (
          /* Empty / Landing State */
          <div
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
            className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:p-6 relative overflow-y-auto"
          >
            <div className="w-full max-w-2xl flex flex-col items-center">
              {/* Personalized Assistant Heading */}
              <h1 className="text-[23px] sm:text-[32px] font-normal text-zinc-900 dark:text-[#ececec] text-center tracking-tight mb-5 sm:mb-7 px-2">
                How can I help you today{firstName ? `, ${firstName}` : ""}?
              </h1>

              {/* Dynamic Pill / Auto-expanding Card Input (Image 1 & Image 2) */}
              <div className="w-full">
                <KririPromptInput
                  value={input}
                  onChange={setInput}
                  onSubmit={() => handleSend()}
                  isListening={isListening}
                  onVoiceToggle={handleVoiceToggle}
                  loading={loading}
                  placeholder="Ask Kriri"
                  variant="default"
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

              {/* Horizontal Quick Kickstart Examples (Scrollable on mobile, wrapped on desktop) */}
              <div className="w-full mt-4 flex items-center sm:justify-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 sm:px-2 sm:flex-wrap">
                {QUICK_EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(example.prompt)}
                    className="whitespace-nowrap shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-[#212121] hover:bg-zinc-50 dark:hover:bg-[#2a2a2a] border border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/10 text-[12.5px] sm:text-[13px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer shadow-xs sm:shadow-sm"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat View */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <MessageScroller
              ref={scrollerRef}
              followOutput={true}
              smooth={true}
              busy={loading}
              navigation="rail"
              onFollowChange={(following) => setIsAtLiveEdge(following)}
              className="flex-1 min-h-0 w-full relative"
              viewportClassName="w-full"
              contentClassName="p-3.5 sm:p-8 space-y-4 sm:space-y-5 max-w-2xl mx-auto w-full"
            >
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  data-slot="message"
                  data-from={msg.role}
                  className={`flex flex-col gap-1 w-full ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Dynamic Agent Todo Plan (Collapsible with morphing marks) - only on final responses, never on interactive questionnaire cards */}
                  {msg.plan && !msg.card && (
                    <div className="w-full max-w-xl">
                      <TodoList
                        items={msg.plan}
                        title="Execution Plan"
                        collapseOnComplete={true}
                        defaultOpen={false}
                      />
                    </div>
                  )}

                  {/* Text bubble or introductory text (suppressed if executive createdProject card is shown) */}
                  {msg.content && !msg.createdProject && (
                    msg.role === "user" ? (
                      <div
                        data-slot="message-bubble-content"
                        className="max-w-[90%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl px-3.5 py-2 sm:px-4 sm:py-2.5 whitespace-pre-wrap text-[13.5px] sm:text-[14px] leading-relaxed bg-zinc-200 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 font-normal"
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div
                        data-slot="message-bubble-content"
                        className="w-full text-zinc-900 dark:text-[#ececec] py-1"
                      >
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
                        availableMembers={teamMembers}
                        onConfirm={(result) => handleCardConfirm(msg.id, msg.card, result)}
                        onSelectChange={(newSelection, extra) => {
                          setMessages((prev) =>
                            prev.map((m) => {
                              if (m.id !== msg.id) return m;
                              return {
                                ...m,
                                card: {
                                  ...m.card,
                                  initialSelected: newSelection,
                                  initialStartDate: extra?.startDate || m.card?.initialStartDate,
                                  initialTargetDate: extra?.targetDate || m.card?.initialTargetDate,
                                  initialCustomText: extra?.customText || m.card?.initialCustomText,
                                  initialLead: extra?.lead !== undefined ? extra.lead : m.card?.initialLead,
                                  initialPriority: extra?.priority || m.card?.initialPriority,
                                },
                              };
                            })
                          );
                        }}
                      />
                    </div>
                  )}

                  {/* Supplementary text underneath card */}
                  {msg.afterText && (
                    <div className="text-[12.5px] sm:text-[13px] text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed mt-1">
                      {msg.afterText}
                    </div>
                  )}

                  {/* Single Sleek Executive Project Card (Fixing Image 1 & Reflecting Image 2 Properties) */}
                  {msg.createdProject && (
                    <ExecutiveProjectCard
                      project={msg.createdProject}
                      teamMembers={teamMembers}
                      currentUser={user}
                      onUpdate={(updatedProject) => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id ? { ...m, createdProject: updatedProject } : m
                          )
                        );
                      }}
                    />
                  )}

                  {/* Option to create a new project when issue creation is attempted with 0 projects */}
                  {msg.requiresProject && (
                    <div className="w-full max-w-xl my-2 p-4 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/20 shadow-sm select-none">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <FolderPlus size={16} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100">
                            Project Required
                          </div>
                          <div className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                            Issues in Kriri must be linked to a project. Create a new project to start organizing tasks and tracking progress.
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => handleSend("Create a new project")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            >
                              <Plus size={13} strokeWidth={2.5} />
                              <span>Create New Project</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div
                  data-slot="message"
                  data-from="assistant"
                  className="w-full max-w-xl py-1"
                >
                  {activePlan ? (
                    <TodoList
                      items={activePlan}
                      title="Agent Working..."
                      open={true}
                      collapseOnComplete={false}
                    />
                  ) : (
                    <div className="flex gap-2 items-center text-zinc-500 dark:text-zinc-400 text-xs py-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400/30 dark:border-zinc-500/30 border-t-zinc-700 dark:border-t-zinc-200 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              )}
            </MessageScroller>

            {/* Jump to latest button when user scrolled away from live edge */}
            <AnimatePresence>
              {!isAtLiveEdge && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.16 }}
                  type="button"
                  onClick={() => scrollerRef.current?.scrollToBottom?.()}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1f1f23]/95 text-zinc-700 dark:text-zinc-200 border border-black/10 dark:border-white/10 shadow-lg hover:bg-zinc-50 dark:hover:bg-[#28282d] text-xs font-medium cursor-pointer transition-colors backdrop-blur-md"
                >
                  <ArrowDown size={12} strokeWidth={2.2} className="text-zinc-500" />
                  <span>Jump to latest</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Bottom Input Bar in Active Chat with Mobile Safe Area */}
            <div
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
              className="p-3 sm:p-4 max-w-2xl mx-auto w-full shrink-0"
            >
              <KririPromptInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSend()}
                isListening={isListening}
                onVoiceToggle={handleVoiceToggle}
                loading={loading}
                placeholder="Ask Kriri"
                variant="default"
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
          </div>
        )}
      </div>

      {/* Image 2: Rename Chat Modal Popup */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsRenameModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1f1f23] border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-2xl z-10 font-sans"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-white">
                  Rename chat
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename();
                    if (e.key === "Escape") setIsRenameModalOpen(false);
                  }}
                  autoFocus
                  placeholder="Chat title"
                  className="w-full px-3 py-2 bg-black/[0.02] dark:bg-black/30 border border-black/15 dark:border-white/15 focus:border-zinc-900 dark:focus:border-white rounded-xl text-sm outline-none text-zinc-900 dark:text-white transition-colors"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveRename}
                  disabled={!renameText.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-sm"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
