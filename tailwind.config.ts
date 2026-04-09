import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1C398E",
        "primary-hover": "#162456",
        link: "#155DFC",
        "text-dark": "#101828",
        "text-gray": "#4A5565",
        "text-label": "#364153",
        "text-input": "#0A0A0A",
        "text-muted": "#6A7282",
        border: "#D1D5DC",
        "feature-blue": "#51A2FF",
        "light-blue": "#DBEAFE",
        // Redesign tokens — usable as bg-juriscan-navy, text-juriscan-blue, etc.
        // Existing components still use hardcoded hex values; these tokens are
        // available for new code or future cleanup.
        juriscan: {
          navy: "#0f1923",
          blue: "#1a4fd6",
          "blue-light": "#eff4ff",
          "blue-mid": "#1a2433",
          "blue-dark": "#1a3a8f",
          border: "#1e2d3d",
          "text-muted": "#6b8aaa",
          "text-secondary": "#7a9ab8",
          surface: "#f5f7fa",
        },
      },
      fontFamily: {
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-playfair)", "Playfair Display", "serif"],
        "dm-sans": ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      borderRadius: {
        input: "10px",
        button: "10px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      minHeight: {
        touch: "44px",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "slide-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "modal-up": {
          from: { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "float-1": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(30px, -30px) rotate(120deg)" },
          "66%": { transform: "translate(-20px, 20px) rotate(240deg)" },
        },
        "float-2": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(-30px, 20px) rotate(-120deg)" },
          "66%": { transform: "translate(20px, -30px) rotate(-240deg)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "slide-left": "slide-left 0.3s ease-out",
        "slide-right": "slide-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "modal-up": "modal-up 0.3s ease-out both",
        shake: "shake 0.5s ease-in-out",
        "bounce-subtle": "bounce-subtle 0.6s ease-in-out",
        "float-1": "float-1 20s ease-in-out infinite",
        "float-2": "float-2 25s ease-in-out infinite",
      },
    },
  },
  plugins: [typography],
};
export default config;
