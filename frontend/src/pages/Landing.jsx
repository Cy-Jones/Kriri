import { SiteHeader } from "@/registry/blocks/site-header/site-header";
import { HeroSection } from "@/registry/blocks/hero-section/hero-section";
import { CtaSection } from "@/registry/blocks/cta-section/cta-section";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  const brand = {
    name: "Kriri",
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
    { value: "features", label: "Features", href: "#features" },
    { value: "method", label: "Method", href: "#method" },
    { value: "customers", label: "Customers", href: "#customers" },
  ];

  const handleNavigate = (destination) => {
    const targetHref = destination.href;

    if (targetHref?.startsWith("#")) {
      const element = document.querySelector(targetHref);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (targetHref) {
      window.location.href = targetHref;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-white/20">
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
          primaryAction={{ label: "Start building", href: "/register" }}
          secondaryAction={{ label: "See how it works", href: "#features" }}
        />

        <ProductPreview />

        <FeaturesSection />

        <CtaSection
          variant="centered"
          title="Ready to organize your work?"
          description="Join thousands of teams who rely on Kriri every day."
          primaryAction={{ label: "Get started for free", href: "/register" }}
          secondaryAction={null}
          note="No credit card required."
          faces={[]}
        />
      </main>

      <Footer />
    </div>
  );
}
