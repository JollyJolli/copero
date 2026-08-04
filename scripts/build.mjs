import { build, context } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { extractVerifiedClubs } from './extract-clubs.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWatch = process.argv.includes('--watch');
await extractVerifiedClubs();

const options = {
  absWorkingDir: projectRoot,
  entryPoints: ['./src/index.js'], bundle: true, minify: !isWatch,
  format: 'iife', platform: 'browser', target: ['chrome100', 'firefox100', 'safari15'],
  outfile: resolve(projectRoot, 'main.js'), sourcemap: isWatch,
  banner: { js: `/*\n * COPERO CAREER EDITOR\n * Generated automatically.\n * Do not edit main.js directly.\n * Edit files inside src/ and run npm run build.\n */` }
};

if (isWatch) {
  const ctx = await context(options); await ctx.watch();
  console.log('Watching src/ and rebuilding main.js...');
} else await build(options);
