// 秒 → m:ss。首页的完整播放器和迷你播放器共用，避免两处各写一份
// 结果不一致的格式化逻辑。
export const formatTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
