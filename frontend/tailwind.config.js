/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        void: "#050914",
        panel: "#0a1322",
        "panel-2": "#0d1b2f",
        cyanx: "#2dd4ff",
        mint: "#2ee59d",
        amberx: "#f6c453",
        danger: "#ff5b7a",
        violetx: "#8b7bff",
      },
      boxShadow: {
        glow: "0 0 30px rgba(45, 212, 255, 0.22)",
        "glow-green": "0 0 24px rgba(46, 229, 157, 0.2)",
        glass: "inset 0 1px 0 rgba(255,255,255,.16), 0 18px 48px rgba(0,0,0,.38)",
        "glass-lg": "inset 0 1px 0 rgba(255,255,255,.2), 0 30px 80px rgba(0,0,0,.5)",
        key: "inset 0 1px 0 rgba(255,255,255,.55), 0 2px 0 rgba(0,92,122,.85), 0 10px 26px rgba(45,212,255,.32)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -14px, 0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(40px, -30px, 0) scale(1.08)" },
          "66%": { transform: "translate3d(-30px, 26px, 0) scale(.95)" },
        },
        "floor-scroll": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "0 48px" },
        },
        "sway": {
          "0%, 100%": { transform: "rotateX(-8deg) rotateY(-30deg)" },
          "50%": { transform: "rotateX(6deg) rotateY(30deg)" },
        },
        "ring-spin": {
          from: { transform: "rotateX(var(--tilt, 72deg)) rotateZ(0deg)" },
          to: { transform: "rotateX(var(--tilt, 72deg)) rotateZ(360deg)" },
        },
        "orbit": {
          from: { transform: "rotateY(0deg)" },
          to: { transform: "rotateY(360deg)" },
        },
        "cube-spin": {
          from: { transform: "rotateX(0deg) rotateY(0deg)" },
          to: { transform: "rotateX(360deg) rotateY(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: ".55" },
          "50%": { opacity: 1 },
        },
        shimmer: {
          from: { transform: "translateX(-120%)" },
          to: { transform: "translateX(220%)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        drift: "drift 26s ease-in-out infinite",
        "floor-scroll": "floor-scroll 3.2s linear infinite",
        sway: "sway 9s ease-in-out infinite",
        "ring-spin": "ring-spin 14s linear infinite",
        orbit: "orbit 16s linear infinite",
        "cube-spin": "cube-spin 11s linear infinite",
        "pulse-glow": "pulse-glow 3.4s ease-in-out infinite",
        shimmer: "shimmer 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
