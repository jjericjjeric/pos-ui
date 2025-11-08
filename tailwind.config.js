/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#764ba2',
        },
        accent: {
          DEFAULT: '#ff9800',
          dark: '#ff5722',
        }
      },
      animation: {
        'modal-in': 'modalIn 160ms ease-out',
        'modal-out': 'modalOut 180ms ease-in forwards',
        'pop-in': 'popIn 420ms cubic-bezier(0.26, 1.12, 0.62, 1)',
        'fade-in-check': 'fadeInCheck 460ms ease-in-out',
      },
      keyframes: {
        modalIn: {
          'from': { transform: 'translateY(8px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        modalOut: {
          'from': { transform: 'translateY(0)', opacity: '1' },
          'to': { transform: 'translateY(8px)', opacity: '0' },
        },
        fadeOverlayOut: {
          'from': { opacity: '1' },
          'to': { opacity: '0' },
        },
        popIn: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        fadeInCheck: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.7)' },
          '60%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.15)' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
