import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/registry/blocks/site-header/site-header";
import { Footer } from "@/components/landing/Footer";

export default function Privacy() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("section-1");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const brand = {
    name: "Kriri",
    href: "/",
    mark: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="6"
        />
      </svg>
    ),
  };

  const navItems = [
    { value: "features", label: "Features", href: "/features" },
    { value: "pricing", label: "Pricing", href: "/pricing" },
    { value: "changelog", label: "Changelog", href: "/changelog" },
    { value: "about", label: "About", href: "/about" },
    { value: "contact", label: "Contact", href: "/contact" },
  ];

  const handleNavigate = (destination) => {
    const targetHref = destination?.href || "/";
    if (targetHref === "/" || targetHref === "") {
      navigate("/");
      return;
    }
    if (targetHref?.startsWith("#")) {
      const element = document.querySelector(targetHref);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/" + targetHref);
      }
    } else if (targetHref?.startsWith("/")) {
      navigate(targetHref);
    } else if (targetHref) {
      window.location.href = targetHref;
    }
  };

  const toc = [
    { id: "section-1", title: "1. Personal Information We Collect" },
    { id: "section-2", title: "2. Tracking Technologies & Cookies" },
    { id: "section-3", title: "3. How We Use Personal Information" },
    { id: "section-4", title: "4. How We Share Personal Information" },
    { id: "section-5", title: "5. User Content & AI Safeguards" },
    { id: "section-6", title: "6. Data Retention" },
    { id: "section-7", title: "7. Security Safeguards" },
    { id: "section-8", title: "8. International Data Transfers" },
    { id: "section-9", title: "9. Your Rights & Choices" },
    { id: "section-10", title: "10. U.S. State Privacy Rights" },
    { id: "section-11", title: "11. Notice to European & UK Users" },
    { id: "section-12", title: "12. Children's Privacy" },
    { id: "section-13", title: "13. Changes to this Policy" },
    { id: "section-14", title: "14. Contact & Inquiries" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground font-sans selection:bg-white/20 relative flex flex-col">
      {/* Background Dot Grid matching landing */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteHeader
          brand={brand}
          items={navItems}
          secondaryAction={{ label: "Log in", href: "/login" }}
          primaryAction={{ label: "Sign up", href: "/register" }}
          onNavigate={handleNavigate}
          variant="simple"
        />

        <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 w-full">
          {/* Header */}
          <div className="max-w-3xl mb-12 pb-8 border-b border-white/10">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
              Privacy Policy
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              Last revised: October 11, 2026
            </p>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-300">
              <p>
                We built Kriri to give teams a focused, real-time environment for planning and shipping software. Protecting your team&rsquo;s privacy and operational data is central to that mission. This policy details the information we collect, the lawful grounds we rely on, and how you maintain complete ownership of your workspace data. <strong className="text-white font-semibold">By accessing or using Kriri, you acknowledge these practices and agree to our processing of information as described below.</strong>
              </p>
              <p>
                Your workspace use is governed alongside our{" "}
                <a href="/terms" className="text-white underline underline-offset-4 hover:text-zinc-200">
                  Terms of Service
                </a>
                . For any privacy requests, questions, or accessible alternative formats, please reach out to us directly at{" "}
                <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4 hover:text-zinc-200">
                  privacy@kriri.app
                </a>
                .
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sticky Table of Contents */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-28 space-y-3">
                <span className="text-xs font-sans uppercase tracking-wider text-zinc-500 font-medium block">
                  Table of Contents
                </span>
                <nav className="space-y-1 font-sans">
                  {toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left py-1 text-sm font-sans transition-colors ${
                        activeSection === item.id
                          ? "text-white font-medium"
                          : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Document Body */}
            <div className="lg:col-span-8 space-y-12 text-[15px] leading-relaxed text-zinc-300">
              {/* Section 1 */}
              <section id="section-1" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  1. Personal Information We Collect
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    We collect personal information in three primary ways: information you provide directly, information collected automatically through your use of the Service, and information obtained from third-party integrations.
                  </p>
                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mt-2 mb-1.5">
                      1.1 Information You Provide Directly
                    </h3>
                    <ul className="list-disc list-outside pl-5 space-y-2">
                      <li>
                        <strong className="text-zinc-200">Account & Profile Data:</strong> First and last name, email address, authentication credentials (managed securely via Clerk), avatar or profile picture, job title, and organization name.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Workspace Content:</strong> Projects, boards, lists, Kanban cards, task titles, descriptions, due dates, milestones, labels, priority tags, comments, attachments, and team assignments that you create, edit, or upload within Kriri workspaces.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Communications Data:</strong> Inquiries, feedback, bug submissions, and support requests submitted when you contact customer support or email our team.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Billing & Transactional Data:</strong> For paid workspace tiers, transaction histories, subscription tier details, and billing contact information. Payment card numbers are tokenized and processed directly by our third-party payment processor; Kriri never stores raw credit card details.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mt-3 mb-1.5">
                      1.2 Information Collected Automatically
                    </h3>
                    <ul className="list-disc list-outside pl-5 space-y-2">
                      <li>
                        <strong className="text-zinc-200">Device & Technical Data:</strong> IP address, operating system type and version, browser type, hardware architecture, screen resolution, device identifiers, and network connection characteristics.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Usage & Telemetry Data:</strong> Views accessed within the Platform, features utilized, interactions with Kanban boards, session durations, referring URLs, performance logs, and error diagnostic metrics collected via our telemetry service (<strong className="text-zinc-200">PostHog</strong>).
                      </li>
                      <li>
                        <strong className="text-zinc-200">Real-Time WebSocket & Presence Logs:</strong> Timestamps, socket connection identifiers, and activity presence markers used to synchronize collaborative edits in real time across active workspace participants.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Cookies & Local Storage:</strong> Essential session cookies and local storage tokens required for user authentication, security verification, and workspace state persistence.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mt-3 mb-1.5">
                      1.3 Information from Third-Party Sources
                    </h3>
                    <ul className="list-disc list-outside pl-5 space-y-2">
                      <li>
                        <strong className="text-zinc-200">Authentication Providers (Clerk & SSO):</strong> When you sign up or log in using an external identity provider (such as Google or GitHub SSO via Clerk), we receive your verified email address, public profile name, and avatar as permitted by your third-party account permissions.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Collaborator Invitations:</strong> When a workspace administrator or teammate invites you to join a Kriri workspace, we receive your email address from that teammate.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="section-2" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  2. Tracking Technologies & Cookies
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    We use cookies, web beacons, and browser local storage mechanisms to power the Platform:
                  </p>
                  <ol className="list-decimal list-outside pl-5 space-y-2">
                    <li>
                      <strong className="text-zinc-200">Strictly Necessary Cookies:</strong> Essential for authenticating users, maintaining active login sessions (via Clerk), preventing Cross-Site Request Forgery (CSRF), and securing accounts. You cannot disable these without disabling access to the Service.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Functional & Preference Cookies:</strong> Remember your workspace preferences, such as sidebar state, active project view (Kanban vs. List), and display theme.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Analytics & Diagnostic Cookies:</strong> Operated via PostHog to analyze performance, track application errors, and measure feature adoption so we can optimize rendering speeds and query latency.
                    </li>
                  </ol>
                  <p>
                    We do <strong className="text-zinc-200">not</strong> use third-party advertising cookies or monetize user tracking data for cross-context behavioral advertising.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="section-3" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  3. How We Use Personal Information
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    We process personal information strictly for legitimate business and operational purposes:
                  </p>
                  <ul className="list-disc list-outside pl-5 space-y-1.5">
                    <li>
                      <strong className="text-zinc-200">Service Delivery & Real-Time Sync:</strong> Provisioning user accounts, authenticating sessions, loading projects, and broadcasting real-time task and comment updates across workspace members via WebSockets.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Account Administration & Support:</strong> Managing workspace permissions, sending onboarding confirmations, verifying team invitations, and responding to technical assistance requests.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Platform Security & Fraud Prevention:</strong> Detecting unauthorized access, mitigating brute-force attacks, verifying webhooks via Svix, and enforcing our Terms of Service.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Telemetry & Optimization:</strong> Analyzing usage trends and diagnostic crash logs to improve rendering speeds, UI responsiveness, and overall platform uptime.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Legal Compliance:</strong> Complying with applicable statutory obligations, tax rules, and lawful regulatory requests.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="section-4" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  4. How We Share Personal Information
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    Kriri does not sell, rent, or monetize your personal information. We share personal information only with the following trusted categories of recipients:
                  </p>
                  <ul className="list-disc list-outside pl-5 space-y-2">
                    <li>
                      <strong className="text-zinc-200">Authentication & Identity Providers:</strong> We utilize <strong className="text-zinc-200">Clerk</strong> to provide industry-standard, secure user authentication, identity verification, and SSO token handling.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Analytics & Observability Providers:</strong> We use <strong className="text-zinc-200">PostHog</strong> for product analytics, telemetry, and error monitoring under contractual privacy and data protection terms.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Cloud Infrastructure & Hosting:</strong> Reliable cloud hosting and managed PostgreSQL database providers that host our backend servers, encrypted databases, and WebSocket connections.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Team Members within Your Workspaces:</strong> Other authenticated members of workspaces you belong to can view your name, avatar, comments, assigned tasks, and collaborative activity within that workspace.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Legal Authorities & Protection:</strong> When we believe in good faith that disclosure is necessary to comply with a valid court order, law, or governmental request, or to protect the safety, rights, or property of Kriri, our users, or the public.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Corporate Transactions:</strong> In the event of an actual or prospective merger, acquisition, financing, reorganization, or sale of company assets, personal information may be disclosed to the acquiring entity subject to standard confidentiality protections.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="section-5" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  5. Customer Content Ownership & AI Safeguards
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">5.1 Customer Ownership.</strong> You and your organization retain full, unencumbered intellectual property ownership over all project boards, tasks, descriptions, comments, and attachments stored in Kriri.
                  </p>
                  <p>
                    <strong className="text-zinc-200">5.2 Zero AI Foundation Model Training.</strong> Kriri does <strong className="text-zinc-200">not</strong> sell, license, or feed private customer workspace content, tasks, or code snippets into public generative artificial intelligence models for foundation training. Any automated productivity or assistance features within Kriri operate strictly on your authorized context to assist your team.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="section-6" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  6. Data Retention
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    We retain your personal information for as long as your account remains active or as needed to provide you with the Service.
                  </p>
                  <p>
                    When you delete a task, project, or workspace, it is promptly removed from live production tables. We retain residual backup logs only for the minimum period required for disaster recovery (typically up to 30 days), compliance with accounting and tax regulations, or resolving legal disputes. Once retention periods expire, personal information is permanently purged or anonymized.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="section-7" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  7. Security Safeguards
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    We implement rigorous technical, administrative, and physical safeguards designed to protect personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc list-outside pl-5 space-y-1.5">
                    <li>Full TLS/HTTPS 1.3 encryption for all data in transit across web browsers, APIs, and WebSockets;</li>
                    <li>Industry-standard AES-256 encryption at rest for PostgreSQL database storage;</li>
                    <li>Delegated credential management with salted, cryptographic password hashing through Clerk;</li>
                    <li>Role-based access controls (RBAC) and least-privilege infrastructure permissions.</li>
                  </ul>
                  <p>
                    While we maintain rigorous security protocols, no method of transmission over the Internet or electronic storage system can be guaranteed to be 100% impenetrable.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="section-8" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  8. International Data Transfers
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    Kriri is operated from India. Our servers, databases, and third-party cloud infrastructure (including hosting, authentication, and real-time networking providers) are primarily located in the United States and other globally distributed cloud regions. If you access the Service from the European Economic Area (EEA), the United Kingdom, Switzerland, India, or other jurisdictions, your information will be transferred to, stored, and processed by cloud infrastructure located in the United States and other international facilities.
                  </p>
                  <p>
                    Where required by applicable law, we implement recognized transfer mechanisms—such as the European Commission's Standard Contractual Clauses (SCCs) and UK International Data Transfer Addendum—to ensure your personal data receives equivalent protection wherever processed.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="section-9" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  9. Your Rights & Choices
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    Regardless of where you reside, Kriri provides you with control over your personal data:
                  </p>
                  <ul className="list-disc list-outside pl-5 space-y-2">
                    <li>
                      <strong className="text-zinc-200">Access & Update:</strong> You can access, review, and update your profile information, password, and email address at any time via your account settings.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Workspace Data Export:</strong> Workspace owners can request an export of their projects, tasks, and team data in standard structured formats.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Account Deletion:</strong> You can delete your account and associated personal data at any time via your settings or by emailing <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Communications Opt-Out:</strong> You may unsubscribe from non-essential promotional communications by following the unsubscribe instructions in any promotional email. (Service-critical notices such as security alerts and billing confirmations cannot be opted out of while your account is active).
                    </li>
                    <li>
                      <strong className="text-zinc-200">Do Not Track:</strong> Some browsers transmit "Do Not Track" (DNT) signals. Because industry standards for DNT interpretation remain unsettled, our Service does not currently change its practices in response to DNT signals.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 10 */}
              <section id="section-10" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  10. State Privacy Rights Notice (United States)
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    This section applies to residents of California, Colorado, Connecticut, Virginia, Texas, Oregon, Utah, Montana, and other U.S. states with comprehensive consumer privacy statutes.
                  </p>
                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mt-2 mb-1.5">
                      10.1 California Consumer Privacy Act (CCPA / CPRA)
                    </h3>
                    <p>
                      During the preceding 12 months, we have collected the categories of personal information listed in Section 1 (Identifiers, Commercial Information, Internet/Network Activity, Geolocation based on IP, and Professional/Employment Data). We collect this data directly from you and your device to provide our collaborative workspace services.
                    </p>
                    <p className="mt-2">
                      <strong className="text-zinc-200">We do NOT "sell" personal information, nor do we "share" personal information for cross-context behavioral advertising.</strong> We do not collect or process "sensitive personal information" for purposes other than providing the core Service.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mt-3 mb-1.5">
                      10.2 Your Statutory Rights
                    </h3>
                    <p>Subject to verification of your identity, you have the right to:</p>
                    <ol className="list-decimal list-outside pl-5 space-y-1.5 mt-1.5">
                      <li><strong className="text-zinc-200">Know & Access:</strong> Request confirmation of whether we process your data and obtain a copy of the specific pieces of personal information collected.</li>
                      <li><strong className="text-zinc-200">Correct:</strong> Request correction of inaccurate personal information.</li>
                      <li><strong className="text-zinc-200">Delete:</strong> Request deletion of personal information collected from you, subject to statutory exceptions.</li>
                      <li><strong className="text-zinc-200">Non-Discrimination:</strong> Exercise your privacy rights without being denied services, charged different rates, or provided a degraded level of service quality.</li>
                    </ol>
                    <p className="mt-2">
                      To exercise these rights, submit a request to <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a> with "U.S. Privacy Request" in the subject line.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 11 */}
              <section id="section-11" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  11. Notice to European & United Kingdom Users (GDPR / UK GDPR)
                </h2>
                <div className="space-y-4 text-zinc-400">
                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mb-1.5">
                      11.1 Data Controller
                    </h3>
                    <p>
                      Kriri acts as the data controller for personal information processed under this Privacy Policy for individuals located in the European Economic Area (EEA), the United Kingdom, Switzerland, and internationally.
                    </p>
                    <p className="mt-1">
                      Contact: <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mb-2">
                      11.2 Legal Bases for Processing (GDPR Article 6)
                    </h3>
                    <div className="overflow-x-auto border border-white/10 rounded-2xl">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-[#18191c] text-zinc-200 border-b border-white/10">
                          <tr>
                            <th className="p-3 font-medium">Processing Activity</th>
                            <th className="p-3 font-medium">Data Categories</th>
                            <th className="p-3 font-medium">Legal Basis (GDPR Art. 6)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-400">
                          <tr>
                            <td className="p-3 text-zinc-200 font-medium">Account provisioning, workspace operations, real-time sync & collaboration</td>
                            <td className="p-3">Contact Data, Profile Data, Workspace Content, Transactional Data</td>
                            <td className="p-3"><strong className="text-zinc-200">Contractual Necessity</strong> (Art. 6(1)(b)) — required to fulfill our contract with you under our Terms of Service.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-zinc-200 font-medium">System security, fraud mitigation & webhook verification</td>
                            <td className="p-3">Device Data, IP Address, Connection Logs</td>
                            <td className="p-3"><strong className="text-zinc-200">Legitimate Interests</strong> (Art. 6(1)(f)) — our legitimate interest in safeguarding infrastructure, users, and platform integrity.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-zinc-200 font-medium">Product analytics, telemetry & platform optimization (PostHog)</td>
                            <td className="p-3">Usage Data, Device Metrics, Diagnostic Logs</td>
                            <td className="p-3"><strong className="text-zinc-200">Legitimate Interests</strong> (Art. 6(1)(f)) — our legitimate interest in monitoring error rates and improving application speed.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-zinc-200 font-medium">Customer support & direct user inquiries</td>
                            <td className="p-3">Communications Data, Contact Data</td>
                            <td className="p-3"><strong className="text-zinc-200">Contractual Necessity</strong> & <strong className="text-zinc-200">Legitimate Interests</strong> — resolving customer issues and maintaining service quality.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-zinc-200 font-medium">Legal compliance & dispute resolution</td>
                            <td className="p-3">Billing Records, Legal Inquiries</td>
                            <td className="p-3"><strong className="text-zinc-200">Compliance with Legal Obligations</strong> (Art. 6(1)(c)).</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mb-1.5">
                      11.3 European Data Subject Rights
                    </h3>
                    <p>If you are located in the EEA or UK, you have the following rights under the GDPR:</p>
                    <ul className="list-disc list-outside pl-5 space-y-1 mt-1.5">
                      <li><strong className="text-zinc-200">Right of Access (Art. 15):</strong> Obtain confirmation and a copy of your personal data.</li>
                      <li><strong className="text-zinc-200">Right to Rectification (Art. 16):</strong> Request correction of inaccurate personal data.</li>
                      <li><strong className="text-zinc-200">Right to Erasure (Art. 17):</strong> Request deletion of your personal data where retention is no longer justified.</li>
                      <li><strong className="text-zinc-200">Right to Restriction of Processing (Art. 18):</strong> Request temporary freezing of processing under certain legal conditions.</li>
                      <li><strong className="text-zinc-200">Right to Data Portability (Art. 20):</strong> Receive your data in a structured, commonly used, machine-readable format.</li>
                      <li><strong className="text-zinc-200">Right to Object (Art. 21):</strong> Object to processing based on legitimate interests or direct marketing.</li>
                      <li><strong className="text-zinc-200">Right to Withdraw Consent (Art. 7(3)):</strong> Withdraw consent at any time where processing was based on consent.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mb-1.5">
                      11.4 Right to Lodge a Complaint
                    </h3>
                    <p>
                      You have the right to lodge a complaint with your local data protection supervisory authority. UK residents may contact the Information Commissioner's Office (ICO) at Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF, Tel: +44 303 123 1113, website: <a href="https://ico.org.uk" target="_blank" rel="noreferrer" className="text-white underline underline-offset-4">ico.org.uk</a>. EEA residents may contact their national supervisory authority listed by the European Data Protection Board.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 12 */}
              <section id="section-12" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  12. Children's Privacy
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    The Service is designed strictly for business professionals and individuals aged 18 and older. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that a minor under 18 has registered an account or provided us with personal data, we will take immediate steps to delete such data from our records.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="section-13" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  13. Changes to this Privacy Policy
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    We may update this Privacy Policy from time to time to reflect modifications in our technology, legal requirements, or operational practices. If we make material changes, we will notify you by updating the "Last Revised" date at the top of this policy and, where appropriate, posting a prominent notice on the Platform or sending you an email notification. Your continued use of the Service after the effective date of an updated policy constitutes your acknowledgment of the updated terms.
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section id="section-14" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  14. Contact & Inquiries
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    If you have questions, comments, or statutory requests regarding this Privacy Policy or our data protection practices, please contact our team:
                  </p>
                  <p className="text-zinc-200">
                    <strong>Kriri</strong><br />
                    Attention: Privacy & Compliance<br />
                    Email: <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a><br />
                    Website: <a href="https://kriri.app" className="text-white underline underline-offset-4">https://kriri.app</a>
                  </p>
                </div>
              </section>

              <div className="pt-8 border-t border-white/5 text-xs text-zinc-500">
                This document was adapted from attorney-drafted templates made publicly available by General Legal, PC under CC0 1.0 Universal.
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
