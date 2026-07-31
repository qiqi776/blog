import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, BookOpen, Archive } from 'lucide-react';
import Navbar from '../components/blog/Navbar';
import Footer from '../components/blog/Footer';
import PostCard from '../components/blog/PostCard';
import { ParallaxBackground } from '../components/ui/Parallax';
import { getFeaturedPosts } from '../data/posts';

const featured = getFeaturedPosts(3);

// Floating orbs behind hero
function AuroraOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute rounded-full animate-gradient-drift"
        style={{
          top: '-10%', right: '-8%', width: '420px', height: '420px',
          background: 'radial-gradient(circle, rgba(255,107,157,0.35) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute rounded-full animate-gradient-drift"
        style={{
          bottom: '-5%', left: '15%', width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(123,97,255,0.28) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animationDelay: '-3s',
        }}
      />
      <div
        className="absolute rounded-full animate-gradient-drift"
        style={{
          top: '35%', right: '28%', width: '260px', height: '260px',
          background: 'radial-gradient(circle, rgba(255,184,107,0.22) 0%, transparent 70%)',
          filter: 'blur(45px)',
          animationDelay: '-6s',
        }}
      />
    </div>
  );
}

const quickLinks = [
  { to: '/posts', icon: BookOpen, label: '所有文章', desc: '技术笔记与生活随记' },
  { to: '/archive', icon: Archive, label: '归档时间线', desc: '按时间浏览历史文章' },
  { to: '/about', icon: Code2, label: '关于我', desc: '了解这个博客背后的人' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <AuroraOrbs />
        <ParallaxBackground speed={0.4} className="relative z-10 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass mb-6 text-sm text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              欢迎来到我的博客
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5 leading-tight">
              <span className="text-[var(--text-heading)]">探索·思考·</span>
              <br />
              <span className="gradient-text">记录有趣的一切</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-muted)] mb-8 max-w-lg mx-auto leading-relaxed">
              这里是我的数字花园，记录技术探索、设计思考和日常感悟。
              代码与文字交织，极光与果冻美学并存。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/posts">
                <button className="btn-primary flex items-center gap-2 font-medium">
                  <BookOpen size={15} />
                  开始阅读
                </button>
              </Link>
              <Link to="/about">
                <button className="glass-button flex items-center gap-2 text-sm font-medium">
                  关于我
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            className="absolute -bottom-24 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-[var(--color-primary)] opacity-60" />
            </div>
          </motion.div>
        </ParallaxBackground>
      </section>

      {/* Quick links */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map(({ to, icon: Icon, label, desc }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link to={to} className="block group">
                <div className="liquid-glass rounded-2xl p-5 transition-all duration-300 hover:border-white/30 hover:shadow-[0_12px_40px_rgba(31,38,135,0.2)]">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-200/60 to-purple-200/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                    <Icon size={16} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="font-semibold text-sm text-[var(--text-heading)] mb-1">{label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{desc}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured posts */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-heading)]">最新文章</h2>
            <Link
              to="/posts"
              className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            >
              查看全部 <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
