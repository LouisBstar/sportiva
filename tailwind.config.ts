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
        primary: {
          DEFAULT: "#1A73E8",
          50: "#EAF2FD",
          100: "#D5E6FB",
          200: "#ABCDF7",
          300: "#81B4F3",
          400: "#579BEF",
          500: "#1A73E8",
          600: "#155CBA",
          700: "#10458B",
          800: "#0A2E5D",
          900: "#05172E",
        },
        accent: {
          DEFAULT: "#34A853",
          light: "#E8F5ED",
        },
        warning: {
          DEFAULT: "#E65100",
          light: "#FFF3EC",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
