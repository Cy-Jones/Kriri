import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

import { motionTokens } from "@/registry/motion-tokens";

export const ease = {
  enter: [...motionTokens.ease.enter],
  standard: [...motionTokens.ease.standard],
  inOut: [...motionTokens.ease.inOut],
};

/** The one entrance a hero plays: children rise in reading order, once. */
export const heroGroup = {
  hidden: {},
  shown: {
    transition: {
      staggerChildren: motionTokens.stagger.line,
      delayChildren: 0.04,
    },
  },
};
export const heroRise = {
  hidden: { opacity: 0, y: 12, filter: `blur(${motionTokens.blur.subtle}px)` },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.64, ease: ease.enter },
  },
};
export const heroFade = {
  hidden: { opacity: 0 },
  shown: {
    opacity: 1,
    transition: { duration: motionTokens.duration.standard },
  },
};

export const instant = { duration: 0 };

const noop = () => () => {};
/**
 * Reduced motion, read only after hydration. The server cannot know the preference, so the first client render matches the
 * server's full motion markup and the reduced branch takes over on the next render, before anything has moved.
 */
export function useHeroReducedMotion() {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return !!useReducedMotion() && hydrated;
}
