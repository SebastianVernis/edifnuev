import { test, expect, devices } from '@playwright/test';

const stagingUrl = 'https://chispartbuilding.pages.dev';

const users = {
  admin: { email: 'admin@edificio205.com', password: 'Gemelo1' },
  comite: { email: 'comite@edificio205.com', password: 'Gemelo1' },
  inquilino: { email: 'maria.garcia@edificio205.com', password: 'Gemelo1' }
};

const takeScreenshot = async (page, role, section, action) => {
  const screenshotPath = `docs/screenshots/${role}/${section}-${action}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
};

test.describe('Authentication Flow', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(stagingUrl);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should login and logout successfully', async () => {
    await page.goto(`${stagingUrl}/login`);

    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'auth', 'login', 'page-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'auth', 'login', 'page-mobile');

    await page.fill('input[name="email"]', users.admin.email);
    await page.fill('input[name="password"]', users.admin.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${stagingUrl}/admin/dashboard`, { timeout: 15000 });

    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'admin', 'dashboard', 'login-success-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'admin', 'dashboard', 'login-success-mobile');

    await page.click('#logout-button'); // Assuming a logout button with this ID
    await expect(page).toHaveURL(`${stagingUrl}/login`);
  });

  test('should fail to login with invalid credentials', async () => {
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Error');
      await dialog.accept();
    });

    await page.goto(`${stagingUrl}/login`);
    await page.fill('input[name="email"]', 'invalid@user.com');
    await page.fill('input[name="password"]', 'invalidpassword');
    await page.click('button[type="submit"]');

    // Wait for the alert to be handled
    await page.waitForEvent('dialog');

    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'auth', 'login', 'invalid-credentials-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'auth', 'login', 'invalid-credentials-mobile');
  });
});
