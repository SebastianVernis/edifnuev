import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para testing de Bug #2
 * Setup Form Fields - Name Attributes
 */
export default defineConfig({
  testDir: '../tests',
  testMatch: '**/*.spec.js',
  
  // Timeout configurations
  timeout: 30000, // 30 segundos por test
  expect: {
    timeout: 5000 // 5 segundos para expects
  },
  
  // Configuración de reportes
  reporter: [
    ['html', { outputFolder: '../test-reports/playwright-html' }],
    ['json', { outputFile: '../test-reports/playwright-results.json' }],
    ['list']
  ],
  
  // Configuración de screenshots y videos
  use: {
    baseURL: 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Configuración de navegador
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  
  // Proyectos de testing
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  
  // Configuración de workers
  workers: 1,
  fullyParallel: false,
  
  // Retry en caso de fallo
  retries: 1,
  
  // Output folder
  outputDir: '../test-reports/playwright-artifacts'
});
