import { useNavigate } from "react-router-dom";
import { SiteFooter } from "@/registry/blocks/site-footer/site-footer";

export function Footer({
  variant = "columns",
  className,
  ...props
}) {
  const navigate = useNavigate();

  const brand = {
    name: "Kriri",
    href: "/",
    mark: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground transition-transform group-hover:scale-105"
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
    bigMark: (
      <svg
        className="w-full h-auto block"
        viewBox="0 6 100 36"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <linearGradient id="kriri-big-mark-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--arc-gradient-from)" }} />
            <stop offset="100%" style={{ stopColor: "var(--arc-gradient-to)" }} />
          </linearGradient>
        </defs>
        <g stroke="url(#kriri-big-mark-gradient)">
          <rect x="25" y="10" width="50" height="50" rx="14" />
        </g>
      </svg>
    ),
  };

  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Integrations", href: "/integrations" },
        { label: "Pricing", href: "/pricing" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  const legal = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ];

  const socials = [
    { label: "GitHub", href: "https://github.com", external: true },
  ];

  const handleNavigate = (link) => {
    if (!link?.href) return;
    if (link.external || link.href.startsWith("http")) {
      window.open(link.href, "_blank", "noopener,noreferrer");
    } else {
      navigate(link.href);
    }
  };

  return (
    <SiteFooter
      variant={variant}
      brand={brand}
      tagline="A collaborative workspace for real-time views. Built for teams who move fast."
      columns={columns}
      legal={legal}
      socials={socials}
      newsletter={null}
      status={null}
      year={2026}
      onNavigate={handleNavigate}
      className={className}
      {...props}
    />
  );
}

export default Footer;
