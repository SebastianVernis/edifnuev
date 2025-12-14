
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

function getOTP() {
  try {
    const otp = execSync('npx wrangler d1 execute edificio_admin_db --remote --command="SELECT code FROM otp_codes ORDER BY created_at DESC LIMIT 1" | tail -n 1').toString().trim();
    if (!otp || otp.length !== 6) {
      throw new Error('Failed to fetch a valid OTP.');
    }
    return otp;
  } catch (error) {
    console.error('Error fetching OTP:', error.message);
    return null;
  }
}

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/');
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Full Onboarding', async ({ page }) => {
    const otp = getOTP();
    test.skip(otp === null, 'Skipping OTP test due to missing CLOUDFLARE_API_TOKEN');

    // Landing Page
    await page.screenshot({ path: 'screenshots/onboarding/01_landing_page.png', fullPage: true });
    await page.locator('#features').screenshot({ path: 'screenshots/onboarding/02_landing_features.png' });
    await page.locator('#pricing').screenshot({ path: 'screenshots/onboarding/03_landing_pricing.png' });
    await page.screenshot({ path: 'screenshots/onboarding/04_landing_console.png' });

    await page.click('text=Comenzar Gratis');
    await expect(page).toHaveURL(/.*registro/);
    await page.screenshot({ path: 'screenshots/onboarding/05_registro_redirect.png' });

    // Registro
    await page.screenshot({ path: 'screenshots/onboarding/06_registro_form.png' });
    await page.click('text=Profesional');
    await page.screenshot({ path: 'screenshots/onboarding/07_registro_plan_selected.png' });

    await page.fill('#fullName', 'María González');
    await page.fill('#email', 'maria.gonzalez.test@mailinator.com');
    await page.fill('#phone', '5512345678');
    await page.fill('#buildingName', 'Torre del Valle');

    await page.screenshot({ path: 'screenshots/onboarding/08_registro_console_before.png' });

    await page.click('button:has-text("Continuar")');

    await page.waitForSelector('text=Registro exitoso', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/onboarding/09_registro_console_after.png' });

    await page.waitForURL(/.*verificar-otp/, { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/onboarding/10_registro_otp_redirect.png' });

    // OTP Verification
    await page.screenshot({ path: 'screenshots/onboarding/11_otp_page.png' });

    await page.fill('input[aria-label="Digit 1"]', otp[0]);
    await page.fill('input[aria-label="Digit 2"]', otp[1]);
    await page.fill('input[aria-label="Digit 3"]', otp[2]);
    await page.fill('input[aria-label="Digit 4"]', otp[3]);
    await page.fill('input[aria-label="Digit 5"]', otp[4]);
    await page.fill('input[aria-label="Digit 6"]', otp[5]);

    await page.screenshot({ path: 'screenshots/onboarding/12_otp_entered.png' });

    await page.waitForURL(/.*checkout/, { timeout: 20000 });
    await page.screenshot({ path: 'screenshots/onboarding/13_checkout_redirect.png' });

    // Checkout
    await page.screenshot({ path: 'screenshots/onboarding/14_checkout_form.png' });
    await page.fill('input[name="cardName"]', 'MARIA GONZALEZ');
    await page.fill('input[name="cardNumber"]', '4242 4242 4242 4242');
    await page.fill('input[name="expiryDate"]', '12/28');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="postalCode"]', '12345');
    await page.screenshot({ path: 'screenshots/onboarding/15_checkout_filled.png' });

    await page.click('button:has-text("Procesar pago")');

    await page.waitForSelector('text=Pago exitoso', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/onboarding/16_checkout_success.png' });

    await page.waitForURL(/.*setup-edificio/, { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/onboarding/17_setup_redirect.png' });

    // Building Setup
    await page.screenshot({ path: 'screenshots/onboarding/18_setup_form.png' });
    await page.fill('input[name="buildingAddress"]', 'Av. Insurgentes Sur 1234, Col. Del Valle, Ciudad de México, CP 03100');
    await page.fill('input[name="totalUnits"]', '50');
    await page.selectOption('select[name="buildingType"]', 'Edificio');

    await page.fill('input[name="adminName"]', 'María González');
    await page.fill('input[name="adminPhone"]', '5512345678');
    await page.fill('input[name="adminPassword"]', 'Admin123!');
    await page.fill('input[name="adminPasswordConfirm"]', 'Admin123!');

    await page.click('button:has-text("Usar plantilla básica")');
    await page.click('button:has-text("Usar plantilla de privacidad")');

    await page.click('button:has-text("Agregar fondo")');
    await page.fill('input[name="fundName[]"]', 'Fondo de Reserva');
    await page.fill('input[name="fundAmount[]"]', '50000');

    await page.click('button:has-text("Completar configuración")');

    await page.waitForSelector('text=Configuración completada', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/onboarding/19_setup_success.png' });
  });
});
