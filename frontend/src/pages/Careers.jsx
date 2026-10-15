import { Link } from "react-router-dom";
import { Branches } from "@lucasmarkes/hairline/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/registry/components/button/button";

export default function Careers() {
  return (
    <div className="py-14 sm:py-24 lg:py-32 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white font-display text-balance">
            Independent craft. Built with passion.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-xl text-pretty">
            Kriri is currently an independent, solo-developed workspace project. We are not actively hiring, but we welcome builders, testers, and feedback.
          </p>
        </div>

        {/* Status Callout Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080809] p-8 sm:p-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 block mb-2">
                Status
              </span>
              <h2 className="text-xl sm:text-2xl font-medium text-white font-display mb-3">
                No open positions at this time
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                Because Kriri is maintained as a focused, independent project, we do not have salaried openings right now. When the platform expands and we begin looking for collaborators, open roles will be announced here first.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/contact">
                  <Button variant="primary" size="md" className="flex items-center gap-2">
                    Send feedback or ideas
                    <ArrowRight size={14} />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="secondary" size="md">
                    Explore features
                  </Button>
                </Link>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center justify-center p-4">
              <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center select-none">
                <Branches
                  theme="dark"
                  intensity={0.85}
                  className="w-full h-full text-zinc-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ways to Collaborate */}
        <div className="border-t border-white/[0.08] pt-12">
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 block mb-6">
            Ways to collaborate
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#080809]">
              <h3 className="text-sm font-medium text-white mb-2 font-display">
                Beta Dogfooding
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Use Kriri for your own side projects and let us know what feels fast, what feels slow, and what needs polish.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#080809]">
              <h3 className="text-sm font-medium text-white mb-2 font-display">
                Feature Suggestions
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Suggest keyboard workflows, timeline enhancements, or view options that would speed up your daily engineering routine.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#080809]">
              <h3 className="text-sm font-medium text-white mb-2 font-display">
                Direct Contact
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reach out directly via email at <span className="text-white">support@kriri.app</span>. Every message is read and replied to personally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
