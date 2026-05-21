/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Syne'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e3a8a",
          900: "#1e3270",
          950: "#172554",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        accent: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
        },
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(30,58,138,0.07)",
        "card-hover": "0 8px 32px 0 rgba(30,58,138,0.13)",
        glow: "0 0 40px rgba(37,99,235,0.15)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
        "card-gradient": "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
        "mesh": "radial-gradient(at 40% 20%, hsla(217,100%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(217,100%,70%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(217,100%,50%,0.1) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};
