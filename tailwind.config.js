/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#000000',
        chip: '#efefef',
        hover: '#e2e2e2',
        body: '#4b4b4b',
        muted: '#afafaf',
        surface: '#ffffff',
      }
    },
  },
  plugins: [],
}
