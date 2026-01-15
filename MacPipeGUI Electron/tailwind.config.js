/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#ff79c6',
          hover: '#bd5b94',
          subtle: '#ff79c620',
        },
        bg: {
          main: '#121212',
          dark: '#1e1e1e',
          card: '#2d2d2d',
        },
        text: {
          DEFAULT: '#f8f8f2',
          muted: '#6272a4',
        }
      }
    },
  },
  plugins: [],
}
