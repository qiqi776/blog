import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { posts } from '../data/posts';

// Group posts by year-month
function groupByMonth(posts) {
  const map = {};
  posts.forEach(post => {
    const [year, month] = post.date.split('-');
    const key = `${year}-${month}`;
    if (!map[key]) map[key] = { year, month, posts: [] };
    map[key].posts.push(post);
  });
  // Sort newest first
  return Object.values(map).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });
}

const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// Slug may contain '/' and CJK (e.g. 'go/底层/gmp') — encode each segment
const postHref = (slug) => '/posts/' + slug.split('/').map(encodeURIComponent).join('/');

export default function Archive() {
  const grouped = groupByMonth(posts);
  const totalPosts = posts.length;

  return (
    <div className="page-shell pt-28 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2">归档</h1>
        <p className="text-[var(--text-muted)] text-sm">
          共 <span className="font-semibold text-[var(--color-primary)]">{totalPosts}</span> 篇文章
        </p>
      </motion.div>

      {/* Timeline. Capped narrower than the shell on purpose: the shell width
          exists so this page's left edge lines up with the navbar and every
          other page, but a one-line-per-post timeline stretched to 1152px would
          leave the dates and titles marooned at opposite ends. */}
      <div className="relative max-w-3xl">
        {/* vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-pink-300/60 via-purple-300/40 to-transparent" />

        {grouped.map(({ year, month, posts: monthPosts }, gi) => (
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: gi * 0.05 }}
            className="mb-8 pl-8"
          >
            {/* Month label */}
            <div className="relative flex items-center gap-3 mb-4 -ml-8">
              <div className="w-6 h-6 rounded-full liquid-glass border border-pink-200/50 flex items-center justify-center shrink-0 z-10">
                <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[var(--text-heading)]">{year}年</span>
                <span className="text-base font-semibold text-[var(--color-primary)]">{monthNames[parseInt(month)]}</span>
                <span className="text-xs text-[var(--text-muted)]">{monthPosts.length} 篇</span>
              </div>
            </div>

            {/* Posts in this month */}
            <div className="space-y-2">
              {monthPosts.map((post) => (
                <Link key={post.slug} to={postHref(post.slug)} className="block group">
                  <div className="liquid-glass rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 hover:border-white/30 hover:shadow-[0_4px_20px_rgba(31,38,135,0.15)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${post.categoryColor || 'bg-white/30 text-[var(--text-muted)]'}`}>
                        {post.categoryLabel}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-body)] truncate group-hover:text-[var(--text-heading)] transition-colors">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-[var(--text-muted)]">
                      <span className="hidden sm:flex items-center gap-1">
                        <Clock size={10} /> {post.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {post.date.slice(5)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
