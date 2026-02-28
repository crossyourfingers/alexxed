import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { StreamPage } from './pages/StreamPage.tsx';
import { CommunityPage } from './pages/CommunityPage.tsx';
import { LoginForm } from './LoginForm.tsx';
import { Identity } from 'spacetimedb';
import { SpacetimeDBProvider, useSpacetimeDB } from 'spacetimedb/react';
import { DbConnection, ErrorContext } from './module_bindings/index.ts';
import { AuthProvider } from 'react-oidc-context';
import { ACTIVE_AUTH_CONFIG, AUTH_MODE } from './auth/authProvider.ts';
import { useAuth } from './auth/useAuth.tsx';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'alexxed-u3k4f';

function AuthGate() {
  const auth = useAuth();
  const { isActive: connected } = useSpacetimeDB();

  if (auth.isLoading || !connected) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        color: '#22c55e',
        fontSize: '18px',
      }}>
        Connecting...
      </div>
    );
  }

  if (auth.error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        color: '#fca5a5',
        fontSize: '18px',
        padding: '20px',
        textAlign: 'center',
      }}>
        Authentication error: {auth.error.message}
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginForm />;
  }

  const user = auth.getUser();
  const username = user?.username || user?.name || user?.email || 'User';
  const handleLogout = () => auth.logout();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/community/general" replace />} />
      <Route path="/community" element={<Navigate to="/community/general" replace />} />
      <Route path="/community/:channelName" element={<CommunityPage username={username} onLogout={handleLogout} />} />
      <Route path="/stream" element={<StreamPage username={username} onLogout={handleLogout} />} />
    </Routes>
  );
}

function SpacetimeDBWrapper() {
  const auth = useAuth();

  const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
    console.log('Connected to SpacetimeDB with identity:', identity.toHexString());
  };

  const onDisconnect = () => {
    console.log('Disconnected from SpacetimeDB');
  };

  const onConnectError = (_ctx: ErrorContext, err: Error) => {
    console.error('Error connecting to SpacetimeDB:', err);
  };

  // Use OIDC token for SpacetimeDB authentication
  const token = auth.getToken();

  const connectionBuilder = DbConnection.builder()
    .withUri(HOST)
    .withDatabaseName(DB_NAME)
    .withToken(token || undefined)
    .onConnect(onConnect)
    .onDisconnect(onDisconnect)
    .onConnectError(onConnectError);

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <AuthGate />
    </SpacetimeDBProvider>
  );
}

// OIDC configuration for SpacetimeAuth mode
const oidcConfig = {
  authority: ACTIVE_AUTH_CONFIG.authority,
  client_id: ACTIVE_AUTH_CONFIG.clientId,
  redirect_uri: ACTIVE_AUTH_CONFIG.redirectUri,
  scope: ACTIVE_AUTH_CONFIG.scope,
  response_type: 'code',
  onSigninCallback: () => {
    // Remove query params after auth
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

// Conditionally wrap with OIDC provider based on auth mode
const RootApp = () => {
  if (AUTH_MODE === 'anonymous') {
    // Anonymous mode: no OIDC provider needed
    return <SpacetimeDBWrapper />;
  }

  // SpacetimeAuth mode: wrap with OIDC provider
  return (
    <AuthProvider {...oidcConfig}>
      <SpacetimeDBWrapper />
    </AuthProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </StrictMode>
);
