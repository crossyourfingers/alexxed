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
        platform = parts[2] || undefined; // Store (Steam/Epic/GOG)
        // parts[3] = App ID (ignored, not stored)
        // parts[4] = Date (ignored)
        genre = undefined;
        cover_url = undefined;
        wikipedia_url = undefined;
      } else {
        // Title-first: Title, Store, App ID, Date
        title = firstPart;
        id = stableHash(title);
        platform = parts[1] || undefined; // Store (Steam/Epic/GOG)
        // parts[2] = App ID (ignored)
        // parts[3] = Date (ignored)
        genre = undefined;
        cover_url = undefined;
        wikipedia_url = undefined;
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
/**
 * Enrich owned_game rows that are missing a cover_url by fetching poster art
 * from the Wikipedia REST API (page summary thumbnail).
 *
 * Processes up to `batchSize` games per call to avoid timeouts.
 * Safe to call multiple times — already-enriched rows are skipped.
 */
export function runEnrichLibraryCovers(ctx: any, batchSize: number): void {
  const limit = batchSize > 0 ? batchSize : 50;
  // Collect IDs of games that still need a cover
  const toEnrich: Array<{ id: bigint; title: string }> = [];
  ctx.withTx((tx: any) => {
    for (const game of tx.db.owned_game.iter()) {
      if (!game.cover_url) {
        toEnrich.push({ id: game.id, title: game.title });
        if (toEnrich.length >= limit) break;
      }
    }
  });
  console.info(`Enriching covers for ${toEnrich.length} games (batch ${limit})`);
  let enriched = 0;
  let failed = 0;
  const headers = { "User-Agent": "alexxed-bot/1.0 (https://theonenamedalexx.live)" };

  function fetchCoverUrl(lookupTitle: string): string | null {
    const encoded = encodeURIComponent(lookupTitle.replace(/ /g, "_"));
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const response = ctx.http.fetch(apiUrl, { headers });
    if (response.status !== 200) return null;
    const body = response.text();
    const match = body.match(/"source"\s*:\s*"([^"]+)"/);
    return match ? match[1].replace(/\\u002F/g, "/") : null;
  }

  function searchCanonicalTitle(rawTitle: string): string | null {
    const encoded = encodeURIComponent(rawTitle);
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srlimit=1&format=json`;
    const response = ctx.http.fetch(searchUrl, { headers });
    if (response.status !== 200) return null;
    const body = response.text();
    const match = body.match(/"title"\s*:\s*"([^"]+)"/);
    return match ? match[1].replace(/\\"/g, '"') : null;
  }

  for (const { id, title } of toEnrich) {
    try {
      // Try direct lookup first, then fall back to search API for correct casing
      let coverUrl = fetchCoverUrl(title);
      if (!coverUrl) {
        const canonical = searchCanonicalTitle(title);
        if (canonical && canonical.toLowerCase() !== title.toLowerCase()) {
          coverUrl = fetchCoverUrl(canonical);
        }
      }
      if (coverUrl) {
        ctx.withTx((tx: any) => {
          const existing = tx.db.owned_game.id.find(id);
          if (existing) {
            tx.db.owned_game.id.update({ ...existing, cover_url: coverUrl });
          }
        });
        enriched++;
      } else {
        console.warn(`No thumbnail found for: ${title}`);
        failed++;
      }
    } catch (e) {
      console.warn(`Failed to fetch Wikipedia cover for ${title}:`, e);
      failed++;
    }
  }
  console.info(`Cover enrichment done: ${enriched} enriched, ${failed} skipped/failed`);
}

/**
 * Enrich games or library entries using the IGDB API v4.
 *
 * Requires IGDB_CLIENT_ID and IGDB_CLIENT_SECRET to be set in secret_config.
 * Authentication tokens are cached in the same secret_config table.
 */
export function runEnrichFromIGDB(ctx: any, batchSize: number, target: string): void {
  const limit = batchSize > 0 ? batchSize : 20;

  // 1. Get Credentials
  const clientId = ctx.withTx((tx: any) => tx.db.secret_config.key.find("IGDB_CLIENT_ID")?.value);
  const clientSecret = ctx.withTx((tx: any) => tx.db.secret_config.key.find("IGDB_CLIENT_SECRET")?.value);

  if (!clientId || !clientSecret) {
    throw new SenderError("IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set in secret_config");
  }

  // 2. Get or Refresh Access Token
  let accessToken = ctx.withTx((tx: any) => tx.db.secret_config.key.find("IGDB_ACCESS_TOKEN")?.value);
  // Simple check: if we have no token, or if it's "stale" (we don't store expiry yet, just refresh if missing or failing)
  if (!accessToken) {
    console.info("Fetching new IGDB access token...");
    const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
    const response = ctx.http.fetch(authUrl, { method: "POST" });
    if (response.status !== 200) {
      throw new SenderError(`Failed to get IGDB token: ${response.status} ${response.text()}`);
    }
    const body = JSON.parse(response.text());
    accessToken = body.access_token;
    ctx.withTx((tx: any) => {
      const existing = tx.db.secret_config.key.find("IGDB_ACCESS_TOKEN");
      if (existing) tx.db.secret_config.key.update({ key: "IGDB_ACCESS_TOKEN", value: accessToken });
      else tx.db.secret_config.insert({ key: "IGDB_ACCESS_TOKEN", value: accessToken });
    });
  }

  // 3. Collect items to enrich
  const items: Array<{ id: bigint; title: string }> = [];
  ctx.withTx((tx: any) => {
    if (target === "voting") {
      for (const game of tx.db.game.iter()) {
        if (!game.cover_url || game.cover_url.includes("wikipedia")) {
          items.push({ id: game.id, title: game.title });
          if (items.length >= limit) break;
        }
      }
    } else {
      for (const game of tx.db.owned_game.iter()) {
        if (!game.cover_url || game.cover_url.includes("wikipedia")) {
          items.push({ id: game.id, title: game.title });
          if (items.length >= limit) break;
        }
      }
    }
  });

  console.info(`Enriching ${items.length} ${target} items from IGDB...`);
  const headers = {
    "Client-ID": clientId,
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/json",
  };

  let enriched = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // IGDB Query: search by title, get cover and genre
      // We use the 'games' endpoint with 'search' keyword.
      const query = `search "${item.title.replace(/"/g, '\\"')}"; fields name, cover.url, genres.name, summary; limit 1;`;
      const response = ctx.http.fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers,
        body: query,
      });

      if (response.status === 401) {
        // Token might be expired, clear it so next run refreshes
        ctx.withTx((tx: any) => tx.db.secret_config.key.delete("IGDB_ACCESS_TOKEN"));
        throw new SenderError("IGDB token expired. Please run again to refresh.");
      }

      if (response.status !== 200) {
        console.warn(`IGDB error for ${item.title}: ${response.status}`);
        failed++;
        continue;
      }

      const results = JSON.parse(response.text());
      if (results && results.length > 0) {
        const game = results[0];
        let coverUrl = game.cover?.url;
        if (coverUrl) {
          // Convert //images.igdb.com/... to https://images.igdb.com/...
          if (coverUrl.startsWith("//")) coverUrl = "https:" + coverUrl;
          // Change t_thumb to t_cover_big for better quality
          coverUrl = coverUrl.replace("t_thumb", "t_cover_big");
        }

        const genre = game.genres?.[0]?.name;

        ctx.withTx((tx: any) => {
          if (target === "voting") {
            const existing = tx.db.game.id.find(item.id);
            if (existing) {
              tx.db.game.id.update({ ...existing, cover_url: coverUrl || existing.cover_url, genre: genre || existing.genre });
            }
          } else {
            const existing = tx.db.owned_game.id.find(item.id);
            if (existing) {
              tx.db.owned_game.id.update({ ...existing, cover_url: coverUrl || existing.cover_url, genre: genre || existing.genre });
            }
          }
        });
        enriched++;
      } else {
        console.warn(`No IGDB match for: ${item.title}`);
        failed++;
      }
    } catch (e) {
      console.warn(`Failed to enrich ${item.title} from IGDB:`, e);
      failed++;
    }
  }

  console.info(`IGDB enrichment done: ${enriched} enriched, ${failed} failed.`);
}
