import { Link } from 'react-router-dom';
import { streamerProfile } from '../data/streamerProfile';
import { ThemeSwitcher } from './ThemeSwitcher';
import SessionWidget from './SessionWidget';
import './Header.css';

interface HeaderProps {
  /** Which page is currently active */
  activePage: 'stream' | 'community';
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
 * - User badge showing current username
 */
export function Header({ activePage, username, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link to="/stream" className="app-logo">
          <img src={streamerProfile.avatar} alt={streamerProfile.name} />
          <span>{streamerProfile.displayName}</span>
        </Link>
        <nav className="app-nav">
          <Link 
            to="/stream" 
            className={`nav-link ${activePage === 'stream' ? 'active' : ''}`}
          >
            Stream
          </Link>
          <Link 
            to="/community/general" 
            className={`nav-link ${activePage === 'community' ? 'active' : ''}`}
          >
            Community
          </Link>
          <button onClick={onLogout} className="nav-link logout-btn">
            Logout
          </button>
        </nav>
      </div>
      <div className="app-header-right">
        <ThemeSwitcher />
        <SessionWidget />
        <span className="user-badge">{username}</span>
      </div>
    </header>
  );
}

export default Header;
