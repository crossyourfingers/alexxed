import React from 'react';
import './Chat.css';

interface User {
  userIdentity: { toHexString: () => string };
  name?: string;
  online: boolean;
}

interface OnlineUsersProps {
  onlineUsers: readonly User[];
  offlineUsers: readonly User[];
}

function getUserDisplayName(user: User): string {
  return user.name || user.userIdentity.toHexString().substring(0, 8);
}

export function OnlineUsers({ onlineUsers, offlineUsers }: OnlineUsersProps) {
  return (
    <div className="online-users-panel">
      <div className="users-section">
        <h3>Online — {onlineUsers.length}</h3>
        {onlineUsers.map((user, i) => (
          <div key={i} className="user-item">
            <span className="user-status" />
            <span className="user-name">{getUserDisplayName(user)}</span>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            No one online
          </p>
        )}
      </div>
      {offlineUsers.length > 0 && (
        <div className="users-section">
          <h3>Offline — {offlineUsers.length}</h3>
          {offlineUsers.map((user, i) => (
            <div key={i} className="user-item">
              <span className="user-status offline" />
              <span className="user-name">{getUserDisplayName(user)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
