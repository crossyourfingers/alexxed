// ─────────────────────────────────────────────────────────────────────────────
// SYNC BUSINESS LOGIC
// Google Sheets → SpacetimeDB sync procedures for games and owned library.
//
// This file contains pure helper functions for syncing data from Google Sheets.
// The procedures are registered in index.ts using spacetimedb.procedure(), but
// all business logic lives here to keep index.ts focused on schema and wiring.
// ─────────────────────────────────────────────────────────────────────────────
import { SenderError } from "spacetimedb/server";

export const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1VayJrz5E92IJ1LY3srwHXOrZ850mvphheqsZCeqrR-w/export?format=csv";

export const DEFAULT_LIBRARY_URL =
  "https://docs.google.com/spreadsheets/d/1VayJrz5E92IJ1LY3srwHXOrZ850mvphheqsZCeqrR-w/export?format=csv&gid=1855145844";

/**
 * Generate a stable u64 hash from a string.
 * Used to derive a deterministic ID when the CSV has no numeric ID column.
 */
export function stableHash(input: string): bigint {
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    const char = BigInt(input.charCodeAt(i));
    hash = (hash << 5n) - hash + char;
    hash = hash & 0xffffffffffffffffn; // Keep it within u64 range
  }
  return hash;
}

/**
 * Parse a single CSV line, respecting quoted fields that may contain commas.
 */
export function parseCsvLine(line: string): string[] {
  let parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts.map((p) =>
    p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1).trim() : p,
  );
}

/**
 * Core logic for syncing games from a Google Sheets CSV export.
 * Called by the sync_games_from_sheet procedure registered in index.ts.
 *
 * Expected CSV format: id, title, subtitle, cover_url, purchase_link, played, genre
 * Title-first format (no numeric ID column) is also supported.
 */
export function runSyncGamesFromSheet(ctx: any, url: string): void {
  const targetUrl = url || DEFAULT_SHEET_URL;
  if (!targetUrl) throw new SenderError("URL is required for sync");

  // Only admin can sync games, UNLESS the game table is currently empty
  let gameCount = 0;
  ctx.withTx((tx: any) => {
    for (const _ of tx.db.game.iter()) {
      gameCount++;
      if (gameCount > 0) break;
    }
  });

  if (gameCount > 0) {
    const profile = ctx.withTx((tx: any) =>
      tx.db.streamer_profile.id.find(ctx.sender),
    );
    if (!profile) {
      let hasAnyProfile = false;
      ctx.withTx((tx: any) => {
        for (const _ of tx.db.streamer_profile.iter()) {
          hasAnyProfile = true;
          break;
        }
      });
      if (hasAnyProfile) {
        throw new SenderError("Only admin can sync games from sheet");
      }
    }
  }

  const response = ctx.http.fetch(targetUrl);
  if (response.status !== 200) {
    throw new SenderError(`Failed to fetch sheet: ${response.status}`);
  }

  const csv = response.text();
  const lines = csv.split(/\r?\n/);
  console.info(`Fetched CSV with ${lines.length} lines`);

  ctx.withTx((tx: any) => {
    let importedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCsvLine(line);
      if (parts.length < 2) continue;

      let id: bigint;
      let title: string;
      let subtitle: string | undefined;
      let cover_url: string | undefined;
      let purchase_link: string | undefined;
      let played: boolean;
      let genre: string | undefined;

      const firstPart = parts[0];
      const isFirstPartNumeric = /^\d+$/.test(firstPart);

      if (isFirstPartNumeric) {
        id = BigInt(firstPart);
        title = parts[1];
        subtitle = parts[2] || undefined;
        cover_url = parts[3] || undefined;
        purchase_link = parts[4] || undefined;
        played = parts[5]?.toLowerCase() === "true";
        genre = parts[6] || undefined;
      } else {
        const headerCheck = firstPart.toLowerCase();
        if (
          i === 0 ||
          headerCheck === "id" ||
          headerCheck === "title" ||
          headerCheck === "name"
        ) {
          console.info(`Skipping header at line ${i + 1}: ${firstPart}`);
          continue;
        }
        title = firstPart;
        id = stableHash(title);
        subtitle = parts[1] || undefined;
        genre = parts[2] || undefined;
        cover_url = parts[3] || undefined;
        purchase_link = parts[4] || undefined;
        played = parts[5]?.toLowerCase() === "true";
      }

      if (
        cover_url &&
        !cover_url.startsWith("http") &&
        !cover_url.startsWith("data:")
      ) {
        console.warn(
          `Invalid cover_url at line ${i + 1}: ${cover_url}. Moving to genre.`,
        );
        if (!genre) genre = cover_url;
        cover_url = undefined;
      }

      if (!title) {
        console.warn(`Skipping line ${i + 1} with empty title`);
        errorCount++;
        continue;
      }

      const existing = tx.db.game.id.find(id);
      if (existing) {
        tx.db.game.id.update({
          id, title, subtitle, cover_url, purchase_link, played, genre,
        });
      } else {
        tx.db.game.insert({
          id, title, subtitle, cover_url, purchase_link, played, genre,
        });
      }

      if (!tx.db.game_vote_count.game_id.find(id)) {
        tx.db.game_vote_count.insert({ game_id: id, up: 0n, down: 0n });
      }
      importedCount++;
    }
    console.info(
      `Game sync completed: ${importedCount} imported, ${errorCount} errors`,
    );
  });
}

/**
 * Core logic for syncing owned games from the 'Owned Games' worksheet.
 * Called by the sync_library_from_sheet procedure registered in index.ts.
 *
 * Expected CSV format: title, genre, platform, cover_url, wikipedia_url
 * Numeric-ID-first format is also supported.
 */
export function runSyncLibraryFromSheet(ctx: any, url: string): void {
  const targetUrl = url || DEFAULT_LIBRARY_URL;
  if (!targetUrl) throw new SenderError("URL is required for library sync");

  // Only admin can sync, UNLESS the owned_game table is currently empty
  let count = 0;
  ctx.withTx((tx: any) => {
    for (const _ of tx.db.owned_game.iter()) {
      count++;
      if (count > 0) break;
    }
  });

  if (count > 0) {
    const profile = ctx.withTx((tx: any) =>
      tx.db.streamer_profile.id.find(ctx.sender),
    );
    if (!profile) {
      let hasAnyProfile = false;
      ctx.withTx((tx: any) => {
        for (const _ of tx.db.streamer_profile.iter()) {
          hasAnyProfile = true;
          break;
        }
      });
      if (hasAnyProfile) {
        throw new SenderError("Only admin can sync library from sheet");
      }
    }
  }

  const response = ctx.http.fetch(targetUrl);
  if (response.status !== 200) {
    throw new SenderError(`Failed to fetch sheet: ${response.status}`);
  }

  const csv = response.text();
  const lines = csv.split(/\r?\n/);
  console.info(`Fetched library CSV with ${lines.length} lines`);

  ctx.withTx((tx: any) => {
    let importedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCsvLine(line);
      if (parts.length < 1) continue;

      const firstPart = parts[0];
      const headerCheck = firstPart.toLowerCase();
      if (
        i === 0 ||
        headerCheck === "id" ||
        headerCheck === "title" ||
        headerCheck === "name"
      ) {
        console.info(`Skipping header at line ${i + 1}: ${firstPart}`);
        continue;
      }

      if (!firstPart) {
        errorCount++;
        continue;
      }

      const isFirstPartNumeric = /^\d+$/.test(firstPart);
      let id: bigint;
      let title: string;
      let genre: string | undefined;
      let platform: string | undefined;
      let cover_url: string | undefined;
      let wikipedia_url: string | undefined;

      if (isFirstPartNumeric) {
        id = BigInt(firstPart);
        title = parts[1] || "";
        genre = parts[2] || undefined;
        platform = parts[3] || undefined;
        cover_url = parts[4] || undefined;
        wikipedia_url = parts[5] || undefined;
      } else {
        title = firstPart;
        id = stableHash(title);
        genre = parts[1] || undefined;
        platform = parts[2] || undefined;
        cover_url = parts[3] || undefined;
        wikipedia_url = parts[4] || undefined;
      }

      if (
        cover_url &&
        !cover_url.startsWith("http") &&
        !cover_url.startsWith("data:")
      ) {
        if (!genre) genre = cover_url;
        cover_url = undefined;
      }

      if (!title) {
        errorCount++;
        continue;
      }

      const existing = tx.db.owned_game.id.find(id);
      if (existing) {
        tx.db.owned_game.id.update({
          id, title, cover_url, genre, platform, wikipedia_url,
        });
      } else {
        tx.db.owned_game.insert({
          id, title, cover_url, genre, platform, wikipedia_url,
        });
      }
      importedCount++;
    }
    console.info(
      `Library sync completed: ${importedCount} imported, ${errorCount} errors`,
    );
  });
}
