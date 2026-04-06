/**
 * Auth hook - thin wrapper around SpacetimeAuth (react-oidc-context)
 */

import { useAuth as useOidcAuth } from 'react-oidc-context';
import { type AuthProvider } from './authProvider';

export function useAuth(): AuthProvider {
  const auth = useOidcAuth();

  return {
    login: () => {
      const hash = window.location.hash;
      const state = (hash && hash !== '#/') ? { returnTo: hash } : undefined;
      return auth.signinRedirect({ state });
    },
    logout: () => auth.signoutRedirect(),
    removeUser: () => auth.removeUser(),
    getUser: () => {
      if (!auth.user) return null;
      return {
        id: auth.user.profile.sub || '',
        username: auth.user.profile.preferred_username as string | undefined,
        email: auth.user.profile.email as string | undefined,
        name: auth.user.profile.name as string | undefined,
      };
    },
    getToken: () => auth.user?.id_token || null,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error || undefined,
  };
}
