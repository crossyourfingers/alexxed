/**
 * Hook for accessing streamer profile data
 * Source: specs/001-unified-minimal-ui/spec.md FR-H01, FR-H02, FR-H03
 */

import { useMemo } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import { parseSocialLinks, type SocialLink } from '../types/streamer';

export interface StreamerProfileData {
  /** Streamer's display name */
  name: string;
  /** Biography text */
  bio: string;
  /** Avatar URL or null for default */
  avatarUrl: string | null;
  /** Parsed social links array */
  socialLinks: SocialLink[];
  /** Current stream status */
  streamStatus: 'ONLINE' | 'OFFLINE';
  /** Whether profile exists (first user has created it) */
  exists: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook to get streamer profile data
 * Returns profile data or defaults if no profile exists
 */
export function useStreamerProfile(): StreamerProfileData {
  const [profiles, isLoading] = useTable(tables.streamer_profile);
  
  return useMemo(() => {
    if (isLoading || !profiles || profiles.length === 0) {
      return {
        name: 'Streamer',
        bio: '',
        avatarUrl: null,
        socialLinks: [],
        streamStatus: 'OFFLINE',
        exists: false,
        isLoading,
      };
    }
    
    const profile = profiles[0];
    
    return {
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? null,
      socialLinks: parseSocialLinks(profile.socialLinks),
      streamStatus: profile.streamStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
      exists: true,
      isLoading: false,
    };
  }, [profiles, isLoading]);
}
