import { useId } from "react";
import clsx from "clsx";

// Pure CSS/SVG 3D (no WebGL, no dependency): a shield extruded from stacked
// layers, swaying in perspective, with two spinning rings and orbiting glass cubes.
const SHIELD_PATH = "M50 4 L92 20 V58 C92 86 74 106 50 116 C26 106 8 86 8 58 V20 Z";
const LAYERS = 9;
const DEPTH = 3.4; // px between layers

const cubes = [
  { size: 20, radius: 0.56, delay: "0s", height: -0.3 },
  { size: 14, radius: 0.5, delay: "-5.3s", height: 0.34 },
  { size: 10, radius: 0.62, delay: "-10.6s", height: 0.05 },
];

export default function Shield3D({ size = 240, className }) {
  const gradientId = useId();
  return (
    <div className={clsx("shield-scene", className)} style={{ "--s": `${size}px` }} aria-hidden="true">
      {/* soft light pool under the object */}
      <div className="absolute left-1/2 top-[78%] h-[18%] w-[70%] -translate-x-1/2 rounded-[50%] bg-cyanx/30 blur-2xl animate-pulse-glow" />
      <div className="shield-stage animate-float">
        <div className="shield-ring" style={{ "--tilt": "72deg", border: "2px solid rgba(45,212,255,.55)", boxShadow: "0 0 24px rgba(45,212,255,.35), inset 0 0 24px rgba(45,212,255,.18)" }} />
        <div className="shield-ring" style={{ "--tilt": "-58deg", inset: "12%", animationDuration: "20s", animationDirection: "reverse", border: "2px dashed rgba(46,229,157,.5)" }} />

        <div className="shield-body">
          {Array.from({ length: LAYERS }, (_, index) => {
            const front = index === LAYERS - 1;
            const z = (index - (LAYERS - 1) / 2) * DEPTH;
            return (
              <svg key={index} className="shield-layer" viewBox="0 0 100 120" style={{ transform: `translateZ(${z}px)` }}>
                {front && (
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#7fe3ff" stopOpacity=".95" />
                      <stop offset="55%" stopColor="#2dd4ff" stopOpacity=".55" />
                      <stop offset="100%" stopColor="#8b7bff" stopOpacity=".7" />
                    </linearGradient>
                  </defs>
                )}
                <path
                  d={SHIELD_PATH}
                  fill={front ? `url(#${gradientId})` : `rgba(20, 110, 150, ${0.35 + index * 0.03})`}
                  stroke={front ? "rgba(255,255,255,.85)" : "rgba(45,212,255,.5)"}
                  strokeWidth={front ? 1.6 : 1}
                  strokeLinejoin="round"
                />
                {front && (
                  <>
                    <path d="M50 14 L82 26 V58 C82 79 68 95 50 104 C32 95 18 79 18 58 V26 Z" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
                    <path d="M33 60 L45 72 L69 44" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(46,229,157,.9))" }} />
                  </>
                )}
              </svg>
            );
          })}
        </div>

        {cubes.map((cube, index) => (
          <div key={index} className="shield-orbit" style={{ animationDelay: cube.delay, animationDuration: `${14 + index * 4}s` }}>
            {/* the wrapper positions the cube on its orbit; the cube itself only spins */}
            <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: `translate3d(${cube.radius * size}px, ${cube.height * size}px, 0)` }}>
              <div className="cube" style={{ "--c": `${cube.size}px`, animationDelay: cube.delay }}>
                {Array.from({ length: 6 }, (_, face) => (
                  <i key={face} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
