import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#e8eef4",
        panel: "#151e27",
        accent: {
          DEFAULT: "#3dd6a5",
          deep: "#20b887",
        },
      },
    },
  },
  plugins: [],
};
export default config;
