/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors:{
        "brand-green": "#03B155",
        "brand-grey":"#EFEFEF"
      }
    },
  },
  plugins: [],
}

