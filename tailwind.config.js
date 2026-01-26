/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Dark mode color palette
        // Background (page): gray-900 (#111827)
        // Surface (cards/panels): gray-800 (#1F2937)
        // Surface (elevated): gray-700 (#374151)
        // Text (primary): gray-100 (#F3F4F6)
        // Text (secondary): gray-300 (#D1D5DB)
        // Border: gray-700 (#374151)
        // Accent (blue): blue-400 (#60A5FA) for dark mode
        // These colors are already in Tailwind's default palette, so no need to extend
        // WCAG AA contrast ratios:
        // - gray-100 on gray-900: ~12:1 (passes 4.5:1 requirement)
        // - gray-100 on gray-800: ~9:1 (passes 4.5:1 requirement)
        // - gray-300 on gray-800: ~5:1 (passes 4.5:1 requirement)
      },
    },
  },
  plugins: [],
}
