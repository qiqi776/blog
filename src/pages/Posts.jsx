import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Tag, X } from 'lucide-react';
import PostCard from '../components/blog/PostCard';
import PillTabBar from '../components/ui/PillTabBar';
import { posts, categories } from '../data/posts';

const PAGE_SIZE = 12;

// Build a compact page list: 1 … 4 5 [6] 7 8 … 20
const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current]);
  for (let d = 1; d <= 1; d++) {
    if (current - d > 1) pages.add(current - d);
    if (current + d < total) pages.add(current + d);
  }
  // keep the list from collapsing at the edges
  if (current <= 3) [2, 3, 4].forEach((p) => p < total && pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => p > 1 && pages.add(p));

  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? ''; // driven by the navbar search
  const [page, setPage] = useState(1);

  // The category filter lives in the URL rather than in local state, so an
  // inbound link can select it. It used to be useState('all'), which meant
  // /posts?cat=go landed here and silently showed everything — the homepage
  // knowledge map had been linking that way the whole time. An unknown id
  // falls back to 'all' instead of filtering to an empty list.
  const catParam = searchParams.get('cat') ?? 'all';
  const activeCategory = categories.some((c) => c.id === catParam) ? catParam : 'all';

  const setActiveCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('cat');
    else next.set('cat', id);
    setSearchParams(next, { replace: true });
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        const matchCat = activeCategory === 'all' || p.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q);
        return matchCat && matchSearch;
      }),
    [activeCategory, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to first page whenever the filter set changes
  useEffect(() => setPage(1), [activeCategory, searchQuery]);

  // Guard against a page index left dangling by a narrower filter
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-shell pt-28 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-7"
      >
        <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2">所有文章</h1>
        <p className="text-[var(--text-muted)] text-base md:text-lg">
          共 <span className="font-semibold text-[var(--color-primary)]">{posts.length}</span> 篇文章
          {filtered.length !== posts.length && (
            <> · 当前筛选 <span className="font-semibold text-[var(--color-primary)]">{filtered.length}</span> 篇</>
          )}
        </p>
      </motion.div>

      {/* Two-column: articles left, categories right */}
      <div className="flex gap-7 items-start">

        {/* ── Articles ────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Active search chip — search itself lives in the navbar */}
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-5 flex items-center gap-2 text-base md:text-lg"
            >
              <span className="text-[var(--text-muted)]">搜索</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-200/50 text-pink-700 font-medium">
                {searchQuery}
                <button
                  onClick={clearSearch}
                  aria-label="清除搜索"
                  className="hover:opacity-70 transition-opacity"
                >
                  <X size={12} />
                </button>
              </span>
            </motion.div>
          )}

          {/* Category pills — mobile only (sidebar takes over on lg+) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            className="lg:hidden overflow-x-auto scrollbar-hide mb-6"
          >
            <PillTabBar
              tabs={categories}
              activeTab={activeCategory}
              onChange={setActiveCategory}
              className="min-w-max"
            />
          </motion.div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <>
              <div
                key={`${activeCategory}-${searchQuery}-${page}`}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {pageItems.map((post, i) => (
                  <PostCard key={post.slug} post={post} index={i} />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={goTo} total={filtered.length} />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-[var(--text-muted)]"
            >
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-base md:text-lg">没有找到匹配的文章</p>
            </motion.div>
          )}
        </div>

        {/* ── Category sidebar ────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="hidden lg:block w-48 shrink-0 sticky top-24 self-start"
        >
          <CategorySidebar cats={categories} active={activeCategory} onChange={setActiveCategory} />
        </motion.aside>

      </div>
    </div>
  );
}

// ── Category sidebar ─────────────────────────────────────────
function CategorySidebar({ cats, active, onChange }) {
  return (
    <div className="liquid-glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/15">
        <Tag size={12} className="text-[var(--color-primary)]" />
        <span className="text-sm md:text-base font-semibold text-[var(--text-heading)] tracking-wide uppercase">分类</span>
      </div>
      <nav className="space-y-0.5">
        {cats.map((c) => {
          const on = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm md:text-base transition-all duration-150 ${
                on
                  ? 'bg-pink-100/40 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-white/10'
              }`}
            >
              <span className="truncate text-left">{c.label}</span>
              <span
                className={`shrink-0 text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  on ? 'bg-white/50' : 'bg-white/20'
                }`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────
function Pagination({ page, totalPages, onChange, total }) {
  if (totalPages <= 1) return null;

  const btn =
    'w-8 h-8 flex items-center justify-center rounded-xl text-sm md:text-base transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <motion.nav
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="mt-10 flex flex-col items-center gap-3"
      aria-label="分页导航"
    >
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="上一页"
          className={`${btn} glass-button !p-0 text-[var(--text-muted)] hover:text-[var(--text-body)]`}
        >
          <ChevronLeft size={14} />
        </button>

        {buildPageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-sm md:text-base text-[var(--text-muted)]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${
                p === page
                  ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold shadow-sm'
                  : 'glass-button !p-0 text-[var(--text-muted)] hover:text-[var(--text-body)]'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="下一页"
          className={`${btn} glass-button !p-0 text-[var(--text-muted)] hover:text-[var(--text-body)]`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <p className="text-sm md:text-base text-[var(--text-muted)]">
        第 {page} / {totalPages} 页 · 共 {total} 篇
      </p>
    </motion.nav>
  );
}
