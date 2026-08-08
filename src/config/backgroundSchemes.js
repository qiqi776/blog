// Two photo backdrops, both generated ahead of time from sources in
// `assets-src/` (outside public/, so the multi-MB originals never ship).
// Pre-blurring here instead of a CSS `filter: blur()` keeps the paint cost at
// zero. Regenerate / retune with:
//
//   # midnight — cool blue river shot, already fog-soft
//   convert assets-src/bg.jpg -blur 0x2 -strip -quality 68 public/bg-blur.jpg
//
//   # sakura — pink cherry-blossom room, 2.9 MB PNG -> 93 KB
//   convert assets-src/image.png -blur 0x2.5 -strip -quality 68 public/bg-sakura.jpg
//
// Both ship at their source's native size (1920x1080 and 1536x1024) and are
// deliberately NOT downscaled. Shipping 1280-wide was itself a blur bug:
// `background-size: cover` then upscales 1.5x on a 1080p viewport and 2x at
// 1440p, so a nominal sigma 2.5 arrives on screen as an effective 4-5.
//
// Sigmas stay per image, not shared. Measured on 16px glyph-sized patches,
// sigma barely moves contrast at all (2 -> 5 shifts worst-case body by 0.3),
// so it is chosen purely on how the photo reads: below ~2 the monitor and bean
// bag pull focus from body text, past ~5 the blossoms dissolve into flat colour
// and the photo stops being worth the bytes.
export const backgroundSchemes = {
  sakura: {
    id: 'sakura',
    name: '夜樱',
    description: '深夜樱色，粉调暗紫',
    background: 'linear-gradient(155deg, #2a1b28 0%, #3d2839 45%, #241a26 100%)',
    // Photo backdrop. `background` above stays as the fallback paint, so first
    // frame and the light schemes look exactly as before.
    // `imageOverlay` is the legibility layer, and its alpha ramp follows the
    // photo's own brightness: this shot peaks in the middle band (the sunset sky
    // and lit skyline) rather than at the top, so the heaviest tint sits at 40%
    // where body text lands. Tint is this scheme's own plum, which keeps the
    // blossoms pink instead of greying them out.
    //
    // Alpha used to be 0.87-0.91 over a full-strength plum, tuned so composite
    // contrast matched the flat `background` gradient exactly. That hit its
    // target and that was the bug: matching a flat gradient means looking like
    // one. It left the photo contributing ~2.5 luminance points out of 100 —
    // effectively invisible, which reads as "blurry" no matter how sharp the
    // JPEG underneath is. Now 0.78-0.82 over a tint darkened to 62%, so mean
    // brightness holds roughly level while the photo's own modulation doubles
    // (L-span 2.5 -> 4.2, local detail 0.02 -> 0.05).
    //
    // Worst-case contrast, measured on the brightest glyph-sized patch per row
    // of the actual JPEG under this exact gradient: heading 9.3:1, body 8.2:1,
    // muted 4.5:1 full-width, and 4.9:1 inside the max-w-6xl text column. Lower
    // than the old figures precisely because the photo is now visible; all three
    // still clear AA. Getting muted to 4.5 is why it moved off #b08ba3 below.
    backgroundImage: '/bg-sakura.jpg',
    imageOverlay:
      'linear-gradient(to bottom, rgba(22,15,22,0.78) 0%, rgba(26,17,25,0.80) 20%, rgba(26,17,25,0.82) 40%, rgba(26,17,25,0.81) 62%, rgba(19,12,19,0.78) 79%, rgba(19,12,19,0.80) 100%)',
    isDark: true,
    primaryColor: '#f472b6',
    secondaryColor: '#c084fc',
    accentColor: '#fbcfe8',
    neutralColors: {
      50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
      400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
      800: '#9d174d', 900: '#500724',
    },
    textColors: {
      // muted was #b08ba3, which measured 4.3:1 on the old backdrop and 3.7:1
      // on this brighter one — under AA 4.5 either way, and it is only ever
      // applied at text-xs/text-sm sizes (pagination, Footer, post meta) so no
      // large-text exemption applies. #c79ab5 measures 4.5:1 full-width. It is
      // already this scheme's glassMuted, so the palette gains no new colour;
      // the two tokens simply coincide now.
      heading: '#fce7f3', body: '#f0d9e7', secondary: '#e9a8c9', muted: '#c79ab5',
      glassHeading: '#fce7f3', glassBody: '#f0d9e7', glassMuted: '#c79ab5',
    },
    gradientOverlay: [
      { top: '-10%', right: '-10%', width: '500px', height: '500px', color: '#f472b6', opacity: '0.22' },
      { bottom: '-5%', left: '20%', width: '400px', height: '400px', color: '#c084fc', opacity: '0.18' },
      { top: '40%', right: '30%', width: '300px', height: '300px', color: '#ec4899', opacity: '0.12' },
    ],
  },
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
    // Keeps the cool-blue river shot (no longer shared with `sakura`). Tinting
    // the sakura photo navy renders fine, but it desaturates the blossoms to
    // grey-blue — the one thing that photo has going for it. This shot is
    // already cool blue, so it needs less correction to sit inside this palette
    // and the two dark schemes stay visually distinct.
    //
    // Now shipped at its native 1920x1080 (it was downscaled to 1280, which
    // `cover` then upscaled straight back). Overlay deliberately left alone:
    // this ramp is already lighter than sakura's old one, and lightening it
    // further measured muted at 3.0:1 — worse than the 3.2:1 it already fails
    // AA at. See the note on textColors below.
    backgroundImage: '/bg-blur.jpg',
    imageOverlay:
      'linear-gradient(to bottom, rgba(15,23,42,0.90) 0%, rgba(15,23,42,0.79) 28%, rgba(30,41,59,0.80) 60%, rgba(15,23,42,0.86) 100%)',
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
      // Pre-existing, not introduced by the blur retune: muted #718096 measures
      // 3.2:1 against this backdrop, under AA 4.5. Left as-is because choosing
      // a replacement is a palette decision for this scheme on its own terms.
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

export const defaultScheme = 'sakura';
export const getSchemeById = (id) => backgroundSchemes[id] || backgroundSchemes[defaultScheme];
