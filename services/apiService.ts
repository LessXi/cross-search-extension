const API_BASE = 'https://cross-search-backend-production.up.railway.app/api';

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || '请求失败' };
    }

    return { success: true, data };
  } catch (err) {
    return { error: '网络错误，请检查网络连接' };
  }
}

// Railway 后端搜索（用于 Bing 等 Supabase 不支持的平台）
export async function searchViaRailway(query: string, platforms: string[], userApiKey?: string, tavilyApiKey?: string): Promise<{ results: any[]; error?: string }> {
  try {
    const body: { query: string; platforms: string[]; apiKey?: string; tavilyApiKey?: string } = { query, platforms };
    if (userApiKey) {
      body.apiKey = userApiKey;
    }
    if (tavilyApiKey) {
      body.tavilyApiKey = tavilyApiKey;
    }
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      return { results: [], error: data.error || '搜索失败' };
    }
    return { results: data.results || [], error: undefined };
  } catch (err) {
    return { results: [], error: '网络错误，请检查网络连接' };
  }
}

export async function register(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string; email?: string }> {
  const result = await request<{ userId: string; email: string }>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.success && result.data) {
    return { success: true, userId: result.data.userId, email: result.data.email };
  }

  return { success: false, error: result.error };
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string; email?: string }> {
  const result = await request<{ userId: string; email: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.success && result.data) {
    return { success: true, userId: result.data.userId, email: result.data.email };
  }

  return { success: false, error: result.error };
}

export async function getBookmarks(userId: string): Promise<{ id: string; data: any }[]> {
  const result = await request<{ bookmarks: { id: string; data: any }[] }>(`/bookmarks/${userId}`);

  if (result.success && result.data) {
    return result.data.bookmarks;
  }

  return [];
}

export async function addBookmark(userId: string, resultId: string, resultData: string): Promise<boolean> {
  const result = await request('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ userId, resultId, resultData }),
  });

  return result.success || false;
}

export async function removeBookmark(userId: string, resultId: string): Promise<boolean> {
  const result = await request('/bookmarks', {
    method: 'DELETE',
    body: JSON.stringify({ userId, resultId }),
  });

  return result.success || false;
}
