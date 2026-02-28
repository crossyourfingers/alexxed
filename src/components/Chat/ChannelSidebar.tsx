import React, { useState } from 'react';
import './Chat.css';

interface Channel {
  id: bigint;
  name: string;
  description: string;
}

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannelId: bigint | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: (name: string, description: string) => void;
  onDeleteChannel: (channelId: bigint) => void;
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onDeleteChannel,
}: ChannelSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    onCreateChannel(name, newChannelDescription.trim());
    setNewChannelName('');
    setNewChannelDescription('');
    setShowCreateForm(false);
  };

  const handleDelete = (e: React.MouseEvent, channelId: bigint, channelName: string) => {
    e.stopPropagation();
    // Don't allow deleting the general channel
    if (channelName === 'general') {
      alert('Cannot delete the general channel');
      return;
    }
    if (confirm(`Delete #${channelName}?`)) {
      onDeleteChannel(channelId);
    }
  };

  return (
    <div className="channel-sidebar">
      <div className="channel-header">
        <h2>Community</h2>
      </div>
      <div className="channel-list">
        <div className="channel-category">
          <div className="channel-category-header">
            <span>Text Channels</span>
            <button
              className="add-channel-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
              title="Create Channel"
            >
              +
            </button>
          </div>

          {showCreateForm && (
            <form className="create-channel-form" onSubmit={handleCreateSubmit}>
              <input
                type="text"
                placeholder="channel-name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
              />
              <div className="create-channel-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create
                </button>
              </div>
            </form>
          )}

          {channels.map((channel) => (
            <div
              key={channel.id.toString()}
              className={`channel-item ${activeChannelId === channel.id ? 'active' : ''}`}
              onClick={() => onSelectChannel(channel)}
            >
              <span className="channel-icon">#</span>
              <span className="channel-name">{channel.name}</span>
              {channel.name !== 'general' && (
                <button
                  className="channel-delete-btn"
                  onClick={(e) => handleDelete(e, channel.id, channel.name)}
                  title="Delete channel"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {channels.length === 0 && (
            <p style={{ padding: 'var(--spacing-2)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              No channels yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
