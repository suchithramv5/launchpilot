/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#faf9f6',
        card: '#ffffff',
        border: {
          DEFAULT: '#e5e2dc',
          input: '#d8d4cc',
          divider: '#eeece7',
          divider2: '#f0eeea',
        },
        ink: {
          DEFAULT: '#3d3a35',
          secondary: '#55514a',
          tertiary: '#6b6862',
          muted: '#8a857c',
          faint: '#a6a29b',
        },
        accent: 'var(--accent)',
        status: {
          'ontrack-bg': 'oklch(94% 0.04 150)',
          'ontrack-text': 'oklch(35% 0.1 150)',
          'risk-bg': 'oklch(95% 0.05 85)',
          'risk-text': 'oklch(40% 0.12 85)',
          'blocked-bg': 'oklch(94% 0.05 25)',
          'blocked-text': 'oklch(45% 0.15 25)',
          'notstarted-bg': '#f3f1ec',
          'notstarted-text': '#6b6862',
          'neutral-bg': '#f3f1ec',
        },
      },
      borderRadius: {
        control: '8px',
        card: '12px',
        modal: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(32,29,25,0.05)',
        modal: '0 12px 32px rgba(32,29,25,0.14)',
        modalDeep: '0 12px 32px rgba(32,29,25,0.2)',
      },
    },
  },
  plugins: [],
};
