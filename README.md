# 追忆成空的博客

这是一个基于 React 和 Vite 的个人博客。文章以 Markdown 存放在仓库中，构建时会自动生成文章列表、分类信息和访问路径。

## 主要功能

- 自动加载 `posts/` 下的 Markdown 文章，不需要手动维护文章列表
- 支持按标题、摘要和分类搜索文章，也可以按分类筛选、分页浏览
- 提供文章归档、页内目录，以及同分类文章的上一篇/下一篇导航
- 首页展示最近文章、写作统计、个人项目和音乐组件
- 使用响应式布局，适配桌面端和移动端
- 支持页面过渡、樱花背景动画，并尊重系统的减少动态效果设置

## 技术栈

- React 18
- React Router 6
- Vite 5
- Tailwind CSS 3
- Framer Motion
- marked
- Lucide React
- Fontsource

## 项目结构

```text
.
├── posts/                       # Markdown 文章
├── public/                      # 图片与其他静态资源
├── src/components/              # 通用组件与博客组件
├── src/config/                  # 页面背景配置
├── src/data/                    # 文章索引与个人资料
├── src/lib/markdown.js          # Frontmatter 解析与文章元数据处理
├── src/pages/                   # 页面组件
├── src/routes.jsx               # 路由配置
└── package.json                 # 依赖与项目命令
```

## 本地运行

建议使用 Node.js 18 或 Node.js 20 及以上版本。

```bash
npm install
npm run dev
```

本地开发地址默认为 `http://localhost:5173`。

构建并预览生产版本：

```bash
npm run build
npm run preview
```
