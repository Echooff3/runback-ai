/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom provider colors
        'openrouter': '#3B82F6',
        'replicate': '#8B5CF6',
        'fal': '#10B981',
      }
    },
  },
  plugins: [],
}
