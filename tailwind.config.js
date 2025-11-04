/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This scans all JSX files in src
  ],
  darkMode: 'class', // This enables the 'dark:' prefix
  theme: {
    extend: {},
  },
  plugins: [],
}