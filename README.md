# unblockedgames

A browser game library for [hxracan.github.io](https://hxracan.github.io), built with React and Vite. The catalog contains 38,628 games from GameMonetize and PlayKovo as of 5 November 2026, with publisher-provided thumbnails and embed URLs.

## Development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Deployment

GitHub Actions builds and publishes the site to GitHub Pages on every push to `main`. In repository Settings → Pages, the publishing source is **GitHub Actions**.

The site is completely static. The search index loads in a web worker, and game details load in small files when a game is opened. Only the current page of cards is rendered. No backend, database, account, or API key is required.

## Updating the games

```sh
npm run sync
npm test
npm run build
git add public/catalog
git commit -m "Update game catalog"
git push
```

The sync script requests the complete GameMonetize HTML5 feed using a numeric amount because its `amount=All` response is capped at 5,001 entries. It also imports the complete PlayKovo embed feed. No title, category, or device filters are applied. Exact provider IDs are deduplicated; distinct games with similar names remain separate. Records without a title, HTTPS thumbnail, or HTTPS embed URL are reported as incomplete. Removed games disappear on the next successful sync.

The checked-in `public/catalog` files contain the full catalog. The intermediate `data` directory is ignored. The latest working snapshot is retained if a provider becomes unavailable during a later sync. A first import fails instead of silently producing a partial catalog.

## Games and credits

The games, artwork, titles, and other game assets belong to their respective developers and rights holders. This repository contains a catalog and embeds, not copies of the third-party game files. Ads, credits, and provider branding remain intact. Each game shows its provider and a source link.

- [GameMonetize publisher feed](https://gamemonetize.com/rss-builder)
- [GameMonetize embedding FAQ](https://gamemonetize.com/faq)
- [PlayKovo catalog documentation](https://playkovo.com/partners/docs/import-game-catalog)
- [PlayKovo partner terms](https://playkovo.com/partners/terms)

The catalog is a snapshot of those distribution feeds, not a copy of Poki or Playvio. Individual games depend on the provider, supported devices, and network access. The site does not bypass network restrictions. Games may contain third-party advertising and cookies.

Favorites and recently played entries stay in local storage on the visitor’s device. The site adds no analytics or advertising scripts of its own. Google Fonts serves the interface font. Third-party image requests and game embeds are subject to their providers’ policies.
