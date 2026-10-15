export default function Blog() {
  const upcomingPosts = [
    {
      id: "websockets",
      title: "Architecting Zero-Latency Sync with WebSockets",
      topic: "Systems Architecture",
      readTime: "6 min read",
      summary:
        "A breakdown of how Kriri broadcasts state mutations across concurrent client sessions in under 50ms with optimistic UI updates.",
    },
    {
      id: "dark-mode",
      title: "Designing Pitch-Black Interfaces Without Eye Fatigue",
      topic: "Design Systems",
      readTime: "4 min read",
      summary:
        "Why pure #000000 canvas with matte elevated surfaces outperforms washed-out muddy grays, and how we calibrate contrast ratios.",
    },
    {
      id: "keyboard",
      title: "The Ergonomics of Keyboard-First Issue Tracking",
      topic: "Productivity",
      readTime: "5 min read",
      summary:
        "Designing command palettes (⌘K) and modal shortcuts that keep developers on the home row without reaching for a mouse.",
    },
    {
      id: "laptop",
      title: "Eliminating Vertical Scroll on Compact 13\" Laptops",
      topic: "Frontend Engineering",
      readTime: "4 min read",
      summary:
        "How we calibrated CSS viewport heights and flex containers to ensure login, register, and 404 screens fit neatly on small displays.",
    },
  ];

  return (
    <div className="py-14 sm:py-24 lg:py-32 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 pb-8 border-b border-white/[0.08]">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white font-display text-balance">
            Notes on craft, speed, and architecture.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-xl text-pretty">
            Technical essays and behind-the-scenes engineering decisions behind Kriri. Upcoming articles currently in draft.
          </p>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {upcomingPosts.map((post) => (
            <article
              key={post.id}
              className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#080809] hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-3 text-xs font-mono text-zinc-500">
                <span>{post.topic}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-medium text-white mb-2 font-display">
                {post.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl text-pretty">
                {post.summary}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
