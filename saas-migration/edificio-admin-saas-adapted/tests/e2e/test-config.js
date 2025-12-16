/**
 * E2E Testing Configuration
 * Configuración centralizada para tests end-to-end
 */

export const config = {
  // Base URL del Worker desplegado
  baseUrl: 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev',
  
  // Timeouts
  timeout: {
    default: 10000,
    long: 30000,
    short: 5000
  },
  
  // Usuarios de prueba
  testUsers: {
    admin1: {
      email: 'admin@edificio205.com',
      password: 'Gemelo1',
      nombre: 'Admin Edificio 205',
      rol: 'ADMIN'
    },
    admin2: {
      email: 'admin@edificio206.com',
      password: 'Gemelo1',
      nombre: 'Admin Edificio 206',
      rol: 'ADMIN'
    },
    inquilino1: {
      email: 'maria.garcia@edificio205.com',
      password: 'Gemelo1',
      nombre: 'María García',
      rol: 'INQUILINO'
    },
    inquilino2: {
      email: 'carlos.lopez@edificio205.com',
      password: 'Gemelo1',
      nombre: 'Carlos López',
      rol: 'INQUILINO'
    }
  },
  
  // Buildings de prueba
  testBuildings: {
    building1: {
      name: 'Edificio 205',
      address: 'Av. Principal 205',
      total_units: 50,
      monthly_fee: 1500,
      extraordinary_fee: 500
    },
    building2: {
      name: 'Edificio 206',
      address: 'Av. Principal 206',
      total_units: 30,
      monthly_fee: 2000,
      extraordinary_fee: 800
    }
  },
  
  // Endpoints a testear
  endpoints: {
    auth: [
      'POST /api/auth/login',
      'POST /api/auth/registro',
      'GET /api/auth/renew',
      'GET /api/auth/perfil'
    ],
    onboarding: [
      'POST /api/onboarding/register',
      'POST /api/onboarding/checkout',
      'POST /api/onboarding/setup-building',
      'POST /api/otp/send',
      'POST /api/otp/verify',
      'POST /api/otp/resend',
      'GET /api/otp/status/:email'
    ],
    usuarios: [
      'GET /api/usuarios',
      'GET /api/usuarios/:id',
      'POST /api/usuarios',
      'PUT /api/usuarios/:id',
      'DELETE /api/usuarios/:id'
    ],
    cuotas: [
      'GET /api/cuotas',
      'GET /api/cuotas/departamento/:depto',
      'POST /api/cuotas',
      'POST /api/cuotas/generar',
      'POST /api/cuotas/:id/pagar',
      'DELETE /api/cuotas/:id'
    ],
    gastos: [
      'GET /api/gastos',
      'GET /api/gastos/:id',
      'POST /api/gastos',
      'PUT /api/gastos/:id',
      'DELETE /api/gastos/:id'
    ],
    fondos: [
      'GET /api/fondos',
      'GET /api/fondos/:id',
      'POST /api/fondos',
      'POST /api/fondos/transferir',
      'PUT /api/fondos/:id',
      'DELETE /api/fondos/:id'
    ],
    anuncios: [
      'GET /api/anuncios',
      'GET /api/anuncios/:id',
      'POST /api/anuncios',
      'PUT /api/anuncios/:id',
      'DELETE /api/anuncios/:id'
    ],
    cierres: [
      'GET /api/cierres',
      'GET /api/cierres/:id',
      'POST /api/cierres'
    ]
  },
  
  // Métricas esperadas
  metrics: {
    coverage: 90, // % mínimo de cobertura
    responseTime: 200, // ms máximo de respuesta promedio
    errorRate: 0.01 // % máximo de errores
  }
};

/**
 * Helper para hacer requests HTTP
 */
export async function makeRequest(method, endpoint, options = {}) {
  const url = `${config.baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const fetchOptions = {
    method,
    headers,
    ...options
  };
  
  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  const startTime = Date.now();
  const response = await fetch(url, fetchOptions);
  const responseTime = Date.now() - startTime;
  
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return {
    status: response.status,
    ok: response.ok,
    data,
    responseTime,
    headers: Object.fromEntries(response.headers.entries())
  };
}

/**
 * Helper para login y obtener token
 */
export async function login(email, password) {
  const response = await makeRequest('POST', '/api/auth/login', {
    body: { email, password }
  });
  
  if (response.ok && response.data.token) {
    return response.data.token;
  }
  
  throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
}

/**
 * Helper para crear headers con autenticación
 */
export function authHeaders(token) {
  return {
    'x-auth-token': token
  };
}

/**
 * Sleep helper
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generar datos aleatorios para tests
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test.${timestamp}@mailinator.com`,
    nombre: `Test User ${timestamp}`,
    departamento: `${Math.floor(Math.random() * 500) + 100}`,
    telefono: `55${Math.floor(Math.random() * 90000000) + 10000000}`
  };
}

export default config;
