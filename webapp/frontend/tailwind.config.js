/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brawlr: {
          bg: "#0B0C10",
          red: "#FF2E2E",
          blue: "#00FFFF",
          yellow: "#FFB800",
          text: "#F5F5F5",
        },
      },
    },
  },
  plugins: [],
};
