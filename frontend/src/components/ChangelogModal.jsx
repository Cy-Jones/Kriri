import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Search, CheckCircle2, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { releases } from "../data/changelogData";

export default function ChangelogModal({ isOpen, onOpenChange, initialRelease = null }) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set initial selected release if passed
  useEffect(() => {
    if (initialRelease) {
      const match = releases.find(
        (r) =>
          r.id === initialRelease ||
          r.title.toLowerCase().includes(initialRelease.toLowerCase()) ||
          r.shortTitle?.toLowerCase().includes(initialRelease.toLowerCase())
      );
      if (match) {
        setSelectedId(match.id);
      }
    } else if (releases.length > 0) {
      setSelectedId(releases[0].id);
    }
  }, [initialRelease, isOpen]);

  // Global keydown: Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onOpenChange]);

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      // Tab matching
      let matchesTab = true;
      if (activeTab === "features") {
        matchesTab = Boolean(release.sections && release.sections.length > 0);
      } else if (activeTab === "polish") {
        matchesTab = Boolean(release.polish && release.polish.length > 0);
      } else if (activeTab === "fixes") {
        matchesTab = Boolean(release.fixes && release.fixes.length > 0);
      }

      // Search query matching
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          release.title.toLowerCase().includes(q) ||
          release.summary.toLowerCase().includes(q) ||
          release.date.toLowerCase().includes(q) ||
          release.sections?.some(
            (s) =>
              s.title.toLowerCase().includes(q) ||
              s.content.toLowerCase().includes(q)
          ) ||
          release.polish?.some((p) => p.toLowerCase().includes(q)) ||
          release.fixes?.some((f) => f.toLowerCase().includes(q));
      }

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const activeRelease = useMemo(() => {
    return (
      filteredReleases.find((r) => r.id === selectedId) ||
      filteredReleases[0] ||
      releases[0]
    );
  }, [filteredReleases, selectedId]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center">
          {/* Glass Scrim Backdrop matching Command Palette */}
          <motion.div
            key="changelog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 [backdrop-filter:blur(12px)_saturate(140%)] [-webkit-backdrop-filter:blur(12px)_saturate(140%)]"
          />

          {/* Modal Panel Layer */}
          <div className="fixed inset-x-4 top-[10vh] sm:top-[12vh] z-[101] flex items-start justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl h-[78vh] max-h-[720px] pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-[#141517] shadow-[0_24px_64px_rgba(0,0,0,0.8)] text-[#f4f4f5] flex flex-col"
            >
              {/* Top Integrated Row */}
              <div className="flex items-center min-h-[54px] px-4 gap-3 border-b border-white/[0.08] transition-colors focus-within:bg-white/[0.02] flex-none">
                <div className="flex-none text-[#8a8f98]">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search changelog and release notes..."
                  className="min-w-0 flex-1 bg-transparent border-0 outline-none text-[13px] text-white placeholder-[#8a8f98]"
                />

                <div className="flex items-center gap-1.5 flex-none pl-1">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-[22px] px-1.5 border border-white/10 rounded-[6px] bg-white/[0.04] text-[11px] font-mono text-[#8a8f98]">
                    Esc
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="p-1 rounded-md text-[#8a8f98] hover:text-white hover:bg-white/[0.06] transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subheader Filter Tabs */}
              <div className="border-b border-white/[0.06] px-4 py-2 bg-[#0f1012] flex items-center justify-between gap-3 flex-none">
                <div className="flex items-center gap-1">
                  {[
                    { id: "all", label: "All Updates" },
                    { id: "features", label: "Features" },
                    { id: "polish", label: "Polish" },
                    { id: "fixes", label: "Fixes" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-white/[0.08] text-white shadow-sm"
                          : "text-[#8a8f98] hover:text-[#e8e8e8] hover:bg-white/[0.03]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-[#71717a] hidden sm:inline-block">
                  {filteredReleases.length}{" "}
                  {filteredReleases.length === 1 ? "release" : "releases"}
                </span>
              </div>

              {/* Body Split View */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Release List */}
                <div className="w-72 border-r border-white/[0.08] bg-[#0d0e10] overflow-y-auto p-2 space-y-1 flex-none scrollbar-thin scrollbar-thumb-white/10">
                  {filteredReleases.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#8a8f98]">
                      No releases match your search.
                    </div>
                  ) : (
                    filteredReleases.map((rel) => {
                      const isSelected = activeRelease?.id === rel.id;
                      return (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => setSelectedId(rel.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all border ${
                            isSelected
                              ? "bg-white/[0.08] border-white/10 shadow-sm"
                              : "border-transparent hover:bg-white/[0.03] text-[#8a8f98] hover:text-[#d1d2d5]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span
                              className={`font-mono ${
                                isSelected ? "text-emerald-400" : "text-[#71717a]"
                              }`}
                            >
                              {rel.version}
                            </span>
                            <span className="text-[#71717a]">{rel.date}</span>
                          </div>
                          <div
                            className={`text-xs font-medium leading-snug line-clamp-2 ${
                              isSelected ? "text-white" : "text-[#d1d2d5]"
                            }`}
                          >
                            {rel.title}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Right Release Detail */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                  {activeRelease ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                      {/* Release Header */}
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#8a8f98] font-mono mb-2">
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white">
                            {activeRelease.version}
                          </span>
                          <span>•</span>
                          <span>{activeRelease.date}</span>
                        </div>
                        <h2 className="text-xl font-semibold text-white tracking-tight leading-snug">
                          {activeRelease.title}
                        </h2>
                        <p className="mt-2.5 text-xs text-[#a1a1aa] leading-relaxed">
                          {activeRelease.summary}
                        </p>
                      </div>

                      {/* Key Features */}
                      {activeRelease.sections && activeRelease.sections.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8f98]">
                            Key Features
                          </h3>
                          <div className="space-y-2.5">
                            {activeRelease.sections.map((section, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                              >
                                <h4 className="text-xs font-medium text-white mb-1">
                                  {section.title}
                                </h4>
                                <p className="text-xs text-[#8a8f98] leading-relaxed">
                                  {section.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Polish */}
                      {activeRelease.polish && activeRelease.polish.length > 0 && (
                        <div className="space-y-2.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8f98] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Polish & Experience Improvements
                          </h3>
                          <ul className="space-y-2">
                            {activeRelease.polish.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2.5 text-xs text-[#a1a1aa] leading-relaxed"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 mt-1.5 flex-none" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fixes */}
                      {activeRelease.fixes && activeRelease.fixes.length > 0 && (
                        <div className="space-y-2.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8f98] flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-blue-400" />
                            Bug Fixes & Hardening
                          </h3>
                          <ul className="space-y-2">
                            {activeRelease.fixes.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2.5 text-xs text-[#a1a1aa] leading-relaxed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/80 mt-0.5 flex-none" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#8a8f98]">
                      Select a release to view details
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="border-t border-white/[0.08] bg-[#0c0d0f] px-5 py-2.5 flex items-center justify-between text-[11px] text-[#71717a] flex-none">
                <span>Press Esc to close</span>
                <span>Kriri Production Releases</span>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
