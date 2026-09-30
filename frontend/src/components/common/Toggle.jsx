import { useId } from "react";
import clsx from "clsx";

// Accessible on/off switch (a real checkbox underneath) with an optional description.
export default function Toggle({ label, description, checked, onChange, disabled, className }) {
  const id = useId();
  return (
    <label htmlFor={id} className={clsx("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <span className="absolute inset-0 rounded-full border border-white/15 bg-black/30 shadow-[inset_0_1px_3px_rgba(0,0,0,.5)] transition peer-checked:border-cyanx/50 peer-checked:bg-cyanx/30 peer-focus-visible:ring-2 peer-focus-visible:ring-cyanx/70" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-slate-200 shadow transition peer-checked:translate-x-5 peer-checked:bg-white motion-reduce:transition-none" />
      </span>
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-400">{description}</span>}
      </span>
    </label>
  );
}
