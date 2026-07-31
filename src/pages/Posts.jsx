import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Navbar from '../components/blog/Navbar';
import Footer from '../components/blog/Footer';
import PostCard from '../components/blog/PostCard';
import PillTabBar from '../components/ui/PillTabBar';
import { posts, categories } from '../data/posts';

export default function Posts() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2">所有文章</h1>
          <p className="text-[var(--text-muted)] text-sm">
            共 <span className="font-semibold text-[var(--color-primary)]">{posts.length}</span> 篇文章
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8"
        >
          <div className="overflow-x-auto scrollbar-hide">
            <PillTabBar
              tabs={categories}
              activeTab={activeCategory}
              onChange={setActiveCategory}
              className="min-w-max"
            />
          </div>

          <div className="relative sm:ml-auto sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="搜索文章…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm liquid-glass rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-pink-300/50 text-[var(--text-body)] placeholder:text-[var(--text-muted)] bg-transparent"
            />
          </div>
        </motion.div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-[var(--text-muted)]"
          >
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">没有找到匹配的文章</p>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
