import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
// Self-hosted fonts (OFL-1.1, self-hosting expressly permitted).
//
// These were loaded from fonts.googleapis.com until 2026-08-15. The demo venue
// is assumed to have no network, so that request simply failed there and the
// --font-sans stack fell through -apple-system and SF Pro (Apple-only) and
// Inter Tight (unreachable) to Segoe UI / system-ui. Nothing broke, but
// DESIGN-SYSTEM.md treats typography as load-bearing — one family, type-led,
// hierarchy from weight and whitespace — and a demo that argues the product is
// carefully made should not render in a fallback face.
//
// Latin subsets only: the UI ships no Devanagari, and a script this app never
// renders is bytes every student downloads for nothing. Weights match exactly
// what the old <link> requested — 400/500/600/700 sans, 400/500/600 mono — so
// this is the same typography served from the same origin.
import '@fontsource/inter-tight/latin-400.css';
import '@fontsource/inter-tight/latin-500.css';
import '@fontsource/inter-tight/latin-600.css';
import '@fontsource/inter-tight/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import './styles/globals.css';
// Apply saved theme immediately to prevent flash of wrong theme
(function applyInitialTheme() {
  try {
    const stored = localStorage.getItem('vidhya-storage');
    const parsed = stored ? JSON.parse(stored) : null;
    const theme = parsed?.state?.theme ?? 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    document.documentElement.classList.add('dark'); // default: dark
  }
})();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

import { AuthProvider } from './contexts/AuthContext';
// ^ AuthProvider wraps the app so useAuth works in any page.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
