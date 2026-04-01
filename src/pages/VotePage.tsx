import React from "react";
import { Header } from "../components/Header";
import "./CommunityPage.css";
import { useTable, useReducer } from "spacetimedb/react";
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
      <div className="community-content">
        <div style={{ padding: 16 }}>
          <h2>Game Voting</h2>
          <p>Vote for the next game. Counts update in real-time.</p>

          <div style={{ paddingTop: 16 }}>
            <SwipeVote />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VotePage;
