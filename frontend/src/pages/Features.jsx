import { Link } from "react-router-dom";
import {
  Drawer,
  Format,
  Plot,
  Keyboard,
  Relay,
  Hub,
} from "@lucasmarkes/hairline/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function Features() {
  const { theme } = useTheme();

  const capabilities = [
    {
      figure: Drawer,
      title: "Interactive Kanban Board",
      description:
        "Manage issues with fluid drag-and-drop across custom stages. Native touch gestures, priority filters, and column issue counters.",
    },
    {
      figure: Format,
      title: "High-Density List View",
      description:
        "Triage high volumes of backlog items without visual fatigue. Compact row heights, inline status toggles, and instant assignee filters.",
    },
    {
      figure: Plot,
      title: "Gantt Timeline View",
      description:
        "Map project dependencies and visualize milestone delivery across horizontal calendars without clunky enterprise configuration.",
    },
    {
      figure: Keyboard,
      title: "Global Command Palette (⌘K)",
      description:
        "Navigate anywhere, create tasks, and switch projects instantly without your hands ever leaving the keyboard.",
    },
    {
      figure: Relay,
      title: "Real-Time WebSocket Sync",
      description:
        "Bi-directional event stream with optimistic local state updates. Every column move, edit, or comment broadcasts immediately in under 50ms.",
    },
    {
      figure: Hub,
      title: "Live Team Presence",
      description:
        "Inspect active team members with floating hover cards, see who is working on what, and catch up on notifications in a focused inbox.",
    },
  ];

  return (
    <div className="py-14 sm:py-24 lg:py-32 relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-foreground font-display text-balance">
            Crafted for speed, density, and precision.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-xl mx-auto text-pretty">
            Kriri brings issues, project roadmaps, and real-time collaboration together into a single, keyboard-driven workbench.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                Start using Kriri
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary" size="lg">
                View pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Clean Editorial Grid - No pills, no nested mini-containers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-24">
          {capabilities.map((item) => {
            const Figure = item.figure;
            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-border bg-surface hover:border-foreground/20 transition-colors shadow-sm"
              >
                <div className="mb-6 flex items-center justify-center h-48 sm:h-52 relative select-none">
                  <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                    <Figure
                      theme={theme === "light" ? "light" : "dark"}
                      intensity={0.85}
                      className="w-full h-full text-muted-foreground group-hover:text-foreground transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 font-display">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-surface p-8 sm:p-12 text-center shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-medium text-foreground font-display mb-3">
            Ready to experience a faster workflow?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-xs sm:text-sm">
            Kriri is completely free while in active development. Create a workspace in seconds with your GitHub or Google account.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                Get started free
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                Talk with us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
