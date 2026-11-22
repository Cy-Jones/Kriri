import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/react";
import { useLocation } from "react-router-dom";

/**
 * ClerkSignUpEnhancer
 *
 * Augments Clerk's official prebuilt <SignUp /> component while keeping
 * Clerk's component, logic, security, and CSRF protection 100% in tact:
 * - Real-time username availability check (/api/auth/check-username)
 * - Error message & suggestion buttons injected right into Clerk's field row
 * - Form submission guard in capture phase to prevent duplicate usernames from poisoning Clerk's draft
 * - Automatically recovers Clerk's form if landing on continuation with empty fields
 */
export default function ClerkSignUpEnhancer({ containerRef, onResetClerk }) {
  const clerk = useClerk();
  const location = useLocation();

  const checkTimeoutRef = useRef(null);
  const isTakenRef = useRef(false);
  const currentCheckedNameRef = useRef("");
  const unTrappedRef = useRef(false);
  const lastRenderedStatusRef = useRef({ name: "", type: "" });

  // 1. Recover from stuck continuation state where username was already set but sign-up is incomplete
  useEffect(() => {
    if (!clerk.loaded || !clerk.client?.signUp) return;
    const signUp = clerk.client.signUp;

    const isContinueRoute = location.pathname.includes("/continue");
    if (isContinueRoute && signUp.status === "missing_requirements") {
      const existingUsername = signUp.username;
      if (existingUsername && (!signUp.missingFields || signUp.missingFields.length === 0)) {
        if (!unTrappedRef.current) {
          unTrappedRef.current = true;
          try {
            signUp.username = null;
            if (!signUp.missingFields) signUp.missingFields = [];
            if (!signUp.missingFields.includes("username")) {
              signUp.missingFields.push("username");
            }
            if (typeof onResetClerk === "function") {
              onResetClerk();
            }
          } catch (e) {
            console.warn("Clerk draft recovery warning:", e);
          }
        }
      }
    }
  }, [clerk.loaded, clerk.client?.signUp, location.pathname, onResetClerk]);

  // 2. Attach validation and submission guard to Clerk's prebuilt form elements
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    let cleanupListeners = null;

    const setupFormEnhancement = () => {
      const usernameInput = container.querySelector('input[name="username"], #username-field');
      const form = container.querySelector(".cl-form, form");

      if (!usernameInput || !form) return;

      // Avoid re-attaching if already attached to this specific input element
      if (usernameInput.dataset.kririAttached === "true") return;
      usernameInput.dataset.kririAttached = "true";

      const fieldContainer =
        usernameInput.closest(".cl-formField") ||
        usernameInput.closest(".cl-formFieldRow") ||
        usernameInput.parentElement;

      const setFeedback = (type, message, suggestions = []) => {
        // Prevent unnecessary DOM churn
        if (
          lastRenderedStatusRef.current.type === type &&
          lastRenderedStatusRef.current.name === message
        ) {
          return;
        }
        lastRenderedStatusRef.current = { type, name: message };

        let feedbackEl = container.querySelector("#kriri-clerk-username-feedback");
        if (!feedbackEl && fieldContainer) {
          feedbackEl = document.createElement("div");
          feedbackEl.id = "kriri-clerk-username-feedback";
          feedbackEl.className = "mt-1.5 space-y-1.5 transition-all";
          fieldContainer.appendChild(feedbackEl);
        }
        if (!feedbackEl) return;

        if (type === "taken") {
          isTakenRef.current = true;
          usernameInput.classList.add("!border-rose-500", "focus:!border-rose-500");
          usernameInput.classList.remove("!border-emerald-500");

          const suggestionsHtml = suggestions.length > 0
            ? `<div class="flex flex-wrap gap-1.5 mt-1">
                ${suggestions
                  .map(
                    (s) =>
                      `<button type="button" data-sug="${s}" class="kriri-sug-btn px-2.5 py-1 text-xs rounded-md bg-white/[0.08] hover:bg-white/[0.16] text-zinc-200 border border-white/10 font-mono transition-colors cursor-pointer select-none">@${s}</button>`
                  )
                  .join("")}
              </div>`
            : "";

          feedbackEl.innerHTML = `
            <p class="cl-formFieldErrorText text-[12px] text-rose-400 font-medium flex items-center gap-1.5 mt-1">
              <span>⚠ ${message || "That username is already taken. Try one of these:"}</span>
            </p>
            ${suggestionsHtml}
          `;

          const btns = feedbackEl.querySelectorAll(".kriri-sug-btn");
          btns.forEach((btn) => {
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const sug = btn.getAttribute("data-sug");
              if (sug) {
                // Use prototype setter so React tracks input change
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                if (nativeSetter) {
                  nativeSetter.call(usernameInput, sug);
                } else {
                  usernameInput.value = sug;
                }
                usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
                usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
                checkAvailability(sug);
              }
            };
          });
        } else if (type === "available") {
          isTakenRef.current = false;
          usernameInput.classList.remove("!border-rose-500", "focus:!border-rose-500");
          usernameInput.classList.add("!border-emerald-500");

          feedbackEl.innerHTML = `
            <p class="text-[12px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <span>✓ @${message} is available</span>
            </p>
          `;
        } else {
          isTakenRef.current = false;
          usernameInput.classList.remove("!border-rose-500", "!border-emerald-500", "focus:!border-rose-500");
          feedbackEl.innerHTML = "";
        }
      };

      const checkAvailability = async (rawName) => {
        const clean = (rawName || "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 64);
        if (!clean) {
          setFeedback("none");
          return;
        }

        if (clean.length < 5) {
          setFeedback("taken", "Username must be at least 5 characters long.", []);
          return;
        }

        if (/^\d+$/.test(clean)) {
          setFeedback("taken", "Username cannot consist only of numbers.", []);
          return;
        }

        currentCheckedNameRef.current = clean;
        try {
          const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
          const data = await res.json();

          if (currentCheckedNameRef.current !== clean) return;

          if (data.available) {
            setFeedback("available", clean);
          } else {
            setFeedback("taken", data.message || `That username is already taken. Try one of these:`, data.suggestions || []);
          }
        } catch (err) {
          console.warn("Check username network error:", err);
        }
      };

      const handleInput = (e) => {
        const val = e.target.value;
        if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

        const clean = val.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 64);
        if (!clean) {
          setFeedback("none");
          return;
        }

        if (clean.length < 5) {
          setFeedback("taken", "Username must be at least 5 characters long.", []);
          return;
        }

        if (/^\d+$/.test(clean)) {
          setFeedback("taken", "Username cannot consist only of numbers.", []);
          return;
        }

        checkTimeoutRef.current = setTimeout(() => {
          checkAvailability(clean);
        }, 220);
      };

      usernameInput.addEventListener("input", handleInput);
      usernameInput.addEventListener("blur", (e) => checkAvailability(e.target.value));

      if (usernameInput.value && usernameInput.value.trim().length >= 5) {
        checkAvailability(usernameInput.value);
      }

      const handleSubmitCapture = (e) => {
        const val = (usernameInput.value || "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
        if (isTakenRef.current || val.length < 5 || /^\d+$/.test(val)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          usernameInput.focus();

          if (val.length < 5) {
            setFeedback("taken", "Username must be at least 5 characters long.", []);
          } else if (/^\d+$/.test(val)) {
            setFeedback("taken", "Username cannot consist only of numbers.", []);
          }

          const feedbackEl = container.querySelector("#kriri-clerk-username-feedback");
          if (feedbackEl) {
            feedbackEl.classList.add("scale-105");
            setTimeout(() => feedbackEl.classList.remove("scale-105"), 150);
          }
        }
      };

      form.addEventListener("submit", handleSubmitCapture, true);
      cleanupListeners = () => {
        form.removeEventListener("submit", handleSubmitCapture, true);
        usernameInput.removeEventListener("input", handleInput);
      };
    };

    setupFormEnhancement();

    // Use MutationObserver only to detect when Clerk dynamically re-renders its form or route
    const observer = new MutationObserver(() => {
      const usernameInput = container.querySelector('input[name="username"], #username-field');
      if (usernameInput && usernameInput.dataset.kririAttached !== "true") {
        setupFormEnhancement();
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      if (cleanupListeners) cleanupListeners();
    };
  }, [containerRef, location.pathname]);

  return null;
}
