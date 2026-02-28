import { useState } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import type * as Types from '../module_bindings/types';
import { Identity, Timestamp } from 'spacetimedb';

/**
 * Shared hook for tracking online/offline users with connect/disconnect notifications.
 * 
 * Returns:
 * - onlineUsers: Currently online users
 * - offlineUsers: Currently offline users  
 * - allUsers: All users (online + offline)
 * - systemMessages: System messages for connect/disconnect events
 */
export function useOnlineUsers() {
  const [systemMessages, setSystemMessages] = useState<Types.Message[]>([]);

  const [onlineUsers] = useTable(
    tables.user.where(r => r.online.eq(true)),
    {
      onInsert: user => {
        const name = user.name || user.identity.toHexString().substring(0, 8);
        setSystemMessages(prev => [
          ...prev,
          {
            sender: Identity.zero(),
            text: `${name} has connected.`,
            sent: Timestamp.now(),
            channelId: 0n,
          } as Types.Message,
        ]);
      },
      onDelete: user => {
        const name = user.name || user.identity.toHexString().substring(0, 8);
        setSystemMessages(prev => [
          ...prev,
          {
            sender: Identity.zero(),
            text: `${name} has disconnected.`,
            sent: Timestamp.now(),
            channelId: 0n,
          } as Types.Message,
        ]);
      },
    }
  );

  const [offlineUsers] = useTable(tables.user.where(r => r.online.eq(false)));
  const allUsers = [...onlineUsers, ...offlineUsers];

  return { onlineUsers, offlineUsers, allUsers, systemMessages };
}
