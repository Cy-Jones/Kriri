import { StrictMode, useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { ui } from "@clerk/ui";
import "./index.css";
import "@/registry/foundation.css";
import App from "./App.jsx";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import {
  defaultLocalization,
  subscribeClerkLocalization,
} from "./lib/clerkLocalization";
import { getClerkAppearance } from "./lib/clerkTheme";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { initPostHog } from "./lib/posthog";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Initialize PostHog once at application startup
initPostHog();

function ClerkWithTheme({ children }) {
  const { theme, effectiveTheme, darkFlavor, lightFlavor } = useTheme();
  const [localization, setLocalization] = useState(defaultLocalization);
  const [accentKey, setAccentKey] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("kriri-accent-color") || "indigo"
      : "indigo";
  });

  useEffect(() => {
    const handlePrefChange = () => {
      setAccentKey(localStorage.getItem("kriri-accent-color") || "indigo");
    };
    window.addEventListener("kriri-preferences-changed", handlePrefChange);
    window.addEventListener("storage", handlePrefChange);
    return () => {
      window.removeEventListener("kriri-preferences-changed", handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
  }, []);

  useEffect(() => {
    return subscribeClerkLocalization((newLoc) => {
      setLocalization((prev) => {
        // Deep merge organizationProfile
        const prevOrg = prev?.organizationProfile || {};
        const newOrg = newLoc?.organizationProfile || {};
        const prevPage = prevOrg?.profilePage || {};
        const newPage = newOrg?.profilePage || {};
        const prevDanger = prevPage?.dangerSection || {};
        const newDanger = newPage?.dangerSection || {};

        return {
          ...prev,
          ...newLoc,
          organizationProfile: {
            ...prevOrg,
            ...newOrg,
            profilePage: {
              ...prevPage,
              ...newPage,
              dangerSection: {
                ...prevDanger,
                ...newDanger,
                leaveOrganization: {
                  ...(prevDanger.leaveOrganization || {}),
                  ...(newDanger.leaveOrganization || {}),
                },
                deleteOrganization: {
                  ...(prevDanger.deleteOrganization || {}),
                  ...(newDanger.deleteOrganization || {}),
                },
              },
            },
          },
        };
      });
    });
  }, []);

  const appearance = useMemo(() => {
    return getClerkAppearance({ theme, effectiveTheme, darkFlavor, lightFlavor, accentColor: accentKey });
  }, [theme, effectiveTheme, darkFlavor, lightFlavor, accentKey]);

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={appearance}
      localization={localization}
      ui={ui}
    >
      {children}
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ClerkWithTheme>
          <App />
        </ClerkWithTheme>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
