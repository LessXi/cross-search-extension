import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, AlertCircle, Star, X, Play, ThumbsUp, Clock, User } from 'lucide-react';
import { performAggregateSearch } from './services/searchService';
import { getBookmarks, addBookmark, removeBookmark } from './services/apiService';
import type { Platform, SearchResult } from './types/search';
import { styles } from './components/PopupStyles';

const platformOptions: { value: Platform; label: string; icon: string; bgColor: string }[] = [
  { value: 'baidu', label: '百度', icon: '🔍', bgColor: '#FFFEF0' },
  { value: 'google', label: 'Google', icon: '🌐', bgColor: '#F0FFF5' },
  { value: 'bing', label: 'Bing', icon: '🔷', bgColor: '#F0F8FF' },
  { value: 'bilibili', label: 'B站', icon: '📺', bgColor: '#FFF0F5' },
  { value: 'zhihu', label: '知乎', icon: '💡', bgColor: '#F0F9FF' },
];

const platformBadgeColor: Record<string, string> = {
  baidu: '#DE5246', google: '#4285F4', bing: '#0078D4', bilibili: '#FF6B9D', zhihu: '#0066FF',
  weibo: '#E6162D', douyin: '#000', xiaohongshu: '#FF2442', youtube: '#FF0000',
  twitter: '#1DA1F2', unknown: '#888',
};

const platformLabel: Record<string, string> = {
  baidu: '百度', google: 'Google', bing: 'Bing', bilibili: 'B站', zhihu: '知乎',
  weibo: '微博', douyin: '抖音', xiaohongshu: '小红书', youtube: 'YouTube',
  twitter: 'Twitter', unknown: '其他',
};

const getPlatformBgColor = (platform: string): string => {
  const colors: Record<string, string> = {
    bilibili: '#FFF0F5', zhihu: '#F0F9FF', baidu: '#FFFEF0', google: '#F0FFF5',
    bing: '#F0F8FF', youtube: '#FFF5F8', weibo: '#FFF8F0', douyin: '#F8F0FF', xiaohongshu: '#FFF0F5',
    twitter: '#F0F9FF', unknown: '#F8F8F8',
  };
  return colors[platform] || colors.unknown;
};

const formatCount = (count: number): string => {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return count.toString();
};

const USER_ID_KEY = 'cross_search_user_id';
const USER_EMAIL_KEY = 'cross_search_user_email';
const USER_SESSION_KEY = 'cross_search_user_session';
const SEARCH_STATE_KEY = 'cross_search_state';
const FLOAT_WINDOW_SIZE_KEY = 'float_window_size';
const ITEMS_PER_PAGE = 20;

function FloatApp() {
  const [query, setQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['baidu', 'google', 'bing', 'bilibili', 'zhihu']);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarksList, setBookmarksList] = useState<SearchResult[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [contentFilter, setContentFilter] = useState<'all' | 'video' | 'article'>('all');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [windowId, setWindowId] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Load state on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    const storedEmail = localStorage.getItem(USER_EMAIL_KEY);
    if (storedUserId) {
      setUserId(storedUserId);
      setUserEmail(storedEmail);
      loadBookmarks(storedUserId);
    }

    // Listen for user session changes from popup
    chrome.storage.local.get(USER_SESSION_KEY, (result) => {
      if (result[USER_SESSION_KEY]) {
        const session = result[USER_SESSION_KEY];
        setUserId(session.userId || null);
        setUserEmail(session.userEmail || null);
        if (session.userId) {
          loadBookmarks(session.userId);
        }
      }
    });

    chrome.storage.local.get(SEARCH_STATE_KEY, (result) => {
      if (result[SEARCH_STATE_KEY]) {
        try {
          const state = result[SEARCH_STATE_KEY];
          setQuery(state.query || '');
          setSelectedPlatforms(state.selectedPlatforms || ['baidu', 'google', 'bing', 'bilibili', 'zhihu']);
          setAllResults(state.allResults || []);
          setFilteredResults(state.filteredResults || []);
          setDisplayedCount(state.displayedCount || 0);
          setHasSearched(state.hasSearched || false);
        } catch (e) {
          console.error('Failed to restore search state:', e);
        }
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        // User session change (from popup login/logout)
        if (changes[USER_SESSION_KEY]) {
          const session = changes[USER_SESSION_KEY].newValue;
          if (session) {
            setUserId(session.userId || null);
            setUserEmail(session.userEmail || null);
            if (session.userId) {
              loadBookmarks(session.userId);
            } else {
              setBookmarkedIds(new Set());
              setBookmarksList([]);
            }
          }
        }
        // Search state change
        if (changes[SEARCH_STATE_KEY]) {
          const state = changes[SEARCH_STATE_KEY].newValue;
          if (state) {
            setQuery(state.query || '');
            setSelectedPlatforms(state.selectedPlatforms || ['baidu', 'google', 'bing', 'bilibili', 'zhihu']);
            setAllResults(state.allResults || []);
            setFilteredResults(state.filteredResults || []);
            setDisplayedCount(state.displayedCount || 0);
            setHasSearched(state.hasSearched || false);
          }
        }
      }
    });
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (!hasSearched && allResults.length === 0) return;
    const state = {
      query,
      selectedPlatforms,
      allResults,
      filteredResults,
      displayedCount,
      hasSearched,
    };
    chrome.storage.local.set({ [SEARCH_STATE_KEY]: state });
  }, [query, selectedPlatforms, allResults, filteredResults, displayedCount, hasSearched]);

  // Listen for window bounds changes and save size
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleBoundsChanged = (w: chrome.windows.Window) => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (w.width && w.height) {
          chrome.storage.local.set({
            [FLOAT_WINDOW_SIZE_KEY]: {
              width: w.width,
              height: w.height,
            },
          });
        }
      }, 500);
    };

    chrome.windows.onBoundsChanged.addListener(handleBoundsChanged);

    return () => {
      chrome.windows.onBoundsChanged.removeListener(handleBoundsChanged);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Get current window ID on mount
  useEffect(() => {
    chrome.windows.getCurrent(w => {
      if (w.id) setWindowId(w.id);
    });
  }, []);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!windowId) return;
      const deltaX = e.screenX - resizeStart.x;
      const deltaY = e.screenY - resizeStart.y;
      const newWidth = Math.max(280, Math.min(600, resizeStart.width + deltaX));
      const newHeight = Math.max(300, Math.min(800, resizeStart.height + deltaY));
      chrome.windows.update(windowId, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, windowId, resizeStart]);

  const loadBookmarks = async (uid: string) => {
    try {
      const bookmarks = await getBookmarks(uid);
      setBookmarkedIds(new Set(bookmarks.map(b => b.id)));
      setBookmarksList(bookmarks.map(b => b.data as SearchResult));
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || selectedPlatforms.length === 0) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setShowBookmarks(false);

    try {
      const response = await performAggregateSearch({ query: query.trim(), platforms: selectedPlatforms });
      setAllResults(response.results);
      setFilteredResults(response.results);
      setDisplayedCount(Math.min(response.results.length, ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setAllResults([]);
      setFilteredResults([]);
      setDisplayedCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformToggle = (platform: Platform) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform];
    setSelectedPlatforms(newPlatforms);

    if (hasSearched && allResults.length > 0) {
      const newFiltered = newPlatforms.length === 0
        ? allResults
        : allResults.filter(r => newPlatforms.includes(r.platform as Platform));
      setFilteredResults(newFiltered);
      setDisplayedCount(Math.min(newFiltered.length, ITEMS_PER_PAGE));
    }
  };

  const toggleBookmark = async (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    const resultId = `${result.platform}-${result.url}`;
    const resultData = JSON.stringify(result);

    try {
      if (bookmarkedIds.has(resultId)) {
        await removeBookmark(userId, resultId);
        setBookmarkedIds(prev => { const next = new Set(prev); next.delete(resultId); return next; });
        setBookmarksList(prev => prev.filter(r => `${r.platform}-${r.url}` !== resultId));
      } else {
        await addBookmark(userId, resultId, resultData);
        setBookmarkedIds(prev => new Set(prev).add(resultId));
        setBookmarksList(prev => [result, ...prev]);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && displayedCount < filteredResults.length) {
          setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredResults.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [displayedCount, filteredResults.length, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleResultClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  const handleClose = () => {
    chrome.windows.getCurrent(w => {
      if (w.id) chrome.windows.remove(w.id);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    chrome.storage.local.remove(USER_SESSION_KEY);
    setUserId(null);
    setUserEmail(null);
    setBookmarkedIds(new Set());
    setBookmarksList([]);
  };

  const displayedResults = showBookmarks ? bookmarksList : (() => {
    let results = filteredResults;
    if (contentFilter === 'video') {
      results = [...filteredResults].sort((a, b) => {
        const aIsVideo = a.contentType === 'video' ? 1 : 0;
        const bIsVideo = b.contentType === 'video' ? 1 : 0;
        return bIsVideo - aIsVideo;
      });
    } else if (contentFilter === 'article') {
      results = [...filteredResults].sort((a, b) => {
        const aIsArticle = a.contentType !== 'video' ? 1 : 0;
        const bIsArticle = b.contentType !== 'video' ? 1 : 0;
        return bIsArticle - aIsArticle;
      });
    }
    return results.slice(0, displayedCount);
  })();

  return (
    <div style={{ ...styles.container, width: '100%', height: '100%', borderRadius: 0, position: 'relative' }}>
      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 20,
          height: 20,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 4,
          zIndex: 10,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
          chrome.windows.getCurrent(w => {
            if (w.id) {
              setResizeStart({ x: e.screenX, y: e.screenY, width: w.width || 280, height: w.height || 400 });
            }
          });
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M10 2L2 10M10 6L6 10M10 10" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      {/* Header */}
      <div style={{ ...styles.header, borderRadius: 0 }}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <Search size={18} color="#fff" />
          </div>
          <span style={styles.logoText}>{showBookmarks ? '我的收藏' : '聚合搜索'}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {userId && (
              <>
                {!showBookmarks && (
                  <span style={{ fontSize: '11px', color: '#666', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
                )}
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                  title="收藏"
                >
                  <Star size={16} color={showBookmarks ? '#FFB84D' : '#888'} fill={showBookmarks ? '#FFB84D' : 'none'} />
                </button>
                {!showBookmarks && (
                  <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }} title="退出登录">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                )}
              </>
            )}
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }} title="关闭">
              <X size={16} color="#888" />
            </button>
          </div>
        </div>
        {!showBookmarks && (
          <>
            <div style={styles.searchRow}>
              <input
                type="text"
                placeholder="输入搜索关键词..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.searchInput}
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim() || selectedPlatforms.length === 0}
                style={{
                  ...styles.searchButton,
                  opacity: (isLoading || !query.trim() || selectedPlatforms.length === 0) ? 0.5 : 1,
                  cursor: (isLoading || !query.trim() || selectedPlatforms.length === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                搜索
              </button>
            </div>
            <div style={styles.platformRow}>
              {platformOptions.map(opt => {
                const isSelected = selectedPlatforms.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handlePlatformToggle(opt.value)}
                    style={styles.platformButton(isSelected, opt.bgColor)}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <p style={{ fontSize: '11px', color: '#FF6B9D', marginTop: '8px' }}>请至少选择一个平台</p>
            )}

            {hasSearched && allResults.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => setContentFilter('all')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: contentFilter === 'all' ? '#FF6B9D' : '#f0f0f0',
                    color: contentFilter === 'all' ? '#fff' : '#666',
                  }}
                >
                  全部
                </button>
                <button
                  onClick={() => setContentFilter('video')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: contentFilter === 'video' ? '#FF6B9D' : '#f0f0f0',
                    color: contentFilter === 'video' ? '#fff' : '#666',
                  }}
                >
                  视频优先
                </button>
                <button
                  onClick={() => setContentFilter('article')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: contentFilter === 'article' ? '#FF6B9D' : '#f0f0f0',
                    color: contentFilter === 'article' ? '#fff' : '#666',
                  }}
                >
                  图文优先
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bookmarks View */}
      {showBookmarks ? (
        <div style={styles.content}>
          {bookmarksList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <Star size={32} color="#ddd" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: '#888' }}>暂无收藏内容</div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>搜索后点击☆收藏感兴趣的内容</div>
            </div>
          ) : (
            <div style={{ padding: '8px 12px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>共 {bookmarksList.length} 条收藏</p>
              {bookmarksList.map((result, index) => (
                <div
                  key={`bookmark-${index}`}
                  style={styles.resultCard(getPlatformBgColor(result.platform))}
                  onClick={() => handleResultClick(result.url)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={styles.badge(platformBadgeColor[result.platform] || '#888')}>
                      {platformLabel[result.platform] || '其他'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.resultTitle}>{result.title}</div>
                      {result.description && <div style={styles.resultDesc}>{result.description}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={styles.resultMeta}>
                          {result.author && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><User size={9} />{result.author}</span>}
                          {result.publishTime && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} />{result.publishTime}</span>}
                        </div>
                        <button onClick={(e) => toggleBookmark(result, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                          <span style={{ fontSize: '14px', color: '#FFB84D' }}>★</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.content}>
          {error && (
            <div style={styles.errorBox}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={14} color="#E53E3E" style={{ marginTop: '1px' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#C53030' }}>出错了</div>
                  <div style={{ fontSize: '11px', color: '#E53E3E', marginTop: '2px' }}>{error}</div>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={styles.loadingCard}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '50px', height: '18px', borderRadius: '9px', background: '#E8E8E8', marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '12px', width: '75%', borderRadius: '6px', background: '#E8E8E8', marginBottom: '6px' }} />
                      <div style={{ height: '10px', width: '100%', borderRadius: '5px', background: '#EEEEEE', marginBottom: '4px' }} />
                      <div style={{ height: '10px', width: '60%', borderRadius: '5px', background: '#EEEEEE' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && displayedResults.length > 0 && (
            <div>
              <p style={styles.resultCount}>
                找到 <strong>{filteredResults.length}</strong> 个结果
                {hasSearched && selectedPlatforms.length > 0 && selectedPlatforms.length < 4 && allResults.length !== filteredResults.length && (
                  <span style={{ color: '#FF6B9D', fontSize: '10px', marginLeft: '6px' }}>(已过滤)</span>
                )}
              </p>
              {displayedResults.map((result, index) => {
                const resultId = `${result.platform}-${result.url}`;
                const isBookmarked = bookmarkedIds.has(resultId);
                return (
                  <div
                    key={`${result.platform}-${index}`}
                    style={styles.resultCard(getPlatformBgColor(result.platform))}
                    onClick={() => handleResultClick(result.url)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={styles.badge(platformBadgeColor[result.platform] || '#888')}>
                        {platformLabel[result.platform] || '其他'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.resultTitle}>{result.title}</div>
                        {result.description && <div style={styles.resultDesc}>{result.description}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={styles.resultMeta}>
                            {result.author && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><User size={9} />{result.author}</span>}
                            {result.publishTime && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} />{result.publishTime}</span>}
                            {result.platform === 'bilibili' && result.metadata?.viewCount && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Play size={9} fill="#FF6B9D" color="#FF6B9D" />{formatCount(result.metadata.viewCount)}</span>
                            )}
                            {result.platform === 'bilibili' && result.metadata?.likeCount && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><ThumbsUp size={9} color="#FF6B9D" />{formatCount(result.metadata.likeCount)}</span>
                            )}
                            {result.platform === 'zhihu' && result.metadata?.voteupCount && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><ThumbsUp size={9} color="#0066FF" />{formatCount(result.metadata.voteupCount)}</span>
                            )}
                          </div>
                          <button onClick={(e) => toggleBookmark(result, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                            <span style={{ fontSize: '14px', color: isBookmarked ? '#FFB84D' : '#ccc' }}>{isBookmarked ? '★' : '☆'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {displayedCount < filteredResults.length && (
                <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '16px 0' }}>
                  <span style={{ fontSize: '11px', color: '#999' }}>加载更多...</span>
                </div>
              )}
            </div>
          )}

          {!isLoading && displayedResults.length === 0 && !error && hasSearched && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Search size={28} color="#fff" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>未找到相关结果</div>
              <div style={{ fontSize: '12px', color: '#888' }}>尝试使用不同的关键词或选择更多平台</div>
            </div>
          )}

          {!hasSearched && (
            <div style={{ ...styles.emptyState, paddingTop: '100px' }}>
              <div style={{ ...styles.emptyIcon, width: '56px', height: '56px' }}>
                <Search size={24} color="#fff" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>跨平台聚合搜索</div>
              <div style={{ fontSize: '12px', color: '#888' }}>选择平台并输入关键词开始搜索</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<FloatApp />);
}
