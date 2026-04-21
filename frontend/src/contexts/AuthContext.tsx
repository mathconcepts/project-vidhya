import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  fetchMe, signOut as apiSignOut, getToken, setToken as storeToken,
  type ClientUser, type Role, roleGte,
} from '@/lib/auth/client';

interface AuthContextValue {
  user: ClientUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setToken: (t: string) => void;
  hasRole: (min: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    setLoading(true);
    try {
      const me = await fetchMe();
      setUser(me);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Listen for storage changes (cross-tab)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vidhya.auth.token.v1') { refresh(); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  const setToken = useCallback((t: string) => {
    storeToken(t);
    refresh();
  }, [refresh]);

  const hasRole = useCallback((min: Role) => roleGte(user?.role, min), [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut, setToken, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
