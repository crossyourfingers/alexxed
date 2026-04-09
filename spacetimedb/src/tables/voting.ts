import { t, table } from "spacetimedb/server";

export const user_vote = table(
  {
    name: "user_vote",
    public: true,
    indexes: [
      { name: "user_vote_game_id", algorithm: "btree", columns: ["game_id"] },
      {
        name: "user_vote_user_identity",
        algorithm: "btree",
        columns: ["user_identity"],
      },
    ],
  },
  {
    id: t.u64().primaryKey().autoInc(),
    user_identity: t.identity(),
    game_id: t.u64(),
    vote: t.string(), // 'up' | 'down'
  },
);

/**
 * Aggregated vote counters per game. Maintained by reducers to avoid
 * scanning `user_vote` for every client read.
 */
export const game_vote_count = table(
  { name: "game_vote_count", public: true },
  {
    game_id: t.u64().primaryKey(),
    up: t.u64(),
    down: t.u64(),
  },
);
