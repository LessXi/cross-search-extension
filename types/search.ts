export type Platform = 'baidu' | 'google' | 'bing' | 'bilibili' | 'zhihu' | 'weibo' | 'douyin' | 'xiaohongshu' | 'youtube' | 'twitter' | 'unknown';

export interface SearchResult {
  platform: Platform;
  title: string;
  description: string;
  author: string;
  cover: string;
  url: string;
  publishTime?: string;
  relevanceScore?: number;
  qualityScore?: number;
  finalScore?: number;
  contentType?: string;
  metadata?: {
    viewCount?: number;
    likeCount?: number;
    coinCount?: number;
    favoriteCount?: number;
    commentCount?: number;
    duration?: string;
    voteupCount?: number;
    answerCount?: number;
    followerCount?: number;
    replyCount?: number;
    readCount?: number;
  };
}

export interface SearchRequest {
  query: string;
  platforms: Platform[];
}

export interface SearchResponse {
  results: SearchResult[];
  errors?: Array<{
    platform: Platform;
    error: string;
  }>;
}

export interface PlatformInfo {
  id: Platform;
  name: string;
  color: string;
  icon: string;
}
