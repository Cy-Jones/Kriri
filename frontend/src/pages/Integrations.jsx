import { Link } from "react-router-dom";
import {
  Plug,
  Branches,
  Router,
  Terminal,
  Padlock,
  Relay,
} from "@lucasmarkes/hairline/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/registry/components/button/button";

export default function Integrations() {
  const integrations = [
    {
      figure: Padlock,
      name: "Clerk Authentication",
      status: "Live",
      description:
        "Enterprise-grade authentication with Google and GitHub OAuth sign-in, session management, and organization switching.",
    },
    {
      figure: Relay,
      name: "Real-Time WebSocket Fabric",
      status: "Live",
      description:
        "Bi-directional event stream syncing task mutations, status transitions, and user presence dots in under 50ms.",
    },
    {
      figure: Branches,
      name: "GitHub Repository Sync",
      status: "In Development",
      description:
        "Link pull requests, branch names, and commits directly to Kriri issue cards with automatic status transitions on PR merge.",
    },
    {
      figure: Router,
      name: "Custom Webhooks",
      status: "In Development",
      description:
        "Trigger CI/CD pipelines, custom deployment bots, or third-party alerts whenever issues are created, triaged, or closed.",
    },
    {
      figure: Terminal,
      name: "Team Notifications",
      status: "Planned",
      description:
        "Real-time team channel digests for project milestones, high-priority blockers, and direct issue assignments.",
    },
    {
      figure: Plug,
      name: "JSON & CSV Backlog Importer",
      status: "Planned",
      description:
        "One-click migration tools to effortlessly import your backlog, issue tags, and historical sprints into Kriri.",
    },
  ];

  return (
    <div className="py-14 sm:py-24 lg:py-32 relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white font-display text-balance">
            Connect your engineering workflow.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-xl mx-auto text-pretty">
            Kriri pairs with modern authentication providers and real-time networking. Here is what is active today and what is on our active roadmap.
          </p>
        </div>

        {/* Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-24">
          {integrations.map((item) => {
            const Figure = item.figure;
            return (
              <div
                key={item.name}
                className="group flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#080809] hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500 font-mono mb-4">
                  <span>{item.status}</span>
                  {item.status === "Live" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </div>

                <div className="my-4 flex items-center justify-center h-44 sm:h-48 relative select-none">
                  <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                    <Figure
                      theme="dark"
                      intensity={0.85}
                      className="w-full h-full text-zinc-400 group-hover:text-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-white mb-2 font-display">
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-pretty">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integration Request Box */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080809] p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-display mb-3">
            Need a specific developer integration?
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-8 text-xs sm:text-sm leading-relaxed">
            We are actively expanding Kriri&rsquo;s developer toolchain. Let us know which tool your team uses daily, and we&rsquo;ll prioritize it on our roadmap.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact">
              <Button variant="primary" size="md" className="flex items-center gap-2">
                Request an integration
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Link to="/changelog">
              <Button variant="secondary" size="md">
                View changelog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
