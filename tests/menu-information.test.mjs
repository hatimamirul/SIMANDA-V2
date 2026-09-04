import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');

test('registers protected routes for the information-menu placeholders', () => {
  assert.match(appSource, /path="\/informasi-menu\/nilai-gizi"/);
  assert.match(appSource, /path="\/informasi-menu\/arsip-menu-harian"/);
  assert.match(appSource, /allowedRoles=\{\['SUPERADMIN', 'KSPPG', 'ADMINSPPG'\]\}/);
});

test('shows Manajemen Informasi Menu with both submenu items', () => {
  assert.match(layoutSource, /label="Manajemen Informasi Menu"/);
  assert.match(layoutSource, /label="Data Nilai Gizi"/);
  assert.match(layoutSource, /label="Arsip Menu Harian"/);
});
