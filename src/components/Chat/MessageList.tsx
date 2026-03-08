import React, { useRef, useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Timestamp } from 'spacetimedb';
import { LinkPreview } from './LinkPreview';
import { ReactionPicker } from './ReactionPicker';
import { ReactionDisplay, type ReactionGroup } from './ReactionDisplay';
import type { PrettyMessage } from './types';
import './Chat.css';

interface MessageListProps {


  messages: PrettyMessage[];
  currentUserName: string;
  onToggleLike: (message: PrettyMessage) => void;
  onSelfLikeAttempt?: () => void;
  enableLikes?: boolean;
  // Reaction props
  enableReactions?: boolean;
  getReactionsForMessage?: (sent: Timestamp) => ReactionGroup[];
  onToggleReaction?: (messageSent: Timestamp, emoji: string) => void;
}




// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>)"'\]]+/g;
  return text.match(urlRegex) || [];
}

// Format timestamp for display
function formatMessageTime(sent: { toDate: () => Date }): { time: string; date: string } {
  const sentDate = sent.toDate();
  const now = new Date();
  const isOlderThanDay =
    now.getFullYear() !== sentDate.getFullYear() ||
    now.getMonth() !== sentDate.getMonth() ||
    now.getDate() !== sentDate.getDate();

  const timeString = sentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = isOlderThanDay
    ? sentDate.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ' '
    : '';

  return { time: timeString, date: dateString };
}

export const MessageList = ({
  messages,
  currentUserName,
  onToggleLike,
  onSelfLikeAttempt,
  enableLikes = true,
  enableReactions,
  getReactionsForMessage,
  onToggleReaction,
}: MessageListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const prevMessageCountRef = useRef(messages.length);
    // Track which message's reaction picker is open (by timestamp string)
    const [openPickerMessageId, setOpenPickerMessageId] = useState<string | null>(null);
    
    // Threshold in pixels - considered "at bottom" if within this distance
    const SCROLL_THRESHOLD = 100;
    
    // Check if user is near bottom (FR-B05, FR-B06)
    const checkIfNearBottom = useCallback(() => {
      const container = containerRef.current;
      if (!container) return true;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      return distanceFromBottom <= SCROLL_THRESHOLD;
    }, []);
    
    // Handle scroll events to detect when user scrolls up (FR-B06)
    const handleScroll = useCallback(() => {
      setIsNearBottom(checkIfNearBottom());
    }, [checkIfNearBottom]);
    
    // Auto-scroll to bottom when new messages arrive (FR-B05)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      
      // Only auto-scroll if:
      // 1. User is already near bottom, OR
      // 2. This is the initial load (messages just appeared)
      const isNewMessage = messages.length > prevMessageCountRef.current;
      prevMessageCountRef.current = messages.length;
      
      if (isNearBottom && isNewMessage) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, [messages.length, isNearBottom]);
    
    // Initial scroll to bottom on mount
    useEffect(() => {
      const container = containerRef.current;
      if (container && messages.length > 0) {
        container.scrollTop = container.scrollHeight;
      }
    }, []);

    const handleLikeClick = (message: PrettyMessage) => {
      const isMyMessage = message.senderName === currentUserName;
      if (isMyMessage) {
        onSelfLikeAttempt?.();
      } else {
        onToggleLike(message);
      }
    };


    return (
      <div
        ref={containerRef}
        className="chat-messages-container"
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--spacing-4)' }}>
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((message, index) => {
          const { time, date } = formatMessageTime(message.sent);
          const urls = message.kind === 'user' ? extractUrls(message.text) : [];

          return (
            <div
              key={index}
              className={`chat-message ${message.kind}`}
            >
              {message.kind === 'user' && (
                <div className="message-header">
                  <span className="message-author">{message.senderName}</span>
                  <span className="message-time">
                    {date}{time}
                  </span>
                </div>
              )}
              <div className="message-content">
                {message.kind === 'system' ? (
                  message.text
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                )}
              </div>
              {urls.length > 0 && (
                <div className="message-links">
                  {urls.slice(0, 3).map((url, i) => (
                    <LinkPreview key={i} url={url} />
                  ))}
                </div>
              )}
              {message.kind === 'user' && (
                <div className="message-actions">
                  {enableLikes && (
                    <button
                      className={`like-btn ${message.isLikedByMe ? 'liked' : ''}`}
                      onClick={() => handleLikeClick(message)}
                    >
                      {message.isLikedByMe ? '❤️' : '🤍'} {message.likeCount > 0 && message.likeCount}
                    </button>
                  )}
                  {enableReactions && getReactionsForMessage && onToggleReaction && (
                    <div className="reaction-container">
                      <ReactionDisplay
                        reactions={getReactionsForMessage(message.sent)}
                        onToggle={(emoji) => onToggleReaction(message.sent, emoji)}
                        onAddReaction={() => {
                          const messageId = message.sent.microsSinceUnixEpoch.toString();
                          setOpenPickerMessageId(prev => prev === messageId ? null : messageId);
                        }}
                      />
                      {openPickerMessageId === message.sent.microsSinceUnixEpoch.toString() && (
                        <ReactionPicker
                          onSelect={(emoji) => {
                            onToggleReaction(message.sent, emoji);
                            setOpenPickerMessageId(null);
                          }}
                          onClose={() => setOpenPickerMessageId(null)}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
}
