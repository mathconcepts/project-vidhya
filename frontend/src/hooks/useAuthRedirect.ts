/**
 * useAuthRedirect — redirects authenticated users with exam profiles to /planned.
 *
 * Used by pages that are only meant for new/unauthenticated users
 * (OnboardPage, DiagnosticPage). If the visitor already has a JWT
 * and has at least one exam set up, they don't belong here.
 *
 * Returns `checking` (true while the async check runs) so the page
 * can show a spinner instead of briefly flashing its content.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, authFetch } from '@/lib/auth/client';

export function useAuthRedirect(destination = '/planned'): boolean {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(!!getToken()); // only check if token exists

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    authFetch('/api/student/profile')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data?.exams?.length > 0) {
          navigate(destination, { replace: true });
        } else {
          setChecking(false); // authenticated but no exams → show the page
        }
      })
      .catch(() => setChecking(false)); // error → show the page
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return checking;
}
