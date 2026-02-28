import { fallbackVideos, featuredVideo, type VideoData } from '../data/fallbackVideos';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

interface YouTubePlaylistItem {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
    resourceId: {
      videoId: string;
    };
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
}

interface YouTubeChannelResponse {
  items: Array<{
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

// Parse ISO 8601 duration to human readable format
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format view count
function formatViews(viewCount: string): string {
  const views = parseInt(viewCount);
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return viewCount;
}

// Format date to relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${diffDays >= 730 ? 's' : ''} ago`;
}

export async function getChannelUploadsPlaylistId(): Promise<string | null> {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.log('YouTube API key or channel ID not configured, using fallback data');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data: YouTubeChannelResponse = await response.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
  } catch (error) {
    console.error('Failed to fetch channel info:', error);
    return null;
  }
}

export async function fetchChannelVideos(maxResults = 12): Promise<VideoData[]> {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.log('Using fallback video data');
    return fallbackVideos.slice(0, maxResults);
  }

  try {
    // Get uploads playlist ID
    const playlistId = await getChannelUploadsPlaylistId();
    if (!playlistId) {
      return fallbackVideos.slice(0, maxResults);
    }

    // Fetch playlist items
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!playlistResponse.ok) {
      throw new Error(`YouTube API error: ${playlistResponse.status}`);
    }
    
    const playlistData = await playlistResponse.json();
    const items: YouTubePlaylistItem[] = playlistData.items || [];
    
    if (items.length === 0) {
      return fallbackVideos.slice(0, maxResults);
    }

    // Get video details (duration, view count)
    const videoIds = items.map(item => item.snippet.resourceId.videoId).join(',');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    const detailsData = await detailsResponse.json();
    const videoDetails: Map<string, YouTubeVideoDetails> = new Map(
      (detailsData.items || []).map((v: YouTubeVideoDetails) => [v.id, v])
    );

    // Combine playlist items with video details
    return items.map(item => {
      const videoId = item.snippet.resourceId.videoId;
      const details = videoDetails.get(videoId);
      
      return {
        id: videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || 
                   item.snippet.thumbnails.medium?.url || 
                   item.snippet.thumbnails.default?.url ||
                   `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        duration: details ? parseDuration(details.contentDetails.duration) : 'N/A',
        views: details ? formatViews(details.statistics.viewCount) : 'N/A',
        publishedAt: formatRelativeTime(item.snippet.publishedAt),
        description: item.snippet.description.substring(0, 200),
      };
    });
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error);
    return fallbackVideos.slice(0, maxResults);
  }
}

export async function getFeaturedVideo(): Promise<VideoData> {
  const videos = await fetchChannelVideos(1);
  return videos[0] || featuredVideo;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
