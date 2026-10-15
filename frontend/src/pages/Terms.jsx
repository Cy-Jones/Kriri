import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/registry/blocks/site-header/site-header";
import { Footer } from "@/components/landing/Footer";

export default function Terms() {
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
    { id: "section-1", title: "1. Accounts & Workspaces" },
    { id: "section-2", title: "2. Access to the Service & IP" },
    { id: "section-3", title: "3. User Content & Ownership" },
    { id: "section-4", title: "4. Privacy & Data Processing" },
    { id: "section-5", title: "5. Third-Party Integrations" },
    { id: "section-6", title: "6. Disclaimers" },
    { id: "section-7", title: "7. Limitation of Liability" },
    { id: "section-8", title: "8. Indemnification" },
    { id: "section-9", title: "9. Term & Termination" },
    { id: "section-10", title: "10. State-Specific Notices" },
    { id: "section-11", title: "11. Dispute Resolution & Arbitration" },
    { id: "section-12", title: "12. General Provisions" },
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
      {/* Background Dot Grid */}
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
              Terms of Service
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              Last revised: October 11, 2026
            </p>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-300">
              <p>
                These Terms of Service define the terms and conditions under which Kriri (&ldquo;Kriri&rdquo;) provides access to our collaborative workspaces, boards, and real-time infrastructure. <strong className="text-white font-semibold">By creating an account or accessing the Service, you agree to be bound by these Terms and all incorporated policies.</strong>
              </p>
              <p>
                Our collection and processing of personal data is governed in tandem with our{" "}
                <a href="/privacy" className="text-white underline underline-offset-4 hover:text-zinc-200">
                  Privacy Policy
                </a>
                . If you have questions, dispute notices, or require this agreement in an alternative format, please reach out to us directly at{" "}
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
              <div className="sticky top-28 space-y-3 pl-1">
                <span className="text-xs font-sans uppercase tracking-wider text-zinc-500 font-semibold block">
                  Table of Contents
                </span>
                <nav className="space-y-1.5 font-sans">
                  {toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left py-1 text-[13px] font-sans transition-colors ${
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
                  1. Accounts & Workspaces
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">1.1 Creating an Account.</strong> Certain features of the Service require you to register for an account. When you register, you agree to provide accurate, current, and complete information and to keep that information current. You can delete your account at any time by following the instructions on the Service or by contacting <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>. We may suspend or terminate your account as described in Section 9.
                  </p>
                  <p>
                    <strong className="text-zinc-200">1.2 Account Security.</strong> You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. If you believe your account has been accessed without your authorization, please notify us immediately at <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>. We are not liable for any losses resulting from your failure to keep your credentials secure.
                  </p>
                  <p>
                    <strong className="text-zinc-200">1.3 Workspace Administration.</strong> Workspace administrators are responsible for managing member invitations, configuring user permissions, regulating workspace access, and monitoring compliance with organizational policies within their respective workspaces.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="section-2" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  2. Access to the Service & Intellectual Property
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">2.1 License.</strong> Subject to these Terms, Kriri grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal collaborative project management and workspace operations in accordance with your account subscription tier.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2.2 Restrictions.</strong> You may not: (i) license, sell, rent, lease, transfer, assign, distribute, or commercially exploit the Service or any content on it; (ii) modify, create derivative works from, disassemble, reverse-compile, or reverse-engineer any part of the Service; (iii) access the Service in order to build a similar or competing product or service; (iv) copy, reproduce, distribute, republish, download, display, post, or transmit any part of the Service except as expressly permitted by these Terms; or (v) interfere with or disrupt WebSocket streams, rate limits, infrastructure integrity, or backend databases. All copyright and proprietary notices on the Service must be kept intact on any copies you are permitted to make.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2.3 Changes to the Service.</strong> We may modify, suspend, or discontinue the Service (or any part of it) at any time, with or without notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2.4 No Support Obligation.</strong> While we endeavor to provide responsive customer assistance, we have no legal obligation to provide you with ongoing support or maintenance for the Service unless expressly agreed in an enterprise service agreement.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2.5 Ownership.</strong> All intellectual property rights in the Service and its content—including copyrights, patents, trademarks, trade secrets, interface designs, icons, algorithms, and documentation—belong to Kriri or its suppliers. These Terms do not transfer any ownership rights to you, except for the limited access rights in Section 2.1. All rights not expressly granted are reserved.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2.6 Feedback.</strong> If you share feedback, feature requests, or suggestions about the Service with us, you grant us a perpetual, irrevocable, worldwide, non-exclusive, fully-paid, royalty-free license to use that feedback freely, in any manner and for any purpose, without attribution or compensation. Please do not submit any feedback that you consider proprietary or confidential.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="section-3" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  3. User Content & Workspace Ownership
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">3.1 Customer Ownership.</strong> You and your workspace members retain sole and exclusive ownership of all project boards, tasks, milestones, comments, text, files, and data ("User Content") submitted, uploaded, or transmitted to Kriri. Kriri claims no intellectual property ownership over your User Content.
                  </p>
                  <p>
                    <strong className="text-zinc-200">3.2 Limited Service License.</strong> You grant Kriri a worldwide, non-exclusive, royalty-free license strictly to host, cache, display, replicate, and synchronize your User Content as necessary to deliver, operate, and maintain the workspace Service to you and your designated team collaborators.
                  </p>
                  <p>
                    <strong className="text-zinc-200">3.3 Zero AI Foundation Model Training.</strong> Kriri does not sell, license, publish, or feed private customer workspace content into public generative artificial intelligence models for foundation training. Any automated features within Kriri operate solely on your authorized workspace context to assist your team.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="section-4" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  4. Privacy & Data Processing
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">4.1 Processing of Personal Data.</strong> Your use of the Service is governed by our Privacy Policy, located at <a href="/privacy" className="text-white underline underline-offset-4">kriri.app/privacy</a>, which is incorporated into these Terms by reference. By using the Service, you acknowledge that you have read and understand our Privacy Policy and that Kriri will process your personal data in accordance with that policy. If there is an irreconcilable conflict between these Terms and the Privacy Policy with respect to the collection, use, or processing of personal data, the Privacy Policy controls.
                  </p>
                  <p>
                    <strong className="text-zinc-200">4.2 Cookies & Tracking Technologies.</strong> The Service uses essential session cookies, local storage tokens, and diagnostic telemetry (PostHog) to manage authentication, maintain state, and optimize performance. For details on how tracking technologies operate, please consult our Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="section-5" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  5. Third-Party Integrations & Other Users
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">5.1 Third-Party Services.</strong> The Service integrates with or relies upon third-party services and infrastructure, including authentication (Clerk), telemetry (PostHog), and cloud hosting/database infrastructure (collectively, "Third-Party Services"). We do not control, endorse, or take responsibility for any Third-Party Services. You use all Third-Party Services at your own risk, and you acknowledge that each provider's respective terms and privacy practices apply to such use.
                  </p>
                  <p>
                    <strong className="text-zinc-200">5.2 Other Users.</strong> Your interactions with other users within workspaces are solely between you and those users. Kriri is not responsible for any loss or harm resulting from those interactions, and we reserve the right, but have no obligation, to intervene in disputes between workspace users.
                  </p>
                  <p>
                    <strong className="text-zinc-200">5.3 Release & Waiver of California Civil Code § 1542.</strong> To the fullest extent permitted by law, you release Kriri and its officers, employees, agents, successors, and assigns from all claims, demands, and damages of every kind arising out of or related to disputes with other users or Third-Party Services. If you are a California resident, you expressly waive California Civil Code Section 1542, which provides: <em>"A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party."</em>
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="section-6" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  6. Disclaimers
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p className="uppercase text-xs sm:text-sm tracking-wide leading-relaxed font-mono text-zinc-300">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT PERMITTED BY LAW, KRIRI AND ITS SUPPLIERS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL CODE. WHERE APPLICABLE LAW REQUIRES WARRANTIES, THEY ARE LIMITED TO 90 DAYS FROM YOUR FIRST USE.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="section-7" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  7. Limitation of Liability
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p className="uppercase text-xs sm:text-sm tracking-wide leading-relaxed font-mono text-zinc-300">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW: (A) KRIRI AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY LOST PROFITS, LOST DATA, COSTS OF SUBSTITUTE PRODUCTS OR SERVICES, OR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF (OR INABILITY TO USE) THE SERVICE; AND (B) OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING UNDER THESE TERMS IS CAPPED AT THE GREATER OF (i) $50 USD AND (ii) THE AMOUNT PAID TO KRIRI BY YOU UNDER THESE TERMS IN THE TWELVE (12) MONTHS PRIOR TO THE INCIDENT GIVING RISE TO THE CLAIM. THE EXISTENCE OF MULTIPLE CLAIMS DOES NOT INCREASE THIS CAP.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="section-8" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  8. Indemnification
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    You agree to defend, indemnify, and hold harmless Kriri, its officers, directors, employees, and agents from any claims, damages, liabilities, losses, costs, and reasonable attorneys' fees arising out of: (i) your use of or access to the Service; (ii) your User Content; (iii) your violation of these Terms; or (iv) your violation of any applicable law or third-party rights. Kriri reserves the right, at your expense, to assume exclusive defense and control of any matter subject to indemnification by you, and you agree to cooperate fully with our defense. You agree not to settle any claim without Kriri's prior written consent.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="section-9" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  9. Term & Termination
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    These Terms remain in full effect while you use the Service. You may terminate your account at any time via your workspace profile settings. We may suspend or terminate your access (including suspending access to or deleting your account) at any time and for any reason, including if we reasonably believe you have violated these Terms or compromised system integrity. We are not liable to you for any such termination. Upon termination, Sections 2.2 through 2.6 and Sections 3 through 12 will survive indefinitely.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="section-10" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  10. State-Specific Legal Notices
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    The provisions in this Section 10 apply only to users to the extent such users are subject to the laws of the applicable states identified below. If a provision in this section conflicts with another provision of these Terms, the state-specific provision controls for users subject to that state's laws.
                  </p>
                  <p>
                    <strong className="text-zinc-200">10.1 Consumer Notice.</strong> The provider of the Service is Kriri. To file a complaint regarding the Service or to receive further information regarding use of the Service, contact us at <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>.
                  </p>
                  <p>
                    <strong className="text-zinc-200">10.2 State and Regional Inquiries.</strong> Additional privacy statutes grant rights of access, correction, and deletion. For details on how to exercise these statutory rights, please review Section 10 of our Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="section-11" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  11. Dispute Resolution & Binding Individual Arbitration
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p className="text-zinc-300 font-medium">
                    Please read this section carefully. It affects your legal rights, including your right to sue in court and your right to a jury trial.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.1 Applicability.</strong> Except as described below, you and Kriri agree to resolve all disputes arising out of or relating to the Service, software, or these Terms through binding individual arbitration—not in court. Exceptions include: (i) claims that qualify for small claims court, brought on an individual basis; and (ii) requests for equitable relief related to intellectual property (such as trademarks, trade secrets, copyrights, or patents). This arbitration agreement applies to all claims, including those that arose before you agreed to these Terms.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.2 Try to Resolve First.</strong> Before starting arbitration, the parties agree to try to resolve the dispute informally. The party raising the dispute must send written notice (an "Informal Notice") to the other party. Within 45 days of receiving that Informal Notice, the parties will meet by phone or video in good faith to try to resolve the matter. Kriri's notice address: <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>. If the informal dispute resolution process does not resolve the dispute within 60 days of the notice, either party may commence arbitration.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.3 Arbitration Rules.</strong> Arbitrations will be administered by JAMS (<a href="https://www.jamsadr.com" target="_blank" rel="noreferrer" className="text-white underline underline-offset-4">www.jamsadr.com</a>). Claims under $250,000 (excluding fees and interest) will use JAMS' Streamlined Arbitration Rules; larger claims will use JAMS' Comprehensive Arbitration Rules. Unless the parties agree otherwise, arbitration will be conducted in the county where you live or remotely. All arbitration materials, submissions, and hearings are confidential.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.4 Arbitration Request Requirements.</strong> The arbitration demand must include: (i) your contact information and account email; (ii) a detailed description of the claims and supporting facts; (iii) the specific relief sought and a good-faith damages estimate; (iv) confirmation that you completed the informal resolution process; and (v) proof of any required filing fee payment.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.5 Authority of Arbitrator.</strong> The arbitrator has authority to resolve all arbitrable disputes, including questions about the scope and enforceability of this arbitration agreement—except that courts (not arbitrators) will decide: (i) challenges to the class action waiver below; (ii) disputes about arbitration fees; (iii) whether a condition precedent to arbitration has been satisfied; and (iv) which version of this agreement applies. The arbitrator may award the same individual relief as a court. The arbitrator's award is final and binding, and judgment may be entered in any court with jurisdiction.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.6 Waiver of Jury Trial.</strong> BY AGREEING TO ARBITRATION, YOU AND KRIRI WAIVE THE RIGHT TO A TRIAL BY JUDGE OR JURY FOR ALL COVERED CLAIMS.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.7 Waiver of Class Actions.</strong> ALL DISPUTES MUST BE BROUGHT ON AN INDIVIDUAL BASIS. NEITHER YOU NOR KRIRI MAY BRING CLAIMS AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, REPRESENTATIVE, OR COLLECTIVE PROCEEDING. The arbitrator may only award relief on an individual basis. If a court finds this class action waiver unenforceable as to a specific claim, that claim may be litigated in court; all other claims remain subject to binding arbitration.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.8 Attorneys' Fees.</strong> Each party bears its own attorneys' fees unless the arbitrator finds a claim was frivolous or brought for an improper purpose under Rule 11 of the Federal Rules of Civil Procedure.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.9 Batch Arbitration.</strong> If 25 or more substantially similar arbitration demands are filed against Kriri within a 30-day period by the same law firm or coordinated group, JAMS will batch them into groups of up to 25 and appoint one arbitrator per batch, with one set of fees per batch, to promote fair and efficient resolution.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.10 30-Day Opt-Out.</strong> You may opt out of this arbitration agreement within 30 days of first accepting these Terms by sending written notice to <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>. Your notice must include your name, account email address, and a clear statement that you wish to opt out of binding arbitration. Opting out does not affect any other provision of these Terms.
                  </p>
                  <p>
                    <strong className="text-zinc-200">11.11 Severability.</strong> If any part of this arbitration agreement is found invalid or unenforceable, it will be modified to the minimum extent necessary to make it enforceable; the remainder of the agreement remains in full effect.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section id="section-12" className="space-y-4 pt-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  12. General Provisions
                </h2>
                <div className="space-y-3 text-zinc-400">
                  <p>
                    <strong className="text-zinc-200">12.1 Changes to Terms.</strong> We may update these Terms from time to time. If we make material changes, we will notify you by updating the "Last Revised" date and, where appropriate, posting a notice on the Service or sending an email notification. Your continued use of the Service after changes take effect indicates your acceptance of the updated Terms.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.2 Governing Law & Jurisdiction.</strong> These Terms and any dispute arising out of or related to these Terms or the Service will be governed by applicable law without regard to conflict-of-law principles.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.3 Export Compliance.</strong> You agree not to export, re-export, or transfer any technical data or products acquired from the Service in violation of applicable export control laws or sanctions.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.4 Electronic Communications.</strong> By using the Service, you consent to receiving communications from us electronically (via email or notices on the Service). These electronic communications satisfy any statutory requirement for written notice.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.5 Accessibility Commitment.</strong> Kriri is committed to making the Service accessible to all users, including individuals with disabilities. If you experience difficulty accessing the Service, contact <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.6 Entire Agreement & Severability.</strong> These Terms (together with our Privacy Policy) constitute the entire agreement between you and Kriri regarding the Service.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.7 Copyright & Trademark Notice.</strong> Copyright © 2026 Kriri. All rights reserved.
                  </p>
                  <p>
                    <strong className="text-zinc-200">12.8 Contact Information.</strong> For inquiries: Email <a href="mailto:privacy@kriri.app" className="text-white underline underline-offset-4">privacy@kriri.app</a>.
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
