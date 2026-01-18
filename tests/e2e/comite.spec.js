import { test, expect } from '@playwright/test';

const stagingUrl = 'https://chispartbuilding.pages.dev';
const comiteUser = { email: 'comite@edificio205.com', password: 'Gemelo1' };

const takeScreenshot = async (page, role, section, action) => {
  const screenshotPath = `docs/screenshots/${role}/${section}-${action}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
};

test.describe('Comite Panel Flows', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${stagingUrl}/login`);
    await page.fill('input[name="email"]', comiteUser.email);
    await page.fill('input[name="password"]', comiteUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${stagingUrl}/admin.html`, { timeout: 15000 });
  });

  test('should display the comite dashboard', async () => {
    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'comite', 'dashboard', 'page-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'comite', 'dashboard', 'page-mobile');

    // Add assertions to verify the presence of key elements on the dashboard
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });
});
