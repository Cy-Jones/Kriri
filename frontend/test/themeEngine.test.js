import { describe, it } from "node:test";
import assert from "node:assert";
import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastRatio,
  isColorDark,
  getAccessibleTextColor,
  generateThemePalette,
} from "../src/lib/themeEngine.js";

describe("KRIRI Theme Engine Unit Tests", () => {
  it("normalizes hex strings correctly", () => {
    assert.strictEqual(normalizeHex("#fff"), "#ffffff");
    assert.strictEqual(normalizeHex("#000"), "#000000");
    assert.strictEqual(normalizeHex("#838181"), "#838181");
    assert.strictEqual(normalizeHex("838181"), "#838181");
    assert.strictEqual(normalizeHex("#12345678"), "#123456");
  });

  it("converts hex to RGB and back", () => {
    const rgb = hexToRgb("#838181");
    assert.strictEqual(rgb.r, 131);
    assert.strictEqual(rgb.g, 129);
    assert.strictEqual(rgb.b, 129);
    assert.strictEqual(rgbToHex(rgb.r, rgb.g, rgb.b), "#838181");
  });

  it("computes accurate WCAG relative luminance", () => {
    assert.strictEqual(getLuminance("#000000"), 0);
    assert.strictEqual(Math.round(getLuminance("#ffffff") * 100) / 100, 1);
    // Mid-tone #838181 has luminance around 0.22
    const lum = getLuminance("#838181");
    assert.ok(lum > 0.20 && lum < 0.25, `Expected ~0.22, got ${lum}`);
  });

  it("computes accurate contrast ratios", () => {
    const blackWhiteContrast = getContrastRatio("#ffffff", "#000000");
    assert.strictEqual(Math.round(blackWhiteContrast * 10) / 10, 21);

    const sameContrast = getContrastRatio("#838181", "#838181");
    assert.strictEqual(sameContrast, 1);
  });

  it("selects accessible foreground satisfying WCAG AA (>= 4.5:1)", () => {
    const testCases = [
      "#000000",
      "#ffffff",
      "#838181",
      "#808080",
      "#1e3a8a",
      "#7c3aed",
      "#16a34a",
      "#f59e0b",
      "#e5e7eb",
      "#0f172a",
    ];

    for (const bg of testCases) {
      const fg = getAccessibleTextColor(bg);
      const ratio = getContrastRatio(fg, bg);
      assert.ok(
        ratio >= 4.5,
        `Contrast for ${fg} on ${bg} must be >= 4.5:1, got ${ratio.toFixed(2)}:1`
      );
    }
  });

  it("generates all required semantic tokens for default Dark theme", () => {
    const palette = generateThemePalette({ themeMode: "dark" });
    assert.strictEqual(palette.colorScheme, "dark");
    assert.strictEqual(palette.tokens["--background"], "#08090a");
    assert.strictEqual(palette.tokens["--sidebar-bg"], "#0a0a0a");
    assert.ok(palette.tokens["--surface"]);
    assert.ok(palette.tokens["--surface-muted"]);
    assert.ok(palette.tokens["--surface-elevated"]);
    assert.ok(palette.tokens["--surface-floating"]);
    assert.ok(palette.tokens["--status-todo"]);
    assert.ok(palette.tokens["--priority-high"]);
  });

  it("generates all required semantic tokens for default Light theme", () => {
    const palette = generateThemePalette({ themeMode: "light" });
    assert.strictEqual(palette.colorScheme, "light");
    assert.strictEqual(palette.tokens["--foreground"], "#09090b");
    assert.ok(palette.tokens["--surface"]);
    assert.ok(palette.tokens["--surface-muted"]);
    assert.ok(palette.tokens["--surface-elevated"]);
    assert.ok(palette.tokens["--surface-floating"]);
    assert.ok(palette.tokens["--sidebar"]);
  });

  it("passes the 12-theme test matrix with WCAG AA compliance across all surfaces", () => {
    const matrix = [
      { name: "Pure Black", bg: "#000000" },
      { name: "Pure White", bg: "#FFFFFF" },
      { name: "Mid Gray 83", bg: "#838181" },
      { name: "Mid Gray 80", bg: "#808080" },
      { name: "Deep Navy", bg: "#1E3A8A" },
      { name: "Vibrant Violet", bg: "#7C3AED" },
      { name: "Forest Green", bg: "#16A34A" },
      { name: "Warm Amber", bg: "#F59E0B" },
      { name: "Cool Light Gray", bg: "#E5E7EB" },
      { name: "Slate Pitch", bg: "#0F172A" },
      { name: "Standard Dark", mode: "dark" },
      { name: "Standard Light", mode: "light" },
    ];

    for (const test of matrix) {
      const palette = generateThemePalette(
        test.mode
          ? { themeMode: test.mode }
          : { themeMode: "custom", bg: test.bg, contrast: 40 }
      );

      const tokens = palette.tokens;
      const bg = tokens["--background"];
      const surface = tokens["--surface"];
      const surfaceElevated = tokens["--surface-elevated"];
      const fg = tokens["--foreground"];

      const bgContrast = getContrastRatio(fg, bg);
      const surfaceContrast = getContrastRatio(fg, surface);
      const elevatedContrast = getContrastRatio(fg, surfaceElevated);

      assert.ok(
        surfaceContrast >= 4.5,
        `[${test.name}] Foreground ${fg} on surface ${surface} failed WCAG AA: ${surfaceContrast.toFixed(2)}:1`
      );

      // Verify sidebar isolation: sidebar foreground on sidebar background >= 4.5:1
      const sBg = tokens["--sidebar-bg"];
      const sFg = tokens["--sidebar-foreground"];
      const sContrast = getContrastRatio(sFg, sBg);
      assert.ok(
        sContrast >= 4.5,
        `[${test.name}] Sidebar text ${sFg} on sidebar ${sBg} failed WCAG AA: ${sContrast.toFixed(2)}:1`
      );
    }
  });
});
