import React, { useState, useRef, useEffect } from "react";
import "./SwipeVote.css";
import { useTable, useReducer } from "spacetimedb/react";
import { tables, reducers } from "../module_bindings";
import { makePosterDataUri } from "../data/posterData";

function useSwipe(onSwipe: (dir: "left" | "right") => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const elRef = ref.current;
    if (!elRef) return;
    const el = elRef;
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    function onStart(e: TouchEvent | MouseEvent) {
      // only drag the top card
      const card = el.firstElementChild as HTMLElement | null;
      if (!card || card.classList.contains("animating")) return;

      dragging = true;
      startX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      currentX = startX;

      card.style.zIndex = "9999";
      card.style.willChange = "transform";
      card.style.transition = "none";
    }

    function onMove(e: TouchEvent | MouseEvent) {
      if (!dragging) return;
      currentX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const dx = currentX - startX;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;

      card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      const dx = currentX - startX;
      const threshold = 80;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;

      if (dx > threshold) {
        onSwipe("right");
      } else if (dx < -threshold) {
        onSwipe("left");
      } else {
        card.style.transition = "transform 200ms ease";
        card.style.transform = `translateX(0)`;
        setTimeout(() => {
          card.style.transition = "";
          card.style.zIndex = "";
          card.style.willChange = "";
        }, 200);
      }
    }

    el.addEventListener("touchstart", onStart);
    el.addEventListener("touchmove", onMove);
    el.addEventListener("touchend", onEnd);
    el.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("mousedown", onStart);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
    };
  }, [onSwipe]);
  return ref;
}

export default function SwipeVote() {
  const [games, gamesLoading] = useTable(tables.game);
  const [counts] = useTable(tables.game_vote_counts);
  const castVote = useReducer(reducers.castVote);

  const deck = games.map((g) => {
    const fallbackImage = makePosterDataUri(
      g.title,
      g.subtitle || "",
      "#2b5876",
      "#4e4376",
    );
    return {
      id: g.id,
      title: g.title,
      subtitle: g.subtitle || "",
      image: g.coverUrl || fallbackImage,
    };
  });

  const [displayDeck, setDisplayDeck] = useState<typeof deck>([]);

  useEffect(() => {
    if (!gamesLoading && displayDeck.length === 0 && deck.length > 0) {
      setDisplayDeck(deck);
    }
  }, [gamesLoading, deck.length]);

  // local set of ids we've voted on — prevents duplicate reducer calls
  const [votedIds, setVotedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("swipe_voted_ids");
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        return new Set(arr);
      }
    } catch (e) {
      // ignore
    }
    return new Set();
  });
  const markVoted = (id: string) =>
    setVotedIds((s) => {
      const n = new Set(s);
      n.add(id);
      try {
        localStorage.setItem("swipe_voted_ids", JSON.stringify(Array.from(n)));
      } catch (e) {
        /* ignore storage errors */
      }
      return n;
    });
  const unmarkVoted = (id: string) =>
    setVotedIds((s) => {
      const n = new Set(s);
      n.delete(id);
      try {
        localStorage.setItem("swipe_voted_ids", JSON.stringify(Array.from(n)));
      } catch (e) {
        /* ignore storage errors */
      }
      return n;
    });

  const isAnimating = useRef(false);

  const handleVote = (dir: "left" | "right") => {
    if (isAnimating.current) return;
    const top = displayDeck[0];
    if (!top) return;

    isAnimating.current = true;
    const idStr = top.id.toString();
    const vote = dir === "right" ? "up" : "down";

    if (!votedIds.has(idStr)) {
      markVoted(idStr);
      castVote({ gameId: top.id, vote })
        .then(() => console.debug("castVote succeeded", top.id, vote))
        .catch((err: any) => {
          console.error("Failed to cast vote:", err);
          unmarkVoted(idStr);
        });
    }

    const el = ref.current?.firstElementChild as HTMLElement | undefined;
    if (el) {
      el.classList.add("animating");
      el.style.zIndex = "9999";
      el.style.transition = "transform 400ms cubic-bezier(0.165, 0.84, 0.44, 1)";
      el.style.transform =
        dir === "right"
          ? "translateX(120vw) rotate(40deg)"
          : "translateX(-120vw) rotate(-40deg)";

      setTimeout(() => {
        setDisplayDeck((d) => (d.length <= 1 ? d : [...d.slice(1), d[0]]));
        isAnimating.current = false;
        // The displayDeck update will cause a re-render.
        // We don't need to manually clear styles on the old 'el' because it will be removed/moved
        // by React, and the new top card will have its own styles applied.
      }, 400);
    } else {
      setDisplayDeck((d) => (d.length <= 1 ? d : [...d.slice(1), d[0]]));
      isAnimating.current = false;
    }
  };

  const ref = useSwipe(handleVote);

  const getCount = (id: bigint) => {
    const row = counts.find((r: any) => r.gameId === id);
    if (!row) return 0n;
    return row.up - row.down;
  };

  return (
    <div className="swipe-container">
      <div ref={ref} className="deck" aria-live="polite">
        {gamesLoading ? (
          <div className="no-cards">Loading games...</div>
        ) : displayDeck.length === 0 ? (
          <div className="no-cards">No games available for voting</div>
        ) : (
          displayDeck.slice(0, 3).map((card, idx) => {
            const isTop = idx === 0;
            const voted = votedIds.has(card.id.toString());
            const style: React.CSSProperties = {
              position: "absolute",
              top: `${idx * 18}px`,
              left: 0,
              right: 0,
              margin: "0 auto",
              zIndex: 100 - idx,
              transform: `translateY(${idx * 12}px) scale(${1 - idx * 0.06}) rotate(${idx * 1.2}deg)`,
              opacity: 1 - idx * 0.06,
              pointerEvents: isTop ? "auto" : "none", // only top card handles interaction
            };
            return (
              <div
                key={card.id.toString()}
                className={"card" + (voted ? " disabled" : "")}
                style={style}
                role="article"
                aria-label={`${card.title} card`}
              >
                <img className="poster" src={card.image} alt={card.title} />
                {voted && <div className="disabled-badge">VOTED</div>}
                {isTop ? (
                  <div className="card-body">
                    <div className="card-title">{card.title}</div>
                    <div className="card-subtitle">{card.subtitle}</div>
                    <div className="vote-row">
                      <div
                        style={{
                          fontSize: 14,
                          color: "rgba(230,238,248,0.95)",
                        }}
                      >
                        Score: {String(getCount(card.id))}
                      </div>
                      <div className="vote-buttons">
                        <button
                          className="vote-btn down"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote("left");
                          }}
                          disabled={voted}
                          aria-disabled={voted}
                        >
                          👎
                        </button>
                        <button
                          className="vote-btn up"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote("right");
                          }}
                          disabled={voted}
                          aria-disabled={voted}
                        >
                          👍
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="score-badge">
                    Score: {String(getCount(card.id))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
