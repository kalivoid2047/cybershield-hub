import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

const STAFF = ["cybersecurity_officer", "system_admin"];

// Grouped so the sidebar reads as "learn / respond / administer" rather than
// one flat list of eleven links.
export const navGroups = [
  {
    label: null,
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Learn",
    items: [
      { label: "Training", to: "/training", icon: BookOpen },
      { label: "Quizzes", to: "/quizzes", icon: BrainCircuit },
      { label: "Phishing lab", to: "/phishing", icon: FileWarning },
    ],
  },
  {
    label: "Respond",
    items: [
      { label: "Incidents", to: "/incidents", icon: ClipboardList },
      { label: "SOC queue", to: "/soc", icon: Activity, roles: STAFF },
      { label: "Alerts", to: "/alerts", icon: Bell, badge: "alerts" },
    ],
  },
  {
    label: "Insights & admin",
    items: [
      { label: "Analytics", to: "/analytics", icon: BarChart3, roles: STAFF },
      { label: "Audit log", to: "/admin/audit", icon: ShieldCheck, roles: STAFF },
      { label: "Users", to: "/admin/users", icon: Users, roles: ["system_admin"] },
      { label: "Quiz settings", to: "/admin/quizzes", icon: SlidersHorizontal, roles: ["system_admin"] },
    ],
  },
];

// Section label shown in the top bar; the longest matching prefix wins.
const sections = [
  ["/incidents/new", "Report incident"],
  ["/incidents", "Incidents"],
  ["/training", "Training"],
  ["/quizzes", "Quizzes"],
  ["/phishing", "Phishing lab"],
  ["/soc", "SOC queue"],
  ["/analytics", "Analytics"],
  ["/alerts", "Alerts"],
  ["/admin/users", "Users"],
  ["/admin/quizzes", "Quiz settings"],
  ["/admin/audit", "Audit log"],
  ["/account", "Account"],
];

export function sectionFor(pathname) {
  if (pathname === "/") return "Dashboard";
  const match = sections.filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)).sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[1] : "";
}
