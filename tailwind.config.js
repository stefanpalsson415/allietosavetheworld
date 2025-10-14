/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'loading': 'loading 1.5s ease-in-out infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.2s ease-in-out',
        'fadeOut': 'fadeOut 0.2s ease-in-out',
        'scaleIn': 'scaleIn 0.2s ease-out',
        'scaleOut': 'scaleOut 0.2s ease-in',
      },
      keyframes: {
        loading: {
          '0%': { left: '-40%' },
          '100%': { left: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}