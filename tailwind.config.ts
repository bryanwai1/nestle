import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nestle: {
          red: "#E2001A",
          "red-dark": "#B5001A",
          "red-light": "#FDEAEA",
          blue: "#1B3A6B",
          "blue-mid": "#2B5BA8",
          "blue-light": "#EBF0FA",
          green: "#00853F",
          "green-light": "#E6F4EC",
          gold: "#F5A623",
          "gold-light": "#FEF6E6",
        },
        gray: {
          50: "#F5F7FA",
          100: "#EBEEF4",
          200: "#D6DCE8",
          300: "#B8C0D0",
          400: "#8E99B0",
          500: "#6B7A99",
          600: "#4A5568",
          700: "#374151",
          800: "#1F2937",
          900: "#1A202C",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(27,58,107,0.08), 0 1px 2px rgba(27,58,107,0.04)",
        "card-hover": "0 8px 24px rgba(27,58,107,0.14)",
        "card-md": "0 4px 12px rgba(27,58,107,0.10), 0 2px 4px rgba(27,58,107,0.06)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "ticker": "ticker 30s linear infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
