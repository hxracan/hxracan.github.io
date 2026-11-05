import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
  await page.route(/https:\/\/(assets\.playkovo\.com|img\.gamemonetize\.com)\//, (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
});

const ready = async (page) => {
  await expect(page.locator('.game-grid')).toHaveAttribute('aria-busy', 'false');
};
const settings = async (page) => {
  await page
    .locator('.header-tools')
    .getByRole('button', { name: 'Settings', exact: true })
    .click();
};

test('iPad settings, language, theme, touch defaults, and backups persist', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Noch eine Runde.', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page
    .locator('.header-tools')
    .getByRole('button', { name: 'Einstellungen', exact: true })
    .click();
  await page.getByRole('combobox', { name: 'Sprache', exact: true }).selectOption('en');
  await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large');
  await page
    .getByRole('combobox', { name: 'Game card layout', exact: true })
    .selectOption('compact');
  await page.getByRole('combobox', { name: 'Games per page', exact: true }).selectOption('48');
  await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click();
  await page.getByRole('switch', { name: 'Touch-friendly by default', exact: true }).click();
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('light');
  await page.reload();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('.touch-switch')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.game-grid .game-card')).toHaveCount(48);
  await expect(page.locator('.results-count')).toHaveText('22,854 games');
  await settings(page);
  await expect(page.getByRole('combobox', { name: 'Text size', exact: true })).toHaveValue('large');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export library', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/^unblockedgames-library-.*\.json$/);
  const backup = {
    version: 1,
    saved: ['gm-42'],
    recent: ['pk-moxriding'],
    records: {
      'pk-moxriding': {
        id: 'pk-moxriding',
        title: 'MoxRiding',
        thumbnail: 'https://assets.playkovo.com/test.webp',
        category: 'Sports',
        provider: 'PlayKovo',
        seconds: 75,
        lastPlayed: Date.now(),
        launches: 1,
      },
    },
    preferences: { pageSize: 24 },
    language: 'en',
    theme: 'dark',
  };
  await page.getByLabel('Import library', { exact: true }).setInputFiles({
    name: 'library.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator('.settings-status')).toHaveText('Library imported.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.main-nav').getByRole('button', { name: 'Discover', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Continue your last game?', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.continue-banner')).toContainText('MoxRiding');
  await expect(page.locator('.continue-banner')).toContainText('1 min played');
  expect(errors).toEqual([]);
});

test('an open game survives browsing, playtime saves, and closing requires confirmation', async ({
  page,
}) => {
  let launches = 0;
  await page.route('https://playkovo.com/embed/**', async (route) => {
    launches++;
    await route.fulfill({
      contentType: 'text/html',
      body: '<html><body style="background:#12151c;color:white"><button id="checkpoint" onclick="this.textContent=Number(this.textContent)+1">0</button></body></html>',
    });
  });
  await page.clock.install();
  await page.goto('/?game=pk-moxriding');
  await expect(page.locator('.launch-content .primary-button')).toBeEnabled();
  await expect(page.locator('.player-stage iframe')).toHaveCount(0);
  await page
    .locator('.launch-content')
    .getByRole('button', { name: 'Play now', exact: true })
    .click();
  await page.frameLocator('.player-stage iframe').locator('#checkpoint').click();
  await page.clock.fastForward(12000);
  const first = await page.evaluate(
    () => JSON.parse(localStorage.getItem('unblockedgames.sessions'))['pk-moxriding'],
  );
  expect(first.seconds).toBeGreaterThanOrEqual(10);
  await page.getByRole('button', { name: 'Back to library', exact: true }).click();
  await expect(page.locator('.session-dock')).toBeVisible();
  await expect(page.locator('.player-stage iframe')).toHaveCount(1);
  const minimized = await page.evaluate(
    () => JSON.parse(localStorage.getItem('unblockedgames.sessions'))['pk-moxriding'].seconds,
  );
  await page.clock.fastForward(20000);
  const later = await page.evaluate(
    () => JSON.parse(localStorage.getItem('unblockedgames.sessions'))['pk-moxriding'].seconds,
  );
  expect(later).toBe(minimized);
  await page.getByRole('button', { name: 'Back to game', exact: true }).click();
  await expect(page.frameLocator('.player-stage iframe').locator('#checkpoint')).toHaveText('1');
  expect(launches).toBe(1);
  await page.getByRole('button', { name: 'Expand player', exact: true }).click();
  await expect(page.locator('.player-modal')).toHaveClass(/expanded/);
  await page.getByRole('button', { name: 'Close game', exact: true }).click();
  await expect(page.locator('.player-confirm')).toBeVisible();
  await page
    .locator('.player-confirm')
    .getByRole('button', { name: 'Close game', exact: true })
    .click();
  await expect(page.locator('.player-stage iframe')).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.locator('.continue-banner')).toContainText('MoxRiding');
  await expect(page.locator('.player-stage iframe')).toHaveCount(0);
});

test('iPad layouts fit portrait and landscape, including German and large text', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  for (const viewport of [
    { width: 1194, height: 834 },
    { width: 834, height: 1194 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 834, height: 1194 });
  await settings(page);
  await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large');
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click();
  for (const viewport of [
    { width: 1194, height: 834 },
    { width: 834, height: 1194 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await expect(
    page.getByRole('heading', { name: 'Mach es dir gemütlich.', exact: true }),
  ).toBeVisible();
});

test('history can be disabled and session handling follows player settings', async ({ page }) => {
  await page.route('https://playkovo.com/embed/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>Game fixture</body></html>' }),
  );
  await page.goto('/');
  await ready(page);
  await settings(page);
  await page.getByRole('switch', { name: 'Remember played games', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Track playtime', exact: true })).toBeDisabled();
  await page.getByRole('switch', { name: 'Keep game open while browsing', exact: true }).click();
  await page.getByRole('switch', { name: 'Confirm before closing games', exact: true }).click();
  await page.getByRole('switch', { name: 'Start in expanded view', exact: true }).click();
  await page.goto('/?game=pk-gravity-flip');
  await expect(page.locator('.launch-content .primary-button')).toBeEnabled();
  await expect(page.locator('.player-modal')).toHaveClass(/expanded/);
  await page
    .locator('.launch-content')
    .getByRole('button', { name: 'Play now', exact: true })
    .click();
  await expect(page.locator('.player-stage iframe')).toHaveCount(1);
  await page.getByRole('button', { name: 'Back to library', exact: true }).click();
  await expect(page.locator('.player-stage iframe')).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('unblockedgames.recent'))),
  ).toEqual([]);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('unblockedgames.sessions'))),
  ).toEqual({});
});
