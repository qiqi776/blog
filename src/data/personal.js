import { withBasePath } from "../lib/paths";

// ── 首页音乐组件的数据源 ────────────────────────────────────
export const tracks = [
  {
    title: "Spring Is Coming",
    artist: "GUM TAPES",
    src: withBasePath("/music/spring-is-coming-gum-tapes.m4a"),
  },
  {
    title: "Too Timid",
    artist: "Holdan Sutton",
    src: withBasePath("/music/too-timid-holdan-sutton.m4a"),
  },
];
