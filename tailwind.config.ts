import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coral: {
          50: "#FFF4F0",
          100: "#FFE4D9",
          500: "#F97A5A",
          600: "#E85A3A",
          700: "#C44520",
        },
        warm: {
          50: "#FAF7F2",
          100: "#F5EEE3",
          900: "#2B2520",
        },
        emerald: {
          600: "#1A6B5C",
          700: "#145449",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
