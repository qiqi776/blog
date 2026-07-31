export const backgroundSchemes = {
  aurora: {
    id: 'aurora',
    name: '极光粉紫',
    description: '冰岛极光的粉紫色渐变',
    background: 'linear-gradient(135deg, #FFF0F5 0%, #FFE4E1 40%, #E6E6FA 100%)',
    isDark: false,
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentColor: '#f472b6',
    neutralColors: {
      50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
      400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
      800: '#6b21a8', 900: '#581c87',
    },
    textColors: {
      heading: '#1e1b4b', body: '#312e81', secondary: '#6366f1', muted: '#818cf8',
      glassHeading: '#1e1b4b', glassBody: '#312e81', glassMuted: '#6366f1',
    },
    gradientOverlay: [
      { top: '-10%', right: '-10%', width: '500px', height: '500px', color: '#ff6b9d', opacity: '0.3' },
      { bottom: '-5%', left: '20%', width: '400px', height: '400px', color: '#7b61ff', opacity: '0.25' },
      { top: '40%', right: '30%', width: '300px', height: '300px', color: '#ffb86b', opacity: '0.2' },
    ],
  },
  midnight: {
    id: 'midnight',
    name: '午夜深蓝',
    description: '神秘深邃的午夜深蓝色调',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
    isDark: true,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#a78bfa',
    neutralColors: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
      800: '#1e293b', 900: '#0f172a',
    },
    textColors: {
      heading: '#f8fafc', body: '#e2e8f0', secondary: '#cbd5e1', muted: '#718096',
      glassHeading: '#f8fafc', glassBody: '#e2e8f0', glassMuted: '#cbd5e1',
    },
    gradientOverlay: [
      { top: '-10%', right: '-10%', width: '500px', height: '500px', color: '#6366f1', opacity: '0.2' },
      { bottom: '-5%', left: '20%', width: '400px', height: '400px', color: '#8b5cf6', opacity: '0.15' },
      { top: '40%', right: '30%', width: '300px', height: '300px', color: '#a855f7', opacity: '0.1' },
    ],
  },
  spring: {
    id: 'spring',
    name: '春日暖阳',
    description: '清新春日绿意渐变',
    background: 'linear-gradient(210deg, #f5eb97 0%, #d0ebb5 50%, #abead3 100%)',
    isDark: false,
    primaryColor: '#84cc16',
    secondaryColor: '#10b981',
    accentColor: '#a3e635',
    neutralColors: {
      50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
      400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
      800: '#854d0e', 900: '#713f12',
    },
    textColors: {
      heading: '#166534', body: '#15803d', secondary: '#22c55e', muted: '#4ade80',
      glassHeading: '#166534', glassBody: '#15803d', glassMuted: '#22c55e',
    },
    gradientOverlay: [
      { top: '-10%', right: '-10%', width: '500px', height: '500px', color: '#f5eb97', opacity: '0.3' },
      { bottom: '-5%', left: '20%', width: '400px', height: '400px', color: '#d0ebb5', opacity: '0.25' },
      { top: '40%', right: '30%', width: '300px', height: '300px', color: '#abead3', opacity: '0.2' },
    ],
  },
};

export const defaultScheme = 'aurora';
export const getSchemeById = (id) => backgroundSchemes[id] || backgroundSchemes[defaultScheme];
