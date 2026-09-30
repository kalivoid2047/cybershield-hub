import clsx from "clsx";
import TiltCard from "./TiltCard.jsx";

// `tilt` adds the pointer-driven 3D tilt; keep it for browsable tiles rather than forms or long content.
export default function Card({ className, children, tilt = false, ...props }) {
  const classes = clsx("glass-panel rounded-2xl p-5", className);
  if (tilt) {
    return (
      <TiltCard as="section" className={classes} {...props}>
        {children}
      </TiltCard>
    );
  }
  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}
