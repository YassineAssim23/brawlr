/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
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
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
      },
    },
  },
  plugins: [],
};
