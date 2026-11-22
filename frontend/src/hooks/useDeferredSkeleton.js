import { useState, useEffect } from "react";

/**
 * Intelligent loading threshold hook.
 *
 * Skeletons and loading placeholders should ONLY appear if data fetching takes
 * longer than a threshold (default: 180ms). When data arrives quickly or is
 * cached, this hook suppresses the skeleton entirely to avoid jarring layout flashes.
 *
 * @param {boolean} isLoading - Current pending/loading status
 * @param {number} delayMs - Threshold in ms before skeleton appears (default: 180ms)
 * @returns {boolean} showSkeleton - True ONLY if loading persists beyond delayMs
 */
export function useDeferredSkeleton(isLoading, delayMs = 180) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // If not loading, ensure skeleton is hidden and cancel pending timers
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }

    // Delay showing the skeleton until threshold has passed
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading, delayMs]);

  return showSkeleton;
}

export default useDeferredSkeleton;
