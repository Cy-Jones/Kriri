"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const Image = (props) => <img {...props} />;
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";

import {
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronDown,
  History,
  LayoutTemplate,
  Menu,
  MessagesSquare,
  Palette,
  PanelsTopLeft,
  Route,
  X,
} from "lucide-react";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";
import { motionTokens } from "@/registry/motion-tokens";
import { photo } from "@/lib/media";
import styles from "./site-header.module.css";

/** One destination inside a mega menu panel. */

/** A card beside the links in a mega menu panel. */

/** A top level destination. With `links` and the mega variant it opens a panel; otherwise it is a plain link. */

/** What `onNavigate` receives. */

const enter = [...motionTokens.ease.enter];
const standard = [...motionTokens.ease.standard];
/** Duration based springs restated as stiffness and damping, so a retarget keeps the velocity already in flight. */
const physical = (visualDuration, bounce) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return {
    type: "spring",
    stiffness: root * root,
    damping: 2 * (1 - bounce) * root,
    mass: 1,
  };
};
const GROW = physical(0.44, 0.12),
  SHRINK = physical(0.34, 0),
  GLIDE = physical(0.3, 0.1),
  SLIDE = physical(0.4, 0.06);
const HOVER_INTENT = 70,
  LEAVE_GRACE = 180,
  TRAVEL = 36;
/** Matches the container query in site-header.module.css. */
const COLLAPSE_BELOW = 760;

/** Panel content slides in from the side of the newly opened item; opening from closed drops in from the bar. */
const faceVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction * TRAVEL,
    y: direction ? 0 : -6,
    filter: `blur(${motionTokens.blur.subtle}px)`,
  }),
  shown: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      x: SLIDE,
      y: SLIDE,
      opacity: { duration: 0.2, ease: enter, delay: 0.02 },
      filter: { duration: 0.24, ease: enter },
    },
  },
  gone: (direction) => ({
    opacity: 0,
    x: direction * -TRAVEL * 0.6,
    filter: `blur(${motionTokens.blur.subtle}px)`,
    transition: {
      x: SLIDE,
      opacity: { duration: 0.12, ease: standard },
      filter: { duration: 0.12, ease: standard },
    },
  }),
};
const fadeVariants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.14 } },
  gone: { opacity: 0, transition: { duration: 0.08 } },
};

export function ArcMark(props) {
  return (
    <svg
      className={props.className}
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

const ICON = { size: 18, strokeWidth: 1.75, "aria-hidden": true };
const curvedFacade = photo("curved-facade");

export const siteHeaderExampleItems = [
  {
    value: "product",
    label: "Product",
    links: [
      {
        label: "Components",
        description: "140 interactive React components",
        icon: <Boxes {...ICON} />,
      },
      {
        label: "Blocks",
        description: "Complete sections, ready to ship",
        icon: <PanelsTopLeft {...ICON} />,
      },
      {
        label: "Templates",
        description: "Starter sites with every page",
        icon: <LayoutTemplate {...ICON} />,
      },
      {
        label: "Themes",
        description: "Tune color, radius, and motion",
        icon: <Palette {...ICON} />,
      },
    ],

    feature: {
      title: "What's new in 2.4",
      description: "Site headers, footers, and hero sections.",
      image: { src: curvedFacade.src, alt: curvedFacade.alt },
    },
  },
  {
    value: "resources",
    label: "Resources",
    links: [
      {
        label: "Documentation",
        description: "Install, theme, and compose",
        icon: <BookOpen {...ICON} />,
      },
      {
        label: "Guides",
        description: "Patterns for real product work",
        icon: <Route {...ICON} />,
      },
      {
        label: "Changelog",
        description: "Every release, week by week",
        icon: <History {...ICON} />,
      },
      {
        label: "Community",
        description: "Questions, answers, and showcases",
        icon: <MessagesSquare {...ICON} />,
      },
    ],
  },
  { value: "pricing", label: "Pricing" },
  { value: "customers", label: "Customers" },
];

function useScrolled(threshold, container) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const node = container?.current ?? null;
    const target = node ?? window;
    const read = () => (node ? node.scrollTop : window.scrollY);
    // Turns solid past the threshold and clear again only near the top, so it never flickers at the edge.
    const update = () => {
      const y = read();
      setScrolled((previous) => (previous ? y > threshold / 2 : y > threshold));
    };
    update();
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
  }, [threshold, container]);
  return scrolled;
}

/** A panel face reports its natural height while current; a leaving face floats out of flow and turns inert. */
function Face({ direction, reduced, onHeight, children }) {
  const ref = useRef(null);
  const present = useIsPresent();
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !present) return;
    onHeight(node.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => onHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, [present, onHeight]);
  return (
    <motion.div
      ref={ref}
      className={styles.face}
      data-face=""
      data-leaving={present ? undefined : ""}
      inert={!present}
      custom={direction}
      variants={reduced ? fadeVariants : faceVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
    >
      {children}
    </motion.div>
  );
}

/** Renders an anchor when the destination has an href and a button otherwise, so demos and real sites share one path. */
function Destination({ link, onChoose, children, ...rest }) {
  return link.href ? (
    <a {...rest} href={link.href} onClick={onChoose}>
      {children}
    </a>
  ) : (
    <button {...rest} type="button" onClick={onChoose}>
      {children}
    </button>
  );
}

/**
 * A website header in three layouts. It sticks to the top and turns solid once the page scrolls, marks the current section
 * with an indicator that glides between links, opens springy mega menu panels whose content slides in from the side you
 * moved toward, and folds into a menu sheet on narrow containers.
 */
export const SiteHeader = forwardRef(function SiteHeader(
  {
    variant = "mega",
    brand = { name: "Arc" },
    items = siteHeaderExampleItems,
    current: currentProp,
    defaultCurrent,
    onCurrentChange,
    onNavigate,
    secondaryAction = { label: "Sign in" },
    primaryAction = { label: "Get Arc" },
    sticky = true,
    scrollContainer,
    scrollThreshold = 8,
    label = "Main",
    className,
  },
  ref,
) {
  const id = useId();
  const reduced = !!useReducedMotion();
  const scrolled = useScrolled(scrollThreshold, scrollContainer);
  const [innerCurrent, setInnerCurrent] = useState(defaultCurrent);
  const current = currentProp ?? innerCurrent;
  const [hovered, setHovered] = useState(null);
  const [open, setOpen] = useState(null);
  const [panel, setPanel] = useState({ height: null, grow: true });
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const rootRef = useRef(null);
  const menuButtonRef = useRef(null);
  const triggerRefs = useRef(new Map());
  const panelRef = useRef(null);
  const openTimer = useRef(undefined),
    closeTimer = useRef(undefined);
  const focusFirst = useRef(false);
  const hasPanels = variant === "mega";
  const openItem = open
    ? items.find((item) => item.value === open.value)
    : undefined;

  const setRefs = useCallback(
    (node) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const openPanel = useCallback(
    (value) => {
      setOpen((previous) => {
        if (!value) return null;
        if (previous?.value === value) return previous;
        const from = previous
          ? items.findIndex((item) => item.value === previous.value)
          : -1;
        const to = items.findIndex((item) => item.value === value);
        return { value, direction: from < 0 ? 0 : Math.sign(to - from) };
      });
      if (!value) setPanel({ height: null, grow: true });
    },
    [items],
  );

  const close = useCallback(
    (restoreFocus = false) => {
      clearTimers();
      const was = open?.value;
      openPanel(null);
      if (restoreFocus && was) triggerRefs.current.get(was)?.focus();
    },
    [open, openPanel, clearTimers],
  );

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    setExpanded(null);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  const choose = useCallback(
    (destination, section) => {
      if (section) {
        if (currentProp === undefined) setInnerCurrent(section);
        onCurrentChange?.(section);
      }
      onNavigate?.(destination);
      close();
      closeMenu();
    },
    [close, closeMenu, currentProp, onCurrentChange, onNavigate],
  );

  // Outside presses and Escape close whichever layer is open.
  useEffect(() => {
    if (!open && !menuOpen) return;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        close();
        closeMenu();
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        if (open) close(true);
        else closeMenu(true);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, menuOpen, close, closeMenu]);

  // The sheet belongs to narrow layouts: widening the container closes it, and it holds the page still while open.
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width >= COLLAPSE_BELOW) {
        setMenuOpen(false);
        setExpanded(null);
      } else setOpen(null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const scroller = scrollContainer?.current ?? document.documentElement;
    const previous = scroller.style.getPropertyValue("overflow");
    scroller.style.setProperty("overflow", "hidden");
    return () => {
      if (previous) scroller.style.setProperty("overflow", previous);
      else scroller.style.removeProperty("overflow");
    };
  }, [menuOpen, scrollContainer]);

  useEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    const frame = requestAnimationFrame(() =>
      panelRef.current?.querySelector("[data-panel-link]")?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function onTriggerPointerEnter(event, value) {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    if (open) openPanel(value);
    else
      openTimer.current = window.setTimeout(
        () => openPanel(value),
        HOVER_INTENT,
      );
  }
  function onRegionPointerLeave(event) {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => openPanel(null), LEAVE_GRACE);
  }
  function onRegionPointerEnter(event) {
    if (event.pointerType === "mouse") window.clearTimeout(closeTimer.current);
  }

  function onNavKeyDown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const triggers = Array.from(
      event.currentTarget.querySelectorAll("[data-nav-item]"),
    );
    const index = triggers.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const nextIndex =
      (index + (event.key === "ArrowRight" ? 1 : -1) + triggers.length) %
      triggers.length;
    triggers[nextIndex].focus();
    if (open) {
      const item = items[nextIndex];
      openPanel(item && hasPanels && item.links?.length ? item.value : null);
    }
  }
  function onTriggerKeyDown(event, value) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirst.current = true;
      openPanel(value);
      if (open?.value === value)
        panelRef.current?.querySelector("[data-panel-link]")?.focus();
    }
  }
  function onPanelKeyDown(event) {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    )
      return;
    const unique = Array.from(
      event.currentTarget.querySelectorAll(
        "[data-face]:not([data-leaving]) [data-panel-link]",
      ),
    );
    if (!unique.length) return;
    event.preventDefault();
    const index = unique.indexOf(document.activeElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? unique.length - 1
          : event.key === "ArrowDown"
            ? Math.min(index + 1, unique.length - 1)
            : index - 1;
    if (next < 0) {
      close(true);
      return;
    }
    unique[next]?.focus();
  }

  // Growing carries a little life; shrinking settles without overshoot.
  const onHeight = useCallback(
    (height) =>
      setPanel((previous) =>
        previous.height === height
          ? previous
          : {
              height,
              grow: previous.height === null || height > previous.height,
            },
      ),
    [],
  );

  const actionNode = (action, kind, extra = "") => {
    const onClick = () => {
      action.onClick?.();
      if (action.href) onNavigate?.({ label: action.label, href: action.href });
      closeMenu();
    };
    const cls = `${styles.action} ${styles[kind]} ${extra}`;
    return action.href ? (
      <a className={cls} href={action.href} onClick={onClick}>
        {action.label}
      </a>
    ) : (
      <button type="button" className={cls} onClick={onClick}>
        {action.label}
      </button>
    );
  };

  const brandNode = (
    <Destination
      link={{ label: brand.name, href: brand.href }}
      className={styles.brand}
      onChoose={() => {
        onNavigate?.({ label: brand.name, href: brand.href });
        close();
        closeMenu();
      }}
    >
      {brand.mark ?? <ArcMark className={styles.brandMark} />}
      <span>{brand.name}</span>
    </Destination>
  );

  return (
    <header
      ref={setRefs}
      className={[styles.header, sticky ? styles.sticky : "", className]
        .filter(Boolean)
        .join(" ")}
      data-variant={variant}
      data-scrolled={scrolled || menuOpen || !!open ? "" : undefined}
    >
      <div
        className={styles.inner}
        onPointerLeave={onRegionPointerLeave}
        onPointerEnter={onRegionPointerEnter}
      >
        <div className={styles.bar}>
          <div className={styles.brandSlot}>{brandNode}</div>
          <LayoutGroup id={id}>
            <nav
              className={styles.nav}
              aria-label={label}
              onKeyDown={onNavKeyDown}
              onPointerLeave={() => setHovered(null)}
            >
              <ul className={styles.navList}>
                {items.map((item) => {
                  const isCurrent = current === item.value;
                  const withPanel = hasPanels && !!item.links?.length;
                  const isOpen = open?.value === item.value;
                  const panelId = `${id}-panel`;
                  const common = {
                    className: styles.navItem,
                    "data-nav-item": "",
                    "data-current": isCurrent ? "" : undefined,
                    "data-open": isOpen ? "" : undefined,
                    onPointerEnter: (event) => {
                      if (event.pointerType === "mouse") setHovered(item.value);
                      if (withPanel) onTriggerPointerEnter(event, item.value);
                      else if (event.pointerType === "mouse" && open)
                        closeTimer.current = window.setTimeout(
                          () => openPanel(null),
                          LEAVE_GRACE,
                        );
                    },
                    onFocus: () => setHovered(null),
                  };
                  const decorations = (
                    <>
                      {hovered === item.value && variant !== "centered" && (
                        <motion.span
                          layoutId="hover"
                          className={styles.hover}
                          transition={reduced ? { duration: 0 } : GLIDE}
                          aria-hidden="true"
                        />
                      )}
                      {isCurrent && (
                        <motion.span
                          layoutId="current"
                          className={styles.indicator}
                          transition={
                            reduced
                              ? { duration: 0 }
                              : motionTokens.spring.morph
                          }
                          aria-hidden="true"
                        />
                      )}
                    </>
                  );
                  return (
                    <li key={item.value} className={styles.navCell}>
                      {withPanel ? (
                        <button
                          {...common}
                          ref={(node) => {
                            if (node) triggerRefs.current.set(item.value, node);
                            else triggerRefs.current.delete(item.value);
                          }}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={isOpen ? panelId : undefined}
                          onClick={() => {
                            clearTimers();
                            openPanel(isOpen ? null : item.value);
                          }}
                          onKeyDown={(event) =>
                            onTriggerKeyDown(event, item.value)
                          }
                        >
                          {decorations}
                          <span className={styles.navLabel}>{item.label}</span>
                          <ChevronDown
                            className={styles.chevron}
                            size={14}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <Destination
                          link={item}
                          {...common}
                          aria-current={isCurrent ? "page" : undefined}
                          onChoose={() =>
                            choose(
                              {
                                label: item.label,
                                href: item.href,
                                section: item.value,
                              },
                              item.value,
                            )
                          }
                        >
                          {decorations}
                          <span className={styles.navLabel}>{item.label}</span>
                        </Destination>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </LayoutGroup>
          <div className={styles.actions}>
            {secondaryAction &&
              actionNode(secondaryAction, "secondary", styles.wideOnly)}
            {primaryAction && actionNode(primaryAction, "primary")}
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              aria-expanded={menuOpen}
              aria-controls={`${id}-sheet`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                if (menuOpen) closeMenu();
                else setMenuOpen(true);
              }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={menuOpen ? "close" : "open"}
                  className={styles.menuIcon}
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: menuOpen ? -45 : 45, scale: 0.8 }
                  }
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: menuOpen ? 45 : -45, scale: 0.8 }
                  }
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          ...motionTokens.spring.snappy,
                          opacity: { duration: 0.12 },
                        }
                  }
                >
                  {menuOpen ? (
                    <X size={20} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {hasPanels && (
          <AnimatePresence>
            {openItem?.links && (
              <motion.div
                key="panel"
                id={`${id}-panel`}
                ref={panelRef}
                className={styles.panel}
                role="region"
                aria-label={openItem.label}
                onKeyDown={onPanelKeyDown}
                initial={
                  reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.985 }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  height: panel.height ?? "auto",
                }}
                exit={
                  reduced
                    ? { opacity: 0, transition: { duration: 0.1 } }
                    : {
                        opacity: 0,
                        y: -4,
                        scale: 0.99,
                        transition: { duration: 0.14, ease: standard },
                      }
                }
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        height: panel.grow ? GROW : SHRINK,
                        y: GROW,
                        scale: GROW,
                        opacity: { duration: 0.16, ease: enter },
                      }
                }
              >
                <AnimatePresence initial={false} custom={open?.direction ?? 0}>
                  <Face
                    key={openItem.value}
                    direction={open?.direction ?? 0}
                    reduced={reduced}
                    onHeight={onHeight}
                  >
                    <div
                      className={styles.faceGrid}
                      data-featured={openItem.feature ? "" : undefined}
                    >
                      <ul className={styles.panelLinks}>
                        {openItem.links.map((link) => (
                          <li key={link.label}>
                            <Destination
                              link={link}
                              className={styles.panelLink}
                              data-panel-link=""
                              onChoose={() =>
                                choose(
                                  {
                                    label: link.label,
                                    href: link.href,
                                    section: openItem.value,
                                  },
                                  openItem.value,
                                )
                              }
                            >
                              {link.icon && (
                                <span className={styles.panelIcon}>
                                  {link.icon}
                                </span>
                              )}
                              <span className={styles.panelText}>
                                <span>{link.label}</span>
                                {link.description && (
                                  <span>{link.description}</span>
                                )}
                              </span>
                            </Destination>
                          </li>
                        ))}
                      </ul>
                      {openItem.feature && (
                        <Destination
                          link={{
                            label: openItem.feature.title,
                            href: openItem.feature.href,
                          }}
                          className={styles.feature}
                          data-panel-link=""
                          onChoose={() =>
                            choose(
                              {
                                label: openItem.feature.title,
                                href: openItem.feature.href,
                                section: openItem.value,
                              },
                              openItem.value,
                            )
                          }
                        >
                          {openItem.feature.image && (
                            <span className={styles.featureImage}>
                              <Image
                                src={openItem.feature.image.src}
                                alt={openItem.feature.image.alt}
                                fill
                                sizes="260px"
                              />
                            </span>
                          )}
                          <span className={styles.featureTitle}>
                            {openItem.feature.title}
                            <ArrowRight
                              size={14}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </span>
                          {openItem.feature.description && (
                            <span className={styles.featureText}>
                              {openItem.feature.description}
                            </span>
                          )}
                        </Destination>
                      )}
                    </div>
                  </Face>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="scrim"
              className={styles.scrim}
              onClick={() => closeMenu()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: standard }}
              aria-hidden="true"
            />
            <motion.div
              key="sheet"
              id={`${id}-sheet`}
              className={styles.sheet}
              initial={reduced ? { opacity: 0 } : { height: 0 }}
              animate={reduced ? { opacity: 1 } : { height: "auto" }}
              exit={
                reduced ? { opacity: 0 } : { height: 0, transition: SHRINK }
              }
              transition={reduced ? { duration: 0 } : GROW}
            >
              <nav className={styles.sheetInner} aria-label={label}>
                <ul className={styles.sheetList}>
                  {items.map((item, index) => {
                    const isCurrent = current === item.value;
                    const group = !!item.links?.length && variant === "mega";
                    const isExpanded = expanded === item.value;
                    const rowMotion = {
                      initial: reduced ? false : { opacity: 0, y: -6 },
                      animate: { opacity: 1, y: 0 },
                      transition: {
                        duration: 0.26,
                        ease: enter,
                        delay: reduced
                          ? 0
                          : 0.04 + index * motionTokens.stagger.item,
                      },
                    };
                    return (
                      <motion.li
                        key={item.value}
                        className={styles.sheetItem}
                        {...rowMotion}
                      >
                        {group ? (
                          <>
                            <button
                              type="button"
                              className={styles.sheetRow}
                              data-current={isCurrent ? "" : undefined}
                              aria-expanded={isExpanded}
                              aria-controls={`${id}-group-${item.value}`}
                              onClick={() =>
                                setExpanded(isExpanded ? null : item.value)
                              }
                            >
                              <span>{item.label}</span>
                              <ChevronDown
                                className={styles.sheetChevron}
                                size={18}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            </button>
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  key="group"
                                  id={`${id}-group-${item.value}`}
                                  className={styles.sheetGroup}
                                  initial={
                                    reduced
                                      ? { opacity: 0 }
                                      : { height: 0, opacity: 0 }
                                  }
                                  animate={
                                    reduced
                                      ? { opacity: 1 }
                                      : { height: "auto", opacity: 1 }
                                  }
                                  exit={
                                    reduced
                                      ? { opacity: 0 }
                                      : { height: 0, opacity: 0 }
                                  }
                                  transition={
                                    reduced
                                      ? { duration: 0 }
                                      : {
                                          height: motionTokens.spring.smooth,
                                          opacity: { duration: 0.16 },
                                        }
                                  }
                                >
                                  <ul>
                                    {item.links.map((link) => (
                                      <li key={link.label}>
                                        <Destination
                                          link={link}
                                          className={styles.sheetLink}
                                          onChoose={() =>
                                            choose(
                                              {
                                                label: link.label,
                                                href: link.href,
                                                section: item.value,
                                              },
                                              item.value,
                                            )
                                          }
                                        >
                                          {link.icon}
                                          <span>{link.label}</span>
                                        </Destination>
                                      </li>
                                    ))}
                                  </ul>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <Destination
                            link={item}
                            className={styles.sheetRow}
                            data-current={isCurrent ? "" : undefined}
                            aria-current={isCurrent ? "page" : undefined}
                            onChoose={() =>
                              choose(
                                {
                                  label: item.label,
                                  href: item.href,
                                  section: item.value,
                                },
                                item.value,
                              )
                            }
                          >
                            <span>{item.label}</span>
                            {isCurrent && (
                              <span
                                className={styles.sheetDot}
                                aria-hidden="true"
                              />
                            )}
                          </Destination>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
                {(secondaryAction || primaryAction) && (
                  <motion.div
                    className={styles.sheetActions}
                    initial={reduced ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.26,
                      ease: enter,
                      delay: reduced
                        ? 0
                        : 0.04 + items.length * motionTokens.stagger.item,
                    }}
                  >
                    {secondaryAction &&
                      actionNode(secondaryAction, "secondary")}
                    {primaryAction && actionNode(primaryAction, "primary")}
                  </motion.div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
});

SiteHeader.displayName = "SiteHeader";

const variantOptions = [
  { value: "mega", label: "Mega menu" },
  { value: "simple", label: "Simple" },
  { value: "centered", label: "Centered" },
];
const pageLabels = {
  product: "Product",
  resources: "Resources",
  pricing: "Pricing",
  customers: "Customers",
};

/** Preview: the header inside a small scrolling page, with a switch between its three layouts. */
export function SiteHeaderBlock({ variant: initial = "mega" }) {
  const [variant, setVariant] = useState(initial);
  const [current, setCurrent] = useState("product");
  const [last, setLast] = useState(null);
  const scrollRef = useRef(null);
  return (
    <div className={styles.preview}>
      <SegmentedControl
        label="Header layout"
        options={variantOptions}
        value={variant}
        onValueChange={(value) => setVariant(value)}
      />
      <div className={styles.frame} ref={scrollRef}>
        <SiteHeader
          variant={variant}
          current={current}
          onCurrentChange={setCurrent}
          onNavigate={(destination) => setLast(destination.label)}
          scrollContainer={scrollRef}
          secondaryAction={{
            label: "Sign in",
            onClick: () => setLast("Sign in"),
          }}
          primaryAction={{
            label: "Get Arc",
            onClick: () => setLast("Get Arc"),
          }}
        />

        <div className={styles.page}>
          <div className={styles.pageHero}>
            <h2>{pageLabels[current] ?? "Arc"}</h2>
            <p className={styles.srOnly} aria-live="polite">
              {last ? `Opened ${last}` : ""}
            </p>
          </div>
          <div className={styles.pageRows} aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={styles.pageRow}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteHeaderBlock;
