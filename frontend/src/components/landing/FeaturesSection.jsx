import {
  Sieve,
  Turntable,
  Riffle,
  Plot,
  Keyboard,
  Relay,
} from "@lucasmarkes/hairline/react";
import { useTheme } from "@/contexts/ThemeContext";

const features = [
  {
    figure: Sieve,
    title: "Purpose-built for speed",
    description:
      "Navigate instantly, create tasks in milliseconds. Built for teams that move fast.",
  },
  {
    figure: Turntable,
    title: "AI-powered insights",
    description:
      "Automatically summarize activity, detect risks, and predict project bottlenecks.",
  },
  {
    figure: Riffle,
    title: "Real-time collaboration",
    description:
      "Work together seamlessly. See updates instantly without refreshing.",
  },
  {
    figure: Plot,
    title: "Advanced reporting",
    description:
      "Beautiful built-in analytics that turn raw data into understandable insights.",
  },
  {
    figure: Keyboard,
    title: "Keyboard-first design",
    description:
      "Command palettes and shortcuts let you do everything without touching the mouse.",
  },
  {
    figure: Relay,
    title: "Instant synchronisation",
    description:
      "Local-first architecture guarantees your changes save instantly, even offline.",
  },
];

export function FeaturesSection() {
  const { theme } = useTheme();

  return (
    <section
      id="features"
      className="py-14 sm:py-24 lg:py-32 bg-transparent relative overflow-hidden scroll-mt-24 sm:scroll-mt-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground font-display text-balance">
            A better way to build software
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base leading-relaxed text-muted-foreground max-w-xl mx-auto text-pretty">
            Kriri brings issues, projects, and product roadmaps into one unified
            workspace, designed to help you execute faster.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="mx-auto max-w-6xl border-t border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {features.map((feature, index) => {
              const Figure = feature.figure;
              const isLastCol = index % 3 === 2;
              const isFirstRow = index < 3;
              const isLastItem = index === features.length - 1;

              // Middle dividing line: First row ALWAYS has border-b on md screens.
              // Column dividers: Columns 0 & 1 have border-r on md screens.
              const borderClasses = [
                !isLastCol ? "md:border-r md:border-border" : "",
                isFirstRow
                  ? "border-b border-border"
                  : !isLastItem
                    ? "border-b md:border-b-0 border-border"
                    : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={feature.title}
                  className={`group relative flex flex-col justify-between p-4 sm:p-8 lg:p-10 transition-colors hover:bg-foreground/[0.02] ${borderClasses}`}
                >
                  {/* Centered Interactive Hairline Figure Stage - Enlarged on mobile */}
                  <div className="my-6 sm:my-8 lg:my-10 flex items-center justify-center h-64 sm:h-64 lg:h-72 relative select-none">
                    <div className="w-60 h-60 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 flex items-center justify-center">
                      <Figure
                        theme={theme === "light" ? "light" : "dark"}
                        intensity={0.85}
                        className="w-full h-full text-muted-foreground group-hover:text-foreground transition-colors"
                      />
                    </div>
                  </div>

                  {/* Bottom Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
