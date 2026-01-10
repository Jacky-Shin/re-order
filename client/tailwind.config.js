/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sb-green': '#00704A',
        'sb-dark-green': '#1e3932',
        'sb-light-green': '#d4e9e2',
      }
    },
  },
  plugins: [],
}
