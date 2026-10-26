"use client";

import React, {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useAnimate,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { Check, Clock, Mail, MessageCircle, Phone, Users } from "lucide-react";
import { Avatar } from "@/registry/components/avatar/avatar";
import { Button } from "@/registry/components/button/button";
import { CopyButton } from "@/registry/components/copy-button/copy-button";
import { Input } from "@/registry/components/input/input";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control";
import { Textarea } from "@/registry/components/textarea/textarea";
import { motionTokens } from "@/lib/motion-tokens";
import { person } from "@/lib/media";
import styles from "./contact-section.module.css";
import {
  contactExampleChannels,
  contactExampleOffices,
  contactTopics,
} from "./contact-section-data";

const enter = [...motionTokens.ease.enter];
const standard = [...motionTokens.ease.standard];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_MESSAGE = 500;

/** Faces slide along one axis in the direction of travel and settle out of a soft blur. */
const faceVariants = {
  hidden: ({ direction, axis }) => ({
    opacity: 0,
    x: axis === "x" ? direction * 18 : 0,
    y: axis === "y" ? direction * 18 : 0,
    filter: `blur(${motionTokens.blur.soft}px)`,
  }),
  shown: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      x: motionTokens.spring.smooth,
      y: motionTokens.spring.smooth,
      opacity: {
        duration: motionTokens.duration.standard,
        ease: enter,
        delay: 0.04,
      },
      filter: {
        duration: motionTokens.duration.standard,
        ease: enter,
        delay: 0.04,
      },
    },
  },
  gone: ({ direction, axis }) => ({
    opacity: 0,
    x: axis === "x" ? direction * -12 : 0,
    y: axis === "y" ? direction * -12 : 0,
    filter: `blur(${motionTokens.blur.soft}px)`,
    transition: { duration: motionTokens.duration.fast, ease: standard },
  }),
};

const fadeVariants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: motionTokens.duration.fast } },
  gone: { opacity: 0, transition: { duration: motionTokens.duration.instant } },
};

function Face({ children, custom, reduced, className }) {
  const present = useIsPresent();
  return (
    <motion.div
      className={className}
      data-face=""
      data-leaving={present ? undefined : ""}
      inert={!present ? "" : undefined}
      custom={custom}
      variants={reduced ? fadeVariants : faceVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
    >
      {children}
    </motion.div>
  );
}

/**
 * One surface that springs from the height of its old content to the new one when `faceKey` changes,
 * while the faces crossfade along an axis. Between switches the height is automatic.
 */
function MorphPanel({
  faceKey,
  direction = 1,
  axis = "y",
  reduced,
  className,
  children,
  ...rest
}) {
  const [scope, animate] = useAnimate();
  const lastKey = useRef(faceKey);
  const lastHeight = useRef(0);

  useEffect(() => {
    const node = scope.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    lastHeight.current = node.offsetHeight;
    const observer = new ResizeObserver(() => {
      lastHeight.current = node.offsetHeight;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [scope]);

  useLayoutEffect(() => {
    if (lastKey.current === faceKey) return;
    lastKey.current = faceKey;
    const node = scope.current;
    const face = node?.querySelector(":scope > [data-face]:not([data-leaving])");
    if (!node || !face || reduced) return;
    const from = lastHeight.current || node.offsetHeight;
    const to = face.offsetHeight;
    if (Math.abs(from - to) < 1) return;
    node.style.setProperty("height", `${from}px`);
    const controls = animate(
      node,
      { height: [from, to] },
      motionTokens.spring.smooth,
    );
    controls.then(() => node.style.removeProperty("height"));
    return () => {
      controls.stop();
      node.style.removeProperty("height");
    };
  }, [faceKey, animate, scope, reduced]);

  return (
    <div
      ref={scope}
      className={[styles.morph, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <AnimatePresence initial={false} mode="popLayout" custom={{ direction, axis }}>
        <Face
          key={faceKey}
          custom={{ direction, axis }}
          reduced={reduced}
          className={styles.face}
        >
          {children}
        </Face>
      </AnimatePresence>
    </div>
  );
}

/** Topic chips as a radio group: a pill highlight glides to the choice and arrow keys move it. */
function TopicPicker({ topics, value, onChange, reduced }) {
  const id = useId();
  const refs = useRef([]);

  function onKeyDown(event) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (topics.indexOf(value) + delta + topics.length) % topics.length;
    onChange(topics[next]);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.topicField}>
      <span id={`${id}-label`} className={styles.fieldLabel}>
        Topic
      </span>
      <LayoutGroup id={id}>
        <div
          className={styles.topics}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          onKeyDown={onKeyDown}
        >
          {topics.map((topic, index) => (
            <button
              key={topic}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={topic === value}
              tabIndex={topic === value ? 0 : -1}
              className={styles.topic}
              onClick={() => onChange(topic)}
            >
              {topic === value && (
                <motion.span
                  layoutId="topic"
                  className={styles.topicHighlight}
                  transition={
                    reduced ? { duration: 0 } : motionTokens.spring.morph
                  }
                  aria-hidden="true"
                />
              )}
              <span>{topic}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter your name";
  if (!values.email.trim()) errors.email = "Enter your email address";
  else if (!EMAIL.test(values.email.trim()))
    errors.email = "Enter a valid email address";
  if (values.message.trim().length < 15)
    errors.message = values.message.trim()
      ? "Add a little more detail, at least 15 characters"
      : "Tell us how we can help";
  return errors;
}

function ContactForm({ topics = contactTopics, onSubmit, reduced }) {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [topic, setTopic] = useState(topics[0] ?? "");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState("editing");
  const [failure, setFailure] = useState(null);
  const [sentTo, setSentTo] = useState({ name: "", email: "" });
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);
  const restoreFocus = useRef(false);
  const successRef = useRef(null);

  useEffect(() => {
    if (phase === "sent") successRef.current?.focus();
    if (phase === "editing" && restoreFocus.current) {
      restoreFocus.current = false;
      nameRef.current?.focus();
    }
  }, [phase]);

  const update = (field) => (event) => {
    const next = { ...values, [field]: event.target.value };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  async function submit(event) {
    event.preventDefault();
    if (phase !== "editing") return;
    setSubmitted(true);
    setFailure(null);
    const found = validate(values);
    setErrors(found);
    if (found.name) {
      nameRef.current?.focus();
      return;
    }
    if (found.email) {
      emailRef.current?.focus();
      return;
    }
    if (found.message) {
      messageRef.current?.focus();
      return;
    }
    setPhase("sending");
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      topic,
      message: values.message.trim(),
    };
    try {
      await (onSubmit
        ? onSubmit(payload)
        : new Promise((resolve) => setTimeout(resolve, 900)));
      setSentTo({
        name: payload.name.split(/\s+/)[0] || payload.name,
        email: payload.email,
      });
      setPhase("sent");
    } catch {
      setPhase("editing");
      setFailure(
        "We couldn't deliver your message. Check your connection and try again.",
      );
    }
  }

  function reset() {
    setValues({ name: "", email: "", message: "" });
    setErrors({});
    setSubmitted(false);
    setFailure(null);
    restoreFocus.current = true;
    setPhase("editing");
  }

  const left = MAX_MESSAGE - values.message.length;
  return (
    <MorphPanel
      faceKey={phase === "sent" ? "sent" : "form"}
      direction={phase === "sent" ? 1 : -1}
      reduced={reduced}
      className={styles.formCard}
    >
      {phase === "sent" ? (
        <div className={styles.success} aria-live="polite">
          <span className={styles.successMark} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reduced ? 0 : 0.42,
                  ease: enter,
                  delay: 0.16,
                }}
              />
            </svg>
          </span>
          <h3 ref={successRef} tabIndex={-1} className={styles.successTitle}>
            Thanks, {sentTo.name}
          </h3>
          <p className={styles.successText}>
            Your message has been sent to our {topic.toLowerCase()} inbox. We'll
            reply to {sentTo.email} promptly.
          </p>
          <Button variant="secondary" onClick={reset}>
            Send another message
          </Button>
        </div>
      ) : (
        <form
          className={styles.formBody}
          onSubmit={submit}
          noValidate
          aria-label="Contact form"
        >
          <div className={styles.row}>
            <Input
              ref={nameRef}
              label="Your name"
              name="name"
              autoComplete="name"
              placeholder="e.g. Alex Rivera"
              value={values.name}
              onChange={update("name")}
              error={errors.name}
              readOnly={phase === "sending"}
            />
            <Input
              ref={emailRef}
              label="Email address"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="alex@example.com"
              value={values.email}
              onChange={update("email")}
              error={errors.email}
              readOnly={phase === "sending"}
            />
          </div>
          <TopicPicker
            topics={topics}
            value={topic}
            onChange={setTopic}
            reduced={reduced}
          />
          <Textarea
            ref={messageRef}
            label="Message"
            name="message"
            rows={4}
            maxLength={MAX_MESSAGE}
            placeholder="Tell us about your questions, setup, or suggestions..."
            value={values.message}
            onChange={update("message")}
            error={errors.message}
            description={`${left} characters left`}
            readOnly={phase === "sending"}
          />
          <AnimatePresence initial={false}>
            {failure && (
              <motion.p
                key="failure"
                role="alert"
                className={styles.failure}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        height: motionTokens.spring.smooth,
                        opacity: {
                          duration: motionTokens.duration.fast,
                          ease: standard,
                        },
                      }
                }
              >
                {failure}
              </motion.p>
            )}
          </AnimatePresence>
          <div className={styles.submitRow}>
            <p className={styles.fine}>We read and reply to every message.</p>
            <Button
              type="submit"
              variant="primary"
              loading={phase === "sending"}
            >
              Send message
            </Button>
          </div>
        </form>
      )}
    </MorphPanel>
  );
}

function useNow(intervalMs) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function officeState(office, now) {
  if (!now) return { time: "--:--", open: null };
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: office.timeZone,
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const weekday = get("weekday");
  const [start, end] = office.hours ?? [9, 18];
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: office.timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  return {
    time,
    open:
      weekday !== "Sat" &&
      weekday !== "Sun" &&
      hour >= start &&
      hour < end,
  };
}

const hourLabel = (hour) =>
  `${hour % 12 || 12}${hour < 12 || hour === 24 ? "am" : "pm"}`;

function Offices({ offices = contactExampleOffices }) {
  const now = useNow(15000);
  return (
    <ul className={styles.offices}>
      {offices.map((office) => {
        const { time, open } = officeState(office, now);
        return (
          <li key={office.city} className={styles.office}>
            <div className={styles.officeHead}>
              <h3>{office.city}</h3>
              <span className={styles.officeTime}>
                <Clock size={14} strokeWidth={1.75} aria-hidden="true" />
                <span className={styles.tabular}>{time}</span>
              </span>
            </div>
            <span
              className={styles.officeStatus}
              data-open={open === null ? undefined : open ? "" : undefined}
              data-closed={open === false ? "" : undefined}
            >
              <span className={styles.statusDot} aria-hidden="true" />
              {open === null
                ? "Checking hours"
                : open
                  ? `Active until ${hourLabel((office.hours ?? [9, 18])[1])}`
                  : "Offline now"}
            </span>
            <address className={styles.address}>
              {office.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            <div className={styles.officeActions}>
              {office.email && (
                <a className={styles.officeLink} href={`mailto:${office.email}`}>
                  {office.email}
                </a>
              )}
              <CopyButton
                value={office.address.join(", ")}
                label="Copy address"
                variant="plain"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Channels({ channels = contactExampleChannels, value, onChange, reduced }) {
  const id = useId();
  const [direction, setDirection] = useState(1);
  const refs = useRef([]);
  const active =
    channels.find((channel) => channel.value === value) ?? channels[0];

  const choose = (next) => {
    if (next === active.value) return;
    setDirection(
      Math.sign(
        channels.findIndex((channel) => channel.value === next) -
          channels.indexOf(active),
      ) || 1,
    );
    onChange(next);
  };

  function onKeyDown(event) {
    const delta =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;
    const edge =
      event.key === "Home" ? 0 : event.key === "End" ? channels.length - 1 : -1;
    if (!delta && edge < 0) return;
    event.preventDefault();
    const next =
      edge >= 0
        ? edge
        : (channels.indexOf(active) + delta + channels.length) % channels.length;
    choose(channels[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.channels}>
      <LayoutGroup id={id}>
        <div
          className={styles.channelList}
          role="tablist"
          aria-orientation="vertical"
          aria-label="Ways to reach us"
          onKeyDown={onKeyDown}
        >
          {channels.map((channel, index) => {
            const selected = channel.value === active.value;
            return (
              <button
                key={channel.value}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${channel.value}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                className={styles.channel}
                onClick={() => choose(channel.value)}
              >
                {selected && (
                  <motion.span
                    layoutId="channel"
                    className={styles.channelHighlight}
                    transition={
                      reduced ? { duration: 0 } : motionTokens.spring.morph
                    }
                    aria-hidden="true"
                  />
                )}
                <span className={styles.channelIcon}>{channel.icon}</span>
                <span className={styles.channelText}>
                  <span className={styles.channelLabelFull}>{channel.label}</span>
                  <span className={styles.channelLabelShort}>
                    {channel.shortLabel || channel.label}
                  </span>
                  <span className={styles.channelMeta}>{channel.meta}</span>
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <MorphPanel
        faceKey={active.value}
        direction={direction}
        axis="y"
        reduced={reduced}
        className={styles.channelPanel}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active.value}`}
      >
        <div className={styles.channelDetail}>{active.detail}</div>
      </MorphPanel>
    </div>
  );
}

/**
 * A contact section in three layouts: a validated form whose card springs into a confirmation,
 * a list of support channels whose detail panel morphs to each channel, and office cards with live local times.
 */
export const ContactSection = forwardRef(function ContactSection(
  {
    variant = "form",
    title,
    description,
    topics = contactTopics,
    onSubmit,
    channels = contactExampleChannels,
    channel: channelProp,
    defaultChannel,
    onChannelChange,
    offices = contactExampleOffices,
    className,
  },
  ref,
) {
  const id = useId();
  const reduced = !!useReducedMotion();
  const [innerChannel, setInnerChannel] = useState(
    defaultChannel ?? channels[0]?.value ?? "",
  );
  const activeChannel = channelProp ?? innerChannel;
  const setChannel = (next) => {
    if (channelProp === undefined) setInnerChannel(next);
    onChannelChange?.(next);
  };

  const copy = {
    form: {
      title: "Get in touch",
      description:
        "Have thoughts, found a bug, or want to suggest a keyboard shortcut? Kriri is an independent project — I read and reply to every message personally.",
    },
    channels: {
      title: "Direct channels",
      description:
        "Choose whatever suits your inquiry. You will always speak directly with the developer.",
    },
    offices: {
      title: "Developer studio",
      description:
        "Independent software development studio based in India.",
    },
  }[variant];

  return (
    <section
      ref={ref}
      className={[styles.contact, className].filter(Boolean).join(" ")}
      data-variant={variant}
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.inner}>
        <div className={styles.intro}>
          <h2 id={`${id}-title`} className={styles.title}>
            {title ?? copy.title}
          </h2>
          <p className={styles.description}>
            {description ?? copy.description}
          </p>
          {variant === "form" && (
            <ul className={styles.facts}>
              <li>
                <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                Quick replies (India / IST)
              </li>
              <li>
                <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>support@kriri.app</span>
                <CopyButton
                  value="support@kriri.app"
                  label="Copy email"
                  iconOnly
                  variant="plain"
                />
              </li>
            </ul>
          )}
        </div>
        {variant === "form" && (
          <ContactForm topics={topics} onSubmit={onSubmit} reduced={reduced} />
        )}
        {variant === "channels" && (
          <Channels
            channels={channels}
            value={activeChannel}
            onChange={setChannel}
            reduced={reduced}
          />
        )}
        {variant === "offices" && <Offices offices={offices} />}
      </div>
    </section>
  );
});

ContactSection.displayName = "ContactSection";

const variantOptions = [
  { value: "form", label: "Send a Note" },
  { value: "channels", label: "Direct Channels" },
];

/** Preview / Interactive block: the contact section with an ergonomic switcher between its three layouts. */
export function ContactSectionBlock({
  variant: initial = "form",
  topics,
  onSubmit,
  className,
}) {
  const [variant, setVariant] = useState(initial);

  return (
    <div className={[styles.preview, className].filter(Boolean).join(" ")}>
      <SegmentedControl
        label="Contact layout"
        options={variantOptions}
        value={variant}
        onValueChange={(next) => setVariant(next)}
      />
      <div className={styles.frame}>
        <ContactSection
          key={variant}
          variant={variant}
          topics={topics}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

export default ContactSectionBlock;
