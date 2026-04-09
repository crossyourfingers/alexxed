import { t, table } from "spacetimedb/server";

/**
 * Game recommendations - basic tables
 */
export const game = table(
  { name: "game", public: true },
  {
    id: t.u64().primaryKey(), // We'll use IDs from Google Sheets or specific logic
    title: t.string(),
    cover_url: t.string().optional(),
    purchase_link: t.string().optional(),
    played: t.bool().optional(),
    subtitle: t.string().optional(),
    genre: t.string().optional(),
  },
);

/**
 * Owned library games
 */
export const owned_game = table(
  { name: "owned_game", public: true },
  {
    id: t.u64().primaryKey(),
    title: t.string(),
    cover_url: t.string().optional(),
    genre: t.string().optional(),
    platform: t.string().optional(),
    wikipedia_url: t.string().optional(),
  },
);
