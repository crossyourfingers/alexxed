/**
 * 404 Not Found Page
 * 
 * Features a chibi raven covering its eyes (FR-H03)
 * Provides navigation back to home
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

interface NotFoundPageProps {
  username?: string;
  onLogout?: () => void;
}

export function NotFoundPage({ username, onLogout }: NotFoundPageProps) {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        {/* Chibi raven covering eyes - simple SVG illustration */}
        <div className="not-found-illustration">
          <svg 
            viewBox="0 0 120 120" 
            className="chibi-raven"
            aria-label="Chibi raven covering its eyes"
          >
            {/* Body */}
            <ellipse cx="60" cy="75" rx="35" ry="30" fill="var(--color-text-muted)" />
            
            {/* Head */}
            <circle cx="60" cy="40" r="28" fill="#1a1a1a" />
            
            {/* Wings (covering eyes like hands) */}
            <ellipse cx="40" cy="38" rx="15" ry="10" fill="#2a2a2a" transform="rotate(-15, 40, 38)" />
            <ellipse cx="80" cy="38" rx="15" ry="10" fill="#2a2a2a" transform="rotate(15, 80, 38)" />
            
            {/* Beak */}
            <polygon points="60,50 54,58 66,58" fill="var(--color-warning)" />
            
            {/* Blush */}
            <circle cx="42" cy="55" r="5" fill="var(--color-error)" opacity="0.3" />
            <circle cx="78" cy="55" r="5" fill="var(--color-error)" opacity="0.3" />
            
            {/* Feet */}
            <path d="M45,100 L40,115 L45,110 L50,115 L45,100" fill="var(--color-warning)" />
            <path d="M75,100 L70,115 L75,110 L80,115 L75,100" fill="var(--color-warning)" />
          </svg>
        </div>
        
        <h1 className="not-found-title">404</h1>
        <p className="not-found-message">
          Oops! The raven can't find this page.
        </p>
        <p className="not-found-hint">
          Maybe it flew away? 🪶
        </p>
        
        <div className="not-found-actions">
          <Link to="/" className="not-found-home-btn">
            Go Home
          </Link>
          <Link to="/community/general" className="not-found-chat-btn">
            Join Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
