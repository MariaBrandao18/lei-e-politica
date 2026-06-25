import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F4F2EC',
        ink: '#1A1B18',
        surface: '#FBFAF6',
        line: '#E2DED2',
        forest: '#13352F',
        gold: '#E8B43A',
        fav: '#1F7A5C',
        favbg: '#E4F1EA',
        neu: '#B08A28',
        neubg: '#F6EFDA',
        neubar: '#D7B45A',
        con: '#BE4A2F',
        conbg: '#F8E6E0',
        muted: '#5A5D53',
        faint: '#8A8D80',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
