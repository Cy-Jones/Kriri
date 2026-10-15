"use client";

import { forwardRef, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";
import { motionTokens } from "@/registry/motion-tokens";
import styles from "./site-footer.module.css";

const enter = [...motionTokens.ease.enter];

export const siteFooterExampleColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Guides", href: "/guides" },
      { label: "Community", href: "/community" },
      { label: "Figma kit", href: "https://figma.com", external: true },
    ],
  },
];

const exampleLegal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
];

const exampleSocials = [
  { label: "X", href: "https://x.com", external: true },
  { label: "GitHub", href: "https://github.com", external: true },
  { label: "LinkedIn", href: "https://linkedin.com", external: true },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function FooterLink({ link, onNavigate, className }) {
  const content = (
    <>
      {link.label}
      {link.external && (
        <ArrowUpRight
          className={styles.external}
          size={13}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
    </>
  );

  const handleClick = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(link);
    }
  };

  if (link.href) {
    if (link.external || link.href.startsWith("http")) {
      return (
        <a
          className={className ?? styles.link}
          href={link.href}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        className={className ?? styles.link}
        to={link.href}
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className ?? styles.link}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}

function ArcMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 48V29C9 15 19 7 32 7s23 8 23 22v19" />
      <path d="M20 48V31c0-8 5-13 12-13s12 5 12 13v17" />
      <path d="M32 38v10" />
    </svg>
  );
}

/** Email signup that validates in place, keeps its width while the button morphs, and confirms without a toast. */
function Newsletter({
  title,
  description,
  placeholder = "you@example.com",
  onSubscribe,
}) {
  const id = useId();
  const reduced = !!useReducedMotion();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const validate = (value) =>
    !value.trim()
      ? "Enter your email address"
      : EMAIL.test(value.trim())
      ? null
      : "That email doesn't look right";

  async function submit(event) {
    event.preventDefault();
    if (state !== "idle") return;
    setTouched(true);
    const problem = validate(email);
    setError(problem);
    if (problem) return;
    setState("loading");
    try {
      await (onSubscribe
        ? onSubscribe(email.trim())
        : new Promise((resolve) => setTimeout(resolve, 900)));
      setState("done");
    } catch {
      setState("idle");
      setError("We couldn't subscribe you. Try again in a moment");
    }
  }

  const message =
    state === "done" ? `Check ${email.trim()} to confirm` : error ?? description;
  const tone = state === "done" ? "success" : error ? "error" : "hint";

  return (
    <form
      className={styles.newsletter}
      onSubmit={submit}
      noValidate
      aria-labelledby={title ? `${id}-title` : undefined}
    >
      {title && (
        <h2 id={`${id}-title`} className={styles.newsletterTitle}>
          {title}
        </h2>
      )}
      <div
        className={styles.newsletterRow}
        data-invalid={error ? "" : undefined}
        data-done={state === "done" ? "" : undefined}
      >
        <label className={styles.srOnly} htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          id={`${id}-email`}
          className={styles.newsletterInput}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          value={email}
          readOnly={state !== "idle"}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-message`}
          onChange={(event) => {
            setEmail(event.target.value);
            if (touched) setError(validate(event.target.value));
          }}
          onBlur={() => {
            if (email) {
              setTouched(true);
              setError(validate(email));
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          loading={state === "loading"}
          className={styles.newsletterButton}
          aria-disabled={state === "done" || undefined}
        >
          {state === "done" ? (
            <>
              <Check size={15} strokeWidth={2.25} aria-hidden="true" />
              Subscribed
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </div>
      <div className={styles.messageSlot} id={`${id}-message`} aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {message && (
            <motion.p
              key={message}
              className={styles.message}
              data-tone={tone}
              role={tone === "error" ? "alert" : undefined}
              initial={
                reduced
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      y: 4,
                      filter: `blur(${motionTokens.blur?.subtle ?? 2}px)`,
                    }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduced
                  ? { opacity: 0, transition: { duration: 0 } }
                  : {
                      opacity: 0,
                      y: -4,
                      filter: `blur(${motionTokens.blur?.subtle ?? 2}px)`,
                      transition: { duration: motionTokens.duration.instant },
                    }
              }
              transition={{
                duration: reduced ? 0 : motionTokens.duration.standard,
                ease: enter,
              }}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

/**
 * A website footer in three layouts: link columns with a newsletter signup, a single quiet row, and a closing
 * variant where the brand mark rises in, oversized and cropped by the bottom edge, fading into the page.
 */
export const SiteFooter = forwardRef(function SiteFooter(
  {
    variant = "columns",
    brand = { name: "Arc" },
    tagline = "Interface components that move with intent.",
    columns = siteFooterExampleColumns,
    links,
    legal = exampleLegal,
    socials = exampleSocials,
    newsletter = {
      title: "Get the monthly release notes",
      description: "One email a month. Unsubscribe anytime.",
    },
    status = { label: "All systems normal", tone: "success" },
    year = new Date().getFullYear(),
    onNavigate,
    className,
  },
  ref,
) {
  const reduced = !!useReducedMotion();
  const gradientId = useId().replace(/:/g, "");

  const brandNode = (
    <FooterLink
      link={{ label: brand.name, href: brand.href ?? "/" }}
      onNavigate={onNavigate}
      className={styles.brand}
    />
  );

  const brandWithMark = (
    <span className={styles.brandRow}>
      {brand.mark ?? <ArcMark className={styles.brandMark} />}
      {brandNode}
    </span>
  );

  const statusNode =
    status &&
    (status.href ? (
      <a
        className={styles.status}
        href={status.href}
        data-tone={status.tone ?? "success"}
        onClick={(e) => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate({ label: status.label, href: status.href });
          }
        }}
      >
        <span className={styles.statusDot} aria-hidden="true" />
        {status.label}
      </a>
    ) : (
      <button
        type="button"
        className={styles.status}
        data-tone={status.tone ?? "success"}
        onClick={() => onNavigate?.({ label: status.label })}
      >
        <span className={styles.statusDot} aria-hidden="true" />
        {status.label}
      </button>
    ));

  const socialNode = socials && socials.length > 0 && (
    <ul className={styles.inline} aria-label="Social">
      {socials.map((link) => (
        <li key={link.label}>
          <FooterLink link={link} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );

  const legalRow = (
    <div className={styles.bottom}>
      <div className={styles.bottomStart}>
        <span className={styles.copyright}>
          © {year} {brand.name}
        </span>
        {legal && legal.length > 0 && (
          <ul className={styles.inline} aria-label="Legal">
            {legal.map((link) => (
              <li key={link.label}>
                <FooterLink link={link} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.bottomEnd}>
        {statusNode}
        {socialNode}
      </div>
    </div>
  );

  const columnNav = columns && columns.length > 0 && (
    <nav
      className={styles.columns}
      style={{
        gridTemplateColumns:
          columns.length < 3
            ? `repeat(${columns.length}, minmax(0, 1fr))`
            : undefined,
      }}
      aria-label="Footer"
    >
      {columns.map((column) => (
        <div key={column.title} className={styles.column}>
          <h2>{column.title}</h2>
          <ul>
            {column.links.map((link) => (
              <li key={link.label}>
                <FooterLink link={link} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  if (variant === "minimal") {
    const rowLinks =
      links ??
      columns
        .map((column) => column.links[0])
        .filter(Boolean)
        .concat((legal ?? []).slice(0, 2));

    return (
      <footer
        ref={ref}
        className={[styles.footer, styles.minimal, className]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.minimalRow}>
          {brandWithMark}
          <nav aria-label="Footer">
            <ul className={styles.inline}>
              {rowLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={styles.minimalRow}>
          <span className={styles.copyright}>
            © {year} {brand.name}
            {tagline ? `. ${tagline}` : ""}
          </span>
          <div className={styles.bottomEnd}>
            {statusNode}
            {socialNode}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      ref={ref}
      className={[
        styles.footer,
        variant === "logo" ? styles.logo : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.top}>
        <div className={styles.intro}>
          {brandWithMark}
          {tagline && <p className={styles.tagline}>{tagline}</p>}
          {newsletter && variant === "columns" && (
            <Newsletter {...newsletter} />
          )}
        </div>
        {columnNav}
      </div>
      {legalRow}
      {variant === "logo" && (
        <motion.div
          className={styles.markStage}
          aria-hidden="true"
          initial={reduced ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: enter }}
        >
          {brand.bigMark ?? (
            <svg
              className={styles.bigMark}
              viewBox="0 3.5 64 30"
              fill="none"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              preserveAspectRatio="xMidYMin meet"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="0"
                    style={{ stopColor: "var(--arc-gradient-from)" }}
                  />
                  <stop
                    offset="1"
                    style={{ stopColor: "var(--arc-gradient-to)" }}
                  />
                </linearGradient>
              </defs>
              <g stroke={`url(#${gradientId})`}>
                <path d="M9 48V29C9 15 19 7 32 7s23 8 23 22v19" />
                <path d="M20 48V31c0-8 5-13 12-13s12 5 12 13v17" />
                <path d="M32 38v10" />
              </g>
            </svg>
          )}
        </motion.div>
      )}
    </footer>
  );
});

SiteFooter.displayName = "SiteFooter";

const variantOptions = [
  { value: "columns", label: "Columns" },
  { value: "minimal", label: "Minimal" },
  { value: "logo", label: "Logo" },
];

/** Preview: the footer with a switch between its three layouts and a note of the last link pressed. */
export function SiteFooterBlock({
  variant: initial = "columns",
  ...props
}) {
  const [variant, setVariant] = useState(initial);
  const [last, setLast] = useState(null);
  const reduced = !!useReducedMotion();
  const contentRef = useRef(null);
  const [height, setHeight] = useState(null);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    setHeight(node.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, [variant]);

  return (
    <div className={styles.preview}>
      <SegmentedControl
        label="Footer layout"
        options={variantOptions}
        value={variant}
        onValueChange={(value) => setVariant(value)}
      />
      <div className={styles.frame}>
        <motion.div
          className={styles.frameBody}
          initial={false}
          animate={{ height: height ?? "auto" }}
          transition={
            reduced ? { duration: 0 } : motionTokens.spring.smooth
          }
        >
          <motion.div
            ref={contentRef}
            key={variant}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: motionTokens.duration.standard,
              ease: enter,
            }}
          >
            <SiteFooter
              variant={variant}
              onNavigate={(link) => {
                setLast(link.label);
                props.onNavigate?.(link);
              }}
              {...props}
            />
          </motion.div>
        </motion.div>
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {last ? `Opened ${last}` : ""}
      </p>
    </div>
  );
}

export default SiteFooterBlock;
