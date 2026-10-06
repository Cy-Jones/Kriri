import {
  CheckCircle2,
  Wand2,
  Users,
  BarChart2,
  Keyboard,
  RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />,
    title: "Purpose-built for speed",
    description:
      "Navigate instantly, create tasks in milliseconds. Built for teams that move fast.",
  },
  {
    icon: <Wand2 className="w-3.5 h-3.5 text-zinc-300" />,
    title: "AI-powered insights",
    description:
      "Automatically summarize activity, detect risks, and predict project bottlenecks.",
  },
  {
    icon: <Users className="w-3.5 h-3.5 text-zinc-300" />,
    title: "Real-time collaboration",
    description:
      "Work together seamlessly. See updates instantly without refreshing.",
  },
  {
    icon: <BarChart2 className="w-3.5 h-3.5 text-zinc-300" />,
    title: "Advanced reporting",
    description:
      "Beautiful built-in analytics that turn raw data into understandable insights.",
  },
  {
    icon: <Keyboard className="w-3.5 h-3.5 text-zinc-300" />,
    title: "Keyboard-first design",
    description:
      "Command palettes and shortcuts let you do everything without touching the mouse.",
  },
  {
    icon: <RefreshCw className="w-3.5 h-3.5 text-zinc-300" />,
    title: "Instant synchronisation",
    description:
      "Local-first architecture guarantees your changes save instantly, even offline.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 sm:py-32 bg-background relative overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl lg:text-center">
          <p className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            A better way to build
            <br />
            software
          </p>
          <p className="mt-6 text-base leading-7 text-zinc-400 max-w-xl mx-auto">
            Kriri brings issues, projects, and product roadmaps into one unified
            workspace, designed to help you execute faster.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col p-5 rounded-[14px] bg-[#111113] border border-white/10 hover:border-white/15 transition-colors"
              >
                <dt className="flex items-center gap-x-3 text-sm font-medium text-zinc-100">
                  <div className="h-7 w-7 flex items-center justify-center rounded-md bg-[#1C1C1F] border border-white/5">
                    {feature.icon}
                  </div>
                  {feature.title}
                </dt>
                <dd className="mt-3 flex flex-auto flex-col text-[13px] leading-relaxed text-zinc-400">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
