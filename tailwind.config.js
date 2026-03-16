/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use a custom dark selector to match the app's theme toggling (html.theme-dark)
  darkMode: ['class', 'html.theme-dark'],
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // Custom colors to work with Angular Material
      colors: {
        primary: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
        },
        secondary: {
          50: 'var(--secondary-50)',
          100: 'var(--secondary-100)',
          500: 'var(--secondary-500)',
          600: 'var(--secondary-600)',
          700: 'var(--secondary-700)',
        },
        success: {
          500: 'var(--success-500)'
        },
        warning: {
          500: 'var(--warning-500)'
        },
        error: {
          500: 'var(--error-500)'
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

