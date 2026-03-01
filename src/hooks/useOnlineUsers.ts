import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';

/**
 * Shared hook for tracking online/offline users.
 * 
 * System messages are now persisted in the system_message table and
 * should be subscribed to separately where needed.
 * 
 * Returns:
 * - onlineUsers: Currently online users
 * - offlineUsers: Currently offline users  
 * - allUsers: All users (online + offline)
 */
export function useOnlineUsers() {
  const [onlineUsers] = useTable(tables.user.where(r => r.online.eq(true)));
  const [offlineUsers] = useTable(tables.user.where(r => r.online.eq(false)));
  const allUsers = [...onlineUsers, ...offlineUsers];

  return { onlineUsers, offlineUsers, allUsers };
}
