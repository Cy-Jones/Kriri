import { CheckCircle2, Circle, MoreHorizontal, Plus } from "lucide-react";

export function ProductPreview() {
  return (
    <section
      id="method"
      className="py-24 bg-background relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        {/* Mockup Container */}
        <div className="relative mx-auto max-w-5xl rounded-xl bg-zinc-900/50 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
          {/* Mac-like header */}
          <div className="h-12 border-b border-white/10 bg-[#18191c] flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="mx-auto text-xs text-zinc-500 font-medium">
              kriri.app/projects
            </div>
          </div>

          {/* App Body */}
          <div className="flex h-[500px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 bg-[#18191c] p-4 flex flex-col gap-6 hidden sm:flex">
              <div>
                <div className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                  Workspace
                </div>
                <div className="space-y-1">
                  <div className="px-2 py-1.5 bg-white/5 rounded-md text-sm text-zinc-200 flex items-center gap-2">
                    <span className="w-4 h-4 bg-zinc-700 rounded text-[10px] flex items-center justify-center font-bold">
                      K
                    </span>
                    Kriri Inc.
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                  Your Views
                </div>
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors cursor-pointer">
                    Inbox
                  </div>
                  <div className="px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors cursor-pointer">
                    My Issues
                  </div>
                  <div className="px-2 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors cursor-pointer">
                    Views
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[#0e0f11] p-8 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-white">
                    Frontend Re-architecture
                  </h1>
                  <p className="text-sm text-zinc-500 mt-1">
                    Project KRI-1 • 8 issues
                  </p>
                </div>
                <button className="bg-white text-black px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-white/90 transition-colors">
                  <Plus className="w-4 h-4" /> New Issue
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {/* Task Item */}
                <div className="flex items-center gap-4 p-3 bg-zinc-900 border border-white/5 rounded-lg hover:border-white/10 transition-colors group">
                  <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-500">
                    KRI-101
                  </span>
                  <span className="text-sm text-zinc-200 flex-1">
                    Implement new React components
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 bg-white/10 text-white rounded-full">
                      In Progress
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-500 to-zinc-400 ring-2 ring-background"></div>
                    <MoreHorizontal className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Task Item */}
                <div className="flex items-center gap-4 p-3 bg-zinc-900 border border-white/5 rounded-lg hover:border-white/10 transition-colors group">
                  <Circle className="w-5 h-5 text-zinc-600" />
                  <span className="text-sm font-medium text-zinc-500">
                    KRI-102
                  </span>
                  <span className="text-sm text-zinc-200 flex-1">
                    Setup Vite configuration
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 bg-zinc-500/10 text-zinc-400 rounded-full">
                      Todo
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-600 to-zinc-500 ring-2 ring-background"></div>
                    <MoreHorizontal className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Task Item */}
                <div className="flex items-center gap-4 p-3 bg-zinc-900 border border-white/5 rounded-lg hover:border-white/10 transition-colors group">
                  <Circle className="w-5 h-5 text-zinc-600" />
                  <span className="text-sm font-medium text-zinc-500">
                    KRI-103
                  </span>
                  <span className="text-sm text-zinc-200 flex-1">
                    Write initial E2E tests
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 bg-zinc-500/10 text-zinc-400 rounded-full">
                      Todo
                    </span>
                    <div className="w-6 h-6 rounded-full border border-dashed border-zinc-600 flex items-center justify-center bg-zinc-800 text-zinc-500 text-xs">
                      +
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect underneath */}
          <div className="absolute -bottom-px inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
