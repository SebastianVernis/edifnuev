import { test, expect } from '@playwright/test';

const stagingUrl = 'https://chispartbuilding.pages.dev';
const inquilinoUser = { email: 'maria.garcia@edificio205.com', password: 'Gemelo1' };

const takeScreenshot = async (page, role, section, action) => {
  const screenshotPath = `docs/screenshots/${role}/${section}-${action}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
};

test.describe('Inquilino Panel Flows', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${stagingUrl}/login`);
    await page.fill('input[name="email"]', inquilinoUser.email);
    await page.fill('input[name="password"]', inquilinoUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${stagingUrl}/inquilino.html`, { timeout: 15000 });
  });

  test('should display the inquilino dashboard with personal metrics', async () => {
    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'inquilino', 'dashboard', 'metrics-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'inquilino', 'dashboard', 'metrics-mobile');

    // Add assertions to verify the presence of key metrics
    await expect(page.locator('.personal-metric')).toHaveCount(3); // Assuming there are 3 personal metric cards
  });
});
