import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tables, reducers } from '../module_bindings';
import type * as Types from '../module_bindings/types';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import { Timestamp } from 'spacetimedb';
import { ENABLE_EMOJI_REACTIONS } from '../config/featureFlags';
import {
  MessageList,
  MessageInput,
  OnlineUsers,
  ChannelSidebar,
  type PrettyMessage,
  type ReactionGroup,
} from '../components/Chat';
import { Header } from '../components/Header';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import './CommunityPage.css';

interface CommunityPageProps {
  username: string;
  onLogout: () => void;
}

export function CommunityPage({ username, onLogout }: CommunityPageProps) {
  const { channelName } = useParams<{ channelName?: string }>();
  const navigate = useNavigate();
  
  const [showToast, setShowToast] = useState(false);

  const { identity, isActive: connected } = useSpacetimeDB();
  const sendMessage = useReducer(reducers.sendMessage);
  const toggleLike = useReducer(reducers.toggleLike);
  const toggleReaction = useReducer(reducers.toggleReaction);
  const createChannel = useReducer(reducers.createChannel);
  const deleteChannel = useReducer(reducers.deleteChannel);

  // Subscribe to channels
  const [channels] = useTable(tables.channel);
  
  // Subscribe to messages and system messages
  const [allMessages] = useTable(tables.message);
  const [allSystemMessages] = useTable(tables.system_message);
  const [likes] = useTable(tables.message_like);
  const [reactions] = useTable(tables.message_reaction);

  // Subscribe to online users via shared hook
  const { onlineUsers, offlineUsers, allUsers: users } = useOnlineUsers();

  // Find active channel
  const activeChannel = channels.find(
    ch => ch.name === (channelName || 'general')
  );

  // Redirect to general if channel doesn't exist
  useEffect(() => {
    if (channels.length > 0 && !activeChannel && channelName !== 'general') {
      navigate('/community/general', { replace: true });
    }
  }, [channels, activeChannel, channelName, navigate]);

  // Filter messages for active channel
  const channelMessages = activeChannel
    ? allMessages.filter(msg => msg.channelId === activeChannel.id)
    : [];

  // Filter system messages for active channel
  const channelSystemMessages = activeChannel
    ? allSystemMessages.filter(msg => msg.channelId === activeChannel.id)
    : [];

  // Map messages to PrettyMessage format
  const prettyMessages: PrettyMessage[] = [
    // Regular messages
    ...channelMessages.map(message => {
      const user = users.find(
        u => u.identity.toHexString() === message.sender.toHexString()
      );
      const messageLikes = likes.filter(
        l => l.messageSent.microsSinceUnixEpoch === message.sent.microsSinceUnixEpoch
      );
      return {
        senderName: user?.name || message.sender.toHexString().substring(0, 8),
        text: message.text,
        sent: message.sent,
        kind: 'user' as const,
        likeCount: messageLikes.length,
        isLikedByMe: identity ? messageLikes.some(l => l.userIdentity.isEqual(identity)) : false,
        channelId: message.channelId,
      };
    }),
    // System messages
    ...channelSystemMessages.map(sysMsg => {
      const user = users.find(
        u => u.identity.toHexString() === sysMsg.userIdentity.toHexString()
      );
      const userName = user?.name || sysMsg.userIdentity.toHexString().substring(0, 8);
      const action = sysMsg.messageType === 'connect' ? 'has connected.' : 'has disconnected.';
      return {
        senderName: 'System',
        text: `${userName} ${action}`,
        sent: sysMsg.createdAt,
        kind: 'system' as const,
        likeCount: 0,
        isLikedByMe: false,
        channelId: sysMsg.channelId,
      };
    }),
  ].sort((a, b) => (a.sent.toDate() > b.sent.toDate() ? 1 : -1));

  // Current user name
  const currentUser = users.find(u => identity && u.identity.isEqual(identity));
  const currentName = currentUser?.name || identity?.toHexString().substring(0, 8) || '';

  // Handlers
  const handleSendMessage = useCallback(
    (text: string) => {
      if (!activeChannel) return;
      sendMessage({ text, channelId: activeChannel.id })
        .then(() => console.log('Message sent'))
        .catch(err => console.error('Error sending message:', err));
    },
    [sendMessage, activeChannel]
  );

  const handleToggleLike = useCallback(
    (message: PrettyMessage) => {
      toggleLike({ messageSent: message.sent });
    },
    [toggleLike]
  );

  const handleSelfLikeAttempt = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Reaction handlers
  const getReactionsForMessage = useCallback(
    (sent: Timestamp): ReactionGroup[] => {
      const messageReactions = reactions.filter(
        r => r.messageSent.microsSinceUnixEpoch === sent.microsSinceUnixEpoch
      );
      
      // Group by emoji
      const grouped = new Map<string, { count: number; hasReacted: boolean }>();
      for (const reaction of messageReactions) {
        const existing = grouped.get(reaction.emoji) || { count: 0, hasReacted: false };
        existing.count++;
        if (identity && reaction.userIdentity.isEqual(identity)) {
          existing.hasReacted = true;
        }
        grouped.set(reaction.emoji, existing);
      }
      
      return Array.from(grouped.entries()).map(([emoji, { count, hasReacted }]) => ({
        emoji,
        count,
        hasReacted,
      }));
    },
    [reactions, identity]
  );

  const handleToggleReaction = useCallback(
    (messageSent: Timestamp, emoji: string) => {
      toggleReaction({ messageSent, emoji });
    },
    [toggleReaction]
  );

  const handleSelectChannel = useCallback(
    (channel: { name: string }) => {
      navigate(`/community/${channel.name}`);
    },
    [navigate]
  );

  const handleCreateChannel = useCallback(
    (name: string, description: string) => {
      createChannel({ name, description })
        .then(() => navigate(`/community/${name.toLowerCase().replace(/\s+/g, '-')}`))
        .catch(err => {
          console.error('Error creating channel:', err);
          alert('Failed to create channel: ' + err.message);
        });
    },
    [createChannel, navigate]
  );

  const handleDeleteChannel = useCallback(
    (channelId: bigint) => {
      deleteChannel({ channelId })
        .then(() => {
          // Navigate to general if we deleted the active channel
          if (activeChannel?.id === channelId) {
            navigate('/community/general');
          }
        })
        .catch(err => {
          console.error('Error deleting channel:', err);
          alert('Failed to delete channel: ' + err.message);
        });
    },
    [deleteChannel, activeChannel, navigate]
  );

  if (!connected || !identity) {
    return (
      <div className="community-page">
        <div className="community-loading">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="community-page">
      {showToast && (
        <div className="toast">
          nah, that's not cool
        </div>
      )}

      {/* Header */}
      <Header activePage="community" username={username} onLogout={onLogout} />

      {/* Main content */}
      <div className="community-content">
        {/* Channel sidebar */}
        <ChannelSidebar
          channels={channels.map(ch => ({
            id: ch.id,
            name: ch.name,
            description: ch.description,
          }))}
          activeChannelId={activeChannel?.id ?? null}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={handleCreateChannel}
          onDeleteChannel={handleDeleteChannel}
        />

        {/* Chat area */}
        <div className="community-chat-area">
          {activeChannel ? (
            <>
              <div className="community-chat-header">
                <span className="channel-hash">#</span>
                <h2>{activeChannel.name}</h2>
                {activeChannel.description && (
                  <span className="channel-description">{activeChannel.description}</span>
                )}
              </div>
              <MessageList
                messages={prettyMessages}
                currentUserName={currentName}
                onToggleLike={handleToggleLike}
                onSelfLikeAttempt={handleSelfLikeAttempt}
                enableReactions={ENABLE_EMOJI_REACTIONS}
                getReactionsForMessage={getReactionsForMessage}
                onToggleReaction={handleToggleReaction}
              />
              <MessageInput
                onSend={handleSendMessage}
                placeholder={`Message #${activeChannel.name}`}
              />
            </>
          ) : (
            <div className="community-empty">
              <h3>No channel selected</h3>
              <p>Select a channel from the sidebar or create a new one</p>
            </div>
          )}
        </div>

        {/* Members sidebar */}
        <div className="community-members">
          <OnlineUsers onlineUsers={onlineUsers} offlineUsers={offlineUsers} />
        </div>
      </div>
    </div>
  );
}

export default CommunityPage;
