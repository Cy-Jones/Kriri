import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  isAppRoute,
  isPublicThemeRoute,
  getUserThemeKey,
  getUserThemeSettings,
  saveUserThemeSettings,
  clearActiveThemeStorage,
} from "../src/lib/userTheme.js";

// Minimal localStorage mock for Node.js test environment
const store = new Map();
globalThis.window = {
  location: { pathname: "/" },
  localStorage: {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  },
};

describe("User-Scoped Theme & Route Isolation Tests", () => {
  beforeEach(() => {
    store.clear();
  });

  it("excludes /onboarding and public routes from isAppRoute", () => {
    assert.strictEqual(isAppRoute("/onboarding"), false, "/onboarding must not be an app route");
    assert.strictEqual(isAppRoute("/onboarding/step-2"), false, "/onboarding sub-paths must not be app routes");
    assert.strictEqual(isAppRoute("/"), false, "/ must not be an app route");
    assert.strictEqual(isAppRoute("/login"), false, "/login must not be an app route");
    assert.strictEqual(isAppRoute("/register"), false, "/register must not be an app route");
    assert.strictEqual(isAppRoute("/pricing"), false, "/pricing must not be an app route");

    assert.strictEqual(isPublicThemeRoute("/onboarding"), true, "/onboarding must follow public landing theme rules");
    assert.strictEqual(isPublicThemeRoute("/login"), true, "/login must follow public landing theme rules");
  });

  it("identifies application routes for dynamic theming", () => {
    assert.strictEqual(isAppRoute("/dashboard"), true);
    assert.strictEqual(isAppRoute("/tasks"), true);
    assert.strictEqual(isAppRoute("/settings"), true);
    assert.strictEqual(isAppRoute("/projects/proj_123"), true);
    assert.strictEqual(isAppRoute("/analytics"), true);
    assert.strictEqual(isAppRoute("/team"), true);
    assert.strictEqual(isAppRoute("/inbox"), true);
    assert.strictEqual(isAppRoute("/agent"), true);
  });

  it("scopes theme settings per user ID", () => {
    const userA = "user_abc123";
    const userB = "user_xyz789";

    assert.strictEqual(getUserThemeKey(userA), `kriri-user-theme-${userA}`);

    // Save customized theme for user A
    saveUserThemeSettings(userA, {
      theme: "custom",
      darkFlavor: "midnight",
      customBg: "#221133",
      customAccent: "#9900ff",
    });

    const savedA = getUserThemeSettings(userA);
    assert.strictEqual(savedA.hasCustomized, true);
    assert.strictEqual(savedA.theme, "custom");
    assert.strictEqual(savedA.darkFlavor, "midnight");
    assert.strictEqual(savedA.customBg, "#221133");

    // User B has not customized: returns null
    const savedB = getUserThemeSettings(userB);
    assert.strictEqual(savedB, null);
  });

  it("clears active theme storage on logout and resets arc-theme to system", () => {
    window.localStorage.setItem("arc-theme", "custom");
    window.localStorage.setItem("kriri-dark-flavor", "pure-black");
    window.localStorage.setItem("kriri-custom-theme-bg", "#221133");
    window.localStorage.setItem("kriri-custom-theme-accent", "#ff0099");

    clearActiveThemeStorage();

    assert.strictEqual(window.localStorage.getItem("arc-theme"), "system");
    assert.strictEqual(window.localStorage.getItem("kriri-dark-flavor"), null);
    assert.strictEqual(window.localStorage.getItem("kriri-custom-theme-bg"), null);
    assert.strictEqual(window.localStorage.getItem("kriri-custom-theme-accent"), null);
  });
});
