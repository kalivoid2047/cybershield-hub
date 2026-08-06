import clsx from "clsx";

export default function ProgressBar({ value = 0, className }) {
  return (
    <div className={clsx("h-2 overflow-hidden rounded-full bg-white/8", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyanx via-mint to-amberx transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
