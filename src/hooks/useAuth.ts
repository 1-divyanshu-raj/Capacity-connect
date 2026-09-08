import { useCallback, useEffect, useState } from 'react';
import type { UserRole, UserProfile } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import {
  fetchSecurityConfig,
  fetchSession,
  logout as apiLogout,
  type SecurityConfig,
  type SessionResponse,
} from '../lib/authApi';
import { setCsrfToken } from '../lib/api';

/**
 * Portal session/auth hook.
 *
 * `login(role)` resolves the *display* profile for a role, but the role and the
 * authenticated flag are only honoured once the server has issued a session
 * (`/api/auth/verify-factor`), because every privileged API call is checked
 * against that session cookie on the server. The browser keeps no token, no
 * user object and no role in `localStorage`/`sessionStorage` — nothing to steal
 * from disk and nothing to tamper with.
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Bootstrap: pick up an existing server session (CSRF token + principal) and
  // the public policy document. Failures are non-fatal by design.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [config, activeSession] = await Promise.all([fetchSecurityConfig(), fetchSession()]);
      if (cancelled) return;
      setSecurityConfig(config);
      setSession(activeSession);
      setSessionChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Called after the third factor succeeded; adopts the issued session. */
  const adoptSession = useCallback((issued: SessionResponse) => {
    setSession(issued);
    setCsrfToken(issued.csrfToken ?? null);
    const profile = issued.role ? INITIAL_USERS[issued.role] : null;
    if (profile) setCurrentUser(profile);
  }, []);

  const login = useCallback((role: UserRole) => {
    // Display-role switch only. UI routing is role-isolated; data access is
    // authorised by the server session, not by this value.
    const user = INITIAL_USERS[role];
    if (user) setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setSession(null);
    setCsrfToken(null);
    apiLogout();
  }, []);

  return {
    currentUser,
    setCurrentUser,
    login,
    logout,
    adoptSession,
    session,
    securityConfig,
    sessionChecking,
    isAuthenticated: !!currentUser,
    role: currentUser?.role,
  };
}

/** Mirrors the previous export surface used by `src/hooks/index.ts`. */
export type { SecurityConfig, SessionResponse };
