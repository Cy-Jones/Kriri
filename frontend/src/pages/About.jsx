import { Link } from "react-router-dom";
import { Laptop, Keyboard, Terminal, Relay } from "@lucasmarkes/hairline/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function About() {
  const { theme } = useTheme();

  const principles = [
    {
      figure: Relay,
      title: "Latency is a Bug",
      description:
        "Every keystroke, view switch, and status transition must feel instantaneous. We prioritize optimistic local state and WebSockets over loading spinners.",
    },
    {
      figure: Laptop,
      title: "High-Density Workbench",
      description:
        "Workspaces are for execution, not marketing billboards. We maximize information density with refined Swiss typography, tight vertical rhythm, and zero decorative padding.",
    },
    {
      figure: Keyboard,
      title: "Keyboard-First Ergonomics",
      description:
        "Engineers move fastest when their hands remain on the home row. Every action in Kriri is accessible via the ⌘K command palette and rapid keyboard shortcuts.",
    },
    {
      figure: Terminal,
      title: "Monochrome Restraint",
      description:
        "No distracting rainbow themes or blinding neon glows. We build on pure pitch black (#000000) with calibrated hairlines, reserving color strictly for issue triage.",
    },
  ];

  return (
    <div className="py-14 sm:py-24 lg:py-32 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-foreground font-display text-balance">
            Building software for the makers of software.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl text-pretty">
            Kriri was created to bring clarity, velocity, and craftsmanship to issue tracking. A clean, responsive workbench designed for how modern teams build.
          </p>
        </div>

        {/* Narrative Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-20 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-sm">
            <h2 className="text-base sm:text-lg font-medium text-foreground font-display mb-3">
              The Vision
            </h2>
            <p className="mb-4">
              We started Kriri with a straightforward vision: an issue tracker that gets out of your way. Fast keystrokes, clean views, and immediate feedback so you can spend your time building great software.
            </p>
            <p>
              Every interaction is tuned to be lightweight and responsive, keeping context intact and making project organization feel natural and effortless.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-sm">
            <h2 className="text-base sm:text-lg font-medium text-foreground font-display mb-3">
              An Independent Perspective
            </h2>
            <p className="mb-4">
              Kriri is an independent project engineered from India, with cloud databases and web server infrastructure hosted in the United States.
            </p>
            <p>
              We treat issue tracking as a real-time collaborative workbench where ideas become software. Every design token, shortcut, and micro-interaction is tuned for people who care about their tools.
            </p>
          </div>
        </div>

        {/* Core Principles Grid */}
        <div className="mb-24">
          <h2 className="text-2xl sm:text-3xl font-medium text-foreground font-display mb-8">
            Our core principles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {principles.map((p) => {
              const Figure = p.figure;
              return (
                <div
                  key={p.title}
                  className="p-6 sm:p-8 rounded-2xl border border-border bg-surface hover:border-foreground/20 transition-colors flex flex-col justify-between group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Principle
                    </span>
                    <div className="w-10 h-10 flex items-center justify-center select-none">
                      <Figure
                        theme={theme === "light" ? "light" : "dark"}
                        intensity={0.85}
                        className="w-full h-full text-muted-foreground group-hover:text-foreground transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground mb-2 font-display">
                      {p.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                      {p.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimal Bottom CTA */}
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-surface p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-medium text-foreground font-display mb-1">
              Have thoughts or feedback?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We&rsquo;d love to hear how you manage tasks and what Kriri can do better.
            </p>
          </div>
          <Link to="/contact">
            <Button variant="primary" size="md" className="flex items-center gap-2 shrink-0">
              Get in touch
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
