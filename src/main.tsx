import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { LoginForm } from './LoginForm.tsx';
import { Identity } from 'spacetimedb';
import { SpacetimeDBProvider, useSpacetimeDB } from 'spacetimedb/react';
import { DbConnection, ErrorContext } from './module_bindings/index.ts';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'alexxed-u3k4f';
const AUTH_USERNAME_KEY = `${HOST}/${DB_NAME}/username`;

function AuthGate() {
  const [username, setUsername] = useState(localStorage.getItem(AUTH_USERNAME_KEY) || '');
  const { isActive: connected } = useSpacetimeDB();

  if (!connected) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Connecting...</div>;
  }

  if (!username) {
    return <LoginForm onSuccess={(user) => {
      localStorage.setItem(AUTH_USERNAME_KEY, user);
      setUsername(user);
    }} />;
  }

  return <App username={username} onLogout={() => {
    localStorage.removeItem(AUTH_USERNAME_KEY);
    setUsername('');
  }} />;
}

function Root() {
  const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
    console.log('Connected to SpacetimeDB with identity:', identity.toHexString());
  };

  const onDisconnect = () => {
    console.log('Disconnected from SpacetimeDB');
  };

  const onConnectError = (_ctx: ErrorContext, err: Error) => {
    console.error('Error connecting to SpacetimeDB:', err);
  };

  const connectionBuilder = DbConnection.builder()
    .withUri(HOST)
    .withDatabaseName(DB_NAME)
    .onConnect(onConnect)
    .onDisconnect(onDisconnect)
    .onConnectError(onConnectError);

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <AuthGate />
    </SpacetimeDBProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
