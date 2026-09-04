import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('important public information is explicitly emphasized for readers', () => {
  assert.match(source, /WAJIB DIPERHATIKAN/);
  assert.match(source, /role="alert"/);
  assert.match(source, /Harap dibaca sebelum menerima dan mengonsumsi makanan/);
  assert.match(source, /border-2 border-amber-300/);
  assert.match(source, /text-2xl font-black/);
});
