import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/registry/blocks/site-header/site-header";
import { Footer } from "@/components/landing/Footer";

export default function MarketingLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const brand = {
    name: "Kriri",
    href: "/",
    mark: (
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
          strokeWidth="6"
        />
      </svg>
    ),
  };

  const navItems = [
    { value: "features", label: "Features", href: "/features" },
    { value: "pricing", label: "Pricing", href: "/pricing" },
    { value: "changelog", label: "Changelog", href: "/changelog" },
    { value: "about", label: "About", href: "/about" },
    { value: "contact", label: "Contact", href: "/contact" },
  ];

  const handleNavigate = (destination) => {
    const targetHref = destination?.href || "/";
    if (targetHref === "/" || targetHref === "") {
      navigate("/");
      return;
    }
    if (targetHref.startsWith("#")) {
      navigate("/" + targetHref);
    } else if (targetHref.startsWith("/")) {
      navigate(targetHref);
    } else {
      window.location.href = targetHref;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-white/20 relative flex flex-col">
      {/* Background Dot Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] [data-theme=light]:opacity-[0.05] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteHeader
          brand={brand}
          items={navItems}
          secondaryAction={{ label: "Log in", href: "/login" }}
          primaryAction={{ label: "Sign up", href: "/register" }}
          onNavigate={handleNavigate}
          variant="simple"
        />

        <main className="flex-1 w-full">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
