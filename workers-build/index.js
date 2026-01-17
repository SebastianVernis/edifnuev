/**
 * Cloudflare Workers Entry Point
 * Edificio Admin - Sistema de Administración
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, Accept',
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

// Helper: Hash password con SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Helper: Verificar password
async function verifyPassword(plainPassword, hashedPassword) {
  const hash = await hashPassword(plainPassword);
  return hash === hashedPassword;
}

// Helper: Firmar con HMAC-SHA-256
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

        if (!user) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Credenciales inválidas'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verificar password con hash
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Credenciales inválidas'
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
          ok: true,
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

      // POST /api/usuarios - Crear usuario
      if (method === 'POST' && path === '/api/usuarios') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { nombre, email, password, rol, departamento, telefono } = body;

        // Validar campos requeridos
        if (!nombre || !email || !password || !departamento) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Faltan campos requeridos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verificar si el email ya existe
        const existingUser = await env.DB.prepare(
          'SELECT id FROM usuarios WHERE email = ? AND building_id = ?'
        ).bind(email, buildingId).first();

        if (existingUser) {
          return new Response(JSON.stringify({
            success: false,
            message: 'El email ya está registrado'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Hashear contraseña
        const hashedPassword = await hashPassword(password);

        // Insertar nuevo usuario
        await env.DB.prepare(
          'INSERT INTO usuarios (nombre, email, password, rol, departamento, telefono, building_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
        ).bind(nombre, email, hashedPassword, rol || 'INQUILINO', departamento, telefono || '', buildingId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Usuario creado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /api/usuarios/:id - Actualizar usuario
      if (method === 'PUT' && path.startsWith('/api/usuarios/')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const userId = parseInt(path.split('/').pop());
        const body = await request.json();
        const { nombre, email, rol, departamento, telefono, activo } = body;

        // Validar que el usuario existe y pertenece al building
        const user = await env.DB.prepare(
          'SELECT * FROM usuarios WHERE id = ? AND building_id = ?'
        ).bind(userId, buildingId).first();

        if (!user) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Usuario no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Si se cambia el email, verificar que no exista
        if (email && email !== user.email) {
          const existingEmail = await env.DB.prepare(
            'SELECT id FROM usuarios WHERE email = ? AND building_id = ? AND id != ?'
          ).bind(email, buildingId, userId).first();

          if (existingEmail) {
            return new Response(JSON.stringify({
              success: false,
              message: 'El email ya está en uso'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        // Actualizar usuario
        await env.DB.prepare(
          'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, departamento = ?, telefono = ?, activo = ? WHERE id = ?'
        ).bind(
          nombre || user.nombre,
          email || user.email,
          rol || user.rol,
          departamento || user.departamento,
          telefono !== undefined ? telefono : user.telefono,
          activo !== undefined ? activo : user.activo,
          userId
        ).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Usuario actualizado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /api/usuarios/:id - Eliminar usuario (soft delete)
      if (method === 'DELETE' && path.startsWith('/api/usuarios/')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const userId = parseInt(path.split('/').pop());

        // Validar que el usuario existe y pertenece al building
        const user = await env.DB.prepare(
          'SELECT * FROM usuarios WHERE id = ? AND building_id = ?'
        ).bind(userId, buildingId).first();

        if (!user) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Usuario no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // No permitir eliminar al admin principal
        if (user.rol === 'ADMIN' && user.id === authResult.payload.userId) {
          return new Response(JSON.stringify({
            success: false,
            message: 'No puedes eliminar tu propio usuario'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Soft delete
        await env.DB.prepare(
          'UPDATE usuarios SET activo = 0 WHERE id = ?'
        ).bind(userId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Usuario desactivado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/usuarios/cambiar-password - Cambiar contraseña
      if (method === 'POST' && path === '/api/usuarios/cambiar-password') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const userId = authResult.payload.userId;
        const body = await request.json();
        const { passwordActual, passwordNueva } = body;

        if (!passwordActual || !passwordNueva) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Se requiere contraseña actual y nueva'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Obtener usuario
        const user = await env.DB.prepare(
          'SELECT * FROM usuarios WHERE id = ?'
        ).bind(userId).first();

        if (!user) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Usuario no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verificar contraseña actual
        const isValidPassword = await verifyPassword(passwordActual, user.password);
        if (!isValidPassword) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Contraseña actual incorrecta'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Hashear nueva contraseña
        const hashedPassword = await hashPassword(passwordNueva);

        // Actualizar contraseña
        await env.DB.prepare(
          'UPDATE usuarios SET password = ? WHERE id = ?'
        ).bind(hashedPassword, userId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Contraseña actualizada exitosamente'
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

      // POST /api/cuotas/generar-masivo - Generar cuotas masivamente
      if (method === 'POST' && path === '/api/cuotas/generar-masivo') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { mes, anio, monto, departamentos } = body;

        if (!mes || !anio || !monto) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos. Se requiere mes, año y monto.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          // Obtener configuración del building
          const building = await env.DB.prepare(
            'SELECT units_count, cutoff_day FROM buildings WHERE id = ?'
          ).bind(buildingId).first();

          if (!building) {
            return new Response(JSON.stringify({
              success: false,
              message: 'Edificio no encontrado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          let cuotasCreadas = 0;
          let cuotasExistentes = 0;
          let errores = [];

          // Si se especificó "TODOS", generar para todas las unidades
          if (departamentos === 'TODOS') {
            const totalUnits = building.units_count || 20;
            
            for (let i = 1; i <= totalUnits; i++) {
              const depto = i.toString().padStart(3, '0'); // 001, 002, 003...
              
              try {
                // Verificar si ya existe
                const existe = await env.DB.prepare(
                  'SELECT id FROM cuotas WHERE mes = ? AND anio = ? AND departamento = ? AND building_id = ?'
                ).bind(mes, anio, depto, buildingId).first();

                if (existe) {
                  cuotasExistentes++;
                } else {
                  // Calcular fecha de vencimiento
                  const cutoffDay = building.cutoff_day || 5;
                  const mesIndex = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].indexOf(mes);
                  const fechaVencimiento = new Date(anio, mesIndex, cutoffDay).toISOString().split('T')[0];

                  await env.DB.prepare(
                    'INSERT INTO cuotas (mes, anio, departamento, monto, pagado, fecha_vencimiento, building_id) VALUES (?, ?, ?, ?, 0, ?, ?)'
                  ).bind(mes, anio, depto, monto, fechaVencimiento, buildingId).run();
                  
                  cuotasCreadas++;
                }
              } catch (error) {
                errores.push(`Depto ${depto}: ${error.message}`);
              }
            }
          } else {
            // Generar para departamentos específicos
            const deptos = Array.isArray(departamentos) ? departamentos : [departamentos];
            
            for (const depto of deptos) {
              try {
                const existe = await env.DB.prepare(
                  'SELECT id FROM cuotas WHERE mes = ? AND anio = ? AND departamento = ? AND building_id = ?'
                ).bind(mes, anio, depto, buildingId).first();

                if (existe) {
                  cuotasExistentes++;
                } else {
                  const cutoffDay = building.cutoff_day || 5;
                  const mesIndex = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].indexOf(mes);
                  const fechaVencimiento = new Date(anio, mesIndex, cutoffDay).toISOString().split('T')[0];

                  await env.DB.prepare(
                    'INSERT INTO cuotas (mes, anio, departamento, monto, pagado, fecha_vencimiento, building_id) VALUES (?, ?, ?, ?, 0, ?, ?)'
                  ).bind(mes, anio, depto, monto, fechaVencimiento, buildingId).run();
                  
                  cuotasCreadas++;
                }
              } catch (error) {
                errores.push(`Depto ${depto}: ${error.message}`);
              }
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Generación completada: ${cuotasCreadas} cuotas creadas, ${cuotasExistentes} ya existían`,
            cuotasCreadas,
            cuotasExistentes,
            errores: errores.length > 0 ? errores : null
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Error al generar cuotas',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/cuotas/calcular-mora - Calcular mora para cuotas vencidas
      if (method === 'POST' && path === '/api/cuotas/calcular-mora') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;

        try {
          // Obtener configuración del building
          const building = await env.DB.prepare(
            'SELECT cutoff_day, payment_due_days, late_fee_percent FROM buildings WHERE id = ?'
          ).bind(buildingId).first();

          if (!building) {
            return new Response(JSON.stringify({
              success: false,
              message: 'Edificio no encontrado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const cutoffDay = building.cutoff_day || 5;
          const graceDays = building.payment_due_days || 5;
          const latePercent = building.late_fee_percent || 2;

          // Obtener todas las cuotas pendientes
          const cuotasPendientes = await env.DB.prepare(
            'SELECT * FROM cuotas WHERE building_id = ? AND pagado = 0'
          ).bind(buildingId).all();

          const cuotas = cuotasPendientes.results || [];
          const hoy = new Date();
          
          let cuotasActualizadas = 0;
          let moraTotal = 0;

          for (const cuota of cuotas) {
            // Calcular fecha límite de pago (cutoff_day + grace_days)
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const mesIndex = meses.indexOf(cuota.mes);
            
            if (mesIndex === -1) continue; // Mes inválido
            
            const fechaCorte = new Date(cuota.anio, mesIndex, cutoffDay);
            const fechaLimite = new Date(fechaCorte);
            fechaLimite.setDate(fechaLimite.getDate() + graceDays);

            // Si ya pasó la fecha límite, calcular mora
            if (hoy > fechaLimite) {
              // Calcular meses de atraso
              const mesesAtraso = Math.floor(
                (hoy.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24 * 30)
              ) + 1; // Al menos 1 mes

              // Calcular mora: monto * (porcentaje/100) * meses
              const mora = cuota.monto * (latePercent / 100) * mesesAtraso;

              // Actualizar cuota
              await env.DB.prepare(
                'UPDATE cuotas SET monto_mora = ?, vencida = 1 WHERE id = ?'
              ).bind(mora, cuota.id).run();

              cuotasActualizadas++;
              moraTotal += mora;
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Cálculo completado: ${cuotasActualizadas} cuotas con mora aplicada`,
            cuotasActualizadas,
            moraTotal: moraTotal.toFixed(2),
            configuracion: {
              cutoffDay,
              graceDays,
              latePercent: `${latePercent}%`
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Error al calcular mora',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
        const { concepto, monto, categoria, fecha, descripcion, fondoId, proveedor } = body;

        if (!concepto || !monto || !categoria) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validar que el fondo existe y pertenece al building (si se especificó)
        if (fondoId) {
          const fondo = await env.DB.prepare(
            'SELECT id, nombre, saldo FROM fondos WHERE id = ? AND building_id = ?'
          ).bind(fondoId, buildingId).first();

          if (!fondo) {
            return new Response(JSON.stringify({
              success: false,
              message: 'Fondo no encontrado o no pertenece a este edificio'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Validar que hay saldo suficiente
          if (parseFloat(fondo.saldo) < parseFloat(monto)) {
            return new Response(JSON.stringify({
              success: false,
              message: `Saldo insuficiente en ${fondo.nombre}. Disponible: $${parseFloat(fondo.saldo).toLocaleString('es-MX')}`
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Descontar del fondo
          await env.DB.prepare(
            'UPDATE fondos SET saldo = saldo - ? WHERE id = ?'
          ).bind(monto, fondoId).run();

          // Registrar movimiento en el fondo
          await env.DB.prepare(
            'INSERT INTO movimientos_fondos (fondo_id, tipo, monto, concepto, fecha, building_id) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(fondoId, 'EGRESO', monto, `Gasto: ${concepto}`, fecha || new Date().toISOString().split('T')[0], buildingId).run();
        }

        // Crear el gasto
        const result = await env.DB.prepare(
          'INSERT INTO gastos (concepto, monto, categoria, fecha, descripcion, proveedor, fondo_id, building_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          concepto, 
          monto, 
          categoria, 
          fecha || new Date().toISOString().split('T')[0],
          descripcion || '',
          proveedor || null,
          fondoId || null,
          buildingId
        ).run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: fondoId ? 
            `Gasto registrado y descontado del fondo exitosamente` : 
            'Gasto registrado exitosamente (sin afectar fondos)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /api/gastos/:id - Eliminar gasto y revertir descuento
      if (method === 'DELETE' && path.startsWith('/api/gastos/')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const gastoId = parseInt(path.split('/').pop());

        // Obtener el gasto para verificar si tiene fondo asociado
        const gasto = await env.DB.prepare(
          'SELECT * FROM gastos WHERE id = ? AND building_id = ?'
        ).bind(gastoId, buildingId).first();

        if (!gasto) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Gasto no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Si el gasto afectó un fondo, revertir el descuento
        if (gasto.fondo_id) {
          await env.DB.prepare(
            'UPDATE fondos SET saldo = saldo + ? WHERE id = ?'
          ).bind(gasto.monto, gasto.fondo_id).run();

          // Registrar movimiento de reversión
          await env.DB.prepare(
            'INSERT INTO movimientos_fondos (fondo_id, tipo, monto, concepto, fecha, building_id) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(
            gasto.fondo_id, 
            'INGRESO', 
            gasto.monto, 
            `Reversión de gasto: ${gasto.concepto}`, 
            new Date().toISOString().split('T')[0], 
            buildingId
          ).run();
        }

        // Eliminar el gasto
        await env.DB.prepare('DELETE FROM gastos WHERE id = ?').bind(gastoId).run();

        return new Response(JSON.stringify({
          success: true,
          message: gasto.fondo_id ? 
            'Gasto eliminado y monto revertido al fondo exitosamente' : 
            'Gasto eliminado exitosamente'
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
        const { titulo, contenido, prioridad, tipo, imagen } = body;

        if (!titulo || !contenido) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Usar 'tipo' o 'prioridad' (compatibilidad)
        const prioridadFinal = prioridad || tipo || 'NORMAL';

        const result = await env.DB.prepare(
          'INSERT INTO anuncios (titulo, contenido, prioridad, archivo, created_by, building_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          titulo, 
          contenido, 
          prioridadFinal, 
          imagen || null,
          authResult.payload.userId || authResult.user?.userId,
          buildingId
        ).run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: 'Anuncio creado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/anuncios/upload - Subir archivo para anuncio
      if (method === 'POST' && path === '/api/anuncios/upload') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        try {
          console.log('📤 Upload request recibida');
          console.log('   Content-Type:', request.headers.get('content-type'));
          
          const formData = await request.formData();
          console.log('   FormData parseado correctamente');
          
          // Debug: ver todos los campos del FormData
          const fields = [];
          for (const [key, value] of formData.entries()) {
            fields.push(key);
            console.log(`   Campo: ${key}, Tipo: ${typeof value}, Es File: ${value instanceof File}`);
          }
          
          const file = formData.get('file');
          console.log('   Archivo obtenido:', !!file);

          if (!file) {
            console.log('❌ No se encontró campo "file" en FormData');
            console.log('   Campos recibidos:', fields);
            
            return new Response(JSON.stringify({
              success: false,
              message: 'No se recibió ningún archivo. Campos recibidos: ' + fields.join(', ')
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Generar nombre único para el archivo
          const timestamp = Date.now();
          const fileName = `${timestamp}_${file.name}`;
          const key = `anuncios/${fileName}`;

          // Subir a R2
          if (env.UPLOADS) {
            console.log(`📦 Preparando para subir a R2: ${key}`);
            console.log(`   Tamaño del archivo: ${file.size} bytes`);
            console.log(`   Tipo: ${file.type}`);
            
            try {
              // Convertir a ArrayBuffer para R2
              const fileBuffer = await file.arrayBuffer();
              console.log(`   ArrayBuffer creado: ${fileBuffer.byteLength} bytes`);
              
              await env.UPLOADS.put(key, fileBuffer, {
                httpMetadata: {
                  contentType: file.type
                }
              });

              console.log(`✅ Archivo subido a R2: ${key}`);

              return new Response(JSON.stringify({
                success: true,
                url: `/uploads/${key}`,
                fileName: fileName,
                message: 'Archivo subido exitosamente'
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            } catch (r2Error) {
              console.error('❌ Error subiendo a R2:', r2Error);
              return new Response(JSON.stringify({
                success: false,
                message: 'Error al guardar archivo en almacenamiento',
                error: r2Error.message
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          } else {
            console.log('❌ env.UPLOADS no está disponible');
            return new Response(JSON.stringify({
              success: false,
              message: 'Servicio de almacenamiento no disponible'
            }), {
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Error al subir archivo',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // DELETE /api/anuncios/:id - Eliminar anuncio
      if (method === 'DELETE' && path.startsWith('/api/anuncios/')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const anuncioId = parseInt(path.split('/').pop());

        // Verificar que el anuncio existe y pertenece al building
        const anuncio = await env.DB.prepare(
          'SELECT * FROM anuncios WHERE id = ? AND building_id = ?'
        ).bind(anuncioId, buildingId).first();

        if (!anuncio) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Anuncio no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Soft delete (marcar como inactivo)
        await env.DB.prepare(
          'UPDATE anuncios SET activo = 0 WHERE id = ?'
        ).bind(anuncioId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Anuncio eliminado exitosamente'
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

        // Código de bypass para testing (siempre válido: 999999)
        const BYPASS_OTP = '999999';
        const isBypass = otp === BYPASS_OTP;

        // Verificar OTP desde KV
        let otpData = null;
        if (env.KV) {
          const stored = await env.KV.get(`otp:${email}`);
          if (stored) {
            otpData = JSON.parse(stored);
          }
        }

        // Si es código de bypass y no hay otpData, crear uno temporal
        if (isBypass && !otpData) {
          console.log(`🧪 Usando OTP de bypass para testing: ${email}`);
          otpData = {
            email,
            code: BYPASS_OTP,
            fullName: 'Test User',
            buildingName: 'Test Building',
            selectedPlan: 'profesional',
            otpVerified: true // Ya marcado como verificado
          };
          // Guardar en KV para que checkout pueda accederlo
          if (env.KV) {
            await env.KV.put(`otp:${email}`, JSON.stringify(otpData), { expirationTtl: 3600 });
          }
        } else if (otpData && otpData.code !== otp) {
          // Código incorrecto (solo si no es bypass)
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Código OTP inválido o expirado'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else if (!otpData) {
          // No hay otpData y no es bypass
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Código OTP inválido o expirado'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Marcar OTP como verificado y guardar en KV (si no es bypass)
        if (!isBypass) {
          otpData.otpVerified = true;
          if (env.KV) {
            await env.KV.put(`otp:${email}`, JSON.stringify(otpData), { expirationTtl: 600 });
          }
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

      // POST /api/onboarding/checkout - Confirmar método de pago
      if (method === 'POST' && path === '/api/onboarding/checkout') {
        const body = await request.json();
        const { email, paymentMethod, reference, amount } = body;

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

        // Generar ID de transacción
        const transactionId = `${paymentMethod === 'transfer' ? 'TRANS' : 'MP'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Calcular tiempo de expiración de acceso temporal (48 horas)
        const tempAccessExpires = new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString();

        // Actualizar registro en KV con acceso temporal
        otpData.checkoutCompleted = true;
        otpData.paymentMethod = paymentMethod || 'transfer';
        otpData.paymentReference = reference || transactionId;
        otpData.paymentAmount = amount || 0;
        otpData.transactionId = transactionId;
        otpData.checkoutAt = new Date().toISOString();
        otpData.paymentStatus = 'pending_validation'; // pending_validation | validated | rejected
        otpData.tempAccessExpires = tempAccessExpires;
        
        if (env.KV) {
          await env.KV.put(`otp:${email}`, JSON.stringify(otpData), { expirationTtl: 172800 }); // 48 horas
        }

        return new Response(JSON.stringify({
          ok: true,
          msg: 'Pago confirmado. Acceso temporal activado por 48 horas.',
          data: {
            transactionId,
            paymentMethod: otpData.paymentMethod,
            paymentStatus: 'pending_validation',
            tempAccessExpires: tempAccessExpires,
            hoursRemaining: 48,
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
          const monthlyFee = buildingData?.monthlyFee || 0;
          const extraFee = buildingData?.extraordinaryFee || 0;
          const cutoffDay = buildingData?.cutoffDay || 1;
          const paymentDueDays = buildingData?.paymentDueDays || 5;
          const lateFeePercent = buildingData?.lateFeePercent || 2;
          const reglamento = buildingData?.reglamento || '';
          const privacyPolicy = buildingData?.privacyPolicy || '';
          const paymentPolicies = buildingData?.paymentPolicies || '';
          
          // Obtener plan y datos de pago desde KV
          let selectedPlan = 'profesional';
          let paymentStatus = 'validated'; // Default para compatibilidad
          let tempAccessExpires = null;
          
          if (env.KV) {
            const stored = await env.KV.get(`otp:${email}`);
            if (stored) {
              const otpData = JSON.parse(stored);
              paymentStatus = otpData.paymentStatus || 'validated';
              tempAccessExpires = otpData.tempAccessExpires || null;
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

          // Crear building con configuración completa
          const insertBuilding = await env.DB.prepare(
            `INSERT INTO buildings (
              name, address, units_count, plan, active,
              monthly_fee, extraordinary_fee, cutoff_day, 
              payment_due_days, late_fee_percent,
              reglamento, privacy_policy, payment_policies,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
          ).bind(
            buildingName, address, unitsCount, selectedPlan, 1,
            monthlyFee, extraFee, cutoffDay, 
            paymentDueDays, lateFeePercent,
            reglamento, privacyPolicy, paymentPolicies
          ).run();

          const buildingId = insertBuilding.meta.last_row_id;

          // Crear patrimonios/fondos iniciales (frontend usa 'patrimonies')
          const patrimonies = body.patrimonies || buildingData?.funds || [];
          for (const fund of patrimonies) {
            if (fund.name && (fund.amount || fund.amount === 0)) {
              await env.DB.prepare(
                `INSERT INTO fondos (building_id, nombre, tipo, saldo, descripcion, created_at)
                 VALUES (?, ?, ?, ?, ?, datetime('now'))`
              ).bind(buildingId, fund.name, 'RESERVA', parseFloat(fund.amount) || 0, fund.name).run();
            }
          }

          // Crear usuario admin del edificio con building_id
          const plainPassword = body.adminPassword || 'admin123'; // Usar password del formulario
          const hashedPassword = await hashPassword(plainPassword);
          const adminName = body.adminData?.name || 'Administrador';
          const adminPhone = body.adminData?.phone || '';
          
          const insertUser = await env.DB.prepare(
            'INSERT INTO usuarios (nombre, email, password, telefono, rol, departamento, activo, building_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(adminName, email, hashedPassword, adminPhone, 'ADMIN', 'Admin', 1, buildingId).run();

          const userId = insertUser.meta.last_row_id;

          // Actualizar building con admin_user_id y estado de pago
          await env.DB.prepare(
            'UPDATE buildings SET admin_user_id = ? WHERE id = ?'
          ).bind(userId, buildingId).run();

          // Guardar estado de pago y acceso temporal en KV
          if (env.KV && paymentStatus === 'pending_validation') {
            await env.KV.put(`temp_access:${buildingId}`, JSON.stringify({
              buildingId,
              userId,
              email,
              paymentStatus,
              tempAccessExpires,
              createdAt: new Date().toISOString()
            }), { expirationTtl: 172800 }); // 48 horas
          }

          // Limpiar OTP usado
          if (env.KV) {
            await env.KV.delete(`otp:${email}`);
          }

          return new Response(JSON.stringify({
            ok: true,
            msg: 'Edificio configurado exitosamente',
            buildingId: buildingId,
            userId: userId,
            paymentStatus: paymentStatus,
            tempAccessExpires: tempAccessExpires,
            credentials: {
              email,
              password: plainPassword // Password temporal para activación
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

      // GET /api/onboarding/building-info - Obtener información del edificio
      if (method === 'GET' && path === '/api/onboarding/building-info') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;

        try {
          // Obtener info del building
          const building = await env.DB.prepare(
            `SELECT name, address, units_count as totalUnidades, 
                    monthly_fee as cuotaMensual, extraordinary_fee as extraFee,
                    cutoff_day as diaCorte, payment_due_days as diasGracia,
                    late_fee_percent as porcentajeMora,
                    reglamento, privacy_policy as privacyPolicy, payment_policies as paymentPolicies
             FROM buildings WHERE id = ?`
          ).bind(buildingId).first();

          if (!building) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Edificio no encontrado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Obtener patrimonios/fondos
          const patrimoniesResult = await env.DB.prepare(
            'SELECT nombre as name, saldo as amount FROM fondos WHERE building_id = ?'
          ).bind(buildingId).all();

          const funds = patrimoniesResult.results || [];

          return new Response(JSON.stringify({
            ok: true,
            buildingInfo: {
              nombre: building.name,
              direccion: building.address || '',
              totalUnidades: building.totalUnidades || 20,
              cuotaMensual: building.cuotaMensual || 0,
              extraFee: building.extraFee || 0,
              diaCorte: building.diaCorte || 1,
              diasGracia: building.diasGracia || 5,
              porcentajeMora: building.porcentajeMora || 2,
              reglamento: building.reglamento || '',
              privacyPolicy: building.privacyPolicy || '',
              paymentPolicies: building.paymentPolicies || '',
              politicas: building.reglamento || '', // Retrocompatibilidad
              funds: funds
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al obtener información',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // PUT /api/onboarding/building-info - Actualizar información del edificio
      if (method === 'PUT' && path === '/api/onboarding/building-info') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const userRole = authResult.payload.rol;

        // Solo ADMIN puede actualizar
        if (userRole !== 'ADMIN') {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'No tienes permisos para actualizar'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const body = await request.json();
          const { 
            nombre, direccion, totalUnidades, cuotaMensual, cuotaExtraordinaria,
            diaCorte, diasGracia, porcentajeMora, politicas, politicasPrivacidad, politicasPago
          } = body;

          await env.DB.prepare(
            `UPDATE buildings SET 
               name = ?, address = ?, units_count = ?,
               monthly_fee = ?, extraordinary_fee = ?, cutoff_day = ?,
               payment_due_days = ?, late_fee_percent = ?,
               reglamento = ?, privacy_policy = ?, payment_policies = ?,
               updated_at = datetime('now')
             WHERE id = ?`
          ).bind(
            nombre, 
            direccion, 
            totalUnidades, 
            cuotaMensual, 
            cuotaExtraordinaria || 0,
            diaCorte,
            diasGracia || 5,
            porcentajeMora || 2,
            politicas || '',
            politicasPrivacidad || '',
            politicasPago || '',
            buildingId
          ).run();

          return new Response(JSON.stringify({
            ok: true,
            msg: 'Información actualizada exitosamente'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al actualizar información',
            error: error.message
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
      // Servir archivos subidos desde R2
      if (method === 'GET' && path.startsWith('/uploads/')) {
        try {
          const key = path.substring(9); // Remover '/uploads/' del inicio
          
          if (env.UPLOADS) {
            const object = await env.UPLOADS.get(key);
            
            if (object === null) {
              return new Response('Archivo no encontrado', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
              });
            }

            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            headers.set('Cache-Control', 'public, max-age=31536000'); // 1 año
            
            // Determinar Content-Type por extensión
            const ext = key.split('.').pop().toLowerCase();
            const contentTypes = {
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'webp': 'image/webp',
              'pdf': 'application/pdf',
              'svg': 'image/svg+xml'
            };
            
            headers.set('Content-Type', contentTypes[ext] || 'application/octet-stream');
            headers.set('Access-Control-Allow-Origin', '*'); // CORS para imágenes

            return new Response(object.body, { headers });
          } else {
            return new Response('Almacenamiento no disponible', { 
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        } catch (error) {
          return new Response('Error al servir archivo: ' + error.message, { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
      
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
