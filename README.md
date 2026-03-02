# PFingan 网站项目

## 项目概述

PFingan 官方网站，使用 React + TypeScript + Vite 构建。

## 技术栈

- **前端框架**: React 19.0.0 + TypeScript
- **构建工具**: Vite 6.2.0
- **路由**: React Router DOM 7.13.1
- **样式**: Tailwind CSS 4.1.14
- **动画**: Motion (Framer Motion) 12.23.24
- **图标**: Lucide React 0.546.0
- **部署**: 支持静态站点生成 (SSG)

## 项目结构

```
src/
├── layouts/          # 布局组件
│   └── MainLayout.tsx
├── lib/               # 工具函数
│   └── utils.ts
├── pages/             # 页面组件
│   ├── AboutPage.tsx
│   ├── DonatePage.tsx
│   ├── HomePage.tsx
│   ├── MomentPage.tsx
│   └── ServerPage.tsx
├── constants.ts       # 常量配置
├── entry-ssg.tsx       # SSG 入口
├── index.css          # 全局样式
├── main.tsx           # 应用入口
└── router.tsx         # 路由配置
```

## 开发说明

### 开发环境
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

### 类型检查
```bash
npm run lint
```

## 数据来源

项目数据主要存储在 `src/constants.ts` 文件中。

## 部署

项目支持静态站点生成，可以通过 GitHub Actions 自动部署到静态托管服务。
