import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('mobile userscript targets Copero and mounts a launcher', async () => {
  const source = await readFile(new URL('../para-poner-en-la-consola.js', import.meta.url), 'utf8');
  for (const token of ['// ==UserScript==', '@match        https://copero.com.ar/*', '@inject-into  page', 'main.js', 'copero-career-editor-launcher', 'api.panel()']) assert.ok(source.includes(token), `missing ${token}`);
});
