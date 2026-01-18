import { test, expect } from '@playwright/test';

const stagingUrl = 'https://chispartbuilding.pages.dev';
const adminUser = { email: 'admin@edificio205.com', password: 'Admin2025!' };

const takeScreenshot = async (page, role, section, action) => {
  const screenshotPath = `docs/screenshots/${role}/${section}-${action}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
};

test.describe('Admin Panel Flows', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${stagingUrl}/login`);
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${stagingUrl}/admin/dashboard`, { timeout: 15000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display the admin dashboard with metrics', async () => {
    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'admin', 'dashboard', 'metrics-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'admin', 'dashboard', 'metrics-mobile');

    // Add assertions to verify the presence of key metrics
    await expect(page.locator('.metric-card')).toHaveCount(4); // Assuming there are 4 metric cards
  });

  // I will add more tests for other admin flows here in subsequent steps.
});
