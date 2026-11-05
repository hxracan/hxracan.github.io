export const unpack = (row) => ({
  id: row[0],
  title: row[1],
  category: row[2],
  tags: row[3].split(', '),
  thumbnail:
    row[0].startsWith('gm-') && !row[4].startsWith('https:')
      ? `https://img.gamemonetize.com/${row[4]}/512x384.jpg`
      : row[4],
  provider: row[0].startsWith('gm-') ? 'GameMonetize' : 'PlayKovo',
});
export function queryGames(
  rows,
  {
    q = '',
    category = 'All games',
    sort = 'newest',
    page = 1,
    limit = 24,
    ids = null,
    source = '',
  } = {},
) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let list = ids ? ids.map((id) => rows.find((g) => g[0] === id)).filter(Boolean) : rows;
  if (words.length)
    list = list.filter((g) =>
      words.every((w) => `${g[1]} ${g[2]} ${g[3]}`.toLowerCase().includes(w)),
    );
  if (category !== 'All games') list = list.filter((g) => g[2] === category);
  if (source)
    list = list.filter((g) => (g[0].startsWith('gm-') ? 'GameMonetize' : 'PlayKovo') === source);
  if (sort === 'az') list = [...list].sort((a, b) => a[1].localeCompare(b[1]));
  if (sort === 'discovery') {
    const names = [
      'slope',
      'subway',
      'geometry',
      'block blast',
      'minecraft',
      'obby',
      'basket',
      'drift',
      'football',
      'snake',
      '2048',
    ];
    const rank = (g) => names.reduce((r, n) => r + (g[1].toLowerCase().includes(n) ? 1 : 0), 0);
    list = [...list].sort((a, b) => rank(b) - rank(a));
  }
  if (sort === 'random')
    return { game: list.length ? unpack(list[Math.floor(Math.random() * list.length)]) : null };
  const pages = Math.max(1, Math.ceil(list.length / limit));
  page = Math.min(pages, Math.max(1, Math.floor(page) || 1));
  return {
    games: list.slice((page - 1) * limit, page * limit).map(unpack),
    total: list.length,
    page,
    pages,
  };
}
