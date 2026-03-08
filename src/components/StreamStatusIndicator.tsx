/**
 * Stream status indicator component
 * Shows colored dot for online/offline status (Discord/Slack/AIM style)
 * Source: specs/001-unified-minimal-ui/spec.md FR-J05, FR-J06
 */

import React from 'react';
import { useStreamStatus } from '../hooks/useStreamStatus';
import './StreamStatusIndicator.css';

interface StreamStatusIndicatorProps {
  /** Override the status from hook (for testing/preview) */
  statusOverride?: 'online' | 'offline';
  /** Show the status text label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS class */
  className?: string;
}

/**
 * Colored dot indicator that updates within 500ms of status change (FR-J06)
 */
export function StreamStatusIndicator({
  statusOverride,
  showLabel = false,
  size = 'md',
  className = '',
}: StreamStatusIndicatorProps) {
  const { isOnline: hookOnline, streamerName } = useStreamStatus();
  
  const isOnline = statusOverride ? statusOverride === 'online' : hookOnline;
  const statusClass = isOnline ? 'online' : 'offline';
  
  return (
    <div className={`stream-status-indicator ${statusClass} size-${size} ${className}`}>
      <span className="indicator-dot" aria-hidden="true" />
      {showLabel && (
        <span className="indicator-label">
          {isOnline ? 'Live' : 'Offline'}
        </span>
      )}
      <span className="sr-only">
        {streamerName} is {isOnline ? 'live' : 'offline'}
      </span>
    </div>
  );
}
