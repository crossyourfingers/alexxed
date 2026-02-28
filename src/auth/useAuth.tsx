/**
 * Auth hook abstraction
 * Routes to appropriate auth implementation based on AUTH_MODE
 */

import { useAuth as useOidcAuth } from 'react-oidc-context';
import { AuthProvider, AUTH_MODE } from './authProvider';
import { useAnonymousAuth } from './useAnonymousAuth';

function useSpacetimeAuth(): AuthProvider {
  const auth = useOidcAuth();

  return {
    login: () => auth.signinRedirect(),
    logout: () => auth.signoutRedirect(),
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

export function useAuth(): AuthProvider {
  // Switch authentication implementation based on mode
  if (AUTH_MODE === 'anonymous') {
    return useAnonymousAuth();
  }

  return useSpacetimeAuth();
}
