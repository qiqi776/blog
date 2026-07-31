import { createContext, useContext, useState, useEffect } from 'react';
import { backgroundSchemes, defaultScheme, getSchemeById } from '../config/backgroundSchemes';

const BackgroundContext = createContext(null);

const LS_KEY = 'blog_background';

export function BackgroundProvider({ children }) {
  const [currentScheme, setCurrentScheme] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const { schemeId } = JSON.parse(saved);
        if (backgroundSchemes[schemeId]) return { scheme: getSchemeById(schemeId) };
      }
    } catch {}
    return { scheme: getSchemeById(defaultScheme) };
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ schemeId: currentScheme.scheme.id }));
  }, [currentScheme]);

  const changeScheme = (schemeId) => {
    if (backgroundSchemes[schemeId]) {
      setCurrentScheme({ scheme: getSchemeById(schemeId) });
    }
  };

  const getBackgroundStyle = () => ({ background: currentScheme.scheme.background });

  const getCssVariables = () => {
    const scheme = currentScheme.scheme;
    const tc = scheme.textColors || {};
    return {
      '--bg-primary': scheme.background,
      '--color-primary': scheme.primaryColor,
      '--color-secondary': scheme.secondaryColor,
      '--color-accent': scheme.accentColor,
      '--color-neutral-50': scheme.neutralColors?.[50] || '#faf5ff',
      '--color-neutral-100': scheme.neutralColors?.[100] || '#f3e8ff',
      '--color-neutral-200': scheme.neutralColors?.[200] || '#e9d5ff',
      '--color-neutral-300': scheme.neutralColors?.[300] || '#d8b4fe',
      '--color-neutral-400': scheme.neutralColors?.[400] || '#c084fc',
      '--color-neutral-500': scheme.neutralColors?.[500] || '#a855f7',
      '--color-neutral-600': scheme.neutralColors?.[600] || '#9333ea',
      '--color-neutral-700': scheme.neutralColors?.[700] || '#7e22ce',
      '--color-neutral-800': scheme.neutralColors?.[800] || '#6b21a8',
      '--color-neutral-900': scheme.neutralColors?.[900] || '#581c87',
      '--text-heading': tc.heading || '#1e1b4b',
      '--text-body': tc.body || '#312e81',
      '--text-secondary': tc.secondary || '#6366f1',
      '--text-muted': tc.muted || '#818cf8',
      '--text-glass-heading': tc.glassHeading || '#1e1b4b',
      '--text-glass-body': tc.glassBody || '#312e81',
      '--text-glass-muted': tc.glassMuted || '#6366f1',
      '--is-dark': scheme.isDark ? 'true' : 'false',
    };
  };

  return (
    <BackgroundContext.Provider value={{
      currentScheme,
      changeScheme,
      getBackgroundStyle,
      getCssVariables,
      schemes: Object.values(backgroundSchemes),
    }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) throw new Error('useBackground must be used within a BackgroundProvider');
  return context;
}
