# Cross-Search 聚合搜索

浏览器扩展，一次搜索，汇聚百度、Google、Bing、B站、知乎等多个平台的精华内容。

## 支持平台

| 平台 | 标识 |
|------|------|
| 百度 | `baidu` |
| Google | `google` |
| Bing | `bing` |
| B站 | `bilibili` |
| 知乎 | `zhihu` |

## 技术栈

- **Chrome Extension** (Manifest V3)
- **React 18** + **TypeScript**
- **Vite** 构建工具
- **Tailwind CSS** 样式

## 后端服务

| 服务 | 用途 |
|------|------|
| [Railway](https://railway.app) | 搜索 API、用户认证、收藏管理 |
| [Turso](https://turso.tech) | 本地数据库 |

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 安装扩展

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist` 目录

## 项目结构

```
├── popup.tsx        # 主弹窗应用
├── float.tsx        # 浮窗应用
├── background.ts    # Service Worker
├── components/      # React 组件
├── services/        # 业务服务
│   ├── searchService.ts   # 聚合搜索
│   ├── apiService.ts      # API 调用
│   ├── authService.ts     # 认证
│   └── database.ts        # 数据库
└── icons/           # 扩展图标
```

## License

MIT
