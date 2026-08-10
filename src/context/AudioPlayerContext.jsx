import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { tracks } from "../data/personal";

// ── 全局播放状态 ─────────────────────────────────────────────
// 唯一的 <audio> 元素挂在这里，而不是任何一个页面组件里。原因很直接：
// 路由切换会卸载页面组件，DOM 里的 <audio> 跟着消失，播放也就断了。
// Provider 位于 <Routes> 之上，从不重新挂载，所以首页开始播的音频能
// 一路跟着用户走到文章页、归档页。
//
// 首页的完整播放器和其他页面右下角的迷你播放器都是这个 state 的视图，
// 两者共享同一个 currentTime —— 不存在"两个播放器各播一份"的情况。
const AudioPlayerContext = createContext(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer 必须在 AudioPlayerProvider 内部使用");
  }
  return ctx;
}

export function AudioPlayerProvider({ children }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [at, setAt] = useState(0);
  const [len, setLen] = useState(0);
  const ref = useRef(null);

  const hasTracks = tracks.length > 0;
  const current = tracks[idx] ?? { title: "—", artist: "—", src: "" };
  const playable = Boolean(current.src);

  // 曲目在播放中被切换 —— 把播放状态带到新的音源上。
  // 不会撞上浏览器的自动播放策略：`playing` 只能由点击置为 true。
  useEffect(() => {
    const el = ref.current;
    if (!el || !playable) return;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [idx, playing, playable]);

  const step = useCallback((n) => {
    if (!hasTracks) return;
    setIdx((i) => (i + n + tracks.length) % tracks.length);
    setAt(0);
    setLen(0);
  }, [hasTracks]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const seek = useCallback((seconds) => {
    const v = Number(seconds);
    if (!Number.isFinite(v)) return;
    setAt(v);
    if (ref.current) ref.current.currentTime = v;
  }, []);

  const value = useMemo(
    () => ({
      current,
      idx,
      hasTracks,
      playable,
      playing,
      muted,
      at,
      len,
      step,
      toggle,
      toggleMute,
      seek,
    }),
    [current, idx, hasTracks, playable, playing, muted, at, len, step, toggle, toggleMute, seek],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      {playable && (
        <audio
          ref={ref}
          src={current.src}
          muted={muted}
          preload="metadata"
          onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setLen(e.currentTarget.duration)}
          onEnded={() => step(1)}
          onError={() => setPlaying(false)}
        />
      )}
    </AudioPlayerContext.Provider>
  );
}
