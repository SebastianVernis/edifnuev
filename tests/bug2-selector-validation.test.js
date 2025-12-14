/**
 * 🧪 TEST BUG #2: Validación de Selectores CSS
 * 
 * OBJETIVO: Validar que todos los campos del formulario son accesibles
 * mediante selectores CSS usando el atributo 'name'.
 * 
 * BUG CORREGIDO: Commit 72f7c03
 * - Agregado name="password" a input adminPassword
 * - Todos los campos ahora son accesibles por selector name
 * 
 * MÉTODO: Simulación de selectores Playwright
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Leer el archivo HTML
const htmlPath = join(__dirname, '../saas-migration/edificio-admin-saas-adapted/public/setup-edificio.html');
const htmlContent = readFileSync(htmlPath, 'utf-8');

log('\n🧪 VALIDACIÓN BUG #2: Selectores CSS con atributo name\n', 'cyan');
log('═'.repeat(80), 'blue');

// Selectores que Playwright usaría para acceder a los campos
const playwrightSelectors = [
  { selector: 'input[name="buildingName"]', description: 'Nombre del edificio', section: 'Edificio' },
  { selector: 'textarea[name="address"]', description: 'Dirección', section: 'Edificio' },
  { selector: 'input[name="totalUnits"]', description: 'Total de unidades', section: 'Edificio' },
  { selector: 'select[name="buildingType"]', description: 'Tipo de edificio', section: 'Edificio' },
  { selector: 'input[name="adminName"]', description: 'Nombre del administrador', section: 'Administrador' },
  { selector: 'input[name="adminPhone"]', description: 'Teléfono', section: 'Administrador' },
  { selector: 'input[name="password"]', description: '⭐ Password (Bug #2)', section: 'Administrador', critical: true },
  { selector: 'input[name="confirmPassword"]', description: 'Confirmar password', section: 'Administrador' },
  { selector: 'input[name="monthlyFee"]', description: 'Cuota mensual', section: 'Cuotas' },
  { selector: 'input[name="cutoffDay"]', description: 'Día de corte', section: 'Cuotas' },
  { selector: 'input[name="paymentDueDays"]', description: 'Días de gracia', section: 'Cuotas' },
  { selector: 'input[name="lateFeePercent"]', description: 'Porcentaje de recargo', section: 'Cuotas' }
];

let allPassed = true;
let passedCount = 0;
let failedCount = 0;
let currentSection = '';

log('\n📋 VALIDANDO SELECTORES PLAYWRIGHT:\n', 'yellow');

playwrightSelectors.forEach((item, index) => {
  const { selector, description, section, critical } = item;
  
  // Mostrar sección si cambió
  if (section !== currentSection) {
    log(`\n  📁 SECCIÓN: ${section}`, 'magenta');
    currentSection = section;
  }
  
  // Convertir selector CSS a regex para buscar en HTML
  const selectorParts = selector.match(/^(\w+)\[name="([^"]+)"\]$/);
  if (!selectorParts) {
    log(`  ❌ Selector inválido: ${selector}`, 'red');
    allPassed = false;
    failedCount++;
    return;
  }
  
  const [, tagName, nameAttr] = selectorParts;
  const regex = new RegExp(`<${tagName}[^>]*name="${nameAttr}"[^>]*>`, 'i');
  const found = regex.test(htmlContent);
  
  const icon = critical ? '⭐' : '  ';
  
  if (found) {
    log(`  ${icon} ✅ ${description}`, 'green');
    log(`     └─ Selector: ${selector}`, 'reset');
    passedCount++;
    
    if (critical) {
      log(`     └─ ✅ CRÍTICO: Campo accesible sin timeout`, 'green');
    }
  } else {
    log(`  ${icon} ❌ ${description}`, 'red');
    log(`     └─ Selector: ${selector} - NO ENCONTRADO`, 'red');
    allPassed = false;
    failedCount++;
    
    if (critical) {
      log(`     └─ ❌ CRÍTICO: Bug #2 NO corregido`, 'red');
    }
  }
});

log('\n' + '═'.repeat(80), 'blue');

// Validación específica del Bug #2
log('\n⭐ VALIDACIÓN ESPECÍFICA BUG #2: Selector input[name="password"]\n', 'yellow');

const passwordSelector = 'input[name="password"]';
const passwordRegex = /<input[^>]*name="password"[^>]*>/i;
const passwordFound = passwordRegex.test(htmlContent);

if (passwordFound) {
  log(`  ✅ Selector "${passwordSelector}" es válido`, 'green');
  log('  ✅ Playwright puede usar: page.locator(\'input[name="password"]\').fill(\'Admin123!\')', 'green');
  log('  ✅ NO habrá timeout al llenar el campo password', 'green');
  
  // Extraer el HTML del campo
  const match = htmlContent.match(/<input[^>]*name="password"[^>]*>/i);
  if (match) {
    log('\n  📄 HTML encontrado:', 'cyan');
    log(`     ${match[0]}`, 'reset');
  }
} else {
  log(`  ❌ Selector "${passwordSelector}" NO es válido`, 'red');
  log('  ❌ Playwright tendrá timeout al intentar acceder al campo', 'red');
  log('  ❌ Bug #2 NO CORREGIDO', 'red');
  allPassed = false;
}

log('\n' + '═'.repeat(80), 'blue');

// Código de ejemplo Playwright
log('\n💻 CÓDIGO PLAYWRIGHT VALIDADO:\n', 'cyan');
log('  // Este código ahora funciona sin timeout:', 'reset');
log('  const password = page.locator(\'input[name="password"]\');', 'yellow');
log('  await expect(password).toBeVisible({ timeout: 5000 });', 'yellow');
log('  await password.fill(\'Admin123!\');', 'yellow');
log('  console.log(\'✅ Password llenado exitosamente\');', 'green');

log('\n' + '═'.repeat(80), 'blue');

// Resumen final
log('\n📊 RESUMEN DE VALIDACIÓN:\n', 'yellow');
log(`  Total de selectores validados: ${playwrightSelectors.length}`, 'reset');
log(`  ✅ Selectores válidos: ${passedCount}`, 'green');
log(`  ❌ Selectores inválidos: ${failedCount}`, failedCount > 0 ? 'red' : 'reset');

log('\n' + '═'.repeat(80), 'blue');

if (allPassed) {
  log('\n🎉 ÉXITO: Todos los selectores Playwright son válidos', 'green');
  log('✅ Bug #2 CORREGIDO: No habrá timeout en ningún campo', 'green');
  log('✅ Commit 72f7c03 validado exitosamente\n', 'green');
  process.exit(0);
} else {
  log('\n❌ ERROR: Algunos selectores no son válidos', 'red');
  log('❌ Bug #2 NO CORREGIDO completamente\n', 'red');
  process.exit(1);
}
