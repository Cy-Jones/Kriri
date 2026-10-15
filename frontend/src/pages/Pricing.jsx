import { Link } from "react-router-dom";
import { Vault } from "@lucasmarkes/hairline/react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { FaqSection } from "@/registry/blocks/faq-section/faq-section";
import { kririFaqItems } from "@/registry/blocks/faq-section/faq-section-data";
import { useTheme } from "@/contexts/ThemeContext";

export default function Pricing() {
  const { theme } = useTheme();

  const includedFeatures = [
    "Unlimited projects, milestones & issues",
    "Interactive Kanban board with drag-and-drop",
    "High-density List view with instant triage",
    "Gantt Timeline view for sprint planning",
    "Global ⌘K command palette and hotkeys",
    "Sub-50ms WebSocket state synchronization",
    "Live presence indicators and hover cards",
    "Clerk OAuth (Google & GitHub logins)",
    "Pure pitch-black (#000000) design system",
    "Zero credit card required — immediate access",
  ];

  return (
    <div className="py-14 sm:py-24 lg:py-32 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-foreground font-display text-balance">
            Free while in active development.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-lg mx-auto text-pretty">
            No credit card, no artificial limits, and no paywalls. Experience precision project tracking with everything unlocked.
          </p>
        </div>

        {/* Clean Pricing Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-surface text-foreground shadow-sm p-8 sm:p-12 mb-20 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl sm:text-6xl font-semibold text-foreground font-display">
                  $0
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  / forever during preview
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
                Full access to the complete Kriri workspace. Designed for builders, independent engineers, and teams that move fast.
              </p>

              <div className="mb-8">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="flex items-center gap-2">
                    Create free workspace
                    <ArrowRight size={15} />
                  </Button>
                </Link>
              </div>

              <div className="space-y-2.5 pt-6 border-t border-border">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-4">
                  Included in your workspace
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {includedFeatures.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-foreground/90">
                      <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex items-center justify-center p-6 select-none">
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                <Vault
                  theme={theme === "light" ? "light" : "dark"}
                  intensity={0.9}
                  className="w-full h-full text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Arc FAQ Section */}
        <div className="mt-24 pt-12 border-t border-border">
          <FaqSection
            variant="search"
            title="Questions about pricing & access"
            description="Everything you need to know about access, workspace limits, persistence, and future tiers."
            items={kririFaqItems}
            contact={{
              label: "Still have a question?",
              description: "Our engineering team replies within a day.",
              href: "/contact",
            }}
          />
        </div>
      </div>
    </div>
  );
}

