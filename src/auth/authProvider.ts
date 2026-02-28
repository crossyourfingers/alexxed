/**
 * Authentication abstraction layer
 * Allows switching between different OAuth2/OIDC providers or anonymous mode
 */

export type AuthMode = 'spacetimeauth' | 'anonymous';

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
  getUser: () => AuthUser | null;
  getToken: () => string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: Error;
}

/**
 * Determine which auth mode to use
 * The application uses SpacetimeAuth (OIDC) only. Anonymous mode is deprecated.
 */
export const AUTH_MODE: AuthMode = 'spacetimeauth';

/**
 * SpacetimeAuth configuration
 * Switch to a different provider by implementing this interface
 */
export const SPACETIMEAUTH_CONFIG: AuthConfig = {
  authority: 'https://auth.spacetimedb.com/oidc',
  clientId: import.meta.env.VITE_SPACETIMEAUTH_CLIENT_ID || '',
  redirectUri: window.location.origin,
  scope: 'openid profile email',
};

/**
 * Alternative provider configurations (examples)
 */
export const AUTH0_CONFIG: AuthConfig = {
  authority: `https://${import.meta.env.VITE_AUTH0_DOMAIN}`,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  redirectUri: window.location.origin,
  scope: 'openid profile email',
};

export const CLERK_CONFIG: AuthConfig = {
  authority: `https://${import.meta.env.VITE_CLERK_DOMAIN}`,
  clientId: import.meta.env.VITE_CLERK_CLIENT_ID || '',
  redirectUri: window.location.origin,
  scope: 'openid profile email',
};

// Active configuration - switch this to change providers
export const ACTIVE_AUTH_CONFIG = SPACETIMEAUTH_CONFIG;
