export const roles = {
  user: "normal_user",
  officer: "cybersecurity_officer",
  admin: "system_admin",
};

export const mockUser = {
  id: 1,
  email: "admin@cybershield.local",
  first_name: "System",
  last_name: "Admin",
  organization: "CyberShield Demo Org",
  department: "Security",
  security_score: 87,
  role: {
    code: roles.admin,
    name: "System Administrator",
  },
};

export const dashboardSummary = {
  security_score: 87,
  learning_progress: { completed: 18, total: 24 },
  quiz_average: 84,
  phishing_average: 78,
  open_incidents: 4,
  unread_notifications: 6,
};

export const alerts = [
  {
    id: 1,
    title: "Credential phishing campaign observed",
    body: "Fake password reset pages are targeting staff. Report suspicious reset emails immediately.",
    priority: "high",
    alert_type: "threat_advisory",
    starts_at: "2026-05-29T07:00:00Z",
  },
  {
    id: 2,
    title: "Daily tip: verify payment requests",
    body: "Confirm invoice changes using an approved out-of-band channel before approving payment.",
    priority: "medium",
    alert_type: "daily_tip",
    starts_at: "2026-05-29T08:00:00Z",
  },
  {
    id: 3,
    title: "VPN maintenance window",
    body: "Remote access maintenance is scheduled for Saturday 01:00 UTC.",
    priority: "info",
    alert_type: "announcement",
    starts_at: "2026-05-28T11:00:00Z",
  },
];

export const lessons = [
  {
    id: 1,
    slug: "phishing-red-flags-in-10-minutes",
    title: "Phishing Red Flags in 10 Minutes",
    category: { name: "Phishing", slug: "phishing", color: "#2dd4ff" },
    summary: "Spot suspicious sender domains, urgency cues, mismatched URLs, and credential theft attempts.",
    content:
      "Phishing usually blends a familiar brand with an abnormal request. Validate the sender domain, hover links before opening, inspect the destination, and report messages that request passwords, MFA codes, payments, or sensitive files.",
    estimated_minutes: 8,
    difficulty: "beginner",
    progress_percent: 80,
    is_bookmarked: true,
    tags: ["phishing", "email", "url"],
  },
  {
    id: 2,
    slug: "password-managers-and-mfa",
    title: "Password Managers and MFA",
    category: { name: "Password Security", slug: "password-security", color: "#2ee59d" },
    summary: "Use unique generated passwords and phishing-resistant multi-factor authentication.",
    content:
      "A strong account posture starts with unique credentials. Store generated passwords in an approved password manager and enable MFA everywhere. For privileged access, prefer hardware keys or passkeys when available.",
    estimated_minutes: 10,
    difficulty: "beginner",
    progress_percent: 100,
    is_bookmarked: false,
    tags: ["mfa", "passwords"],
  },
  {
    id: 3,
    slug: "handling-sensitive-data",
    title: "Handling Sensitive Data",
    category: { name: "Data Privacy", slug: "data-privacy", color: "#f6c453" },
    summary: "Classify, store, and share sensitive information with practical guardrails.",
    content:
      "Sensitive data should move through approved systems only. Minimize exposure, verify recipients, avoid public links, and record exceptions for security review.",
    estimated_minutes: 12,
    difficulty: "intermediate",
    progress_percent: 42,
    is_bookmarked: false,
    tags: ["privacy", "data"],
  },
  {
    id: 4,
    slug: "malware-intake-basics",
    title: "Malware Intake Basics",
    category: { name: "Malware", slug: "malware", color: "#ff5b7a" },
    summary: "Recognize malicious attachments, macros, and suspicious downloads.",
    content:
      "Do not open unexpected files. Preserve the message, capture context, isolate affected devices when instructed, and submit evidence to the SOC queue.",
    estimated_minutes: 9,
    difficulty: "intermediate",
    progress_percent: 25,
    is_bookmarked: true,
    tags: ["malware", "evidence"],
  },
];

export const quizzes = [
  {
    id: 1,
    title: "Phishing Foundations Assessment",
    slug: "phishing-foundations",
    description: "A short assessment covering sender validation, URL inspection, and escalation behavior.",
    time_limit_minutes: 8,
    pass_score: 75,
    question_count: 3,
    best_score: 84,
    questions: [
      {
        id: 101,
        prompt: "Which signal is most suspicious in an email asking you to reset your password?",
        competency: "URL Inspection",
        answers: [
          { id: 1001, text: "A verified internal sender" },
          { id: 1002, text: "A link to a lookalike domain" },
          { id: 1003, text: "A normal signature" },
          { id: 1004, text: "A recent ticket number" },
        ],
        correctAnswerId: 1002,
        explanation: "A mismatched or lookalike domain is a high-confidence phishing indicator.",
      },
      {
        id: 102,
        prompt: "What should you do with an unexpected attachment from an external sender?",
        competency: "Malware Prevention",
        answers: [
          { id: 1005, text: "Open it quickly" },
          { id: 1006, text: "Forward it to coworkers" },
          { id: 1007, text: "Report it for review" },
          { id: 1008, text: "Disable antivirus first" },
        ],
        correctAnswerId: 1007,
        explanation: "Unexpected files should be reported and reviewed before opening.",
      },
      {
        id: 103,
        prompt: "A message demands urgent gift card purchases from an executive. What is the likely tactic?",
        competency: "Social Engineering",
        answers: [
          { id: 1009, text: "Business email compromise" },
          { id: 1010, text: "Routine finance approval" },
          { id: 1011, text: "Patch management" },
          { id: 1012, text: "Data backup" },
        ],
        correctAnswerId: 1009,
        explanation: "Urgency plus authority pressure is a common business email compromise pattern.",
      },
    ],
  },
  {
    id: 2,
    title: "Data Handling Checkpoint",
    slug: "data-handling",
    description: "Validates safe storage, recipient verification, and privacy handling.",
    time_limit_minutes: 10,
    pass_score: 80,
    question_count: 4,
    best_score: 76,
    questions: [],
  },
];

export const phishingSimulations = [
  {
    id: 1,
    title: "Quarterly Password Reset",
    difficulty: "easy",
    scenario: "A user receives a realistic password reset email with a lookalike domain.",
    sender_name: "IT Service Desk",
    sender_email: "support@micros0ft-security.com",
    subject: "Immediate password reset required",
    body:
      "Your account will be suspended in 30 minutes. Verify your password at https://login.micros0ft-security.com/reset to avoid losing access.",
    urls: ["https://login.micros0ft-security.com/reset"],
    red_flags: ["lookalike domain", "urgent language", "credential request"],
    is_phishing: true,
    training_tip: "Verify domains carefully and never enter passwords from email links.",
    latest_score: 86,
  },
  {
    id: 2,
    title: "Approved Maintenance Notice",
    difficulty: "medium",
    scenario: "A legitimate maintenance message from the internal helpdesk.",
    sender_name: "Internal Helpdesk",
    sender_email: "helpdesk@cybershield.local",
    subject: "VPN maintenance Saturday",
    body: "VPN maintenance is scheduled for Saturday 01:00 UTC. No action is required.",
    urls: [],
    red_flags: [],
    is_phishing: false,
    training_tip: "Legitimate operational messages usually do not request secrets or urgent payment.",
    latest_score: 72,
  },
];

export const incidents = [
  {
    id: 1,
    reference_number: "INC-20260529-A91C3F",
    title: "Suspicious MFA fatigue prompts",
    category: { name: "Unauthorized Access" },
    severity: "high",
    status: "investigating",
    affected_system: "Identity Provider",
    occurred_at: "2026-05-29T08:20:00Z",
    priority_score: 84,
    reporter: { first_name: "Demo", last_name: "Learner", email: "user@cybershield.local" },
    assigned_to: { first_name: "SOC", last_name: "Officer", email: "officer@cybershield.local" },
    description: "User received multiple unexpected MFA prompts after interacting with a reset email.",
    updates: [
      { id: 1, status_to: "open", note: "Incident submitted.", created_at: "2026-05-29T08:24:00Z" },
      { id: 2, status_from: "open", status_to: "investigating", note: "Account locked and logs requested.", created_at: "2026-05-29T08:40:00Z" },
    ],
  },
  {
    id: 2,
    reference_number: "INC-20260528-B22A10",
    title: "Invoice redirection request",
    category: { name: "Phishing Email" },
    severity: "medium",
    status: "open",
    affected_system: "Finance mailbox",
    occurred_at: "2026-05-28T11:18:00Z",
    priority_score: 61,
    reporter: { first_name: "Asha", last_name: "Moyo", email: "asha@cybershield.local" },
    assigned_to: null,
    description: "Vendor email requested bank account changes with urgency.",
    updates: [{ id: 3, status_to: "open", note: "Incident submitted.", created_at: "2026-05-28T11:22:00Z" }],
  },
  {
    id: 3,
    reference_number: "INC-20260527-F09D44",
    title: "Sensitive report shared publicly",
    category: { name: "Data Exposure" },
    severity: "critical",
    status: "escalated",
    affected_system: "Cloud storage",
    occurred_at: "2026-05-27T15:12:00Z",
    priority_score: 100,
    reporter: { first_name: "Brian", last_name: "Chirwa", email: "brian@cybershield.local" },
    assigned_to: { first_name: "SOC", last_name: "Officer", email: "officer@cybershield.local" },
    description: "A public link exposed a payroll export to anyone with the URL.",
    updates: [{ id: 4, status_to: "escalated", note: "Legal and privacy teams notified.", created_at: "2026-05-27T15:40:00Z" }],
  },
  {
    id: 4,
    reference_number: "INC-20260526-C321EE",
    title: "Malicious attachment opened",
    category: { name: "Malware Infection" },
    severity: "high",
    status: "resolved",
    affected_system: "Laptop FIN-204",
    occurred_at: "2026-05-26T09:05:00Z",
    priority_score: 55,
    reporter: { first_name: "Nia", last_name: "Cole", email: "nia@cybershield.local" },
    assigned_to: { first_name: "SOC", last_name: "Officer", email: "officer@cybershield.local" },
    description: "Attachment opened from untrusted sender. Endpoint isolated and rebuilt.",
    updates: [{ id: 5, status_to: "resolved", note: "Containment complete.", created_at: "2026-05-26T13:25:00Z" }],
  },
];

export const auditLogs = [
  { id: 1, created_at: "2026-05-29T08:40:00Z", actor: { email: "officer@cybershield.local" }, action: "POST incident-transition", resource_type: "incidents", ip_address: "10.10.4.21" },
  { id: 2, created_at: "2026-05-29T08:31:00Z", actor: { email: "admin@cybershield.local" }, action: "POST security-alerts", resource_type: "alerts", ip_address: "10.10.4.10" },
  { id: 3, created_at: "2026-05-29T08:22:00Z", actor: { email: "user@cybershield.local" }, action: "POST incidents", resource_type: "incidents", ip_address: "10.10.8.44" },
];

export const users = [
  mockUser,
  {
    id: 2,
    email: "officer@cybershield.local",
    first_name: "SOC",
    last_name: "Officer",
    organization: "CyberShield Demo Org",
    department: "Security",
    security_score: 91,
    is_active: true,
    role: { code: roles.officer, name: "Cybersecurity Officer" },
  },
  {
    id: 3,
    email: "user@cybershield.local",
    first_name: "Demo",
    last_name: "Learner",
    organization: "CyberShield Demo Org",
    department: "Operations",
    security_score: 72,
    is_active: true,
    role: { code: roles.user, name: "Normal User" },
  },
];

export const chartData = {
  incident_trends: [
    { month: "2026-01-01", count: 7 },
    { month: "2026-02-01", count: 9 },
    { month: "2026-03-01", count: 8 },
    { month: "2026-04-01", count: 14 },
    { month: "2026-05-01", count: 11 },
  ],
  incident_severity: [
    { severity: "low", count: 8 },
    { severity: "medium", count: 18 },
    { severity: "high", count: 13 },
    { severity: "critical", count: 4 },
  ],
  quiz_performance: [
    { passed: true, count: 132, avg_score: 86 },
    { passed: false, count: 29, avg_score: 61 },
  ],
  phishing_awareness: [
    { correct: true, count: 114, avg_score: 88 },
    { correct: false, count: 36, avg_score: 42 },
  ],
  training_by_category: [
    { lesson__category__name: "Phishing", count: 64 },
    { lesson__category__name: "Password Security", count: 52 },
    { lesson__category__name: "Data Privacy", count: 38 },
    { lesson__category__name: "Malware", count: 41 },
  ],
};
