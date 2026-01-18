import { test, expect } from '@playwright/test';

const stagingUrl = 'https://chispartbuilding.pages.dev';

const takeScreenshot = async (page, role, section, action) => {
  const screenshotPath = `docs/screenshots/${role}/${section}-${action}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
};

test.describe('Registration and Initial Setup Flow', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(stagingUrl);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should complete the registration and initial setup', async () => {
    await page.goto(`${stagingUrl}/register`);

    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'auth', 'register', 'page-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'auth', 'register', 'page-mobile');

    await takeScreenshot(page, 'auth', 'register', 'debug-before-fill');

    // The form is different from what the test expected.
    // The screenshot shows "Nombre completo", "Email", "Teléfono", "Nombre del edificio/condominio"
    // and a plan selection. There are no password fields.
    await page.fill('#fullName', 'Test User');
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#phone', '1234567890');
    await page.fill('#buildingName', 'Test Building');

    // Clicking the "Básico" plan
    await page.click('text=Básico');

    await page.click('button:has-text("Continuar")');

    // The next step is likely OTP verification or password creation.
    // Since the exact flow is unknown, we will just expect the URL to change.
    await expect(page).not.toHaveURL(`${stagingUrl}/register`);

    // Desktop Screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'auth', 'verify-otp', 'page-desktop');

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await takeScreenshot(page, 'auth', 'verify-otp', 'page-mobile');

    // This is a placeholder for the OTP verification.
    // In a real-world scenario, you would need to fetch the OTP from an email or a database.
    await page.fill('input[name="otp"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${stagingUrl}/initial-setup`);

    // Initial Setup Steps
    // These are placeholders, as the exact implementation of the initial setup is not specified.
    await page.fill('input[name="buildingName"]', 'Test Building');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${stagingUrl}/setup-funds`);
    await page.fill('input[name="fundName"]', 'Test Fund');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${stagingUrl}/setup-fees`);
    await page.fill('input[name="feeName"]', 'Test Fee');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${stagingUrl}/setup-complete`);
  });
});
