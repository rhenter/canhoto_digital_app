/**** Tailwind CSS config for Canhoto Digital PWA ****/
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0ea5e9',
        }
      }
    }
  },
  plugins: []
}
