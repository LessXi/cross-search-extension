import { searchViaRailway } from './apiService';
import type { SearchRequest, SearchResponse, Platform } from '../types/search';

// 所有平台都通过 Railway 后端搜索
const ALL_PLATFORMS: Platform[] = ['baidu', 'google', 'bing', 'bilibili', 'zhihu'];

export async function performAggregateSearch(
  request: SearchRequest,
  userApiKey?: string,
  tavilyApiKey?: string
): Promise<SearchResponse> {
  const { platforms } = request;

  // 过滤有效平台
  const validPlatforms = platforms.filter(p => ALL_PLATFORMS.includes(p));

  if (validPlatforms.length === 0) {
    return { results: [], errors: [] };
  }

  try {
    const { results, error } = await searchViaRailway(request.query, validPlatforms, userApiKey, tavilyApiKey);

    if (error) {
      throw new Error(error);
    }

    return {
      results: results || [],
      errors: [],
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Search failed');
  }
}
