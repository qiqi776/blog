export function createAudioPlayerState(tracks = []) {
  return {
    idx: 0,
    trackCount: tracks.length,
    playing: false,
    muted: false,
    at: 0,
    len: 0,
  };
}

function wrapIndex(index, total) {
  if (!total) return 0;
  return (index + total) % total;
}

function resetPosition(state, idx) {
  return {
    ...state,
    idx,
    at: 0,
    len: 0,
  };
}

export function audioPlayerReducer(state, action) {
  switch (action.type) {
    case 'toggle-playback':
      return { ...state, playing: !state.playing };

    case 'set-playing':
      return { ...state, playing: Boolean(action.playing) };

    case 'playback-failed':
      return { ...state, playing: false };

    case 'toggle-muted':
      return { ...state, muted: !state.muted };

    case 'track-step':
      return resetPosition(
        state,
        wrapIndex(state.idx + Number(action.delta || 0), state.trackCount),
      );

    case 'ended':
      return resetPosition(state, wrapIndex(state.idx + 1, state.trackCount));

    case 'seek':
      if (!Number.isFinite(action.seconds)) return state;
      return { ...state, at: action.seconds };

    case 'time-updated':
      if (!Number.isFinite(action.currentTime)) return state;
      return { ...state, at: action.currentTime };

    case 'metadata-loaded':
      if (!Number.isFinite(action.duration)) return state;
      return { ...state, len: action.duration };

    case 'route-changed':
      return state;

    default:
      return state;
  }
}
