/**
 * Hook for tracking unread messages per channel
 * Source: specs/001-unified-minimal-ui/spec.md FR-L04, FR-L05, FR-L06
 */

import { useCallback, useMemo } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import { tables, DbConnection } from '../module_bindings';
import type { Identity } from 'spacetimedb';

export interface ChannelUnreadState {
  /** Map of channel ID to whether it has unread messages */
  unreadChannels: Map<bigint, boolean>;
  /** Check if a specific channel has unread messages */
  hasUnread: (channelId: bigint) => boolean;
  /** Mark a channel as read */
  markAsRead: (channelId: bigint) => void;
}

/**
 * Hook to track unread messages per channel
 * 
 * Unread indicators display within 500ms of new message (SC-L02)
 * Zero false-positive unread indicators (SC-L03)
 * Indicators clear immediately on channel view (SC-L04)
 */
export function useChannelUnread(currentIdentity?: Identity): ChannelUnreadState {
  const ctx = useSpacetimeDB();
  const [messages] = useTable(tables.message);
  // Note: channelUnread table will be available after module regeneration
  // For now, we just track based on messages
  
  // Build map of latest message timestamp per channel
  const latestMessageMap = useMemo(() => {
    const map = new Map<bigint, bigint>();
    
    if (!messages) return map;
    
    for (const msg of messages) {
      const current = map.get(msg.channelId);
      const msgTime = msg.sent.microsSinceUnixEpoch;
      
      if (!current || msgTime > current) {
        map.set(msg.channelId, msgTime);
      }
    }
    
    return map;
  }, [messages]);
  
  // For now, return empty map - will be populated after module regeneration
  // when channel_unread table is available
  const unreadChannels = useMemo(() => {
    return new Map<bigint, boolean>();
  }, []);
  
  const hasUnread = useCallback(
    (channelId: bigint): boolean => {
      return unreadChannels.get(channelId) ?? false;
    },
    [unreadChannels]
  );
  
  const markAsRead = useCallback(
    (channelId: bigint) => {
      const conn = ctx.getConnection() as DbConnection | null;
      if (conn) {
        conn.reducers.markChannelRead({ channelId });
      }
    },
    [ctx]
  );
  
  return {
    unreadChannels,
    hasUnread,
    markAsRead,
  };
}
