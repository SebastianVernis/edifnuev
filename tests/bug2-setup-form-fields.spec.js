/**
 * 🧪 TEST BUG #2: Timeout en campo password de setup
 * 
 * OBJETIVO: Validar que todos los campos del formulario setup-edificio.html
 * tienen el atributo 'name' y son accesibles sin timeout.
 * 
 * BUG CORREGIDO: Commit 72f7c03
 * - Agregado name="password" a input adminPassword
 * - Agregado name a todos los campos del formulario
 * 
 * CRITERIOS DE ÉXITO:
 * ✅ Todos los campos son accesibles por selector name
 * ✅ No hay timeout al llenar campo password
 * ✅ Formulario completo se puede llenar sin errores
 */

import { test, expect } from '@playwright/test';

const SETUP_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/setup-edificio.html';

test.describe('Bug #2: Setup Form Fields - Name Attributes', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de setup
    await page.goto(SETUP_URL);
    
    // Simular sesión válida de onboarding
    await page.evaluate(() => {
      localStorage.setItem('onboarding_email', 'test@example.com');
      localStorage.setItem('checkout_completed', 'true');
    });
    
    // Recargar para aplicar localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('✅ Todos los campos de edificio tienen atributo name', async ({ page }) => {
    console.log('🔍 Validando campos de edificio...');
    
    // Campo: Nombre del edificio
    const buildingName = page.locator('input[name="buildingName"]');
    await expect(buildingName).toBeVisible({ timeout: 5000 });
    await buildingName.fill('Torre del Valle');
    console.log('✅ buildingName: OK');
    
    // Campo: Dirección
    const address = page.locator('textarea[name="address"]');
    await expect(address).toBeVisible({ timeout: 5000 });
    await address.fill('Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, 03100');
    console.log('✅ address: OK');
    
    // Campo: Total de unidades
    const totalUnits = page.locator('input[name="totalUnits"]');
    await expect(totalUnits).toBeVisible({ timeout: 5000 });
    await totalUnits.fill('50');
    console.log('✅ totalUnits: OK');
    
    // Campo: Tipo de edificio
    const buildingType = page.locator('select[name="buildingType"]');
    await expect(buildingType).toBeVisible({ timeout: 5000 });
    await buildingType.selectOption('edificio');
    console.log('✅ buildingType: OK');
    
    console.log('✅ SECCIÓN EDIFICIO: Todos los campos accesibles');
  });

  test('⭐ Campo password accesible SIN TIMEOUT (Bug #2 Fix)', async ({ page }) => {
    console.log('🔍 Validando campos de administrador (Bug #2)...');
    
    // Primero llenar campos de edificio para avanzar
    await page.locator('input[name="buildingName"]').fill('Torre del Valle');
    await page.locator('textarea[name="address"]').fill('Av. Insurgentes Sur 1234');
    await page.locator('input[name="totalUnits"]').fill('50');
    await page.locator('select[name="buildingType"]').selectOption('edificio');
    
    // Campo: Nombre del administrador
    const adminName = page.locator('input[name="adminName"]');
    await expect(adminName).toBeVisible({ timeout: 5000 });
    await adminName.fill('María González');
    console.log('✅ adminName: OK');
    
    // Campo: Teléfono
    const adminPhone = page.locator('input[name="adminPhone"]');
    await expect(adminPhone).toBeVisible({ timeout: 5000 });
    await adminPhone.fill('5512345678');
    console.log('✅ adminPhone: OK');
    
    // ⭐ CAMPO CRÍTICO: Password (causaba timeout antes del fix)
    const password = page.locator('input[name="password"]');
    await expect(password).toBeVisible({ timeout: 5000 });
    await password.fill('Admin123!');
    console.log('⭐ password: OK (BUG #2 CORREGIDO)');
    
    // Campo: Confirmar password
    const confirmPassword = page.locator('input[name="confirmPassword"]');
    await expect(confirmPassword).toBeVisible({ timeout: 5000 });
    await confirmPassword.fill('Admin123!');
    console.log('✅ confirmPassword: OK');
    
    console.log('✅ SECCIÓN ADMIN: Todos los campos accesibles SIN TIMEOUT');
  });

  test('✅ Todos los campos de cuotas tienen atributo name', async ({ page }) => {
    console.log('🔍 Validando campos de cuotas...');
    
    // Llenar secciones previas
    await page.locator('input[name="buildingName"]').fill('Torre del Valle');
    await page.locator('textarea[name="address"]').fill('Av. Insurgentes Sur 1234');
    await page.locator('input[name="totalUnits"]').fill('50');
    await page.locator('select[name="buildingType"]').selectOption('edificio');
    await page.locator('input[name="adminName"]').fill('María González');
    await page.locator('input[name="adminPhone"]').fill('5512345678');
    await page.locator('input[name="password"]').fill('Admin123!');
    await page.locator('input[name="confirmPassword"]').fill('Admin123!');
    
    // Campo: Cuota mensual
    const monthlyFee = page.locator('input[name="monthlyFee"]');
    await expect(monthlyFee).toBeVisible({ timeout: 5000 });
    await monthlyFee.fill('1500');
    console.log('✅ monthlyFee: OK');
    
    // Campo: Día de corte
    const cutoffDay = page.locator('input[name="cutoffDay"]');
    await expect(cutoffDay).toBeVisible({ timeout: 5000 });
    await cutoffDay.fill('5');
    console.log('✅ cutoffDay: OK');
    
    // Campo: Días de gracia
    const paymentDueDays = page.locator('input[name="paymentDueDays"]');
    await expect(paymentDueDays).toBeVisible({ timeout: 5000 });
    await paymentDueDays.fill('5');
    console.log('✅ paymentDueDays: OK');
    
    // Campo: Porcentaje de recargo
    const lateFeePercent = page.locator('input[name="lateFeePercent"]');
    await expect(lateFeePercent).toBeVisible({ timeout: 5000 });
    await lateFeePercent.fill('2.5');
    console.log('✅ lateFeePercent: OK');
    
    console.log('✅ SECCIÓN CUOTAS: Todos los campos accesibles');
  });

  test('🎯 VALIDACIÓN COMPLETA: Formulario completo sin timeout', async ({ page }) => {
    console.log('🔍 Validando formulario completo...');
    
    const startTime = Date.now();
    
    // SECCIÓN 1: Edificio
    await page.locator('input[name="buildingName"]').fill('Torre del Valle');
    await page.locator('textarea[name="address"]').fill('Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, 03100');
    await page.locator('input[name="totalUnits"]').fill('50');
    await page.locator('select[name="buildingType"]').selectOption('edificio');
    console.log('✅ Sección 1: Edificio completada');
    
    // SECCIÓN 2: Administrador (incluye password - Bug #2)
    await page.locator('input[name="adminName"]').fill('María González');
    await page.locator('input[name="adminPhone"]').fill('5512345678');
    await page.locator('input[name="password"]').fill('Admin123!');
    await page.locator('input[name="confirmPassword"]').fill('Admin123!');
    console.log('✅ Sección 2: Administrador completada (password OK)');
    
    // SECCIÓN 3: Cuotas
    await page.locator('input[name="monthlyFee"]').fill('1500');
    await page.locator('input[name="cutoffDay"]').fill('5');
    await page.locator('input[name="paymentDueDays"]').fill('5');
    await page.locator('input[name="lateFeePercent"]').fill('2.5');
    console.log('✅ Sección 3: Cuotas completada');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log('🎉 FORMULARIO COMPLETO LLENADO SIN TIMEOUT');
    
    // Verificar que no hubo timeout (debería ser < 10 segundos)
    expect(duration).toBeLessThan(10000);
  });

  test('🔍 Verificación de selectores - Todos los campos existen', async ({ page }) => {
    console.log('🔍 Verificando que todos los selectores name existen...');
    
    const selectors = [
      'input[name="buildingName"]',
      'textarea[name="address"]',
      'input[name="totalUnits"]',
      'select[name="buildingType"]',
      'input[name="adminName"]',
      'input[name="adminPhone"]',
      'input[name="password"]',
      'input[name="confirmPassword"]',
      'input[name="monthlyFee"]',
      'input[name="cutoffDay"]',
      'input[name="paymentDueDays"]',
      'input[name="lateFeePercent"]'
    ];
    
    for (const selector of selectors) {
      const element = page.locator(selector);
      await expect(element).toBeAttached({ timeout: 5000 });
      console.log(`✅ ${selector}: Existe en DOM`);
    }
    
    console.log('✅ TODOS LOS SELECTORES VALIDADOS');
  });

  test('📸 Captura de pantalla - Formulario completo', async ({ page }) => {
    console.log('📸 Capturando screenshot del formulario completo...');
    
    // Llenar formulario completo
    await page.locator('input[name="buildingName"]').fill('Torre del Valle');
    await page.locator('textarea[name="address"]').fill('Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, 03100');
    await page.locator('input[name="totalUnits"]').fill('50');
    await page.locator('select[name="buildingType"]').selectOption('edificio');
    await page.locator('input[name="adminName"]').fill('María González');
    await page.locator('input[name="adminPhone"]').fill('5512345678');
    await page.locator('input[name="password"]').fill('Admin123!');
    await page.locator('input[name="confirmPassword"]').fill('Admin123!');
    await page.locator('input[name="monthlyFee"]').fill('1500');
    await page.locator('input[name="cutoffDay"]').fill('5');
    await page.locator('input[name="paymentDueDays"]').fill('5');
    await page.locator('input[name="lateFeePercent"]').fill('2.5');
    
    // Capturar screenshot
    await page.screenshot({ 
      path: 'test-reports/BUG2-FIXED-setup-all-fields.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot guardado: test-reports/BUG2-FIXED-setup-all-fields.png');
  });
});
