import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090a0f",
        foreground: "#f3f4f6",
        cinema: {
          dark: "#0b0d14",
          card: "#121520",
          cardHover: "#191d2c",
          border: "#202538",
          accent: "#f59e0b", // Cinema amber gold
          glow: "#fbbf24",
          crimson: "#e11d48",
          purple: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
