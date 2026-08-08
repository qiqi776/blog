import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, GitBranch, Mail, Terminal, Cpu, Database, Network, Layers,
  Star, GitFork, Clock, Activity, FileText, Boxes, Share2, ChevronRight,
} from 'lucide-react';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { posts, categories } from '../data/posts';
import { GITHUB, EMAIL, AVATAR, HANDLE, DISPLAY_NAME, projects } from '../data/profile';

// ── Derived facts ────────────────────────────────────────────
// Everything on this page comes from real post data, not placeholders.
const realCategories = categories.filter((c) => c.id !== 'all');
const categoryCount = realCategories.length;
const totalWan = Math.round(posts.reduce((s, p) => s + p.content.length, 0) / 10000);
const firstDate = posts.length
  ? posts.reduce((min, p) => (p.date < min ? p.date : min), posts[0].date)
  : '2026-01-01';

const uptimeDays = Math.max(
  1,
  Math.floor((Date.now() - new Date(firstDate).getTime()) / 86400000)
);

const TAGS = ['Kernel', 'Database', 'Distributed', 'Go'];

const SOCIALS = [
  { icon: GitBranch, href: GITHUB, label: 'GitHub' },
  { icon: Mail, href: EMAIL, label: '邮箱' },
  { icon: FileText, href: '/archive', label: '归档', internal: true },
];

// Status rows map real categories onto a system-status readout
const STATUS_ICONS = { os: Cpu, mysql: Database, DistributedSystem: Share2, go: Boxes };
const STATUS_STATE = {
  os: 'Running',
  mysql: 'Syncing',
  DistributedSystem: 'Healthy',
  go: 'Active',
};

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const postHref = (slug) => '/posts/' + slug.split('/').map(encodeURIComponent).join('/');

// ── Falling petals ───────────────────────────────────────────
// Canvas so the drift never touches the React render path.
function Petals() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (reduceMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let raf, w, h, petals = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      const count = Math.round(Math.min(38, Math.max(14, w / 42)));
      petals = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3.5 + 2,
        vy: Math.random() * 0.5 + 0.22,
        drift: Math.random() * 0.5 - 0.25,
        // phase/spin give each petal its own sway so the field never pulses in unison
        phase: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.02 + 0.005,
        alpha: Math.random() * 0.35 + 0.2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.phase += p.spin;
        p.y += p.vy;
        p.x += p.drift + Math.sin(p.phase) * 0.4;

        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // squashed ellipse, rotated — closer to a petal than a dot
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase);
        ctx.fillStyle = `rgba(249,168,212,${p.alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    seed();
    draw();

    const onResize = () => { resize(); seed(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

// ── Ambient glow ─────────────────────────────────────────────
function Glow() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div
        className="absolute rounded-full animate-gradient-drift"
        style={{
          top: '-14%', right: '-6%', width: '540px', height: '540px',
          background: 'radial-gradient(circle, rgba(244,114,182,0.26) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute rounded-full animate-gradient-drift"
        style={{
          top: '45%', left: '-8%', width: '420px', height: '420px',
          background: 'radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)',
          filter: 'blur(65px)',
          animationDelay: '-4s',
        }}
      />
    </div>
  );
}

// ── Count-up ─────────────────────────────────────────────────
function useCountUp(target, duration = 1400) {
  const [n, setN] = useState(() => (reduceMotion() ? target : 0));

  useEffect(() => {
    if (reduceMotion()) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - t, 3)))); // easeOutCubic
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return n;
}

// ── Panel shell ──────────────────────────────────────────────
// One wrapper for every dashboard card, so headers stay consistent.
function Panel({ icon: Icon, title, action, actionTo, className = '', children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`liquid-glass rounded-2xl p-5 ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text-heading)]">
            {Icon && <Icon size={15} className="text-[var(--color-primary)]" />}
            {title}
          </h2>
          {action && actionTo && (
            <Link
              to={actionTo}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-white/20 transition-all duration-200"
            >
              {action} <ArrowRight size={11} />
            </Link>
          )}
        </header>
      )}
      {children}
    </motion.section>
  );
}

// ── System status ────────────────────────────────────────────
// Rows are real categories; the "state" word is decorative, the count is not.
function SystemStatus() {
  const rows = Object.keys(STATUS_ICONS)
    .map((id) => realCategories.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="liquid-glass rounded-2xl p-5">
      <header className="flex items-center gap-2 pb-3 mb-3 border-b border-white/15">
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
        <span className="text-[11px] font-bold tracking-[0.16em] text-[var(--text-heading)] uppercase">
          System Status
        </span>
      </header>

      <div className="space-y-3">
        {rows.map(({ id, label, count }) => {
          const Icon = STATUS_ICONS[id];
          return (
            <div key={id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5 text-[var(--text-body)]">
                <Icon size={14} className="text-[var(--color-primary)]" />
                {label}
              </span>
              <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                {STATUS_STATE[id]}
                <span className="font-mono tabular-nums text-[var(--color-primary)]">
                  {count}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
        <Activity size={11} className="text-[var(--color-primary)]" />
        System Uptime:
        <span className="font-mono tabular-nums text-[var(--text-body)]">{uptimeDays} 天</span>
      </div>
    </div>
  );
}

// ── Terminal ─────────────────────────────────────────────────
// Types one line at a time, then holds. Real post titles as the payload.
function TerminalCard() {
  const lines = useMemo(() => {
    const recent = posts.slice(0, 3).map((p) => `reading ${p.title}`);
    return ['status', ...recent, '# 每天前进一点'];
  }, []);

  const [shown, setShown] = useState(() => (reduceMotion() ? lines.length : 0));

  useEffect(() => {
    if (reduceMotion()) return;
    if (shown >= lines.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), 620);
    return () => clearTimeout(id);
  }, [shown, lines.length]);

  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-4 font-mono text-[11px] leading-relaxed overflow-hidden">
      <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-white/10">
        <span className="w-2 h-2 rounded-full bg-red-400/70" />
        <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
        <span className="w-2 h-2 rounded-full bg-green-400/70" />
        <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">bash</span>
      </div>

      <div className="text-[var(--color-primary)]">
        root@{HANDLE}:~$ <span className="text-[var(--text-body)]">status</span>
      </div>

      <div className="mt-1.5 space-y-1">
        {lines.slice(1, shown + 1).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={l.startsWith('#') ? 'text-[var(--text-muted)]' : 'text-[var(--text-body)]'}
          >
            {l.startsWith('#') ? l : <><span className="text-[var(--color-primary)]">&gt;</span> {l}</>}
          </motion.div>
        ))}
      </div>

      <div className="mt-2 text-[var(--color-primary)]">
        root@{HANDLE}:~$
        <span className="inline-block w-1.5 h-3 ml-1 align-middle bg-[var(--color-primary)] animate-pulse" />
      </div>
    </div>
  );
}

// ── Knowledge map ────────────────────────────────────────────
// Real categories grouped into branches, sized by post count.
const BRANCHES = [
  { title: '系统底层', ids: ['os', 'network'], icon: Cpu },
  { title: '数据存储', ids: ['mysql', 'cmu15445', 'ddia'], icon: Database },
  { title: '分布式', ids: ['DistributedSystem', 'SystemDesign', 'middleware'], icon: Share2 },
  { title: '工程实践', ids: ['go', 'projects', 'webfront'], icon: Boxes },
];

function KnowledgeMap() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {BRANCHES.map(({ title, ids, icon: Icon }) => {
        const cats = ids.map((id) => realCategories.find((c) => c.id === id)).filter(Boolean);
        const total = cats.reduce((s, c) => s + c.count, 0);

        return (
          <div key={title} className="rounded-xl bg-white/[0.07] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Icon size={13} className="text-[var(--color-primary)]" />
              <span className="text-xs font-bold text-[var(--text-heading)]">{title}</span>
              <span className="ml-auto font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
                {total}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <Link
                  key={c.id}
                  to={`/posts?cat=${encodeURIComponent(c.id)}`}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-[var(--text-muted)] hover:bg-[var(--color-primary)]/25 hover:text-[var(--text-body)] transition-all duration-200"
                >
                  {c.label}
                  <span className="ml-1 font-mono tabular-nums opacity-60">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Featured projects ────────────────────────────────────────
function ProjectRow({ p }) {
  return (
    <a
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block group rounded-xl bg-white/[0.07] border border-white/10 p-3.5 hover:border-[var(--color-primary)]/40 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Layers size={14} className="text-[var(--color-primary)]" />
        <span className="text-sm font-bold text-[var(--text-heading)]">{p.name}</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-0.5"><Star size={10} /> {p.stars}</span>
          <span className="flex items-center gap-0.5"><GitFork size={10} /> {p.forks}</span>
        </span>
      </div>

      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2.5 line-clamp-2">
        {p.desc}
      </p>

      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: p.langColor }}
        />
        <span className="text-[10px] text-[var(--text-muted)]">{p.lang}</span>
        <ChevronRight
          size={12}
          className="ml-auto text-[var(--color-primary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
        />
      </div>
    </a>
  );
}

// ── Recent logs ──────────────────────────────────────────────
// Real posts. The reference had commit diff stats; read time is what we have.
function RecentLogs() {
  return (
    <div className="space-y-0.5">
      {posts.slice(0, 6).map((p) => (
        <Link
          key={p.slug}
          to={postHref(p.slug)}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200 group"
        >
          <span className="font-mono text-[10px] tabular-nums text-[var(--text-muted)] shrink-0">
            {p.date}
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--color-primary)]/60 shrink-0" />
          <span className="flex-1 min-w-0 truncate text-xs text-[var(--text-body)] group-hover:text-[var(--text-heading)] transition-colors">
            {p.title}
          </span>
          <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full ${p.categoryColor}`}>
            {p.categoryLabel}
          </span>
          <span className="shrink-0 flex items-center gap-0.5 font-mono text-[10px] text-[var(--text-muted)] w-14 justify-end">
            <Clock size={9} /> {p.readTime}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Profile card ─────────────────────────────────────────────
function ProfileCard() {
  const [failed, setFailed] = useState(false);
  const nPosts = useCountUp(posts.length);
  const nCats = useCountUp(categoryCount);
  const nWan = useCountUp(totalWan);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3.5 mb-4">
        {failed ? (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-lg font-black text-white ring-2 ring-[var(--color-primary)]/40 shrink-0">
            追
          </div>
        ) : (
          <img
            src={AVATAR}
            alt=""
            width={56}
            height={56}
            onError={() => setFailed(true)}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-[var(--color-primary)]/40 shrink-0"
          />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[var(--text-heading)]">{DISPLAY_NAME}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-primary)]/25 text-[var(--color-primary)]">
              BACKEND
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)]">@{HANDLE}</div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed rounded-xl bg-white/[0.07] border border-white/10 p-3 mb-4">
        关注 Go 语言底层、分布式系统与数据库内核。喜欢从零把东西写一遍，
        再把每个细节想清楚。
      </p>

      <div className="grid grid-cols-3 gap-2 mt-auto text-center">
        {[
          { n: nPosts, suffix: '', label: 'Articles' },
          { n: nCats, suffix: '', label: 'Topics' },
          { n: nWan, suffix: '万', label: 'Words' },
        ].map(({ n, suffix, label }) => (
          <div key={label}>
            <div className="text-xl font-black text-[var(--color-primary)] tabular-nums leading-none">
              {n}
              {suffix && <span className="text-xs ml-0.5">{suffix}</span>}
            </div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] mt-1.5">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function Home() {
  const [tag, setTag] = useState(0);

  useEffect(() => {
    if (reduceMotion()) return;
    const id = setInterval(() => setTag((i) => (i + 1) % TAGS.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Glow />
      <Petals />

      {/* Fixed social rail — wide screens only, sits in the left gutter */}
      <div className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-4">
        {SOCIALS.map(({ icon: Icon, href, label, internal }) =>
          internal ? (
            <Link
              key={label}
              to={href}
              aria-label={label}
              title={label}
              className="text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:scale-110 transition-all duration-200"
            >
              <Icon size={16} />
            </Link>
          ) : (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:scale-110 transition-all duration-200"
            >
              <Icon size={16} />
            </a>
          )
        )}
        <span className="w-px h-16 bg-gradient-to-b from-[var(--color-primary)]/50 to-transparent" />
      </div>

      <div className="relative z-10 page-shell pt-28 pb-10 space-y-5">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-center mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-3">
              <span className="text-[var(--text-heading)]">Hi, I'm </span>
              <span className="gradient-text gradient-text-animate">{HANDLE}</span>
              <span className="text-[var(--color-primary)]">.</span>
            </h1>

            <p className="text-base text-[var(--text-body)] mb-1">后端开发 · 系统方向学习者</p>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              把系统从零写一遍，再把每个细节想清楚。
            </p>

            {/* Tech tags — the active one cycles */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TAGS.map((t, i) => (
                <span
                  key={t}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-500 ${
                    i === tag
                      ? 'bg-[var(--color-primary)]/25 border-[var(--color-primary)]/50 text-[var(--text-heading)]'
                      : 'bg-white/[0.07] border-white/10 text-[var(--text-muted)]'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Quote */}
            <div className="rounded-xl bg-white/[0.07] border-l-2 border-[var(--color-primary)]/60 px-4 py-3">
              <p className="text-xs text-[var(--text-body)] leading-relaxed">
                「技术不是魔法，是一层层堆起来的常识。」
              </p>
              <p className="text-[10px] text-[var(--text-muted)] text-right mt-1.5">— {HANDLE}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <SystemStatus />
          </motion.div>
        </div>

        {/* ── Profile + terminal | Knowledge map ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel className="!p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileCard />
              <TerminalCard />
            </div>
          </Panel>

          <Panel icon={Network} title="Knowledge Map" action="Explore All" actionTo="/posts" delay={0.06}>
            <KnowledgeMap />
          </Panel>
        </div>

        {/* ── Projects | Recent logs ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel icon={Boxes} title="Featured Projects" action="View All" actionTo="/about">
            <div className="space-y-2.5">
              {projects.slice(0, 3).map((p) => (
                <ProjectRow key={p.name} p={p} />
              ))}
            </div>
          </Panel>

          <Panel icon={Terminal} title="Recent Logs" action="View All" actionTo="/archive" delay={0.06}>
            <RecentLogs />
          </Panel>
        </div>

        {/* ── Entry points ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <Link to="/posts">
            <button className="btn-primary group flex items-center gap-2 text-sm font-semibold !px-6 !py-3 !rounded-full">
              <FileText size={15} />
              开始阅读
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </Link>

          <Link to="/about">
            <button className="group flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[var(--text-body)] border border-white/25 hover:border-[var(--color-primary)]/50 hover:bg-white/10 transition-all duration-200">
              <GitBranch size={15} />
              关于我
              <ArrowRight size={14} className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
            </button>
          </Link>
        </motion.div>

      </div>
    </>
  );
}
