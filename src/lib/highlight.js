import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import x86asm from 'highlight.js/lib/languages/x86asm';
import perl from 'highlight.js/lib/languages/perl';
import makefile from 'highlight.js/lib/languages/makefile';
import http from 'highlight.js/lib/languages/http';
import plaintext from 'highlight.js/lib/languages/plaintext';

const languages = {
  javascript,
  css,
  go,
  c,
  cpp,
  xml,
  json,
  bash,
  sql,
  x86asm,
  perl,
  makefile,
  http,
  plaintext,
};

Object.entries(languages).forEach(([name, grammar]) => {
  hljs.registerLanguage(name, grammar);
});

const aliases = {
  js: 'javascript',
  jsx: 'javascript',
  html: 'xml',
  shell: 'bash',
  sh: 'bash',
  asm: 'x86asm',
  make: 'makefile',
  text: 'plaintext',
  plain: 'plaintext',
  txt: 'plaintext',
};

const labels = {
  javascript: 'JavaScript',
  css: 'CSS',
  go: 'Go',
  c: 'C',
  cpp: 'C++',
  xml: 'HTML',
  json: 'JSON',
  bash: 'Shell',
  sql: 'SQL',
  x86asm: 'ASM',
  perl: 'Perl',
  makefile: 'Makefile',
  http: 'HTTP',
  plaintext: 'Text',
};

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstLanguageToken(infoString) {
  return String(infoString || '').trim().split(/\s+/)[0].toLowerCase();
}

export function normalizeLanguage(infoString) {
  const token = firstLanguageToken(infoString);
  if (!token) return '';
  return aliases[token] || token;
}

export function languageLabel(infoString) {
  const token = firstLanguageToken(infoString);
  const language = normalizeLanguage(token);
  return labels[language] || token.toUpperCase() || 'Text';
}

export function highlightCode(code, infoString) {
  const source = String(code ?? '').replace(/\n$/, '');
  const language = normalizeLanguage(infoString);

  if (!language || !hljs.getLanguage(language)) {
    return escapeHtml(source);
  }

  try {
    return hljs.highlight(source, { language, ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(source);
  }
}

function resolveCodeBlockInput(input, infoString, escaped) {
  if (input && typeof input === 'object') {
    return {
      source: String(input.text ?? '').replace(/\n$/, ''),
      rawLang: input.lang || '',
      escaped: Boolean(input.escaped),
    };
  }

  return {
    source: String(input ?? '').replace(/\n$/, ''),
    rawLang: infoString || '',
    escaped: Boolean(escaped),
  };
}

function lineCount(source) {
  return Math.max(1, source.split('\n').length);
}

function renderLineNumbers(source) {
  return Array.from({ length: lineCount(source) }, (_, index) => `<span>${index + 1}</span>`).join('');
}

export function renderCodeBlock(input, infoString, escaped = false) {
  const block = resolveCodeBlockInput(input, infoString, escaped);
  const source = block.source;
  const rawLang = block.rawLang;
  const language = normalizeLanguage(rawLang);
  const knownLanguage = language && hljs.getLanguage(language);
  const safeLanguage = knownLanguage ? language : firstLanguageToken(rawLang) || 'text';
  const codeClass = knownLanguage ? `code-block__code hljs language-${escapeHtml(language)}` : 'code-block__code hljs';
  const code = block.escaped ? source : highlightCode(source, language);
  const lines = lineCount(source);

  return [
    `<div class="code-block" data-code-language="${escapeHtml(safeLanguage)}" data-code-lines="${lines}">`,
    '<div class="code-block__chrome">',
    '<div class="code-block__identity">',
    '<span class="code-block__traffic" aria-hidden="true"><span></span><span></span><span></span></span>',
    `<span class="code-block__language">${escapeHtml(languageLabel(rawLang))}</span>`,
    '</div>',
    '<button class="code-block__copy" type="button" aria-label="复制代码">复制</button>',
    '</div>',
    '<div class="code-block__body">',
    `<div class="code-block__line-numbers" aria-hidden="true">${renderLineNumbers(source)}</div>`,
    `<pre class="code-block__pre"><code class="${codeClass}">${code}\n</code></pre>`,
    '</div>',
    '</div>\n',
  ].join('');
}

export const registeredLanguages = () => hljs.listLanguages();

export default hljs;
