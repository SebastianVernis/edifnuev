
import { test, expect } from '@playwright/test';

test.describe('Google Navigation Test', () => {
  test('should navigate to Google and take a screenshot', async ({ page }) => {
    await page.goto('https://www.google.com');
    await page.screenshot({ path: 'screenshots-e2e/google-test.png' });
  });
});
