/**
 * Test de Verificación de Email con APILayer
 * Prueba la integración con la API de Email Verification
 */

import dotenv from 'dotenv';
import { verifyEmail, verifyEmailsBatch } from '../src/utils/emailVerification.js';

// Cargar variables de entorno
dotenv.config();

// Colores para consola
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

// Casos de prueba
const testCases = [
  {
    category: 'Emails Válidos',
    emails: [
      'test@gmail.com',
      'user@outlook.com',
      'contact@yahoo.com',
      'admin@edificio205.com'
    ],
    expectedValid: true
  },
  {
    category: 'Emails con Typos',
    emails: [
      'test@gmial.com',
      'user@yahooo.com',
      'contact@outloook.com'
    ],
    expectedValid: false
  },
  {
    category: 'Emails Desechables',
    emails: [
      'test@tempmail.com',
      'user@guerrillamail.com',
      'spam@10minutemail.com',
      'fake@mailinator.com'
    ],
    expectedValid: false
  },
  {
    category: 'Emails Inválidos',
    emails: [
      'invalid-email',
      '@nodomain.com',
      'user@',
      'user @domain.com',
      ''
    ],
    expectedValid: false
  }
];

async function runTests() {
  log('\n🧪 Iniciando Tests de Verificación de Email\n', 'cyan');
  
  // Verificar que la API key esté configurada
  if (!process.env.APILAYER_API_KEY) {
    log('❌ ERROR: APILAYER_API_KEY no está configurada en .env', 'red');
    log('   Configura la variable de entorno antes de ejecutar los tests\n', 'yellow');
    process.exit(1);
  }

  log(`✅ API Key configurada: ${process.env.APILAYER_API_KEY.substring(0, 10)}...\n`, 'green');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Ejecutar tests por categoría
  for (const testCase of testCases) {
    log(`\n📋 Categoría: ${testCase.category}`, 'blue');
    log('─'.repeat(60), 'blue');

    for (const email of testCase.emails) {
      totalTests++;
      
      try {
        log(`\n   Testing: ${email || '(vacío)'}`, 'cyan');
        
        const result = await verifyEmail(email);
        
        // Verificar resultado
        const passed = result.valid === testCase.expectedValid;
        
        if (passed) {
          passedTests++;
          log(`   ✅ PASS - Resultado esperado`, 'green');
        } else {
          failedTests++;
          log(`   ❌ FAIL - Esperado: ${testCase.expectedValid}, Obtenido: ${result.valid}`, 'red');
        }

        // Mostrar detalles
        log(`   📊 Detalles:`, 'yellow');
        log(`      - Válido: ${result.valid}`, 'yellow');
        log(`      - Razón: ${result.reason || 'N/A'}`, 'yellow');
        log(`      - Mensaje: ${result.message}`, 'yellow');
        
        if (result.details) {
          log(`      - Score: ${result.details.score || 'N/A'}`, 'yellow');
          log(`      - Formato válido: ${result.details.format_valid}`, 'yellow');
          log(`      - MX encontrado: ${result.details.mx_found}`, 'yellow');
          log(`      - Desechable: ${result.details.disposable}`, 'yellow');
          log(`      - Gratuito: ${result.details.free}`, 'yellow');
          
          if (result.details.did_you_mean) {
            log(`      - Sugerencia: ${result.details.did_you_mean}`, 'yellow');
          }
          
          if (result.details.fallback) {
            log(`      - ⚠️  Usando validación básica (fallback)`, 'yellow');
          }
        }

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        failedTests++;
        log(`   ❌ ERROR: ${error.message}`, 'red');
      }
    }
  }

  // Resumen final
  log('\n' + '═'.repeat(60), 'cyan');
  log('📊 RESUMEN DE TESTS', 'cyan');
  log('═'.repeat(60), 'cyan');
  log(`Total de tests: ${totalTests}`, 'blue');
  log(`✅ Pasados: ${passedTests}`, 'green');
  log(`❌ Fallidos: ${failedTests}`, 'red');
  log(`📈 Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`, 'cyan');

  // Test de batch
  log('\n🔄 Test de Verificación en Batch', 'cyan');
  log('─'.repeat(60), 'cyan');
  
  const batchEmails = [
    'valid@gmail.com',
    'invalid@tempmail.com',
    'test@outlook.com'
  ];

  try {
    log(`\nVerificando ${batchEmails.length} emails en batch...`, 'yellow');
    const batchResults = await verifyEmailsBatch(batchEmails);
    
    log(`\n✅ Batch completado:`, 'green');
    batchResults.forEach((result, index) => {
      log(`   ${index + 1}. ${batchEmails[index]}: ${result.valid ? '✅ Válido' : '❌ Inválido'}`, 
          result.valid ? 'green' : 'red');
    });
  } catch (error) {
    log(`❌ Error en batch: ${error.message}`, 'red');
  }

  log('\n✨ Tests completados\n', 'cyan');
  
  // Exit code basado en resultados
  process.exit(failedTests > 0 ? 1 : 0);
}

// Ejecutar tests
runTests().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
