/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F3EC',
        ink: '#1B1B18',
        rust: '#C6603C',
        sage: '#6B7A64',
        gold: '#C9A15A',
        film: '#94A08C',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
    },
  },
  plugins: [],
};
