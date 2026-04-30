/** @type {import('tailwindcss').Config} */
//
// DESIGN SYSTEM v2.3 — see DESIGN-SYSTEM.md.
//
// Color migration (Phase A — additive only; Phase B will replace `primary`/`accent` callsites):
//
//   surface.*  — currently zinc-based, will migrate to navy in Phase B
//   navy.*     — NEW v2.3: deep navy palette (the actual app background per DESIGN-SYSTEM.md)
//   primary.*  — currently sky-blue (legacy); semantically still in use
//   emerald.*  — NEW v2.3: mastery / success / primary CTA (replaces `primary` in Phase B)
//   accent.*   — currently fuchsia (legacy); semantically still in use
//   violet.*   — NEW v2.3: AI / Tutor / Study Plan signature (replaces `accent` in Phase B)
//
// Typography:
//   font-display — Fraunces (variable serif, ≥18px only)
//   font-sans    — DM Sans (body)
//   font-mono    — JetBrains Mono (math / code)
//   font-legacy  — Inter (kept while Phase B migration in progress)
//
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        legacy: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── v2.3 navy palette (DESIGN-SYSTEM.md target) ──
        navy: {
          50: '#f0f4fb',
          100: '#dbe3f1',
          200: '#b9c6e0',
          300: '#8ea0c6',
          400: '#6478a8',
          500: '#3f5485',
          600: '#293b66',
          700: '#1f2c4d',
          800: '#1f2937', // surface-2 in DESIGN-SYSTEM.md
          900: '#111827', // surface-1 in DESIGN-SYSTEM.md
          950: '#0a0f1a', // background in DESIGN-SYSTEM.md
        },
        // ── v2.3 mastery accent (replaces `primary` in Phase B) ──
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // primary mastery accent per DESIGN-SYSTEM.md
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // ── v2.3 signature: AI / Tutor / Study Plan (replaces `accent` in Phase B) ──
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa', // signature per DESIGN-SYSTEM.md — AI/Tutor only
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // ── Legacy (kept until Phase B migration completes) ──
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
      },
    },
  },
  plugins: [],
};
