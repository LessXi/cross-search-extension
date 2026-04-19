# Cross-Search 聚合搜索

Chrome 扩展，一次搜索，同时获取多个平台的结果。

## 支持平台

百度 / Google / Bing / B站 / 知乎

## 使用方法

### 安装扩展

1. 下载最新版本或从源码构建
2. 打开 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `dist` 目录

### 基本操作

1. 点击扩展图标打开搜索面板
2. 输入关键词，选择要搜索的平台
3. 点击搜索，获取各平台聚合结果

### 浮窗模式

- 右键扩展图标可打开浮窗
- 浮窗可拖拽调整位置和大小
- 适合在看网页时快速搜索

### 收藏功能

- 登录后可收藏搜索结果
- 收藏内容同步到云端

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 技术栈

React 18 + TypeScript + Vite + Tailwind CSS

## 项目结构

```
├── popup.tsx          # 弹窗主界面
├── float.tsx          # 浮窗界面
├── background.ts      # Service Worker
├── components/        # React 组件
├── services/         # 业务逻辑
│   ├── searchService.ts   # 聚合搜索
│   ├── apiService.ts      # API 调用
│   ├── authService.ts     # 用户认证
│   └── database.ts        # 本地数据库
└── icons/             # 扩展图标
```

## 后端服务

| 服务 | 用途 |
|------|------|
| [Railway](https://railway.app) | 搜索 API、认证、收藏 |
| [Turso](https://turso.tech) | 数据库 |

## 相关项目

[Cross-Search Backend](https://github.com/LessXi/cross-search-backend) - 后端 API 服务

## License

MIT
