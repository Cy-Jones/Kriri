# Kriri Privacy Policy

**Last Revised:** October 11, 2026  
**Effective Date:** October 11, 2026  
**Version:** 1.0

Kriri ("**Kriri**," "**we**," "**us**," or "**our**") operates the collaborative workspace and real-time project management platform located at [kriri.app](https://kriri.app) (the "**Site**" or "**Platform**") and related services, software, and applications (collectively, the "**Service**").

This Privacy Policy explains how Kriri collects, uses, retains, and discloses personal information when you access or interact with our Service, communicate with us, or register an account. It also describes your rights and choices regarding your personal data under applicable data privacy laws, including the California Consumer Privacy Act (CCPA/CPRA), other U.S. state privacy laws, and the European Union and United Kingdom General Data Protection Regulation (GDPR / UK GDPR).

> **California Notice at Collection & State Privacy Rights:** See Section 10 below for disclosures required under California, Colorado, Connecticut, Virginia, Texas, and other state privacy laws.
> 
> **Notice to European & UK Users:** See Section 11 below for details on data controller status, GDPR legal bases, international cross-border transfers, and European data subject rights.

---

## 1. Personal Information We Collect

We collect personal information in three primary ways: information you provide directly, information collected automatically through your use of the Service, and information obtained from third-party integrations.

### 1.1 Information You Provide Directly
* **Account & Profile Data:** First and last name, email address, password or authentication credentials (managed securely via Clerk), avatar or profile picture, job title, and organization name.
* **Workspace Content:** Projects, boards, lists, Kanban cards, task titles, descriptions, due dates, milestones, labels, priority tags, comments, attachments, and team assignments that you create, edit, or upload within Kriri workspaces.
* **Communications Data:** Messages, inquiries, feedback, and support tickets submitted when you contact our customer support, report bugs, or email us.
* **Billing & Transaction Data:** If you purchase a paid workspace tier, transactional records such as subscription plan details, billing address, and transaction histories. (Payment card details are tokenized and processed directly by our third-party payment processor; Kriri never stores raw credit card numbers).

### 1.2 Information Collected Automatically
* **Device & Technical Data:** IP address, operating system type and version, browser type, hardware architecture, screen resolution, device identifiers, and network connection characteristics.
* **Usage & Telemetry Data:** Pages and views visited within the Platform, features used, interactions with Kanban boards and task lists, session durations, referring URLs, performance logs, and error diagnostic metrics collected via our telemetry service (**PostHog**).
* **Real-Time WebSocket & Connection Logs:** Timestamps, socket connection identifiers, and activity presence markers used to synchronize collaborative edits in real time across active workspace participants.
* **Cookies & Local Storage:** Essential session cookies and local storage tokens required for user authentication, security verification, and workspace state persistence.

### 1.3 Information from Third-Party Sources
* **Authentication Providers (Clerk & SSO):** When you sign up or log in using an external identity provider (such as Google or GitHub SSO via Clerk), we receive your verified email address, public profile name, and avatar as permitted by your third-party account permissions.
* **Collaborator Invitations:** When a workspace administrator or teammate invites you to join a Kriri workspace, we receive your email address from that teammate.

---

## 2. Tracking Technologies & Cookies

We use cookies, web beacons, and local storage mechanisms to power the Platform:
1. **Strictly Necessary Cookies:** Essential for authenticating users, maintaining active login sessions (via Clerk), preventing Cross-Site Request Forgery (CSRF), and securing accounts. You cannot disable these without disabling access to the Service.
2. **Functional & Preference Cookies:** Remember your workspace preferences, such as sidebar collapsed state, active project view (Kanban vs. List), and display theme.
3. **Analytics & Diagnostic Cookies:** Operated via PostHog to analyze performance, track application errors, and measure feature adoption so we can optimize speed and reliability.

We do **not** use third-party advertising cookies or sell your personal information for cross-context behavioral advertising.

---

## 3. How We Use Your Personal Information

We process personal information strictly for legitimate business and operational purposes:
* **Service Delivery & Real-Time Sync:** Provisioning user accounts, authenticating sessions, loading projects, and broadcasting real-time task and comment updates across workspace members via WebSockets.
* **Account Administration & Support:** Managing workspace permissions, sending onboarding messages, confirming invitations, and responding to technical assistance requests.
* **Platform Security & Fraud Prevention:** Detecting unauthorized access, mitigating brute-force attacks, verifying webhooks via Svix, and enforcing our Terms of Service.
* **Telemetry & Optimization:** Analyzing usage trends and diagnostic crash logs to improve rendering speeds, UI responsiveness, and overall platform uptime.
* **Legal Compliance:** Complying with applicable statutory obligations, tax rules, and lawful regulatory requests.

---

## 4. How We Share Personal Information

Kriri does not sell, rent, or monetize your personal information. We share personal information only with the following trusted categories of recipients:

* **Authentication & Identity Providers:** We utilize **Clerk** to provide industry-standard, secure user authentication, identity verification, and SSO token handling.
* **Analytics & Observability Providers:** We use **PostHog** for product analytics, telemetry, and error monitoring. PostHog processes technical usage metrics in accordance with privacy safeguards.
* **Cloud Infrastructure & Hosting:** Reliable cloud hosting and managed PostgreSQL database providers that host our backend servers, encrypted databases, and WebSocket connections.
* **Team Members within Your Workspaces:** Other authenticated members of workspaces you belong to can view your name, avatar, comments, assigned tasks, and collaborative activity within that workspace.
* **Legal Authorities & Protection:** When we believe in good faith that disclosure is necessary to comply with a valid court order, law, or governmental request, or to protect the safety, rights, or property of Kriri, our users, or the public.
* **Corporate Transactions:** In the event of an actual or prospective merger, acquisition, financing, reorganization, or sale of company assets, your personal information may be transferred to the acquiring entity subject to standard confidentiality protections.

---

## 5. User Content Ownership & AI Safeguards

* **Customer Ownership:** You and your team retain full ownership of all project data, task descriptions, comments, and attachments stored in Kriri.
* **No Unauthorized AI Model Training:** Kriri does **not** sell, license, or feed your proprietary workspace content, tasks, or code snippets to public AI training datasets. Any automated productivity or AI features in Kriri operate strictly on your authorized context to assist your team.

---

## 6. Data Retention

We retain your personal information for as long as your account remains active or as needed to provide you with the Service. 

When you delete a task, project, or entire workspace, it is promptly removed from live production databases. We retain residual backup logs only for the minimum period required for disaster recovery (typically up to 30 days), compliance with accounting and tax regulations, or resolving legal disputes. Once retention periods expire, personal information is permanently purged or anonymized.

---

## 7. Security Safeguards

We implement rigorous technical, administrative, and physical safeguards designed to protect personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:
* Full TLS/HTTPS encryption for all data in transit across web browsers, APIs, and WebSockets;
* Industry-standard encryption at rest for our PostgreSQL database storage;
* Delegated credential storage with salted, cryptographic password hashing through Clerk;
* Role-based access controls (RBAC) and least-privilege infrastructure permissions.

Please understand that no transmission over the Internet or electronic storage system can be guaranteed to be 100% impenetrable.

---

## 8. International Data Transfers

Kriri is operated from India. Our servers, databases, and third-party cloud infrastructure (including hosting, authentication, and real-time networking providers) are primarily located in the United States and other globally distributed cloud regions. If you access the Service from the European Economic Area (EEA), the United Kingdom, Switzerland, India, or other jurisdictions, your information will be transferred to, stored, and processed by cloud infrastructure located in the United States and other international facilities.

Where required by applicable law, we implement recognized transfer mechanisms—such as the European Commission’s Standard Contractual Clauses (SCCs) and UK International Data Transfer Addendum—to ensure your personal data receives equivalent protection wherever processed.

---

## 9. Your Rights & Choices

Regardless of where you reside, Kriri provides you with control over your personal data:
* **Access & Update:** You can access, review, and update your profile information, password, and email address at any time via your account settings.
* **Workspace Data Export:** Workspace owners can request an export of their projects, tasks, and team data in standard structured formats.
* **Account Deletion:** You can delete your account and associated personal data at any time via your settings or by emailing [privacy@kriri.app](mailto:privacy@kriri.app).
* **Communications Opt-Out:** You may unsubscribe from non-essential promotional communications by following the unsubscribe instructions in any promotional email. (Service-critical notices such as security alerts and billing confirmations cannot be opted out of while your account is active).
* **Do Not Track:** Some browsers transmit "Do Not Track" (DNT) signals. Because industry standards for DNT interpretation remain unsettled, our Service does not currently change its practices in response to DNT signals.

---

## 10. State Privacy Rights Notice (United States)

This section applies to residents of California, Colorado, Connecticut, Virginia, Texas, Oregon, Utah, Montana, and other U.S. states with comprehensive consumer privacy statutes.

### 10.1 California Consumer Privacy Act (CCPA / CPRA)
During the preceding 12 months, we have collected the categories of personal information listed in Section 1 (Identifiers, Commercial Information, Internet/Network Activity, Geolocation based on IP, and Professional/Employment Data). We collect this data directly from you and your device to provide our collaborative workspace services.

**We do NOT "sell" personal information, nor do we "share" personal information for cross-context behavioral advertising.** We do not collect or process "sensitive personal information" for purposes other than providing the core Service.

### 10.2 Your Statutory Rights
Subject to verification of your identity, you have the right to:
1. **Know & Access:** Request confirmation of whether we process your data and obtain a copy of the specific pieces of personal information collected.
2. **Correct:** Request correction of inaccurate personal information.
3. **Delete:** Request deletion of personal information collected from you, subject to legal exceptions.
4. **Non-Discrimination:** Exercise your privacy rights without being denied services, charged different prices, or provided a different quality of service.

To exercise these rights, submit a request to [privacy@kriri.app](mailto:privacy@kriri.app) with "U.S. Privacy Request" in the subject line.

---

## 11. Notice to European & United Kingdom Users (GDPR / UK GDPR)

### 11.1 Data Controller
Kriri acts as the data controller for personal information processed under this Privacy Policy for individuals located in the European Economic Area (EEA), the United Kingdom, Switzerland, and internationally.

Contact: [privacy@kriri.app](mailto:privacy@kriri.app)

### 11.2 Legal Bases for Processing
Under Article 6 of the GDPR, we process your personal data on the following legal bases:

| Purpose / Processing Activity | Categories of Data | Legal Basis (GDPR Art. 6) |
| :--- | :--- | :--- |
| **Account provisioning, workspace operations, real-time collaboration & task syncing** | Contact Data, Profile Data, Workspace Content, Transactional Data | **Contractual Necessity** (Art. 6(1)(b)) — required to fulfill our contract with you under our Terms of Service. |
| **System security, fraud mitigation & webhook verification** | Device Data, IP Address, Connection Logs | **Legitimate Interests** (Art. 6(1)(f)) — our legitimate interest in safeguarding our infrastructure, users, and data integrity. |
| **Product analytics, telemetry & platform optimization (PostHog)** | Usage Data, Device Metrics, Diagnostic Logs | **Legitimate Interests** (Art. 6(1)(f)) — our legitimate interest in understanding product usage and enhancing platform performance. |
| **Customer support & direct user inquiries** | Communications Data, Contact Data | **Contractual Necessity** & **Legitimate Interests** — resolving user issues and delivering effective service. |
| **Legal compliance & statutory dispute resolution** | Billing Records, Legal Inquiries | **Compliance with Legal Obligations** (Art. 6(1)(c)). |

### 11.3 European Data Subject Rights
If you are located in the EEA or UK, you have the following rights under the GDPR:
* **Right of Access** (Art. 15): Obtain confirmation and a copy of your personal data.
* **Right to Rectification** (Art. 16): Request correction of inaccurate personal data.
* **Right to Erasure** ("Right to be Forgotten", Art. 17): Request deletion of your personal data.
* **Right to Restriction of Processing** (Art. 18): Request restriction of processing under certain circumstances.
* **Right to Data Portability** (Art. 20): Receive your data in a structured, commonly used, machine-readable format.
* **Right to Object** (Art. 21): Object to processing based on legitimate interests or direct marketing.
* **Right to Withdraw Consent** (Art. 7(3)): Withdraw consent at any time where processing was based on consent.

To exercise any of these rights, email [privacy@kriri.app](mailto:privacy@kriri.app). You also have the right to lodge a complaint with your local data protection supervisory authority (e.g., the UK Information Commissioner’s Office at [ico.org.uk](https://ico.org.uk) or your respective EEA Data Protection Authority).

---

## 12. Children's Privacy

The Service is designed strictly for business professionals and individuals aged 18 and older. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that a child under 18 has registered an account or provided us with personal data, we will take immediate steps to delete such data from our records.

---

## 13. Changes to this Privacy Policy

We may update this Privacy Policy from time to time to reflect modifications in our technology, legal requirements, or operational practices. If we make material changes, we will notify you by updating the "Last Revised" date at the top of this policy and, where appropriate, posting a prominent notice on the Platform or sending you an email notification. Your continued use of the Service after the effective date of an updated policy constitutes your acknowledgment of the updated terms.

---

## 14. Contact Us

If you have questions, comments, or requests regarding this Privacy Policy or our data protection practices, please contact our team:

**Kriri**  
Attention: Privacy & Compliance  
Email: [privacy@kriri.app](mailto:privacy@kriri.app)  
Website: [https://kriri.app](https://kriri.app)

---

*This document was adapted from attorney-drafted templates made publicly available by General Legal, PC under CC0 1.0 Universal.*
