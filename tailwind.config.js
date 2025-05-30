// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // if you ever want to tweak the blur intensity:
      // backdropBlur: {
      //   xs: '2px',
      //   sm: '4px',
      //   md: '6px',
      // },
    },
  },
}