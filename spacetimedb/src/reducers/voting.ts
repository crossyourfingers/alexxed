import { t, SenderError } from "spacetimedb/server";
import spacetimedb from "../db";

/**
 * Cast or update a vote for a game. Simple semantics for now:
 * - vote: 'up' or 'down'
 * - If a user's vote exists for that game, update it; otherwise insert
 */
export const cast_vote = spacetimedb.reducer(
  { game_id: t.u64(), vote: t.string() },
  (ctx, { game_id, vote }) => {
    try {
      console.info(
        `cast_vote invoked: sender=${ctx.sender.toHexString()}, game_id=${game_id}, vote=${vote}`,
      );
    } catch (e) {
      console.warn("cast_vote logging failed:", e);
    }
    if (vote !== "up" && vote !== "down") {
      throw new SenderError("Invalid vote value");
    }

    // Verify game exists (if not, create a placeholder stub row)
    const g = ctx.db.game.id.find(game_id);
    if (!g) {
      ctx.db.game.insert({
        id: game_id,
        title: "(unknown)",
        subtitle: undefined,
        cover_url: undefined,
        purchase_link: undefined,
        played: false,
        genre: undefined,
      });
    }

    // Find existing vote by this user
    let existing = undefined;
    for (const v of ctx.db.user_vote.iter()) {
      if (v.game_id === game_id && v.user_identity.isEqual(ctx.sender)) {
        existing = v;
        break;
      }
    }

    // Ensure aggregate counter exists for this game
    let counter = ctx.db.game_vote_count.game_id.find(game_id);
    if (!counter) {
      ctx.db.game_vote_count.insert({ game_id, up: 0n, down: 0n });
      counter = ctx.db.game_vote_count.game_id.find(game_id)!;
    }

    if (existing) {
      if (existing.vote === vote) return;

      let newUp = counter.up;
      let newDown = counter.down;
      if (existing.vote === "up") newUp = newUp - 1n;
      else if (existing.vote === "down") newDown = newDown - 1n;

      if (vote === "up") newUp = newUp + 1n;
      else newDown = newDown + 1n;

      ctx.db.game_vote_count.game_id.update({
        game_id: counter.game_id,
        up: newUp,
        down: newDown,
      });
      ctx.db.user_vote.id.update({ ...existing, vote });
    } else {
      ctx.db.user_vote.insert({
        id: 0n,
        user_identity: ctx.sender,
        game_id,
        vote,
      });
      if (vote === "up") {
        ctx.db.game_vote_count.game_id.update({
          game_id: counter.game_id,
          up: counter.up + 1n,
          down: counter.down,
        });
      } else {
        ctx.db.game_vote_count.game_id.update({
          game_id: counter.game_id,
          up: counter.up,
          down: counter.down + 1n,
        });
      }
    }
  },
);

/**
 * Aggregated vote counts per game view.
 */
const GameVoteRow = t.object("GameVoteRow", {
  gameId: t.u64(),
  up: t.u64(),
  down: t.u64(),
});

export const game_vote_counts = spacetimedb.anonymousView(
  { name: "game_vote_counts", public: true },
  t.array(GameVoteRow),
  (ctx) => {
    return [...ctx.db.game_vote_count.iter()].map((r) => ({
      gameId: r.game_id,
      up: r.up,
      down: r.down,
    }));
  },
);
