import { motion } from 'framer-motion';
import { GitBranch, Star, ExternalLink, Code2, Zap } from 'lucide-react';
import Navbar from '../components/blog/Navbar';
import Footer from '../components/blog/Footer';
import { TiltCard } from '../components/ui/TiltCard';

const GITHUB = 'https://github.com/qiqi776';

const projects = [
  {
    name: 'zfeed',
    lang: 'Go',
    langColor: '#00ADD8',
    desc: '基于微服务架构的社区信息流系统，涵盖内容发布、推荐/关注流、搜索、互动计数等完整服务链路。',
    stars: 4,
    forks: 1,
    href: 'https://github.com/qiqi776/zfeed',
  },
  {
    name: 'mini-kv',
    lang: 'Go',
    langColor: '#00ADD8',
    desc: '基于 Raft 共识算法实现的分布式键值存储系统。',
    stars: 3,
    forks: 0,
    href: 'https://github.com/qiqi776/mini-kv',
  },
  {
    name: 'tinykv',
    lang: 'Go',
    langColor: '#00ADD8',
    desc: 'TalentPlan TinyKV 课程实现——从零构建分布式 KV 存储。',
    stars: 1,
    forks: 0,
    href: 'https://github.com/qiqi776/tinykv',
  },
  {
    name: 'my-rag-agent',
    lang: 'Python',
    langColor: '#3776AB',
    desc: 'RAG 学习项目，探索大模型检索增强生成技术。',
    stars: 1,
    forks: 0,
    href: 'https://github.com/qiqi776/my-rag-agent',
  },
  {
    name: 'cs144',
    lang: 'C++',
    langColor: '#f34b7d',
    desc: 'Stanford CS144 计算机网络课程实验——实现 TCP/IP 协议栈。',
    stars: 1,
    forks: 0,
    href: 'https://github.com/qiqi776/cs144',
  },
  {
    name: 'my-blog',
    lang: 'Vue',
    langColor: '#42b883',
    desc: '早期个人博客项目，Vue 技术栈构建。',
    stars: 3,
    forks: 0,
    href: 'https://github.com/qiqi776/my-blog',
  },
];

const skills = [
  { label: 'Go',                  level: 88 },
  { label: '分布式系统',           level: 80 },
  { label: 'Python',              level: 68 },
  { label: 'Vue / 前端',           level: 65 },
  { label: 'C++ / 系统编程',       level: 60 },
  { label: 'MySQL / Redis / MQ',  level: 75 },
];

const langColors = { Go: '#00ADD8', Python: '#3776AB', Vue: '#42b883', 'C++': '#f34b7d' };

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-10 space-y-10">

        {/* ── Profile ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <TiltCard tiltAmount={4} scaleAmount={1.01} speed={0.2}>
            <div className="liquid-glass rounded-2xl p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-300 to-purple-300 flex items-center justify-center text-3xl shadow-lg animate-float">
                    👾
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white/60 shadow-sm" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[var(--text-heading)] mb-1">qiqi776</h1>
                  <p className="text-sm text-[var(--text-body)] leading-relaxed max-w-md mt-2">
                    后端工程师，偏好 Go 和分布式系统方向。热衷于从底层理解系统原理，喜欢用代码把想法变成能跑起来的东西。
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                    <span>📦 28 个公开仓库</span>
                    <span>⭐ 7 位关注者</span>
                  </div>
                </div>

                {/* GitHub */}
                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button flex items-center gap-2 text-sm font-medium shrink-0"
                >
                  <GitBranch size={14} /> GitHub
                </a>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* ── Projects ── */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-5">
            <Code2 size={15} className="text-[var(--color-primary)]" />
            <h2 className="text-base font-bold text-[var(--text-heading)]">项目</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="block group h-full">
                  <div className="liquid-glass rounded-2xl p-5 h-full flex flex-col gap-3 transition-all duration-200 hover:border-white/30 hover:shadow-[0_8px_32px_rgba(31,38,135,0.2)]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--text-heading)] group-hover:gradient-text transition-all">
                        {p.name}
                      </span>
                      <ExternalLink size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1">{p.desc}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.langColor }} />
                        {p.lang}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Star size={10} /> {p.stars}
                      </span>
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Skills ── */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={15} className="text-[var(--color-primary)]" />
              <h2 className="text-base font-bold text-[var(--text-heading)]">技能栈</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              {skills.map(({ label, level }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-medium text-[var(--text-body)]">{label}</span>
                    <span className="text-[var(--text-muted)]">{level}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))' }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Language badges */}
            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/15">
              {Object.entries(langColors).map(([lang, color]) => (
                <span
                  key={lang}
                  className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white/15 text-[var(--text-body)]"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

      </div>
      <Footer />
    </div>
  );
}
