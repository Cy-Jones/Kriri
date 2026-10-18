import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useSignUp } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import { AuthShowcase } from "../components/AuthShowcase";
import { Input } from "../registry/components/input/input";
import { PasswordField } from "../registry/components/password-field/password-field";
import posthog from "../lib/posthog";

export default function Register() {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!termsAccepted) {
      setError("You must accept the Terms of Service and Privacy Policy");
      return;
    }
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      setError(
        "Name can only contain letters, spaces, hyphens, and apostrophes",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(
        err.errors?.[0]?.message ||
          err.errors?.[0]?.longMessage ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError(null);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === "complete") {
        posthog.capture("account registration", { method: "email" });
        await setActive({ session: completeSignUp.createdSessionId });
        navigate("/onboarding");
      } else {
        console.warn("Sign up not complete:", completeSignUp);
      }
    } catch (err) {
      setError(
        err.errors?.[0]?.message ||
          err.errors?.[0]?.longMessage ||
          "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const [oauthLoading, setOauthLoading] = useState(null);

  const handleOAuth = (strategy) => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(strategy);
    try { posthog.capture("account registration", { method: strategy }); } catch {}
    signUp
      .authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
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
    <div className="h-screen max-h-[100dvh] w-full bg-black flex text-foreground font-sans relative overflow-hidden">
      {/* Background Dot Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Left Column */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:px-8 lg:py-3 xl:px-10 2xl:py-8 2xl:px-12 relative z-10 justify-between overflow-y-auto">
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
              <span className="font-display font-medium text-lg tracking-tight">
                Kriri
              </span>
            </Link>
            <Link
              to="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
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
            className="w-full max-w-[400px] mx-auto my-auto py-0 2xl:py-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTokens.spring.smooth}
          >
            {!pendingVerification ? (
              <>
                <div className="mb-2 sm:mb-2.5 2xl:mb-6">
                  <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-medium tracking-tight text-white font-display mb-0.5 sm:mb-1 2xl:mb-2">
                    Create an account
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Join Kriri to start tracking your work, managing your projects, and collaborating.
                  </p>
                </div>

                <div className="flex gap-2.5 sm:gap-3 w-full mb-2 sm:mb-2.5 2xl:mb-5">
                  <button
                    type="button"
                    disabled={Boolean(oauthLoading)}
                    onClick={() => handleOAuth("oauth_github")}
                    className="flex-1 h-9 sm:h-9.5 2xl:h-11 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-zinc-200 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm disabled:opacity-60"
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
                    className="flex-1 h-9 sm:h-9.5 2xl:h-11 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-zinc-200 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm disabled:opacity-60"
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

                <div className="relative flex items-center mb-2 sm:mb-2.5 2xl:mb-5">
                  <div className="flex-grow border-t border-white/[0.08]"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-[11px] font-mono tracking-wider uppercase">
                    or use email
                  </span>
                  <div className="flex-grow border-t border-white/[0.08]"></div>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col">
                  {error && (
                    <div className="p-2.5 2xl:p-3 mb-2 2xl:mb-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 2xl:gap-3.5 mb-2.5 sm:mb-3 2xl:mb-5">
                    <div className="flex gap-2.5 sm:gap-3">
                      <div className="flex-1">
                        <Input
                          label="First Name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          minLength={2}
                          maxLength={50}
                          placeholder="First name"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          label="Last Name"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          minLength={2}
                          maxLength={50}
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                    />

                    <div className="flex gap-2.5 sm:gap-3">
                      <div className="flex-1">
                        <PasswordField
                          label="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          maxLength={128}
                          placeholder="Min. 8 chars"
                        />
                      </div>
                      <div className="flex-1">
                        <PasswordField
                          label="Confirm"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm pass"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 mt-0.5 text-xs text-zinc-400 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-white/20 bg-zinc-900/50 text-white focus:ring-white focus:ring-offset-black transition-all accent-white"
                      />
                      <span className="leading-snug group-hover:text-zinc-300 transition-colors text-[11px] sm:text-xs">
                        I accept the{" "}
                        <Link
                          to="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-200 underline hover:text-white"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-200 underline hover:text-white"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </div>

                  {/* Animated Button Architecture */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full h-9.5 sm:h-10 2xl:h-[48px] inline-flex items-center justify-center gap-2.5 rounded-full bg-white text-black font-medium text-xs sm:text-sm 2xl:text-base hover:bg-zinc-100 transition-all duration-300 shadow-[0_0_24px_rgba(255,255,255,0.18)] active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>{loading ? "Creating account..." : "Create account"}</span>
                    <span className="w-5 h-5 2xl:w-6 2xl:h-6 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight size={13} strokeWidth={2.5} className="text-black" />
                    </span>
                  </button>
                </form>

                <div className="text-center text-xs sm:text-sm text-zinc-500 mt-2 sm:mt-2.5 2xl:mt-6">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-white font-medium hover:underline transition-all"
                  >
                    Log in
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <div className="mb-4 xl:mb-8">
                  <h1 className="text-2xl xl:text-3xl font-medium tracking-tight text-white font-display mb-1.5 xl:mb-2">
                    Verify your email
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    We sent a verification code to <span className="text-white">{email}</span>. Please enter it below.
                  </p>
                </div>
                <form onSubmit={handleVerify} className="flex flex-col">
                  {error && (
                    <div className="p-2.5 xl:p-3 mb-3.5 xl:mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm text-center">
                      {error}
                    </div>
                  )}
                  <div className="mb-4 xl:mb-6">
                    <Input
                      label="Verification Code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      placeholder="Enter code"
                    />
                  </div>
                  {/* Animated Button Architecture */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full h-10 xl:h-[48px] inline-flex items-center justify-center gap-2.5 rounded-full bg-white text-black font-medium text-xs sm:text-sm xl:text-base hover:bg-zinc-100 transition-all duration-300 shadow-[0_0_24px_rgba(255,255,255,0.18)] active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>{loading ? "Verifying..." : "Verify Email"}</span>
                    <span className="w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight size={13} strokeWidth={2.5} className="text-black" />
                    </span>
                  </button>
                </form>
              </div>
            )}
          </motion.div>
      </div>

      <AuthShowcase />
    </div>
  );
}
