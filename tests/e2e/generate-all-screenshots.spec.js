import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';

// Viewports
const DESKTOP = { width: 1920, height: 1080 };
const MOBILE = { width: 375, height: 812 };

async function capture(page, role, section, action) {
    console.log(`📸 Capturing ${role}-${section}-${action}...`);
    // Desktop
    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(1000);
    await page.screenshot({
        path: `docs/screenshots/${role}/${role}-${section}-${action}-desktop.png`,
        fullPage: false
    });

    // Mobile
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(1000);
    await page.screenshot({
        path: `docs/screenshots/${role}/${role}-${section}-${action}-mobile.png`,
        fullPage: false
    });

    // Restore Desktop
    await page.setViewportSize(DESKTOP);
}

test.describe('Generación de Screenshots Profesionales', () => {

    const timestamp = Date.now();
    const adminEmail = `admin-${timestamp}@example.com`;
    const adminPass = 'Admin123!';
    const tenantEmail = `inquilino-${timestamp}@example.com`;
    const tenantPass = 'Inquilino123!';

    test('Full Flow: Registration to Tenant Dashboard', async ({ page }) => {
        test.setTimeout(240000); // 4 minutes

        // 1. REGISTRO
        console.log('--- 1. REGISTRO ---');
        await page.goto(`${BASE_URL}/register`);
        await page.fill('#fullName', 'Sebastian Admin');
        await page.fill('#email', adminEmail);
        await page.fill('#phone', '5511223344');
        await page.fill('#buildingName', 'Residencial Las Palmas');
        await page.click('label[data-plan="profesional"]');
        await capture(page, 'auth', 'register', '01-form');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=¡Registro exitoso!', { timeout: 15000 });
        await capture(page, 'auth', 'register', '02-success');

        // 2. VERIFICACIÓN OTP
        console.log('--- 2. OTP ---');
        await page.goto(`${BASE_URL}/verify-otp?email=${adminEmail}`);
        await page.waitForSelector('.otp-input');

        // Read OTP from server log
        await page.waitForTimeout(3000); // Wait for email to be logged
        const logContent = await fs.readFile('server.log', 'utf8');
        const otpMatch = logContent.match(/OTP para .* es (\d{6})/);
        const otpCode = otpMatch ? otpMatch[1] : '999999';
        console.log(`Using OTP: ${otpCode}`);

        const otpInputs = await page.$$('.otp-input');
        for (let i = 0; i < 6; i++) {
            await otpInputs[i].fill(otpCode[i]);
        }
        await capture(page, 'auth', 'otp', '01-form');
        await page.click('#verifyBtn');
        await page.waitForURL('**/checkout**', { timeout: 15000 });
        await capture(page, 'auth', 'otp', '02-success');

        // 3. CHECKOUT
        console.log('--- 3. CHECKOUT ---');
        await page.waitForSelector('#paymentProofInput', { state: 'attached' });
        const dummyFilePath = path.resolve('dummy-receipt.png');
        await fs.writeFile(dummyFilePath, 'dummy image content');
        await page.setInputFiles('#paymentProofInput', dummyFilePath);

        await capture(page, 'auth', 'checkout', '01-form');
        await page.click('#confirmBtn');
        await page.waitForSelector('text=¡Acceso Temporal Activado!', { timeout: 20000 });
        await capture(page, 'auth', 'checkout', '02-success');

        // Click modal button to go to setup
        await page.click('button:has-text("Continuar al Setup")');
        await page.waitForURL('**/setup', { timeout: 15000 });

        // 4. SETUP
        console.log('--- 4. SETUP ---');
        await page.fill('#address', 'Av. Reforma 123, CDMX');
        await page.selectOption('#buildingType', 'edificio');
        await page.fill('#adminName', 'Sebastian Admin');
        await page.fill('#adminPhone', '5511223344');
        await page.fill('#adminPassword', adminPass);
        await page.fill('#confirmPassword', adminPass);
        await page.fill('#monthlyFee', '1500');
        await page.fill('#cutoffDay', '5');

        await capture(page, 'auth', 'setup', '01-form');
        await page.click('#submitBtn');
        // Wait for redirection or modal
        await page.waitForTimeout(5000);
        if (page.url().includes('activate')) {
             await capture(page, 'auth', 'setup', '02-success');
        }

        // 5. ADMIN PANEL
        console.log('--- 5. ADMIN PANEL ---');
        await page.goto(`${BASE_URL}/login`);
        await page.fill('#email', adminEmail);
        await page.fill('#password', adminPass);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin**', { timeout: 15000 });

        // Dashboard
        await capture(page, 'admin', 'dashboard', '01-main');

        // Gestión de Inquilinos (Usuarios)
        await page.click('a[href="#usuarios"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'inquilinos', '01-list');

        // Crear Inquilino
        await page.click('#nuevo-usuario-btn');
        await page.fill('#usuario-nombre', 'Carlos Inquilino');
        await page.fill('#usuario-email', tenantEmail);
        await page.fill('#usuario-departamento', '101');
        await page.selectOption('#usuario-rol', 'INQUILINO');
        await page.fill('#usuario-password', tenantPass);
        await capture(page, 'admin', 'inquilinos', '02-create-modal');
        await page.click('#usuario-form button[type="submit"]');
        await page.waitForTimeout(2000);

        // Otros Admin Modules
        const sections = [
            { href: '#cuotas', name: 'cuotas' },
            { href: '#gastos', name: 'gastos' },
            { href: '#fondos', name: 'fondos' },
            { href: '#cierres', name: 'cierres' },
            { href: '#configuracion', name: 'configuracion' }
        ];

        for (const section of sections) {
            await page.click(`a[href="${section.href}"]`);
            await page.waitForTimeout(1500);
            await capture(page, 'admin', section.name, '01-list');
        }

        // Logout
        await page.click('#logout-btn');
        await page.waitForURL('**/login**');

        // 6. INQUILINO PANEL
        console.log('--- 6. INQUILINO PANEL ---');
        await page.fill('#email', tenantEmail);
        await page.fill('#password', tenantPass);
        await capture(page, 'auth', 'login', '01-tenant');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/inquilino**', { timeout: 15000 });

        // Dashboard
        await capture(page, 'inquilino', 'dashboard', '01-main');

        const tenantSections = [
            { href: '#cuotas', name: 'cuotas' },
            { href: '#gastos', name: 'gastos' },
            { href: '#fondos', name: 'fondos' },
            { href: '#documentos', name: 'documentos' },
            { href: '#configuracion', name: 'perfil' }
        ];

        for (const section of tenantSections) {
            await page.click(`a[href="${section.href}"]`);
            await page.waitForTimeout(1500);
            await capture(page, 'inquilino', section.name, '01-view');
        }
    });
});
