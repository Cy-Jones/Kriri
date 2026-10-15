import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/registry/blocks/site-header/site-header";
import { HeroSection } from "@/registry/blocks/hero-section/hero-section";
import { CtaSection } from "@/registry/blocks/cta-section/cta-section";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  const navigate = useNavigate();
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
  const items = [
    { value: "features", label: "Features", href: "/features" },
    { value: "pricing", label: "Pricing", href: "/pricing" },
    { value: "changelog", label: "Changelog", href: "/changelog" },
    { value: "about", label: "About", href: "/about" },
    { value: "contact", label: "Contact", href: "/contact" },
  ];

  const handleNavigate = (destination) => {
    const targetHref = destination?.href || "/";

    if (targetHref === "/" || targetHref === "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/");
      return;
    }

    if (targetHref?.startsWith("#")) {
      const element = document.querySelector(targetHref);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(targetHref.replace("#", "/"));
      }
    } else if (targetHref) {
      if (targetHref.startsWith("/")) {
        navigate(targetHref);
      } else {
        window.location.href = targetHref;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-white/20 relative">
      {/* Background Dot Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] [data-theme=light]:opacity-[0.05] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10">
        <SiteHeader
          brand={brand}
          items={items}
          secondaryAction={{ label: "Log in", href: "/login" }}
          primaryAction={{ label: "Sign up", href: "/register" }}
          onNavigate={handleNavigate}
          variant="simple"
        />
        <main>
          <HeroSection
            variant="centered"
            title="A collaborative workspace for real-time views"
            description="Manage your projects, tasks, and team workflows in one beautiful place. Designed for teams who move fast."
            primaryAction={{ label: "Get started", href: "/register" }}
            secondaryAction={{ label: "See how it works", href: "#features" }}
          />

          <ProductPreview />

          <FeaturesSection />

          <CtaSection
            variant="centered"
            title="Ready to organize your work?"
            description="Join thousands of teams who rely on Kriri every day."
            primaryAction={{ label: "Get started", href: "/register" }}
            secondaryAction={null}
            note=""
            faces={[]}
          />
        </main>

        <Footer />
      </div>
    </div>
  );
}
