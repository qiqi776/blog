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
};

export const defaultScheme = 'sakura';
export const getSchemeById = (id) => backgroundSchemes[id] || backgroundSchemes[defaultScheme];
