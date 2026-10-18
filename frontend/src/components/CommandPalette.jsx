import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  Kanban,
  CheckCircle2,
  FolderKanban,
  Settings2,
  LogOut,
  Plus,
  HelpCircle,
} from "lucide-react";
import { useClerk, useOrganization } from "@clerk/clerk-react";
import { api } from "../lib/api";
import { CommandPalette as ArcCommandPalette } from "@/registry/components/command-palette/command-palette";
import { matchesShortcut } from "@/registry/components/shortcut-recorder/shortcut-recorder";
import { getPlatformPreference, getCustomShortcuts } from "../lib/shortcutsConfig";

export default function CommandPalette({ openCreateTask, openHelp }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K or customized) & custom event listener
  useEffect(() => {
    const onKey = (e) => {
      const platform = getPlatformPreference();
      const shortcuts = getCustomShortcuts();
      const customOpen = shortcuts.openCommandMenu;

      if (
        (customOpen && matchesShortcut(e, customOpen, platform)) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    const handleCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [open]);

  // Prevent background scrolling while open
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevRootOverflow = root.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevRootOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  // Fetch dynamic projects and tasks when palette opens
  useEffect(() => {
    if (open && organization?.id) {
      const fetchData = async () => {
        try {
          const [projRes, tasksRes] = await Promise.all([
            api.get("/projects").catch(() => ({ data: { projects: [] } })),
            api.get("/tasks").catch(() => ({ data: { tasks: [] } })),
          ]);
          setProjects(projRes.data?.projects || []);
          setTasks(tasksRes.data?.tasks || []);
        } catch (err) {
          console.error("Failed to load command palette data", err);
        }
      };
      fetchData();
    }
  }, [open, organization?.id]);

  const items = useMemo(() => {
    const list = [
      // Actions
      {
        id: "action-create-issue",
        label: "Create Issue",
        description: "Create a new task or issue",
        group: "Actions",
        icon: <Plus className="w-4 h-4 text-foreground" />,
        shortcut: "C",
        keywords: ["create", "task", "issue", "new"],
        onSelect: () => {
          setOpen(false);
          openCreateTask?.();
        },
      },
      {
        id: "action-shortcuts",
        label: "Keyboard Shortcuts",
        description: "View all keyboard shortcuts and commands",
        group: "Actions",
        icon: <HelpCircle className="w-4 h-4 text-foreground" />,
        shortcut: "?",
        keywords: ["shortcuts", "help", "keyboard", "hotkeys"],
        onSelect: () => {
          setOpen(false);
          openHelp?.();
        },
      },
      // Navigation
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        description: "Workspace overview and metrics",
        group: "Navigation",
        icon: <LayoutDashboard className="w-4 h-4 text-foreground" />,
        shortcut: "G D",
        keywords: ["home", "overview", "dashboard"],
        onSelect: () => {
          setOpen(false);
          navigate("/dashboard", { state: { loadingTitle: "Dashboard" } });
        },
      },
      {
        id: "nav-board",
        label: "Go to Board",
        description: "Kanban board with status columns",
        group: "Navigation",
        icon: <Kanban className="w-4 h-4 text-foreground" />,
        shortcut: "G B",
        keywords: ["kanban", "board", "tasks", "issues"],
        onSelect: () => {
          setOpen(false);
          navigate("/kanban", { state: { loadingTitle: "Board" } });
        },
      },
      {
        id: "nav-projects",
        label: "Go to Projects",
        description: "All projects and repositories",
        group: "Navigation",
        icon: <FolderKanban className="w-4 h-4 text-foreground" />,
        shortcut: "G P",
        keywords: ["projects", "repos", "workspaces"],
        onSelect: () => {
          setOpen(false);
          navigate("/projects", { state: { loadingTitle: "Projects" } });
        },
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "Workspace configuration and preferences",
        group: "Navigation",
        icon: <Settings2 className="w-4 h-4 text-foreground" />,
        shortcut: "G S",
        keywords: ["settings", "preferences", "account"],
        onSelect: () => {
          setOpen(false);
          navigate("/settings", { state: { loadingTitle: "Settings" } });
        },
      },
      {
        id: "action-logout",
        label: "Log Out",
        description: "Sign out of your session",
        group: "Actions",
        icon: <LogOut className="w-4 h-4 text-rose-500" />,
        keywords: ["logout", "signout", "exit"],
        onSelect: () => {
          setOpen(false);
          signOut(() => navigate("/"));
        },
      },
    ];

    // Dynamic Projects
    if (projects.length > 0) {
      projects.forEach((p) => {
        list.push({
          id: `proj-${p.id}`,
          label: p.name,
          description: p.slug ? `/${p.slug}` : undefined,
          group: "Projects",
          icon: <Folder className="w-4 h-4 text-foreground" />,
          keywords: [p.name, p.slug || "", "project"],
          onSelect: () => {
            setOpen(false);
            navigate(`/projects/${p.id}`, {
              state: { loadingTitle: p.name },
            });
          },
        });
      });
    }

    // Dynamic Issues
    if (tasks.length > 0) {
      tasks.forEach((t) => {
        list.push({
          id: `task-${t.id}`,
          label: t.title,
          description: t.status ? t.status.replace("_", " ") : "Issue",
          group: "Issues",
          icon: <CheckCircle2 className="w-4 h-4 text-foreground" />,
          keywords: [t.title, t.status || "", t.priority || "", "task", "issue"],
          onSelect: () => {
            setOpen(false);
            navigate("/kanban", { state: { loadingTitle: "Board" } });
          },
        });
      });
    }

    return list;
  }, [projects, tasks, navigate, openCreateTask, signOut]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center">
          {/* Glass Scrim Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 [backdrop-filter:blur(12px)_saturate(140%)] [-webkit-backdrop-filter:blur(12px)_saturate(140%)]"
          />

          {/* Modal Panel Layer */}
          <div className="fixed inset-x-4 bottom-4 top-[14vh] sm:top-[18vh] z-[101] flex items-start justify-center pointer-events-none">
            <div className="w-full max-w-xl pointer-events-auto">
              <ArcCommandPalette
                items={items}
                placeholder="Type a command or search…"
                onSelect={(item) => {
                  item.onSelect?.();
                  setOpen(false);
                }}
                onClose={() => setOpen(false)}
                autoFocus
              />
            </div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
