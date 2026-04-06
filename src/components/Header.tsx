import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSpacetimeDB, useReducer } from "spacetimedb/react";
import { reducers } from "../module_bindings";
import { streamerProfile } from "../data/streamerProfile";
import { ThemeSwitcher } from "./ThemeSwitcher";
import SessionWidget from "./SessionWidget";
import "./Header.css";

interface HeaderProps {
  /** Which page is currently active */
  activePage?: "stream" | "community" | "profile" | "vote" | "games" | "library";
  /** Current user's display name */
  username: string;
  /** Callback when user clicks logout */
  onLogout: () => void;
}

/**
 * Shared header navigation component used across Stream and Community pages.
 *
 * Features:
 * - Streamer logo/avatar with display name
 * - Navigation links (Stream, Community, Logout)
 * - Theme switcher toggle
 * - Session widget for connection metrics
 * - User badge showing current username (click to edit)
 */
export function Header({ activePage, username, onLogout }: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(username);
  const setName = useReducer(reducers.setName);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const firstNavLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Sync edit name when username prop changes (e.g., after successful save)
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (trimmed && trimmed !== username) {
      setName({ name: trimmed })
        .then(() => setIsEditing(false))
        .catch((err) => console.error("Failed to set name:", err));
    } else {
      setIsEditing(false);
    }
  };

  const handleNameClick = () => {
    setEditName(username);
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(username);
    }
  };

  // Close drawer on ESC and focus first link when opened
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen) {
      // Slight delay to allow animation to start before focusing
      setTimeout(() => firstNavLinkRef.current?.focus(), 120);
    }
  }, [drawerOpen]);

  const handleCloseDrawer = () => setDrawerOpen(false);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          className="mobile-nav-toggle"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span className={`hamburger ${drawerOpen ? "open" : ""}`} />
        </button>

        <Link to="/stream" className="app-logo">
          <img src={streamerProfile.avatar} alt={streamerProfile.name} />
          <span>{streamerProfile.displayName}</span>
        </Link>

        <nav className="app-nav">
          <Link
            to="/stream"
            className={`nav-link ${activePage === "stream" ? "active" : ""}`}
            data-page="stream"
          >
            Stream
          </Link>
          <Link
            to="/community/general"
            className={`nav-link ${activePage === "community" ? "active" : ""}`}
          >
            Community
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${activePage === "profile" ? "active" : ""}`}
          >
            Profile
          </Link>
          <Link
            to="/vote"
            className={`nav-link ${activePage === "vote" ? "active" : ""}`}
          >
            Vote
          </Link>
          <Link
            to="/games"
            className={`nav-link ${activePage === "games" ? "active" : ""}`}
          >
            Games
          </Link>
          <Link
            to="/library"
            className={`nav-link ${activePage === "library" ? "active" : ""}`}
          >
            Library
          </Link>
          <button onClick={onLogout} className="nav-link logout-btn">
            Logout
          </button>
        </nav>
      </div>
      <div className="app-header-right">
        <ThemeSwitcher />
        <SessionWidget />
        {isEditing ? (
          <form onSubmit={handleNameSubmit} className="name-edit-form">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="name-edit-input"
              autoFocus
              onBlur={() => setIsEditing(false)}
              maxLength={32}
              placeholder="Enter your name"
            />
          </form>
        ) : (
          <button
            className="user-badge"
            onClick={handleNameClick}
            title="Click to change your name"
          >
            {username}
          </button>
        )}
      </div>

      {/* Mobile drawer backdrop */}
      <div
        className={`mobile-drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={handleCloseDrawer}
      />

      {/* Mobile drawer */}
      <aside
        id="mobile-nav"
        className={`mobile-drawer ${drawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-drawer-header">
          <Link to="/stream" className="app-logo" onClick={handleCloseDrawer}>
            <img src={streamerProfile.avatar} alt={streamerProfile.name} />
            <span>{streamerProfile.displayName}</span>
          </Link>
          <button
            className="mobile-drawer-close"
            aria-label="Close menu"
            onClick={handleCloseDrawer}
          >
            ×
          </button>
        </div>

        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          <Link
            to="/stream"
            ref={firstNavLinkRef}
            className={`nav-link ${activePage === "stream" ? "active" : ""}`}
            onClick={handleCloseDrawer}
          >
            Stream
          </Link>
          <Link
            to="/community/general"
            className={`nav-link ${activePage === "community" ? "active" : ""}`}
            onClick={handleCloseDrawer}
          >
            Community
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${activePage === "profile" ? "active" : ""}`}
            onClick={handleCloseDrawer}
          >
            Profile
          </Link>
          <Link
            to="/vote"
            className={`nav-link ${activePage === "vote" ? "active" : ""}`}
            onClick={handleCloseDrawer}
          >
            Vote
          </Link>
          <Link
            to="/games"
            className={`nav-link ${activePage === "games" ? "active" : ""}`}
            onClick={handleCloseDrawer}
          >
            Games
          </Link>
          <Link
            to="/library"
            className={`nav-link ${activePage === "library" ? "active" : ""}`}
            onClick={handleCloseDrawer}
          >
            Library
          </Link>
          <button
            onClick={() => {
              onLogout();
              handleCloseDrawer();
            }}
            className="nav-link logout-btn mobile-logout"
          >
            Logout
          </button>
        </nav>

        <div className="mobile-drawer-footer">
          <ThemeSwitcher />
          <SessionWidget />

          {isEditing ? (
            <form onSubmit={handleNameSubmit} className="name-edit-form mobile">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="name-edit-input"
                autoFocus
                onBlur={() => setIsEditing(false)}
                maxLength={32}
                placeholder="Enter your name"
              />
            </form>
          ) : (
            <button
              className="user-badge mobile"
              onClick={() => {
                handleNameClick();
                // keep drawer open while editing
              }}
              title="Click to change your name"
            >
              {username}
            </button>
          )}
        </div>
      </aside>
    </header>
  );
}

export default Header;
