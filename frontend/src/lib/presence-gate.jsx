import { useIsPresent } from "motion/react";

export function PresenceGate({ children }) {
  const isPresent = useIsPresent();

  return children({
    isPresent,
    gate: {
      inert: !isPresent ? "" : undefined,
      style: { pointerEvents: isPresent ? "auto" : "none" },
    },
  });
}
