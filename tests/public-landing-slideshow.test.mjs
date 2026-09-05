import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicLanding.tsx', import.meta.url), 'utf8');

test('landing slideshow waits for a ready next slide instead of showing an empty background', () => {
  assert.match(source, /useRef/);
  assert.match(source, /readyImagesRef/);
  assert.match(source, /const readyIndexes = readyImagesRef\.current/);
  assert.match(source, /readyIndexes\.length < 2/);
  assert.match(source, /return readyIndexes\.find\(index => index > prev\) \?\? readyIndexes\[0\]/);
});

test('landing slideshow layers the image above its loading fallback', () => {
  assert.match(source, /bg-slate-900 z-0/);
  assert.match(source, /relative z-\[1\] w-full h-full object-cover/);
  assert.doesNotMatch(source, /e\.currentTarget\.style\.display = 'none'/);
});
