import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { StreamPage } from "./pages/StreamPage.tsx";
import { CommunityPage } from "./pages/CommunityPage.tsx";
import { StreamerProfilePage } from "./pages/StreamerProfilePage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { LoginForm } from "./LoginForm.tsx";
import { VotePage } from "./pages/VotePage";
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

  console.log("AuthGate: connected:", connected, "identity:", identity?.toHexString(), "isAuthenticated:", auth.isAuthenticated, "isLoading:", auth.isLoading);

  if (auth.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#22c55e",
          fontSize: "18px",
          gap: "10px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "10px" }}>
          Connecting to Alexxed...
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start", background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>Database:</span> {DB_NAME}
          </div>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>Auth Status:</span> <span style={{ color: "#fbbf24" }}>Loading Auth...</span>
          </div>
        </div>
        
        <div style={{ fontSize: "12px", marginTop: "20px", color: "#94a3b8", maxWidth: "400px" }}>
          If this takes too long, please check if your <b>VITE_SPACETIMEAUTH_CLIENT_ID</b> is correct in your .env file and matches the client with Redirect URIs in the Spacetime dashboard.
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            background: "transparent",
            color: "#22c55e",
            border: "1px solid #22c55e",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Reload Page
        </button>
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
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
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
    const dbStatus = connected ? "Connected" : "Reconnecting...";
    const token = auth.getToken();
    const tokenInfo = token ? `Yes (Starts with ${token.substring(0, 8)}...)` : "No";
    
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#22c55e",
          fontSize: "18px",
          gap: "10px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "10px" }}>
          Connecting to Alexxed...
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start", background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>Database:</span> {DB_NAME}
          </div>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>Auth Status:</span> <span style={{ color: "#22c55e" }}>Authenticated</span>
          </div>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>OIDC Token:</span> <span style={{ color: token ? "#22c55e" : "#fbbf24" }}>{tokenInfo}</span>
          </div>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>DB Connection:</span> <span style={{ color: !connected ? "#fbbf24" : "#22c55e" }}>{dbStatus}</span>
          </div>
          <div style={{ fontSize: "14px" }}>
            <span style={{ opacity: 0.7 }}>Identity:</span> {identity?.toHexString() || "none"}
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            background: "transparent",
            color: "#22c55e",
            border: "1px solid #22c55e",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Get username from database (reactive to name changes) or fallback to auth profile
  const currentUser = identity
    ? users.find((u) => u.identity.isEqual(identity))
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
    try {
      // Do not clear sessionStorage here to avoid resetting when navigating between pages.
      // The browser will clear sessionStorage when the tab/window is closed.
    } catch (e) {
      console.warn("Error during onDisconnect cleanup", e);
    }
  };

  const onConnectError = (_ctx: ErrorContext, err: Error) => {
    console.error("Error connecting to SpacetimeDB:", err);
  };

  // Use OIDC token for SpacetimeDB authentication
  const token = auth.getToken();

  const connectionBuilder = React.useMemo(() => {
    console.log("SpacetimeDBWrapper: Creating new connectionBuilder. Token present:", !!token, "Authenticated:", auth.isAuthenticated);
    
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
    // Remove query params after auth
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const RootApp = () => (
  <AuthProvider {...oidcConfig}>
    <SpacetimeDBWrapper />
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </StrictMode>,
);
