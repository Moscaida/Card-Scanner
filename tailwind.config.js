/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0f172a",
        "card-bg": "#1e293b",
        "card-hover": "#2d3f55",
        accent: "#0ea5e9",
        "accent-dark": "#0284c7",
      },
    },
  },
  plugins: [],
};
