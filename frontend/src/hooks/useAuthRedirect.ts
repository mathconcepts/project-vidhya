/**
 * useAuthRedirect — redirects authenticated users with exam profiles to /planned.
 *
 * Used by pages only meant for new/unauthenticated users (OnboardPage,
 * DiagnosticPage). If the visitor has a JWT AND has at least one exam set
 * up, they are redirected immediately.
 *
 * Stale token handling: if the token exists but the server returns 401
 * (e.g. after a demo:reset that changed user IDs), the stale token is
 * cleared so the page renders as if the user is anonymous.
 *
 * Returns `checking` (true while the async check runs) so callers can
 * show a spinner instead of briefly flashing the wrong content.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, authFetch, clearToken } from '@/lib/auth/client';

export function useAuthRedirect(destination = '/planned'): boolean {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(!!getToken());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setChecking(false);
      return;
    }
    authFetch('/api/student/profile')
      .then(r => {
        if (r.status === 401) {
          // Stale or invalid token — clear it so the page renders as anonymous.
          clearToken();
          setChecking(false);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data: any) => {
        if (!data) return; // already handled above
        if (data?.exams?.length > 0) {
          navigate(destination, { replace: true });
        } else {
          setChecking(false); // valid token, no exams yet → show the page (new user)
        }
      })
      .catch(() => setChecking(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return checking;
}
