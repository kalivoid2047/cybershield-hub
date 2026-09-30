import clsx from "clsx";

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={clsx("animate-pulse rounded-md bg-white/8 motion-reduce:animate-none", className)} />;
}

// Placeholder grid shown while a list page loads.
export function SkeletonCards({ count = 6, className = "md:grid-cols-2 xl:grid-cols-3", height = "h-44" }) {
  return (
    <div className={clsx("grid gap-4", className)} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={clsx("rounded-lg border border-white/5", height)} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-12" />
      ))}
    </div>
  );
}
