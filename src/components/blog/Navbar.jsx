import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { useBackground } from '../../context/BackgroundContext';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/posts', label: '文章' },
  { to: '/archive', label: '归档' },
  { to: '/about', label: '关于' },
];

const schemeLabels = { aurora: '极光', midnight: '深夜', spring: '春日' };

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-4'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="liquid-glass rounded-2xl px-5 py-3 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide gradient-text">My Blog</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ to, label }) => {
                const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-pink-200/60 text-pink-700 shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Theme switcher + mobile toggle */}
            <div className="flex items-center gap-2">
              {/* Theme */}
              <div className="hidden sm:flex items-center gap-1">
                {schemes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeScheme(s.id)}
                    title={s.name}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
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
                className="sm:hidden glass-button !p-2 !rounded-xl"
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
            className="fixed top-[72px] left-0 right-0 z-40 px-4 sm:hidden"
          >
            <div className="liquid-glass rounded-2xl p-4 space-y-1">
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
