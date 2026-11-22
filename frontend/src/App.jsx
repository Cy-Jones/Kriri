import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  Show,
  useUser,
  AuthenticateWithRedirectCallback,
} from "@clerk/react";

const SignedIn = ({ children, fallback = null }) => (
  <Show when="signed-in" fallback={fallback}>
    {children}
  </Show>
);

const SignedOut = ({ children, fallback = null }) => (
  <Show when="signed-out" fallback={fallback}>
    {children}
  </Show>
);
import AppLayout from "./layouts/AppLayout";
import MarketingLayout from "./layouts/MarketingLayout";
import { ContextualRouteSkeleton } from "./components/skeletons/PageSkeletons";
import { SocketProvider } from "./contexts/SocketContext";
import { useTheme, isAppRoute, syncLandingTheme, syncDomTheme } from "./contexts/ThemeContext";
import { Toaster } from "sileo";
import "sileo/styles.css";
import { trackPageView } from "./lib/posthog";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Features = lazy(() => import("./pages/Features"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Changelog = lazy(() => import("./pages/Changelog"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Inbox from "./pages/Inbox";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Analytics from "./pages/Analytics";
import Agent from "./pages/Agent";

const Onboarding = lazy(() => import("./pages/Onboarding"));

import { applyPreferencesToDom } from "./lib/userPreferences";

function UserThemeSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { setUserThemeContext } = useTheme();
  const lastUserIdRef = useRef(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      if (lastUserIdRef.current !== null) {
        lastUserIdRef.current = null;
        if (typeof setUserThemeContext === "function") {
          setUserThemeContext(null);
        }
      }
      return;
    }

    const currentId = user.id;
    if (lastUserIdRef.current !== currentId) {
      lastUserIdRef.current = currentId;
      if (typeof setUserThemeContext === "function") {
        setUserThemeContext(currentId);
      }
    }
  }, [isLoaded, isSignedIn, user?.id, setUserThemeContext]);

  return null;
}

function RouteThemeSync() {
  const location = useLocation();
  const { theme, darkFlavor, lightFlavor } = useTheme();
  const lastSyncRef = useRef("");

  useEffect(() => {
    const isApp = isAppRoute(location.pathname);
    const syncKey = `${isApp}:${theme}:${darkFlavor}:${lightFlavor}`;
    if (lastSyncRef.current === syncKey) {
      return;
    }
    lastSyncRef.current = syncKey;

    if (isApp) {
      // The only place meant to follow the interface theme is when the user has logged in
      syncDomTheme(theme, darkFlavor, lightFlavor, true);
    } else {
      // All public and unauthenticated pages strictly stay in the dark theme
      syncLandingTheme();
    }
  }, [location.pathname, theme, darkFlavor, lightFlavor]);

  return null;
}

function RouteTelemetryTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
}

function DefaultStartupRedirect() {
  const defaultView = localStorage.getItem("kriri-default-view") || "dashboard";
  return <Navigate to={`/${defaultView}`} replace />;
}

function RootSuspenseFallback() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path.startsWith("/login") || path.startsWith("/register") || path === "/") {
    return null;
  }
  return <ContextualRouteSkeleton pathname={path} />;
}

function App() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  useEffect(() => {
    applyPreferencesToDom();
  }, []);

  return (
    <BrowserRouter>
      <UserThemeSync />
      <RouteThemeSync />
      <RouteTelemetryTracker />
      <Toaster
        position="bottom-right"
        theme={isDark ? "light" : "dark"}
        offset={{ bottom: 20, right: 20 }}
        options={{
          fill: isDark ? "#141517" : "#ffffff",
        }}
      />
      <Suspense fallback={<RootSuspenseFallback />}>
      <Routes>
        <Route
          path="/login/*"
          element={
            <>
              <SignedIn>
                <DefaultStartupRedirect />
              </SignedIn>
              <SignedOut>
                <Login />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/register/*"
          element={
            <>
              <SignedIn>
                <DefaultStartupRedirect />
              </SignedIn>
              <SignedOut>
                <Register />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/sso-callback"
          element={
            <AuthenticateWithRedirectCallback
              signUpForceRedirectUrl="/onboarding"
              signInForceRedirectUrl={`/${localStorage.getItem("kriri-default-view") || "dashboard"}`}
            />
          }
        />

        {/* Landing Page */}
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <DefaultStartupRedirect />
              </SignedIn>
              <SignedOut>
                <Landing />
              </SignedOut>
            </>
          }
        />

        <Route
          path="/onboarding"
          element={
            <>
              <SignedIn>
                <Onboarding />
              </SignedIn>
              <SignedOut>
                <Navigate to="/login" replace />
              </SignedOut>
            </>
          }
        />

        {/* Main Application Layout - Protected */}
        <Route
          element={
            (typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage.getItem("audit_mock_auth") === "true")) ? (
              <SocketProvider>
                <AppLayout />
              </SocketProvider>
            ) : (
              <>
                <SignedIn>
                  <SocketProvider>
                    <AppLayout />
                  </SocketProvider>
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            )
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="kanban" element={<Navigate to="/tasks?view=board" replace />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="team" element={<Team />} />
          <Route path="agent" element={<Agent />} />
        </Route>

        {/* Full-Screen Dedicated Settings Page (Linear Spec: Populates entire window) */}
        <Route
          path="/settings"
          element={
            (typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage.getItem("audit_mock_auth") === "true")) ? (
              <SocketProvider>
                <Settings />
              </SocketProvider>
            ) : (
              <>
                <SignedIn>
                  <SocketProvider>
                    <Settings />
                  </SocketProvider>
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            )
          }
        />
        <Route
          path="/settings/*"
          element={
            (typeof window !== "undefined" && import.meta.env.DEV && (window.__AUDIT_MOCK_AUTH__ || window.localStorage.getItem("audit_mock_auth") === "true")) ? (
              <SocketProvider>
                <Settings />
              </SocketProvider>
            ) : (
              <>
                <SignedIn>
                  <SocketProvider>
                    <Settings />
                  </SocketProvider>
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            )
          }
        />

        {/* Legal Pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Product & Company Pages */}
        <Route element={<MarketingLayout />}>
          <Route path="/features" element={<Features />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
        </Suspense>
    </BrowserRouter>
  );
}

export default App;
