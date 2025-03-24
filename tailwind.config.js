/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        amber: {
          500: '#f59e0b',
          700: '#b45309',
        },
      },
    },
  },
  variants: {
    extend: {
      scale: ['group-hover'],
      shadow: ['group-hover'],
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio')
  ],
};

