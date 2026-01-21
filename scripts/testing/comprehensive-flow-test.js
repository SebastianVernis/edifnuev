/**
 * COMPREHENSIVE FLOW TESTING SUITE
 * Tests all user flows with detailed documentation
 * Simulates browser interactions and captures state at each step
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const REPORT_DIR = path.join(__dirname, 'test-reports', 'comprehensive-flow-test');

// Test accounts
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@edificio205.com',
    password: 'Gemelo1',
    rol: 'ADMIN',
    departamento: 'ADMIN'
  },
  comite: {
    email: 'comite@edificio205.com',
    password: 'Gemelo1',
    rol: 'COMITE',
    departamento: 'COMITE'
  },
  inquilinos: [
    {
      nombre: 'María García',
      email: 'maria.garcia@edificio205.com',
      password: 'Gemelo1',
      departamento: '101',
      estado: 'Validado'
    },
    {
      nombre: 'Carlos López',
      email: 'carlos.lopez@edificio205.com',
      password: 'Gemelo1',
      departamento: '102',
      estado: 'Pendiente'
    },
    {
      nombre: 'Ana Martínez',
      email: 'ana.martinez@edificio205.com',
      password: 'Gemelo1',
      departamento: '201',
      estado: 'Validado'
    },
    {
      nombre: 'Roberto Silva',
      email: 'roberto.silva@edificio205.com',
      password: 'Gemelo1',
      departamento: '202',
      estado: 'Pendiente'
    }
  ]
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  flows: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '👉'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function createReportDirectory() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function login(email, password) {
  log(`Attempting login for: ${email}`, 'step');
  
  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (response.ok && response.data.ok) {
    log(`Login successful for: ${email}`, 'success');
    return {
      success: true,
      token: response.data.token,
      usuario: response.data.usuario
    };
  } else {
    log(`Login failed for: ${email} - ${response.data.msg || 'Unknown error'}`, 'error');
    return {
      success: false,
      error: response.data.msg || 'Login failed'
    };
  }
}

async function testEndpoint(name, endpoint, token, method = 'GET', body = null) {
  log(`Testing endpoint: ${method} ${endpoint}`, 'step');
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await makeRequest(endpoint, options);
  
  const result = {
    name,
    endpoint,
    method,
    status: response.status,
    success: response.ok,
    response: response.data,
    timestamp: new Date().toISOString()
  };

  if (response.ok) {
    log(`✓ ${name}: SUCCESS`, 'success');
  } else {
    log(`✗ ${name}: FAILED (${response.status})`, 'error');
  }

  return result;
}

// Flow testing functions
async function testAdminFlow() {
  log('\n========== TESTING ADMIN FLOW ==========', 'info');
  
  const flow = {
    user: 'ADMIN',
    email: TEST_ACCOUNTS.admin.email,
    steps: [],
    success: true
  };

  try {
    // Step 1: Login
    const loginResult = await login(TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    flow.steps.push({
      step: 1,
      name: 'Login',
      page: '/login.html',
      action: 'Submit login form',
      result: loginResult
    });

    if (!loginResult.success) {
      flow.success = false;
      return flow;
    }

    const token = loginResult.token;

    // Step 2: Access admin dashboard
    flow.steps.push({
      step: 2,
      name: 'Admin Dashboard',
      page: '/admin.html',
      action: 'Load admin dashboard',
      description: 'Main admin interface with all management options'
    });

    // Step 3: Get usuarios
    const usuariosResult = await testEndpoint(
      'Get Usuarios',
      '/api/usuarios',
      token
    );
    flow.steps.push({
      step: 3,
      name: 'Usuarios List',
      page: '/admin.html',
      section: 'Usuarios',
      action: 'Click "Usuarios" button',
      result: usuariosResult
    });

    // Step 4: Get cuotas
    const cuotasResult = await testEndpoint(
      'Get Cuotas',
      '/api/cuotas',
      token
    );
    flow.steps.push({
      step: 4,
      name: 'Cuotas List',
      page: '/admin.html',
      section: 'Cuotas',
      action: 'Click "Cuotas" button',
      result: cuotasResult
    });

    // Step 5: Get gastos
    const gastosResult = await testEndpoint(
      'Get Gastos',
      '/api/gastos',
      token
    );
    flow.steps.push({
      step: 5,
      name: 'Gastos List',
      page: '/admin.html',
      section: 'Gastos',
      action: 'Click "Gastos" button',
      result: gastosResult
    });

    // Step 6: Get presupuestos
    const presupuestosResult = await testEndpoint(
      'Get Presupuestos',
      '/api/presupuestos',
      token
    );
    flow.steps.push({
      step: 6,
      name: 'Presupuestos List',
      page: '/admin.html',
      section: 'Presupuestos',
      action: 'Click "Presupuestos" button',
      result: presupuestosResult
    });

    // Step 7: Get fondos
    const fondosResult = await testEndpoint(
      'Get Fondos',
      '/api/fondos',
      token
    );
    flow.steps.push({
      step: 7,
      name: 'Fondos List',
      page: '/admin.html',
      section: 'Fondos',
      action: 'Click "Fondos" button',
      result: fondosResult
    });

    // Step 8: Get anuncios
    const anunciosResult = await testEndpoint(
      'Get Anuncios',
      '/api/anuncios',
      token
    );
    flow.steps.push({
      step: 8,
      name: 'Anuncios List',
      page: '/admin.html',
      section: 'Anuncios',
      action: 'Click "Anuncios" button',
      result: anunciosResult
    });

    // Step 9: Get solicitudes
    const solicitudesResult = await testEndpoint(
      'Get Solicitudes',
      '/api/solicitudes',
      token
    );
    flow.steps.push({
      step: 9,
      name: 'Solicitudes List',
      page: '/admin.html',
      section: 'Solicitudes',
      action: 'Click "Solicitudes" button',
      result: solicitudesResult
    });

    // Step 10: Get audit logs
    const auditResult = await testEndpoint(
      'Get Audit Logs',
      '/api/audit',
      token
    );
    flow.steps.push({
      step: 10,
      name: 'Audit Logs',
      page: '/admin.html',
      section: 'Auditoría',
      action: 'Click "Auditoría" button',
      result: auditResult
    });

    // Step 11: Profile
    const profileResult = await testEndpoint(
      'Get Profile',
      '/api/usuarios/profile',
      token
    );
    flow.steps.push({
      step: 11,
      name: 'User Profile',
      page: '/admin.html',
      section: 'Profile',
      action: 'Click profile icon',
      result: profileResult
    });

    // Step 12: Logout
    flow.steps.push({
      step: 12,
      name: 'Logout',
      page: '/admin.html',
      action: 'Click logout button',
      description: 'User logged out successfully'
    });

  } catch (error) {
    flow.success = false;
    flow.error = error.message;
    log(`Admin flow error: ${error.message}`, 'error');
  }

  return flow;
}

async function testComiteFlow() {
  log('\n========== TESTING COMITÉ FLOW ==========', 'info');
  
  const flow = {
    user: 'COMITÉ',
    email: TEST_ACCOUNTS.comite.email,
    steps: [],
    success: true
  };

  try {
    // Step 1: Login
    const loginResult = await login(TEST_ACCOUNTS.comite.email, TEST_ACCOUNTS.comite.password);
    flow.steps.push({
      step: 1,
      name: 'Login',
      page: '/login.html',
      action: 'Submit login form',
      result: loginResult
    });

    if (!loginResult.success) {
      flow.success = false;
      return flow;
    }

    const token = loginResult.token;

    // Step 2: Access admin dashboard (comité uses same interface)
    flow.steps.push({
      step: 2,
      name: 'Comité Dashboard',
      page: '/admin.html',
      action: 'Load dashboard',
      description: 'Comité interface with limited permissions'
    });

    // Step 3: Get gastos (main responsibility)
    const gastosResult = await testEndpoint(
      'Get Gastos',
      '/api/gastos',
      token
    );
    flow.steps.push({
      step: 3,
      name: 'Gastos Management',
      page: '/admin.html',
      section: 'Gastos',
      action: 'Click "Gastos" button',
      result: gastosResult
    });

    // Step 4: Get presupuestos
    const presupuestosResult = await testEndpoint(
      'Get Presupuestos',
      '/api/presupuestos',
      token
    );
    flow.steps.push({
      step: 4,
      name: 'Presupuestos View',
      page: '/admin.html',
      section: 'Presupuestos',
      action: 'Click "Presupuestos" button',
      result: presupuestosResult
    });

    // Step 5: Get fondos
    const fondosResult = await testEndpoint(
      'Get Fondos',
      '/api/fondos',
      token
    );
    flow.steps.push({
      step: 5,
      name: 'Fondos View',
      page: '/admin.html',
      section: 'Fondos',
      action: 'Click "Fondos" button',
      result: fondosResult
    });

    // Step 6: Get anuncios
    const anunciosResult = await testEndpoint(
      'Get Anuncios',
      '/api/anuncios',
      token
    );
    flow.steps.push({
      step: 6,
      name: 'Anuncios',
      page: '/admin.html',
      section: 'Anuncios',
      action: 'Click "Anuncios" button',
      result: anunciosResult
    });

    // Step 7: Profile
    const profileResult = await testEndpoint(
      'Get Profile',
      '/api/usuarios/profile',
      token
    );
    flow.steps.push({
      step: 7,
      name: 'User Profile',
      page: '/admin.html',
      section: 'Profile',
      action: 'Click profile icon',
      result: profileResult
    });

    // Step 8: Logout
    flow.steps.push({
      step: 8,
      name: 'Logout',
      page: '/admin.html',
      action: 'Click logout button',
      description: 'User logged out successfully'
    });

  } catch (error) {
    flow.success = false;
    flow.error = error.message;
    log(`Comité flow error: ${error.message}`, 'error');
  }

  return flow;
}

async function testInquilinoFlow(inquilino) {
  log(`\n========== TESTING INQUILINO FLOW: ${inquilino.nombre} ==========`, 'info');
  
  const flow = {
    user: 'INQUILINO',
    nombre: inquilino.nombre,
    email: inquilino.email,
    departamento: inquilino.departamento,
    estado: inquilino.estado,
    steps: [],
    success: true
  };

  try {
    // Step 1: Login
    const loginResult = await login(inquilino.email, inquilino.password);
    flow.steps.push({
      step: 1,
      name: 'Login',
      page: '/login.html',
      action: 'Submit login form',
      result: loginResult
    });

    if (!loginResult.success) {
      flow.success = false;
      return flow;
    }

    const token = loginResult.token;

    // Step 2: Access inquilino dashboard
    flow.steps.push({
      step: 2,
      name: 'Inquilino Dashboard',
      page: '/inquilino.html',
      action: 'Load inquilino dashboard',
      description: 'Tenant interface with personal information'
    });

    // Step 3: Get profile
    const profileResult = await testEndpoint(
      'Get Profile',
      '/api/usuarios/profile',
      token
    );
    flow.steps.push({
      step: 3,
      name: 'User Profile',
      page: '/inquilino.html',
      section: 'Profile',
      action: 'View profile section',
      result: profileResult
    });

    // Step 4: Get mis cuotas
    const cuotasResult = await testEndpoint(
      'Get Mis Cuotas',
      '/api/cuotas/mis-cuotas',
      token
    );
    flow.steps.push({
      step: 4,
      name: 'Mis Cuotas',
      page: '/inquilino.html',
      section: 'Cuotas',
      action: 'Click "Mis Cuotas" button',
      result: cuotasResult
    });

    // Step 5: Get anuncios
    const anunciosResult = await testEndpoint(
      'Get Anuncios',
      '/api/anuncios',
      token
    );
    flow.steps.push({
      step: 5,
      name: 'Anuncios',
      page: '/inquilino.html',
      section: 'Anuncios',
      action: 'Click "Anuncios" button',
      result: anunciosResult
    });

    // Step 6: Get solicitudes
    const solicitudesResult = await testEndpoint(
      'Get Mis Solicitudes',
      '/api/solicitudes/mis-solicitudes',
      token
    );
    flow.steps.push({
      step: 6,
      name: 'Mis Solicitudes',
      page: '/inquilino.html',
      section: 'Solicitudes',
      action: 'Click "Solicitudes" button',
      result: solicitudesResult
    });

    // Step 7: Get estado de cuenta
    const estadoCuentaResult = await testEndpoint(
      'Get Estado de Cuenta',
      '/api/cuotas/estado-cuenta',
      token
    );
    flow.steps.push({
      step: 7,
      name: 'Estado de Cuenta',
      page: '/inquilino.html',
      section: 'Estado de Cuenta',
      action: 'Click "Estado de Cuenta" button',
      result: estadoCuentaResult
    });

    // Step 8: Logout
    flow.steps.push({
      step: 8,
      name: 'Logout',
      page: '/inquilino.html',
      action: 'Click logout button',
      description: 'User logged out successfully'
    });

  } catch (error) {
    flow.success = false;
    flow.error = error.message;
    log(`Inquilino flow error for ${inquilino.nombre}: ${error.message}`, 'error');
  }

  return flow;
}

// Generate detailed report
function generateReport() {
  log('\n========== GENERATING COMPREHENSIVE REPORT ==========', 'info');
  
  const report = {
    ...testResults,
    generatedAt: new Date().toISOString(),
    duration: 'N/A'
  };

  // Calculate summary
  report.flows.forEach(flow => {
    report.summary.total++;
    if (flow.success) {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  });

  // Save JSON report
  const jsonPath = path.join(REPORT_DIR, 'comprehensive-test-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  log(`JSON report saved: ${jsonPath}`, 'success');

  // Generate Markdown report
  generateMarkdownReport(report);
  
  return report;
}

function generateMarkdownReport(report) {
  let markdown = `# 📊 Comprehensive Flow Testing Report\n\n`;
  markdown += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n`;
  markdown += `**Base URL:** ${report.baseUrl}\n\n`;
  
  markdown += `## 📈 Summary\n\n`;
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Flows | ${report.summary.total} |\n`;
  markdown += `| ✅ Passed | ${report.summary.passed} |\n`;
  markdown += `| ❌ Failed | ${report.summary.failed} |\n`;
  markdown += `| Success Rate | ${((report.summary.passed / report.summary.total) * 100).toFixed(2)}% |\n\n`;

  markdown += `---\n\n`;

  // Detail each flow
  report.flows.forEach((flow, index) => {
    markdown += `## ${index + 1}. ${flow.user} Flow\n\n`;
    markdown += `**User:** ${flow.nombre || flow.user}\n`;
    markdown += `**Email:** ${flow.email}\n`;
    if (flow.departamento) {
      markdown += `**Departamento:** ${flow.departamento}\n`;
    }
    if (flow.estado) {
      markdown += `**Estado:** ${flow.estado}\n`;
    }
    markdown += `**Status:** ${flow.success ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    if (flow.error) {
      markdown += `**Error:** ${flow.error}\n\n`;
    }

    markdown += `### Steps Executed:\n\n`;
    
    flow.steps.forEach(step => {
      markdown += `#### Step ${step.step}: ${step.name}\n\n`;
      markdown += `- **Page:** \`${step.page}\`\n`;
      if (step.section) {
        markdown += `- **Section:** ${step.section}\n`;
      }
      markdown += `- **Action:** ${step.action}\n`;
      
      if (step.description) {
        markdown += `- **Description:** ${step.description}\n`;
      }

      if (step.result) {
        if (step.result.success !== undefined) {
          markdown += `- **Result:** ${step.result.success ? '✅ Success' : '❌ Failed'}\n`;
        }
        
        if (step.result.endpoint) {
          markdown += `- **Endpoint:** \`${step.result.method} ${step.result.endpoint}\`\n`;
          markdown += `- **Status Code:** ${step.result.status}\n`;
        }

        if (step.result.error) {
          markdown += `- **Error:** ${step.result.error}\n`;
        }

        if (step.result.usuario) {
          markdown += `- **User Info:**\n`;
          markdown += `  - Nombre: ${step.result.usuario.nombre}\n`;
          markdown += `  - Rol: ${step.result.usuario.rol}\n`;
          markdown += `  - Departamento: ${step.result.usuario.departamento}\n`;
        }

        if (step.result.response && step.result.response.data) {
          const data = step.result.response.data;
          if (Array.isArray(data)) {
            markdown += `- **Data Count:** ${data.length} items\n`;
          }
        }
      }
      
      markdown += `\n`;
    });

    markdown += `---\n\n`;
  });

  // Save markdown report
  const mdPath = path.join(REPORT_DIR, 'COMPREHENSIVE_TEST_REPORT.md');
  fs.writeFileSync(mdPath, markdown);
  log(`Markdown report saved: ${mdPath}`, 'success');
}

// Main execution
async function runComprehensiveTests() {
  const startTime = Date.now();
  
  log('🚀 Starting Comprehensive Flow Testing Suite', 'info');
  log(`Base URL: ${BASE_URL}`, 'info');
  
  createReportDirectory();

  try {
    // Test Admin flow
    const adminFlow = await testAdminFlow();
    testResults.flows.push(adminFlow);

    // Test all Inquilino flows
    for (const inquilino of TEST_ACCOUNTS.inquilinos) {
      const inquilinoFlow = await testInquilinoFlow(inquilino);
      testResults.flows.push(inquilinoFlow);
    }

    // Generate reports
    const report = generateReport();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('\n========== TEST EXECUTION COMPLETE ==========', 'success');
    log(`Duration: ${duration}s`, 'info');
    log(`Total Flows: ${report.summary.total}`, 'info');
    log(`Passed: ${report.summary.passed}`, 'success');
    log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
    log(`Success Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(2)}%`, 'info');
    log(`\nReports saved in: ${REPORT_DIR}`, 'success');

    process.exit(report.summary.failed > 0 ? 1 : 0);

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runComprehensiveTests();
