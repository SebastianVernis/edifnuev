
import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

test.describe('SaaS E2E Testing', () => {
  test('Full user flow from registration to admin panel CRUD', async ({ page }) => {
    // Create screenshot directories
    await test.step('Create screenshot directories', async () => {
      const dirs = [
        'screenshots-e2e/checkout',
        'screenshots-e2e/setup',
        'screenshots-e2e/usuarios',
        'screenshots-e2e/cuotas',
        'screenshots-e2e/gastos',
        'screenshots-e2e/fondos',
        'screenshots-e2e/anuncios',
        'screenshots-e2e/cierres',
        'screenshots-e2e/validacion'
      ];
      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }
    });

    // 1. Registration
    await test.step('Registration', async () => {
      await page.goto('https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/registro');
      await page.waitForLoadState('networkidle');
      await page.type('input[name="fullName"]', 'María González', { delay: 100 });
      await page.type('input[name="email"]', 'maria.test@mailinator.com', { delay: 100 });
      await page.type('input[name="phone"]', '5512345678', { delay: 100 });
      await page.type('input[name="buildingName"]', 'Torre del Valle', { delay: 100 });
      await page.click('div.card[data-plan="profesional"]');
      await page.screenshot({ path: 'screenshots-e2e/01-registro-form-filled.png' });
      await page.click('button[type="submit"]');
      await expect(page.locator('text=¡Registro exitoso!')).toBeVisible();
      await page.screenshot({ path: 'screenshots-e2e/02-registro-success.png' });
    });

    // 2. Skip OTP
    await test.step('Skip OTP', async () => {
      await page.goto('https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/checkout.html');
    });

    // 3. Checkout
    await test.step('Checkout', async () => {
      await page.fill('input[name="card-number"]', '4242424242424242');
      await page.fill('input[name="expiry-date"]', '12/28');
      await page.fill('input[name="cvv"]', '123');
      await page.fill('input[name="name"]', 'María González');
      await page.fill('input[name="postal-code"]', '12345');
      await page.screenshot({ path: 'screenshots-e2e/checkout/03-checkout-form-filled.png' });
      await page.click('button[type="submit"]');
      await expect(page.locator('text=¡Pago procesado exitosamente!')).toBeVisible();
      await page.screenshot({ path: 'screenshots-e2e/checkout/04-checkout-success.png' });
    });

    // 4. Setup Edificio
    await test.step('Setup Edificio', async () => {
        await page.waitForURL('**/setup-edificio.html');

        // Step 1: Building Information
        await page.fill('#building-name', 'Torre del Valle');
        await page.fill('#building-address', 'Av. Insurgentes Sur 1234, Col. Del Valle, Ciudad de México, CP 03100');
        await page.selectOption('#building-type', 'Edificio');
        await page.fill('#total-units', '50');
        await page.screenshot({ path: 'screenshots-e2e/setup/05-setup-step1-building-info.png' });
        await page.click('button:has-text("Siguiente")');

        // Step 2: Admin Information
        await page.fill('#admin-name', 'María González');
        await page.fill('#admin-phone', '5512345678');
        await page.fill('#admin-password', 'Admin123!');
        await page.fill('#admin-password-confirm', 'Admin123!');
        await page.screenshot({ path: 'screenshots-e2e/setup/06-setup-step2-admin-info.png' });
        await page.click('button:has-text("Siguiente")');

        // Step 3: Documents and Funds
        // Add Funds
        await page.click('button:has-text("Agregar Fondo")');
        await page.click('button:has-text("Agregar Fondo")');
        await page.locator('input[name="fund-name"]').nth(0).fill('Fondo de Reserva');
        await page.locator('input[name="fund-amount"]').nth(0).fill('50000');
        await page.locator('input[name="fund-name"]').nth(1).fill('Fondo de Mantenimiento');
        await page.locator('input[name="fund-amount"]').nth(1).fill('25000');
        await page.locator('input[name="fund-name"]').nth(2).fill('Fondo de Emergencias');
        await page.locator('input[name="fund-amount"]').nth(2).fill('15000');
        await page.screenshot({ path: 'screenshots-e2e/setup/07-setup-step3-funds.png' });
        await page.click('button:has-text("Siguiente")');

        // Step 4: Fees and Configuration
        await page.fill('#monthly-fee', '1500');
        await page.fill('#extraordinary-fee', '500');
        await page.fill('#cutoff-day', '5');
        await page.fill('#grace-days', '5');
        await page.fill('#late-fee-percent', '2.5');
        await page.screenshot({ path: 'screenshots-e2e/setup/08-setup-step4-fees.png' });

        // Final submission
        await page.click('button:has-text("Completar Configuración")');
        await expect(page.locator('text=¡Configuración completada exitosamente!')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/setup/09-setup-success.png' });
    });

    // 5. Admin Panel Login
    await test.step('Admin Panel Login', async () => {
        await page.waitForURL('**/login.html');
        await page.fill('input[name="email"]', 'maria.test@mailinator.com');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/10-admin-dashboard.png' });
    });

    // 6. Usuarios CRUD
    await test.step('Usuarios CRUD', async () => {
        await page.click('a[href="#usuarios"]');
        await expect(page.locator('h2:has-text("Usuarios")')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/usuarios/11-usuarios-list.png' });

        // Create new user
        await page.click('button:has-text("Nuevo Usuario")');
        await page.fill('input[name="nombre"]', 'Carlos Ramírez');
        await page.fill('input[name="email"]', 'carlos.ramirez@edificio.com');
        await page.fill('input[name="password"]', 'Inquilino123');
        await page.fill('input[name="departamento"]', '301');
        await page.selectOption('select[name="rol"]', 'INQUILINO');
        await page.fill('input[name="telefono"]', '5587654321');
        await page.screenshot({ path: 'screenshots-e2e/usuarios/12-usuarios-create-modal.png' });
        await page.click('button:has-text("Guardar")');
        await expect(page.locator('text=Usuario creado exitosamente')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/usuarios/13-usuarios-create-success.png' });

        // Edit user
        await page.click('button.btn-edit');
        await page.fill('input[name="telefono"]', '5511223344');
        await page.screenshot({ path: 'screenshots-e2e/usuarios/14-usuarios-edit-modal.png' });
        await page.click('button:has-text("Actualizar")');
        await expect(page.locator('text=Usuario actualizado exitosamente')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/usuarios/15-usuarios-edit-success.png' });

        // Delete user
        await page.click('button.btn-delete');
        await page.screenshot({ path: 'screenshots-e2e/usuarios/16-usuarios-delete-confirm.png' });
        await page.click('button:has-text("Confirmar")');
        await expect(page.locator('text=Usuario eliminado exitosamente')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/usuarios/17-usuarios-delete-success.png' });
    });

    // 7. Cuotas CRUD
    await test.step('Cuotas CRUD', async () => {
        await page.click('a[href="#cuotas"]');
        await expect(page.locator('h2:has-text("Cuotas")')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/cuotas/18-cuotas-list-empty.png' });

        // Generate massive fees
        await page.click('button:has-text("Nueva Cuota")');
        await page.selectOption('select[name="mes"]', 'Diciembre');
        await page.selectOption('select[name="anio"]', '2025');
        await page.fill('input[name="monto"]', '1500');
        await page.selectOption('select[name="departamento"]', 'TODOS');
        await page.fill('input[name="fechaVencimiento"]', '2025-12-05');
        await page.screenshot({ path: 'screenshots-e2e/cuotas/19-cuotas-generate-modal.png' });
        await page.click('button:has-text("Generar Cuotas")');
        await expect(page.locator('text=50 cuotas generadas exitosamente')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/cuotas/20-cuotas-generate-success.png' });
        await expect(page.locator('tbody tr')).toHaveCount(50);
        await page.screenshot({ path: 'screenshots-e2e/cuotas/64-cuotas-generated-50.png' });

        // Mark a fee as paid
        await page.click('button.btn-pagar:first-of-type');
        await page.screenshot({ path: 'screenshots-e2e/cuotas/21-cuotas-pay-confirm.png' });
        await page.click('button:has-text("Confirmar Pago")');
        await expect(page.locator('text=Cuota marcada como pagada')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/cuotas/22-cuotas-pay-success.png' });
    });

    // 8. Gastos CRUD
    await test.step('Gastos CRUD', async () => {
        await page.click('a[href="#gastos"]');
        await expect(page.locator('h2:has-text("Gastos")')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/gastos/23-gastos-list-empty.png' });

        // Create 3 expenses
        const gastos = [
            { desc: 'Mantenimiento de elevadores', monto: '5000', cat: 'MANTENIMIENTO', prov: 'Elevadores S.A.' },
            { desc: 'Servicio de limpieza mensual', monto: '8000', cat: 'SERVICIOS', prov: 'Limpieza Total' },
            { desc: 'Pago de agua', monto: '3500', cat: 'SERVICIOS', prov: 'CDMX Agua' }
        ];

        for (const gasto of gastos) {
            await page.click('button:has-text("Nuevo Gasto")');
            await page.fill('input[name="descripcion"]', gasto.desc);
            await page.fill('input[name="monto"]', gasto.monto);
            await page.selectOption('select[name="categoria"]', gasto.cat);
            await page.fill('input[name="proveedor"]', gasto.prov);
            await page.click('button:has-text("Guardar")');
            await expect(page.locator('text=Gasto creado exitosamente')).toBeVisible();
        }
        await page.screenshot({ path: 'screenshots-e2e/gastos/24-gastos-list-3.png' });

        // Verify total calculation
        await expect(page.locator('text=Total de Gastos: $16,500.00')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/gastos/73-gastos-total-calculation.png' });
    });

    // 9. Fondos CRUD
    await test.step('Fondos CRUD', async () => {
        await page.click('a[href="#fondos"]');
        await expect(page.locator('h2:has-text("Fondos y Patrimonio")')).toBeVisible();
        await expect(page.locator('tbody tr')).toHaveCount(3);
        await page.screenshot({ path: 'screenshots-e2e/fondos/77-fondos-list-3.png' });

        // Perform a transfer
        await page.click('button:has-text("Transferir")');
        await page.selectOption('select[name="fromFund"]', 'Fondo de Reserva');
        await page.selectOption('select[name="toFund"]', 'Fondo de Mantenimiento');
        await page.fill('input[name="amount"]', '10000');
        await page.fill('input[name="concept"]', 'Ajuste de fondos');
        await page.screenshot({ path: 'screenshots-e2e/fondos/78-fondos-transfer-modal.png' });
        await page.click('button:has-text("Confirmar Transferencia")');
        await expect(page.locator('text=Transferencia realizada exitosamente')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/fondos/79-fondos-transfer-success.png' });

        // Verify patrimonio is unchanged
        await expect(page.locator('text=Patrimonio Total: $90,000.00')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/fondos/80-fondos-patrimonio-unchanged.png' });
    });

    // 10. Anuncios CRUD
    await test.step('Anuncios CRUD', async () => {
        await page.click('a[href="#anuncios"]');
        await expect(page.locator('h2:has-text("Anuncios")')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/anuncios/81-anuncios-list-empty.png' });

        // Create 2 announcements
        const anuncios = [
            { titulo: 'Corte de agua programado', cont: 'El próximo lunes 16 de diciembre habrá corte de agua...', tipo: 'AVISO', prio: 'ALTA' },
            { titulo: 'Reunión de condóminos', cont: 'Se convoca a asamblea general el día 20 de diciembre...', tipo: 'ASAMBLEA', prio: 'NORMAL' }
        ];

        for (const anuncio of anuncios) {
            await page.click('button:has-text("Nuevo Anuncio")');
            await page.fill('input[name="titulo"]', anuncio.titulo);
            await page.fill('textarea[name="contenido"]', anuncio.cont);
            await page.selectOption('select[name="tipo"]', anuncio.tipo);
            await page.selectOption('select[name="prioridad"]', anuncio.prio);
            await page.click('button:has-text("Guardar")');
            await expect(page.locator('text=Anuncio creado exitosamente')).toBeVisible();
        }
        await page.screenshot({ path: 'screenshots-e2e/anuncios/82-anuncios-list-2.png' });
    });

    // 11. Cierres CRUD
    await test.step('Cierres CRUD', async () => {
        await page.click('a[href="#cierres"]');
        await expect(page.locator('h2:has-text("Cierres")')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/cierres/83-cierres-list-empty.png' });

        // Generate a closing
        await page.click('button:has-text("Generar Cierre")');
        await page.selectOption('select[name="mes"]', 'Diciembre');
        await page.selectOption('select[name="anio"]', '2025');
        await page.selectOption('select[name="tipo"]', 'MENSUAL');
        await page.screenshot({ path: 'screenshots-e2e/cierres/84-cierres-generate-modal.png' });
        await page.click('button:has-text("Generar")');
        await expect(page.locator('text=Cierre generado exitosamente')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/cierres/85-cierres-generate-success.png' });

        // Verify calculations
        await expect(page.locator('text=Ingresos: $1,500.00')).toBeVisible();
        await expect(page.locator('text=Egresos: $16,500.00')).toBeVisible();
        await page.screenshot({ path: 'screenshots-e2e/cierres/89-cierres-calculations.png' });
    });

    // 12. Database Validation
    await test.step('Database Validation', async () => {
        const { execSync } = require('child_process');
        const dbPath = 'saas-migration/edificio-admin-saas-adapted/edificio_admin_db';

        const commands = {
            buildings: `npx wrangler d1 execute ${dbPath} --remote --command="SELECT * FROM buildings ORDER BY created_at DESC LIMIT 1"`,
            adminUser: `npx wrangler d1 execute ${dbPath} --remote --command="SELECT id, nombre, email, rol, departamento, building_id FROM usuarios WHERE rol='ADMIN' ORDER BY fechaCreacion DESC LIMIT 1"`,
            funds: `npx wrangler d1 execute ${dbPath} --remote --command="SELECT * FROM fondos ORDER BY created_at DESC LIMIT 10"`,
            pendingUser: `npx wrangler d1 execute ${dbPath} --remote --command="SELECT * FROM pending_users ORDER BY created_at DESC LIMIT 1"`,
            finalPatrimonio: `npx wrangler d1 execute ${dbPath} --remote --command="SELECT SUM(saldo) as patrimonio_total FROM fondos"`
        };

        let validationOutput = '';
        for (const [key, command] of Object.entries(commands)) {
            const output = execSync(command).toString();
            validationOutput += `\n--- ${key.toUpperCase()} ---\n${output}`;
        }

        await fs.writeFile('screenshots-e2e/validacion/94-final-patrimonio.txt', validationOutput);
    });
  });
});
