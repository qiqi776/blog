import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeSpaFallback } from './spa-fallback.mjs';

test('copies built index.html to 404.html for GitHub Pages SPA fallback', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'blog-spa-fallback-'));
  const indexHtml = '<!doctype html><div id="root"></div>';

  await writeFile(join(dir, 'index.html'), indexHtml);
  await writeSpaFallback(dir);

  assert.equal(await readFile(join(dir, '404.html'), 'utf8'), indexHtml);
});
