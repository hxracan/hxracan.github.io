import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPreferences, normalizePreferences, parseBackup } from '../src/preferences.js';
import { startRecord, addTime, readStorage, writeStorage, validRecords } from '../src/storage.js';
import { messages, relativeDate } from '../src/i18n.js';

const game = {
  id: 'gm-42',
  title: 'Example Game',
  thumbnail: 'https://example.com/icon.jpg',
  category: 'Arcade',
  provider: 'GameMonetize',
  touch: true,
};

test('reopening a game retains accumulated playtime and updates the last session', () => {
  let records = startRecord({}, game, 1000);
  records = addTime(records, game.id, 12, 2000);
  records = startRecord(records, game, 3000);
  assert.equal(records[game.id].seconds, 12);
  assert.equal(records[game.id].launches, 2);
  assert.equal(records[game.id].lastPlayed, 3000);
  assert.ok(validRecords(records));
  assert.deepEqual(addTime(records, 'missing', 10), records);
  assert.deepEqual(addTime(records, game.id, -5), records);
  assert.deepEqual(addTime(records, game.id, NaN), records);
});

test('history keeps the latest 100 games', () => {
  let records = {};
  for (let n = 1; n <= 120; n++) records = startRecord(records, { ...game, id: `gm-${n}` }, n);
  assert.equal(Object.keys(records).length, 100);
  assert.ok(!records['gm-1']);
  assert.ok(records['gm-120']);
});

test('preferences reject invalid values and preserve all real controls', () => {
  assert.deepEqual(normalizePreferences(null), defaultPreferences);
  const result = normalizePreferences({
    pageSize: 48,
    textSize: 'large',
    density: 'compact',
    rememberHistory: false,
    keepGameOpen: false,
    reducedMotion: true,
    unknown: 'ignored',
  });
  assert.equal(result.pageSize, 48);
  assert.equal(result.rememberHistory, false);
  assert.equal(result.textSize, 'large');
  assert.equal(result.keepGameOpen, false);
  assert.equal(result.unknown, undefined);
  assert.equal(
    normalizePreferences({ pageSize: 500, rememberTime: 'false', textSize: 'tiny' }).pageSize,
    24,
  );
  assert.equal(normalizePreferences({ rememberTime: 'false' }).rememberTime, true);
});

test('library backups round-trip portal records and discard malformed entries', () => {
  const records = startRecord({}, game, 1000);
  const backup = {
    version: 1,
    saved: ['gm-42', 'gm-42', '__proto__'],
    recent: ['gm-42'],
    records,
    preferences: { ...defaultPreferences, pageSize: 36 },
    language: 'de',
    theme: 'dark',
  };
  const restored = parseBackup(JSON.parse(JSON.stringify(backup)));
  assert.deepEqual(restored.saved, ['gm-42']);
  assert.deepEqual(restored.records, records);
  assert.equal(restored.preferences.pageSize, 36);
  assert.equal(restored.language, 'de');
  assert.throws(() => parseBackup({ version: 9 }), /Invalid/);
  assert.deepEqual(
    parseBackup({ ...backup, records: { bad: { ...records['gm-42'], id: '__proto__' } } }).records,
    {},
  );
});

test('storage failures and corrupt data do not crash the site', () => {
  globalThis.localStorage = {
    getItem: () => '{broken',
    setItem: () => {
      throw new Error('Blocked');
    },
  };
  assert.equal(readStorage('test', 'fallback'), 'fallback');
  assert.equal(writeStorage('test', {}), false);
  let stored = '';
  globalThis.localStorage = { getItem: () => stored, setItem: (_, value) => (stored = value) };
  assert.equal(writeStorage('test', { x: 1 }), true);
  assert.deepEqual(readStorage('test', {}), { x: 1 });
});

test('German and English cover the same interface and settings', () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.de).sort());
  for (const language of ['en', 'de'])
    for (const text of Object.values(messages[language]))
      assert.ok(typeof text === 'string' && text.length > 0);
  const now = new Date(2026, 10, 5, 12).getTime();
  assert.equal(relativeDate(now, 'de', now), 'Heute');
  assert.equal(relativeDate(now - 86400000, 'en', now), 'Yesterday');
});
