"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, Copy } from "lucide-react";
import { motionTokens } from "@/registry/motion-tokens";
import { useCopyFeedback } from "@/lib/use-copy-feedback";
import styles from "./copy-button.module.css";











/** Copy feedback is deliberately unhurried: a slow, almost critically damped spring and long, soft crossfades read as calm, never busy.
 *  The same motion plays in reverse when the confirmation hands back to idle, so nothing ever snaps. */
const settle = { type: "spring", visualDuration: .5, bounce: .06 };
const enter = { duration: .36, ease: [...motionTokens.ease.enter] };
const leave = { duration: .2, ease: [...motionTokens.ease.standard] };
const instant = { duration: motionTokens.duration.instant };
const soft = `blur(${motionTokens.blur.soft}px)`;
const rest = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const fadeIn = { ...rest, opacity: 0 };
const fadeOut = { opacity: 0, transition: instant };
/** Icons trade places in one soft breath: the old glyph shrinks into a blur while the new one grows out of it on the slow spring. */
const iconIn = { opacity: 0, scale: .6, filter: soft };
const iconOut = { opacity: 0, scale: .6, filter: soft, transition: { duration: .24, ease: [...motionTokens.ease.standard] } };
const iconEnter = { scale: settle, opacity: { ...enter, delay: .03 }, filter: { ...enter, delay: .03 } };
/** Letters rise about .3em out of a soft blur; the outgoing ones lift away a little faster. */
const glyphIn = { opacity: 0, y: 4, filter: soft };
const glyphOut = { opacity: 0, y: -3, filter: soft, transition: leave };

/** The success tick draws itself from its short stroke, the way a hand would write it: quick to start, then easing into place while the icon settles. */
function DrawnCheck({ reduced }) {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <motion.path d="M4 12l5 5L20 6" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ pathLength: { duration: .5, ease: [...motionTokens.ease.standard], delay: .05 }, opacity: { duration: .01, delay: .05 } }} />
  </svg>;
}


const toGlyphs = (chars, seq) => chars.map((char, order) => ({ id: `${seq}:${order}`, char, order }));

/** Shared leading and trailing characters keep their identity, so "Copy" to "Copied" only replaces the changed letters. */
function useGlyphs(text) {
  const [state, setState] = useState(() => ({ text, seq: 0, glyphs: toGlyphs([...text], 0) }));
  if (state.text === text) return state.glyphs;
  const prev = [...state.text],next = [...text];
  let start = 0,end = 0;
  while (start < prev.length && start < next.length && prev[start] === next[start]) start++;
  while (end < prev.length - start && end < next.length - start && prev[prev.length - 1 - end] === next[next.length - 1 - end]) end++;
  if (start < 2) start = 0;
  if (end < 2) end = 0;
  const seq = state.seq + 1;
  const glyphs = [...state.glyphs.slice(0, start), ...toGlyphs(next.slice(start, next.length - end), seq), ...state.glyphs.slice(state.glyphs.length - end)];
  setState({ text, seq, glyphs });
  return glyphs;
}

/** The label cell already reserves its widest state, so the row stays put and only the letters move. */
function MorphText({ text, reduced }) {
  const glyphs = useGlyphs(text);
  return <span className={styles.glyphs}>
    <AnimatePresence mode="popLayout" initial={false}>
      {glyphs.map((glyph) => <motion.span key={glyph.id} className={styles.glyph} layout={reduced ? false : "position"} layoutDependency={text} initial={reduced ? fadeIn : glyphIn} animate={rest} exit={reduced ? fadeOut : glyphOut} transition={reduced ? instant : { ...enter, delay: Math.min(glyph.order * .02, .12), layout: settle }}>{glyph.char}</motion.span>)}
    </AnimatePresence>
  </span>;
}

export function CopyButton({ value, label = "Copy", className, iconOnly = false, variant = "outline", disabled, onCopied }) {
  const { state, copy } = useCopyFeedback();
  const reduced = useReducedMotion() ?? false;
  const text = state === "copied" ? "Copied" : state === "error" ? "Failed" : label;

  async function handleCopy() {
    if (await copy(value)) onCopied?.();
  }

  return <><button
      type="button"
      className={[styles.button, iconOnly && styles.iconOnly, variant === "plain" && styles.plain, className].filter(Boolean).join(" ")}
      onClick={() => void handleCopy()}
      aria-label={label}
      data-copy-state={state}
      disabled={disabled}>
      
    <span className={styles.icon} aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.span key={state} className={styles.iconInner} data-state={state} initial={reduced ? fadeIn : iconIn} animate={rest} exit={reduced ? fadeOut : iconOut} transition={reduced ? instant : iconEnter}>
          {state === "copied" ? <DrawnCheck reduced={reduced} /> : state === "error" ? <CircleAlert size={16} strokeWidth={1.8} /> : <Copy size={16} strokeWidth={1.8} />}
        </motion.span>
      </AnimatePresence>
    </span>
    {!iconOnly && <span className={styles.label} aria-hidden="true">
      <span className={styles.measure}>{label}</span><span className={styles.measure}>Copied</span><span className={styles.measure}>Failed</span>
      <MorphText text={text} reduced={reduced} />
    </span>}
  </button><span className={styles.srOnly} role="status" aria-live="polite">{state === "idle" ? "" : state === "error" ? `${label}: Could not copy` : `${label}: Copied`}</span></>;
}