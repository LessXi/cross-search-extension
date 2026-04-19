import { PlatformBadge } from './PlatformBadge';
import { Clock, Play, ThumbsUp, Eye } from 'lucide-react';
import type { SearchResult } from '../types/search';

interface ResultCardProps {
  result: SearchResult;
}

const formatCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return count.toString();
};

const getPlatformBgColor = (platform: string): string => {
  const colors: Record<string, string> = {
    'bilibili': '#FFF0F5',
    'zhihu': '#F0F9FF',
    'baidu': '#FFFEF0',
    'google': '#F0FFF5',
    'youtube': '#FFF5F8',
    'weibo': '#FFF8F0',
    'douyin': '#F8F0FF',
    'xiaohongshu': '#FFF0F5',
    'twitter': '#F0F9FF',
    'unknown': '#F5F5F5',
  };
  return colors[platform.toLowerCase()] || colors['unknown'];
};

export function ResultCard({ result }: ResultCardProps) {
  const metadata = result.metadata;

  const hasBilibiliMetadata = result.platform === 'bilibili' && metadata && (
    metadata.viewCount || metadata.likeCount || metadata.coinCount ||
    metadata.favoriteCount || metadata.commentCount || metadata.duration
  );

  const hasZhihuMetadata = result.platform === 'zhihu' && metadata && (
    metadata.voteupCount || metadata.answerCount || metadata.commentCount
  );

  const handleClick = () => {
    chrome.tabs.create({ url: result.url });
  };

  return (
    <div
      onClick={handleClick}
      className="rounded-xl p-3 cursor-pointer transition-all duration-200
                 hover:shadow-lg hover:-translate-y-0.5 border border-white/60"
      style={{ backgroundColor: getPlatformBgColor(result.platform) }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 pt-0.5">
          <PlatformBadge platform={result.platform} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1a1a1a] line-clamp-2 leading-snug
                       hover:text-[#FF6B9D] transition-colors">
            {result.title}
          </h3>

          {result.description && (
            <p className="text-xs text-[#555] line-clamp-2 mt-1 leading-relaxed">
              {result.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-[#888]">
            {result.author && <span>{result.author}</span>}
            {result.publishTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.publishTime}
              </span>
            )}

            {hasBilibiliMetadata && (
              <div className="flex items-center gap-2">
                {metadata.viewCount && (
                  <span className="flex items-center gap-0.5">
                    <Play className="w-3 h-3 fill-current text-[#FF6B9D]" />
                    {formatCount(metadata.viewCount)}
                  </span>
                )}
                {metadata.likeCount && (
                  <span className="flex items-center gap-0.5">
                    <ThumbsUp className="w-3 h-3 text-[#FF6B9D]" />
                    {formatCount(metadata.likeCount)}
                  </span>
                )}
              </div>
            )}

            {hasZhihuMetadata && metadata.voteupCount && (
              <span className="flex items-center gap-0.5">
                <ThumbsUp className="w-3 h-3 text-[#4A90E2]" />
                {formatCount(metadata.voteupCount)}
              </span>
            )}

            {!hasBilibiliMetadata && !hasZhihuMetadata && metadata?.viewCount && (
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3 text-[#888]" />
                {formatCount(metadata.viewCount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
