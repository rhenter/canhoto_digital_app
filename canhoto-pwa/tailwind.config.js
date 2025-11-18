/**** Tailwind CSS config for Canhoto Digital PWA ****/
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0ea5e9',
        },
        status: {
          pending: '#f59e0b', // orange-500
          delivered: '#10b981', // emerald-500
          problem: '#ef4444', // red-500
        }
      }
    }
  },
  plugins: []
}
