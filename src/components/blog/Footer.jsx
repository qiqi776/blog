export default function Footer() {
  return (
    // The extra bottom padding is the mini player's reserved strip: it is a
    // fixed box in the bottom-right, so at the end of the page it would sit on
    // top of the copyright line. The variable only exists while that player is
    // mounted, hence the 0px fallback.
    <footer className="mt-16 pb-[calc(2rem+var(--mini-player-reserve,0px))]">
      <div className="page-shell">
        <div className="text-center text-base md:text-lg text-[var(--text-muted)] py-4 border-t border-white/15">
          Built with VitePress. Copyright © 2026 追忆成空
        </div>
      </div>
    </footer>
  );
}
