import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('catalogue filters, clear state and price ordering work', async ({ page }) => {
  await page.goto('/collections');
  await expect(page.getByRole('status').filter({ hasText: '10 timepieces' })).toBeVisible();
  await page.getByLabel('Search the collection').fill('not-a-watch');
  await expect(page.getByText('No watches match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Watchmaker', { exact: true }).selectOption('Rolex');
  await page.getByLabel('To', { exact: true }).fill('25000');
  await expect(page.locator('.watch-card')).toHaveCount(2);
  await expect(page.locator('.watch-card').filter({ hasText: 'Patek Philippe' })).toHaveCount(0);
  await page.getByLabel('Sort by', { exact: true }).selectOption('price-low');
  await expect(page.locator('.watch-name').first()).toHaveText('Submariner Date');
  await page.reload();
  await expect(page.locator('.watch-card')).toHaveCount(2);
});
test('saved watches survive reload and can be removed', async ({ page }) => {
  await page.goto('/collections');
  await page.getByRole('button', { name: 'Save Daytona', exact: true }).click();
  await page.goto('/saved');
  await expect(page.locator('.watch-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.watch-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Unsave Daytona', exact: true }).click();
  await expect(page.getByText('Your collection starts with a favourite.')).toBeVisible();
});
test('comparisons enforce three items and support shareable URLs', async ({ page }) => {
  await page.goto('/collections');
  for (const name of ['Daytona', 'Nautilus', 'Submariner Date'])
    await page.getByRole('button', { name: `Compare ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Compare Aquanaut', exact: true }).click();
  await expect(page.getByText('Compare up to three watches.')).toBeVisible();
  await page
    .getByRole('region', { name: 'Your watch comparison' })
    .getByRole('link', { name: 'Compare', exact: true })
    .click();
  await expect(page.locator('.comparison-watch')).toHaveCount(3);
  await page.goto('/compare?ids=daytona,nautilus');
  await expect(page.locator('.comparison-watch')).toHaveCount(2);
  await page.getByRole('button', { name: 'Remove Daytona from this comparison' }).click();
  await expect(page.locator('.comparison-watch')).toHaveCount(1);
});
test('watch dialog traps focus, exposes history and closes with Escape', async ({ page }) => {
  await page.goto('/collections');
  const opener = page.getByRole('button', { name: 'View Rolex Daytona', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Illustrative price history', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('img', { name: /synthetic monthly/ })).toBeVisible();
  await dialog.getByText('View monthly values').click();
  await expect(dialog.getByRole('cell', { name: '$41,000', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});
test('advisor regression: low budgets never return expensive recommendations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open watch advisor' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your watch question').fill('Rolex under 100');
  await dialog.getByRole('button', { name: 'Send question' }).click();
  await expect(dialog.getByText(/There are no watches in this demo catalogue/)).toBeVisible();
  await expect(dialog.locator('.recommendation')).toHaveCount(0);
  await dialog.getByLabel('Your watch question').fill('Rolex under $25k');
  await dialog.getByRole('button', { name: 'Send question' }).click();
  await expect(dialog.locator('.recommendation')).toHaveCount(2);
  await expect(dialog.getByText('Submariner Date', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
test('insights display sample provenance, correct statistics and downloadable CSV', async ({
  page,
}) => {
  await page.goto('/insights');
  await expect(page.getByText('Demonstration dataset', { exact: true })).toBeVisible();
  await expect(page.getByText('$80K', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /synthetic monthly/ })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export catalogue CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kyz-illustrative-catalogue.csv');
});
test('studio rejects invalid access and performs authenticated create, edit and delete', async ({
  page,
}) => {
  await page.goto('/studio');
  await page.getByLabel('Private access key').fill('invalid-test-access-key');
  await page.getByRole('button', { name: 'Enter the studio' }).click();
  await expect(page.getByText('That access key is incorrect.')).toBeVisible();
  await page.getByLabel('Private access key').fill(process.env.KYZ_E2E_TOKEN!);
  await page.getByRole('button', { name: 'Enter the studio' }).click();
  await expect(page.getByRole('button', { name: 'Add reference' })).toBeVisible();
  await page.getByRole('button', { name: 'Add reference' }).click();
  await page.getByLabel('Watch name', { exact: true }).fill('Browser test reference');
  await page.getByLabel('Watchmaker', { exact: true }).fill('Test studio');
  await page.getByLabel('Reference', { exact: true }).fill('TEST-01');
  await page.getByLabel('Movement', { exact: true }).fill('Test movement');
  await page.getByLabel('Case material').fill('Steel');
  await page.getByLabel('Description').fill('Temporary reference created by the browser test.');
  await page.getByRole('button', { name: 'Save reference' }).click();
  const row = page.locator('.studio-list article').filter({ hasText: 'Browser test reference' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Example price (USD)').fill('1250');
  await page.getByRole('button', { name: 'Save reference' }).click();
  await expect(row).toContainText('$1,250');
  await row.getByRole('button', { name: 'Delete Browser test reference' }).click();
  await row.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByLabel('Private access key')).toBeVisible();
});
for (const width of [320, 390, 768, 1440])
  test(`responsive pages stay within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/',
      '/collections',
      '/saved',
      '/compare?ids=daytona,nautilus',
      '/insights',
      '/about',
      '/studio',
    ]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        path,
      ).toBeTruthy();
    }
    await page.goto('/');
    await page.getByRole('button', { name: 'Open watch advisor' }).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
  });
for (const path of ['/', '/collections', '/insights', '/about', '/studio'])
  test(`accessibility checks: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
test('dialog accessibility and mobile menu keyboard operation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/collections');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
  await page.getByRole('button', { name: 'View Rolex Daytona', exact: true }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
test('API failures show retry and unknown routes show a helpful page', async ({ page }) => {
  await page.route('**/api/watches', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Temporarily unavailable.' }),
    }),
  );
  await page.goto('/collections');
  await expect(page.getByText('The catalogue couldn’t load')).toBeVisible();
  await page.unroute('**/api/watches');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.watch-card')).toHaveCount(10);
  await page.goto('/does-not-exist');
  await expect(page.getByText('This page has slipped out of time.')).toBeVisible();
});
