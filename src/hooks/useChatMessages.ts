import { useTable } from "spacetimedb/react";
import { Identity, type Timestamp } from "spacetimedb";
import { tables } from "../module_bindings";
import type { PrettyMessage } from "../components/Chat/types";

export function useChatMessages(options: {
  channelId?: bigint;
  identity?: Identity;
}) {
  const { channelId, identity } = options;

  // Subscribe to tables
  const [messages] = useTable(tables.message);
  const [likes] = useTable(tables.message_like);
  const [users] = useTable(tables.user);
  const [systemMessages] = useTable(tables.system_message);

  // Determine which messages to include based on channelId
  const filteredMessages = channelId
    ? messages.filter((msg) => msg.channelId === channelId)
    : messages;

  // Determine which system messages to include based on channelId
  const filteredSystemMessages = channelId
    ? systemMessages.filter((msg) => msg.channelId === channelId)
    : systemMessages;

  // Format messages into PrettyMessage format
  const prettyMessages: PrettyMessage[] = [
    // Regular messages
    ...filteredMessages.map((message) => {
      const user = users.find(
        (u) => u.identity.toHexString() === message.sender.toHexString(),
      );
      const messageLikes = likes.filter(
        (l) =>
          l.messageSent.microsSinceUnixEpoch ===
          message.sent.microsSinceUnixEpoch,
      );
      return {
        senderName: user?.name || message.sender.toHexString().substring(0, 8),
        text: message.text,
        sent: message.sent,
        kind: "user" as const,
        likeCount: messageLikes.length,
        isLikedByMe: identity
          ? messageLikes.some((l) => l.userIdentity.isEqual(identity))
          : false,
        channelId: message.channelId,
      };
    }),
    // System messages (connect/disconnect) kept in DB but hidden from UI
  ].sort((a, b) => (a.sent.toDate() > b.sent.toDate() ? 1 : -1));

  return {
    prettyMessages,
  };
}
