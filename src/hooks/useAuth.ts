import { useState, useCallback } from 'react';
import { UserProfile } from '../types';
import { INITIAL_USERS } from '../data/mockData';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const login = useCallback((role: 'trainee' | 'trainer' | 'admin') => {
    const user = INITIAL_USERS[role];
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const switchRole = useCallback((role: 'trainee' | 'trainer' | 'admin') => {
    const user = INITIAL_USERS[role];
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  return {
    currentUser,
    setCurrentUser,
    login,
    logout,
    switchRole,
    isAuthenticated: !!currentUser,
    role: currentUser?.role,
  };
}
