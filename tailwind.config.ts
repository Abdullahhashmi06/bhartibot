import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Color System
        primary: {
          DEFAULT: "#0B1F3A",
          dark: "#081426",
          light: "#16233B",
        },
        teal: {
          DEFAULT: "#17C6B5",
          light: "#E8FAF8",
          dark: "#0F9B8E",
        },
        emerald: {
          DEFAULT: "#29D391",
          light: "#EAFBF4",
        },
        purple: {
          ai: "#6F52ED",
          light: "#F0EEFE",
        },
        sidebar: "#081426",
        background: "#F7F9FC",
        card: "#FFFFFF",
        // Typography Colors
        text: {
          primary: "#16233B",
          secondary: "#6D7A92",
          muted: "#A4B0C2",
        },
        // Status Colors
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        border: "#E2E8F0",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(11, 31, 58, 0.05), 0 1px 2px -1px rgba(11, 31, 58, 0.05)",
        card: "0 4px 20px -2px rgba(11, 31, 58, 0.05)",
        hover: "0 10px 30px -4px rgba(11, 31, 58, 0.12)",
        ai: "0 10px 35px -5px rgba(111, 82, 237, 0.25)",
        teal: "0 10px 35px -5px rgba(23, 198, 181, 0.25)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #17C6B5 0%, #6F52ED 100%)",
        "gradient-radial-ai": "radial-gradient(circle at top right, rgba(111, 82, 237, 0.15), transparent 50%)",
        "gradient-card-glow": "linear-gradient(180deg, rgba(23, 198, 181, 0.03) 0%, rgba(255, 255, 255, 1) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
