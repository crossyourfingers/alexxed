import { useState, useEffect, useCallback } from "react";
import { tables, reducers } from "../module_bindings";
import type * as Types from "../module_bindings/types";
import { useSpacetimeDB, useTable, useReducer } from "spacetimedb/react";
import { Timestamp } from "spacetimedb";
import { streamSchedule, type ScheduleEntry } from "../data/streamSchedule";
import { fallbackVideos, type VideoData } from "../data/fallbackVideos";
import { streamerProfile } from "../data/streamerProfile";
import { fetchChannelVideos } from "../services/youtubeApi";
import { ENABLE_EMOJI_REACTIONS } from "../config/featureFlags";
import {
  MessageList,
  MessageInput,
  type PrettyMessage,
  type ReactionGroup,
} from "../components/Chat";
import { Header } from "../components/Header";
import { useChatMessages } from "../hooks/useChatMessages";
import { useChannelByName } from "../hooks/useChannelByName";
import { useOnlineUsers } from "../hooks/useOnlineUsers";
import { useStreamStatus } from "../hooks/useStreamStatus";
import { VideoPlaceholder } from "../components/VideoPlaceholder";
import { StreamStatusIndicator } from "../components/StreamStatusIndicator";
import SchedulePreview from "../components/SchedulePreview";
import "./StreamPage.css";

interface StreamPageProps {
  username: string;
  onLogout: () => void;
}

export function StreamPage({ username, onLogout }: StreamPageProps) {
  const [videos, setVideos] = useState<VideoData[]>(fallbackVideos);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(
    fallbackVideos[0],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vods" | "schedule" | "about">(
    "vods",
  );
  const [showToast, setShowToast] = useState(false);

  const { identity, isActive: connected } = useSpacetimeDB();
  const sendMessage = useReducer(reducers.sendMessage);
  const toggleLike = useReducer(reducers.toggleLike);
  const toggleReaction = useReducer(reducers.toggleReaction);

  // Stream status from server-side profile
  const { isOnline, streamerName } = useStreamStatus();

  // Find the general channel using the shared hook
  const generalChannel = useChannelByName("general");

  // Subscribe to messages and system messages
  const [allMessages] = useTable(tables.message);
  const [allSystemMessages] = useTable(tables.system_message);
  const [likes] = useTable(tables.message_like);
  const [reactions] = useTable(tables.message_reaction);
  const [users] = useTable(tables.user);

  // Online users for viewer count
  const { onlineUsers } = useOnlineUsers();

  // Use the shared hook to format messages with channel filtering
  const { prettyMessages } = useChatMessages({
    channelId: generalChannel?.id,
    identity,
  });

  // Current user name
  const currentUser = users.find(
    (u) => identity && u.identity.isEqual(identity),
  );
  const currentName =
    currentUser?.name || identity?.toHexString().substring(0, 8) || "";

  // Handlers
  const handleSendMessage = useCallback(
    (text: string) => {
      if (!generalChannel) {
        console.error("No general channel available");
        return;
      }
      sendMessage({ text, channelId: generalChannel.id })
        .then(() => console.log("Message sent"))
        .catch((err) => console.error("Error sending message:", err));
    },
    [sendMessage, generalChannel],
  );

  const handleToggleLike = useCallback(
    (message: PrettyMessage) => {
      toggleLike({ messageSent: message.sent });
    },
    [toggleLike],
  );

  const handleSelfLikeAttempt = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Reaction handlers
  const getReactionsForMessage = useCallback(
    (sent: Timestamp): ReactionGroup[] => {
      const messageReactions = reactions.filter(
        (r) => r.messageSent.microsSinceUnixEpoch === sent.microsSinceUnixEpoch,
      );

      // Group by emoji
      const grouped = new Map<string, { count: number; hasReacted: boolean }>();
      for (const reaction of messageReactions) {
        const existing = grouped.get(reaction.emoji) || {
          count: 0,
          hasReacted: false,
        };
        existing.count++;
        if (identity && reaction.userIdentity.isEqual(identity)) {
          existing.hasReacted = true;
        }
        grouped.set(reaction.emoji, existing);
      }

      return Array.from(grouped.entries()).map(
        ([emoji, { count, hasReacted }]) => ({
          emoji,
          count,
          hasReacted,
        }),
      );
    },
    [reactions, identity],
  );

  const handleToggleReaction = useCallback(
    (messageSent: Timestamp, emoji: string) => {
      toggleReaction({ messageSent, emoji });
    },
    [toggleReaction],
  );

  if (!connected || !identity) {
    return (
      <div className="stream-page">
        <div className="stream-loading">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="stream-page">
      {showToast && <div className="toast">nah, that's not cool</div>}

      {/* Header */}
      <Header activePage="stream" username={username} onLogout={onLogout} />

      <div className="stream-content">
        {/* Main content area */}
        <main className="stream-main">
          {/* Stream status indicator in header area */}
          <div className="stream-header-row">
            <StreamStatusIndicator showLabel size="lg" />
            <span className="viewer-count">{onlineUsers.length} viewers</span>
          </div>

          {/* Featured video player or placeholder */}
          <section className="featured-player">
            {isOnline ? (
              // Show VideoPlaceholder when live (would be replaced with actual live stream embed)
              <VideoPlaceholder
                isLive={true}
                streamerName={streamerName || "Streamer"}
              />
            ) : selectedVideo ? (
              <>
                <div className="player-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=0`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="player-info">
                  <h1 className="video-title">{selectedVideo.title}</h1>
                  <div className="video-meta">
                    <span>{selectedVideo.views} views</span>
                    <span className="separator">•</span>
                    <span>{selectedVideo.publishedAt}</span>
                    {selectedVideo.game && (
                      <>
                        <span className="separator">•</span>
                        <span className="game-tag">{selectedVideo.game}</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="player-placeholder">
                <p>Select a video to watch</p>
              </div>
            )}
          </section>

          {/* Tabs */}
          <div className="content-tabs">
            <button
              className={`tab-btn ${activeTab === "vods" ? "active" : ""}`}
              onClick={() => setActiveTab("vods")}
            >
              VODs & Highlights
            </button>
            <button
              className={`tab-btn ${activeTab === "schedule" ? "active" : ""}`}
              onClick={() => setActiveTab("schedule")}
            >
              Schedule
            </button>
            <button
              className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              About
            </button>
          </div>

          {/* Tab content */}
          <section className="tab-content">
            {activeTab === "vods" && (
              <div className="vod-grid">
                {isLoading ? (
                  <div className="loading-spinner">Loading videos...</div>
                ) : (
                  videos.map((video) => (
                    <div
                      key={video.id}
                      className={`vod-card ${selectedVideo?.id === video.id ? "selected" : ""}`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="vod-thumbnail">
                        <img src={video.thumbnail} alt={video.title} />
                        <span className="duration">{video.duration}</span>
                      </div>
                      <div className="vod-info">
                        <h3 className="vod-title">{video.title}</h3>
                        <div className="vod-meta">
                          <span>{video.views} views</span>
                          <span className="separator">•</span>
                          <span>{video.publishedAt}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="schedule-section">
                <div className="schedule-grid">
                  {streamSchedule.map((entry, index) => (
                    <ScheduleCard key={index} entry={entry} />
                  ))}
                </div>
                <div className="schedule-note">
                  <p>
                    All times are in EST. Follow on social media for any
                    schedule changes!
                  </p>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="about-section">
                <div
                  className="about-banner"
                  style={{ background: streamerProfile.banner }}
                />
                <div className="about-content">
                  <div className="about-header">
                    <img
                      src={streamerProfile.avatar}
                      alt={streamerProfile.name}
                      className="about-avatar"
                    />
                    <div className="about-title">
                      <h2>{streamerProfile.displayName}</h2>
                      <p className="tagline">{streamerProfile.tagline}</p>
                    </div>
                  </div>
                  <div className="about-stats">
                    <div className="stat">
                      <span className="stat-value">
                        {streamerProfile.followers}
                      </span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {streamerProfile.totalViews}
                      </span>
                      <span className="stat-label">Total Views</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {streamerProfile.stats.avgViewers}
                      </span>
                      <span className="stat-label">Avg Viewers</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {streamerProfile.stats.peakViewers}
                      </span>
                      <span className="stat-label">Peak Viewers</span>
                    </div>
                  </div>
                  <div className="about-bio">
                    <h3>About Me</h3>
                    <p>{streamerProfile.bio}</p>
                  </div>
                  <div className="about-games">
                    <h3>Featured Games</h3>
                    <div className="games-list">
                      {streamerProfile.featuredGames.map((game, i) => (
                        <div key={i} className="game-item">
                          <span className="game-name">{game.name}</span>
                          <span className="game-hours">
                            {game.hours}+ hours
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="about-social">
                    <h3>Connect</h3>
                    <div className="social-links">
                      <a
                        href={streamerProfile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn twitter"
                      >
                        Twitter
                      </a>
                      <a
                        href={streamerProfile.socialLinks.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn discord"
                      >
                        Discord
                      </a>
                      <a
                        href={streamerProfile.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn instagram"
                      >
                        Instagram
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Chat sidebar - uses shared components */}
        <aside className="stream-chat">
          <div className="chat-header">
            <h2>Stream Chat</h2>
            <span className="viewers-count">{onlineUsers.length} viewers</span>
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
            placeholder="Send a message..."
            showFormatHint={false}
            disabled={!generalChannel}
          />
        </aside>
        {/* Schedule preview - visible on wide/ultrawide */}
        <aside className="stream-schedule-preview">
          <SchedulePreview />
        </aside>
      </div>
    </div>
  );
}

function ScheduleCard({ entry }: { entry: ScheduleEntry }) {
  return (
    <div className={`schedule-card ${entry.type}`}>
      <div className="schedule-day">{entry.day}</div>
      <div className="schedule-time">{entry.time}</div>
      <div className="schedule-game">{entry.game}</div>
      {entry.description && (
        <div className="schedule-desc">{entry.description}</div>
      )}
      {entry.type === "special" && (
        <span className="special-badge">Special</span>
      )}
    </div>
  );
}

export default StreamPage;
