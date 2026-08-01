/** @type {import('tailwindcss').Config} */
// Clarity design system — see DESIGN-SYSTEM.md and design/clarity/
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--surface-canvas)',
        card: 'var(--surface-card)',
        fill: 'var(--surface-fill)',
        ink: 'var(--ink)',
        mastery: 'var(--green)',
        tutor: 'var(--indigo)',
      },
      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '28px',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
};
