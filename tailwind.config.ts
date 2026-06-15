import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        "on-background": "rgb(var(--on-background) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          dim: "rgb(var(--primary-dim) / <alpha-value>)",
          container: "rgb(var(--primary-container) / <alpha-value>)",
          "fixed-dim": "rgb(var(--primary-fixed-dim) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          dim: "rgb(var(--secondary-dim) / <alpha-value>)",
        },
        "on-secondary": "rgb(var(--on-secondary) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          container: {
            lowest: "rgb(var(--surface-lowest) / <alpha-value>)",
            low: "rgb(var(--surface-low) / <alpha-value>)",
            DEFAULT: "rgb(var(--surface-container) / <alpha-value>)",
            high: "rgb(var(--surface-high) / <alpha-value>)",
            highest: "rgb(var(--surface-highest) / <alpha-value>)",
          }
        },
        "on-surface": "rgb(var(--on-surface) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--on-surface-variant) / <alpha-value>)",
        outline: "rgb(var(--outline) / <alpha-value>)",
        "outline-variant": "rgb(var(--outline-variant) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          dim: "rgb(var(--gold-dim) / <alpha-value>)",
        },
      },
      fontFamily: {
        headline: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-cormorant)", "serif"],
        label: ["var(--font-montserrat)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
        "alex-brush": ["var(--font-alex-brush)", "cursive"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
