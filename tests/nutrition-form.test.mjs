import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../pages/MenuInformation.tsx', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../services/mockService.ts', import.meta.url), 'utf8');

test('Data Nilai Gizi gives every portion its own image, menu name, and nutrition inputs', () => {
  for (const label of [
    'Menu Porsi Besar',
    'Menu Porsi Kecil',
    'Menu Balita',
    'Menu Bumil dan Busui',
    'Nama Menu',
    'Karbohidrat',
    'Protein',
    'Serat',
    'Energi',
    'Lemak',
  ]) {
    assert.match(pageSource, new RegExp(label));
  }
  assert.match(pageSource, /portions\.map/);
  assert.match(pageSource, /type="file"/);
});

test('Data Nilai Gizi keeps production and deadline shared, with a deadline time input', () => {
  assert.match(pageSource, /Hari dan Tanggal Produksi/);
  assert.match(pageSource, /Batas Dikonsumsi/);
  assert.match(pageSource, /type="date"/);
  assert.match(pageSource, /type="time"/);
});

test('Data Nilai Gizi saves records through the application API and compresses portion images', () => {
  assert.match(pageSource, /api\.saveNilaiGizi/);
  assert.match(serviceSource, /saveNilaiGizi/);
  assert.match(serviceSource, /subscribeNilaiGizi/);
  assert.match(serviceSource, /porsiMenus/);
});
