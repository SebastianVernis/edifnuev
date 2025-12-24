
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 120000, // 2 minutes
  use: {
    ...devices['Desktop Chrome'],
    ignoreHTTPSErrors: true,
  },
});
