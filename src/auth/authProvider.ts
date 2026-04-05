/**
 * SpacetimeAuth configuration
 */

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  name?: string;
}

export interface AuthConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
}

export interface AuthProvider {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  removeUser: () => Promise<void>;
  getUser: () => AuthUser | null;
  getToken: () => string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: Error;
}

/**
 * SpacetimeAuth configuration
 */
export const ACTIVE_AUTH_CONFIG: AuthConfig = {
  authority: 'https://auth.spacetimedb.com/oidc',
  clientId: import.meta.env.VITE_SPACETIMEAUTH_CLIENT_ID || '',
  redirectUri: window.location.origin,
  scope: 'openid profile email',
};
