import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('public daily menu provides the official BGN Radar MBG reference', () => {
  assert.match(source, /https:\/\/www\.bgn\.go\.id\/radar-mbg/);
  assert.match(source, /Menu harian juga dapat dilihat melalui/);
  assert.match(source, /<footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs/);
  assert.match(source, /Radar MBG Badan Gizi Nasional/);
});
