import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: "#c7566a",
          dark: "#a13d4e",
          light: "#d88c9a",
          deep: "#8b1a2a",
        },
        sand: {
          DEFAULT: "#fbe3e6",
          dark: "#efcad0",
        },
        cream: "#fff5f7",
        gold: "#d4a373",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        dm: ["var(--font-dm)", "system-ui", "sans-serif"],
        vibes: ["var(--font-vibes)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
