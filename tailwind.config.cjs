/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./functions/**/*.js', './scripts/**/*.mjs'],
  theme: {
    extend: {
      colors: {
        hollywood: {
          red: '#d32f2f',
          darkred: '#b71c1c',
          gold: '#c5a059',
          black: '#121212',
          charcoal: '#1e1e1e',
          lightgray: '#f7f7f8',
          border: '#e5e7eb',
        },
      },
      fontFamily: {
        serif: ['"Lora"', '"Newsreader"', '"Noto Sans Devanagari"', 'Georgia', 'serif'],
        headline: ['"Cinzel"', '"Lora"', '"Noto Sans Devanagari"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
