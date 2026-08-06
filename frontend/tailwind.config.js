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
      },
      boxShadow: {
        glow: "0 0 30px rgba(45, 212, 255, 0.18)",
        "glow-green": "0 0 24px rgba(46, 229, 157, 0.16)",
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(45, 212, 255, .08) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 212, 255, .08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
