import React from "react";
import { Header } from "../components/Header";
import "./CommunityPage.css";
import "./VotePage.css";
import VoteStatsPanel from "../components/VoteStatsPanel";
import { useTable, useReducer, useSpacetimeDB } from "spacetimedb/react";
import { tables, reducers } from "../module_bindings";
import SwipeVote from "./SwipeVote";

interface VotePageProps {
  username: string;
  onLogout: () => void;
}

/**
 * VotePage — now wired to SpacetimeDB bindings generated in
 * `src/module_bindings`.
 *
 * Behavior:
 * - Subscribes to `tables.game` for the list of games
 * - Subscribes to `tables.game_vote_counts` for aggregated counts
 * - Calls reducer `cast_vote` using `useReducer(reducers.castVote)`
 *
 * Note: `game_vote_counts` is an anonymous view backed by the server and
 * returns rows with `{ gameId: bigint, up: bigint, down: bigint }`.
 */
export function VotePage({ username, onLogout }: VotePageProps) {
  const [games, gamesLoading] = useTable(tables.game);
  const [counts] = useTable(tables.game_vote_counts);
  const castVote = useReducer(reducers.castVote);
  const { getConnection, isActive, identity } = useSpacetimeDB();

  const [sheetUrl, setSheetUrl] = React.useState("");
  const [syncing, setSyncing] = React.useState(false);

  // Automatically trigger sync if no games are found
  React.useEffect(() => {
    if (isActive && identity && !gamesLoading && games.length === 0 && !syncing) {
      console.log("No games found, triggering automatic sync from Google Sheets...");
      const conn = getConnection();
      if (conn) {
        setSyncing(true);
        conn.procedures.syncGamesFromSheet({})
          .then(() => {
            console.log("Automatic game sync successful");
          })
          .catch((err) => {
            console.error("Automatic sync failed:", err);
          })
          .finally(() => setSyncing(false));
      }
    }
  }, [isActive, identity, gamesLoading, games.length, syncing, getConnection]);

  const handleSync = () => {
    if (!sheetUrl) return;
    const conn = getConnection();
    if (!conn) {
      window.alert("Not connected to database");
      return;
    }

    setSyncing(true);
    conn.procedures.syncGamesFromSheet({ url: sheetUrl })
      .then(() => {
        window.alert("Games synced successfully!");
        setSheetUrl("");
      })
      .catch((err) => {
        console.error("Sync failed:", err);
        window.alert(`Sync failed: ${err.message || err}`);
      })
      .finally(() => setSyncing(false));
  };

  const getCountsFor = (gameId: bigint) => {
    const row = counts.find((r: any) => r.gameId === gameId);
    if (!row) return { up: 0n, down: 0n };
    return { up: row.up as bigint, down: row.down as bigint };
  };

  const handleVote = (gameId: bigint, vote: "up" | "down") => {
    // Call reducer — use object-syntax and BigInt for gameId
    castVote({ gameId, vote })
      .then(() => {
        // Minimal UI feedback for now
        window.alert(`Vote recorded: ${vote}`);
      })
      .catch((err: any) => {
        console.error("Failed to cast vote:", err);
        window.alert(`Failed to record vote: ${err?.message || err}`);
      });
  };

  return (
    <div className="community-page">
      <Header username={username} onLogout={onLogout} />
      <div className="vote-content">
        <div className="vote-deck-area">
          <div style={{ padding: 16 }}>
            <h2>Game Voting</h2>
            <p>Vote for the next game. Counts update in real-time.</p>

            <div style={{ paddingTop: 16 }}>
              <SwipeVote />
            </div>

            <div className="admin-sync-area" style={{ marginTop: 40, padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <h3>Admin: Sync Games</h3>
              <p className="small muted">Enter public Google Sheets CSV export URL to populate games.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'white' }}
                />
                <button
                  onClick={handleSync}
                  disabled={syncing || !sheetUrl}
                  style={{ padding: '8px 16px', borderRadius: 4, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: syncing ? 'wait' : 'pointer' }}
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="vote-stats-panel">
          <VoteStatsPanel />
        </aside>
      </div>
    </div>
  );
}

export default VotePage;
