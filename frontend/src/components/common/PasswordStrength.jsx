import clsx from "clsx";
import { Check, Circle } from "lucide-react";

export const passwordRules = [
  { id: "length", label: "At least 10 characters", test: (value) => value.length >= 10 },
  { id: "case", label: "Upper and lower case letters", test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { id: "number", label: "A number", test: (value) => /\d/.test(value) },
  { id: "symbol", label: "A symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

const levels = [
  { label: "Too weak", bar: "bg-danger" },
  { label: "Weak", bar: "bg-danger" },
  { label: "Fair", bar: "bg-amberx" },
  { label: "Good", bar: "bg-cyanx" },
  { label: "Strong", bar: "bg-mint" },
];

export function passwordMeetsLength(value) {
  return value.length >= 10;
}

export default function PasswordStrength({ value = "" }) {
  const passed = passwordRules.filter((rule) => rule.test(value));
  const level = value ? levels[passed.length] : null;

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
          {passwordRules.map((rule, index) => (
            <span key={rule.id} className={clsx("flex-1 rounded-full", level && index < passed.length ? level.bar : "bg-white/10")} />
          ))}
        </div>
        <span className="w-16 text-right text-xs text-slate-300">{level?.label || ""}</span>
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {passwordRules.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.id} className={clsx("flex items-center gap-1.5", ok ? "text-emerald-200" : "text-slate-400")}>
              {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Circle className="h-3.5 w-3.5" aria-hidden="true" />}
              {rule.label}
              <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
