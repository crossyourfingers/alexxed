/**
 * LibraryPage — desktop game library view.
 * Displays all owned games in a DataTable with cover art, title, genre, and platform.
 * Auto-syncs from Google Sheets on first load if the table is empty.
 * Wikipedia images are fetched client-side for games without a cover_url.
 */

import React, { useMemo, useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/DataTable/DataTable";
import { Header } from "../components/Header";
import { useTable, useSpacetimeDB } from "spacetimedb/react";
import { tables } from "../module_bindings";
import type { OwnedGame } from "../module_bindings/types";
import { useWikipediaImage } from "../hooks/useWikipediaImage";
import "./LibraryPage.css";

interface LibraryPageProps {
  username: string;
  onLogout: () => void;
}

interface LibraryRow {
  id: bigint;
  title: string;
  coverUrl: string | undefined | null;
  genre: string | undefined | null;
  platform: string | undefined | null;
  wikipediaUrl: string | undefined | null;
}

/** Cell component so each row can independently call the Wikipedia hook. */
function CoverCell({ row }: { row: LibraryRow | undefined }) {
  const wikiImage = useWikipediaImage(row?.coverUrl ? undefined : row?.title);
  const src = row?.coverUrl || wikiImage;
  if (!row) return null;
  return src ? (
    <img
      src={src}
      alt={row.title}
      className="library-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    <div className="library-cover-placeholder">
      {row.title.charAt(0).toUpperCase()}
    </div>
  );
}

export function LibraryPage({ username, onLogout }: LibraryPageProps) {
  const [ownedGames] = useTable(tables.owned_game);
  const { getConnection, isActive, identity } = useSpacetimeDB();
  const hasAttemptedSync = useRef(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Auto-sync on first load if table is empty
  useEffect(() => {
    if (hasAttemptedSync.current) return;
    if (!isActive || !identity) return;
    if ((ownedGames as OwnedGame[]).length === 0) {
      hasAttemptedSync.current = true;
      setSyncStatus("Syncing library from Google Sheets...");
      const conn = getConnection();
      if (conn) {
        conn.procedures.syncLibraryFromSheet({ url: "" })
          .then(() => setSyncStatus(null))
          .catch((err: any) => {
            console.error("Library sync failed:", err);
            setSyncStatus(`Sync failed: ${err?.message ?? err}`);
          });
      }
    }
  }, [ownedGames, isActive, identity, getConnection]);

  const rows: LibraryRow[] = useMemo(() => {
    return (ownedGames as OwnedGame[]).map((g) => ({
      id: g.id,
      title: g.title,
      coverUrl: g.coverUrl,
      genre: g.genre,
      platform: g.platform,
      wikipediaUrl: g.wikipediaUrl,
    }));
  }, [ownedGames]);

  const columns: ColumnDef<LibraryRow, any>[] = [
    {
      id: "cover",
      header: "",
      accessorKey: "coverUrl",
      enableSorting: false,
      cell: ({ row }) => <CoverCell row={row?.original} />,
    },
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span className="library-title">{row?.original?.title ?? ""}</span>
      ),
    },
    {
      id: "genre",
      header: "Genre",
      accessorKey: "genre",
      enableSorting: true,
      cell: ({ row }) => <span>{row?.original?.genre ?? "—"}</span>,
    },
    {
      id: "platform",
      header: "Platform",
      accessorKey: "platform",
      enableSorting: true,
      cell: ({ row }) => <span>{row?.original?.platform ?? "—"}</span>,
    },
  ];

  return (
    <div className="library-page">
      <Header
        username={username}
        onLogout={onLogout}
        activePage="library"
      />
      <div className="library-content">
        <h1>Library</h1>
        {syncStatus && <p className="library-sync-status">{syncStatus}</p>}
        <DataTable
          columns={columns}
          data={rows}
          enableVirtualization={false}
        />
      </div>
    </div>
  );
}
