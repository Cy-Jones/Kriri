import React, { useState, useRef } from "react";
import {
  MessageCircle,
  Mail,
  Sparkles,
  Users,
  Check,
  X,
  Send,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CopyButton } from "@/registry/components/copy-button/copy-button";
import { Avatar } from "@/registry/components/avatar/avatar";
import { Button } from "@/registry/components/button/button";
import { motionTokens } from "@/lib/motion-tokens";
import styles from "./contact-section.module.css";

const ICON = { size: 18, strokeWidth: 1.75, "aria-hidden": true };
const standard = [...motionTokens.ease.standard];

export const contactTopics = [
  "Support & Help",
  "Bug Report",
  "Feature Request",
  "Feedback",
  "Other",
];

/**
 * Interactive Live Chat action:
 * Shows the "Start a chat" pill button initially (matching Image 1),
 * and when clicked, opens the in-place message composer to chat directly with the developer.
 */
export function ChatAction() {
  const [state, setState] = useState("idle"); // "idle" | "chatting"
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sentNotice, setSentNotice] = useState(false);
  const inputRef = useRef(null);

  const startChat = () => {
    setState("chatting");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userText = message.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: userText, sender: "user" },
    ]);
    setMessage("");
    setSentNotice(true);
  };

  if (state === "idle") {
    return (
      <div className={styles.confirm}>
        <Button
          variant="primary"
          className="!rounded-full px-6"
          onClick={startChat}
        >
          Start a chat
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.agentBar}>
        <Avatar
          name="Kriri Developer"
          size="sm"
          status="online"
        />
        <div className={styles.agentInfo}>
          <span className={styles.agentName}>Independent Developer</span>
          <span className={styles.agentStatus}>
            <span className={styles.agentDot} /> Online (IST) · Quick replies
          </span>
        </div>
        <button
          type="button"
          className={styles.closeChatBtn}
          onClick={() => setState("idle")}
          aria-label="Close chat"
          title="Close chat"
        >
          <X size={14} />
        </button>
      </div>

      <div className={styles.chatThread}>
        <div className={styles.bubbleAgent}>
          Hey! Thanks for using Kriri. Found an issue, have a shortcut idea, or want to share feedback? Drop a message below and I'll reply directly.
        </div>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.bubbleUser}>
            {msg.text}
          </div>
        ))}
        {sentNotice && (
          <div className={styles.bubbleAgent}>
            Got your message! Thank you for the note. I'll read and follow up shortly.
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className={styles.chatComposer}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to the developer..."
          className={styles.chatField}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="!rounded-full px-4"
          disabled={!message.trim()}
        >
          <Send size={13} className="mr-1" />
          Send
        </Button>
      </form>
    </div>
  );
}

/** Demo action that confirms in place with a spring transition. */
export function ConfirmAction({ idle, busy, done, note }) {
  const reduced = !!useReducedMotion();
  const [state, setState] = useState("idle");
  const timer = useRef(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className={styles.confirm}>
      <Button
        variant={state === "done" ? "secondary" : "primary"}
        loading={state === "busy"}
        className="!rounded-full px-5"
        onClick={() => {
          if (state !== "idle") {
            setState("idle");
            return;
          }
          if (busy) {
            setState("busy");
            timer.current = window.setTimeout(() => setState("done"), 800);
          } else setState("done");
        }}
      >
        {state === "done" ? (
          <>
            <Check size={15} strokeWidth={2.25} aria-hidden="true" />
            {done}
          </>
        ) : (
          idle
        )}
      </Button>
      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {state === "done" && note && (
            <motion.div
              key="note"
              className={styles.confirmNote}
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
              {note}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const contactExampleChannels = [
  {
    value: "chat",
    label: "Chat with developer",
    meta: "Replies in ~4 mins · IST",
    icon: <MessageCircle {...ICON} />,
    detail: (
      <>
        <h3>Chat with the developer</h3>
        <p>
          Online now from India (IST). Chat is best for quick feedback, shortcut suggestions, or an issue you've encountered.
        </p>
        <ChatAction />
      </>
    ),
  },
  {
    value: "email",
    label: "Email direct",
    meta: "support@kriri.app",
    icon: <Mail {...ICON} />,
    detail: (
      <>
        <h3>Direct email</h3>
        <p>
          Send logs, screenshots, or detailed notes. Every message lands directly in my personal inbox.
        </p>
        <div className={styles.copyRow}>
          <span>support@kriri.app</span>
          <CopyButton value="support@kriri.app" label="Copy email" />
        </div>
      </>
    ),
  },
  {
    value: "feedback",
    label: "Feature requests",
    meta: "Shaping the roadmap",
    icon: <Sparkles {...ICON} />,
    detail: (
      <>
        <h3>Feature requests & ideas</h3>
        <p>
          Kriri is an independent craft project. If there's a view, keyboard flow, or capability you want to see built, reach out directly.
        </p>
        <div className={styles.copyRow}>
          <span>feedback@kriri.app</span>
          <CopyButton value="feedback@kriri.app" label="Copy feedback email" />
        </div>
      </>
    ),
  },
  {
    value: "community",
    label: "Community",
    meta: "Discord & GitHub",
    icon: <Users {...ICON} />,
    detail: (
      <>
        <h3>Join the community</h3>
        <p>
          Connect with other developers, share custom shortcuts, test early builds, and follow development updates.
        </p>
        <div className={styles.confirm}>
          <a
            href="https://discord.gg/kriri"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline inline-block"
          >
            <Button variant="secondary" className="!rounded-full px-5">
              Open Discord community
            </Button>
          </a>
        </div>
      </>
    ),
  },
];

export const contactExampleOffices = [
  {
    city: "India (IST)",
    timeZone: "Asia/Kolkata",
    address: ["Independent Developer", "India"],
    email: "support@kriri.app",
    hours: [9, 21],
  },
];
