module.exports = {
  plugins: {
    // Must run first: inlines the @import "./tokens/*.css" statements in
    // src/styles/globals.css (which come after the @tailwind directives —
    // see MIGRATION.md step 2). Without this plugin, PostCSS/Vite silently
    // drops those @import rules instead of erroring, so the whole Clarity
    // design-token set (--surface-canvas, --green, --indigo, --font-sans,
    // etc.) never made it into the built CSS at all, even though every
    // component already reads the tokens via var(--...) — they simply
    // resolved to nothing. This was the second half of why Clarity wasn't
    // visible on the deployed build (the first half was InstitutePage.tsx's
    // syntax error breaking the whole frontend build outright).
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
