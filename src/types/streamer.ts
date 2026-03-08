/**
 * Streamer-related type definitions
 * Source: specs/001-unified-minimal-ui/data-model.md
 */

import type { Identity, Timestamp } from 'spacetimedb';

/**
 * Social link item for streamer profile
 */
export interface SocialLink {
  platform: string;
  url: string;
}

/**
 * Streamer profile data
 */
export interface StreamerProfile {
  id: Identity;
  name: string;
  bio: string;
  avatarUrl?: string;
  socialLinks: SocialLink[];
  streamStatus: 'online' | 'offline';
}

/**
 * Parse social links JSON from database
 */
export function parseSocialLinks(json: string): SocialLink[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SocialLink =>
        typeof item === 'object' &&
        typeof item.platform === 'string' &&
        typeof item.url === 'string'
    );
  } catch {
    return [];
  }
}

/**
 * Stream schedule day data
 */
export interface StreamScheduleDay {
  dayNumber: number;
  theme: string;
  description?: string;
}

/**
 * Reported message data (admin only)
 */
export interface ReportedMessage {
  id: bigint;
  messageSent: Timestamp;
  reporterIdentity: Identity;
  reportedAt: Timestamp;
  status: 'pending' | 'reviewed' | 'resolved';
}

/**
 * Channel unread tracking
 */
export interface ChannelUnread {
  userIdentity: Identity;
  channelId: bigint;
  lastReadAt: Timestamp;
}
