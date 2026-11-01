/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        office: {
          blue: '#185abd',
          darkBlue: '#0f3c85',
          lightBlue: '#eef3fc',
          orange: '#d83b01',
          teal: '#008272',
          purple: '#5c2d91'
        }
      }
    },
  },
  plugins: [],
}
