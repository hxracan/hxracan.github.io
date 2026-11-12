const game = (slug, title, category, tags, description, controls) => ({
  id: `ug-${slug}`,
  title,
  description,
  controls,
  category,
  tags,
  thumbnail: `/play/${slug}.svg`,
  embedUrl: `/play/${slug}.html`,
  orientation: 'landscape',
  provider: 'unblockedgames',
  providerUrl: 'https://github.com/hxracan/hxracan.github.io',
  touch: true,
});
export const localGames = Object.fromEntries(
  [
    game(
      'snake',
      'Snake',
      'Arcade',
      ['Snake', 'Classic', 'Ad-free'],
      'Eat, grow, and do not bite yourself. No ads, no loading screen. Your best score is saved on this device.',
      'Arrow keys, WASD, or swipe. Space pauses.',
    ),
    game(
      'mines',
      'Mines',
      'Puzzle',
      ['Minesweeper', 'Logic', 'Ad-free'],
      'Clear the board without hitting a mine. The first tap is always safe, and the board is saved after every move.',
      'Tap to reveal. Right-click or use flag mode to mark a mine.',
    ),
    game(
      'pairs',
      'Pairs',
      'Puzzle',
      ['Memory', 'Cards', 'Ad-free'],
      'Flip cards and find every pair. Each level adds more cards, and your level is saved.',
      'Tap two cards to flip them.',
    ),
    game(
      'forge',
      'Star Forge',
      'Clicker',
      ['Idle', 'Clicker', 'Ad-free'],
      'Forge stars, buy upgrades, and keep earning while you are away. Progress saves automatically.',
      'Tap the star. Buy upgrades when you can afford them.',
    ),
  ].map((entry) => [entry.id, entry]),
);
export const localRows = Object.values(localGames).map((entry) => [
  entry.id,
  entry.title,
  entry.category,
  entry.tags.join(', '),
  entry.thumbnail,
  true,
]);
