import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useSignIn } from "@clerk/clerk-react";
import { motionTokens } from "../lib/motion-tokens";
import { AuthShowcase } from "../components/AuthShowcase";
import { Input } from "../registry/components/input/input";
import { PasswordField } from "../registry/components/password-field/password-field";
import posthog from "../lib/posthog";

export default function Login() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [loading, setLoading] = useState(false);
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
        posthog.capture("login", { method: "email" });
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      } else {
        // Handle step up or MFA
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
    if (!isLoaded) return;
    posthog.capture("login", { method: strategy });
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen w-full bg-background flex text-foreground font-sans">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-12 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center w-full max-w-sm mx-auto lg:max-w-none lg:mx-0">
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
            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
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
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to website
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTokens.spring.smooth}
        >
          <div className="mb-10">
            <h1 className="text-3xl font-medium tracking-tight text-foreground font-display mb-3">
              Sign in to Kriri
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your account holds your projects, tasks, and access to workspace
              settings.
            </p>
          </div>

          <div className="flex gap-4 w-full mb-8">
            <button
              type="button"
              onClick={() => handleOAuth("oauth_github")}
              className="flex-1 h-11 bg-zinc-900 border border-white/5 hover:border-white/10 hover:bg-zinc-800/80 text-foreground rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("oauth_google")}
              className="flex-1 h-11 bg-zinc-900 border border-white/5 hover:border-white/10 hover:bg-zinc-800/80 text-foreground rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
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
              Google
            </button>
          </div>

          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs tracking-wide">
              or use email
            </span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col">
            {error && (
              <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-5 mb-8">
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
                <a
                  href="#"
                  className="absolute right-0 top-1 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white hover:bg-zinc-200 text-black rounded-xl text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center text-sm text-zinc-500 mt-8">
            New to Kriri?{" "}
            <Link
              to="/register"
              className="text-white font-medium hover:underline transition-all"
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
