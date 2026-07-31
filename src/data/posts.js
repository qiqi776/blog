import {
  parseFrontmatter,
  categoryFromPath,
  slugFromPath,
  extractExcerpt,
  estimateReadTime,
  CATEGORY_MAP,
} from "../lib/markdown";

// Vite loads all .md files from the project-root /posts/ directory at build time
const rawFiles = import.meta.glob("/posts/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function buildPost([filePath, raw]) {
  const { data, content } = parseFrontmatter(raw);
  const cat = categoryFromPath(filePath);
  return {
    slug: slugFromPath(filePath),
    title: data.title || filePath.split("/").pop().replace(".md", ""),
    excerpt: extractExcerpt(content),
    content, // raw markdown (rendered on-demand)
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: cat.id,
    categoryLabel: cat.label,
    categoryColor: cat.color,
    date: data.date ? String(data.date) : "2026-01-01",
    readTime: estimateReadTime(content),
    draft: data.draft === true,
    order: data.order ?? 999,
  };
}

export const posts = Object.entries(rawFiles)
  .filter(([p]) => p !== "/posts/index.md") // skip VitePress layout file
  .map(buildPost)
  .filter((p) => !p.draft && p.title)
  .sort((a, b) => b.date.localeCompare(a.date));

// Derive unique categories with counts, sorted by count desc
const catMap = {};
posts.forEach((p) => {
  if (!catMap[p.category]) {
    catMap[p.category] = { id: p.category, label: p.categoryLabel, count: 0 };
  }
  catMap[p.category].count++;
});

export const categories = [
  { id: "all", label: "全部", count: posts.length },
  ...Object.values(catMap).sort((a, b) => b.count - a.count),
];

export const getPostBySlug = (slug) => posts.find((p) => p.slug === slug);
export const getFeaturedPosts = (n = 3) => posts.slice(0, n);

// Re-export helpers so importers don't need a second import
export { CATEGORY_MAP };
