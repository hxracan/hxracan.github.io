# unblockedgames

A browser game library at [hxracan.github.io](https://hxracan.github.io). Built for iPad with a dark default, English and German interfaces, and the full imported GameMonetize and PlayKovo catalogs.

The homepage opens directly to a dense game grid, with search, categories, saved games, and play history close at hand. The interface uses system fonts and has no promotional hero sections.

The 5 November 2026 snapshot includes 38,628 games with publisher-provided icons and embed URLs. Of those, 22,854 are listed by their publishers as mobile compatible.

## Development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

```sh
npm test
npx playwright install webkit
npm run test:browser
npm run build
```

Browser tests use WebKit with iPad emulation. They cover language and preference persistence, library backups, touch filtering, session retention, playtime, closing behavior, and portrait and landscape layouts. External fonts, images, and launched game frames use fixtures to keep interface tests independent of provider network availability. The catalog tests validate real image and embed mappings. This is browser emulation, not testing on a physical iPad.

Playwright is pinned to 1.63.0 to avoid the [Linux WebKit r2370 blur-rendering regression](https://github.com/microsoft/playwright/issues/43426) in 1.64.x.

## Preferences

Settings includes language, dark or light appearance, text size, card density, reduced motion, touch-filter defaults, games per page, player expansion, session retention, closing confirmations, history, and playtime. Preferences are stored in the current browser. Saved games and play history can be exported or imported as a JSON library backup.

The library remembers the last played game and offers to reopen it. Returning to the library keeps the current game iframe mounted by default. Browsing therefore preserves that live game session until it is closed, replaced, or the page is reloaded. Only visible playtime is counted.

Game levels and scores are managed by the game provider. The portal cannot read or back up third-party game storage. Safari may restrict embedded storage, and keeping an iframe open is not a cloud save. Library backups contain bookmarks, history, playtime, and settings, not in-game checkpoints. Game sound and language are controlled inside each game.

For a full-window experience on iPad, use Safari’s Share menu and choose **Add to Home Screen**.

## Deployment

GitHub Actions tests, builds, and publishes to GitHub Pages on each push to `main`. The Pages publishing source is **GitHub Actions**. The website is static; search runs in a web worker and game details load in smaller files when needed. No backend, database, account, or API key is required.

## Updating the catalog

```sh
npm run sync
npm test
npm run build
git add public/catalog
git commit -m "Update game catalog"
git push
```

The sync script requests the complete GameMonetize HTML5 feed with a numeric amount because its `amount=All` response is capped at 5,001 entries. It also imports the complete PlayKovo feed and uses GameMonetize’s mobile feed to label touch-compatible entries. No game titles, categories, or device types are excluded from the full library.

Exact provider IDs are deduplicated; distinct games with similar names remain separate. Records missing a title, HTTPS thumbnail, or HTTPS embed URL are reported. Removed games disappear after a successful sync. The last snapshot is retained if a provider is temporarily unavailable. `public/catalog` contains the complete published data; the intermediate `data` folder is ignored.

## Credits and privacy

Games, artwork, titles, and other game assets belong to their respective developers and rights holders. This repository contains catalog data and embeds, not copies of third-party game files. Provider branding, advertising, and credits remain intact.

- [GameMonetize feed](https://gamemonetize.com/rss-builder)
- [GameMonetize embedding FAQ](https://gamemonetize.com/faq)
- [PlayKovo catalog documentation](https://playkovo.com/partners/docs/import-game-catalog)
- [PlayKovo partner terms](https://playkovo.com/partners/terms)

This is a snapshot of these distribution feeds, not a copy of Poki or Playvio. Availability depends on the provider, device, and network. The website does not bypass network restrictions. Individual games may show third-party ads or use cookies.

The website adds no analytics or advertising scripts of its own. Interface settings and library data remain in local storage. Game images and embeds load from their providers; GitHub Pages handles hosting requests.
