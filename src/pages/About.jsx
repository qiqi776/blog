import { motion } from 'framer-motion';
import { GitBranch, Star, ExternalLink, Code2, Zap } from 'lucide-react';
import { TiltCard } from '../components/ui/TiltCard';
import { GITHUB, AVATAR, DISPLAY_NAME, projects, skills, langColors } from '../data/profile';

export default function About() {
  return (
    <div className="page-shell pt-28 pb-10 space-y-10">

      {/* ── Profile ── */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <TiltCard tiltAmount={4} scaleAmount={1.01} speed={0.2}>
          <div className="liquid-glass rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                {/* `animate-float` is deliberately dropped, not forgotten: this
                    card is inside a TiltCard, which drives its own transform on
                    the wrapper. A float keyframe on a descendant fights that
                    transform and the avatar visibly jitters while the card tilts.
                    rounded-2xl kept from the emoji tile so the silhouette is
                    unchanged — the navbar mark is the round one. */}
                <img
                  src={AVATAR}
                  alt={DISPLAY_NAME}
                  width="80"
                  height="80"
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-1 ring-white/30"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white/60 shadow-sm" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-[var(--text-heading)] mb-1">{DISPLAY_NAME}</h1>
                <p className="text-base md:text-lg text-[var(--text-body)] leading-relaxed max-w-md mt-2">
                  后端工程师，偏好 Go 和分布式系统方向。热衷于从底层理解系统原理，喜欢用代码把想法变成能跑起来的东西。
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm md:text-base text-[var(--text-muted)]">
                  <span>📦 28 个公开仓库</span>
                  <span>⭐ 7 位关注者</span>
                </div>
              </div>

              {/* GitHub */}
              <a
                href={GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button flex items-center gap-2 text-base md:text-lg font-medium shrink-0"
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
          <h2 className="text-lg md:text-xl font-bold text-[var(--text-heading)]">项目</h2>
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
              {/* `h-full` has to be threaded through TiltCard too, or the grid
                  stops equalising card heights: TiltCard inserts a div between
                  the grid item and the card, and without it that wrapper
                  collapses to content height. Tilt is 6deg here against the
                  profile card's 4 — these cards are much smaller, and the same
                  angle over a shorter edge reads as barely moving. */}
              <TiltCard className="h-full" tiltAmount={6} scaleAmount={1.02} speed={0.15}>
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="block group h-full">
                  <div className="liquid-glass rounded-2xl p-5 h-full flex flex-col gap-3 transition-all duration-200 hover:border-white/30 hover:shadow-[0_8px_32px_rgba(31,38,135,0.2)]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base md:text-lg text-[var(--text-heading)] group-hover:gradient-text transition-all">
                        {p.name}
                      </span>
                      <ExternalLink size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed flex-1">{p.desc}</p>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
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
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Skills ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
        {/* Only 3deg here. Tilt is an angle, so the horizontal travel it produces
            grows with the element's width — this panel is the full column, and
            the 6deg used on the small project cards would swing its far corner
            far enough to read as the whole page tipping. */}
        <TiltCard tiltAmount={3} scaleAmount={1.005} speed={0.2}>
          <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={15} className="text-[var(--color-primary)]" />
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-heading)]">技能栈</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {skills.map(({ label, level }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5 text-sm md:text-base">
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
                className="flex items-center gap-1.5 text-sm md:text-base px-3 py-1 rounded-full bg-white/15 text-[var(--text-body)]"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {lang}
              </span>
            ))}
          </div>
          </div>
        </TiltCard>
      </motion.section>

    </div>
  );
}
