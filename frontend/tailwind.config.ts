import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🎨 Paleta de colores EXACTA de Proogia (del Figma)
      colors: {
        // Colores principales de Proogia
        primary: {
          50: "#f0fdf4", // green-50
          100: "#dcfce7", // green-100
          200: "#bbf7d0", // green-200
          300: "#86efac", // green-300
          400: "#4ade80", // green-400
          500: "#22c55e", // green-500 (principal)
          600: "#16a34a", // green-600
          700: "#15803d", // green-700
          800: "#166534", // green-800
          900: "#14532d", // green-900
          DEFAULT: "#22c55e", // Color principal
        },
        // Grises neutros para UI
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // Estados y feedback
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      // 📱 Breakpoints responsive optimizados
      screens: {
        xs: "475px", // Móvil grande
        sm: "640px", // Tablet pequeña
        md: "768px", // Tablet
        lg: "1024px", // Desktop
        xl: "1280px", // Desktop grande
        "2xl": "1536px", // Desktop extra grande
      },
      // 🔤 Tipografía Roboto (del Figma)
      fontFamily: {
        sans: ["Roboto", "ui-sans-serif", "system-ui"],
        mono: ["Roboto Mono", "ui-monospace"],
      },
      // 📏 Espaciado y tamaños
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      // 🎭 Animaciones suaves
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      // 🖥️ Componentes reutilizables
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        strong: "0 8px 30px -12px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [
    // Plugin para formularios mejorados
    require("@tailwindcss/forms"),
  ],
};

export default config;
