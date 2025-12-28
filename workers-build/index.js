/**
 * Cloudflare Workers Entry Point
 * Edificio Admin - Sistema de Administración
 */

import { Router } from 'itty-router';

// Router principal
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Health check
router.get('/api/validation/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-workers'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Auth routes
router.post('/api/auth/login', async (request, env) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Buscar usuario en D1
    const stmt = env.DB.prepare('SELECT * FROM usuarios WHERE email = ?').bind(email);
    const user = await stmt.first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar password (nota: en Workers necesitamos bcrypt alternativo)
    // Por ahora comparación simple para demo
    const validPassword = password === user.password;

    if (!validPassword) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generar token JWT
    const token = await generateJWT({ userId: user.id, email: user.email }, env);

    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        departamento: user.departamento
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error en login',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Usuarios routes
router.get('/api/usuarios', async (request, env) => {
  try {
    // Verificar autenticación
    const authError = await verifyAuth(request, env);
    if (authError) return authError;

    const { results } = await env.DB.prepare('SELECT id, nombre, email, rol, departamento, activo FROM usuarios').all();

    return new Response(JSON.stringify({
      success: true,
      usuarios: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener usuarios'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Cuotas routes
router.get('/api/cuotas', async (request, env) => {
  try {
    const authError = await verifyAuth(request, env);
    if (authError) return authError;

    const url = new URL(request.url);
    const mes = url.searchParams.get('mes');
    const anio = url.searchParams.get('anio');

    let query = 'SELECT * FROM cuotas';
    const params = [];

    if (mes && anio) {
      query += ' WHERE mes = ? AND anio = ?';
      params.push(mes, anio);
    }

    const stmt = env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    return new Response(JSON.stringify({
      success: true,
      cuotas: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener cuotas'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Servir archivos estáticos
router.get('/*', async (request, env, ctx) => {
  try {
    const url = new URL(request.url);
    let path = url.pathname;

    // Servir index.html para rutas principales
    if (path === '/' || path === '/admin' || path === '/inquilino') {
      path = '/index.html';
    }

    // Intentar servir desde assets
    const asset = await env.ASSETS.fetch(new Request(`https://placeholder${path}`, request));
    
    if (asset.ok) {
      return asset;
    }

    // 404 si no se encuentra
    return new Response('Not Found', { status: 404 });

  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
});

// Handle OPTIONS para CORS
router.options('*', () => {
  return new Response(null, {
    headers: corsHeaders
  });
});

// Helper: Verificar autenticación
async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      message: 'No autorizado'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyJWT(token, env);
    if (!payload) {
      throw new Error('Invalid token');
    }
    return null; // Auth OK
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Token inválido'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Helper: Generar JWT
async function generateJWT(payload, env) {
  const secret = env.JWT_SECRET || 'edificio-admin-secret-key-2025';
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 86400000 }));
  const signature = await sign(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

// Helper: Verificar JWT
async function verifyJWT(token, env) {
  try {
    const [header, payload, signature] = token.split('.');
    const secret = env.JWT_SECRET || 'edificio-admin-secret-key-2025';
    const expectedSignature = await sign(`${header}.${payload}`, secret);
    
    if (signature !== expectedSignature) {
      return null;
    }

    const data = JSON.parse(atob(payload));
    if (data.exp < Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// Helper: Sign data
async function sign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Export handler
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx).catch(err => {
      return new Response(JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        error: err.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    });
  }
};
