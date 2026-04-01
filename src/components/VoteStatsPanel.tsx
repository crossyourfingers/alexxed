import React from "react";
import { useTable } from "spacetimedb/react";
import { tables } from "../module_bindings";
import "./VoteStatsPanel.css";

function formatCount(n: bigint) {
  return Number(n).toLocaleString();
}

export default function VoteStatsPanel() {
  const [counts] = useTable(tables.game_vote_counts);

  const leaderboard = [...counts]
    .map((r: any) => ({
      gameId: r.gameId,
      up: r.up,
      down: r.down,
      score: r.up - r.down,
    }))
    .sort((a, b) => Number(b.score - a.score))
    .slice(0, 10);

  const totalVotes = counts.reduce(
    (acc: bigint, r: any) => acc + (r.up + r.down),
    0n,
  );

  return (
    <aside className="vote-stats" aria-label="Vote statistics">
      <div className="vote-stats-header">
        <h3>Vote Stats</h3>
        <div className="small">Top picks & recent activity</div>
      </div>

      <div className="stats-block">
        <div className="stat-label">Total Votes</div>
        <div className="stat-value">{formatCount(totalVotes)}</div>
      </div>

      <div className="leaderboard">
        <h4>Leaderboard</h4>
        <ol>
          {leaderboard.map((row: any, idx: number) => (
            <li key={String(row.gameId) + idx} className="leader-row">
              <div className="rank">{idx + 1}</div>
              <div className="game">Game {String(row.gameId)}</div>
              <div className="score">{String(row.score)}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="small muted">
        Note: Games are listed by id when name data isn't available yet.
      </div>
    </aside>
  );
}
