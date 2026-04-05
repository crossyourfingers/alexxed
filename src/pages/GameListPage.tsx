/**
 * GameListPage — desktop-only game voting list view.
 * Displays all games in a DataTable with cover art, genre, vote counts,
 * upvote/downvote buttons, and a played toggle for the streamer (admin).
 *
 * Mobile users should use the SwipeVote UI at /vote instead.
 */

import React, { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable/DataTable";
import { Header } from "../components/Header";
import { useTable, useReducer } from "spacetimedb/react";
import { tables, reducers } from "../module_bindings";
import type { Game, GameVoteRow } from "../module_bindings/types";
import "./GameListPage.css";

interface GameListPageProps {
  username: string;
  onLogout: () => void;
}

interface GameRow {
  id: bigint;
  title: string;
  coverUrl: string | undefined | null;
  genre: string | undefined | null;
  up: bigint;
  down: bigint;
  played: boolean;
}

export function GameListPage({ username, onLogout }: GameListPageProps) {
  const [games, gamesLoading] = useTable(tables.game);
  const [counts] = useTable(tables.game_vote_counts);
  const castVote = useReducer(reducers.castVote);
  const markGamePlayed = useReducer(reducers.markGamePlayed);

  // Build a lookup map for vote counts
  const countMap = useMemo(() => {
    const map = new Map<bigint, { up: bigint; down: bigint }>();
    for (const c of counts as GameVoteRow[]) {
      map.set(c.gameId, { up: c.up, down: c.down });
    }
    return map;
  }, [counts]);

  // Merge game rows with vote counts, exclude played games from voting queue
  const rows: GameRow[] = useMemo(() => {
    return (games as Game[]).map((g) => {
      const c = countMap.get(g.id) ?? { up: 0n, down: 0n };
      return {
        id: g.id,
        title: g.title,
        coverUrl: g.coverUrl,
        genre: g.genre,
        up: c.up,
        down: c.down,
        played: g.played ?? false,
      };
    });
  }, [games, countMap]);

  const handleVote = (gameId: bigint, vote: "up" | "down") => {
    castVote({ gameId, vote }).catch((err: any) => {
      console.error("Failed to cast vote:", err);
    });
  };

  const handleTogglePlayed = (gameId: bigint, currentPlayed: boolean) => {
    markGamePlayed({ gameId, played: !currentPlayed }).catch((err: any) => {
      console.error("Failed to mark game played:", err);
    });
  };

  const columns: ColumnDef<GameRow, any>[] = [
    {
      id: "cover",
      header: "",
      accessorKey: "coverUrl",
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.coverUrl;
        return url ? (
          <img
            src={url}
            alt={row.original.title}
            className="game-list-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="game-list-cover-placeholder">
            {row.original.title.charAt(0).toUpperCase()}
          </div>
        );
      },
    },
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span className={row.original.played ? "game-title-played" : "game-title"}>
          {row.original.title}
        </span>
      ),
    },
    {
      id: "genre",
      header: "Genre",
      accessorKey: "genre",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ getValue }) => (
        <span className="game-genre">{getValue() ?? "—"}</span>
      ),
    },
    {
      id: "votes",
      header: "Votes",
      accessorKey: "up",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="game-vote-counts">
          <span className="vote-up">▲ {String(row.original.up)}</span>
          {" / "}
          <span className="vote-down">▼ {String(row.original.down)}</span>
        </span>
      ),
    },
    {
      id: "actions",
      header: "Vote",
      accessorKey: "id",
      enableSorting: false,
      cell: ({ row }) => {
        const { id, played } = row.original;
        return (
          <div className="game-action-buttons">
            <button
              className="vote-btn vote-btn-up"
              disabled={played}
              title={played ? "Game already played" : "Upvote"}
              onClick={() => handleVote(id, "up")}
            >
              👍
            </button>
            <button
              className="vote-btn vote-btn-down"
              disabled={played}
              title={played ? "Game already played" : "Downvote"}
              onClick={() => handleVote(id, "down")}
            >
              👎
            </button>
          </div>
        );
      },
    },
    {
      id: "played",
      header: "Played",
      accessorKey: "played",
      enableSorting: true,
      cell: ({ row }) => {
        const { id, played } = row.original;
        // Only the streamer (who has a profile) can toggle played status.
        // We optimistically show the toggle for all users but the backend
        // enforces the admin-only rule.
        return (
          <button
            className={`played-toggle ${played ? "played-toggle-on" : "played-toggle-off"}`}
            onClick={() => handleTogglePlayed(id, played)}
            title={played ? "Mark as unplayed" : "Mark as played"}
          >
            {played ? "✅ Played" : "⬜ Unplayed"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="game-list-page">
      <Header username={username} onLogout={onLogout} activePage="games" />
      <main className="game-list-main">
        <div className="game-list-header">
          <h1>Game Library</h1>
          <p className="game-list-subtitle">
            Vote for the next game Alex should play. Played games are shown but
            excluded from the voting queue.
          </p>
        </div>
        <DataTable<GameRow>
          data={rows}
          columns={columns}
          isLoading={gamesLoading}
          loadingMessage="Loading games..."
          emptyStateMessage="No games found. Sync from Google Sheets on the Vote page."
          enableSorting
          enableFiltering
          enablePagination
          pageSizeOptions={[25, 50, 100]}
          caption="Game voting library"
          className="game-list-table"
        />
      </main>
    </div>
  );
}

export default GameListPage;
