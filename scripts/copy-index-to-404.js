import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const dist = join(process.cwd(), 'dist');
const index = join(dist, 'index.html');
const out = join(dist, '404.html');

if (existsSync(index)) {
  try {
    copyFileSync(index, out);
    console.log('Copied dist/index.html to dist/404.html');
  } catch (err) {
    console.error('Failed to copy index.html to 404.html', err);
    process.exit(1);
  }
} else {
  console.warn('dist/index.html not found; skipping 404 copy');
}
