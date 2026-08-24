/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        qcommerce: {
          yellow: "#FFC900",
          black: "#1C1C1E",
          gray: "#F3F4F6",
        },
        diet: {
          primary: "#10B981",    // Emerald 500
          dark: "#065F46",       // Emerald 800
          light: "#ECFDF5",      // Emerald 50
          accent: "#34D399",     // Emerald 400
        }
      },
    },
  },
  plugins: [],
}
