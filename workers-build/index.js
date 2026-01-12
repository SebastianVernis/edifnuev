/**
 * Cloudflare Workers Entry Point
 * Edificio Admin - Sistema de Administración
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token',
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

// Helper: Verificar autenticación (soporta Authorization Bearer y x-auth-token)
async function verifyAuth(request, env) {
  // Intentar obtener token de Authorization header o x-auth-token header
  const authHeader = request.headers.get('Authorization');
  const xAuthToken = request.headers.get('x-auth-token');
  
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (xAuthToken) {
    token = xAuthToken;
  }
  
  if (!token) {
    return new Response(JSON.stringify({
      success: false,
      message: 'No autorizado - Token requerido'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const payload = await verifyJWT(token, env);
    if (!payload) {
      throw new Error('Invalid token');
    }
    return { payload, user: payload }; // Retornar payload para usar en endpoints
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
          rol: user.rol,
          buildingId: user.building_id
        }, env);

        return new Response(JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            departamento: user.departamento,
            building_id: user.building_id
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get usuarios
      if (method === 'GET' && path === '/api/usuarios') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const { results } = await env.DB.prepare(
          'SELECT id, nombre, email, rol, departamento, activo FROM usuarios WHERE building_id = ?'
        ).bind(buildingId).all();

        return new Response(JSON.stringify({
          success: true,
          usuarios: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get cuotas
      if (method === 'GET' && path === '/api/cuotas') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const mes = url.searchParams.get('mes');
        const anio = url.searchParams.get('anio');

        let query = 'SELECT * FROM cuotas WHERE building_id = ?';
        const params = [buildingId];

        if (mes && anio) {
          query += ' AND mes = ? AND anio = ?';
          params.push(mes, anio);
        }

        query += ' ORDER BY departamento';

        const stmt = env.DB.prepare(query).bind(...params);
        const { results } = await stmt.all();

        return new Response(JSON.stringify({
          success: true,
          cuotas: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === FONDOS ENDPOINTS ===
      
      // GET /api/fondos - Obtener fondos
      if (method === 'GET' && path === '/api/fondos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const { results } = await env.DB.prepare(
          'SELECT * FROM fondos WHERE building_id = ?'
        ).bind(buildingId).all();

        return new Response(JSON.stringify({
          success: true,
          fondos: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/fondos/patrimonio - Obtener patrimonio total
      if (method === 'GET' && path === '/api/fondos/patrimonio') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const { results } = await env.DB.prepare(
          'SELECT SUM(saldo) as total FROM fondos WHERE building_id = ?'
        ).bind(buildingId).all();
        const patrimonioTotal = results[0]?.total || 0;

        return new Response(JSON.stringify({
          success: true,
          patrimonioTotal
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/fondos/transferencia - Transferir entre fondos
      if (method === 'POST' && path === '/api/fondos/transferencia') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { origen, destino, monto, concepto } = body;

        if (!origen || !destino || !monto) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Buscar fondos por nombre y building_id
        const fondoOrigen = await env.DB.prepare(
          'SELECT * FROM fondos WHERE nombre = ? AND building_id = ?'
        ).bind(origen, buildingId).first();
        const fondoDestino = await env.DB.prepare(
          'SELECT * FROM fondos WHERE nombre = ? AND building_id = ?'
        ).bind(destino, buildingId).first();

        if (!fondoOrigen || !fondoDestino) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Fondo no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (fondoOrigen.saldo < monto) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Saldo insuficiente'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Realizar transferencia
        await env.DB.prepare('UPDATE fondos SET saldo = saldo - ? WHERE id = ?')
          .bind(monto, fondoOrigen.id).run();
        await env.DB.prepare('UPDATE fondos SET saldo = saldo + ? WHERE id = ?')
          .bind(monto, fondoDestino.id).run();

        // Registrar movimientos
        const fecha = new Date().toISOString().split('T')[0];
        await env.DB.prepare(
          'INSERT INTO movimientos_fondos (fondo_id, tipo, monto, concepto, fecha, building_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(fondoOrigen.id, 'EGRESO', monto, concepto || 'Transferencia', fecha, buildingId).run();
        
        await env.DB.prepare(
          'INSERT INTO movimientos_fondos (fondo_id, tipo, monto, concepto, fecha, building_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(fondoDestino.id, 'INGRESO', monto, concepto || 'Transferencia', fecha, buildingId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Transferencia realizada exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === GASTOS ENDPOINTS ===
      
      // GET /api/gastos - Obtener gastos
      if (method === 'GET' && path === '/api/gastos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const anio = url.searchParams.get('anio');
        const mes = url.searchParams.get('mes');
        
        let query = 'SELECT * FROM gastos WHERE building_id = ?';
        const params = [buildingId];
        
        if (anio) {
          query += ' AND strftime("%Y", fecha) = ?';
          params.push(anio);
          
          if (mes) {
            query += ' AND strftime("%m", fecha) = ?';
            params.push(mes.toString().padStart(2, '0'));
          }
        }
        
        query += ' ORDER BY fecha DESC';
        
        const stmt = env.DB.prepare(query).bind(...params);
        const { results } = await stmt.all();

        return new Response(JSON.stringify({
          success: true,
          gastos: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/gastos/stats - Estadísticas de gastos
      if (method === 'GET' && path === '/api/gastos/stats') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const anio = url.searchParams.get('anio') || new Date().getFullYear();
        
        const totalResult = await env.DB.prepare(
          'SELECT SUM(monto) as total FROM gastos WHERE building_id = ? AND strftime("%Y", fecha) = ?'
        ).bind(buildingId, anio.toString()).first();
        
        const categoriesResult = await env.DB.prepare(
          'SELECT categoria, SUM(monto) as total FROM gastos WHERE building_id = ? AND strftime("%Y", fecha) = ? GROUP BY categoria'
        ).bind(buildingId, anio.toString()).all();

        return new Response(JSON.stringify({
          success: true,
          total: totalResult?.total || 0,
          porCategoria: categoriesResult.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/gastos - Crear gasto
      if (method === 'POST' && path === '/api/gastos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { concepto, monto, categoria, fecha, descripcion } = body;

        if (!concepto || !monto || !categoria) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await env.DB.prepare(
          'INSERT INTO gastos (concepto, monto, categoria, fecha, descripcion, building_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          concepto, 
          monto, 
          categoria, 
          fecha || new Date().toISOString().split('T')[0],
          descripcion || '',
          buildingId
        ).run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: 'Gasto registrado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === ANUNCIOS ENDPOINTS ===
      
      // GET /api/anuncios - Obtener anuncios
      if (method === 'GET' && path === '/api/anuncios') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const limit = url.searchParams.get('limit') || 50;
        const tipo = url.searchParams.get('tipo');
        
        let query = 'SELECT * FROM anuncios WHERE activo = 1 AND building_id = ?';
        const params = [buildingId];
        
        if (tipo && tipo !== 'TODOS') {
          query += ' AND prioridad = ?';
          params.push(tipo);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const stmt = env.DB.prepare(query).bind(...params);
        const { results } = await stmt.all();

        return new Response(JSON.stringify({
          success: true,
          anuncios: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/anuncios - Crear anuncio
      if (method === 'POST' && path === '/api/anuncios') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { titulo, contenido, prioridad } = body;

        if (!titulo || !contenido) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await env.DB.prepare(
          'INSERT INTO anuncios (titulo, contenido, prioridad, created_by, building_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(titulo, contenido, prioridad || 'NORMAL', authResult.user.userId, buildingId).run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: 'Anuncio creado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === CIERRES ENDPOINTS ===
      
      // GET /api/cierres - Obtener cierres
      if (method === 'GET' && path === '/api/cierres') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const anio = url.searchParams.get('anio');
        
        let query = 'SELECT * FROM cierres WHERE building_id = ?';
        const params = [buildingId];
        
        if (anio) {
          query += ' AND anio = ?';
          params.push(anio);
        }
        
        query += ' ORDER BY anio DESC, fecha_cierre DESC';
        
        const stmt = env.DB.prepare(query).bind(...params);
        const { results } = await stmt.all();

        return new Response(JSON.stringify({
          success: true,
          cierres: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/cierres - Crear cierre
      if (method === 'POST' && path === '/api/cierres') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { anio, total_ingresos, total_egresos, saldo_final, detalles } = body;

        if (!anio) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Año es requerido'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await env.DB.prepare(
          'INSERT INTO cierres (anio, total_ingresos, total_egresos, saldo_final, detalles, created_by, building_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          anio,
          total_ingresos || 0,
          total_egresos || 0,
          saldo_final || 0,
          JSON.stringify(detalles || {}),
          authResult.user.userId,
          buildingId
        ).run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: 'Cierre creado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === PARCIALIDADES ENDPOINTS ===
      
      // GET /api/parcialidades/pagos - Obtener pagos
      if (method === 'GET' && path === '/api/parcialidades/pagos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const { results } = await env.DB.prepare(
          'SELECT p.*, c.mes, c.anio, c.departamento FROM parcialidades p ' +
          'LEFT JOIN cuotas c ON p.cuota_id = c.id ' +
          'WHERE p.building_id = ? ' +
          'ORDER BY p.created_at DESC'
        ).bind(buildingId).all();

        return new Response(JSON.stringify({
          success: true,
          pagos: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/parcialidades/estado - Estado de parcialidades
      if (method === 'GET' && path === '/api/parcialidades/estado') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const totalResult = await env.DB.prepare(
          'SELECT COUNT(*) as total, SUM(monto) as monto_total FROM parcialidades WHERE building_id = ?'
        ).bind(buildingId).first();

        return new Response(JSON.stringify({
          success: true,
          total: totalResult?.total || 0,
          montoTotal: totalResult?.monto_total || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/parcialidades/pagos - Registrar pago
      if (method === 'POST' && path === '/api/parcialidades/pagos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { cuota_id, monto, metodo_pago, referencia } = body;

        if (!cuota_id || !monto) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await env.DB.prepare(
          'INSERT INTO parcialidades (cuota_id, monto, fecha_pago, metodo_pago, referencia, building_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          cuota_id,
          monto,
          new Date().toISOString().split('T')[0],
          metodo_pago || '',
          referencia || '',
          buildingId
        ).run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: 'Pago registrado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === ONBOARDING ROUTES ===

      // POST /api/otp/send - Enviar código OTP
      if (method === 'POST' && path === '/api/otp/send') {
        const body = await request.json();
        const { email } = body;

        if (!email) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Email requerido'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generar OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar en KV temporal (si está configurado)
        if (env.KV) {
          await env.KV.put(`otp:${email}`, JSON.stringify({
            code: otpCode,
            email,
            timestamp: Date.now()
          }), { expirationTtl: 300 }); // 5 minutos
        }

        // TODO: Enviar email con OTP usando servicio de email
        // Por ahora, retornar OTP en respuesta (solo para desarrollo)
        console.log(`OTP para ${email}: ${otpCode}`);
        
        return new Response(JSON.stringify({
          ok: true,
          msg: 'Código OTP enviado correctamente',
          otp: otpCode // REMOVER EN PRODUCCIÓN
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

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

        // Marcar OTP como verificado y guardar en KV
        otpData.otpVerified = true;
        if (env.KV) {
          await env.KV.put(`otp:${email}`, JSON.stringify(otpData), { expirationTtl: 600 });
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

      // POST /api/onboarding/checkout - Procesar pago (mockup)
      if (method === 'POST' && path === '/api/onboarding/checkout') {
        const body = await request.json();
        const { email, cardNumber, cardExpiry, cardCVV, cardCvc, cardName } = body;
        const cvv = cardCVV || cardCvc;

        if (!email) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Email es requerido'
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

        if (!otpData) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'No se encontró un registro pendiente para este email'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!otpData.otpVerified) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Debes verificar tu email primero'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validar datos de tarjeta (mockup - validación básica)
        if (!cardNumber || !cardExpiry || !cvv || !cardName) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Información de tarjeta incompleta'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Simular procesamiento de pago
        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const plan = otpData.selectedPlan || { name: 'Standard', price: 1500 };

        // Actualizar registro en KV
        otpData.checkoutCompleted = true;
        otpData.transactionId = transactionId;
        otpData.cardLastFour = cardNumber.slice(-4);
        otpData.checkoutAt = new Date().toISOString();
        
        if (env.KV) {
          await env.KV.put(`otp:${email}`, JSON.stringify(otpData), { expirationTtl: 600 });
        }

        return new Response(JSON.stringify({
          ok: true,
          msg: 'Pago procesado correctamente',
          data: {
            transactionId,
            amount: plan.price,
            plan: plan.name,
            nextStep: 'setup-building'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/onboarding/complete-setup - Completar setup
      if (method === 'POST' && path === '/api/onboarding/complete-setup') {
        try {
          const body = await request.json();
          const { email, buildingData } = body;
          
          if (!email) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Email es requerido'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          const buildingName = buildingData?.name || 'Mi Edificio';
          const address = buildingData?.address || '';
          const unitsCount = buildingData?.totalUnits || 20;
          
          // Obtener plan desde KV
          let selectedPlan = 'profesional';
          if (env.KV) {
            const stored = await env.KV.get(`otp:${email}`);
            if (stored) {
              const otpData = JSON.parse(stored);
              // Mapear nombres de planes a valores de DB
              const planMapping = {
                'basico': 'basico',
                'basic': 'basico',
                'profesional': 'profesional',
                'professional': 'profesional',
                'standard': 'profesional',
                'empresarial': 'empresarial',
                'enterprise': 'empresarial',
                'personalizado': 'empresarial',
                'custom': 'empresarial'
              };
              const planKey = typeof otpData.selectedPlan === 'string' 
                ? otpData.selectedPlan.toLowerCase() 
                : 'profesional';
              selectedPlan = planMapping[planKey] || 'profesional';
            }
          }

          // Crear building primero
          const insertBuilding = await env.DB.prepare(
            'INSERT INTO buildings (name, address, units_count, plan, active) VALUES (?, ?, ?, ?, ?)'
          ).bind(buildingName, address, unitsCount, selectedPlan, 1).run();

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
        } catch (error) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al completar setup',
            error: error.message,
            stack: error.stack
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // === PROYECTOS ENDPOINTS ===
      
      // GET /api/proyectos - Obtener proyectos críticos
      if (method === 'GET' && path === '/api/proyectos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        
        // Por ahora retornar array vacío (falta implementar tabla proyectos en D1)
        return new Response(JSON.stringify({
          ok: true,
          proyectos: [],
          resumen: {
            total: 0,
            porDepartamento: 0,
            totalUnidades: 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/proyectos - Crear proyecto
      if (method === 'POST' && path === '/api/proyectos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { nombre, monto, prioridad } = body;

        if (!nombre || !monto || !prioridad) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Por ahora retornar éxito (falta implementar tabla proyectos en D1)
        return new Response(JSON.stringify({
          ok: true,
          msg: 'Proyecto creado exitosamente',
          proyecto: { id: Date.now(), nombre, monto, prioridad }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === STATIC ASSETS ===
      
      // Mapear rutas HTML
      const htmlRoutes = {
        '/': 'index.html',
        '/login': 'login.html',
        '/admin': 'admin.html',
        '/inquilino': 'inquilino.html',
        '/landing': 'landing.html',
        '/register': 'register.html',
        '/registro': 'register.html',
        '/verify-otp': 'verify-otp.html',
        '/verificar-otp': 'verify-otp.html',
        '/checkout': 'checkout.html',
        '/setup': 'setup.html',
        '/setup-edificio': 'setup.html',
        '/activate': 'activate.html',
        '/theme-customizer': 'theme-customizer.html',
        '/crear-paquete': 'crear-paquete.html',
        '/admin-optimized': 'admin-optimized.html'
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
