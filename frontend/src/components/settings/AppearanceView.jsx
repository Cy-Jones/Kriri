import { useState, useEffect, useRef } from "react";
import {
  Palette,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Check,
  Pipette,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { playUiSound } from "../../lib/sound";
import {
  ACCENT_PRESETS,
  getPreferences,
  applyPreferencesToDom,
  getColorNameFromHex,
  getLuminance,
  isColorDark,
} from "../../lib/userPreferences";
import { api } from "../../lib/api";

const QUICK_PALETTE = [
  "#5e6ad2", // Linear Indigo
  "#3b82f6", // Electric Blue
  "#10b981", // Emerald
  "#8b5cf6", // Royal Violet
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#ec4899", // Hot Pink
  "#eab308", // Gold
  "#71717a", // Zinc
  "#ffffff", // White
];

export default function AppearanceView() {
  const {
    theme,
    effectiveTheme,
    onThemeChange,
    darkFlavor,
    setDarkFlavor,
    lightFlavor,
    setLightFlavor,
    saveCustomTheme,
  } = useTheme();

  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("kriri-accent-color") || "indigo"
  );
  const [customAccentHex, setCustomAccentHex] = useState(
    () => localStorage.getItem("kriri-custom-accent-hex") || "#5e6ad2"
  );
  const [customThemeBg, setCustomThemeBg] = useState(
    () => localStorage.getItem("kriri-custom-theme-bg") || "#191a22"
  );
  const [density, setDensity] = useState(
    () => localStorage.getItem("kriri-density") || "comfortable"
  );
  const [customSidebarEnabled, setCustomSidebarEnabled] = useState(
    () => Boolean(localStorage.getItem("kriri-custom-sidebar-color"))
  );
  const [customSidebarColor, setCustomSidebarColor] = useState(
    () => localStorage.getItem("kriri-custom-sidebar-color") || "#121316"
  );

  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tempCustomHex, setTempCustomHex] = useState(customAccentHex);
  const [isCustomBgPickerOpen, setIsCustomBgPickerOpen] = useState(false);
  const [tempBgHex, setTempBgHex] = useState(customThemeBg);

  const accentMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accentMenuRef.current && !accentMenuRef.current.contains(e.target)) {
        setIsAccentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const syncAppearanceToDb = (patch) => {
    api.patch("/user/preferences", patch).catch(() => {});
  };

  const handleSelectAccent = (presetId) => {
    setAccentColor(presetId);
    localStorage.setItem("kriri-accent-color", presetId);
    setIsAccentMenuOpen(false);
    applyPreferencesToDom();
    playUiSound("toggle");
    syncAppearanceToDb({ accent_color: presetId });
    if (typeof saveCustomTheme === "function") {
      saveCustomTheme({ accentColor: presetId });
    }
  };

  const handleApplyCustomAccent = (hex) => {
    let cleanHex = hex.trim();
    if (!cleanHex.startsWith("#")) cleanHex = `#${cleanHex}`;
    setCustomAccentHex(cleanHex);
    setAccentColor("custom");
    localStorage.setItem("kriri-accent-color", "custom");
    localStorage.setItem("kriri-custom-accent-hex", cleanHex);
    applyPreferencesToDom();
    playUiSound("success");
    syncAppearanceToDb({ accent_color: "custom", custom_accent_hex: cleanHex });
    if (typeof saveCustomTheme === "function") {
      saveCustomTheme({ accentColor: "custom", customAccentHex: cleanHex });
    }
  };

  const handleApplyCustomBg = (hex) => {
    let cleanHex = hex.trim();
    if (!cleanHex.startsWith("#")) cleanHex = `#${cleanHex}`;
    setCustomThemeBg(cleanHex);
    localStorage.setItem("kriri-custom-theme-bg", cleanHex);
    if (theme === "custom") {
      onThemeChange("custom", "eclipse");
    }
    applyPreferencesToDom();
    playUiSound("success");
    syncAppearanceToDb({ custom_theme_bg: cleanHex });
    if (typeof saveCustomTheme === "function") {
      saveCustomTheme({ customBg: cleanHex });
    }
  };

  const handleResetCustomColors = () => {
    const defaultBg = "#191a22";
    const defaultAccent = "#5e6ad2";
    setCustomThemeBg(defaultBg);
    setCustomAccentHex(defaultAccent);
    setTempBgHex(defaultBg);
    setTempCustomHex(defaultAccent);
    localStorage.setItem("kriri-custom-theme-bg", defaultBg);
    localStorage.setItem("kriri-custom-accent-hex", defaultAccent);
    applyPreferencesToDom();
    playUiSound("toggle");
    syncAppearanceToDb({ custom_theme_bg: defaultBg, custom_accent_hex: defaultAccent });
    if (typeof saveCustomTheme === "function") {
      saveCustomTheme({ customBg: defaultBg, customAccentHex: defaultAccent });
    }
  };

  // WCAG Contrast check
  const activeBgHex = theme === "custom" ? customThemeBg : effectiveTheme === "dark" ? "#131416" : "#ffffff";
  const activeAccent = accentColor === "custom" ? customAccentHex : (ACCENT_PRESETS.find(p => p.id === accentColor)?.hex || "#5e6ad2");
  const bgLum = getLuminance(activeBgHex);
  const accentLum = getLuminance(activeAccent);
  const contrastRatio = (Math.max(bgLum, accentLum) + 0.05) / (Math.min(bgLum, accentLum) + 0.05);
  const isAccessible = contrastRatio >= 3.0; // UI Components & large text standard

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Appearance & Themes
        </h1>
        <p className="text-[13px] text-text-muted mt-1">
          Customize KRIRI's visual aesthetics, theme modes, dark/light flavors, accent tint, and display density.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: THEME MODE SELECTION                                           */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Interface Theme
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Select an explicit mode or synchronize with your operating system appearance.
          </p>
        </div>

        {/* 4 Core Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Card 1: System */}
          <div
            onClick={(e) => onThemeChange("system", "eclipse", e.currentTarget)}
            className={`relative rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 group ${
              theme === "system"
                ? "border-[var(--accent,#5e6ad2)] bg-surface ring-2 ring-[var(--accent,#5e6ad2)]/25 shadow-xs"
                : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
            }`}
          >
            <div className="w-full h-22 rounded-xl border border-border overflow-hidden relative flex shadow-2xs">
              <div className="w-1/2 h-full bg-[#f8fafc] border-r border-slate-200 p-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="w-6 h-1.5 bg-slate-300 rounded-full" />
                  <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>
                <div className="w-full h-6 bg-white rounded border border-slate-200 p-1 space-y-1 shadow-2xs">
                  <div className="w-8 h-1 bg-slate-300 rounded" />
                </div>
              </div>
              <div className="w-1/2 h-full bg-[#18181b] p-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="w-6 h-1.5 bg-zinc-700 rounded-full" />
                  <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                </div>
                <div className="w-full h-6 bg-[#27272a] rounded border border-zinc-700/50 p-1 space-y-1 shadow-2xs">
                  <div className="w-8 h-1 bg-zinc-600 rounded" />
                </div>
              </div>
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs">
                AUTO
              </div>
            </div>

            <div className="flex items-start justify-between gap-1.5">
              <div>
                <div className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                  <Monitor size={14} className="text-text-muted" />
                  <span>System</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Syncs with your OS
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === "system"
                    ? "border-[var(--accent,#5e6ad2)] bg-[var(--accent,#5e6ad2)] text-white"
                    : "border-border"
                }`}
              >
                {theme === "system" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </div>

          {/* Card 2: Dark Mode */}
          <div
            onClick={(e) => onThemeChange("dark", "eclipse", e.currentTarget)}
            className={`relative rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 group ${
              theme === "dark"
                ? "border-[var(--accent,#5e6ad2)] bg-surface ring-2 ring-[var(--accent,#5e6ad2)]/25 shadow-xs"
                : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
            }`}
          >
            <div className="w-full h-22 rounded-xl border border-border bg-[#18181b] p-2 flex flex-col justify-between shadow-2xs relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent,#5e6ad2)]" />
                  <div className="w-8 h-1.5 bg-zinc-700 rounded-full" />
                </div>
                <div className="w-3 h-1 bg-zinc-800 rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="w-14 h-1 bg-zinc-700 rounded-full" />
                <div className="w-full h-6 bg-[#27272a] rounded border border-zinc-700/50 p-1 space-y-1 shadow-2xs">
                  <div className="w-10 h-1 bg-zinc-600 rounded" />
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-1.5">
              <div>
                <div className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                  <Moon size={14} className="text-text-muted" />
                  <span>Dark Mode</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Deep monochromatic
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === "dark"
                    ? "border-[var(--accent,#5e6ad2)] bg-[var(--accent,#5e6ad2)] text-white"
                    : "border-border"
                }`}
              >
                {theme === "dark" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </div>

          {/* Card 3: Light Mode */}
          <div
            onClick={(e) => onThemeChange("light", "eclipse", e.currentTarget)}
            className={`relative rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 group ${
              theme === "light"
                ? "border-[var(--accent,#5e6ad2)] bg-surface ring-2 ring-[var(--accent,#5e6ad2)]/25 shadow-xs"
                : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
            }`}
          >
            <div className="w-full h-22 rounded-xl border border-border bg-[#f8fafc] p-2 flex flex-col justify-between shadow-2xs relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent,#5e6ad2)]" />
                  <div className="w-8 h-1.5 bg-slate-300 rounded-full" />
                </div>
                <div className="w-3 h-1 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="w-14 h-1 bg-slate-300 rounded-full" />
                <div className="w-full h-6 bg-white rounded border border-slate-200 p-1 space-y-1 shadow-2xs">
                  <div className="w-10 h-1 bg-slate-400 rounded" />
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-1.5">
              <div>
                <div className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                  <Sun size={14} className="text-text-muted" />
                  <span>Light Mode</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Clean high-contrast
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === "light"
                    ? "border-[var(--accent,#5e6ad2)] bg-[var(--accent,#5e6ad2)] text-white"
                    : "border-border"
                }`}
              >
                {theme === "light" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </div>

          {/* Card 4: Custom Mode */}
          <div
            onClick={(e) => onThemeChange("custom", "eclipse", e.currentTarget)}
            className={`relative rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 group ${
              theme === "custom"
                ? "border-[var(--accent,#5e6ad2)] bg-surface ring-2 ring-[var(--accent,#5e6ad2)]/25 shadow-xs"
                : "border-border bg-surface hover:border-black/20 dark:hover:border-white/20"
            }`}
          >
            <div
              className="w-full h-22 rounded-xl border border-border p-2 flex flex-col justify-between shadow-2xs relative overflow-hidden"
              style={{ backgroundColor: customThemeBg }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: customAccentHex }} />
                  <div className="w-8 h-1.5 bg-white/30 rounded-full" />
                </div>
                <div className="w-3 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="w-14 h-1 bg-white/30 rounded-full" />
                <div className="w-full h-6 rounded border border-white/20 p-1 space-y-1 shadow-2xs" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-1 bg-white/50 rounded" />
                </div>
              </div>
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs">
                CUSTOM
              </div>
            </div>

            <div className="flex items-start justify-between gap-1.5">
              <div>
                <div className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-text-muted" />
                  <span>Custom Theme</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                  {customThemeBg.toUpperCase()}
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === "custom"
                    ? "border-[var(--accent,#5e6ad2)] bg-[var(--accent,#5e6ad2)] text-white"
                    : "border-border"
                }`}
              >
                {theme === "custom" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: CUSTOM COLOR CONTROLS (Active in Custom Mode)                   */}
      {/* ========================================================================= */}
      {theme === "custom" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground px-0.5 flex items-center gap-2">
              <Sparkles size={15} className="text-[var(--accent)]" />
              <span>Custom Theme Palette Engine</span>
            </h3>
            <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
              Specify your primary canvas background HEX. Semantic tokens will generate automatically.
            </p>
          </div>

          <div className="border border-border rounded-2xl p-5 sm:p-6 bg-surface shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-[13.5px] font-medium text-foreground">
                  Custom Canvas Background
                </label>
                <p className="text-[12px] text-text-muted">
                  The primary background tone of the application window.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <span
                    className="w-5 h-5 rounded-md border border-border shadow-2xs absolute left-2 pointer-events-none"
                    style={{ backgroundColor: customThemeBg }}
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={tempBgHex}
                    onChange={(e) => setTempBgHex(e.target.value)}
                    onBlur={() => handleApplyCustomBg(tempBgHex)}
                    placeholder="#191a22"
                    className="h-9 pl-9 pr-3 w-32 rounded-lg border border-border bg-surface-hover text-foreground font-mono text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <input
                  type="color"
                  value={customThemeBg.length === 7 ? customThemeBg : "#191a22"}
                  onChange={(e) => {
                    setTempBgHex(e.target.value);
                    handleApplyCustomBg(e.target.value);
                  }}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-surface p-1"
                  title="Pick background color"
                />
                <button
                  type="button"
                  onClick={handleResetCustomColors}
                  className="h-9 px-3 rounded-lg border border-border bg-surface-hover hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-foreground text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Quick Canvas Presets */}
            <div>
              <div className="text-[11.5px] font-medium text-text-muted mb-2">
                Curated Canvas Swatches
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[
                  { name: "Deep Charcoal", hex: "#121316" },
                  { name: "Midnight Navy", hex: "#0b0f19" },
                  { name: "Nordic Slate", hex: "#191a22" },
                  { name: "Onyx Black", hex: "#000000" },
                  { name: "Warm Espresso", hex: "#171412" },
                  { name: "Dark Emerald", hex: "#0a1714" },
                  { name: "Amethyst Dark", hex: "#160f1f" },
                  { name: "Pure Sand", hex: "#fcfaf7" },
                ].map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => {
                      setTempBgHex(swatch.hex);
                      handleApplyCustomBg(swatch.hex);
                    }}
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center p-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer relative ${
                      customThemeBg.toLowerCase() === swatch.hex.toLowerCase()
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                  >
                    {customThemeBg.toLowerCase() === swatch.hex.toLowerCase() && (
                      <Check size={14} className={isColorDark(swatch.hex) ? "text-white" : "text-black"} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ACCENT COLOR SELECTION                                         */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Accent Color & Tint
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Select the highlight color applied to primary action buttons, active navigation, and focus rings.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-5 sm:p-6 bg-surface shadow-xs space-y-5">
          {/* Swatches Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectAccent(preset.id)}
                className={`h-11 rounded-xl border flex items-center justify-between px-3 transition-transform hover:scale-102 active:scale-98 cursor-pointer relative ${
                  accentColor === preset.id
                    ? "border-[var(--accent,#5e6ad2)] ring-2 ring-[var(--accent,#5e6ad2)]/25 bg-surface-hover"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-[12px] font-medium text-foreground truncate">
                    {preset.name.split(" ")[0]}
                  </span>
                </div>
                {accentColor === preset.id && (
                  <Check size={13} className="text-foreground shrink-0" />
                )}
              </button>
            ))}

            {/* Custom Accent Swatch */}
            <button
              type="button"
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              className={`h-11 rounded-xl border flex items-center justify-between px-3 transition-transform hover:scale-102 active:scale-98 cursor-pointer relative ${
                accentColor === "custom"
                  ? "border-[var(--accent,#5e6ad2)] ring-2 ring-[var(--accent,#5e6ad2)]/25 bg-surface-hover"
                  : "border-border bg-surface hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: customAccentHex }}
                />
                <span className="text-[12px] font-medium text-foreground">
                  Custom
                </span>
              </div>
              <Pipette size={13} className="text-text-muted" />
            </button>
          </div>

          {/* Dedicated Custom Color Dropdown Picker */}
          {isColorPickerOpen && (
            <div className="p-4 rounded-xl border border-border bg-surface-hover/50 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground">
                    Custom Accent Tint
                  </h4>
                  <p className="text-[11.5px] text-text-muted">
                    Pick any HEX code. Contrasts are automatically calculated.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium border border-border text-foreground bg-surface">
                    {customAccentHex.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium flex items-center gap-1 ${
                    isAccessible ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {isAccessible ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                    {contrastRatio.toFixed(1)}:1 {isAccessible ? "WCAG AA" : "Low Contrast"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={7}
                    value={tempCustomHex}
                    onChange={(e) => setTempCustomHex(e.target.value)}
                    onBlur={() => handleApplyCustomAccent(tempCustomHex)}
                    className="h-9 px-3 w-full rounded-lg border border-border bg-surface text-foreground font-mono text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="#5e6ad2"
                  />
                </div>
                <input
                  type="color"
                  value={customAccentHex.length === 7 ? customAccentHex : "#5e6ad2"}
                  onChange={(e) => {
                    setTempCustomHex(e.target.value);
                    handleApplyCustomAccent(e.target.value);
                  }}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-surface p-1 shrink-0"
                />
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-1">
                {QUICK_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setTempCustomHex(hex);
                      handleApplyCustomAccent(hex);
                    }}
                    className={`h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer relative ${
                      customAccentHex.toLowerCase() === hex.toLowerCase()
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {customAccentHex.toLowerCase() === hex.toLowerCase() && (
                      <Check size={11} className={isColorDark(hex) ? "text-white" : "text-black"} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: THEME FLAVORS & DENSITY                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Display Flavors & Density
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Fine-tune surface contrast flavors and vertical interface density.
          </p>
        </div>

        <div className="border border-border rounded-2xl bg-surface divide-y divide-border-subtle overflow-hidden shadow-xs transition-colors">
          {/* Dark Flavor (when in dark mode) */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Dark Theme Flavor
              </h4>
              <p className="text-[12px] text-text-muted">
                Choose the background undertone used during dark mode operation.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => setDarkFlavor("default")}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  darkFlavor === "default"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Default Slate
              </button>
              <button
                type="button"
                onClick={() => setDarkFlavor("midnight")}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  darkFlavor === "midnight"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Midnight Navy
              </button>
              <button
                type="button"
                onClick={() => setDarkFlavor("pure-black")}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  darkFlavor === "pure-black"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Pure Black (#000000)
              </button>
            </div>
          </div>

          {/* Interface Density */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[13.5px] font-medium text-foreground">
                Interface Density
              </h4>
              <p className="text-[12px] text-text-muted">
                Comfortable padding for standard displays or compact spacing for data-heavy boards.
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-border shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDensity("comfortable");
                  localStorage.setItem("kriri-density", "comfortable");
                  applyPreferencesToDom();
                  playUiSound("toggle");
                  syncAppearanceToDb({ density: "comfortable" });
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  density === "comfortable"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => {
                  setDensity("compact");
                  localStorage.setItem("kriri-density", "compact");
                  applyPreferencesToDom();
                  playUiSound("toggle");
                  syncAppearanceToDb({ density: "compact" });
                }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  density === "compact"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Compact (High Density)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: LIVE THEME PREVIEW                                             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground px-0.5">
            Live Component Preview
          </h3>
          <p className="text-[12.5px] text-text-muted px-0.5 mt-0.5">
            Real-time rendering of your active surface tokens, buttons, inputs, and indicators.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-surface shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg kriri-primary-btn text-[12.5px] font-medium"
            >
              Primary Action
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"
            >
              Secondary Action
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-text-muted hover:text-foreground text-[12.5px] font-medium"
            >
              Ghost Action
            </button>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              Active Status
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              readOnly
              value="Interactive input preview"
              className="h-9 px-3.5 w-full sm:w-72 rounded-lg border border-border bg-surface-hover text-foreground text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <div className="flex items-center gap-2 text-[12px] text-text-muted">
              <span>Canvas Luminance: {(bgLum * 100).toFixed(1)}%</span>
              <span>·</span>
              <span>Accent Luminance: {(accentLum * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
