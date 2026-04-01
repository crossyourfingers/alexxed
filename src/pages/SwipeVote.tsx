import React, { useState, useRef, useCallback, useEffect } from "react";
import posterCards from "../data/posterData";
import "./SwipeVote.css";
import { useTable, useReducer } from "spacetimedb/react";
import { tables, reducers } from "../module_bindings";

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
      dragging = true;
      startX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
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
      card.style.transition = "transform 250ms ease";
      if (dx > threshold) {
        card.style.transform = `translateX(1000px) rotate(30deg)`;
        onSwipe("right");
      } else if (dx < -threshold) {
        card.style.transform = `translateX(-1000px) rotate(-30deg)`;
        onSwipe("left");
      } else {
        card.style.transform = `translateX(0)`;
      }
      setTimeout(() => {
        card.style.transition = "";
      }, 300);
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
  const [deck, setDeck] = useState(() => posterCards.slice());
  const [games] = useTable(tables.game);
  const [counts] = useTable(tables.game_vote_counts);
  const castVote = useReducer(reducers.castVote);

  const ref = useSwipe((dir) => {
    const top = deck[0];
    if (!top) return;
    const vote = dir === "right" ? "up" : "down";
    // cast vote but don't block UI
    castVote({ gameId: top.id, vote }).catch(console.error);
    setDeck((d) => d.slice(1));
  });

  const handleButton = (dir: "left" | "right") => {
    const top = deck[0];
    if (!top) return;
    const vote = dir === "right" ? "up" : "down";
    castVote({ gameId: top.id, vote }).catch(console.error);
    // animate then remove
    const el = ref.current?.firstElementChild as HTMLElement | undefined;
    if (el) {
      el.style.transition = "transform 300ms ease";
      el.style.transform =
        dir === "right"
          ? "translateX(1000px) rotate(30deg)"
          : "translateX(-1000px) rotate(-30deg)";
      setTimeout(() => setDeck((d) => d.slice(1)), 260);
    } else {
      setDeck((d) => d.slice(1));
    }
  };

  const getCount = (id: bigint) => {
    const row = counts.find((r: any) => r.gameId === id);
    if (!row) return 0n;
    return row.up - row.down;
  };

  return (
    <div className="swipe-container">
      <div ref={ref} style={{ width: "100%", maxWidth: 420 }}>
        {deck.length === 0 ? (
          <div style={{ color: "#9fb0c8" }}>No more cards</div>
        ) : (
          deck
            .map((card, idx) => (
              <div
                key={card.id.toString()}
                className="card"
                style={{
                  position: idx === 0 ? "relative" : "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <img className="poster" src={card.image} alt={card.title} />
                <div className="card-body">
                  <div className="card-title">{card.title}</div>
                  <div className="card-subtitle">{card.subtitle}</div>
                  <div className="vote-row">
                    <div
                      style={{ fontSize: 14, color: "rgba(230,238,248,0.9)" }}
                    >
                      Score: {String(getCount(card.id))}
                    </div>
                    <div className="vote-buttons">
                      <button
                        className="vote-btn down"
                        onClick={() => handleButton("left")}
                      >
                        👎
                      </button>
                      <button
                        className="vote-btn up"
                        onClick={() => handleButton("right")}
                      >
                        👍
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
            .slice(0, 3)
        )}
      </div>
    </div>
  );
}
