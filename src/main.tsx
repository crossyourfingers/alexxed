import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { StreamPage } from "./pages/StreamPage.tsx";
import { CommunityPage } from "./pages/CommunityPage.tsx";
import { StreamerProfilePage } from "./pages/StreamerProfilePage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { LoginForm } from "./LoginForm.tsx";
import { VotePage } from "./pages/VotePage";
import { GameListPage } from "./pages/GameListPage";
import { Identity } from "spacetimedb";
import {
  SpacetimeDBProvider,
  useSpacetimeDB,
  useTable,
} from "spacetimedb/react";
import { DbConnection, ErrorContext, tables } from "./module_bindings/index.ts";
import { AuthProvider } from "react-oidc-context";
import { ACTIVE_AUTH_CONFIG } from "./auth/authProvider.ts";
import { useAuth } from "./auth/useAuth.tsx";

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? "ws://localhost:3000";
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? "alexxed-u3k4f";

function AuthGate() {
  const auth = useAuth();
  const { identity, isActive: connected } = useSpacetimeDB();
  const [users] = useTable(tables.user);

  if (auth.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#22c55e",
          fontSize: "18px",
          gap: "10px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "24px" }}>
          Connecting to Alexxed...
        </div>
        <div style={{ fontSize: "14px", opacity: 0.8 }}>
          Verifying session...
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#fca5a5",
          fontSize: "18px",
          padding: "20px",
          textAlign: "center",
          gap: "10px",
        }}
      >
        <div>Authentication Error</div>
        <div style={{ fontSize: "14px" }}>
          {auth.error.message}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginForm />;
  }

  if (!connected || !identity) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#22c55e",
          fontSize: "18px",
          gap: "10px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "24px" }}>
          Connecting to Alexxed...
        </div>
        <div style={{ fontSize: "14px", opacity: 0.8 }}>
          Initializing database connection...
        </div>
      </div>
    );
  }

  // Get username from database (reactive to name changes) or fallback to auth profile
  const currentUser = identity
    ? users.find((u) => u.userIdentity.isEqual(identity))
    : null;
  const authUser = auth.getUser();
  const username =
    currentUser?.name ||
    authUser?.username ||
    authUser?.name ||
    authUser?.email ||
    identity?.toHexString().substring(0, 8) ||
    "User";
  const handleLogout = () => auth.logout();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/community/general" replace />} />
      <Route
        path="/community"
        element={<Navigate to="/community/general" replace />}
      />
      <Route
        path="/community/:channelName"
        element={<CommunityPage username={username} onLogout={handleLogout} />}
      />
      <Route
        path="/vote"
        element={<VotePage username={username} onLogout={handleLogout} />}
      />
      <Route
        path="/games"
        element={<GameListPage username={username} onLogout={handleLogout} />}
      />
      <Route
        path="/stream"
        element={<StreamPage username={username} onLogout={handleLogout} />}
      />
      <Route
        path="/profile"
        element={
          <StreamerProfilePage username={username} onLogout={handleLogout} />
        }
      />
      <Route
        path="*"
        element={<NotFoundPage username={username} onLogout={handleLogout} />}
      />
    </Routes>
  );
}

function SpacetimeDBWrapper() {
  const auth = useAuth();

  const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
    console.log(
      "Connected to SpacetimeDB with identity:",
      identity.toHexString(),
    );
    try {
      const id = identity.toHexString();
      const startedKey = `session_connected_at_${id}`;
      const countKey = `session_count_${id}`;
      // Use sessionStorage so value persists across SPA navigation in the same tab
      if (!sessionStorage.getItem(startedKey)) {
        const now = String(Date.now());
        sessionStorage.setItem(startedKey, now);
        // Increment overall session count in localStorage once per tab session
        const prev = parseInt(localStorage.getItem(countKey) || "0", 10) || 0;
        localStorage.setItem(countKey, String(prev + 1));
      }
    } catch (e) {
      console.warn("Failed to set sessionStorage on connect", e);
    }
  };

  const onDisconnect = () => {
    console.log("Disconnected from SpacetimeDB");
  };

  const onConnectError = (_ctx: ErrorContext, err: Error) => {
    console.error("Error connecting to SpacetimeDB:", err);
  };

  // Use OIDC token for SpacetimeDB authentication
  const token = auth.getToken();

  const connectionBuilder = React.useMemo(() => {
    const builder = DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .withToken(token || undefined)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError);

    // Subscribe to all public tables on connect to ensure the connection transitions to active
    builder.onConnect((conn, identity, token) => {
      onConnect(conn, identity, token);
      conn.subscriptionBuilder().subscribe("SELECT * FROM channel");
    });
    
    return builder;
  }, [token, auth.isAuthenticated]);

  return (
    <SpacetimeDBProvider key={token || "unauthenticated"} connectionBuilder={connectionBuilder}>
      <AuthGate />
    </SpacetimeDBProvider>
  );
}

// OIDC configuration for SpacetimeAuth
const oidcConfig = {
  authority: ACTIVE_AUTH_CONFIG.authority,
  client_id: ACTIVE_AUTH_CONFIG.clientId,
  redirect_uri: ACTIVE_AUTH_CONFIG.redirectUri,
  scope: ACTIVE_AUTH_CONFIG.scope,
  response_type: "code",
  onSigninCallback: () => {
    const redirect = sessionStorage.getItem('post_login_redirect');
    sessionStorage.removeItem('post_login_redirect');
    const hash = redirect || '#/';
    window.history.replaceState({}, document.title, window.location.pathname + hash);
  },
};

const RootApp = () => {
  return (
    <AuthProvider {...oidcConfig}>
      <SpacetimeDBWrapper />
    </AuthProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <RootApp />
    </HashRouter>
  </StrictMode>,
);
