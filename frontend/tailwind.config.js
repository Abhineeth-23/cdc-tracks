/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Redefine blue to represent the HITAM brand green
        blue: {
          50: '#f3fbf1',
          100: '#e2f6dc',
          200: '#c8ecbe',
          300: '#a2de94',
          400: '#74ca62',
          500: '#4ba038', // Main brand green
          600: '#3b822b', // Standard button bg
          700: '#2f6722', // Text / highlights
          800: '#27521e',
          900: '#21441b',
        },
        // Redefine indigo to a deep forest/emerald green for smooth gradients
        indigo: {
          50: '#f0fbf0',
          100: '#dcf4dc',
          200: '#bbe6bb',
          300: '#8cd28c',
          400: '#55b755',
          500: '#3b823b',
          600: '#2d662d', // Deep gradient stop
          700: '#235023',
          800: '#1c3e1c',
          900: '#163216',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}