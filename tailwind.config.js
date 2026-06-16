export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        brown: { 50: '#F5F0EB', 100: '#E8DDD3', 200: '#D4C0A8', 300: '#C9A96E', 400: '#B08D57', 500: '#5C3D2E', 600: '#4A3125', 700: '#3D281E', 800: '#2D1F18', 900: '#1E1410' },
        gold: { 300: '#D4B87A', 400: '#C9A96E', 500: '#B8944F', 600: '#9A7B3F' },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-out-right': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.8)', opacity: '1' }, '100%': { transform: 'scale(2)', opacity: '0' } },
        'shake': { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out',
        'pulse-ring': 'pulse-ring 1s ease-out infinite',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
