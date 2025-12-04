/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // 👇 custom 1px scrollbar width style
      scrollbar: {
        thin: {
          '&::-webkit-scrollbar': {
            width: '1px',
            height: '1px',
          },
        },
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],
}
