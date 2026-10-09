import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  KanbanSquare,
  CheckSquare,
  Settings,
  LogOut,
  Plus,
  Search,
  Folder,
  CheckCircle2,
} from "lucide-react";
import { useClerk, useOrganization } from "@clerk/clerk-react";
import { api } from "../lib/api";

export default function CommandPalette({ openCreateTask }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (open && organization?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [projRes, tasksRes] = await Promise.all([
            api.get("/projects"),
            api.get("/tasks"),
          ]);
          setProjects(projRes.data.projects || []);
          setTasks(tasksRes.data.tasks || []);
        } catch (err) {
          console.error("Failed to load search data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open, organization?.id]);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/50 backdrop-blur-sm"
    >
      <Command
        className="w-full max-w-[500px] bg-[#1a1b1e] text-white border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}
      >
        <div className="flex items-center border-b border-white/10 px-3">
          <Search className="w-5 h-5 text-text-muted shrink-0 mr-2" />
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full bg-transparent border-none outline-none text-[15px] h-12 text-white placeholder-text-muted focus:ring-0 p-0"
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-[13px] text-text-muted">
            {loading ? "Loading..." : "No results found."}
          </Command.Empty>

          {projects.length > 0 && (
            <Command.Group
              heading="Projects"
              className="text-[11px] font-medium text-text-muted px-2 py-1.5 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1"
            >
              {projects.map((p) => (
                <Command.Item
                  key={`proj-${p.id}`}
                  value={`Project ${p.name} ${p.slug}`}
                  onSelect={() =>
                    runCommand(() => navigate(`/projects/${p.id}`))
                  }
                  className="flex items-center gap-2 px-2 py-2 text-[13px] text-white rounded-md cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10 outline-none"
                >
                  <Folder size={14} className="text-text-muted" />
                  <span className="truncate">{p.name}</span>
                  <span className="text-[11px] text-text-muted ml-auto">
                    {p.slug}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {tasks.length > 0 && (
            <Command.Group
              heading="Issues"
              className="text-[11px] font-medium text-text-muted px-2 py-1.5 mt-2 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1"
            >
              {tasks.map((t) => (
                <Command.Item
                  key={`task-${t.id}`}
                  value={`Issue ${t.title}`}
                  onSelect={() =>
                    runCommand(() => {
                      // For now navigate to kanban since we don't have a direct issue page yet
                      // But if TaskDetailsModal takes URL params later, we can route there.
                      navigate("/kanban");
                    })
                  }
                  className="flex items-center gap-2 px-2 py-2 text-[13px] text-white rounded-md cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10 outline-none"
                >
                  <CheckCircle2 size={14} className="text-text-muted" />
                  <span className="truncate">{t.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group
            heading="Navigation"
            className="text-[11px] font-medium text-text-muted px-2 py-1.5 mt-2 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1"
          >
            <Command.Item
              value="Go to Dashboard"
              onSelect={() => runCommand(() => navigate("/dashboard"))}
              className="flex items-center gap-2 px-2 py-2 text-[13px] text-white rounded-md cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10 outline-none"
            >
              <LayoutGrid size={16} className="text-text-muted" />
              Go to Dashboard
            </Command.Item>
            <Command.Item
              value="Go to Board kanban"
              onSelect={() => runCommand(() => navigate("/kanban"))}
              className="flex items-center gap-2 px-2 py-2 text-[13px] text-white rounded-md cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10 outline-none"
            >
              <KanbanSquare size={16} className="text-text-muted" />
              Go to Board
            </Command.Item>
            <Command.Item
              value="Go to Settings"
              onSelect={() => runCommand(() => navigate("/settings"))}
              className="flex items-center gap-2 px-2 py-2 text-[13px] text-white rounded-md cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10 outline-none"
            >
              <Settings size={16} className="text-text-muted" />
              Go to Settings
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="Actions"
            className="text-[11px] font-medium text-text-muted px-2 py-1.5 mt-2 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1"
          >
            <Command.Item
              value="Create Issue Task"
              onSelect={() => runCommand(() => openCreateTask())}
              className="flex items-center gap-2 px-2 py-2 text-[13px] text-white rounded-md cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10 outline-none"
            >
              <Plus size={16} className="text-text-muted" />
              Create Issue
            </Command.Item>
            <Command.Item
              value="Log Out signout"
              onSelect={() => runCommand(() => signOut(() => navigate("/")))}
              className="flex items-center gap-2 px-2 py-2 text-[13px] text-danger rounded-md cursor-pointer hover:bg-danger/10 data-[selected=true]:bg-danger/10 outline-none"
            >
              <LogOut size={16} className="text-danger opacity-80" />
              Log Out
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </Command.Dialog>
  );
}
