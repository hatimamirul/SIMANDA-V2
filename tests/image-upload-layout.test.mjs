import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../pages/MenuInformation.tsx', import.meta.url), 'utf8');

test('each portion uses the dedicated tidy image upload component', () => {
  assert.match(pageSource, /const MenuImageUploader/);
  assert.match(pageSource, /Pilih atau Ganti Gambar/);
  assert.match(pageSource, /Belum ada gambar menu/);
  assert.match(pageSource, /Maks\. 5 MB/);
});
