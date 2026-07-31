import { useRef, useLayoutEffect, useCallback, useState } from 'react';

export default function PillTabBar({ tabs = [], activeTab, onChange, className = '' }) {
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const activeTabEl = tabRefs.current[activeTab];
    if (activeTabEl) {
      const tabRect = activeTabEl.getBoundingClientRect();
      setIndicator({
        top: tabRect.top - containerRect.top,
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
        height: tabRect.height,
        opacity: 1,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => { updateIndicator(); }, [updateIndicator]);

  return (
    <div className={`flex flex-row rounded-full overflow-hidden border border-white/20 p-0.5 liquid-glass relative ${className}`}>
      <div ref={containerRef} className="relative flex flex-row rounded-full w-full">
        {/* sliding indicator */}
        <div
          className="absolute rounded-full bg-gradient-to-r from-pink-200/80 to-pink-200/40 border border-pink-300/50 shadow-[rgba(244,114,182,0.3)_0px_0px_20px,rgba(255,255,255,0.6)_0px_1px_0px_inset] transition-all duration-300 ease-out z-0 pointer-events-none"
          style={{ top: indicator.top, left: indicator.left, width: indicator.width, height: indicator.height, opacity: indicator.opacity }}
        />
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { if (el) tabRefs.current[tab.id] = el; }}
              onClick={() => onChange?.(tab.id)}
              className={`group flex-1 flex flex-row items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors relative overflow-hidden z-10 ${
                isActive ? 'text-[#be185d]' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
              }`}
            >
              <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-pink-500/30 text-pink-700' : 'bg-white/30 text-[var(--text-muted)]'
                }`}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
