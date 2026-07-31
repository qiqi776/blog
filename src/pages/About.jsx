import { motion } from 'framer-motion';
import { GitBranch, AtSign, Mail, Code2, Coffee, Camera, Music, BookOpen, MapPin, Zap } from 'lucide-react';
import Navbar from '../components/blog/Navbar';
import Footer from '../components/blog/Footer';
import { TiltCard } from '../components/ui/TiltCard';

const skills = [
  { label: 'React / Next.js', level: 90 },
  { label: 'TypeScript', level: 80 },
  { label: 'Tailwind CSS', level: 88 },
  { label: 'Node.js', level: 72 },
  { label: 'UI/UX Design', level: 65 },
];

const interests = [
  { icon: Code2, label: '开发', desc: '热爱构建精美的 Web 体验' },
  { icon: Camera, label: '摄影', desc: '用镜头记录极光和星空' },
  { icon: Music, label: '音乐', desc: '弹琴是放松大脑的方式' },
  { icon: BookOpen, label: '阅读', desc: '技术与人文兼读' },
  { icon: Coffee, label: '咖啡', desc: '每天的能量来源' },
  { icon: MapPin, label: '旅行', desc: '已去过 12 个国家' },
];

const timeline = [
  { year: '2026', event: '启动个人博客，开始公开写作之旅' },
  { year: '2024', event: '加入某互联网公司担任前端工程师' },
  { year: '2023', event: '第一次追极光，从此爱上冰岛' },
  { year: '2022', event: '开始系统学习设计，入坑 Figma' },
  { year: '2021', event: '毕业，第一份前端实习工作' },
  { year: '2019', event: '大学期间自学编程，写出第一个网站' },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-10 space-y-10">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TiltCard tiltAmount={4} scaleAmount={1.01} speed={0.2}>
            <div className="liquid-glass rounded-2xl p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center text-3xl shadow-lg animate-float">
                    👾
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white/60 shadow-sm" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[var(--text-heading)] mb-1">Hey, I'm a Dev ✨</h1>
                  <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-3">
                    <MapPin size={13} /> 地球某处 · 喜欢极光的地方
                  </div>
                  <p className="text-sm text-[var(--text-body)] leading-relaxed max-w-md">
                    前端工程师 & 业余摄影师，热爱将代码和设计融合成美好的用户体验。
                    这个博客是我记录技术探索、生活感悟和追光旅途的地方。
                  </p>
                </div>

                {/* Social links */}
                <div className="flex sm:flex-col gap-2">
                  {[
                    { icon: GitBranch, href: 'https://github.com', label: 'GitHub' },
                    { icon: AtSign, href: 'https://twitter.com', label: 'Twitter' },
                    { icon: Mail, href: 'mailto:hello@example.com', label: 'Email' },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-9 h-9 rounded-xl glass-button !p-0 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
                    >
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Skills + Interests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="liquid-glass rounded-2xl p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <Zap size={15} className="text-[var(--color-primary)]" />
                <h2 className="text-base font-bold text-[var(--text-heading)]">技能栈</h2>
              </div>
              <div className="space-y-4">
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
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Interests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="liquid-glass rounded-2xl p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <Coffee size={15} className="text-[var(--color-primary)]" />
                <h2 className="text-base font-bold text-[var(--text-heading)]">兴趣爱好</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {interests.map(({ icon: Icon, label, desc }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="glass-panel !rounded-xl !p-3 flex flex-col gap-1.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-200/60 to-purple-200/40 flex items-center justify-center">
                      <Icon size={13} className="text-[var(--color-primary)]" />
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-body)]">{label}</div>
                    <div className="text-[10px] text-[var(--text-muted)] leading-tight">{desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="liquid-glass rounded-2xl p-6">
            <h2 className="text-base font-bold text-[var(--text-heading)] mb-6">成长轨迹</h2>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-pink-300/60 via-purple-300/40 to-transparent" />
              <div className="space-y-5 pl-10">
                {timeline.map(({ year, event }, i) => (
                  <motion.div
                    key={year + event}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="relative"
                  >
                    {/* dot */}
                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 border-2 border-white/50 shadow-sm" />
                    <div className="text-xs font-bold text-[var(--color-primary)] mb-0.5">{year}</div>
                    <div className="text-sm text-[var(--text-body)]">{event}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="liquid-glass liquid-glass-glow rounded-2xl p-8 text-center">
            <div className="text-2xl mb-3">👋</div>
            <h2 className="text-lg font-bold text-[var(--text-heading)] mb-2">来聊聊吧</h2>
            <p className="text-sm text-[var(--text-muted)] mb-5 max-w-sm mx-auto">
              对文章有想法？遇到了有趣的项目？或者只是想打个招呼？随时欢迎！
            </p>
            <a
              href="mailto:hello@example.com"
              className="inline-flex items-center gap-2 btn-primary text-sm font-medium"
            >
              <Mail size={14} /> 发邮件给我
            </a>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
