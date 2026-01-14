const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "#10141e",
            primary: {
              DEFAULT: "#2563eb", // Blue for trust and professionalism
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#22c55e", // Green for growth and stability
              foreground: "#ffffff",
            },
            accent: {
              DEFAULT: "#fbbf24", // Gold for luxury and value
              foreground: "#1e293b",
            },
            focus: "#22d3ee", // Cyan for highlights
            content1: "#1a2233",
            content2: "#232b3b",
          },
        },
        light: {
          colors: {
            background: "#f8fafc",
            primary: {
              DEFAULT: "#2563eb", // Blue for trust and professionalism
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#22c55e", // Green for growth and stability
              foreground: "#ffffff",
            },
            accent: {
              DEFAULT: "#fbbf24", // Gold for luxury and value
              foreground: "#1e293b",
            },
            focus: "#06b6d4", // Cyan for highlights
            content1: "#e0e7ef",
            content2: "#ffffffff",
          },
        },
      },
    }),
  ],
};