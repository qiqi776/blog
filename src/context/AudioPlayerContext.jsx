import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { tracks } from "../data/personal";
import {
  audioPlayerReducer,
  createAudioPlayerState,
} from "../lib/audioPlayerState";

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
  const [state, dispatch] = useReducer(
    audioPlayerReducer,
    tracks,
    createAudioPlayerState,
  );
  const ref = useRef(null);
  const playRequestRef = useRef(0);

  const hasTracks = tracks.length > 0;
  const current = tracks[state.idx] ?? { title: "—", artist: "—", src: "" };
  const playable = Boolean(current.src);
  const src = playable ? current.src : "";

  // Keep the media element alive across the whole app lifetime. Route changes
  // re-render views, but they no longer create, remove, or reload <audio>.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (el.getAttribute("src") !== src) {
      if (!src) {
        el.pause();
        el.removeAttribute("src");
      } else {
        el.src = src;
      }
      el.load();
    }
  }, [src]);

  // Only the user's playback intent and explicit track changes drive play/pause.
  // A page navigation can re-render this provider, but it does not change either
  // dependency, so it cannot pause or switch the current track.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const requestId = playRequestRef.current + 1;
    playRequestRef.current = requestId;

    if (!state.playing || !playable) {
      el.pause();
      return undefined;
    }

    const play = () => {
      el.play().catch(() => {
        if (playRequestRef.current === requestId) {
          dispatch({ type: "playback-failed" });
        }
      });
    };

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play();
      return undefined;
    }

    el.addEventListener("canplay", play, { once: true });
    return () => el.removeEventListener("canplay", play);
  }, [current.src, playable, state.playing]);

  const step = useCallback((n) => {
    if (!hasTracks) return;
    dispatch({ type: "track-step", delta: n });
  }, [hasTracks]);

  const toggle = useCallback(() => {
    if (!playable) return;
    dispatch({ type: "toggle-playback" });
  }, [playable]);

  const toggleMute = useCallback(() => {
    dispatch({ type: "toggle-muted" });
  }, []);

  const seek = useCallback((seconds) => {
    const v = Number(seconds);
    if (!Number.isFinite(v)) return;
    dispatch({ type: "seek", seconds: v });
    if (ref.current) ref.current.currentTime = v;
  }, []);

  const value = useMemo(
    () => ({
      current,
      idx: state.idx,
      hasTracks,
      playable,
      playing: state.playing,
      muted: state.muted,
      at: state.at,
      len: state.len,
      step,
      toggle,
      toggleMute,
      seek,
    }),
    [
      current,
      state.idx,
      hasTracks,
      playable,
      state.playing,
      state.muted,
      state.at,
      state.len,
      step,
      toggle,
      toggleMute,
      seek,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={ref}
        muted={state.muted}
        preload="metadata"
        onTimeUpdate={(e) => {
          dispatch({
            type: "time-updated",
            currentTime: e.currentTarget.currentTime,
          });
        }}
        onLoadedMetadata={(e) => {
          dispatch({
            type: "metadata-loaded",
            duration: e.currentTarget.duration,
          });
        }}
        onEnded={() => dispatch({ type: "ended" })}
        onError={() => dispatch({ type: "playback-failed" })}
      />
    </AudioPlayerContext.Provider>
  );
}
