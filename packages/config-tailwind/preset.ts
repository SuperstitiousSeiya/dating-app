import type { Config } from "tailwindcss";

const preset: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff0f3",
          100: "#ffe0e8",
          200: "#ffc6d5",
          300: "#ff9db5",
          400: "#ff6491",
          500: "#ff3070",
          600: "#ed1055",
          700: "#c80742",
          800: "#a8093a",
          900: "#8f0b37",
          950: "#500019",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cal)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "swipe-left": "swipeLeft 0.3s ease-in forwards",
        "swipe-right": "swipeRight 0.3s ease-in forwards",
        "card-enter": "cardEnter 0.25s ease-out",
        "fade-up": "fadeUp 0.2s ease-out",
      },
      keyframes: {
        swipeLeft: {
          to: { transform: "translateX(-150%) rotate(-30deg)", opacity: "0" },
        },
        swipeRight: {
          to: { transform: "translateX(150%) rotate(30deg)", opacity: "0" },
        },
        cardEnter: {
          from: { transform: "scale(0.96)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
};

export default preset;
