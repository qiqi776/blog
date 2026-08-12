import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function writeSpaFallback(distDir = 'dist') {
  await copyFile(join(distDir, 'index.html'), join(distDir, '404.html'));
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await writeSpaFallback(process.argv[2] || 'dist');
}
