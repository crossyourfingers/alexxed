import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import { tables, reducers } from "./module_bindings";
import type * as Types from "./module_bindings/types";
import { useSpacetimeDB, useTable, useReducer } from "spacetimedb/react";
import { Identity, Timestamp } from "spacetimedb";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import SessionWidget from "./components/SessionWidget";
import { ENABLE_MESSAGE_LIKES } from "./config/featureFlags";
import { type PrettyMessage } from "./components/Chat";
import { useOnlineUsers } from "./hooks/useOnlineUsers";
import { useChatMessages } from "./hooks/useChatMessages";
import { useChannelByName } from "./hooks/useChannelByName";

interface AppProps {
  username: string;
  onLogout: () => void;
}

function App({ username: loggedInUsername, onLogout }: AppProps) {
  const [newName, setNewName] = useState("");
  const [settingName, setSettingName] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const { identity, isActive: connected } = useSpacetimeDB();
  const setName = useReducer(reducers.setName);
  const sendMessage = useReducer(reducers.sendMessage);
  const toggleLike = useReducer(reducers.toggleLike);

  // Find the general channel using the shared hook
  const generalChannel = useChannelByName("general");

  // Subscribe to all messages in the chat
  const [messages] = useTable(tables.message);

  // Subscribe to all message likes
  const [likes] = useTable(tables.message_like);

  // Subscribe to all online users via shared hook
  const { onlineUsers, offlineUsers, allUsers: users } = useOnlineUsers();

  // Use the shared hook to format messages
  const { prettyMessages } = useChatMessages({
    channelId: undefined, // No channel filtering for App.tsx (global chat)
    identity,
  });

  // Auto-scroll to bottom when NEW messages arrive, unless user has scrolled up
  const prevMessageCountRef = useRef(prettyMessages.length);
  useEffect(() => {
    const hasNewMessage = prettyMessages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = prettyMessages.length;

    if (autoScroll && hasNewMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [prettyMessages.length, autoScroll]);

  // Detect when user scrolls up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  console.log("connected:", connected, "identity:", identity?.toHexString());

  if (!connected || !identity) {
    return (
      <div className="App">
        <h1>Connecting...</h1>
      </div>
    );
  }

  const name = (() => {
    const user = users.find((u) => u.identity.isEqual(identity));
    return user?.name || identity?.toHexString().substring(0, 8) || "";
  })();

  const onSubmitNewName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettingName(false);
    setName({ name: newName });
  };

  const onSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!generalChannel) {
      console.error("No general channel available");
      return;
    }
    setNewMessage("");
    sendMessage({ text: newMessage, channelId: generalChannel.id })
      .then(() => {
        console.log("Message sent.");
      })
      .catch((err) => {
        console.error("Error sending message:", err);
      });
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
        }}
      >
        <div style={{ fontWeight: 600 }}>{name}</div>
        <SessionWidget />
      </div>
      {showToast && <div className="toast">nah, that's not cool</div>}
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
            <Link to="/stream">Watch Alexx Stream</Link>
            <button onClick={handleLogout} className="danger">
              Logout
            </button>
            <ThemeSwitcher />
          </>
        ) : (
          <form onSubmit={onSubmitNewName}>
            <input
              type="text"
              aria-label="username input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        )}
      </div>
      <div className="message-panel">
        <h1>Messages</h1>
        {prettyMessages.length < 1 && <p>No messages</p>}
        <div
          className="messages"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {prettyMessages.map((message, key) => {
            const sentDate = message.sent.toDate();
            const now = new Date();
            const isOlderThanDay =
              now.getFullYear() !== sentDate.getFullYear() ||
              now.getMonth() !== sentDate.getMonth() ||
              now.getDate() !== sentDate.getDate();

            const timeString = sentDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const dateString = isOlderThanDay
              ? sentDate.toLocaleDateString([], {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }) + " "
              : "";

            return (
              <div
                key={key}
                className={
                  message.kind === "system" ? "system-message" : "user-message"
                }
              >
                <p>
                  <b>
                    {message.kind === "system" ? "System" : message.senderName}
                  </b>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      marginLeft: "0.5rem",
                      color: "#666",
                    }}
                  >
                    {dateString}
                    {timeString}
                  </span>
                </p>
                <p>{message.text}</p>
                {ENABLE_MESSAGE_LIKES && message.kind === "user" && (
                  <div className="message-actions">
                    <button
                      className={
                        message.isLikedByMe
                          ? "like-button liked"
                          : "like-button"
                      }
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
                      {message.isLikedByMe ? "❤️" : "🤍"} {message.likeCount}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="online" style={{ whiteSpace: "pre-wrap" }}>
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

        <div className="youtube-embed-section">
          <h3>YouTube Video</h3>
          <input
            type="text"
            placeholder="Paste YouTube URL here"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
          {extractYoutubeId(youtubeUrl) && (
            <div className="youtube-embed-container">
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(youtubeUrl)}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
      <div className="new-message">
        <form
          onSubmit={onSubmitMessage}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "50%",
            margin: "0 auto",
          }}
        >
          <h3>New Message</h3>
          <textarea
            aria-label="message input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          ></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
