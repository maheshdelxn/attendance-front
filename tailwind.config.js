/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FFD700', // Safety Yellow
        secondary: '#1A1A1A', // Asphalt Black
        background: '#F4F4F4', // Concrete Gray
        success: '#00C853', // Safety Green
        danger: '#D50000', // Safety Red
        warning: '#DD2C00', // Deep Orange
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['System'], // Use system font for now
      },
    },
  },
  plugins: [],
};
