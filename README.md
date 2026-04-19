# Cross-Search 聚合搜索

Chrome 扩展，一次搜索，同时获取百度、Google、Bing、B站、知乎的结果。

## 功能特点

- 多平台聚合搜索
- 浮窗模式和弹窗模式
- 搜索结果收藏管理

## 支持平台

百度 / Google / Bing / B站 / 知乎

## 技术栈

React 18 + TypeScript + Vite + Tailwind CSS

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 安装

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist` 目录

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

## License

MIT
