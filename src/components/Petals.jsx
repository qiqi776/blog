import { useEffect, useRef } from 'react';

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ── Falling petals ───────────────────────────────────────────
// Canvas so the drift never touches the React render path.
//
// Lifted out of Home and rendered from Layout, so every page gets the effect.
// Two consequences of that move:
//
//   1. zIndex is -5, not the `z-0` it used on Home. Home could get away with 0
//      because its own content wrapper carries `relative z-10`; no other page
//      does, so 0 would paint the canvas over their text. -5 sits above
//      SchemeBackdrop (-10) and below every page's normal-flow content, which
//      needs no per-page opt-in.
//
//   2. It mounts outside AnimatePresence in Layout, so navigating doesn't
//      remount the canvas — the field keeps drifting across route changes
//      instead of re-seeding from scratch on every click.
export default function Petals() {
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
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -5 }}
    />
  );
}
