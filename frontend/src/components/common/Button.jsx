import clsx from "clsx";

// Keys have a lit top edge, a hard lower lip and a soft glow, and press down
// like a physical button.
const variants = {
  primary:
    "bg-gradient-to-b from-cyan-200 via-cyanx to-sky-500 text-void shadow-key hover:-translate-y-0.5 hover:brightness-110 active:translate-y-px active:shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_1px_0_rgba(0,92,122,.85),0_4px_12px_rgba(45,212,255,.25)]",
  secondary:
    "border border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_6px_16px_rgba(0,0,0,.28)] backdrop-blur hover:-translate-y-0.5 hover:border-white/25 hover:from-white/[0.17] active:translate-y-px",
  danger:
    "bg-gradient-to-b from-rose-300 via-danger to-rose-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(120,20,45,.85),0_10px_24px_rgba(255,91,122,.3)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-px",
  ghost: "text-slate-300 hover:bg-white/10 hover:text-white",
};

export default function Button({ as: Component = "button", variant = "primary", className, children, ...props }) {
  return (
    <Component
      className={clsx(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
