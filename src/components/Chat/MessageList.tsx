import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreview } from './LinkPreview';
import type { PrettyMessage } from './types';
import './Chat.css';

interface MessageListProps {
  messages: PrettyMessage[];
  currentUserName: string;
  onToggleLike: (message: PrettyMessage) => void;
  onSelfLikeAttempt?: () => void;
  enableLikes?: boolean;
}

export interface MessageListHandle {
  scrollToBottom: (smooth?: boolean) => void;
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

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  function MessageList(
    { messages, currentUserName, onToggleLike, onSelfLikeAttempt, enableLikes = true },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef(true);
    const prevCountRef = useRef(messages.length);

    useImperativeHandle(ref, () => ({
      scrollToBottom: (smooth = true) => {
        endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      },
    }));

    // Auto-scroll when new messages arrive
    useEffect(() => {
      const hasNewMessage = messages.length > prevCountRef.current;
      prevCountRef.current = messages.length;

      if (autoScrollRef.current && hasNewMessage && endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages.length]);

    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        autoScrollRef.current = isAtBottom;
      }
    };

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
        className="chat-messages-container"
        ref={containerRef}
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
              {enableLikes && message.kind === 'user' && (
                <div className="message-actions">
                  <button
                    className={`like-btn ${message.isLikedByMe ? 'liked' : ''}`}
                    onClick={() => handleLikeClick(message)}
                  >
                    {message.isLikedByMe ? '❤️' : '🤍'} {message.likeCount > 0 && message.likeCount}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    );
  }
);
