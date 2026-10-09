"use client";

import { useState } from "react";

import SegmentedControl from "@/registry/components/segmented-control/segmented-control";
import { HeroLumen } from "./hero-lumen";
import { HeroRelay } from "./hero-relay";
import { HeroCadence } from "./hero-cadence";
import { HeroMesh } from "./hero-mesh";

import { HeroContent } from "./hero-content";

import styles from "./hero-section.module.css";

export { HeroCadence, HeroContent, HeroLumen, HeroMesh, HeroRelay };

/**
 * A full screen landing page hero in three designs: a product screenshot in perspective over a drifting mesh, a live workflow
 * graph that routes sample events, and editorial type over a mesh gradient.
 */
export function HeroSection({
  variant = "centered",
  animateIn = true,
  primaryAction,
  secondaryAction,
  title,
  description,
  announcement,
  install,
  media,
  meta,
  className,
}) {
  if (title)
    return (
      <HeroContent
        layout={variant}
        title={title}
        description={description}
        announcement={announcement}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        install={install}
        media={media}
        meta={meta}
        animateIn={animateIn}
        className={className}
      />
    );
  const actions = {
    primaryAction: primaryAction ?? undefined,
    secondaryAction: secondaryAction ?? undefined,
  };
  if (variant === "split")
    return (
      <HeroRelay animateIn={animateIn} className={className} {...actions} />
    );
  if (variant === "minimal")
    return (
      <HeroCadence animateIn={animateIn} className={className} {...actions} />
    );
  return <HeroLumen animateIn={animateIn} className={className} {...actions} />;
}

const variantOptions = [
  { value: "centered", label: "Screenshot" },
  { value: "split", label: "Workflow" },
  { value: "minimal", label: "Mesh" },
];

/**
 * Preview: the hero, full screen, with a small glass switch floating over its top edge. The switch takes no space of its own,
 * so every design fills the screen exactly. Switching replays the entrance.
 */
export function HeroSectionBlock({ variant: initial = "centered" }) {
  const [variant, setVariant] = useState(initial);
  return (
    <div className={styles.preview}>
      <HeroSection key={variant} variant={variant} />
      <div className={styles.switcher}>
        <SegmentedControl
          label="Hero design"
          options={variantOptions}
          value={variant}
          onValueChange={(value) => setVariant(value)}
          className={styles.switch}
        />
      </div>
    </div>
  );
}

export default HeroSectionBlock;
