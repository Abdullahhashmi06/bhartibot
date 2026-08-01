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
          DEFAULT: "#0F172A",
          dark: "#020617",
          light: "#1E293B",
        },
        teal: {
          DEFAULT: "#0D9488",
          light: "#F0FDFA",
          dark: "#0B7A70",
        },
        emerald: {
          DEFAULT: "#10B981",
          light: "#ECFDF5",
        },
        purple: {
          ai: "#6F52ED",
          light: "#F0EEFE",
        },
        sidebar: "#020617",
        background: "#F8FAFC",
        card: "#FFFFFF",
        // Typography Colors
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
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
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        hover: "0 10px 30px -4px rgba(15, 23, 42, 0.12)",
        ai: "0 10px 35px -5px rgba(111, 82, 237, 0.25)",
        teal: "0 10px 35px -5px rgba(13, 148, 136, 0.3)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0D9488 0%, #10B981 50%, #6F52ED 100%)",
        "gradient-radial-ai": "radial-gradient(circle at top right, rgba(111, 82, 237, 0.15), transparent 50%)",
        "gradient-card-glow": "linear-gradient(180deg, rgba(13, 148, 136, 0.04) 0%, rgba(255, 255, 255, 1) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
