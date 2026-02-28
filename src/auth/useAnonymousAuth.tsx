/**
 * Anonymous authentication implementation
 * Auto-authenticates users without external provider
 */

import { useState, useEffect } from 'react';
import { AuthProvider, AuthUser } from './authProvider';

const ANON_USER_KEY = 'anonymous_user';

function generateAnonymousUser(): AuthUser {
  const adjectives = ['Swift', 'Silent', 'Mystic', 'Shadow', 'Bright', 'Dark', 'Cyber', 'Neo'];
  const nouns = ['Raven', 'Fox', 'Wolf', 'Phoenix', 'Dragon', 'Tiger', 'Hawk', 'Serpent'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);

  return {
    id: crypto.randomUUID(),
    username: `${adj}${noun}${num}`,
    name: `${adj} ${noun}`,
  };
}

export function useAnonymousAuth(): AuthProvider {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-authenticate on mount
    const stored = localStorage.getItem(ANON_USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        const newUser = generateAnonymousUser();
        localStorage.setItem(ANON_USER_KEY, JSON.stringify(newUser));
        setUser(newUser);
      }
    } else {
      const newUser = generateAnonymousUser();
      localStorage.setItem(ANON_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
    }
    setIsLoading(false);
  }, []);

  return {
    login: async () => {
      // Already authenticated, do nothing
    },
    logout: async () => {
      localStorage.removeItem(ANON_USER_KEY);
      setUser(null);
      // Force page reload to restart anonymous auth flow
      window.location.reload();
    },
    getUser: () => user,
    getToken: () => null, // No token in anonymous mode
    isAuthenticated: !!user,
    isLoading,
    error: undefined,
  };
}
