"""Curriculum lessons. Content is Markdown (headings, paragraphs, lists, **bold**, `code`, > quotes)."""

BEGINNER = "beginner"
INTERMEDIATE = "intermediate"
ADVANCED = "advanced"

LESSONS = [
    # ------------------------------------------------------------------ Phishing
    {
        "category": "phishing",
        "slug": "phishing-red-flags-in-10-minutes",
        "title": "Phishing Red Flags in 10 Minutes",
        "summary": "Learn the core signals that separate routine email from credential theft.",
        "difficulty": BEGINNER,
        "minutes": 10,
        "tags": ["phishing", "email", "awareness"],
        "content": """## Why phishing works
Phishing is the most common way attackers get their first foothold. It works because it targets people, not software: the message is designed to make you act before you think.

## The six red flags
1. **Sender mismatch** - the display name says "IT Service Desk" but the address is `support@micros0ft-security.com`. Always read the real address, not the name.
2. **Urgency or threats** - "Your account will be suspended in 30 minutes." Legitimate teams rarely need action in minutes.
3. **Unexpected requests for secrets** - passwords, MFA codes, or gift cards are never requested by email by a genuine colleague.
4. **Mismatched links** - hover before you click. The visible text may say `portal.company.com` while the destination is somewhere else.
5. **Odd attachments** - invoices as `.html`, `.iso`, or macro-enabled Office files, or any attachment you were not expecting.
6. **Generic greetings and small errors** - "Dear customer", odd grammar, or a logo that looks slightly off.

## Lookalike domains
Attackers register domains that are one character away from the real one:

- `rn` instead of `m` (`rnicrosoft.com`)
- `0` instead of `o` (`micros0ft.com`)
- extra words (`company-login-secure.com`)
- a different top-level domain (`company.co` vs `company.com`)

## What to do
- **Do not reply, click, or open attachments.**
- Use the **Report phishing** button, or forward the message to the security mailbox.
- If you already clicked or typed a password, **report it immediately**. Speed matters far more than embarrassment.

> Rule of thumb: if a message makes you feel rushed, scared, or curious, slow down. That feeling is the attack.

## Operational checklist
- Verify the sender's real address and domain.
- Inspect links before entering credentials or sharing files.
- Confirm unusual requests through a second channel (call, chat).
- Report anything suspicious through the official channel.""",
    },
    {
        "category": "phishing",
        "slug": "spear-phishing-and-business-email-compromise",
        "title": "Spear Phishing and Business Email Compromise",
        "summary": "Understand targeted attacks that impersonate executives, vendors, and colleagues to move money or data.",
        "difficulty": INTERMEDIATE,
        "minutes": 12,
        "tags": ["phishing", "bec", "finance", "spear-phishing"],
        "content": """## Targeted, not random
**Spear phishing** is aimed at a specific person or team. Attackers research LinkedIn, press releases, and out-of-office replies so the message references real projects and real names.

**Business Email Compromise (BEC)** is the most costly form: the attacker impersonates an executive, supplier, or lawyer to trigger a payment or data transfer. There is often no link or attachment at all, so technical filters have little to catch.

## Common BEC patterns
- **CEO fraud** - "I'm in a meeting, need gift cards today. Keep this between us."
- **Vendor bank-detail change** - a real supplier thread is hijacked and new account details are supplied.
- **Payroll diversion** - an "employee" asks HR to change direct-deposit details.
- **Invoice fraud** - a genuine-looking invoice with altered payee details.
- **Attorney impersonation** - confidential, time-critical acquisition payments.

## Warning signs
- Pressure combined with secrecy or authority.
- A change to payment details or a new payee.
- The reply-to address differs from the sender address.
- The message avoids phone calls or meetings.

## Controls that stop BEC
1. **Out-of-band verification** - confirm payment changes by calling a **known** number (not one in the email).
2. **Dual approval** for new payees and changes to bank details.
3. **Cooling-off period** before first payment to a changed account.
4. **Mailbox hygiene** - external-sender banners, and MFA on every mailbox.

## If money has moved
Contact finance and security **immediately**. Banks can often recall or freeze transfers within the first hours, and the chance falls quickly after that.""",
    },
    {
        "category": "phishing",
        "slug": "smishing-vishing-and-qr-phishing",
        "title": "Smishing, Vishing, and QR Phishing",
        "summary": "Recognize phishing that arrives by text message, phone call, or QR code.",
        "difficulty": INTERMEDIATE,
        "minutes": 9,
        "tags": ["phishing", "smishing", "vishing", "qr-code"],
        "content": """## Beyond email
Attackers follow you to every channel. Filters on email are strong, so many campaigns now move to places with weaker controls.

## Smishing (SMS and chat)
Fake delivery notices, bank fraud alerts, and "your account is locked" texts. Links are often shortened or use freshly registered domains.

- Do not tap links in unexpected texts. Open the official app or type the address yourself.
- Banks and couriers will not ask for full PINs or one-time codes by text.

## Vishing (voice)
Callers pose as IT support, a bank fraud team, or a government agency. Caller ID is easily spoofed. Modern attacks may also use **AI-cloned voices** of family members or executives.

- Hang up and call back using a number from the official website or your card.
- Never read out a one-time passcode. Real staff never need it.
- Agree a **family or team code word** for urgent money requests.

## QR phishing ("quishing")
A QR code hides the destination URL, and it takes the user from a protected desktop to an unmanaged phone.

- Treat QR codes in emails, on parking meters, and on posters as **untrusted links**.
- Check the preview URL your phone shows before opening it.
- Never enter credentials after scanning a code from an unsolicited message.

## MFA fatigue
Attackers with a stolen password may spam approval prompts until a user taps "Approve". **Deny every prompt you did not initiate** and report it at once.""",
    },
    # ------------------------------------------------------------------ Passwords
    {
        "category": "password-security",
        "slug": "password-managers-and-mfa",
        "title": "Password Managers and MFA",
        "summary": "Create unique credentials and protect critical accounts with multi-factor authentication.",
        "difficulty": BEGINNER,
        "minutes": 10,
        "tags": ["password-security", "mfa", "password-manager", "awareness"],
        "content": """## The core problem
People reuse passwords. When one website is breached, attackers try the leaked pair on hundreds of other services: **credential stuffing**. One reused password can expose your whole digital life.

## Strong passwords
- **Length beats complexity.** A 16+ character passphrase (four or more random words) is stronger and easier to remember than `P@ssw0rd1!`.
- **Unique everywhere.** Never reuse a password across accounts.
- **Generated, not invented.** Let a password manager create random credentials.

## Password managers
A password manager stores unique passwords behind one strong master passphrase.

- Protect it with MFA and a long master passphrase you have never used elsewhere.
- It only autofills on the correct domain, which is a useful **anti-phishing check**: if it does not offer to fill, the site may be fake.
- Store recovery codes in the vault or a secure offline location.

## Multi-factor authentication
MFA adds a second proof. Not all factors are equal:

1. **Passkeys / FIDO2 security keys** - phishing-resistant; strongest option.
2. **Authenticator app (TOTP)** - good; can still be phished in real time.
3. **Push approval** - convenient; vulnerable to fatigue attacks (use number matching).
4. **SMS codes** - better than nothing; vulnerable to SIM-swap and interception.

## Priorities
Enable MFA first on **email, password manager, banking, and work accounts**. Your email account is the master key: password resets for everything else go there.

## Operational checklist
- One unique generated password per account.
- MFA on every account that offers it.
- Never share codes; nobody legitimate will ask for them.
- Check haveibeenpwned-style breach alerts and change exposed passwords.""",
    },
    {
        "category": "password-security",
        "slug": "how-passwords-are-attacked",
        "title": "How Passwords Are Attacked",
        "summary": "See how brute force, credential stuffing, password spraying, and hash cracking work, and how defenders respond.",
        "difficulty": INTERMEDIATE,
        "minutes": 12,
        "tags": ["password-security", "brute-force", "hashing", "authentication"],
        "content": """## Attack types
- **Brute force** - try every combination. Cost grows exponentially with length.
- **Dictionary attack** - try common words, names, and leaked passwords with mutations (`Summer2024!`).
- **Credential stuffing** - replay breached username/password pairs against other sites.
- **Password spraying** - try a few very common passwords (e.g. `Welcome1`) against **many** accounts to avoid lockouts.
- **Phishing and keyloggers** - steal the password directly, making strength irrelevant.

## How systems should store passwords
Servers should never store plaintext. They store a **salted, slow hash**:

- A **hash** is a one-way function of the password.
- A **salt** is a unique random value per user so identical passwords produce different hashes and precomputed *rainbow tables* fail.
- **Slow algorithms** (Argon2id, bcrypt, scrypt, PBKDF2) make each guess expensive. Fast hashes such as MD5 or plain SHA-1 are unsuitable.

## Defensive controls
1. **Rate limiting and lockouts** with monitoring for spray patterns (one IP, many accounts).
2. **MFA**, which defeats most password-only attacks.
3. **Breached-password screening** at password creation.
4. **Length-based policy**: encourage long passphrases; avoid forced periodic rotation that leads to `Password1`, `Password2`.
5. **Alerting** on impossible-travel and unusual sign-in patterns.

## Detection signals for analysts
- Many failed logins across many users from a small set of IPs.
- Successful login immediately after many failures.
- Logins from new countries followed by mailbox-rule creation.""",
    },
    # ------------------------------------------------------------------ Malware
    {
        "category": "malware",
        "slug": "malware-intake-basics",
        "title": "Malware Intake Basics",
        "summary": "Understand risky attachments, macros, and suspicious downloads.",
        "difficulty": BEGINNER,
        "minutes": 9,
        "tags": ["malware", "endpoint", "awareness"],
        "content": """## What is malware?
Malware is software built to harm, spy on, or take control of a device. Common families:

- **Virus / worm** - self-replicating code; worms spread over networks without user action.
- **Trojan** - looks legitimate but hides malicious behaviour.
- **Ransomware** - encrypts files and demands payment; often also steals data first ("double extortion").
- **Spyware / infostealer** - harvests passwords, browser cookies, and documents.
- **Keylogger** - records what you type.
- **Botnet client** - quietly makes your device part of an attacker's network.

## How it arrives
1. Email attachments (Office macros, ZIP files, `.iso`, `.lnk`).
2. Malicious downloads: cracked software, fake installers, fake browser updates.
3. Infected USB drives left in public places.
4. Compromised websites and malicious ads (malvertising).

## Warning signs of infection
- Sudden slowdowns, fans running with nothing open.
- Unknown programs or browser extensions.
- Security tools disabled without your action.
- Pop-ups, files renamed, or ransom notes.

## What to do
- **Do not open unexpected attachments.** Enable macros only on documents you trust and requested.
- Install software only from approved sources.
- Keep the OS and applications patched, and keep endpoint protection on.
- If you suspect infection: **disconnect from the network** (Wi-Fi off / unplug cable), **do not power off if instructed to preserve evidence**, and **notify security**. Do not try to clean it yourself.

## Operational checklist
- Preserve evidence: keep the message or file, note what you clicked.
- Isolate the endpoint if needed.
- Notify security through the incident channel.""",
    },
    {
        "category": "malware",
        "slug": "ransomware-prevention-and-response",
        "title": "Ransomware Prevention and Response",
        "summary": "How ransomware attacks unfold, the controls that limit damage, and the first steps when it hits.",
        "difficulty": ADVANCED,
        "minutes": 14,
        "tags": ["malware", "ransomware", "backups", "incident-response"],
        "content": """## Anatomy of an attack
Modern ransomware is usually a **human-operated intrusion**, not an accident:

1. **Initial access** - phishing, stolen VPN credentials, or an unpatched internet-facing service.
2. **Discovery and privilege escalation** - attackers map the network and obtain admin rights.
3. **Lateral movement** - spreading via remote desktop, PsExec, or stolen tokens.
4. **Data theft** - files are copied out for extortion.
5. **Defence evasion** - security tools are disabled and backups deleted.
6. **Encryption and ransom note** - typically launched at night or on weekends.

## Prevention layers
- **Patch** internet-facing systems quickly; prioritise known-exploited vulnerabilities.
- **MFA** on VPN, remote access, and all admin accounts.
- **Least privilege** - no daily-use accounts with domain admin rights.
- **Segmentation** so one infected host cannot reach everything.
- **EDR** with alerting on mass file modification and shadow-copy deletion.
- **Email and web filtering**; block macros from the internet.

## Backups: the 3-2-1 rule
Keep **3** copies of data, on **2** different media, with **1** offline or immutable. **Test restores** regularly: an untested backup is a hope, not a plan.

## First response
1. **Isolate** affected machines from the network immediately (do not wipe them).
2. **Escalate** to the incident response team and leadership.
3. **Preserve evidence**: memory, logs, ransom note, sample files.
4. **Identify scope** and the initial access path before restoring.
5. **Do not pay by default.** Payment does not guarantee recovery, funds crime, and may carry legal risk. Involve legal, insurers, and law enforcement.
6. **Rebuild clean, then restore**, and reset credentials, especially privileged ones.

## Lessons learned
Every incident should end with a blameless review: how did they get in, why did we not detect it sooner, and what control would have stopped it?""",
    },
    # ------------------------------------------------------------------ Social engineering
    {
        "category": "social-engineering",
        "slug": "social-engineering-principles",
        "title": "Social Engineering Principles",
        "summary": "Learn the psychological levers attackers use and how to break the pattern.",
        "difficulty": BEGINNER,
        "minutes": 9,
        "tags": ["social-engineering", "psychology", "awareness"],
        "content": """## Hacking people
Social engineering manipulates people into giving access, information, or money. It bypasses technology by exploiting normal human traits.

## The levers
- **Authority** - "This is the CFO / IT / the police."
- **Urgency** - "Do it now or lose access."
- **Scarcity** - "Only three places left."
- **Reciprocity** - a small favour creates a feeling of obligation.
- **Liking and familiarity** - shared interests, flattery, or a friendly tone.
- **Social proof** - "Everyone else has already done it."
- **Fear** - threats of penalties, suspension, or embarrassment.

## Common tactics
- **Pretexting** - inventing a believable scenario (new hire, auditor, vendor) to extract information.
- **Baiting** - leaving infected USB drives or offering free downloads.
- **Tailgating** - following someone through a secured door.
- **Quid pro quo** - offering help in return for credentials.
- **Impersonation of help desks** - to reset passwords or MFA.

## How to break the pattern
1. **Pause.** Emotional pressure is the signal.
2. **Verify** identity through a separate, known channel.
3. **Follow the process**, even for senior people. A real executive respects verification.
4. **Share the minimum.** Don't confirm details about colleagues, systems, or schedules.
5. **Report** attempts even when they fail. Attackers usually try several people.

> It is always acceptable to say: "I'll call you back on the number in the directory."

## Operational checklist
- Challenge unknown visitors and don't hold doors for strangers.
- Never disclose passwords or codes to anyone, including "IT".
- Report suspicious calls, visitors, and messages.""",
    },
    {
        "category": "social-engineering",
        "slug": "insider-threats-and-physical-security",
        "title": "Insider Threats and Physical Security",
        "summary": "Recognize malicious and accidental insider risk, and protect offices, devices, and workspaces.",
        "difficulty": INTERMEDIATE,
        "minutes": 10,
        "tags": ["social-engineering", "insider-threat", "physical-security"],
        "content": """## Two kinds of insider risk
- **Malicious insiders** - employees or contractors who misuse access for money, revenge, or ideology.
- **Negligent insiders** - well-meaning people who misdirect email, lose devices, or bypass controls for convenience. These are far more common.

## Indicators worth reporting
- Accessing data unrelated to the person's role, or at unusual hours.
- Large downloads or transfers to personal cloud storage or USB.
- Attempts to bypass controls or borrow colleagues' credentials.
- Behavioural changes combined with access concerns, such as a resignation and sudden data copying.

Reporting is about **protecting people and data**, not accusing. Findings go to security or HR, never to gossip.

## Controls that reduce risk
1. **Least privilege** and regular access reviews.
2. **Prompt offboarding**: revoke accounts, badges, and devices on the last day.
3. **Data loss prevention** and monitoring of high-volume exports.
4. **Separation of duties** for sensitive actions such as payments.

## Physical security habits
- **Badge in, every time.** Don't let anyone tailgate; direct visitors to reception.
- **Lock your screen** (`Win + L` / `Ctrl + Cmd + Q`) whenever you step away.
- **Clean desk** - no passwords on sticky notes or sensitive documents left out.
- **Shred** confidential paper; use secure disposal for old devices.
- **Never plug in unknown USB devices**, including "found" ones.
- Keep laptops with you or locked away when travelling, and **never leave them in a car**.

## Working remotely
Use privacy screens in public, avoid discussing confidential matters within earshot, and keep family members away from work devices.""",
    },
    # ------------------------------------------------------------------ Safe browsing
    {
        "category": "safe-browsing",
        "slug": "safe-browsing-fundamentals",
        "title": "Safe Browsing Fundamentals",
        "summary": "Validate web trust signals, avoid malicious sites, and stay safe on public networks.",
        "difficulty": BEGINNER,
        "minutes": 9,
        "tags": ["safe-browsing", "https", "wifi", "awareness"],
        "content": """## HTTPS is not a trust badge
The padlock means your connection to the site is **encrypted**. It does **not** mean the site is honest. Phishing sites routinely use HTTPS. Always check the **domain** as well.

## Reading a URL
In `https://login.example.com.attacker.net/signin` the real domain is **`attacker.net`**. Read the domain from **right to left** until the first `/`, and the part immediately left of the top-level domain is what matters.

## Habits
- **Type or bookmark** the addresses of banks and work systems.
- Be wary of **search ads** for software downloads; go to the vendor site directly.
- **Download only from official sources**, and verify checksums where provided.
- Keep the **browser and extensions updated**, and remove extensions you do not use. Extensions can read everything you type.
- Decline **notification permission** prompts from unfamiliar sites; they are a common scam vector.
- Treat **fake browser or plugin update** pop-ups as malware.

## Public Wi-Fi
- Open Wi-Fi lets others on the network observe or tamper with unencrypted traffic, and **evil-twin** hotspots imitate real ones.
- Prefer your phone's hotspot for sensitive work, or use the company **VPN**.
- Turn off automatic connect and file sharing.
- Never ignore a certificate warning to "just get through".

## Private browsing and trackers
Incognito mode does not hide your activity from your employer, network, or websites; it only stops local history being saved. Use tracker-blocking and review permissions periodically.

## Operational checklist
- Verify the domain, not just the padlock.
- Use the VPN on untrusted networks.
- Update the browser and remove unused extensions.""",
    },
    {
        "category": "safe-browsing",
        "slug": "web-application-attacks-for-users",
        "title": "Web Attacks: XSS, CSRF, and Session Hijacking",
        "summary": "A plain-language tour of common web attacks, how they affect users, and what developers and users can do.",
        "difficulty": ADVANCED,
        "minutes": 13,
        "tags": ["safe-browsing", "xss", "csrf", "sessions", "web-security"],
        "content": """## Why users should care
Web application flaws let attackers act **as you** inside a trusted site. Understanding them explains why patches, sign-outs, and cautious links matter.

## Cross-Site Scripting (XSS)
An application includes untrusted input in a page without encoding it, so the attacker's script runs in the victim's browser under the site's origin.

- **Impact:** steal session data, alter page content, perform actions on your behalf.
- **Developer defences:** contextual output encoding, a strict **Content-Security-Policy**, sanitising HTML, `HttpOnly` cookies.
- **User defences:** keep the browser updated and don't follow crafted links from untrusted messages.

## Cross-Site Request Forgery (CSRF)
A malicious page causes your browser, already signed in to another site, to send a state-changing request (for example "change email").

- **Developer defences:** anti-CSRF tokens, `SameSite` cookies, re-authentication for sensitive actions.
- **User defences:** sign out of sensitive sites, avoid keeping many privileged sessions open.

## Session hijacking and fixation
Sessions are tracked using tokens (cookies). If a token is stolen (via XSS, malware, or an insecure network) the attacker can **reuse it without knowing your password**, even bypassing MFA.

- **Developer defences:** `Secure`, `HttpOnly`, and `SameSite` flags; short lifetimes; rotate the token after login; bind sessions to risk signals.
- **User defences:** sign out on shared devices; report unexpected "new sign-in" alerts; don't run unknown browser extensions.

## SQL injection in one paragraph
If input is concatenated into a database query, an attacker can change the query. **Parameterised queries** prevent this entirely, and least-privilege database accounts limit the damage.

## The OWASP Top 10
Broken access control, cryptographic failures, injection, insecure design, and misconfiguration lead the OWASP Top 10. It is the standard checklist for what to test and fix.""",
    },
    # ------------------------------------------------------------------ Mobile
    {
        "category": "mobile-security",
        "slug": "securing-your-mobile-device",
        "title": "Securing Your Mobile Device",
        "summary": "Lock, update, and configure smartphones and tablets so a lost or compromised phone isn't a breach.",
        "difficulty": BEGINNER,
        "minutes": 8,
        "tags": ["mobile-security", "byod", "updates", "awareness"],
        "content": """## Your phone is a key ring
It holds email, MFA apps, banking, photos, and work data, so it deserves the same protection as a laptop.

## Baseline settings
1. **Screen lock** with a 6+ digit PIN or strong passcode, plus biometrics for convenience.
2. **Automatic updates** for the OS and apps. Most mobile exploits target known, fixed bugs.
3. **Full-device encryption** (on by default on modern phones when a passcode is set).
4. **Find My Device / remote wipe** enabled.
5. **Auto-lock** within one minute.

## Apps
- Install only from **official app stores** and check the publisher and reviews.
- Review **permissions**: a torch app has no reason to read contacts.
- Remove apps you no longer use.
- **Do not sideload** APKs or install "profiles" from links.
- Do not **jailbreak or root** managed devices; it disables core protections.

## Network risks
- Use the VPN on public Wi-Fi.
- Turn off Bluetooth and AirDrop-style sharing to strangers.
- Be wary of **charging kiosks**: use your own charger or a data-blocking cable.

## SIM swap
Attackers persuade the carrier to move your number to their SIM and receive your SMS codes. Set a **carrier PIN**, and use app-based or hardware MFA rather than SMS for important accounts.

## If a device is lost or stolen
1. Report it to security or IT immediately.
2. Use remote lock, then wipe if it cannot be recovered.
3. Change passwords for accounts used on the device.
4. Tell your carrier if the SIM is at risk.

## Operational checklist
- Passcode, biometrics, and encryption on.
- Updates automatic.
- Remote wipe enabled and lost-device process known.""",
    },
    {
        "category": "mobile-security",
        "slug": "mobile-threats-and-app-risks",
        "title": "Mobile Threats and App Risks",
        "summary": "Understand mobile malware, malicious apps, spyware, and the risks of bring-your-own-device programmes.",
        "difficulty": INTERMEDIATE,
        "minutes": 10,
        "tags": ["mobile-security", "malware", "spyware", "mdm"],
        "content": """## The mobile threat landscape
- **Malicious apps** - hidden banking trojans, adware, or subscription fraud.
- **Stalkerware and spyware** - commercial or state-grade tools that read messages, location, and microphone.
- **Overlay attacks** - a fake login screen drawn over a real banking app.
- **Malicious profiles and certificates** - installed via a link to route traffic through an attacker.
- **Zero-click exploits** - rare and expensive, but targeted at high-risk individuals.
- **Rogue Wi-Fi and SMS phishing** - the most common real-world vectors.

## Signs of compromise
- Rapid battery drain, heat, or unexplained data usage.
- Unknown apps or device-administrator entries.
- Accessibility permissions granted to an app that does not need them.
- Camera or microphone indicator appearing unexpectedly.

## Permissions worth scrutiny
| Permission | Risk |
|---|---|
| Accessibility | Can read the screen and tap for you |
| Device administrator | Can block uninstall and wipe the device |
| SMS access | Can intercept one-time codes |
| Install unknown apps | Enables sideloading |

## BYOD and MDM
**Bring Your Own Device** lets personal phones access work data. Mobile Device Management (MDM) and app-protection policies typically:

- separate work data in a **managed container**,
- enforce passcodes, encryption, and OS minimums,
- allow **selective wipe** of work data only,
- block access from rooted or jailbroken devices.

Users should understand what the organisation can and cannot see on their personal phone.

## For high-risk users
Enable Lockdown Mode or the platform equivalent, restart devices periodically, keep them updated, and report unusual behaviour to security.""",
    },
    # ------------------------------------------------------------------ Data privacy
    {
        "category": "data-privacy",
        "slug": "handling-sensitive-data",
        "title": "Handling Sensitive Data",
        "summary": "Classify, store, and share sensitive information with practical guardrails.",
        "difficulty": BEGINNER,
        "minutes": 9,
        "tags": ["data-privacy", "classification", "awareness"],
        "content": """## Know what you hold
Data classification tells you how careful to be. A typical scheme:

- **Public** - safe for anyone (published website content).
- **Internal** - for staff only (org charts, internal notes).
- **Confidential** - business-sensitive (contracts, financials, source code).
- **Restricted** - regulated or highly damaging if exposed (personal data, health records, payment cards, credentials).

## Personal data
Personally Identifiable Information (PII) is anything that identifies a person: name with address, ID numbers, email, phone, IP address, biometric or health data. Laws such as **GDPR**, **CCPA**, and **HIPAA** set rules for collecting, using, and protecting it.

## Core privacy principles
1. **Data minimisation** - collect and keep only what you need.
2. **Purpose limitation** - use data only for the reason it was collected.
3. **Storage limitation** - delete data when it is no longer needed.
4. **Integrity and confidentiality** - protect it with proper controls.
5. **Accountability** - be able to show how you comply.

## Safe handling habits
- **Validate the recipient** before sending. Autocomplete sends many misdirected emails.
- Share links with **named access** instead of attaching files.
- **Encrypt** approved transfers and portable media.
- Store data only in **approved systems**, never personal email or consumer cloud accounts.
- Redact or anonymise data used for testing and analytics.
- **Record exceptions** and get sign-off for unusual sharing.

## Mistakes happen: report quickly
If you send data to the wrong person, tell security straight away. Regulations such as GDPR may require notification to authorities within **72 hours** of discovering a breach, so early reporting protects everyone.""",
    },
    {
        "category": "data-privacy",
        "slug": "encryption-and-data-protection",
        "title": "Encryption and Data Protection",
        "summary": "Understand encryption at rest and in transit, key management, and how backups and disposal complete the picture.",
        "difficulty": INTERMEDIATE,
        "minutes": 12,
        "tags": ["data-privacy", "encryption", "keys", "backups"],
        "content": """## What encryption does
Encryption transforms readable data into ciphertext that only someone with the right **key** can reverse. It protects **confidentiality**; on its own it does not prove who sent the data or that it wasn't changed.

## In transit, at rest, in use
- **In transit** - TLS (HTTPS), VPNs, and secure email transport protect data moving across networks.
- **At rest** - full-disk encryption (BitLocker, FileVault), database and storage encryption protect stored data if a device or drive is lost.
- **In use** - protecting data while processed is harder; confidential computing is emerging.

## Symmetric vs asymmetric
- **Symmetric** (e.g. AES-256): one shared key, very fast; good for bulk data.
- **Asymmetric** (e.g. RSA, ECC): public/private key pair; used for key exchange and digital signatures.
- TLS combines both: asymmetric to agree a key, symmetric to encrypt the session.

## Hashing and signatures
A **hash** (SHA-256) gives a fixed fingerprint of data to detect change. A **digital signature** proves origin and integrity. Neither is encryption.

## Key management is the hard part
- Never hard-code keys or store them next to the data they protect.
- Use a **key management service** or hardware security module.
- **Rotate** keys and revoke on compromise.
- Limit who can use and who can administer keys.
- Keep secure **recovery** procedures; lost keys mean lost data.

## Don'ts
- Don't invent your own cryptography; use vetted libraries.
- Avoid legacy algorithms (MD5, SHA-1, DES, RC4) and old protocols (SSL, TLS 1.0/1.1).

## Backups and disposal
Encrypt backups and keep a copy offline. When retiring devices, use **secure erase** or cryptographic erase, and destroy media that held restricted data with a certificate of destruction.""",
    },
    # ------------------------------------------------------------------ Email security
    {
        "category": "email-security",
        "slug": "secure-email-habits",
        "title": "Secure Email Habits",
        "summary": "Use email safely in daily workflows: attachments, forwarding, mailbox rules, and sensitive content.",
        "difficulty": BEGINNER,
        "minutes": 8,
        "tags": ["email-security", "habits", "awareness"],
        "content": """## Email is a public postcard by default
Standard email is not end-to-end encrypted, can be forwarded by anyone, and lives in many mailboxes. Treat it accordingly.

## Everyday habits
- **Check the recipients** - especially "Reply All" and auto-completed addresses.
- Use **BCC** for large external mailings so addresses aren't exposed.
- Keep sensitive data out of subject lines.
- Send secrets through **approved secure channels**, not plain email.
- Don't **auto-forward** work email to personal accounts.
- **Slow down before opening attachments**, even from known contacts, because their account may be compromised.

## Attachments and links
- Prefer sharing **links to files with permissions** over attachments.
- Be suspicious of `.exe`, `.js`, `.iso`, `.lnk`, and macro-enabled Office files.
- Preview unknown links; don't enter credentials via email links.

## Mailbox hygiene
- Enable **MFA** on your mailbox.
- Periodically **review forwarding rules and connected apps**. Attackers hide inbox rules that forward or delete security mail.
- Watch for **OAuth consent prompts** ("Allow this app to read your mail"). Malicious apps can bypass passwords altogether.
- Use the **Report** button rather than just deleting suspicious mail.

## Out-of-office and signatures
Automatic replies and signatures can reveal travel dates, phone numbers, and reporting lines that fuel targeted attacks. Keep them concise.

## Operational checklist
- Verify recipients before sending sensitive material.
- Review inbox rules and connected apps quarterly.
- Report, don't just delete, suspicious messages.""",
    },
    {
        "category": "email-security",
        "slug": "email-authentication-spf-dkim-dmarc",
        "title": "Email Authentication: SPF, DKIM, and DMARC",
        "summary": "How domain-level email authentication works and how analysts read message headers to trace spoofing.",
        "difficulty": ADVANCED,
        "minutes": 14,
        "tags": ["email-security", "spf", "dkim", "dmarc", "headers"],
        "content": """## The spoofing problem
SMTP was designed without sender verification. Anyone can put `From: ceo@yourcompany.com` in a message. Three DNS-based standards add trust.

## SPF - who may send
**Sender Policy Framework** publishes the servers allowed to send mail for a domain in a DNS TXT record:

`v=spf1 include:_spf.mailprovider.com ip4:203.0.113.10 -all`

- `-all` (hard fail) rejects others; `~all` (soft fail) marks them suspicious.
- SPF checks the **envelope sender** (Return-Path), not the visible From address.
- Forwarding breaks SPF, and there is a 10-DNS-lookup limit.

## DKIM - was it altered
**DomainKeys Identified Mail** signs selected headers and the body with a private key. Receivers fetch the public key from DNS (`selector._domainkey.example.com`) and verify. A pass means the message wasn't modified and was authorised by that signing domain.

## DMARC - the policy and alignment
**DMARC** ties it together:

- Requires SPF or DKIM to pass **and align** with the visible From domain.
- Publishes a policy: `p=none` (monitor), `p=quarantine`, or `p=reject`.
- Sends aggregate (`rua`) and forensic reports so you can see who is sending as your domain.

`v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=100`

**Deployment path:** start with `p=none`, fix legitimate senders, move to `quarantine`, then `reject`.

## Reading headers as an analyst
Read `Received:` lines **bottom to top** to follow the path. Then check:

- `Authentication-Results:` for `spf=`, `dkim=`, `dmarc=` verdicts.
- Mismatch between `From`, `Return-Path`, and `Reply-To`.
- The originating IP and its reputation.
- Timestamps and hops that seem inconsistent.

## Related controls
- **Display-name spoofing** passes authentication because the attacker uses their own domain; use external-sender banners.
- **BIMI** shows verified logos for DMARC-enforced domains.
- **MTA-STS** and TLS reporting protect mail in transit.

## Key takeaway
Authentication proves a domain's involvement, not that the message is benign. Attackers can also pass SPF, DKIM, and DMARC on domains they own, so authentication is one signal among several.""",
    },
]
