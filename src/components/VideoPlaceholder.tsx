/**
 * Video placeholder component with 16:9 aspect ratio
 * Source: specs/001-unified-minimal-ui/spec.md FR-J01, FR-J02
 */

import React from 'react';
import './VideoPlaceholder.css';

interface VideoPlaceholderProps {
  isLive?: boolean;
  streamerName?: string;
  onGoLive?: () => void;
  className?: string;
}

/**
 * Responsive 16:9 video placeholder that maintains aspect ratio across viewports
 * Displays stream status indicator and appropriate messaging
 */
export function VideoPlaceholder({
  isLive = false,
  streamerName = 'Streamer',
  onGoLive,
  className = '',
}: VideoPlaceholderProps) {
  return (
    <div className={`video-placeholder-container ${className}`}>
      <div className="video-placeholder">
        <div className="video-placeholder-content">
          {isLive ? (
            <>
              <div className="status-badge live">
                <span className="status-dot"></span>
                <span>LIVE</span>
              </div>
              <h2 className="placeholder-title">{streamerName} is streaming</h2>
              <p className="placeholder-subtitle">Video player coming soon</p>
            </>
          ) : (
            <>
              <div className="status-badge offline">
                <span className="status-dot"></span>
                <span>OFFLINE</span>
              </div>
              <h2 className="placeholder-title">{streamerName} is offline</h2>
              <p className="placeholder-subtitle">Check back later for live streams</p>
              {onGoLive && (
                <button className="go-live-btn" onClick={onGoLive}>
                  Go Live
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
