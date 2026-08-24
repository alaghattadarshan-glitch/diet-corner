/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          soft: "var(--brand-soft)",
        },
        qcommerce: {
          yellow: "var(--brand-primary)",
          black: "var(--text-primary)",
          gray: "var(--text-secondary)",
        },
        diet: {
          primary: "var(--brand-primary)",
          dark: "#4C1D95",
          light: "var(--brand-soft)",
          accent: "var(--brand-secondary)",
        }
      },
    },
  },
  plugins: [],
}
