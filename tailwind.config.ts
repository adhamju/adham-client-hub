import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0E0F12",
          surface: "#17181D",
          raised: "#1E2026",
          border: "#2A2C33",
        },
        ink: {
          DEFAULT: "#F2F1ED",
          dim: "#9A9CA6",
          faint: "#63656E",
        },
        signal: {
          // `action` follows the primary color chosen in Settings.
          action: "rgb(var(--accent) / <alpha-value>)",
          waiting: "#3E7FE0",
          done: "#3FAE7A",
          hold: "#E0A430",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
