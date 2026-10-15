import { useState } from "react";

/**
 * Runs `start` during the render in which `open` becomes true.
 */
export function useOnOpen(open, start) {
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) start();
  }
}
