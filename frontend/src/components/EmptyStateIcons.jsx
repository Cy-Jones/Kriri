export const ProjectsEmptyIcon = ({ className = "" }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      {/* Top back cube */}
      <path d="M32 12L40 16V24L32 28L24 24V16L32 12Z" />
      <path d="M32 20L40 16" />
      <path d="M32 20L24 16" />
      <path d="M32 20V28" />

      {/* Left cube */}
      <path d="M24 24L32 28V36L24 40L16 36V28L24 24Z" />
      <path d="M24 32L32 28" />
      <path d="M24 32L16 28" />
      <path d="M24 32V40" />

      {/* Right cube */}
      <path d="M40 24L48 28V36L40 40L32 36V28L40 24Z" />
      <path d="M40 32L48 28" />
      <path d="M40 32L32 28" />
      <path d="M40 32V40" />

      {/* Bottom front cube */}
      <path d="M32 36L40 40V48L32 52L24 48V40L32 36Z" />
      <path d="M32 44L40 40" />
      <path d="M32 44L24 40" />
      <path d="M32 44V52" />
    </g>
  </svg>
);

export const IssuesEmptyIcon = ({ className = "" }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Stacked planes/views representation */}
    <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M32 16L48 23L32 30L16 23L32 16Z" fill="#131416" />
      <path d="M16 29L32 36L48 29" />
      <path d="M16 35L32 42L48 35" />
      <path d="M16 41L32 48L48 41" />

      {/* Inner details for the top plane to look like an issue card */}
      <path d="M24 21.5L34 26" strokeWidth="1" />
      <path d="M27 20L31 22" strokeWidth="1" />
    </g>
  </svg>
);

export const BoardEmptyIcon = ({ className = "" }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      {/* Board Base */}
      <path d="M32 14L54 24L32 34L10 24L32 14Z" fill="#131416" />
      {/* Grid lines */}
      <path d="M20.5 19.5L20.5 40" />
      <path d="M32 24.5L32 45" />
      <path d="M43.5 19.5L43.5 40" />

      {/* Floating Issue Cards */}
      <path d="M17 26L23 29V34L17 31V26Z" fill="#131416" />
      <path d="M17 26L23 29V34L17 31V26Z" />

      <path d="M29 32L35 35V40L29 37V32Z" fill="#131416" />
      <path d="M29 32L35 35V40L29 37V32Z" />

      <path d="M41 24L47 27V32L41 29V24Z" fill="#131416" />
      <path d="M41 24L47 27V32L41 29V24Z" />
    </g>
  </svg>
);

export const DashboardEmptyIcon = ({ className = "" }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      {/* Center node */}
      <circle cx="32" cy="32" r="4" fill="#131416" />
      <circle cx="32" cy="32" r="4" />

      {/* Satellite nodes */}
      <circle cx="32" cy="14" r="3" fill="#131416" />
      <circle cx="32" cy="14" r="3" />

      <circle cx="48" cy="24" r="3" fill="#131416" />
      <circle cx="48" cy="24" r="3" />

      <circle cx="48" cy="40" r="3" fill="#131416" />
      <circle cx="48" cy="40" r="3" />

      <circle cx="32" cy="50" r="3" fill="#131416" />
      <circle cx="32" cy="50" r="3" />

      <circle cx="16" cy="40" r="3" fill="#131416" />
      <circle cx="16" cy="40" r="3" />

      <circle cx="16" cy="24" r="3" fill="#131416" />
      <circle cx="16" cy="24" r="3" />

      {/* Connections */}
      <path d="M32 17V28" />
      <path d="M32 36V47" />
      <path d="M45.5 25.5L35 30" />
      <path d="M45.5 38.5L35 34" />
      <path d="M18.5 25.5L29 30" />
      <path d="M18.5 38.5L29 34" />

      {/* Outer connections */}
      <path d="M34.5 15.5L46 22" strokeDasharray="2 2" />
      <path d="M48 27V37" strokeDasharray="2 2" />
      <path d="M46 42L34.5 48.5" strokeDasharray="2 2" />
      <path d="M29.5 48.5L18 42" strokeDasharray="2 2" />
      <path d="M16 37V27" strokeDasharray="2 2" />
      <path d="M18 22L29.5 15.5" strokeDasharray="2 2" />
    </g>
  </svg>
);
