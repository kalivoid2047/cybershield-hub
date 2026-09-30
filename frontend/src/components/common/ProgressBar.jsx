import clsx from "clsx";

export default function ProgressBar({ value = 0, className }) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("h-2.5 overflow-hidden rounded-full bg-black/30 shadow-[inset_0_1px_3px_rgba(0,0,0,.55)] ring-1 ring-white/10", className)}>
      <div
        className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-cyanx via-mint to-amberx shadow-[0_0_14px_rgba(45,212,255,.55)] transition-all duration-700"
        style={{ width: `${percent}%` }}
      >
        <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer motion-reduce:hidden" />
      </div>
    </div>
  );
}
