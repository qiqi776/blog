import { useBackground } from '../context/BackgroundContext';

// Full-viewport photo backdrop, for schemes that declare one. The light schemes
// don't, so they render nothing here and keep their flat gradient.
//
// Two stacked layers instead of one multi-background declaration: the overlay
// needs its own compositing pass over the photo, and keeping them separate makes
// the alpha ramp readable next to the scheme config it comes from.
//
// z-index -10 puts this behind every page's own decoration (Home's Glow and
// Petals both sit at z-0). That's safe because neither #root nor Layout's
// wrapper paints a background: the nearest thing behind is the body gradient,
// which is exactly the fallback wanted while the JPEG is still loading.
//
// `position: fixed` rather than `background-attachment: fixed` — the latter is
// ignored or janky on iOS Safari, and forces a repaint per scroll frame.
export default function SchemeBackdrop() {
  const { currentScheme } = useBackground();
  const { backgroundImage, imageOverlay } = currentScheme.scheme;

  if (!backgroundImage) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0" style={{ background: imageOverlay }} />
    </div>
  );
}
