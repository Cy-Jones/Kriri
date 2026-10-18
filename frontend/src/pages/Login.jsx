import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useSignIn } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import { AuthShowcase } from "../components/AuthShowcase";
import { Input } from "../registry/components/input/input";
import { PasswordField } from "../registry/components/password-field/password-field";
import posthog from "../lib/posthog";

export default function Login() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        try { posthog.capture("login", { method: "email" }); } catch (e) {}
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      } else {
        console.warn("Sign in not complete:", result);
      }
    } catch (err) {
      setError(
        err.errors?.[0]?.message ||
          err.errors?.[0]?.longMessage ||
          "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (strategy) => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(strategy);
    try { posthog.capture("login", { method: strategy }); } catch (e) {}
    signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
      .catch((err) => {
        setOauthLoading(null);
        setError(
          err.errors?.[0]?.message ||
            err.errors?.[0]?.longMessage ||
            "Unable to connect to authentication provider. Please try again.",
        );
      });
  };

  return (
    <div className="h-screen max-h-[100dvh] w-full bg-background flex text-foreground font-sans relative overflow-hidden">
      {/* Background Dot Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] [data-theme=light]:opacity-[0.05] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Left Column */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:px-8 lg:py-4 xl:px-10 2xl:py-8 2xl:px-12 relative z-10 justify-between overflow-y-auto">
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
                className="text-foreground"
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
              <span className="font-display font-medium text-lg tracking-tight">
                Kriri
              </span>
            </Link>
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-0.5"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to website
            </Link>
          </div>

          {/* Form Container */}
          <motion.div
            className="w-full max-w-[380px] mx-auto my-auto py-0 2xl:py-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTokens.spring.smooth}
          >
            <div className="mb-3 sm:mb-4 2xl:mb-8">
              <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-medium tracking-tight text-foreground font-display mb-1 2xl:mb-2">
                Sign in to Kriri
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your account holds your projects, tasks, and access to workspace
                settings.
              </p>
            </div>

            <div className="flex gap-2.5 sm:gap-3 w-full mb-3 2xl:mb-6">
              <button
                type="button"
                disabled={Boolean(oauthLoading)}
                onClick={() => handleOAuth("oauth_github")}
                className="flex-1 h-9 sm:h-9.5 2xl:h-11 bg-surface hover:bg-surface-hover border border-border hover:border-foreground/20 text-foreground rounded-full text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm disabled:opacity-60"
              >
                {oauthLoading === "oauth_github" ? (
                  <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                <span>{oauthLoading === "oauth_github" ? "Connecting..." : "GitHub"}</span>
              </button>
              <button
                type="button"
                disabled={Boolean(oauthLoading)}
                onClick={() => handleOAuth("oauth_google")}
                className="flex-1 h-9 sm:h-9.5 2xl:h-11 bg-surface hover:bg-surface-hover border border-border hover:border-foreground/20 text-foreground rounded-full text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm disabled:opacity-60"
              >
                {oauthLoading === "oauth_google" ? (
                  <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>{oauthLoading === "oauth_google" ? "Connecting..." : "Google"}</span>
              </button>
            </div>

            <div className="relative flex items-center mb-3 2xl:mb-6">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-[11px] font-mono tracking-wider uppercase">
                or use email
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col">
              {error && (
                <div className="p-2.5 2xl:p-3 mb-3 2xl:mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs sm:text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 2xl:gap-5 mb-3.5 sm:mb-4 2xl:mb-8">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <div className="relative">
                  <PasswordField
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                  <Link
                    to="/forgot-password"
                    className="absolute right-0 top-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Animated Button Architecture */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-9.5 sm:h-10 2xl:h-[48px] inline-flex items-center justify-center gap-2.5 rounded-full bg-primary text-primary-foreground font-medium text-xs sm:text-sm 2xl:text-base hover:opacity-90 transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? "Signing in..." : "Sign in"}</span>
                <span className="w-5 h-5 2xl:w-6 2xl:h-6 rounded-full bg-foreground/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight size={13} strokeWidth={2.5} className="text-current" />
                </span>
              </button>
            </form>

            <div className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 2xl:mt-8">
              New to Kriri?{" "}
              <Link
                to="/register"
                className="text-foreground font-medium hover:underline transition-all"
              >
                Create an account
              </Link>
            </div>
        </motion.div>
      </div>

      <AuthShowcase />
    </div>
  );
}
