import { useState } from "react";
import { Link } from "react-router-dom";
import { useSpacetimeDB, useReducer } from "spacetimedb/react";
import { reducers } from "../module_bindings";
import { streamerProfile } from "../data/streamerProfile";
import { ThemeSwitcher } from "./ThemeSwitcher";
import SessionWidget from "./SessionWidget";
import "./Header.css";

interface HeaderProps {
  /** Which page is currently active */
  activePage?: "stream" | "community" | "profile";
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
  
  // Sync edit name when username prop changes (e.g., after successful save)
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (trimmed && trimmed !== username) {
      setName({ name: trimmed })
        .then(() => setIsEditing(false))
        .catch((err) => console.error('Failed to set name:', err));
    } else {
      setIsEditing(false);
    }
  };
  
  const handleNameClick = () => {
    setEditName(username);
    setIsEditing(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(username);
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link to="/stream" className="app-logo">
          <img src={streamerProfile.avatar} alt={streamerProfile.name} />
          <span>{streamerProfile.displayName}</span>
        </Link>
        <nav className="app-nav">
          <Link to="/stream" className={`nav-link ${activePage === "stream" ? "active" : ""}`} data-page="stream">
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
    </header>
  );
}

export default Header;
