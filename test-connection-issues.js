import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

// Usuarios de prueba con las credenciales correctas
const TEST_USERS = {
  admin: {
    email: 'admin@edificio205.com',
    password: 'Admin2025!',
    rol: 'ADMIN'
  },
  comite: {
    email: 'comite@edificio205.com',
    password: 'Comite2025!',
    rol: 'COMITE'
  },
  inquilino1: {
    email: 'maria.garcia@edificio205.com',
    password: 'Inquilino2025!',
    rol: 'INQUILINO',
    depto: '101'
  },
  inquilino2: {
    email: 'carlos.lopez@edificio205.com',
    password: 'Inquilino2025!',
    rol: 'INQUILINO',
    depto: '102'
  }
};

// Endpoints a probar
const ENDPOINTS = {
  admin: [
    { method: 'GET', path: '/api/usuarios', name: 'Listar Usuarios' },
    { method: 'GET', path: '/api/cuotas', name: 'Listar Cuotas' },
    { method: 'GET', path: '/api/gastos', name: 'Listar Gastos' },
    { method: 'GET', path: '/api/presupuestos', name: 'Listar Presupuestos' },
    { method: 'GET', path: '/api/fondos', name: 'Listar Fondos' },
    { method: 'GET', path: '/api/fondos/patrimonio', name: 'Obtener Patrimonio' },
    { method: 'GET', path: '/api/anuncios', name: 'Listar Anuncios' },
    { method: 'GET', path: '/api/solicitudes', name: 'Listar Solicitudes' },
    { method: 'GET', path: '/api/audit-logs', name: 'Logs de Auditoría' },
    { method: 'GET', path: '/api/usuarios/profile', name: 'Perfil de Usuario' }
  ],
  comite: [
    { method: 'GET', path: '/api/usuarios', name: 'Listar Usuarios' },
    { method: 'GET', path: '/api/cuotas', name: 'Listar Cuotas' },
    { method: 'GET', path: '/api/gastos', name: 'Listar Gastos' },
    { method: 'GET', path: '/api/presupuestos', name: 'Listar Presupuestos' },
    { method: 'GET', path: '/api/fondos', name: 'Listar Fondos' },
    { method: 'GET', path: '/api/anuncios', name: 'Listar Anuncios' },
    { method: 'GET', path: '/api/solicitudes', name: 'Listar Solicitudes' },
    { method: 'GET', path: '/api/usuarios/profile', name: 'Perfil de Usuario' }
  ],
  inquilino: [
    { method: 'GET', path: '/api/anuncios', name: 'Listar Anuncios' },
    { method: 'GET', path: '/api/solicitudes', name: 'Listar Solicitudes' },
    { method: 'GET', path: '/api/usuarios/profile', name: 'Perfil de Usuario' },
    { method: 'GET', path: '/api/cuotas/mis-cuotas', name: 'Mis Cuotas' },
    { method: 'GET', path: '/api/cuotas/estado-cuenta', name: 'Estado de Cuenta' }
  ]
};

// Función para hacer login
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.msg || 'Login failed', status: response.status };
    }

    return { success: true, token: data.token, usuario: data.usuario };
  } catch (error) {
    return { success: false, error: error.message, status: 'CONNECTION_ERROR' };
  }
}

// Función para probar un endpoint
async function testEndpoint(method, path, token, name) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      name,
      path
    };
  } catch (error) {
    return {
      success: false,
      status: 'CONNECTION_ERROR',
      error: error.message,
      name,
      path
    };
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('\n🔍 ANÁLISIS DE CONNECTION ISSUES - ChispartBuilding Platform\n');
  console.log('═'.repeat(80));
  
  const connectionIssues = [];
  const allResults = {};

  // Probar cada usuario
  for (const [userType, credentials] of Object.entries(TEST_USERS)) {
    console.log(`\n\n👤 PROBANDO USUARIO: ${userType.toUpperCase()}`);
    console.log(`   Email: ${credentials.email}`);
    console.log('─'.repeat(80));

    // Login
    const loginResult = await login(credentials.email, credentials.password);
    
    if (!loginResult.success) {
      console.log(`   ❌ LOGIN FAILED: ${loginResult.error} (Status: ${loginResult.status})`);
      connectionIssues.push({
        user: userType,
        endpoint: 'LOGIN',
        path: '/api/auth/login',
        issue: loginResult.error,
        status: loginResult.status,
        type: 'AUTHENTICATION_ERROR'
      });
      continue;
    }

    console.log(`   ✅ Login exitoso`);
    
    // Determinar qué endpoints probar según el rol
    let endpointsToTest = [];
    if (userType === 'admin') {
      endpointsToTest = ENDPOINTS.admin;
    } else if (userType === 'comite') {
      endpointsToTest = ENDPOINTS.comite;
    } else {
      endpointsToTest = ENDPOINTS.inquilino;
    }

    allResults[userType] = {
      login: loginResult,
      endpoints: []
    };

    // Probar cada endpoint
    for (const endpoint of endpointsToTest) {
      const result = await testEndpoint(
        endpoint.method,
        endpoint.path,
        loginResult.token,
        endpoint.name
      );

      allResults[userType].endpoints.push(result);

      if (!result.success) {
        const issueType = result.status === 'CONNECTION_ERROR' 
          ? 'CONNECTION_ERROR' 
          : result.status === 403 
            ? 'PERMISSION_ERROR'
            : result.status === 404
              ? 'ENDPOINT_NOT_FOUND'
              : result.status === 500
                ? 'SERVER_ERROR'
                : 'REQUEST_ERROR';

        connectionIssues.push({
          user: userType,
          endpoint: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          issue: result.error || result.data?.msg || result.statusText,
          status: result.status,
          type: issueType,
          response: result.data
        });

        console.log(`   ❌ ${endpoint.name}: ${result.status} - ${result.error || result.data?.msg || result.statusText}`);
      } else {
        console.log(`   ✅ ${endpoint.name}: ${result.status}`);
      }
    }
  }

  // Generar reporte de connection issues
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📋 RESUMEN DE CONNECTION ISSUES');
  console.log('═'.repeat(80));

  // Agrupar por tipo
  const issuesByType = {};
  connectionIssues.forEach(issue => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });

  if (connectionIssues.length === 0) {
    console.log('\n✅ NO SE ENCONTRARON CONNECTION ISSUES\n');
  } else {
    console.log(`\n⚠️  TOTAL DE ISSUES ENCONTRADOS: ${connectionIssues.length}\n`);

    // Mostrar por tipo
    for (const [type, issues] of Object.entries(issuesByType)) {
      console.log(`\n🔴 ${type} (${issues.length} issues):`);
      console.log('─'.repeat(80));
      
      issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.endpoint}`);
        console.log(`   Usuario: ${issue.user}`);
        console.log(`   Path: ${issue.method} ${issue.path}`);
        console.log(`   Status: ${issue.status}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.response && typeof issue.response === 'object') {
          console.log(`   Response: ${JSON.stringify(issue.response, null, 2)}`);
        }
      });
    }
  }

  // Guardar reporte detallado
  const issuesByTypeCount = {};
  for (const [type, issues] of Object.entries(issuesByType)) {
    issuesByTypeCount[type] = issues.length;
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: connectionIssues.length,
      issuesByType: issuesByTypeCount
    },
    issues: connectionIssues,
    fullResults: allResults
  };

  const fs = await import('fs');
  const reportPath = './connection-issues-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log(`📄 Reporte completo guardado en: ${reportPath}`);
  console.log('═'.repeat(80));
  console.log('\n');

  return report;
}

// Ejecutar pruebas
runTests().catch(console.error);
