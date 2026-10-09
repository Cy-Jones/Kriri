"use client";
import React, {
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { motionTokens } from "../../../lib/motion-tokens";
import styles from "./button.module.css";
const pressVariants = {
  pressed: (button) => {
    const width = button.current?.offsetWidth ?? 0;
    return {
      scale: width > 220 ? 0.985 : width && width <= 48 ? 0.96 : 0.97,
      transition: {
        duration: motionTokens.duration.instant,
        ease: [...motionTokens.ease.standard],
      },
    };
  },
};
const rest = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const textIn = {
  opacity: 0,
  y: 4,
  filter: `blur(${motionTokens.blur.soft}px)`,
};
const textOut = {
  opacity: 0,
  y: -3,
  filter: `blur(${motionTokens.blur.soft}px)`,
  transition: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.standard],
  },
};
const iconIn = {
  opacity: 0,
  scale: 0.6,
  filter: `blur(${motionTokens.blur.subtle}px)`,
};
const iconOut = {
  opacity: 0,
  scale: 0.6,
  filter: `blur(${motionTokens.blur.subtle}px)`,
  transition: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.standard],
  },
};
const fadeIn = { ...rest, opacity: 0 };
const fadeOut = {
  opacity: 0,
  transition: { duration: motionTokens.duration.instant },
};
const iconEnter = {
  ...motionTokens.spring.snappy,
  opacity: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.enter],
  },
  filter: {
    duration: motionTokens.duration.fast,
    ease: [...motionTokens.ease.enter],
  },
};
function labelKey(node) {
  if (node == null || typeof node === "boolean") return "";
  if (
    typeof node === "string" ||
    typeof node === "number" ||
    typeof node === "bigint"
  )
    return String(node);
  if (Array.isArray(node)) return node.map(labelKey).join("");
  if (!isValidElement(node)) return "";
  const type = node.type;
  return `<${typeof type === "string" ? type : (type?.displayName ?? type?.name ?? "")}>${labelKey(node.props.children)}`;
}
function useMorphWidth(content, key, reduced) {
  const width = useMotionValue("auto");
  const lastKey = useRef(key),
    armedUntil = useRef(0);
  useLayoutEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    armedUntil.current = performance.now() + 700;
  }, [key]);
  useEffect(() => {
    const node = content.current,
      slot = node?.parentElement;
    if (!node || !slot || typeof ResizeObserver === "undefined") return;
    let measured = false;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      if (
        !next ||
        !measured ||
        reduced ||
        performance.now() > armedUntil.current
      ) {
        measured = next > 0;
        width.jump(next || "auto");
        delete slot.dataset.morphing;
        return;
      }
      slot.dataset.morphing = "";
      animate(width, next, {
        ...motionTokens.spring.morph,
        onComplete: () => {
          delete slot.dataset.morphing;
        },
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [content, reduced, width]);
  return width;
}
function LabelPhase({ children, icon, reduced, ref }) {
  const present = useIsPresent();
  return /* @__PURE__ */ React.createElement(
    motion.span,
    {
      ref,
      className: styles.labelPhase,
      "aria-hidden": present ? void 0 : true,
      initial: reduced ? fadeIn : icon ? iconIn : textIn,
      animate: rest,
      exit: reduced ? fadeOut : icon ? iconOut : textOut,
      transition: reduced
        ? { duration: motionTokens.duration.instant }
        : icon
          ? iconEnter
          : {
              duration: motionTokens.duration.standard,
              ease: [...motionTokens.ease.enter],
            },
    },
    children,
  );
}
export const Button = forwardRef(function Button2(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const reduceMotion = useReducedMotion() ?? false;
  const buttonRef = useRef(null);
  const contentRef = useRef(null);
  const key = labelKey(children);
  const width = useMorphWidth(contentRef, key, reduceMotion);
  const setRefs = useCallback(
    (node) => {
      buttonRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const popup = props["aria-haspopup"];
  const anchorsLayer =
    (popup !== void 0 && popup !== false && popup !== "false") ||
    props.role === "combobox" ||
    props["data-state"] !== void 0;
  const inert =
    disabled ||
    loading ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");
  return /* @__PURE__ */ React.createElement(
    motion.button,
    {
      ref: setRefs,
      tabIndex: props.tabIndex ?? 0,
      className: classes,
      disabled,
      "aria-busy": loading || void 0,
      custom: buttonRef,
      variants: pressVariants,
      whileTap: reduceMotion || anchorsLayer || inert ? void 0 : "pressed",
      transition: motionTokens.spring.snappy,
      ...props,
      "aria-disabled": loading || props["aria-disabled"] || void 0,
      onClick: loading ? (event) => event.preventDefault() : onClick,
    },
    /* @__PURE__ */ React.createElement(
      AnimatePresence,
      { initial: false },
      loading
        ? /* @__PURE__ */ React.createElement(
            motion.span,
            {
              key: "loader",
              className: styles.loader,
              "aria-hidden": "true",
              initial: reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.6 },
              animate: { opacity: 1, scale: 1 },
              exit: reduceMotion ? fadeOut : { ...iconOut, scale: 0.8 },
              transition: reduceMotion
                ? { duration: motionTokens.duration.instant }
                : iconEnter,
            },
            /* @__PURE__ */ React.createElement("span", {
              className: styles.spinner,
            }),
          )
        : null,
    ),
    /* @__PURE__ */ React.createElement(
      motion.span,
      {
        className: [styles.labelSlot, loading ? styles.loadingLabel : ""]
          .filter(Boolean)
          .join(" "),
        style: { width },
      },
      /* @__PURE__ */ React.createElement(
        "span",
        { ref: contentRef, className: styles.labelContent },
        /* @__PURE__ */ React.createElement(
          AnimatePresence,
          { mode: "popLayout", initial: false },
          /* @__PURE__ */ React.createElement(
            LabelPhase,
            {
              key,
              icon: !/\S/.test(key.replace(/<[^>]*>/g, "")),
              reduced: reduceMotion,
            },
            children,
          ),
        ),
      ),
    ),
  );
});
Button.displayName = "Button";
export default Button;
