/**
 * Cloudflare Workers Entry Point
 * Edificio Admin - Sistema de Administración
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: Base64 URL encode
function base64urlEncode(data) {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else if (data instanceof ArrayBuffer) {
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  } else {
    base64 = btoa(data);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper: Base64 URL decode
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

// Helper: Firmar con HMAC-SHA256
async function signHS256(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return base64urlEncode(signature);
}

// Helper: Generar JWT
async function generateJWT(payload, env) {
  const secret = env.JWT_SECRET || 'edificio-admin-secret-key-2025';
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  
  const payloadWithExp = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    iat: Math.floor(Date.now() / 1000)
  };
  const encodedPayload = base64urlEncode(JSON.stringify(payloadWithExp));
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHS256(data, secret);
  
  return `${data}.${signature}`;
}

// Helper: Verificar JWT
async function verifyJWT(token, env) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    const secret = env.JWT_SECRET || 'edificio-admin-secret-key-2025';
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await signHS256(data, secret);
    
    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Helper: Verificar autenticación
async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      message: 'No autorizado - Token requerido'
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
    return null;
  } catch {
    return new Response(JSON.stringify({
      success: false,
      message: 'Token inválido o expirado'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // OPTIONS para CORS
      if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // === API ROUTES ===
      
      // Health check
      if (method === 'GET' && path === '/api/validation/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: 'cloudflare-workers',
          version: '2.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Login
      if (method === 'POST' && path === '/api/auth/login') {
        const body = await request.json();
        const { email, password } = body;

        if (!env.DB) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Database not configured'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const stmt = env.DB.prepare('SELECT * FROM usuarios WHERE email = ?').bind(email);
        const user = await stmt.first();

        if (!user || user.password !== password) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Credenciales inválidas'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = await generateJWT({ 
          userId: user.id, 
          email: user.email,
          rol: user.rol 
        }, env);

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
      }

      // Get usuarios
      if (method === 'GET' && path === '/api/usuarios') {
        const authError = await verifyAuth(request, env);
        if (authError) return authError;

        const { results } = await env.DB.prepare(
          'SELECT id, nombre, email, rol, departamento, activo FROM usuarios'
        ).all();

        return new Response(JSON.stringify({
          success: true,
          usuarios: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get cuotas
      if (method === 'GET' && path === '/api/cuotas') {
        const authError = await verifyAuth(request, env);
        if (authError) return authError;

        const mes = url.searchParams.get('mes');
        const anio = url.searchParams.get('anio');

        let query = 'SELECT * FROM cuotas';
        const params = [];

        if (mes && anio) {
          query += ' WHERE mes = ? AND anio = ?';
          params.push(mes, anio);
        }

        query += ' ORDER BY departamento';

        const stmt = params.length > 0 
          ? env.DB.prepare(query).bind(...params)
          : env.DB.prepare(query);
          
        const { results } = await stmt.all();

        return new Response(JSON.stringify({
          success: true,
          cuotas: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === ONBOARDING ROUTES ===

      // POST /api/onboarding/register - Iniciar registro
      if (method === 'POST' && path === '/api/onboarding/register') {
        const body = await request.json();
        const { email, fullName, phone, buildingName, selectedPlan } = body;

        // Validar datos
        if (!email || !fullName || !buildingName || !selectedPlan) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verificar si email ya existe
        const existing = await env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first();
        if (existing) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'El email ya está registrado'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generar OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar en KV temporal (si está configurado) o en memoria
        if (env.KV) {
          await env.KV.put(`otp:${email}`, JSON.stringify({
            code: otpCode,
            email,
            fullName,
            phone,
            buildingName,
            selectedPlan,
            timestamp: Date.now()
          }), { expirationTtl: 600 }); // 10 minutos
        }

        // TODO: Enviar email con OTP
        // Por ahora, retornar OTP en respuesta (solo para desarrollo)
        
        return new Response(JSON.stringify({
          ok: true,
          msg: 'Registro iniciado. Revisa tu email para el código OTP.',
          otp: otpCode // REMOVER EN PRODUCCIÓN
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/onboarding/verify-otp - Verificar código OTP
      if (method === 'POST' && path === '/api/onboarding/verify-otp') {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Email y código OTP requeridos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verificar OTP desde KV
        let otpData = null;
        if (env.KV) {
          const stored = await env.KV.get(`otp:${email}`);
          if (stored) {
            otpData = JSON.parse(stored);
          }
        }

        if (!otpData || otpData.code !== otp) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Código OTP inválido o expirado'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // OTP verificado, retornar datos para continuar
        return new Response(JSON.stringify({
          ok: true,
          msg: 'OTP verificado correctamente',
          data: {
            email: otpData.email,
            fullName: otpData.fullName,
            buildingName: otpData.buildingName,
            selectedPlan: otpData.selectedPlan
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/onboarding/complete-setup - Completar setup
      if (method === 'POST' && path === '/api/onboarding/complete-setup') {
        const body = await request.json();
        const { email, buildingName, unitsCount, address, selectedPlan } = body;

        // Crear building primero
        const insertBuilding = await env.DB.prepare(
          'INSERT INTO buildings (name, address, units_count, plan, active) VALUES (?, ?, ?, ?, ?)'
        ).bind(buildingName, address || '', unitsCount || 20, selectedPlan, 1).run();

        const buildingId = insertBuilding.meta.last_row_id;

        // Crear usuario admin del edificio con building_id
        const password = 'admin123'; // Temporal
        
        const insertUser = await env.DB.prepare(
          'INSERT INTO usuarios (nombre, email, password, rol, departamento, activo, building_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind('Administrador', email, password, 'ADMIN', 'Admin', 1, buildingId).run();

        const userId = insertUser.meta.last_row_id;

        // Actualizar building con admin_user_id
        await env.DB.prepare(
          'UPDATE buildings SET admin_user_id = ? WHERE id = ?'
        ).bind(userId, buildingId).run();

        // Limpiar OTP usado
        if (env.KV) {
          await env.KV.delete(`otp:${email}`);
        }

        return new Response(JSON.stringify({
          ok: true,
          msg: 'Edificio configurado exitosamente',
          buildingId: buildingId,
          userId: userId,
          credentials: {
            email,
            password // REMOVER EN PRODUCCIÓN, enviar por email
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === STATIC ASSETS ===
      
      // Mapear rutas HTML
      const htmlRoutes = {
        '/': 'index.html',
        '/admin': 'admin.html',
        '/inquilino': 'inquilino.html',
        '/landing': 'landing.html',
        '/register': 'register.html',
        '/verify-otp': 'verify-otp.html',
        '/checkout': 'checkout.html',
        '/setup': 'setup.html',
        '/activate': 'activate.html',
        '/theme-customizer': 'theme-customizer.html'
      };

      let assetPath = path;
      if (htmlRoutes[path]) {
        assetPath = '/' + htmlRoutes[path];
      }

      // Servir desde Workers Sites KV
      if (env.__STATIC_CONTENT) {
        const MANIFEST = JSON.parse(env.__STATIC_CONTENT_MANIFEST || '{}');
        const assetKey = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
        const manifestKey = MANIFEST[assetKey];

        if (manifestKey) {
          const asset = await env.__STATIC_CONTENT.get(manifestKey, 'arrayBuffer');
          
          if (asset) {
            const headers = new Headers();
            
            // Content type
            const ext = assetKey.split('.').pop();
            const contentTypes = {
              'html': 'text/html; charset=utf-8',
              'js': 'application/javascript',
              'css': 'text/css',
              'json': 'application/json',
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'svg': 'image/svg+xml',
              'ico': 'image/x-icon'
            };

            headers.set('Content-Type', contentTypes[ext] || 'application/octet-stream');
            headers.set('Cache-Control', 'public, max-age=3600');

            return new Response(asset, { headers });
          }
        }
      }

      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
