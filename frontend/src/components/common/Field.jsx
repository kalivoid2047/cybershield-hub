import { forwardRef, useId, useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, Lock, Search } from "lucide-react";

const control =
  "focus-ring min-h-11 w-full rounded-xl border bg-black/25 text-white placeholder:text-slate-400 shadow-[inset_0_2px_6px_rgba(0,0,0,.35)] backdrop-blur transition hover:border-white/25 focus:border-cyanx/60 focus:shadow-[inset_0_2px_6px_rgba(0,0,0,.35),0_0_0_3px_rgba(45,212,255,.15)] disabled:cursor-not-allowed disabled:opacity-60";

function borderClass(error) {
  return error ? "border-danger/60" : "border-white/12";
}

// Label + control + hint/error wiring shared by Input, Select and Textarea so
// every form gets the same spacing and the same aria-describedby plumbing.
function Shell({ id, label, hint, error, hideLabel, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={clsx("mb-2 block text-sm font-medium text-slate-300", hideLabel && "sr-only")}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id, hint, error) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

export const Input = forwardRef(function Input({ label, hint, error, hideLabel, icon: Icon, trailing, className, wrapperClassName, ...props }, ref) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={wrapperClassName}>
      <span className="relative block">
        {Icon && <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={clsx(control, borderClass(error), Icon ? "pl-10" : "pl-3", trailing ? "pr-11" : "pr-3", className)}
          {...props}
        />
        {trailing && <span className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</span>}
      </span>
    </Shell>
  );
});

export function SearchInput({ label = "Search", className, ...props }) {
  return <Input type="search" icon={Search} label={label} hideLabel wrapperClassName={className} {...props} />;
}

export const Select = forwardRef(function Select({ label, hint, error, hideLabel, icon: Icon, className, wrapperClassName, children, ...props }, ref) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={wrapperClassName}>
      <span className="relative block">
        {Icon && <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={clsx(control, borderClass(error), Icon ? "pl-10" : "pl-3", "pr-3", className)}
          {...props}
        >
          {children}
        </select>
      </span>
    </Shell>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, hideLabel, className, wrapperClassName, ...props }, ref) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={clsx(control, borderClass(error), "min-h-32 resize-y p-3", className)}
        {...props}
      />
    </Shell>
  );
});

// Password field with a real show/hide toggle (the eye is a button, not decoration).
export const PasswordInput = forwardRef(function PasswordInput({ label = "Password", ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <Input
      ref={ref}
      label={label}
      icon={Lock}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:text-white"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      }
      {...props}
    />
  );
});
