import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { tables, reducers } from './module_bindings';
import type * as Types from './module_bindings/types';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import { Identity, Timestamp } from 'spacetimedb';

// Feature flags
const ENABLE_MESSAGE_LIKES = true;

export type PrettyMessage = {
  senderName: string;
  text: string;
  sent: Timestamp;
  kind: 'system' | 'user';
  likeCount: number;
  isLikedByMe: boolean;
};

interface AppProps {
  username: string;
  onLogout: () => void;
}

function App({ username: loggedInUsername, onLogout }: AppProps) {
  const [newName, setNewName] = useState('');
  const [settingName, setSettingName] = useState(false);
  const [systemMessages, setSystemMessages] = useState([] as Types.Message[]);
  const [newMessage, setNewMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { identity, isActive: connected } = useSpacetimeDB();
  const setName = useReducer(reducers.setName);
  const sendMessage = useReducer(reducers.sendMessage);
  const toggleLike = useReducer(reducers.toggleLike);

  // Subscribe to all messages in the chat
  const [messages] = useTable(tables.message);

  // Subscribe to all message likes
  const [likes] = useTable(tables.message_like);

  // Subscribe to all online users in the chat
  const [onlineUsers] = useTable(
    tables.user.where(r => r.online.eq(true)),
    {
      onInsert: user => {
        // All users being inserted here are online
        const name = user.name || user.identity.toHexString().substring(0, 8);
        setSystemMessages(prev => [
          ...prev,
          {
            sender: Identity.zero(),
            text: `${name} has connected.`,
            sent: Timestamp.now(),
          },
        ]);
      },
      onDelete: user => {
        // All users being deleted here are offline
        const name = user.name || user.identity.toHexString().substring(0, 8);
        setSystemMessages(prev => [
          ...prev,
          {
            sender: Identity.zero(),
            text: `${name} has disconnected.`,
            sent: Timestamp.now(),
          },
        ]);
      },
    }
  );

  const [offlineUsers] = useTable(tables.user.where(r => r.online.eq(false)));
  const users = [...onlineUsers, ...offlineUsers];

  const prettyMessages: PrettyMessage[] = messages
    .concat(systemMessages)
    .sort((a, b) => (a.sent.toDate() > b.sent.toDate() ? 1 : -1))
    .map(message => {
      const user = users.find(
        u => u.identity.toHexString() === message.sender.toHexString()
      );
      const messageLikes = likes.filter(l => l.messageSent.microsSinceUnixEpoch === message.sent.microsSinceUnixEpoch);
      return {
        senderName: user?.name || message.sender.toHexString().substring(0, 8),
        text: message.text,
        sent: message.sent,
        kind: Identity.zero().isEqual(message.sender) ? 'system' : 'user',
        likeCount: messageLikes.length,
        isLikedByMe: messageLikes.some(l => l.userIdentity.isEqual(identity!)),
      };
    });

  // Auto-scroll to bottom when NEW messages arrive, unless user has scrolled up
  const prevMessageCountRef = useRef(prettyMessages.length);
  useEffect(() => {
    const hasNewMessage = prettyMessages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = prettyMessages.length;

    if (autoScroll && hasNewMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [prettyMessages.length, autoScroll]);

  // Detect when user scrolls up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  console.log('connected:', connected, 'identity:', identity?.toHexString());

  if (!connected || !identity) {
    return (
      <div className="App">
        <h1>Connecting...</h1>
      </div>
    );
  }

  const name = (() => {
    const user = users.find(u => u.identity.isEqual(identity));
    return user?.name || identity?.toHexString().substring(0, 8) || '';
  })();

  const onSubmitNewName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettingName(false);
    setName({ name: newName });
  };

  const onSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewMessage('');
    sendMessage({ text: newMessage })
      .then(() => {
        console.log('Message sent.');
      })
      .catch(err => {
        console.error('Error sending message:', err);
      });
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="App">
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: '#333',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}
        >
          nah, that's not cool
        </div>
      )}
      <div className="profile">
        <h1>Profile</h1>
        {!settingName ? (
          <>
            <p>{name}</p>
            <button
              onClick={() => {
                setSettingName(true);
                setNewName(name);
              }}
            >
              Edit Name
            </button>
            <button
              onClick={handleLogout}
              style={{
                marginTop: '10px',
                backgroundColor: '#dc3545',
                color: '#fff',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <form onSubmit={onSubmitNewName}>
            <input
              type="text"
              aria-label="username input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        )}
      </div>
      <div className="message-panel">
        <h1>Messages</h1>
        {prettyMessages.length < 1 && <p>No messages</p>}
        <div className="messages" ref={messagesContainerRef} onScroll={handleScroll}>
          {prettyMessages.map((message, key) => {
            const sentDate = message.sent.toDate();
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

            return (
              <div
                key={key}
                className={
                  message.kind === 'system' ? 'system-message' : 'user-message'
                }
              >
                <p>
                  <b>
                    {message.kind === 'system' ? 'System' : message.senderName}
                  </b>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      marginLeft: '0.5rem',
                      color: '#666',
                    }}
                  >
                    {dateString}
                    {timeString}
                  </span>
                </p>
                <p>{message.text}</p>
                {ENABLE_MESSAGE_LIKES && message.kind === 'user' && (
                  <div className="message-actions">
                    <button
                      className={message.isLikedByMe ? 'like-button liked' : 'like-button'}
                      onClick={() => {
                        const isMyMessage = message.senderName === name;
                        if (isMyMessage) {
                          setShowToast(true);
                          setTimeout(() => setShowToast(false), 3000);
                        } else {
                          toggleLike({ messageSent: message.sent });
                        }
                      }}
                    >
                      {message.isLikedByMe ? '❤️' : '🤍'} {message.likeCount}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="online" style={{ whiteSpace: 'pre-wrap' }}>
        <h1>Online</h1>
        <div>
          {onlineUsers.map((user, key) => (
            <div key={key}>
              <p>{user.name || user.identity.toHexString().substring(0, 8)}</p>
            </div>
          ))}
        </div>
        {offlineUsers.length > 0 && (
          <div>
            <h1>Offline</h1>
            {offlineUsers.map((user, key) => (
              <div key={key}>
                <p>
                  {user.name || user.identity.toHexString().substring(0, 8)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="new-message">
        <form
          onSubmit={onSubmitMessage}
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '0 auto',
          }}
        >
          <h3>New Message</h3>
          <textarea
            aria-label="message input"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          ></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
