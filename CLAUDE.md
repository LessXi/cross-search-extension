# Cross-Search 聚合搜索 - 项目文档

## 项目概述

浏览器扩展，提供跨平台聚合搜索功能，支持百度、Google、Bing、B站、知乎等多个平台。

## 技术架构

```
Chrome Extension (Manifest V3)
├── popup.tsx        # 主弹窗 React 应用
├── float.tsx        # 浮窗 React 应用
├── background.ts     # Service Worker
└── services/
    ├── searchService.ts   # 聚合搜索入口
    ├── apiService.ts      # Railway 后端 API 调用
    ├── authService.ts     # Supabase 认证
    ├── database.ts         # Turso (libSQL) 本地数据库
    └── supabase.ts        # Supabase 客户端
```

## 外部依赖

| 服务 | 用途 | URL |
|------|------|-----|
| Turso | 本地数据库 | `https://crosssearch-lessxi.aws-ap-northeast-1.turso.io` |
| Railway Backend | 搜索 API、用户认证、收藏管理 | `https://cross-search-backend-production.up.railway.app` |

## 支持平台

`baidu` | `google` | `bing` | `bilibili` | `zhihu` | `weibo` | `douyin` | `xiaohongshu` | `youtube` | `twitter`

## 存储 Key 约定

所有 storage key 使用 `snake_case`，以 `cross_search_` 前缀开头：

| Key | 类型 | 描述 |
|-----|------|------|
| `cross_search_user_id` | localStorage | 用户 ID |
| `cross_search_user_email` | localStorage | 用户邮箱 |
| `cross_search_user_session` | chrome.storage.local | 用户会话信息 |
| `cross_search_state` | chrome.storage.local | 搜索状态（query, platforms, results 等） |
| `float_window_size` | chrome.storage.local | 浮窗窗口尺寸 {width, height} |
| `serp_api_key` | chrome.storage.local | SERP API 密钥 |

## 窗口类型

- **popup.tsx**: 通过 `action.default_popup` 打开，默认 380x520px
- **float.tsx**: 通过 `chrome.windows.create({ type: 'popup' })` 打开，可调整大小，默认 280x400px

## 命名规范

### 变量/函数
- 使用 `camelCase` (如 `userId`, `selectedPlatforms`)
- 存储 Key 使用 `snake_case` (如 `cross_search_user_id`)

### 组件/样式
- React 组件文件: `PascalCase.tsx` (如 `ResultCard.tsx`)
- 样式对象: `camelCase` + 类型后缀 (如 `popupStyles.ts`, `resultCard`)

### 常量
- 使用 `UPPER_SNAKE_CASE` (如 `ITEMS_PER_PAGE`, `FLOAT_WINDOW_SIZE_KEY`)

## 重要提示

1. **float 窗口限制**: Chrome 对 `type: 'popup'` 窗口有最小宽度限制（约 220px），无法通过代码突破
2. **认证流程**: 使用 Railway 后端进行用户认证，数据存储在 Turso 数据库
3. **搜索服务**: 聚合搜索通过 Railway 后端实现，Bing 等平台使用 Railway API
