import { ContactSectionBlock } from "@/registry/blocks/contact-section/contact-section";

export default function Contact() {
  return (
    <div className="py-12 sm:py-20 lg:py-24 relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ContactSectionBlock />
      </div>
    </div>
  );
}
