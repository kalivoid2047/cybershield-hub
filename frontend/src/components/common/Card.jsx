import clsx from "clsx";

export default function Card({ className, children }) {
  return <section className={clsx("glass-panel rounded-lg p-5", className)}>{children}</section>;
}
