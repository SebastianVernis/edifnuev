/**
 * E2E Testing Configuration
 * Configuración centralizada para tests end-to-end
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Base URL del Worker desplegado
  baseUrl: 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev',
  
  // Service Token para Cloudflare Access
  serviceToken: {
    clientId: process.env.CF_ACCESS_CLIENT_ID,
    clientSecret: process.env.CF_ACCESS_CLIENT_SECRET
  },
  
  // Timeouts
  timeout: {
    default: 10000,
    long: 30000,
    short: 5000
  },
  
  // Usuarios de prueba (usuarios reales en DB)
  testUsers: {
    admin1: {
      email: 'sebas@sebas.com',
      password: 'TestPass123!',
      nombre: 'edif',
      rol: 'ADMIN',
      building_id: 13
    },
    admin2: {
      email: 'admin@building99.com',
      password: 'TestPass123!',
      nombre: 'Admin Building 99',
      rol: 'ADMIN',
      building_id: 99
    },
    inquilino1: {
      email: 'usu@usu.com',
      password: 'TestPass123!',
      nombre: 'Usuario Inquilino',
      rol: 'INQUILINO',
      building_id: 13
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
    responseTime: 300, // ms máximo de respuesta promedio (ajustado para Workers)
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
  
  // Agregar Service Token headers si están configurados
  if (config.serviceToken.clientId && config.serviceToken.clientSecret) {
    headers['CF-Access-Client-Id'] = config.serviceToken.clientId;
    headers['CF-Access-Client-Secret'] = config.serviceToken.clientSecret;
  }
  
  const fetchOptions = {
    method,
    headers,
    ...options
  };
  
  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  // Throttle para evitar saturar el Worker
  await throttleRequest();
  
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
 * Sleep automático entre requests para evitar rate limiting del Worker
 */
const REQUEST_DELAY = 150; // ms entre requests
let lastRequestTime = 0;

async function throttleRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await sleep(REQUEST_DELAY - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
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
