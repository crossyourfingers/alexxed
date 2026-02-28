import { Timestamp } from 'spacetimedb';

export type PrettyMessage = {
  senderName: string;
  text: string;
  sent: Timestamp;
  kind: 'system' | 'user';
  likeCount: number;
  isLikedByMe: boolean;
  channelId?: bigint;
};

export type LinkPreviewData = {
  url: string;
  title: string;
  description: string;
  image: string;
};
