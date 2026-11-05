import { mkdir, writeFile, readFile, rename, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const strip = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
const https = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};
const feeds = [
  {
    name: 'GameMonetize',
    url: 'https://rss.gamemonetize.com/rssfeed.php?format=json&amount=1000000&type=html5&category=All&company=All&popularity=newest',
    async parse(data) {
      if (!Array.isArray(data)) throw new Error('Expected the complete GameMonetize array');
      return data.map((g, i) => ({
        id: `gm-${g.id}`,
        title: strip(g.title),
        description: strip(g.description),
        controls: strip(g.instructions),
        category:
          { Puzzles: 'Puzzle', Sport: 'Sports', Hypercasual: 'Casual' }[g.category] ||
          strip(g.category) ||
          'Arcade',
        tags: strip(g.tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        thumbnail: https(g.thumb),
        embedUrl: https(g.url),
        width: Number(g.width) || 800,
        height: Number(g.height) || 600,
        provider: 'GameMonetize',
        providerUrl: 'https://gamemonetize.com',
        order: i,
        engine: 'embed',
      }));
    },
  },
  {
    name: 'PlayKovo',
    url: 'https://playkovo.com/api/embed-games?format=json',
    async parse(data) {
      if (!Array.isArray(data.games) || data.games.length !== data.count)
        throw new Error('Incomplete PlayKovo feed');
      return data.games.map((g, i) => ({
        id: `pk-${g.slug}`,
        title: strip(g.title),
        description: strip(g.description || g.shortDescription),
        controls: strip(g.controls || g.instructions),
        category: (g.categories?.[0] || 'Arcade').replace(/^./, (x) => x.toUpperCase()),
        tags: g.tags || [],
        thumbnail: https(g.thumbnailUrl),
        cover: https(g.coverUrl),
        embedUrl: https(g.embedUrl),
        width: Number(g.width) || 960,
        height: Number(g.height) || 540,
        orientation: g.screenOrientation,
        devices: g.deviceSupport,
        provider: 'PlayKovo',
        providerUrl: g.gameUrl || 'https://playkovo.com',
        order: i,
        engine: 'embed',
      }));
    },
  },
];
await mkdir(`${root}/data`, { recursive: true });
let previous;
try {
  previous = JSON.parse(await readFile(`${root}/data/catalog.json`, 'utf8'));
} catch {
  try {
    const files = (await readdir(`${root}/public/catalog`)).filter((name) =>
      /^(gm-\d+|pk)\.json$/.test(name),
    );
    const snapshots = await Promise.all(
      files.map(async (name) =>
        Object.values(JSON.parse(await readFile(`${root}/public/catalog/${name}`, 'utf8'))),
      ),
    );
    previous = { games: snapshots.flat() };
  } catch {}
}
const results = await Promise.all(
  feeds.map(async (feed) => {
    try {
      console.log(`Fetching complete ${feed.name} feed…`);
      const response = await fetch(feed.url, { signal: AbortSignal.timeout(180000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await feed.parse(await response.json());
      const unique = new Map();
      let invalid = 0;
      for (const game of raw) {
        if (!game.title || !game.thumbnail || !game.embedUrl) {
          invalid++;
          continue;
        }
        unique.set(game.id, game);
      }
      if (!unique.size) throw new Error('Empty feed; refusing to replace catalog');
      console.log(
        `${feed.name}: ${raw.length} received, ${unique.size} unique, ${invalid} incomplete records.`,
      );
      return {
        name: feed.name,
        ok: true,
        received: raw.length,
        invalid,
        games: [...unique.values()],
      };
    } catch (error) {
      const old = previous?.games?.filter((g) => g.provider === feed.name) || [];
      console.error(
        `${feed.name}: ${error.message}${old.length ? '; preserving previous snapshot' : ''}`,
      );
      return { name: feed.name, ok: false, error: error.message, games: old };
    }
  }),
);
if (results.some((r) => !r.ok && !r.games.length))
  throw new Error('One or more sources unavailable with no cached catalog. Try sync again.');
const games = results.flatMap((r) => r.games);
const sources = results.map(({ games, ...r }) => ({ ...r, count: games.length }));
const snapshot = { updatedAt: new Date().toISOString(), count: games.length, sources, games };
await writeFile(`${root}/data/catalog.json.tmp`, JSON.stringify(snapshot));
await rename(`${root}/data/catalog.json.tmp`, `${root}/data/catalog.json`);
console.log(
  `Saved ${games.length.toLocaleString()} games, including their publisher thumbnails and embed URLs. No title or category filters applied.`,
);
await import('./export-catalog.mjs');
