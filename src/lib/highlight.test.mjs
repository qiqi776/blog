import assert from 'node:assert/strict';
import test from 'node:test';
import { Marked } from 'marked';

import * as highlight from './highlight.js';

test('highlights known fence languages with hljs token spans', () => {
  const html = highlight.highlightCode('const answer = 42;', 'js');

  assert.match(html, /hljs-keyword/);
  assert.match(html, /const/);
});

test('escapes unknown languages instead of injecting raw html', () => {
  const html = highlight.highlightCode('<script>alert(1)</script>', 'unknown-lang');

  assert.equal(html, '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('renders fenced code as a copyable code block component', () => {
  const html = highlight.renderCodeBlock?.({
    text: 'func main() {\n  fmt.Println("hi")\n}',
    lang: 'go',
    escaped: false,
  }) ?? '';

  assert.match(html, /class="code-block"/);
  assert.match(html, /data-code-language="go"/);
  assert.match(html, /data-code-lines="3"/);
  assert.match(html, /class="code-block__chrome"/);
  assert.match(html, /class="code-block__traffic"/);
  assert.match(html, /<span class="code-block__language">Go<\/span>/);
  assert.match(html, /class="code-block__line-numbers" aria-hidden="true"/);
  assert.match(html, /<span>1<\/span><span>2<\/span><span>3<\/span>/);
  assert.match(html, /type="button"/);
  assert.match(html, />复制</);
  assert.match(html, /class="code-block__code hljs language-go"/);
  assert.match(html, /hljs-title/);
});

test('integrates with marked fenced code rendering', () => {
  const parser = new Marked({ gfm: true, breaks: false });
  parser.use({ renderer: { code: highlight.renderCodeBlock } });

  const html = parser.parse('```go\nfunc main() {}\n```');

  assert.match(html, /data-code-language="go"/);
  assert.match(html, /data-code-lines="1"/);
  assert.match(html, /<span class="code-block__language">Go<\/span>/);
  assert.match(html, /class="code-block__line-numbers" aria-hidden="true"/);
  assert.match(html, /hljs-title/);
  assert.match(html, /main/);
});
