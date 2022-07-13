const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  mode: 'jit',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './common/**/*.{js,ts,jsx,tsx}',
    './rental-components/**/*.{js,ts,jsx,tsx}',
  ],
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './common/**/*.{js,ts,jsx,tsx}',
    './rental-components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Euclid Circular A', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: '#907EFF',
        'primary-hover': '#7567CE',
        border: 'rgba(221, 218, 218, 0.2)',
        secondary: '#7EFFE8',
        accent: '#CE81F4',
        'light-0': '#FFFFFF',
        'light-1': '#F5E2FF',
        'light-2': '#B1AFBB',
        'medium-3': '#8D8B9B',
        'medium-4': '#6D6C7C',
        'dark-5': '#0B0B0B',
        'dark-6': '#000000',
      },
    },
  },
  plugins: [],
}
