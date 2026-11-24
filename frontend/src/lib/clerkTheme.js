import { dark } from "@clerk/themes";
import { generateThemePalette } from "./themeEngine";

const PRESET_ACCENTS = {
  indigo: "#5e6ad2",
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  zinc: "#71717a",
};

export function getActiveAccentHex() {
  if (typeof window === "undefined") return "#5e6ad2";
  const stored = localStorage.getItem("kriri-accent-color") || "indigo";
  if (stored.startsWith("#")) return stored;
  if (stored === "custom") {
    return localStorage.getItem("kriri-custom-accent-hex") || "#5e6ad2";
  }
  return PRESET_ACCENTS[stored] || "#5e6ad2";
}

/**
 * Generates dynamic Clerk appearance configuration synchronized with KRIRI's theme.
 * Seamlessly supports Default Light, Default Dark, and all Custom themes.
 */
export function getClerkAppearance({ theme, effectiveTheme, darkFlavor, lightFlavor, accentColor }) {
  const isCustom = theme === "custom";
  const customBg =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-custom-theme-bg") || "#191a22"
      : "#191a22";
  const customAccent =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-custom-theme-accent") || "#5e6ad2"
      : "#5e6ad2";
  const customContrast =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("kriri-custom-theme-contrast") || "30")
      : 30;
  const sidebarEnabled =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-custom-sidebar-enabled") === "true"
      : false;
  const sidebarBg =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-custom-sidebar-bg") || "#121214"
      : "#121214";
  const sidebarAccent =
    typeof window !== "undefined"
      ? localStorage.getItem("kriri-custom-sidebar-accent") || customAccent
      : customAccent;
  const sidebarContrast =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("kriri-custom-sidebar-contrast") || "30")
      : 30;

  const currentDarkFlavor =
    darkFlavor ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-dark-flavor") : null) ||
    "default";
  const currentLightFlavor =
    lightFlavor ||
    (typeof window !== "undefined" ? localStorage.getItem("kriri-light-flavor") : null) ||
    "shaded";

  const resolvedAccent = accentColor && accentColor.startsWith("#")
    ? accentColor
    : (PRESET_ACCENTS[accentColor] || getActiveAccentHex());

  const palette = generateThemePalette(
    isCustom
      ? {
          themeMode: "custom",
          bg: customBg,
          accent: customAccent,
          contrast: customContrast,
          sidebarEnabled,
          sidebarBg,
          sidebarAccent,
          sidebarContrast,
        }
      : {
          themeMode: effectiveTheme === "light" ? "light" : "dark",
          darkFlavor: currentDarkFlavor,
          lightFlavor: currentLightFlavor,
          accent: resolvedAccent,
        }
  );

  const { tokens, colorScheme } = palette;
  const isDark = colorScheme === "dark";

  const popoverBg = tokens["--popover"] || (isDark ? "#1e1f21" : "#ffffff");
  const popoverFg = tokens["--popover-foreground"] || (isDark ? "#f4f4f5" : "#09090b");
  const popoverMuted = tokens["--muted-foreground"] || (isDark ? "#8a8f98" : "#71717a");
  const popoverBorder = tokens["--border"] || (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)");
  const popoverHover = tokens["--surface-hover"] || (isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)");
  const surfaceBg = tokens["--surface"] || (isDark ? "#131416" : "#ffffff");
  const primaryBg = resolvedAccent || tokens["--primary"] || tokens["--kriri-accent"] || "#5e6ad2";
  const primaryFg = tokens["--primary-foreground"] || "#ffffff";
  const sidebarFg = tokens["--sidebar-foreground"] || (isDark ? "#f4f4f5" : "#09090b");

  return {
    baseTheme: isDark ? dark : undefined,
    variables: {
      colorPrimary: primaryBg,
      colorBackground: popoverBg,
      colorInputBackground: tokens["--input"] || tokens["--surface-muted"] || (isDark ? "#1c1d21" : "#f4f4f5"),
      colorInputText: popoverFg,
      colorText: popoverFg,
      colorTextSecondary: popoverMuted,
      fontFamily: '"Plus Jakarta Sans", "Plus Jakarta Sans Variable", sans-serif',
      borderRadius: "1rem",
    },
    elements: {
      modalContent: {
        backgroundColor: popoverBg,
        color: popoverFg,
        borderRadius: "1.25rem",
        border: `1px solid ${popoverBorder}`,
        overflow: "hidden",
      },
      card: {
        backgroundColor: popoverBg,
        color: popoverFg,
        border: `1px solid ${popoverBorder}`,
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 24px 60px -12px rgba(0, 0, 0, 0.7), 0 2px 4px -1px rgba(0, 0, 0, 0.4)"
          : "0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
      organizationProfileRoot: {
        backgroundColor: "transparent",
        borderRadius: "1rem",
        overflow: "hidden",
      },
      createOrganizationRoot: {
        backgroundColor: popoverBg,
        borderRadius: "1.25rem",
        overflow: "hidden",
      },
      userProfileRoot: {
        backgroundColor: "transparent",
        borderRadius: "1rem",
        overflow: "hidden",
      },
      organizationSwitcherPopoverCard: {
        backgroundColor: popoverBg,
        color: popoverFg,
        border: `1px solid ${popoverBorder}`,
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 20px 40px -8px rgba(0, 0, 0, 0.6)"
          : "0 16px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
      },
      userButtonPopoverCard: {
        backgroundColor: popoverBg,
        color: popoverFg,
        border: `1px solid ${popoverBorder}`,
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 20px 40px -8px rgba(0, 0, 0, 0.6)"
          : "0 16px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
      },
      organizationPreviewMainIdentifier: {
        color: `${popoverFg} !important`,
        fontWeight: "500",
      },
      organizationPreviewSecondaryIdentifier: {
        color: `${popoverMuted} !important`,
      },
      userPreviewMainIdentifier: {
        color: `${popoverFg} !important`,
        fontWeight: "500",
      },
      userPreviewSecondaryIdentifier: {
        color: `${popoverMuted} !important`,
      },
      organizationSwitcherPopoverActions: {
        borderTop: `1px solid ${popoverBorder}`,
      },
      organizationSwitcherPopoverActionButton: {
        color: popoverFg,
        "&:hover": {
          backgroundColor: popoverHover,
        },
      },
      organizationSwitcherPopoverActionButtonText: {
        color: popoverFg,
      },
      organizationSwitcherPreviewButton: {
        color: popoverFg,
        "&:hover": {
          backgroundColor: popoverHover,
        },
      },
      organizationSwitcherPopoverFooter: {
        backgroundColor: tokens["--surface-muted"] || (isDark ? "rgba(255, 255, 255, 0.03)" : "#fafafa"),
        borderTop: `1px solid ${popoverBorder}`,
      },
      formButtonPrimary: {
        backgroundColor: `${primaryBg} !important`,
        color: `${primaryFg} !important`,
        "&:hover": {
          backgroundColor: `${primaryBg} !important`,
          opacity: "0.92",
        },
      },
      membersPageInviteButton: {
        backgroundColor: `${primaryBg} !important`,
        color: `${primaryFg} !important`,
        "&:hover": {
          backgroundColor: `${primaryBg} !important`,
          opacity: "0.92",
        },
      },
      profileSectionPrimaryButton: {
        "&[data-color='primary']": {
          color: `${primaryBg} !important`,
          backgroundColor: "transparent !important",
        },
      },
      profileSectionAction__profile: {
        color: `${primaryBg} !important`,
      },
      profileSectionAction: {
        color: `${primaryBg} !important`,
      },
      badge: {
        "&[data-color='primary']": {
          backgroundColor: `${primaryBg} !important`,
          color: "#ffffff !important",
        },
      },
      navbar: {
        backgroundColor: "transparent",
        borderRight: "none",
      },
      organizationSwitcherTrigger: {
        color: sidebarFg,
        "&:hover": {
          backgroundColor: "var(--sidebar-hover, rgba(255, 255, 255, 0.06))",
        },
      },
    },
  };
}

/**
 * Dedicated appearance for Clerk's pre-built SignIn and SignUp components.
 * Enforces high-contrast, dark mode styling matching Kriri's aesthetic.
 */
export function getAuthPageAppearance() {
  return {
    baseTheme: dark,
    variables: {
      colorPrimary: "#ffffff",
      colorBackground: "#0d0e11",
      colorInputBackground: "#16171b",
      colorInputText: "#ffffff",
      colorText: "#ffffff",
      colorTextSecondary: "#a1a1aa",
      colorTextOnPrimaryBackground: "#000000",
      fontFamily: '"Plus Jakarta Sans", "Plus Jakarta Sans Variable", -apple-system, BlinkMacSystemFont, sans-serif',
      borderRadius: "0.875rem",
    },
    elements: {
      rootBox: {
        width: "100%",
        maxWidth: "420px",
      },
      card: {
        backgroundColor: "#0d0e11",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 2px 4px -1px rgba(0, 0, 0, 0.5)",
      },
      formButtonPrimary: {
        backgroundColor: "#ffffff",
        color: "#000000",
        fontWeight: "500",
        borderRadius: "9999px",
        "&:hover": {
          backgroundColor: "#f4f4f5",
        },
      },
      socialButtonsBlockButton: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "9999px",
        color: "#f4f4f5",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          borderColor: "rgba(255, 255, 255, 0.18)",
        },
      },
      formField: {
        width: "100%",
        marginBottom: "0.75rem",
      },
      formFieldRow: {
        width: "100%",
      },
      formFieldLabel: {
        color: "#d4d4d8",
        fontSize: "0.8125rem",
        fontWeight: "500",
        marginBottom: "0.25rem",
      },
      formFieldInput: {
        backgroundColor: "#16171b",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        color: "#ffffff",
        borderRadius: "0.75rem",
        "&:focus": {
          borderColor: "rgba(255, 255, 255, 0.4)",
        },
      },
      formFieldErrorText: {
        color: "#f87171",
        fontSize: "0.8125rem",
        marginTop: "0.375rem",
      },
      formFieldWarningText: {
        color: "#fbbf24",
        fontSize: "0.8125rem",
        marginTop: "0.375rem",
      },
      alert: {
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        borderRadius: "0.75rem",
        color: "#fca5a5",
        marginBottom: "1rem",
      },
      alertText: {
        color: "#fca5a5",
        fontSize: "0.8125rem",
      },
      identityPreviewText: {
        color: "#ffffff",
      },
      identityPreviewEditButton: {
        color: "#a1a1aa",
        "&:hover": {
          color: "#ffffff",
        },
      },
      footerActionLink: {
        color: "#ffffff",
        fontWeight: "500",
        "&:hover": {
          textDecoration: "underline",
        },
      },
      headerTitle: {
        color: "#ffffff",
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      },
      headerSubtitle: {
        color: "#a1a1aa",
      },
      dividerLine: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
      dividerText: {
        color: "#71717a",
      },
    },
  };
}

/**
 * Dedicated appearance for Clerk's pre-built PricingTable component.
 * Ensures multi-column layout responsiveness and Kriri dark mode styling.
 */
export function getPricingTableAppearance() {
  return {
    baseTheme: dark,
    variables: {
      colorPrimary: "#ffffff",
      colorBackground: "#0d0e11",
      colorInputBackground: "#16171b",
      colorInputText: "#ffffff",
      colorText: "#ffffff",
      colorTextSecondary: "#a1a1aa",
      colorTextOnPrimaryBackground: "#000000",
      fontFamily:
        '"Plus Jakarta Sans", "Plus Jakarta Sans Variable", -apple-system, BlinkMacSystemFont, sans-serif',
      borderRadius: "0.875rem",
    },
    elements: {
      rootBox: {
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
      },
      pricingTableCard: {
        backgroundColor: "#0d0e11",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
      },
    },
  };
}
