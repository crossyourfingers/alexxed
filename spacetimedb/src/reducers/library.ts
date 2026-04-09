import { t, SenderError } from "spacetimedb/server";
import spacetimedb from "../db";
import {
  runSyncGamesFromSheet,
  runSyncLibraryFromSheet,
  runImportRecommendationsBatch,
  runImportLibraryBatch,
  runEnrichLibraryCovers,
  runEnrichFromIGDB,
  runValidateLibraryData,
} from "../sync";

/**
 * Sync games from a public Google Sheets CSV export.
 */
export const sync_games_from_sheet = spacetimedb.procedure(
  { url: t.string() },
  t.unit(),
  (ctx, { url }) => {
    runSyncGamesFromSheet(ctx, url);
    return {};
  },
);

/**
 * Sync owned games from the 'Owned Games' worksheet of the shared Google Sheet.
 */
export const sync_library_from_sheet = spacetimedb.procedure(
  { url: t.string() },
  t.unit(),
  (ctx, { url }) => {
    runSyncLibraryFromSheet(ctx, url);
    return {};
  },
);

/**
 * Batch import game recommendations from DuckDB.
 */
export const import_recommendations_batch = spacetimedb.reducer(
  {
    games: t.array(
      t.object("GameImport", {
        id: t.u64(),
        title: t.string(),
        cover_url: t.string().optional(),
        purchase_link: t.string().optional(),
        played: t.bool().optional(),
        subtitle: t.string().optional(),
        genre: t.string().optional(),
      }),
    ),
  },
  (ctx, { games }) => {
    runImportRecommendationsBatch(ctx, games);
  },
);

/**
 * Batch import owned library from DuckDB.
 */
export const import_library_batch = spacetimedb.reducer(
  {
    games: t.array(
      t.object("OwnedGameImport", {
        id: t.u64(),
        title: t.string(),
        cover_url: t.string().optional(),
        genre: t.string().optional(),
        platform: t.string().optional(),
        wikipedia_url: t.string().optional(),
      }),
    ),
  },
  (ctx, { games }) => {
    runImportLibraryBatch(ctx, games);
  },
);

/**
 * Mark a game as played or unplayed. Admin-only.
 * Played games are hidden from the voting queue.
 */
export const mark_game_played = spacetimedb.reducer(
  { game_id: t.u64(), played: t.bool() },
  (ctx, { game_id, played }) => {
    const profile = ctx.db.streamer_profile.id.find(ctx.sender);
    if (!profile) {
      throw new SenderError("Only the streamer can mark games as played");
    }
    const g = ctx.db.game.id.find(game_id);
    if (!g) {
      throw new SenderError(`Game ${game_id} not found`);
    }
    ctx.db.game.id.update({ ...g, played });
  },
);

// Procedure to enrich owned_game cover_url fields from Wikipedia
export const enrich_library_covers = spacetimedb.procedure(
  { batch_size: t.u32() },
  t.unit(),
  (ctx, { batch_size }) => {
    runEnrichLibraryCovers(ctx, Number(batch_size));
    return {};
  },
);

// Procedure to enrich games (voting + library) from IGDB API v4
export const enrich_from_igdb = spacetimedb.procedure(
  { batch_size: t.u32(), target: t.string() }, // target: "voting" or "library"
  t.unit(),
  (ctx, { batch_size, target }) => {
    runEnrichFromIGDB(ctx, Number(batch_size), target);
    return {};
  },
);

// Procedure for agents to validate library data integrity
export const validate_library_data = spacetimedb.procedure(
  {},
  t.string(),
  (ctx) => {
    return runValidateLibraryData(ctx);
  },
);
