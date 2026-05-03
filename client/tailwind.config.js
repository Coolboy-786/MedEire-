/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        medeire: {
          blue: '#1e40af',
          green: '#16a34a',
          light: '#eff6ff',
        },
      },
    },
  },
  plugins: [],
};
