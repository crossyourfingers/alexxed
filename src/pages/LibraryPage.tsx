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
  cover_url: string | undefined | null;
  genre: string | undefined | null;
  platform: string | undefined | null;
  wikipedia_url: string | undefined | null;
}

/** Cell component so each row can independently call the Wikipedia hook. */
function CoverCell({ row }: { row: LibraryRow | undefined }) {
  const wikiImage = useWikipediaImage(row?.cover_url ? undefined : row?.title);
  const src = row?.cover_url || wikiImage;
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
  const [syncing, setSyncing] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichingIGDB, setEnrichingIGDB] = useState(false);

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

  const handleSync = () => {
    if (!isActive || !identity) return;
    const conn = getConnection();
    if (!conn) return;

    setSyncing(true);
    setSyncStatus("Syncing library from Google Sheets...");
    conn.procedures.syncLibraryFromSheet({ url: "" })
      .then(() => {
        console.log("Manual library sync successful");
        setSyncStatus(null);
      })
      .catch((err: any) => {
        console.error("Library sync failed:", err);
        setSyncStatus(`Sync failed: ${err?.message ?? err}`);
      })
      .finally(() => setSyncing(false));
  };

  const handleEnrich = () => {
    if (!isActive || !identity) return;
    const conn = getConnection();
    if (!conn) return;

    setEnriching(true);
    setSyncStatus("Enriching covers from Wikipedia (batch size 50)...");
    conn.procedures.enrichLibraryCovers({ batchSize: 50 })
      .then(() => {
        console.log("Enrichment batch complete");
        setSyncStatus(null);
      })
      .catch((err: any) => {
        console.error("Enrichment failed:", err);
        setSyncStatus(`Enrichment failed: ${err?.message ?? err}`);
      })
      .finally(() => setEnriching(false));
  };

  const handleEnrichIGDB = () => {
    if (!isActive || !identity) return;
    const conn = getConnection();
    if (!conn) return;

    setEnrichingIGDB(true);
    setSyncStatus("Enriching covers and genres from IGDB (batch size 50)...");
    conn.procedures.enrichFromIgdb({ batchSize: 50, target: "library" })
      .then(() => {
        console.log("IGDB enrichment batch triggered");
        setSyncStatus(null);
      })
      .catch((err: any) => {
        console.error("IGDB enrichment failed:", err);
        setSyncStatus(`IGDB enrichment failed: ${err?.message ?? err}`);
      })
      .finally(() => setEnrichingIGDB(false));
  };

  const rows: LibraryRow[] = useMemo(() => {
    const raw = ownedGames as OwnedGame[];
    console.log("LibraryPage: Raw ownedGames from useTable:", raw);
    
    const mapped = raw
      .filter((g) => g && g.title) // Filter out any malformed rows
      .map((g) => {
        // Log individual rows if titles are missing
        if (!g.title) {
          console.warn("LibraryPage: Found row with missing title:", g);
        }
        return {
          id: g.id,
          title: g.title,
          cover_url: g.coverUrl,
          genre: g.genre,
          platform: g.platform,
          wikipedia_url: g.wikipediaUrl,
        };
      });
      
    console.log("LibraryPage: Mapped rows for DataTable:", mapped);
    return mapped;
  }, [ownedGames]);

  const columns: ColumnDef<LibraryRow, any>[] = [
    {
      id: "cover",
      header: "",
      accessorKey: "cover_url",
      enableSorting: false,
      cell: ({ row }) => <CoverCell row={row?.original} />,
    },
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const title = row?.original?.title;
        return <span className="library-title">{title ?? ""}</span>;
      },
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
        <div className="library-header">
          <div className="library-header-top">
            <h1>Library</h1>
            <div className="library-actions">
              <button
                className="library-enrich-btn-igdb"
                onClick={handleEnrichIGDB}
                disabled={enrichingIGDB || !isActive}
                title="Enrich covers and genres from IGDB (batch of 50)"
              >
                {enrichingIGDB ? "🎮 Enriching..." : "🎮 Enrich (IGDB)"}
              </button>
              <button
                className="library-enrich-btn"
                onClick={handleEnrich}
                disabled={enriching || !isActive}
                title="Enrich covers from Wikipedia (batch of 50)"
              >
                {enriching ? "🖼️ Enriching..." : "🖼️ Enrich (Wiki)"}
              </button>
              <button
                className="library-sync-btn"
                onClick={handleSync}
                disabled={syncing || !isActive}
                title="Force sync library from Google Sheets"
              >
                {syncing ? "🔄 Syncing..." : "🔄 Sync Now"}
              </button>
            </div>
          </div>
          {syncStatus && <p className="library-sync-status">{syncStatus}</p>}
        </div>
        <DataTable
          columns={columns}
          data={rows}
          enableVirtualization={false}
        />
      </div>
    </div>
  );
}
