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
        bg: {
          base:     '#0f0a1e',
          surface:  '#1a1030',
          elevated: '#221540',
        },
        accent: {
          gold: '#f0c060',
        },
        game: {
          blue:   '#3b7dd8',
          green:  '#4a9f5c',
          red:    '#d44a4a',
          white:  '#c8c8d4',
          purple: '#9a60d0',
        },
        cardtype: {
          unit:     '#3b7dd8',
          pilot:    '#4a9f5c',
          command:  '#d47a2a',
          base:     '#7a4ab0',
          resource: '#888888',
        },
      },
    },
  },
  plugins: [],
}

export default config
