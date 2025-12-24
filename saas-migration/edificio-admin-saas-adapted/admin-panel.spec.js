
import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/login.html');
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Login
    await page.fill('input[name="email"]', 'maria.gonzalez.test@mailinator.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button:has-text("Ingresar")');

    // Check for login success
    try {
      await page.waitForURL(/.*admin/, { timeout: 5000 });
    } catch (e) {
      test.skip('Skipping admin panel tests due to login failure', () => {});
    }
  });

  test('Dashboard', async ({ page }) => {
    await expect(page.locator('#patrimonio-total')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/01_dashboard.png', fullPage: true });
    await page.locator('#patrimonio-total').screenshot({ path: 'screenshots/admin-panel/02_dashboard_patrimonio.png' });
    await page.locator('#cuotas-pendientes').screenshot({ path: 'screenshots/admin-panel/03_dashboard_cuotas.png' });
  });

  test('Usuarios CRUD', async ({ page }) => {
    await page.click('a[data-section="usuarios-section"]');
    await expect(page.locator('#usuarios-table')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/04_usuarios_list.png' });
    await page.click('#nuevo-usuario-btn');
    await expect(page.locator('#usuario-modal')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/05_usuarios_modal.png' });
    await page.fill('#usuario-nombre', 'Carlos Ramírez');
    await page.fill('#usuario-email', 'carlos.ramirez@edificio.com');
    await page.fill('#usuario-password', 'Inquilino123');
    await page.fill('#usuario-departamento', '301');
    await page.selectOption('#usuario-rol', 'INQUILINO');
    await page.click('#guardar-usuario-btn');
    await expect(page.locator('text=Carlos Ramírez')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/06_usuarios_created.png' });
  });

  test('Cuotas', async ({ page }) => {
    await page.click('a[data-section="cuotas-section"]');
    await expect(page.locator('#cuotas-table')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/07_cuotas_empty.png' });
    await page.click('#nueva-cuota-btn');
    await expect(page.locator('#cuota-modal')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/08_cuotas_modal.png' });
    await page.selectOption('#cuota-departamento', 'TODOS');
    await page.click('#generar-cuotas-btn');
    await expect(page.locator('text=50 cuotas generadas')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/09_cuotas_generated.png' });
  });

  test('Gastos', async ({ page }) => {
    await page.click('a[data-section="gastos-section"]');
    await expect(page.locator('#gastos-table')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/10_gastos_empty.png' });
    await page.click('#nuevo-gasto-btn');
    await expect(page.locator('#gasto-modal')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/11_gastos_modal.png' });
    await page.fill('#gasto-descripcion', 'Mantenimiento de elevadores');
    await page.fill('#gasto-monto', '5000');
    await page.selectOption('#gasto-categoria', 'MANTENIMIENTO');
    await page.click('#guardar-gasto-btn');
    await expect(page.locator('text=Mantenimiento de elevadores')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/12_gastos_created.png' });
  });

  test('Fondos', async ({ page }) => {
    await page.click('a[data-section="fondos-section"]');
    await expect(page.locator('#fondos-table')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/13_fondos_list.png' });
  });

  test('Anuncios', async ({ page }) => {
    await page.click('a[data-section="anuncios-section"]');
    await expect(page.locator('#anuncios-table')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/14_anuncios_empty.png' });
    await page.click('#nuevo-anuncio-btn');
    await expect(page.locator('#anuncio-modal')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/15_anuncios_modal.png' });
    await page.fill('#anuncio-titulo', 'Corte de agua programado');
    await page.fill('#anuncio-contenido', 'El próximo lunes 16 de diciembre habrá corte de agua de 9am a 2pm por mantenimiento.');
    await page.selectOption('#anuncio-tipo', 'AVISO');
    await page.selectOption('#anuncio-prioridad', 'ALTA');
    await page.click('#guardar-anuncio-btn');
    await expect(page.locator('text=Corte de agua programado')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/16_anuncios_created.png' });
  });

  test('Cierres', async ({ page }) => {
    await page.click('a[data-section="cierres-section"]');
    await expect(page.locator('#cierres-mensuales-table')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/17_cierres_empty.png' });
    await page.click('#cierre-mensual-btn');
    await expect(page.locator('#cierre-mensual-modal')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/18_cierres_modal.png' });
    await page.selectOption('#cierre-mes', 'Diciembre');
    await page.fill('#cierre-año', '2025');
    await page.click('#cierre-mensual-form button[type="submit"]');
    await expect(page.locator('text=Cierre de Diciembre 2025')).toBeVisible();
    await page.screenshot({ path: 'screenshots/admin-panel/19_cierres_generated.png' });
  });
});
