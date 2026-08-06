import clsx from "clsx";

const variants = {
  primary: "bg-cyanx text-void hover:bg-sky-300 shadow-glow",
  secondary: "bg-white/8 text-slate-100 hover:bg-white/12 border border-white/12",
  danger: "bg-danger text-white hover:bg-rose-400",
  ghost: "text-slate-300 hover:bg-white/8",
};

export default function Button({ as: Component = "button", variant = "primary", className, children, ...props }) {
  return (
    <Component
      className={clsx(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
