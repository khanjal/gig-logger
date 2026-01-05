/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // Custom colors to work with Angular Material
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1976d2',
          700: '#1565c0',
        }
      },
      // Custom spacing for compact designs
      spacing: {
        '0.5': '0.125rem',
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
  // Ensure compatibility with Angular Material
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to avoid conflicts with Angular Material
  }
}

