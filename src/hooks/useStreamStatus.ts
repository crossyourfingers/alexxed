/**
 * Hook for managing stream online/offline status
 * Source: specs/001-unified-minimal-ui/spec.md FR-J05, FR-J06
 */

import { useMemo } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import type { Identity } from 'spacetimedb';

export interface StreamStatus {
  isOnline: boolean;
  streamerName: string;
  lastUpdated?: Date;
}

/**
 * Hook to get the current stream status from streamer profile
 * Updates within 500ms of status change (FR-J06)
 */
export function useStreamStatus(): StreamStatus {
  const [profiles, isLoading] = useTable(tables.streamer_profile);
  
  return useMemo(() => {
    if (isLoading || !profiles || profiles.length === 0) {
      return {
        isOnline: false,
        streamerName: 'Streamer',
      };
    }
    
    // Get the first (and should be only) streamer profile
    const profile = profiles[0];
    const isOnline = profile.streamStatus === 'ONLINE';
    
    return {
      isOnline,
      streamerName: profile.name,
    };
  }, [profiles, isLoading]);
}

/**
 * Hook to check if the current user is the admin/streamer
 */
export function useIsAdmin(currentIdentity?: Identity): boolean {
  const [profiles, isLoading] = useTable(tables.streamer_profile);
  
  return useMemo(() => {
    if (isLoading || !profiles || profiles.length === 0 || !currentIdentity) {
      return false;
    }
    
    // Check if the current identity matches the streamer profile identity
    const profile = profiles[0];
    return profile.id.toHexString() === currentIdentity.toHexString();
  }, [profiles, isLoading, currentIdentity]);
}
