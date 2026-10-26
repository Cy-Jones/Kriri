import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { releases } from "../data/changelogData";

export default function Changelog() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "all", label: "All" },
    { id: "features", label: "Features" },
    { id: "polish", label: "Polish" },
    { id: "fixes", label: "Fixes" },
  ];


  // Filtering
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

      // Search matching
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesTab;

      const inTitle = release.title.toLowerCase().includes(query);
      const inSummary = release.summary.toLowerCase().includes(query);
      const inSections = release.sections?.some(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
      );
      const inPolish = release.polish?.some((p) => p.toLowerCase().includes(query));
      const inFixes = release.fixes?.some((f) => f.toLowerCase().includes(query));

      const matchesSearch = inTitle || inSummary || inSections || inPolish || inFixes;
      return matchesTab && matchesSearch;
    });
  }, [releases, activeTab, searchQuery]);

  return (
    <div className="py-10 sm:py-16 relative">
      <div className="mx-auto max-w-[1040px] px-4 sm:px-6 lg:px-8">
        {/* Top Header matching Kriri */}
        <header className="mb-14 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-foreground font-display">
              Changelog
            </h1>
          </div>

          {/* Subline Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <nav className="flex items-center gap-6 text-sm" aria-label="Changelog filters">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-1 font-medium transition-colors cursor-pointer ${
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.span
                        layoutId="changelogTabUnderline"
                        className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-foreground rounded-full pointer-events-none"
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors shadow-inner"
              />
            </div>
          </div>
        </header>

        {/* Releases Container */}
        <div className="relative">
          {filteredReleases.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground text-sm mb-3">
                No releases found matching your criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
                className="text-xs text-foreground underline hover:text-muted-foreground transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredReleases.map((release, index) => {
              const showSections =
                (activeTab === "all" || activeTab === "features") &&
                release.sections &&
                release.sections.length > 0;
              const showPolish =
                (activeTab === "all" || activeTab === "polish") &&
                release.polish &&
                release.polish.length > 0;
              const showFixes =
                (activeTab === "all" || activeTab === "fixes") &&
                release.fixes &&
                release.fixes.length > 0;

              return (
                <article
                  key={release.date}
                  className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 pb-16 sm:pb-24 border-b border-border last:border-b-0"
                >
                  {/* Continuous Vertical Timeline Line on the Left */}
                  {index !== filteredReleases.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden sm:block absolute left-[9px] top-[9px] bottom-[-24px] w-[1px] bg-border opacity-80 pointer-events-none"
                    />
                  )}

                  {/* Left Column: Sticky Date Container */}
                  <div className="lg:col-span-3">
                    <div className="sticky top-[88px] h-fit mb-4 pl-0 sm:pl-6 flex items-center gap-2.5">
                      <span
                        className={`hidden sm:inline-block w-[7px] h-[7px] rounded-full absolute left-[9.5px] -translate-x-1/2 shrink-0 ${
                          index === 0
                            ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <time className="text-sm font-normal text-muted-foreground font-sans">
                        {release.date}
                      </time>
                    </div>
                  </div>

                  {/* Right Column: Title & Content */}
                  <div className="lg:col-span-9 space-y-6 min-w-0">
                    <h2 className="text-2xl sm:text-[26px] font-medium tracking-tight text-foreground font-display leading-snug">
                      {release.title}
                    </h2>

                    {/* Summary Prose */}
                    <p className="text-[15px] text-muted-foreground leading-relaxed font-sans">
                      {release.summary}
                    </p>

                    {/* Subsections (Features) */}
                    {showSections && (
                      <div className="pt-2 space-y-6">
                        {release.sections.map((sec, idx) => (
                          <div key={idx} className="space-y-2">
                            <h3 className="text-lg font-medium text-foreground font-display">
                              {sec.title}
                            </h3>
                            <p className="text-[15px] text-muted-foreground leading-relaxed font-sans">
                              {sec.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Polish */}
                    {showPolish && (
                      <div className="pt-6 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3 font-display">
                          Improvements &amp; polish
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {release.polish.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                              <span className="text-foreground/90">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fixes */}
                    {showFixes && (
                      <div className="pt-6 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3 font-display">
                          Fixes &amp; stability
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {release.fixes.map((fix, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                              <span className="text-foreground/90">{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
