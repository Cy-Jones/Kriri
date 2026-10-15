import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { ArrowLeft } from "lucide-react";
import { Query } from "@lucasmarkes/hairline/react";

// Arc Components
import { Button } from "../registry/components/button/button";
import { AnimatedCounter } from "../registry/components/animated-counter/animated-counter";

export default function NotFound() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [counterValue, setCounterValue] = useState(0);

  // Trigger smooth Arc counter animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCounterValue(404);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen max-h-[100dvh] w-full bg-black text-foreground flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Dot Grid (no color blurs) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-3 sm:py-4 2xl:py-5 flex items-center justify-between shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          title="Kriri Home"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="5"
              stroke="currentColor"
              strokeWidth="5"
            />
          </svg>
          <span className="font-medium text-lg tracking-tight text-white">
            Kriri
          </span>
        </Link>
      </header>

      {/* Center Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4 max-w-2xl mx-auto text-center">
        {/* Responsive Isometric Hairline Question Mark */}
        <div
          className="w-[200px] h-[155px] sm:w-[250px] sm:h-[195px] lg:w-[280px] lg:h-[220px] 2xl:w-[460px] 2xl:h-[360px] relative flex items-center justify-center mb-2 sm:mb-3 2xl:mb-4 transition-all"
          title="Interactive isometric question mark"
        >
          <Query
            theme="dark"
            intensity={0.7}
            play={true}
            className="w-full h-full text-[#8a8f98]"
          />
        </div>

        {/* Scaled 404 & Heading */}
        <div className="flex flex-col items-center gap-2 sm:gap-2.5 2xl:gap-3 w-full">
          <div className="flex items-center justify-center gap-3 sm:gap-4 2xl:gap-6">
            <span className="text-3xl sm:text-5xl 2xl:text-7xl font-mono font-semibold tracking-tight text-white flex items-center">
              <AnimatedCounter value={counterValue} />
            </span>
            <span className="h-6 sm:h-8 2xl:h-12 w-px bg-white/20" />
            <h1 className="text-xl sm:text-2xl 2xl:text-4xl font-medium text-white tracking-tight text-left">
              Page not found
            </h1>
          </div>

          <p className="text-xs sm:text-sm 2xl:text-base text-zinc-400 leading-relaxed max-w-md mt-1">
            The page you're looking for doesn't exist, has been removed, or is
            temporarily unavailable.
          </p>
        </div>

        {/* Single Focused Action Control */}
        <div className="flex items-center justify-center mt-4 sm:mt-5 2xl:mt-7">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isSignedIn ? "/dashboard" : "/");
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={15} />
            Go back
          </Button>
        </div>
      </main>

      {/* Optical balance spacer */}
      <div className="h-4 sm:h-6 2xl:h-12 relative z-10 shrink-0" />
    </div>
  );
}
