import { ContactSectionBlock } from "@/registry/blocks/contact-section/contact-section";
import { FaqSection } from "@/registry/blocks/faq-section/faq-section";

const contactFaqs = [
  {
    id: "response-time",
    category: "Support",
    question: "How fast do you typically reply?",
    answer:
      "Every message lands directly with the creator. You will typically receive a detailed reply within 2–4 hours during IST daytime hours, and within 24 hours at most.",
  },
  {
    id: "feature-requests",
    category: "Product",
    question: "Can I request custom features or specific keyboard shortcuts?",
    answer:
      "Yes! Kriri is an independent craft project shaped heavily by builder feedback. If you have an ergonomic workflow, shortcut, or view in mind, reach out directly and we can ship it.",
  },
  {
    id: "bug-reports",
    category: "Bugs",
    question: "What information should I include in bug reports?",
    answer:
      "A quick screenshot, device/browser details, and the steps to reproduce help us trace and hotfix issues within hours.",
  },
  {
    id: "security-privacy",
    category: "Privacy",
    question: "Is communication confidential?",
    answer:
      "Yes. All emails and direct channels are private, encrypted, and handled exclusively by the core team. We never share logs or user data.",
  },
];

export default function Contact() {
  return (
    <div className="pt-4 pb-12 sm:pt-16 sm:pb-24 relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ContactSectionBlock />

        {/* Seamless FAQ & Help Flow */}
        <div className="mt-14 sm:mt-24 pt-10 sm:pt-16 border-t border-border">
          <FaqSection
            title="Common Questions"
            description="Quick answers about contacting the developer, feedback cycles, and feature requests."
            items={contactFaqs}
          />
        </div>
      </div>
    </div>
  );
}
