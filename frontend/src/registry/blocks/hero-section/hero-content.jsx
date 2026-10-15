"use client";

import { useEffect, useState } from "react";

import { MotionConfig, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { CopyButton } from "@/registry/components/copy-button/copy-button";
import { heroGroup, heroRise } from "./hero-motion";
import shell from "./hero-section.module.css";
import styles from "./hero-content.module.css";

/** A link or button that looks like an Arc button. Links keep native navigation; a button with `doneLabel` confirms in place. */
export function ActionLink({ action, kind, className }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 2400);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (kind === "primary") {
    if (action.href) {
      return (
        <a
          href={action.href}
          onClick={action.onClick}
          className="group relative inline-flex items-center justify-center gap-2.5 h-[48px] px-6 rounded-full bg-white text-black font-medium text-sm sm:text-base hover:bg-zinc-100 transition-all duration-300 shadow-[0_0_28px_rgba(255,255,255,0.18)] active:scale-[0.98]"
          {...(action.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <span>{action.label}</span>
          <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRight size={13} strokeWidth={2.5} className="text-black" />
          </span>
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          action.onClick?.();
          if (action.doneLabel) setDone(true);
        }}
        className="group relative inline-flex items-center justify-center gap-2.5 h-[48px] px-6 rounded-full bg-white text-black font-medium text-sm sm:text-base hover:bg-zinc-100 transition-all duration-300 shadow-[0_0_28px_rgba(255,255,255,0.18)] active:scale-[0.98]"
      >
        <span>{done ? (action.doneLabel ?? action.label) : action.label}</span>
        <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
          <ArrowRight size={13} strokeWidth={2.5} className="text-black" />
        </span>
      </button>
    );
  }

  if (kind === "secondary") {
    if (action.href) {
      return (
        <a
          href={action.href}
          onClick={action.onClick}
          className="inline-flex items-center justify-center gap-2 h-[48px] px-6 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white transition-all duration-300 text-sm sm:text-base font-medium active:scale-[0.98]"
          {...(action.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <span>{action.label}</span>
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={action.onClick}
        className="inline-flex items-center justify-center gap-2 h-[48px] px-6 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white transition-all duration-300 text-sm sm:text-base font-medium active:scale-[0.98]"
      >
        <span>{action.label}</span>
      </button>
    );
  }

  const cls = [styles.action, styles[kind], className]
    .filter(Boolean)
    .join(" ");
  const icon = action.external ? (
    <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
  ) : kind === "primary" ? (
    <ArrowRight
      className={styles.arrow}
      size={16}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  ) : null;
  if (action.href)
    return (
      <a
        className={cls}
        href={action.href}
        onClick={action.onClick}
        {...(action.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {action.label}
        {icon}
      </a>
    );
  return (
    <Button
      variant={kind}
      size="lg"
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={() => {
        action.onClick?.();
        if (action.doneLabel) setDone(true);
      }}
    >
      {done ? (
        <>
          <Check size={16} strokeWidth={1.75} aria-hidden="true" />
          {action.doneLabel}
        </>
      ) : (
        <>
          {action.label}
          {icon}
        </>
      )}
    </Button>
  );
}

/**
 * The hero with your own content: announcement, headline, description, actions, an optional install line, and an
 * optional visual beside the copy. Use it when none of the three designed variants fits the product.
 */
export function HeroContent({
  layout,
  announcement,
  title,
  description,
  primaryAction,
  secondaryAction,
  install,
  media,
  meta,
  animateIn = true,
  className,
}) {
  const item = heroRise;
  const command = install?.[0];
  // Reduced motion: Motion skips every transform (rise, zoom, tilt entrance); opacity still fades briefly.
  return (
    <MotionConfig reducedMotion="user">
      <section
        className={[shell.hero, styles.hero, styles[layout], className]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.inner}>
          <motion.div
            className={styles.copy}
            variants={heroGroup}
            initial={animateIn ? "hidden" : false}
            animate="shown"
          >
            {announcement && (
              <motion.div variants={item}>
                {announcement.href ? (
                  <a
                    className={styles.announcement}
                    href={announcement.href}
                    onClick={announcement.onClick}
                  >
                    {announcement.label}
                    <ArrowRight
                      className={styles.arrow}
                      size={14}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <button
                    type="button"
                    className={styles.announcement}
                    onClick={announcement.onClick}
                  >
                    {announcement.label}
                    <ArrowRight
                      className={styles.arrow}
                      size={14}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </motion.div>
            )}
            <motion.h1
              variants={item}
              className={[shell.title, styles.title].join(" ")}
            >
              {title}
            </motion.h1>
            {description && (
              <motion.p
                variants={item}
                className={[shell.description, styles.description].join(" ")}
              >
                {description}
              </motion.p>
            )}
            {(primaryAction || secondaryAction) && (
              <motion.div variants={item} className={styles.actions}>
                {primaryAction && (
                  <ActionLink action={primaryAction} kind="primary" />
                )}
                {secondaryAction && (
                  <ActionLink action={secondaryAction} kind="secondary" />
                )}
              </motion.div>
            )}
            {command && (
              <motion.div variants={item} className={styles.install}>
                <span className={styles.prompt} aria-hidden="true">
                  $
                </span>
                <code className={styles.command}>{command.command}</code>
                <CopyButton
                  value={command.command}
                  label="Copy install command"
                  iconOnly
                  variant="plain"
                />
              </motion.div>
            )}
            {meta && meta.length > 0 && (
              <motion.ul variants={item} className={styles.meta}>
                {meta.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </motion.ul>
            )}
          </motion.div>
          {media && (
            <motion.div
              className={styles.media}
              variants={item}
              initial={animateIn ? "hidden" : false}
              animate="shown"
            >
              {media}
            </motion.div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}

export default HeroContent;
