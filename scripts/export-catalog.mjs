import { readFile, mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = JSON.parse(await readFile(`${root}/data/catalog.json`, 'utf8'));
let mobileIds = new Set();
try {
  mobileIds = new Set(JSON.parse(await readFile(`${root}/data/mobile-ids.json`, 'utf8')));
} catch {}
for (const game of catalog.games) {
  game.touch =
    game.provider === 'PlayKovo'
      ? ['all', 'mobile'].includes(game.devices)
      : mobileIds.has(game.id) || game.touch === true;
}
await mkdir(`${root}/public/catalog`, { recursive: true });
const groups = new Map();
for (const g of catalog.games) {
  const key = g.id.startsWith('gm-') ? `gm-${Math.floor(Number(g.id.slice(3)) / 500)}` : 'pk';
  if (!groups.has(key)) groups.set(key, {});
  groups.get(key)[g.id] = g;
}
const categories = Object.entries(
  catalog.games.reduce((m, g) => ((m[g.category] = (m[g.category] || 0) + 1), m), {}),
)
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => ({ name, count }));
const index = catalog.games.map((g) => [
  g.id,
  g.title,
  g.category,
  g.tags.join(', '),
  g.id.startsWith('gm-')
    ? g.thumbnail.match(/gamemonetize\.com\/([^/]+)/)?.[1] || g.thumbnail
    : g.thumbnail,
  g.touch,
]);
await Promise.all(
  [...groups].map(([key, games]) =>
    writeFile(`${root}/public/catalog/${key}.json`, JSON.stringify(games)),
  ),
);
await writeFile(`${root}/public/catalog/index.json`, JSON.stringify(index));
await writeFile(
  `${root}/public/catalog/manifest.json`,
  JSON.stringify({
    count: catalog.count,
    updatedAt: catalog.updatedAt,
    sources: catalog.sources,
    touchCount: catalog.games.filter((g) => g.touch).length,
    categories,
    spotlight: [
      'pk-moxriding',
      'pk-paintballz-io',
      'pk-longcat',
      'pk-gravity-flip',
      'pk-pixel-paint',
      'pk-stack-jump',
      'pk-hexa-go',
      'pk-cube-slide-merge',
    ]
      .map((id) => catalog.games.find((g) => g.id === id))
      .filter(Boolean),
    featured: catalog.games
      .slice(0, 24)
      .map(({ id, title, category, tags, thumbnail, provider, touch }) => ({
        id,
        title,
        category,
        tags,
        thumbnail,
        provider,
        touch,
      })),
  }),
);
const stale = (await readdir(`${root}/public/catalog`)).filter(
  (name) => /^(gm-\d+|pk)\.json$/.test(name) && !groups.has(name.slice(0, -5)),
);
await Promise.all(stale.map((name) => unlink(`${root}/public/catalog/${name}`)));
console.log(
  `Exported ${groups.size} static detail files and the complete search index for GitHub Pages.`,
);
