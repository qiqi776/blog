import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import { ArrowLeft, ArrowRight, Calendar, Clock, AlignLeft } from 'lucide-react';
import PostCard from '../components/blog/PostCard';
import { getPostBySlug, posts } from '../data/posts';
import { withBasePath } from '../lib/paths';
import { renderCodeBlock } from '../lib/highlight';

marked.setOptions({ gfm: true, breaks: false });
marked.use({ renderer: { code: renderCodeBlock } });

// heading text → URL-safe id (preserves CJK)
const slugify = (text) =>
  text.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-鿿-]/g, '')
    .replace(/-+/g, '-');

// Post-process HTML: inject id attrs into h2/h3
const addIds = (html) =>
  html.replace(/<h([23])(?: [^>]*)?>([^]*?)<\/h\1>/gi, (_, lvl, inner) => {
    const id = slugify(inner.replace(/<[^>]+>/g, ''));
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });

// Strip the first heading line if it's the opening line of the content
// (avoids duplicating the title already shown in the header)
const stripLeadingHeading = (content) => {
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length && /^#{1,6}\s/.test(lines[i])) lines.splice(i, 1);
  return lines.join('\n');
};

const addBasePathToRootRelativeAttrs = (html) =>
  html.replace(/\b(src|href)=(["'])(\/(?!\/)[^"']*)\2/g, (_, attr, quote, path) => {
    return `${attr}=${quote}${withBasePath(path)}${quote}`;
  });

async function copyCode(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

// Extract headings from raw markdown for TOC
const parseToc = (content) => {
  const list = [];
  for (const line of content.split('\n')) {
    const m2 = line.match(/^## (.+)/);
    const m3 = line.match(/^### (.+)/);
    if (m2) list.push({ level: 2, text: m2[1].trim(), id: slugify(m2[1].trim()) });
    else if (m3) list.push({ level: 3, text: m3[1].trim(), id: slugify(m3[1].trim()) });
  }
  return list;
};

// ── Main page ────────────────────────────────────────────────
export default function PostDetail() {
  const params = useParams();
  const slug = params['*'] ?? '';
  const navigate = useNavigate();
  const post = getPostBySlug(decodeURIComponent(slug));
  const [html, setHtml] = useState('');
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!post) return;
    setHtml(addBasePathToRootRelativeAttrs(addIds(marked.parse(stripLeadingHeading(post.content)))));
    setToc(parseToc(post.content));
    // Scroll reset is handled by Layout's <ScrollReset /> on route change
  }, [post?.slug]);

  // Highlight active heading via IntersectionObserver
  useEffect(() => {
    if (!html) return;
    const els = document.querySelectorAll('.prose-content h2, .prose-content h3');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [html]);

  useEffect(() => {
    if (!html) return;
    const root = document.querySelector('.prose-content');
    if (!root) return;

    const onClick = async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('.code-block__copy');
      if (!button || !root.contains(button)) return;

      const code = button.closest('.code-block')?.querySelector('.code-block__code')?.textContent?.replace(/\n$/, '');
      if (!code) return;

      try {
        await copyCode(code);
        button.textContent = '已复制';
        window.setTimeout(() => {
          button.textContent = '复制';
        }, 1400);
      } catch {
        button.textContent = '复制失败';
        window.setTimeout(() => {
          button.textContent = '复制';
        }, 1400);
      }
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [html]);

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 text-[var(--text-muted)]">
        <div className="text-5xl">404</div>
        <p className="text-base md:text-lg">文章不存在</p>
        <button onClick={() => navigate('/posts')} className="glass-button text-base md:text-lg">返回列表</button>
      </div>
    );
  }

  // Prev / next within same category, sorted by order then date
  const siblings = posts
    .filter((p) => p.category === post.category)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.date.localeCompare(b.date));
  const curIdx   = siblings.findIndex((p) => p.slug === post.slug);
  const prevPost = curIdx > 0 ? siblings[curIdx - 1] : null;
  const nextPost = curIdx < siblings.length - 1 ? siblings[curIdx + 1] : null;

  return (
    <div className="page-shell pt-28 pb-10">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <Link to="/posts" className="inline-flex items-center gap-1.5 text-base md:text-lg text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors">
            <ArrowLeft size={14} /> 返回列表
          </Link>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex gap-7 items-start">

          {/* ── Article ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="flex-1 min-w-0"
          >
            {/* Unified glass card: header + body */}
            <div className="liquid-glass rounded-2xl overflow-hidden mb-10">
              {/* Header */}
              <div className="px-7 sm:px-10 pt-7 pb-5 border-b border-white/15">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-sm md:text-base font-medium px-2.5 py-1 rounded-full ${post.categoryColor}`}>
                    {post.categoryLabel}
                  </span>
                  <span className="text-sm md:text-base text-[var(--text-muted)] flex items-center gap-1">
                    <Clock size={11} /> {post.readTime}
                  </span>
                  <span className="text-sm md:text-base text-[var(--text-muted)] flex items-center gap-1">
                    <Calendar size={11} /> {post.date}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-heading)] leading-tight">
                  {post.title}
                </h1>
              </div>

              {/* Body */}
              <div
                className="px-7 sm:px-10 pt-6 pb-8 prose-content"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>

            {/* Prev / Next */}
            {(prevPost || nextPost) && (
              <motion.nav
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                aria-label="章节导航"
              >
                {/* prev */}
                {prevPost ? (
                  <Link
                    to={'/posts/' + prevPost.slug.split('/').map(encodeURIComponent).join('/')}
                    className="group liquid-glass rounded-2xl px-5 py-4 flex items-center gap-3 hover:border-white/30 transition-all duration-200"
                  >
                    <ArrowLeft size={16} className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--text-muted)] mb-0.5 uppercase tracking-wide">上一篇</div>
                      <div className="text-base md:text-lg font-semibold text-[var(--text-heading)] truncate group-hover:gradient-text transition-all">
                        {prevPost.title}
                      </div>
                    </div>
                  </Link>
                ) : <div />}

                {/* next */}
                {nextPost ? (
                  <Link
                    to={'/posts/' + nextPost.slug.split('/').map(encodeURIComponent).join('/')}
                    className="group liquid-glass rounded-2xl px-5 py-4 flex items-center gap-3 text-right hover:border-white/30 transition-all duration-200 justify-end"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--text-muted)] mb-0.5 uppercase tracking-wide">下一篇</div>
                      <div className="text-base md:text-lg font-semibold text-[var(--text-heading)] truncate group-hover:gradient-text transition-all">
                        {nextPost.title}
                      </div>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                  </Link>
                ) : <div />}
              </motion.nav>
            )}
          </motion.div>

          {/* ── TOC sidebar: sticky to viewport, internal scroll when tall ── */}
          <motion.aside
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
            className="hidden lg:block w-60 shrink-0 sticky top-24 self-start"
          >
            <TableOfContents headings={toc} activeId={activeId} />
          </motion.aside>

      </div>
    </div>
  );
}

// ── TOC sidebar ──────────────────────────────────────────────
function TableOfContents({ headings, activeId }) {
  if (!headings.length) return null;
  return (
    <div className="liquid-glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/15">
        <AlignLeft size={12} className="text-[var(--color-primary)]" />
        <span className="text-sm md:text-base font-semibold text-[var(--text-heading)] tracking-wide uppercase">目录</span>
      </div>
      <nav className="space-y-0.5 max-h-[calc(100vh-11rem)] overflow-y-auto scrollbar-hide">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-start gap-1.5 py-1 leading-snug text-sm transition-all duration-150 rounded-lg px-1.5 ${
                h.level === 3 ? 'pl-4' : ''
              } ${
                active
                  ? 'text-[var(--color-primary)] font-semibold bg-pink-100/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-white/10'
              }`}
            >
              {active && (
                <span className="mt-[5px] shrink-0 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
              )}
              <span>{h.text}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
