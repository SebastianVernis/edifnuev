import { test, expect } from '@playwright/test';

const BASE_URL = 'https://edificio-production.pages.dev';
// Intentar primero las credenciales de README.md, luego las de DEMO_CREDENCIALES.md
const ADMIN_EMAIL = 'admin@edificio205.com';
const ADMIN_PASS = 'Admin2025!';
const TENANT_EMAIL = 'maria.garcia@edificio205.com';
const TENANT_PASS = 'Inquilino2025!';

const ADMIN_DEMO_EMAIL = 'admin-demo-1768698592439@demo.com';
const ADMIN_DEMO_PASS = 'AdminDemo123!';

// Viewports
const DESKTOP = { width: 1920, height: 1080 };
const MOBILE = { width: 375, height: 812 };

async function capture(page, role, section, action) {
    console.log(`📸 Capturing ${role}-${section}-${action}...`);
    // Desktop
    await page.setViewportSize(DESKTOP);
    await page.waitForTimeout(1500);
    await page.screenshot({
        path: `docs/screenshots/${role}/${role}-${section}-${action}-desktop.png`,
        fullPage: false
    });

    // Mobile
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(1500);
    await page.screenshot({
        path: `docs/screenshots/${role}/${role}-${section}-${action}-mobile.png`,
        fullPage: false
    });

    // Restore Desktop
    await page.setViewportSize(DESKTOP);
}

test.describe('Browser Testing Completo - Documentation', () => {

    test('1. Auth Flow - Registration & Login', async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `admin-test-${timestamp}@mailinator.com`;

        // Registration Page
        console.log('Navigating to register...');
        await page.goto(`${BASE_URL}/register.html`);
        await page.waitForLoadState('networkidle');
        await page.fill('#fullName', 'Juan Pérez');
        await page.fill('#email', testEmail);
        await page.fill('#phone', '5511223344');
        await page.fill('#buildingName', 'Torre Vista Hermosa');
        await page.click('label[data-plan="profesional"]');
        await capture(page, 'auth', 'register', 'form');

        // Login Page
        console.log('Navigating to login...');
        await page.goto(`${BASE_URL}/login.html`);
        await page.waitForLoadState('networkidle');
        await capture(page, 'auth', 'login', 'page');

        await page.fill('#email', ADMIN_EMAIL);
        await page.fill('#password', ADMIN_PASS);
        await capture(page, 'auth', 'login', 'filled');
    });

    test('2. Admin Panel - All Sections', async ({ page }) => {
        test.setTimeout(120000); // 2 minutes

        // Login
        console.log('Logging in as Admin...');
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('#email', ADMIN_EMAIL);
        await page.fill('#password', ADMIN_PASS);
        await page.click('button[type="submit"]');

        // Wait for either success or error
        try {
            await page.waitForURL('**/admin**', { timeout: 10000 });
        } catch (e) {
            console.log('Failed with first credentials, trying demo credentials...');
            await page.fill('#email', ADMIN_DEMO_EMAIL);
            await page.fill('#password', ADMIN_DEMO_PASS);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/admin**', { timeout: 20000 });
        }

        await page.waitForLoadState('networkidle');
        console.log('Logged in successfully');

        // Dashboard
        await capture(page, 'admin', 'dashboard', 'main');

        // Usuarios (Inquilinos)
        console.log('Navigating to Usuarios...');
        await page.click('a[href="#usuarios"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'tenants', 'list');
        await page.click('#nuevo-usuario-btn');
        await page.waitForTimeout(1000);
        await capture(page, 'admin', 'tenants', 'create-modal');
        await page.click('.close, .modal-cancel');

        // Cuotas
        console.log('Navigating to Cuotas...');
        await page.click('a[href="#cuotas"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'cuotas', 'list');
        await page.click('#generar-masivo-btn');
        await page.waitForTimeout(1000);
        await capture(page, 'admin', 'cuotas', 'massive-modal');
        await page.click('.close, .modal-cancel');

        // Gastos
        console.log('Navigating to Gastos...');
        await page.click('a[href="#gastos"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'gastos', 'list');
        await page.click('#nuevo-gasto-btn');
        await page.waitForTimeout(1000);
        await capture(page, 'admin', 'gastos', 'create-modal');
        await page.click('.close, .modal-cancel');

        // Fondos
        console.log('Navigating to Fondos...');
        await page.click('a[href="#fondos"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'fondos', 'list');
        await page.click('#transferir-fondos-btn');
        await page.waitForTimeout(1000);
        await capture(page, 'admin', 'fondos', 'transfer-modal');
        await page.click('.close, .modal-cancel');

        // Cierres
        console.log('Navigating to Cierres...');
        await page.click('a[href="#cierres"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'closures', 'list');

        // Configuración
        console.log('Navigating to Configuración...');
        await page.click('a[href="#configuracion"]');
        await page.waitForTimeout(2000);
        await capture(page, 'admin', 'profile', 'main');

        await page.click('button[data-tab="edificio"]');
        await page.waitForTimeout(1000);
        await capture(page, 'admin', 'building', 'config');

        await page.click('button[data-tab="documentos"]');
        await page.waitForTimeout(1000);
        await capture(page, 'admin', 'documents', 'list');
    });

    test('3. Tenant Panel - All Sections', async ({ page }) => {
        test.setTimeout(120000);

        // Login
        console.log('Logging in as Tenant...');
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('#email', TENANT_EMAIL);
        await page.fill('#password', TENANT_PASS);
        await page.click('button[type="submit"]');

        try {
            await page.waitForURL('**/inquilino**', { timeout: 20000 });
        } catch (e) {
            console.log('Tenant login failed, check credentials');
            await page.screenshot({ path: 'docs/screenshots/tenant-login-error.png' });
            throw e;
        }

        await page.waitForLoadState('networkidle');
        console.log('Logged in as tenant successfully');

        // Dashboard
        await capture(page, 'inquilino', 'dashboard', 'main');

        // Mis Cuotas
        await page.click('a[href="#cuotas"]');
        await page.waitForTimeout(2000);
        await capture(page, 'inquilino', 'cuotas', 'list');

        // Gastos Edificio
        await page.click('a[href="#gastos"]');
        await page.waitForTimeout(2000);
        await capture(page, 'inquilino', 'gastos', 'view');

        // Fondos Edificio
        await page.click('a[href="#fondos"]');
        await page.waitForTimeout(2000);
        await capture(page, 'inquilino', 'fondos', 'view');

        // Documentos
        await page.click('a[href="#documentos"]');
        await page.waitForTimeout(2000);
        await capture(page, 'inquilino', 'documents', 'list');

        // Mi Perfil
        await page.click('a[href="#configuracion"]');
        await page.waitForTimeout(2000);
        await capture(page, 'inquilino', 'profile', 'edit');
    });

});
