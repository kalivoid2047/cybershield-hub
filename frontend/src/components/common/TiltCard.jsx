import { forwardRef, useEffect, useRef } from "react";
import clsx from "clsx";

// A surface that tilts in 3D toward the pointer and shows a moving glare.
// It only reacts to a real hover-capable mouse, and never when the user
// prefers reduced motion, so touch and accessibility settings are untouched.
// Pointer tracking writes CSS variables directly (no React re-renders).
const TiltCard = forwardRef(function TiltCard({ as: Tag = "div", max = 7, className, children, onPointerMove, onPointerLeave, ...props }, forwardedRef) {
  const localRef = useRef(null);
  const frame = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => cancelAnimationFrame(frame.current);
  }, []);

  function setRef(node) {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }

  function handleMove(event) {
    onPointerMove?.(event);
    if (!enabled.current || event.pointerType === "touch") return;
    const element = localRef.current;
    if (!element) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      element.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      element.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      element.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      element.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      element.dataset.tilting = "true";
    });
  }

  function handleLeave(event) {
    onPointerLeave?.(event);
    cancelAnimationFrame(frame.current);
    const element = localRef.current;
    if (!element) return;
    element.style.setProperty("--rx", "0deg");
    element.style.setProperty("--ry", "0deg");
    delete element.dataset.tilting;
  }

  return (
    <Tag ref={setRef} className={clsx("tilt-card", className)} onPointerMove={handleMove} onPointerLeave={handleLeave} {...props}>
      {children}
    </Tag>
  );
});

export default TiltCard;
