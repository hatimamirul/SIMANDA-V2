import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('public daily menu footer includes the requested social information', () => {
  assert.match(source, /Ikuti informasi kami/);
  assert.match(source, /TikTok: Sppg Tales Stono/);
  assert.match(source, /Instagram: @Sppg\.Tales/);
  assert.match(source, /Instagram/);
  assert.match(source, /Music2/);
});
