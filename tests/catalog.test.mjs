import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { queryGames, unpack } from '../src/catalog-query.js';

const read = async (path) =>
  JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const index = await read('public/catalog/index.json');
const manifest = await read('public/catalog/manifest.json');

test('all imported games are unique, searchable, and accessible through pagination', () => {
  assert.equal(index.length, manifest.count);
  assert.equal(new Set(index.map((g) => g[0])).size, manifest.count);
  const visited = new Set();
  const first = queryGames(index);
  for (let page = 1; page <= first.pages; page++)
    for (const game of queryGames(index, { page }).games) visited.add(game.id);
  assert.equal(visited.size, manifest.count);
  assert.equal(
    manifest.sources.reduce((total, s) => total + s.count, 0),
    manifest.count,
  );
});

test('each catalog entry keeps its actual publisher thumbnail and playable URL', async () => {
  const files = (await readdir(new URL('../public/catalog', import.meta.url))).filter(
    (f) => f !== 'index.json' && f !== 'manifest.json',
  );
  const details = new Map();
  for (const name of files)
    for (const game of Object.values(await read(`public/catalog/${name}`)))
      details.set(game.id, game);
  assert.equal(details.size, index.length);
  for (const row of index) {
    const summary = unpack(row),
      game = details.get(row[0]);
    assert.ok(game, `Missing details for ${row[0]}`);
    assert.equal(summary.thumbnail, game.thumbnail);
    assert.ok(game.embedUrl.startsWith('https://'));
    assert.ok(game.title.length > 0);
  }
});

test('search, category, provider, favorites, and recent filters include the whole library', () => {
  const last = unpack(index.at(-1));
  assert.ok(queryGames(index, { q: last.title, limit: 1000 }).games.some((g) => g.id === last.id));
  const category = manifest.categories.find((c) => c.count > 24);
  assert.equal(queryGames(index, { category: category.name }).total, category.count);
  assert.equal(
    queryGames(index, { source: 'PlayKovo' }).total,
    manifest.sources.find((s) => s.name === 'PlayKovo').count,
  );
  const ids = [last.id, index[13][0], index[1000][0]];
  assert.deepEqual(
    queryGames(index, { ids }).games.map((g) => g.id),
    ids,
  );
  assert.equal(queryGames(index, { ids: [] }).total, 0);
  assert.equal(queryGames(index, { q: 'no-such-game-abcdefghijk' }).total, 0);
  assert.equal(queryGames(index, { page: -1 }).page, 1);
  assert.equal(queryGames(index, { page: 999999 }).page, queryGames(index).pages);
});

test('every listed category has an accurate count', () => {
  assert.equal(
    manifest.categories.reduce((n, c) => n + c.count, 0),
    index.length,
  );
  for (const category of manifest.categories)
    assert.equal(queryGames(index, { category: category.name }).total, category.count);
});

test('source files contain no comments', async () => {
  for (const folder of ['src', 'scripts', 'tests']) {
    const directory = new URL(`../${folder}/`, import.meta.url);
    for (const name of await readdir(directory)) {
      if (!/\.(jsx?|mjs)$/.test(name)) continue;
      const text = await readFile(new URL(name, directory), 'utf8');
      const ast = parse(text, { sourceType: 'module', plugins: ['jsx', 'importAttributes'] });
      assert.equal(ast.comments.length, 0, `${folder}/${name} has comments`);
    }
  }
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.equal(html.includes('<!--'), false);
  assert.equal(css.includes('/*'), false);
});
