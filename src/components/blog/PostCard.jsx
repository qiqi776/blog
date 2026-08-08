import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';

export default function PostCard({ post, index = 0 }) {
  // Slug may contain '/' (e.g. 'go/底层/gmp') — encode each segment
  const href = '/posts/' + post.slug.split('/').map(encodeURIComponent).join('/');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <TiltCard tiltAmount={5} scaleAmount={1.01} speed={0.15}>
        <Link to={href} className="block group">
          <div className="liquid-glass rounded-2xl p-6 h-full transition-all duration-300 hover:border-white/30 hover:shadow-[0_12px_40px_rgba(31,38,135,0.25)]">
            {/* Category + read time */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm md:text-base font-medium px-2.5 py-1 rounded-full ${post.categoryColor || 'bg-white/30 text-[var(--text-muted)]'}`}>
                {post.categoryLabel}
              </span>
              <div className="flex items-center gap-1 text-sm md:text-base text-[var(--text-muted)]">
                <Clock size={11} />
                <span>{post.readTime}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-heading)] mb-2 line-clamp-2 group-hover:gradient-text transition-all duration-200 leading-snug">
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base md:text-lg text-[var(--text-muted)] mb-4 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-auto">
              <div className="flex items-center gap-1.5 text-sm md:text-base text-[var(--text-muted)]">
                <Calendar size={11} />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1 text-sm md:text-base font-medium text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span>阅读</span>
                <ArrowRight size={11} />
              </div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}
