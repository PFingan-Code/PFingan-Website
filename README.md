# PFingan 网站项目

## 项目概述

PFingan 官方网站项目。

这是一个 React + TypeScript + Vite 静态内容站点。代码保存在 `main`，站点内容和媒体资源保存在同仓库的 `data` 分支。构建时固定读取 data 分支提交，浏览器启动后会再次检查公开的最新数据。

## 技术栈

- React 19、TypeScript、Vite 6
- React Router、Tailwind CSS、Motion、Lucide
- GitHub Pages + SSG
- GitHub REST API（仅管理页使用管理员主动输入的 Token）

## 本地开发

```bash
npm install
npm run dev
```

本地构建需要能够解析 `data` 分支或 `origin/data` ref：

```bash
npm run lint
npm run validate:data
npm run build
```

也可以显式指定数据 ref：

```bash
DATA_REF=origin/data npm run lint
DATA_REF=origin/data npm run validate:data
```

Windows PowerShell 可使用 `$env:DATA_REF='origin/data'` 后执行命令。

## 数据契约

`data` 分支是纯数据分支，只包含 `data/` 目录；该目录包含以下文件和 `assets/` 媒体目录：

- `site.json`：品牌、Hero、页脚、页面文案、仓库、导航、首页、公告、联系方式和外部功能配置
- `features.json`：首页功能板块
- `servers.json`：服务器历史记录
- `resources.json`：资源和附件
- `members.json`：团队与社区成员
- `moments.json`：相册分类和媒体项目
- `donations.json`：付款方式与赞助记录
- `manifest.json`：schema 版本、内容 hash 和文件清单

所有 JSON 在构建和运行时都会经过同一套校验。当前支持 schema 1（兼容旧 data）和 schema 2（当前格式）。`manifest.contentHash` 是规范化聚合数据的 SHA-256；数据无效或 hash 不匹配时构建失败，浏览器运行时则回退到构建快照。首次升级旧 data 前，应先让 main 支持 schema 2，再在 data 分支工作树运行 `npm run migrate:data -- <data工作树> --write`；脚本会生成资源 manifest，并报告仍需在后台替换的外部团队头像。

初始内容已经迁移到 `data` 分支。后续内容变更应直接通过管理页或 GitHub 修改 `data` 分支；`main` 源码树不保留旧站点常量，也不会从源码文件读取站点内容。

## 管理页

访问 `/admin`，输入限制到目标仓库的 fine-grained GitHub Token。工作台把结构化表单、图库编辑和高级 JSON 汇总为一份草稿，可先预览真实页面，再选择提交内容或重建 Pages。

图片支持 JPEG、PNG、WebP，附件支持 PDF、ZIP；单文件最大 5 MiB，单次新增/替换资源总量最大 20 MiB。新资源由后台生成固定的 `assets/...` 路径，上传、替换、数据 JSON 和 manifest 在同一个 data commit 中提交。仍被内容引用的资源不能删除。

Token 只保存在当前浏览器的 `sessionStorage`，不会写入 URL、data 文件、构建产物或日志。建议只授予目标仓库的 `Contents: read/write` 和 `Actions: read/write` 权限，并在使用后清除会话。浏览器 Token 不是服务端密钥，请不要使用组织级高权限 Token。

工作台读取时记录 data branch head SHA；提交前如果分支已变化，会拒绝旧草稿并要求重新读取。`提交 data` 只更新内容；`仅重建` 只触发 Pages 构建；`提交并重建` 依次执行两项操作。

## 构建与部署

`.github/workflows/deploy.yml` 在 `main` 更新时运行，也支持手动 workflow dispatch。data 分支 push 不会自动部署，后台在管理员明确选择重建时才 dispatch 部署 workflow。构建 job 固定 checkout `main`，再 fetch `origin/data`，因此代码和内容的职责边界明确。自定义域默认使用根路径 `/`；若使用 GitHub Pages 项目路径，请在仓库 Settings → Secrets and variables → Actions → Variables 中设置 `PAGES_BASE_PATH`，例如 `/PFingan-Website/`。

构建产物首先使用 data 快照生成 SSG HTML，之后客户端从公开 raw GitHub data 地址检查最新内容。若 data 已更新，页面可以在不重建时显示合法的新内容，但会提示静态 HTML、SEO 元数据和构建版本仍等待重建。

纯静态 GitHub Pages 没有安全的匿名写入后端，因此投票、反馈和投稿只能配置为外部服务链接；未配置时会显示不可用状态，不会伪造实时结果或保存匿名提交。
