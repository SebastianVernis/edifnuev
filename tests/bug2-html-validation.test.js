/**
 * 🧪 TEST BUG #2: Validación HTML - Atributos name en campos
 * 
 * OBJETIVO: Validar que todos los campos del formulario setup-edificio.html
 * tienen el atributo 'name' correctamente asignado.
 * 
 * BUG CORREGIDO: Commit 72f7c03
 * - Agregado name="password" a input adminPassword
 * - Agregado name a todos los campos del formulario
 * 
 * MÉTODO: Análisis estático del HTML
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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Leer el archivo HTML
const htmlPath = join(__dirname, '../saas-migration/edificio-admin-saas-adapted/public/setup-edificio.html');
const htmlContent = readFileSync(htmlPath, 'utf-8');

log('\n🧪 VALIDACIÓN BUG #2: Atributos name en campos del formulario\n', 'cyan');
log('═'.repeat(70), 'blue');

// Campos esperados con sus atributos name
const expectedFields = [
  { id: 'buildingName', name: 'buildingName', type: 'input', description: 'Nombre del edificio' },
  { id: 'address', name: 'address', type: 'textarea', description: 'Dirección' },
  { id: 'totalUnits', name: 'totalUnits', type: 'input', description: 'Total de unidades' },
  { id: 'buildingType', name: 'buildingType', type: 'select', description: 'Tipo de edificio' },
  { id: 'adminName', name: 'adminName', type: 'input', description: 'Nombre del administrador' },
  { id: 'adminPhone', name: 'adminPhone', type: 'input', description: 'Teléfono del administrador' },
  { id: 'adminPassword', name: 'password', type: 'input', description: '⭐ Password (Bug #2)' },
  { id: 'confirmPassword', name: 'confirmPassword', type: 'input', description: 'Confirmar password' },
  { id: 'monthlyFee', name: 'monthlyFee', type: 'input', description: 'Cuota mensual' },
  { id: 'cutoffDay', name: 'cutoffDay', type: 'input', description: 'Día de corte' },
  { id: 'paymentDueDays', name: 'paymentDueDays', type: 'input', description: 'Días de gracia' },
  { id: 'lateFeePercent', name: 'lateFeePercent', type: 'input', description: 'Porcentaje de recargo' }
];

let allPassed = true;
let passedCount = 0;
let failedCount = 0;

log('\n📋 VALIDANDO CAMPOS DEL FORMULARIO:\n', 'yellow');

expectedFields.forEach((field, index) => {
  const { id, name, type, description } = field;
  
  // Crear regex para buscar el campo con su atributo name
  let regex;
  if (type === 'input') {
    regex = new RegExp(`<input[^>]*id="${id}"[^>]*name="${name}"[^>]*>|<input[^>]*name="${name}"[^>]*id="${id}"[^>]*>`, 'i');
  } else if (type === 'textarea') {
    regex = new RegExp(`<textarea[^>]*id="${id}"[^>]*name="${name}"[^>]*>|<textarea[^>]*name="${name}"[^>]*id="${id}"[^>]*>`, 'i');
  } else if (type === 'select') {
    regex = new RegExp(`<select[^>]*id="${id}"[^>]*name="${name}"[^>]*>|<select[^>]*name="${name}"[^>]*id="${id}"[^>]*>`, 'i');
  }
  
  const found = regex.test(htmlContent);
  
  if (found) {
    log(`  ${index + 1}. ✅ ${description}`, 'green');
    log(`     └─ id="${id}" name="${name}"`, 'reset');
    passedCount++;
  } else {
    log(`  ${index + 1}. ❌ ${description}`, 'red');
    log(`     └─ id="${id}" name="${name}" - NO ENCONTRADO`, 'red');
    allPassed = false;
    failedCount++;
  }
});

log('\n' + '═'.repeat(70), 'blue');

// Validación específica del Bug #2: Campo password
log('\n⭐ VALIDACIÓN ESPECÍFICA BUG #2: Campo password\n', 'yellow');

const passwordRegex = /<input[^>]*id="adminPassword"[^>]*name="password"[^>]*>|<input[^>]*name="password"[^>]*id="adminPassword"[^>]*>/i;
const passwordFound = passwordRegex.test(htmlContent);

if (passwordFound) {
  log('  ✅ Campo adminPassword tiene atributo name="password"', 'green');
  log('  ✅ Bug #2 CORREGIDO: Playwright puede acceder al campo sin timeout', 'green');
} else {
  log('  ❌ Campo adminPassword NO tiene atributo name="password"', 'red');
  log('  ❌ Bug #2 NO CORREGIDO', 'red');
  allPassed = false;
}

// Extraer el fragmento HTML del campo password para mostrar
const passwordMatch = htmlContent.match(/<input[^>]*id="adminPassword"[^>]*>/i);
if (passwordMatch) {
  log('\n  📄 HTML del campo password:', 'cyan');
  log(`     ${passwordMatch[0]}`, 'reset');
}

log('\n' + '═'.repeat(70), 'blue');

// Resumen final
log('\n📊 RESUMEN DE VALIDACIÓN:\n', 'yellow');
log(`  Total de campos validados: ${expectedFields.length}`, 'reset');
log(`  ✅ Campos correctos: ${passedCount}`, 'green');
log(`  ❌ Campos con errores: ${failedCount}`, failedCount > 0 ? 'red' : 'reset');

log('\n' + '═'.repeat(70), 'blue');

if (allPassed) {
  log('\n🎉 ÉXITO: Todos los campos tienen el atributo name correctamente asignado', 'green');
  log('✅ Bug #2 CORREGIDO: Commit 72f7c03 validado exitosamente\n', 'green');
  process.exit(0);
} else {
  log('\n❌ ERROR: Algunos campos no tienen el atributo name', 'red');
  log('❌ Bug #2 NO CORREGIDO completamente\n', 'red');
  process.exit(1);
}
