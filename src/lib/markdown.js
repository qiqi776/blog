// Frontmatter parser (no external deps, browser-safe)
export function parseFrontmatter(raw) {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fm) return { data: {}, content: raw };

  const data = {};
  for (const line of fm[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    } else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val !== '' && !isNaN(val)) val = Number(val);
    data[key] = val;
  }

  return { data, content: fm[2] };
}

// Top-level directory → display category
export const CATEGORY_MAP = {
  go:                 { label: 'Go 语言',     color: 'bg-cyan-200/60 text-cyan-800' },
  SystemDesign:       { label: '系统设计',    color: 'bg-orange-200/60 text-orange-800' },
  DistributedSystem:  { label: '分布式系统',  color: 'bg-red-200/60 text-red-800' },
  cmu15445:           { label: 'CMU 15-445', color: 'bg-yellow-200/60 text-yellow-800' },
  ddia:               { label: 'DDIA',        color: 'bg-indigo-200/60 text-indigo-800' },
  os:                 { label: '操作系统',    color: 'bg-green-200/60 text-green-800' },
  network:            { label: '网络',         color: 'bg-blue-200/60 text-blue-800' },
  mysql:              { label: 'MySQL',        color: 'bg-pink-200/60 text-pink-800' },
  webfront:           { label: '前端',         color: 'bg-violet-200/60 text-violet-800' },
  middleware:         { label: '中间件',       color: 'bg-amber-200/60 text-amber-800' },
  projects:           { label: '项目实践',    color: 'bg-teal-200/60 text-teal-800' },
};

export function categoryFromPath(filePath) {
  // '/posts/go/底层/gmp.md' → topDir = 'go'
  const topDir = filePath.replace(/^\/posts\//, '').split('/')[0];
  const meta = CATEGORY_MAP[topDir] || { label: topDir, color: 'bg-white/30 text-[var(--text-muted)]' };
  return { id: topDir, ...meta };
}

// '/posts/go/底层/gmp.md' → 'go/底层/gmp'
export function slugFromPath(filePath) {
  return filePath.replace(/^\/posts\//, '').replace(/\.md$/, '');
}

// Extract the first non-trivial paragraph from raw markdown (no deps)
export function extractExcerpt(content, maxLen = 140) {
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (
      !t ||
      t.startsWith('#') ||
      t.startsWith('```') ||
      t.startsWith('|') ||
      t.startsWith('<') ||
      t.startsWith('---') ||
      t.startsWith('>')
    ) continue;

    const cleaned = t
      .replace(/!\[.*?\]\(.*?\)/g, '')          // strip images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // extract link text
      .replace(/[*_`~]/g, '')                    // strip markdown chars
      .trim();

    if (cleaned.length > 15) {
      return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '…' : cleaned;
    }
  }
  return '';
}

// Rough read-time estimate (handles CJK + Latin)
export function estimateReadTime(content) {
  const cjk = (content.match(/[一-鿿぀-ヿ]/g) || []).length;
  const latin = content.replace(/[一-鿿぀-ヿ]/g, '').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round((cjk / 350) + (latin / 200)));
  return `${mins} 分钟`;
}
