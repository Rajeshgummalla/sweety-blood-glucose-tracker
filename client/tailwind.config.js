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
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d2d9',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
        },
      },
    },
  },
  plugins: [],
}
