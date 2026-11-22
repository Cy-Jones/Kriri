import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SignIn } from "@clerk/react";
import { syncLandingTheme } from "../contexts/ThemeContext";
import { getAuthPageAppearance } from "../lib/clerkTheme";

export default function Login() {
  useEffect(() => {
    syncLandingTheme();
  }, []);

  const defaultView =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-default-view") || "dashboard"
      : "dashboard";

  return (
    <div
      className="dark min-h-screen w-full bg-[#08090a] flex flex-col text-white font-sans relative overflow-x-hidden"
      style={{ colorScheme: "dark" }}
    >
      {/* Background Dot Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Centered Column */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:px-8 lg:py-6 relative z-10 w-full max-w-7xl mx-auto justify-between">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform hover:opacity-80"
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
            <span className="font-display font-medium text-lg tracking-tight text-white">
              Kriri
            </span>
          </Link>
        </div>

        {/* Centered Clerk Pre-built SignIn Component */}
        <div className="w-full flex items-center justify-center my-auto py-8 sm:py-12">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/register"
            fallbackRedirectUrl={`/${defaultView}`}
            appearance={getAuthPageAppearance()}
          />
        </div>

        {/* Bottom subtle spacer to balance header */}
        <div className="w-full h-8" />
      </div>
    </div>
  );
}
