import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, Search } from 'lucide-react';
import { useBackground } from '../../context/BackgroundContext';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/posts', label: '文章' },
  { to: '/archive', label: '归档' },
  { to: '/about', label: '关于' },
];

const schemeLabels = { sakura: '樱夜', aurora: '极光', midnight: '深夜', spring: '春日' };

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { schemes, currentScheme, changeScheme } = useBackground();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 liquid-glass !rounded-none !border-x-0 !border-t-0 border-b-white/25 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_16px_rgba(31,38,135,0.14)]' : '!shadow-none'
        }`}
      >
        <div className="page-shell">
          <div className="h-[72px] flex items-center justify-between relative">
            {/* Logo — left */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0 relative z-10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <Sparkles size={17} className="text-white" />
              </div>
              <span className="font-bold text-base tracking-wide gradient-text">追忆成空</span>
            </Link>

            {/* Nav — absolutely centered, so side widths never shift it */}
            <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
              {navLinks.map(({ to, label }) => {
                const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative px-5 py-2 rounded-full text-[15px] font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-pink-700'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-200/75 to-purple-200/60 shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Search + theme — right */}
            <div className="flex items-center gap-2 shrink-0 relative z-10">
              <div className="hidden md:block">
                <SearchBox />
              </div>

              <div className="hidden md:flex items-center gap-1">
                {schemes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeScheme(s.id)}
                    title={s.name}
                    aria-label={`切换主题：${s.name}`}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                      currentScheme.scheme.id === s.id
                        ? 'border-white scale-110 shadow-md'
                        : 'border-white/40 hover:scale-105'
                    }`}
                    style={{ background: s.primaryColor }}
                  />
                ))}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden glass-button !p-2 !rounded-full"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[72px] left-0 right-0 z-40 px-4 md:hidden"
          >
            <div className="liquid-glass rounded-2xl p-4 space-y-1">
              {/* Search */}
              <div className="pb-3 mb-1 border-b border-white/20">
                <SearchBox mobile onSubmitted={() => setMenuOpen(false)} />
              </div>

              {navLinks.map(({ to, label }) => {
                const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-pink-200/60 text-pink-700'
                        : 'text-[var(--text-muted)] hover:bg-white/20 hover:text-[var(--text-body)]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              {/* Theme buttons */}
              <div className="flex items-center gap-3 px-4 pt-2 border-t border-white/20">
                <span className="text-xs text-[var(--text-muted)]">主题</span>
                {schemes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeScheme(s.id)}
                    title={s.name}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all ${
                      currentScheme.scheme.id === s.id
                        ? 'bg-white/30 text-[var(--text-body)] font-medium'
                        : 'text-[var(--text-muted)] hover:bg-white/20'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: s.primaryColor }}
                    />
                    {schemeLabels[s.id] || s.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Global search ────────────────────────────────────────────
// URL (`/posts?q=…`) is the source of truth, so results are shareable
// and the back button works. Typing filters live on the list page;
// from any other page, Enter navigates there.
function SearchBox({ mobile = false, onSubmitted }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const onPostsPage = location.pathname === '/posts';
  const [value, setValue] = useState(urlQuery);

  // Re-sync when the URL changes from outside (back button, category click)
  useEffect(() => { setValue(urlQuery); }, [urlQuery]);

  const push = (q, replace) => {
    const trimmed = q.trim();
    navigate(trimmed ? `/posts?q=${encodeURIComponent(trimmed)}` : '/posts', { replace });
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (onPostsPage) push(v, true); // replace: don't stack a history entry per keystroke
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    push(value, false);
    onSubmitted?.();
  };

  const clear = () => {
    setValue('');
    if (onPostsPage) push('', true);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${mobile ? 'w-full' : ''}`}>
      <Search
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="搜索文章…"
        aria-label="搜索文章"
        className={`${mobile ? 'w-full py-2.5' : 'w-36 focus:w-48 py-2'} text-sm pl-9 ${
          value ? 'pr-8' : 'pr-3'
        } rounded-full bg-white/20 border border-white/25 focus:outline-none focus:ring-2 focus:ring-pink-300/40 text-[var(--text-body)] placeholder:text-[var(--text-muted)] transition-all duration-300`}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="清除搜索"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </form>
  );
}
