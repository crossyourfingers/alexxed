import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';

/**
 * Shared hook for tracking online/offline users across the application.
 * 
 * ## Usage
 * ```tsx
 * const { onlineUsers, offlineUsers, allUsers } = useOnlineUsers();
 * ```
 * 
 * ## System Messages
 * Connect/disconnect events are now persisted server-side in the `system_message` table.
 * To display system messages (e.g., "Alice has connected"), subscribe to the 
 * `system_message` table separately using `useTable(tables.system_message)`.
 * 
 * System messages include:
 * - `messageType`: 'connect' or 'disconnect'
 * - `userIdentity`: The user who connected/disconnected
 * - `channelId`: Channel where the message appears (broadcast to all channels)
 * - `createdAt`: Server timestamp
 * 
 * @returns Object with onlineUsers, offlineUsers, and allUsers arrays
 */
export function useOnlineUsers() {
  // Subscribe to online users (online === true)
  const [onlineUsers] = useTable(tables.user.where(r => r.online.eq(true)));
  
  // Subscribe to offline users (online === false)
  const [offlineUsers] = useTable(tables.user.where(r => r.online.eq(false)));
  
  // Combined list for user lookups
  const allUsers = [...onlineUsers, ...offlineUsers];

  return { onlineUsers, offlineUsers, allUsers };
}
