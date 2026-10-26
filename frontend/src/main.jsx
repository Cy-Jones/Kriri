import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import "./index.css";
import "@/registry/foundation.css";
import App from "./App.jsx";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

import { initPostHog } from "./lib/posthog";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Initialize PostHog once at application startup
initPostHog();

function ClerkWithTheme({ children }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const appearance = useMemo(() => {
    if (isDark) {
      return {
        baseTheme: dark,
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#131416",
          colorInputBackground: "#1c1d21",
          colorInputText: "#f2f2f2",
          colorText: "#f2f2f2",
          colorTextSecondary: "#8a8a93",
          fontFamily: '"Plus Jakarta Sans", "Plus Jakarta Sans Variable", sans-serif',
          borderRadius: "1rem",
        },
        elements: {
          modalContent: {
            borderRadius: "1.25rem",
            overflow: "hidden",
          },
          card: {
            backgroundColor: "#131416",
            border: "1px solid #26272c",
            borderRadius: "1.25rem",
            overflow: "hidden",
            boxShadow:
              "0 24px 60px -12px rgba(0, 0, 0, 0.7), 0 2px 4px -1px rgba(0, 0, 0, 0.4)",
          },
          organizationProfileRoot: {
            borderRadius: "1.25rem",
            overflow: "hidden",
          },
          createOrganizationRoot: {
            borderRadius: "1.25rem",
            overflow: "hidden",
          },
          organizationSwitcherPopoverCard: {
            borderRadius: "1rem",
            overflow: "hidden",
          },
          formButtonPrimary: {
            backgroundColor: "#ffffff",
            color: "#131416",
            "&:hover": {
              backgroundColor: "#e8e8e8",
            },
          },
          navbar: {
            borderRight: "1px solid #26272c",
          },
          organizationSwitcherTrigger: {
            color: "#f2f2f2",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.06)",
            },
          },
        },
      };
    } else {
      return {
        baseTheme: undefined,
        variables: {
          colorPrimary: "#09090b",
          colorBackground: "#ffffff",
          colorInputBackground: "#f4f4f5",
          colorInputText: "#09090b",
          colorText: "#09090b",
          colorTextSecondary: "#71717a",
          fontFamily: '"Plus Jakarta Sans", "Plus Jakarta Sans Variable", sans-serif',
          borderRadius: "1rem",
        },
        elements: {
          modalContent: {
            borderRadius: "1.25rem",
            overflow: "hidden",
          },
          card: {
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "1.25rem",
            overflow: "hidden",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
          },
          organizationProfileRoot: {
            borderRadius: "1.25rem",
            overflow: "hidden",
          },
          createOrganizationRoot: {
            borderRadius: "1.25rem",
            overflow: "hidden",
          },
          organizationSwitcherPopoverCard: {
            borderRadius: "1rem",
            overflow: "hidden",
          },
          formButtonPrimary: {
            backgroundColor: "#09090b",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#27272a",
            },
          },
          navbar: {
            backgroundColor: "#fafafa",
            borderRight: "1px solid rgba(0, 0, 0, 0.08)",
          },
          organizationSwitcherTrigger: {
            color: "#09090b",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          },
        },
      };
    }
  }, [isDark]);

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ClerkWithTheme>
        <App />
      </ClerkWithTheme>
    </ThemeProvider>
  </StrictMode>,
);
