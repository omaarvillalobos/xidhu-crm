import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        xidhu: {
          teal: '#2DC4C4',
          yellow: '#F5C12E',
          orange: '#F47B20',
          red: '#E63329',
          green: '#5DB544',
          blue: '#3B6FBF',
          purple: '#9B59B6',
          pink: '#E84393',
          offwhite: '#FAFAF6',
          dark: '#1A1A2E',
          mid: '#4A4A5A',
        },
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        dmSans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
