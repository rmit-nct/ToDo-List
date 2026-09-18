import { chromium, expect } from '@playwright/test';
const base = process.env.TEST_URL || 'http://localhost:3100';
const username = process.env.QA_USERNAME || 'restored-qa';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${base}/account`);
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['dark', 'light']) {
      const button = page.getByRole('button', { name: theme === 'dark' ? 'Dark' : 'Light', exact: true });
      if (await button.count()) await button.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const palette = await page.locator('.account-form').evaluate(card => {
        const style = getComputedStyle(card);
        const input = getComputedStyle(card.querySelector('input'));
        return { bg: style.backgroundColor, fg: style.color, inputBg: input.backgroundColor, inputFg: input.color,
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(palette.overflow).toBe(false);
      if (theme === 'dark') expect(palette.bg).toBe('rgb(33, 31, 46)');
      else expect(palette.bg).toBe('rgb(255, 255, 255)');
      expect(palette.fg).not.toBe(palette.bg);
      await page.screenshot({ path: `/tmp/nct-username-${theme}-${width}.png`, fullPage: true });
    }
  }
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: `Welcome, ${username}.`, exact: true })).toBeVisible({ timeout: 30000 });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  if (!process.env.QA_USERNAME) {
    await page.getByRole('button', { name: 'Restored workspace', exact: false }).click();
    await expect(page.getByRole('heading', { name: 'Today Dashboard', exact: true })).toBeVisible();
    await expect(page.getByText('Restored task', { exact: true }).first()).toBeVisible();
    await page.goto(`${base}/account`);
  }
  if (process.env.QA_USERNAME) {
    const account = await (await page.request.get(`${base}/api/users/me`)).json();
    if (account.username !== username) throw new Error('Cleanup identity mismatch');
    const deletion = await page.request.delete(`${base}/api/users/me`, { headers: { Origin: base }, data: { confirmation: 'DELETE', username } });
    expect(deletion.status()).toBe(200);
    await page.goto(`${base}/account`);
  } else {
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  }
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  console.log('Username sign-in, workspace selection, reload, logout, and desktop/mobile theme QA passed');
} finally { await browser.close(); }
