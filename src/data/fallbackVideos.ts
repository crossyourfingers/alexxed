export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  description: string;
  game?: string;
}

// Fallback mock videos when YouTube API is unavailable
export const fallbackVideos: VideoData[] = [
  {
    id: 'zwIc9fFcYVw',
    title: 'Alexx Stream',
    thumbnail: 'https://i.ytimg.com/vi/zwIc9fFcYVw/maxresdefault.jpg',
    duration: '',
    views: '',
    publishedAt: '',
    description: '',
  },
];

export const featuredVideo = fallbackVideos[0];
