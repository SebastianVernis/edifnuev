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

      // === CLERK WEBHOOK ROUTES ===

      // Clerk Webhook - Test endpoint
      if (method === 'GET' && path === '/api/webhooks/clerk/test') {
        return new Response(JSON.stringify({
          ok: true,
          msg: 'Clerk webhook endpoint is active',
          timestamp: new Date().toISOString(),
          env: {
            hasClerkSecret: !!env.CLERK_SECRET_KEY,
            hasWebhookSecret: !!env.CLERK_WEBHOOK_SECRET,
            hasDB: !!env.DB
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Clerk Webhook - Main endpoint
      if (method === 'POST' && path === '/api/webhooks/clerk') {
        try {
          // Get Svix headers for verification
          const svixId = request.headers.get('svix-id');
          const svixTimestamp = request.headers.get('svix-timestamp');
          const svixSignature = request.headers.get('svix-signature');

          if (!svixId || !svixTimestamp || !svixSignature) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Missing svix headers'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Get request body
          const body = await request.text();
          let payload;

          try {
            payload = JSON.parse(body);
          } catch (e) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Invalid JSON payload'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const { type, data } = payload;

          console.log(`Received Clerk webhook: ${type}`, {
            userId: data.id,
            email: data.email_addresses?.[0]?.email_address
          });

          // Handle different webhook events
          if (type === 'user.created') {
            // Extract user data
            const primaryEmail = data.email_addresses.find(e => e.id === data.primary_email_address_id);
            const email = primaryEmail?.email_address || data.email_addresses[0]?.email_address;
            const nombre = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Usuario';
            const rol = data.public_metadata?.rol || 'INQUILINO';
            const departamento = data.public_metadata?.departamento || '';
            const buildingId = data.public_metadata?.buildingId || null;

            // Check if user already exists
            const existingUser = await env.DB.prepare(
              'SELECT id FROM usuarios WHERE clerk_user_id = ?'
            ).bind(data.id).first();

            if (!existingUser) {
              // Create user in D1
              await env.DB.prepare(`
                INSERT INTO usuarios (
                  clerk_user_id, nombre, email, password, rol, departamento,
                  building_id, created_via_clerk, clerk_metadata, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                data.id,
                nombre,
                email,
                '', // No password for Clerk users
                rol,
                departamento,
                buildingId,
                1,
                JSON.stringify(data.public_metadata || {}),
                1
              ).run();

              console.log('User created from Clerk webhook:', data.id);
            }
          } else if (type === 'user.updated') {
            // Extract updated data
            const primaryEmail = data.email_addresses.find(e => e.id === data.primary_email_address_id);
            const email = primaryEmail?.email_address || data.email_addresses[0]?.email_address;
            const nombre = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Usuario';
            const rol = data.public_metadata?.rol;
            const departamento = data.public_metadata?.departamento;

            // Update user in D1
            const updates = ['nombre = ?', 'email = ?', 'clerk_metadata = ?'];
            const bindings = [nombre, email, JSON.stringify(data.public_metadata || {})];

            if (rol) {
              updates.push('rol = ?');
              bindings.push(rol);
            }

            if (departamento) {
              updates.push('departamento = ?');
              bindings.push(departamento);
            }

            bindings.push(data.id);

            await env.DB.prepare(`
              UPDATE usuarios 
              SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
              WHERE clerk_user_id = ?
            `).bind(...bindings).run();

            console.log('User updated from Clerk webhook:', data.id);
          } else if (type === 'user.deleted') {
            // Soft delete user
            await env.DB.prepare(`
              UPDATE usuarios 
              SET activo = 0, updated_at = CURRENT_TIMESTAMP
              WHERE clerk_user_id = ?
            `).bind(data.id).run();

            console.log('User deactivated from Clerk webhook:', data.id);
          }

          return new Response(JSON.stringify({
            ok: true,
            msg: 'Webhook processed successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Error processing Clerk webhook:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error processing webhook',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // === CLERK AUTH ROUTES ===

      // GET /api/auth/me - Get authenticated user with Clerk token
      if (method === 'GET' && path === '/api/auth/me') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'No autorizado - Token requerido'
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const token = authHeader.replace('Bearer ', '');

          // Verify Clerk token (simplified - in production use @clerk/backend)
          // For now, we'll decode the JWT and get the user from DB
          const payload = await verifyJWT(token, env);

          if (!payload || !payload.sub) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Token inválido'
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Get user by clerk_user_id
          const user = await env.DB.prepare(
            'SELECT * FROM usuarios WHERE clerk_user_id = ?'
          ).bind(payload.sub).first();

          if (!user) {
            // New user, return basic info
            return new Response(JSON.stringify({
              ok: true,
              usuario: {
                clerk_user_id: payload.sub,
                email: payload.email || null,
                nombre: payload.name || 'Usuario',
                rol: 'INQUILINO',
                isNewUser: true
              }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Return existing user
          const { password, ...userWithoutPassword } = user;
          return new Response(JSON.stringify({
            ok: true,
            usuario: userWithoutPassword
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Error in /api/auth/me:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al obtener usuario'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/auth/clerk-setup - Complete setup for new Clerk user
      if (method === 'POST' && path === '/api/auth/clerk-setup') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'No autorizado'
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const token = authHeader.replace('Bearer ', '');
          const payload = await verifyJWT(token, env);

          if (!payload || !payload.sub) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Token inválido'
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const body = await request.json();
          const { departamento, telefono, buildingId, rol } = body;

          if (!departamento) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Departamento es requerido'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Check if user already exists
          const existingUser = await env.DB.prepare(
            'SELECT * FROM usuarios WHERE clerk_user_id = ?'
          ).bind(payload.sub).first();

          if (existingUser) {
            const { password, ...userWithoutPassword } = existingUser;
            return new Response(JSON.stringify({
              ok: true,
              usuario: userWithoutPassword
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Create new user
          await env.DB.prepare(`
            INSERT INTO usuarios (
              clerk_user_id, nombre, email, password, rol, departamento,
              telefono, building_id, created_via_clerk, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            payload.sub,
            payload.name || 'Usuario',
            payload.email,
            '', // No password for Clerk users
            rol || 'INQUILINO',
            departamento,
            telefono || '',
            buildingId || null,
            1,
            1
          ).run();

          // Get created user
          const newUser = await env.DB.prepare(
            'SELECT * FROM usuarios WHERE clerk_user_id = ?'
          ).bind(payload.sub).first();

          const { password, ...userWithoutPassword } = newUser;
          return new Response(JSON.stringify({
            ok: true,
            usuario: userWithoutPassword
          }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Error in /api/auth/clerk-setup:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al completar setup'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Login
      if (method === 'POST' && path === '/api/auth/login') {
        const body = await request.json();
        const { email, password } = body;

        console.log('🔐 Login attempt:', email);

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
          console.log('❌ Usuario no encontrado:', email);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Credenciales inválidas'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('✅ Usuario encontrado:', user.email, 'Activo:', user.activo);

        // Verificar que el usuario esté activo
        if (!user.activo) {
          console.log('❌ Usuario inactivo');
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Usuario inactivo. Contacta al administrador.'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verificar password con hash
        const isValidPassword = await verifyPassword(password, user.password);
        console.log('🔑 Password válida:', isValidPassword);

        if (!isValidPassword) {
          console.log('❌ Contraseña incorrecta para:', email);
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
          'SELECT id, nombre, email, rol, departamento, activo FROM usuarios WHERE building_id = ? AND activo = 1'
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
        const { nombre, email, password, rol, departamento, telefono, enviarInvitacion } = body;

        // Validar campos requeridos básicos
        if (!nombre || !email || !departamento) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Faltan campos requeridos: nombre, email, departamento'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Si no es inquilino, password es requerido
        if (rol !== 'INQUILINO' && !password) {
          return new Response(JSON.stringify({
            success: false,
            message: 'La contraseña es requerida para Administradores y Comité'
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

        let hashedPassword = null;
        let invitationToken = null;
        let invitationLink = null;

        // Si es inquilino y se solicita enviar invitación
        if (rol === 'INQUILINO' && enviarInvitacion && !password) {
          // Generar token único de invitación (válido por 7 días)
          invitationToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          // Guardar token en KV
          await env.KV.put(`invitation:${invitationToken}`, JSON.stringify({
            email,
            nombre,
            rol,
            departamento,
            telefono,
            buildingId,
            createdAt: new Date().toISOString()
          }), {
            expirationTtl: 7 * 24 * 60 * 60 // 7 días
          });

          invitationLink = `${env.FRONTEND_URL || 'https://edificio-production.pages.dev'}/establecer-password.html?token=${invitationToken}`;

          // Contraseña temporal (no podrá usarse hasta que establezca la real)
          hashedPassword = await hashPassword(crypto.randomUUID());
        } else {
          // Hashear contraseña proporcionada
          hashedPassword = await hashPassword(password);
        }

        // Insertar nuevo usuario
        await env.DB.prepare(
          'INSERT INTO usuarios (nombre, email, password, rol, departamento, telefono, building_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          nombre,
          email,
          hashedPassword,
          rol || 'INQUILINO',
          departamento,
          telefono || '',
          buildingId,
          invitationToken ? 0 : 1 // Inactivo hasta que establezca contraseña
        ).run();

        const response = {
          success: true,
          message: 'Usuario creado exitosamente'
        };

        if (invitationLink) {
          response.invitationLink = invitationLink;
          response.message = 'Usuario creado. Link de invitación generado.';
        }

        return new Response(JSON.stringify(response), {
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

      // POST /api/usuarios/verify-invitation - Verificar token de invitación
      if (method === 'POST' && path === '/api/usuarios/verify-invitation') {
        try {
          const body = await request.json();
          const { token } = body;

          if (!token) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Token no proporcionado'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Buscar token en KV
          const invitationData = await env.KV.get(`invitation:${token}`);

          if (!invitationData) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Token inválido o expirado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const data = JSON.parse(invitationData);

          return new Response(JSON.stringify({
            ok: true,
            usuario: {
              nombre: data.nombre,
              email: data.email,
              departamento: data.departamento
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error verificando invitación:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al verificar invitación'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/usuarios/set-password - Establecer contraseña con token de invitación
      if (method === 'POST' && path === '/api/usuarios/set-password') {
        try {
          const body = await request.json();
          const { token, password } = body;

          if (!token || !password) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Token y contraseña son requeridos'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          if (password.length < 6) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'La contraseña debe tener al menos 6 caracteres'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Buscar token en KV
          const invitationData = await env.KV.get(`invitation:${token}`);

          if (!invitationData) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Token inválido o expirado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const data = JSON.parse(invitationData);

          // Hashear nueva contraseña
          const hashedPassword = await hashPassword(password);

          // Actualizar usuario con la nueva contraseña y activarlo
          const updateResult = await env.DB.prepare(
            'UPDATE usuarios SET password = ?, activo = 1 WHERE email = ? AND building_id = ?'
          ).bind(hashedPassword, data.email, data.buildingId).run();

          if (updateResult.meta.changes === 0) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Usuario no encontrado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Eliminar token usado
          await env.KV.delete(`invitation:${token}`);

          return new Response(JSON.stringify({
            ok: true,
            msg: 'Contraseña establecida correctamente'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error estableciendo contraseña:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al establecer contraseña'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
        const tipo = url.searchParams.get('tipo');
        const departamento = url.searchParams.get('departamento');

        let query = 'SELECT * FROM cuotas WHERE building_id = ?';
        const params = [buildingId];

        if (mes && anio) {
          query += ' AND mes = ? AND anio = ?';
          params.push(mes, anio);
        }

        if (tipo && tipo !== 'TODOS') {
          query += ' AND tipo = ?';
          params.push(tipo);
        }

        if (departamento) {
          query += ' AND departamento = ?';
          params.push(departamento);
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
        const { mes, anio, monto, departamentos, concepto, tipo } = body;

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
          console.log('📝 Iniciando generación masiva de cuotas');
          console.log('   Building ID:', buildingId);
          console.log('   Mes:', mes, 'Año:', anio);

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

          console.log('   Total unidades:', building.units_count);

          let cuotasCreadas = 0;
          let cuotasExistentes = 0;
          let errores = [];
          const totalUnits = building.units_count || 20;

          // Si se especificó "TODOS", generar para todas las unidades
          if (departamentos === 'TODOS') {
            const cutoffDay = building.cutoff_day || 5;
            const mesIndex = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].indexOf(mes);
            const fechaVencimiento = new Date(anio, mesIndex, cutoffDay).toISOString().split('T')[0];

            // Obtener cuotas existentes en batch
            const existentes = await env.DB.prepare(
              'SELECT departamento FROM cuotas WHERE mes = ? AND anio = ? AND building_id = ?'
            ).bind(mes, anio, buildingId).all();

            const deptosExistentes = new Set(existentes.results.map(c => c.departamento));

            // Preparar batch insert
            const batch = [];
            for (let i = 1; i <= totalUnits; i++) {
              const depto = i.toString().padStart(3, '0');

              if (deptosExistentes.has(depto)) {
                cuotasExistentes++;
              } else {
                batch.push(
                  env.DB.prepare(
                    'INSERT INTO cuotas (mes, anio, departamento, monto, pagado, fecha_vencimiento, tipo, concepto, building_id) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)'
                  ).bind(mes, anio, depto, monto, fechaVencimiento, tipo || 'ORDINARIA', concepto || null, buildingId)
                );
              }
            }

            // Ejecutar batch
            if (batch.length > 0) {
              try {
                console.log(`   Ejecutando batch de ${batch.length} inserts...`);
                const results = await env.DB.batch(batch);
                cuotasCreadas = batch.length;
                console.log(`   ✅ Batch completado: ${cuotasCreadas} cuotas creadas`);
              } catch (error) {
                console.error('   ❌ Error en batch:', error);
                errores.push(`Error en batch: ${error.message}`);

                // Intentar insertar una por una si batch falla
                console.log('   🔄 Intentando inserts individuales...');
                for (const stmt of batch) {
                  try {
                    await stmt.run();
                    cuotasCreadas++;
                  } catch (e) {
                    errores.push(`Error individual: ${e.message}`);
                  }
                }
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
                    'INSERT INTO cuotas (mes, anio, departamento, monto, pagado, fecha_vencimiento, tipo, concepto, building_id) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)'
                  ).bind(mes, anio, depto, monto, fechaVencimiento, tipo || 'ORDINARIA', concepto || null, buildingId).run();

                  cuotasCreadas++;
                }
              } catch (error) {
                errores.push(`Depto ${depto}: ${error.message}`);
              }
            }
          }

          // Log para debug
          console.log(`Generación masiva: ${cuotasCreadas} creadas, ${cuotasExistentes} existentes, ${errores.length} errores`);
          if (errores.length > 0) {
            console.log('Errores:', errores.slice(0, 5)); // Primeros 5 errores
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Generación completada: ${cuotasCreadas} cuotas creadas, ${cuotasExistentes} ya existían${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
            cuotasCreadas,
            cuotasExistentes,
            totalUnidades: totalUnits,
            errores: errores.length > 0 ? errores.slice(0, 10) : null
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

      // PUT /api/cuotas/:id/estado - Validar pago de cuota
      if (method === 'PUT' && path.match(/^\/api\/cuotas\/\d+\/estado$/)) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const cuotaId = parseInt(path.split('/')[3]);
        const body = await request.json();
        const { estado, fechaPago, comprobante, metodoPago } = body;

        // Verificar que la cuota existe y pertenece al building
        const cuota = await env.DB.prepare(
          'SELECT * FROM cuotas WHERE id = ? AND building_id = ?'
        ).bind(cuotaId, buildingId).first();

        if (!cuota) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Cuota no encontrada'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Actualizar estado de la cuota
        const pagado = estado === 'PAGADO' ? 1 : 0;
        const estabaPagado = cuota.pagado === 1;

        await env.DB.prepare(
          'UPDATE cuotas SET pagado = ?, fecha_pago = ?, metodo_pago = ?, referencia = ? WHERE id = ?'
        ).bind(
          pagado,
          fechaPago || null,
          metodoPago || null,
          comprobante || null,
          cuotaId
        ).run();

        // Si se marca como pagado y no estaba pagado antes, sumar al fondo de ingresos
        if (pagado && !estabaPagado) {
          const building = await env.DB.prepare(
            'SELECT fondo_ingresos_id FROM buildings WHERE id = ?'
          ).bind(buildingId).first();

          if (building && building.fondo_ingresos_id) {
            const montoTotal = parseFloat(cuota.monto) + parseFloat(cuota.monto_extraordinario || 0) + parseFloat(cuota.monto_mora || 0);

            // Sumar al fondo
            await env.DB.prepare(
              'UPDATE fondos SET saldo = saldo + ? WHERE id = ?'
            ).bind(montoTotal, building.fondo_ingresos_id).run();

            // Registrar movimiento
            await env.DB.prepare(
              'INSERT INTO movimientos_fondos (fondo_id, tipo, monto, concepto, fecha, building_id) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
              building.fondo_ingresos_id,
              'INGRESO',
              montoTotal,
              `Pago de cuota: ${cuota.mes} ${cuota.anio} - Depto ${cuota.departamento}`,
              fechaPago || new Date().toISOString().split('T')[0],
              buildingId
            ).run();
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: pagado ? 'Pago validado y agregado al fondo exitosamente' : 'Cuota marcada como pendiente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/cuotas/agregar-extraordinaria - Agregar monto extraordinario a cuotas
      if (method === 'POST' && path === '/api/cuotas/agregar-extraordinaria') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { mes, anio, montoTotal, concepto } = body;

        if (!mes || !anio || !montoTotal) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const building = await env.DB.prepare(
            'SELECT units_count FROM buildings WHERE id = ?'
          ).bind(buildingId).first();

          const totalUnits = building.units_count || 20;
          const montoPorUnidad = montoTotal / totalUnits;

          let cuotasActualizadas = 0;

          for (let i = 1; i <= totalUnits; i++) {
            const depto = i.toString().padStart(3, '0');

            const cuota = await env.DB.prepare(
              'SELECT id, monto_extraordinario FROM cuotas WHERE mes = ? AND anio = ? AND departamento = ? AND building_id = ?'
            ).bind(mes, anio, depto, buildingId).first();

            if (cuota) {
              const nuevoMontoExtra = parseFloat(cuota.monto_extraordinario || 0) + montoPorUnidad;

              await env.DB.prepare(
                'UPDATE cuotas SET monto_extraordinario = ?, concepto_extraordinario = ? WHERE id = ?'
              ).bind(nuevoMontoExtra, concepto, cuota.id).run();

              cuotasActualizadas++;
            }
          }

          return new Response(JSON.stringify({
            success: true,
            message: `Monto extraordinario agregado a ${cuotasActualizadas} cuotas`,
            cuotasActualizadas,
            montoPorUnidad: montoPorUnidad.toFixed(2)
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Error al agregar monto extraordinario',
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

      // GET /api/fondos - Obtener fondos y movimientos
      if (method === 'GET' && path === '/api/fondos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;

        // Obtener fondos
        const { results: fondos } = await env.DB.prepare(
          'SELECT * FROM fondos WHERE building_id = ?'
        ).bind(buildingId).all();

        // Obtener movimientos con nombre del fondo
        const { results: movimientos } = await env.DB.prepare(
          `SELECT mf.*, f.nombre as fondo_nombre 
           FROM movimientos_fondos mf
           JOIN fondos f ON mf.fondo_id = f.id
           WHERE mf.building_id = ?
           ORDER BY mf.fecha DESC, mf.id DESC
           LIMIT 50`
        ).bind(buildingId).all();

        return new Response(JSON.stringify({
          success: true,
          fondos: fondos,
          movimientos: movimientos || []
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

        // Buscar fondos por ID y building_id
        const fondoOrigen = await env.DB.prepare(
          'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
        ).bind(parseInt(origen), buildingId).first();
        const fondoDestino = await env.DB.prepare(
          'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
        ).bind(parseInt(destino), buildingId).first();

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

          // Intentar con 'imagen' primero, luego 'file' por compatibilidad
          const file = formData.get('imagen') || formData.get('file');
          console.log('   Archivo obtenido:', !!file);

          if (!file) {
            console.log('❌ No se encontró archivo en FormData');
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

      // POST /api/cierres - Generar cierre automático
      if (method === 'POST' && path === '/api/cierres') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { tipo, mes, anio } = body;

        if (!tipo || !anio) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Tipo y año son requeridos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (tipo === 'MENSUAL' && !mes) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Mes es requerido para cierre mensual'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          // Calcular totales automáticamente
          let ingresos = 0;
          let egresos = 0;

          if (tipo === 'MENSUAL') {
            // Ingresos: cuotas pagadas del mes
            const cuotasPagadas = await env.DB.prepare(
              'SELECT SUM(monto + monto_extraordinario + monto_mora) as total FROM cuotas WHERE building_id = ? AND mes = ? AND anio = ? AND pagado = 1'
            ).bind(buildingId, mes, anio).first();

            ingresos = parseFloat(cuotasPagadas?.total || 0);

            // Egresos: gastos del mes
            const mesIndex = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].indexOf(mes);

            const gastosDelMes = await env.DB.prepare(
              `SELECT SUM(monto) as total FROM gastos 
               WHERE building_id = ? 
               AND strftime('%Y', fecha) = ? 
               AND strftime('%m', fecha) = ?`
            ).bind(buildingId, anio.toString(), (mesIndex + 1).toString().padStart(2, '0')).first();

            egresos = parseFloat(gastosDelMes?.total || 0);
          } else {
            // ANUAL: todos los ingresos y egresos del año
            const cuotasAnuales = await env.DB.prepare(
              'SELECT SUM(monto + monto_extraordinario + monto_mora) as total FROM cuotas WHERE building_id = ? AND anio = ? AND pagado = 1'
            ).bind(buildingId, anio).first();

            ingresos = parseFloat(cuotasAnuales?.total || 0);

            const gastosAnuales = await env.DB.prepare(
              `SELECT SUM(monto) as total FROM gastos 
               WHERE building_id = ? 
               AND strftime('%Y', fecha) = ?`
            ).bind(buildingId, anio.toString()).first();

            egresos = parseFloat(gastosAnuales?.total || 0);
          }

          const saldoFinal = ingresos - egresos;

          const result = await env.DB.prepare(
            'INSERT INTO cierres (tipo, mes, anio, total_ingresos, total_egresos, saldo_final, created_by, building_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            tipo,
            mes || null,
            anio,
            ingresos,
            egresos,
            saldoFinal,
            authResult.payload.userId,
            buildingId
          ).run();

          return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
            message: `Cierre ${tipo.toLowerCase()} generado exitosamente`,
            cierre: {
              tipo,
              mes,
              anio,
              ingresos,
              egresos,
              saldo: saldoFinal
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Error al generar cierre',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
          const fondosIds = [];

          for (const fund of patrimonies) {
            if (fund.name && (fund.amount || fund.amount === 0)) {
              const insertFondo = await env.DB.prepare(
                `INSERT INTO fondos (building_id, nombre, tipo, saldo, descripcion, created_at)
                 VALUES (?, ?, ?, ?, ?, datetime('now'))`
              ).bind(buildingId, fund.name, 'RESERVA', parseFloat(fund.amount) || 0, fund.name).run();

              fondosIds.push(insertFondo.meta.last_row_id);
            }
          }

          // Asignar fondo de ingresos si se seleccionó
          const fondoIngresosIndex = body.fondoIngresosIndex;
          let fondoIngresosId = null;

          if (fondoIngresosIndex !== undefined && fondosIds[fondoIngresosIndex]) {
            fondoIngresosId = fondosIds[fondoIngresosIndex];

            // Actualizar building con fondo de ingresos
            await env.DB.prepare(
              'UPDATE buildings SET fondo_ingresos_id = ? WHERE id = ?'
            ).bind(fondoIngresosId, buildingId).run();
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
                    fondo_ingresos_id as fondoIngresosId,
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
              fondoIngresosId: building.fondoIngresosId || null,
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
            diaCorte, diasGracia, porcentajeMora, politicas, politicasPrivacidad, politicasPago,
            fondoIngresosId
          } = body;

          await env.DB.prepare(
            `UPDATE buildings SET 
               name = ?, address = ?, units_count = ?,
               monthly_fee = ?, extraordinary_fee = ?, cutoff_day = ?,
               payment_due_days = ?, late_fee_percent = ?,
               fondo_ingresos_id = ?,
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
            fondoIngresosId || null,
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

        try {
          const { results } = await env.DB.prepare(
            'SELECT * FROM proyectos WHERE building_id = ? AND activo = 1 ORDER BY prioridad DESC, created_at DESC'
          ).bind(buildingId).all();

          const proyectos = results || [];

          // Calcular resumen
          const total = proyectos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

          // Obtener total de unidades del building
          const building = await env.DB.prepare(
            'SELECT units_count FROM buildings WHERE id = ?'
          ).bind(buildingId).first();

          const totalUnidades = building?.units_count || 20;
          const porDepartamento = totalUnidades > 0 ? total / totalUnidades : 0;

          return new Response(JSON.stringify({
            ok: true,
            proyectos: proyectos,
            resumen: {
              total: total,
              porDepartamento: porDepartamento,
              totalUnidades: totalUnidades
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al cargar proyectos',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/proyectos - Crear proyecto con cuotas diferidas
      if (method === 'POST' && path === '/api/proyectos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const body = await request.json();
        const { nombre, monto, prioridad, descripcion, mesesDiferimiento, inicioCobro } = body;

        console.log('📋 Crear proyecto:', { nombre, monto, mesesDiferimiento, inicioCobro });

        if (!nombre || !monto || !prioridad) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Datos incompletos'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          // 1. Crear el proyecto
          const resultProyecto = await env.DB.prepare(
            'INSERT INTO proyectos (nombre, descripcion, monto, prioridad, building_id) VALUES (?, ?, ?, ?, ?)'
          ).bind(nombre, descripcion || '', monto, prioridad, buildingId).run();

          const proyectoId = resultProyecto.meta.last_row_id;
          console.log('✅ Proyecto creado ID:', proyectoId);

          // 2. Obtener inquilinos activos
          const inquilinos = await env.DB.prepare(
            'SELECT id, departamento FROM usuarios WHERE building_id = ? AND rol = ? AND activo = 1'
          ).bind(buildingId, 'INQUILINO').all();

          const totalInquilinos = inquilinos.results.length;
          console.log('👥 Inquilinos activos:', totalInquilinos);

          if (totalInquilinos === 0) {
            return new Response(JSON.stringify({
              ok: true,
              msg: 'Proyecto creado pero no hay inquilinos activos para generar cuotas',
              id: proyectoId
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // 3. Calcular montos
          const mesesDif = parseInt(mesesDiferimiento) || 1;
          const montoPorDepto = parseFloat(monto) / totalInquilinos;
          const montoPorMes = montoPorDepto / mesesDif;

          console.log('💰 Distribución:', { montoPorDepto, montoPorMes, meses: mesesDif });

          // 4. Obtener mes y año actual
          const ahora = new Date();
          const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

          let mesInicio = ahora.getMonth(); // 0-11
          let anioInicio = ahora.getFullYear();

          // Si inicio es "siguiente", avanzar un mes
          if (inicioCobro === 'siguiente') {
            mesInicio++;
            if (mesInicio > 11) {
              mesInicio = 0;
              anioInicio++;
            }
          }

          console.log('📅 Inicio cobro:', meses[mesInicio], anioInicio);

          let cuotasCreadas = 0;
          let cuotasActualizadas = 0;

          // 5. Para cada inquilino, generar/actualizar cuotas
          for (const inquilino of inquilinos.results) {
            for (let i = 0; i < mesesDif; i++) {
              let mesIdx = mesInicio + i;
              let anio = anioInicio;

              // Ajustar año si pasamos diciembre
              while (mesIdx > 11) {
                mesIdx -= 12;
                anio++;
              }

              const mesNombre = meses[mesIdx];

              // Verificar si ya existe cuota para este depto/mes/año
              const cuotaExistente = await env.DB.prepare(
                'SELECT id, monto, pagado FROM cuotas WHERE departamento = ? AND mes = ? AND anio = ? AND building_id = ?'
              ).bind(inquilino.departamento, mesNombre, anio, buildingId).first();

              if (cuotaExistente) {
                // Si la cuota ya está pagada, crear cuota extraordinaria
                if (cuotaExistente.pagado === 1) {
                  await env.DB.prepare(
                    'INSERT INTO cuotas (departamento, mes, anio, monto, tipo, pagado, fecha_vencimiento, building_id, concepto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                  ).bind(
                    inquilino.departamento,
                    mesNombre,
                    anio,
                    montoPorMes,
                    'EXTRAORDINARIA',
                    0,
                    `${anio}-${String(mesIdx + 1).padStart(2, '0')}-${ahora.getDate()}`,
                    buildingId,
                    `Proyecto: ${nombre} (${i + 1}/${mesesDif})`
                  ).run();
                  cuotasCreadas++;
                } else {
                  // Sumar al monto existente
                  const nuevoMonto = parseFloat(cuotaExistente.monto) + montoPorMes;
                  await env.DB.prepare(
                    'UPDATE cuotas SET monto = ?, concepto = ? WHERE id = ?'
                  ).bind(
                    nuevoMonto,
                    (cuotaExistente.concepto || '') + ` + Proyecto: ${nombre} (${i + 1}/${mesesDif})`,
                    cuotaExistente.id
                  ).run();
                  cuotasActualizadas++;
                }
              } else {
                // Crear nueva cuota
                await env.DB.prepare(
                  'INSERT INTO cuotas (departamento, mes, anio, monto, tipo, pagado, fecha_vencimiento, building_id, concepto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                ).bind(
                  inquilino.departamento,
                  mesNombre,
                  anio,
                  montoPorMes,
                  'EXTRAORDINARIA',
                  0,
                  `${anio}-${String(mesIdx + 1).padStart(2, '0')}-${ahora.getDate()}`,
                  buildingId,
                  `Proyecto: ${nombre} (${i + 1}/${mesesDif})`
                ).run();
                cuotasCreadas++;
              }
            }
          }

          console.log('✅ Cuotas generadas:', cuotasCreadas, 'Actualizadas:', cuotasActualizadas);

          return new Response(JSON.stringify({
            ok: true,
            msg: `Proyecto creado exitosamente. ${cuotasCreadas} cuotas creadas, ${cuotasActualizadas} actualizadas.`,
            id: proyectoId,
            stats: {
              inquilinos: totalInquilinos,
              cuotasCreadas,
              cuotasActualizadas,
              mesesDiferimiento: mesesDif,
              montoPorMes,
              montoPorDepto
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error creando proyecto:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al crear proyecto',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/proyectos/:id/generar-cuotas - Generar cuotas para proyecto existente
      if (method === 'POST' && path.includes('/generar-cuotas')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const proyectoId = parseInt(path.split('/')[3]);
        const body = await request.json();
        const { mesesDiferimiento, inicioCobro } = body;

        console.log('⚡ Generar cuotas proyecto ID:', proyectoId, { mesesDiferimiento, inicioCobro });

        try {
          // Obtener proyecto
          const proyecto = await env.DB.prepare(
            'SELECT * FROM proyectos WHERE id = ? AND building_id = ?'
          ).bind(proyectoId, buildingId).first();

          if (!proyecto) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'Proyecto no encontrado'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Obtener inquilinos activos
          const inquilinos = await env.DB.prepare(
            'SELECT id, departamento FROM usuarios WHERE building_id = ? AND rol = ? AND activo = 1'
          ).bind(buildingId, 'INQUILINO').all();

          const totalInquilinos = inquilinos.results.length;

          if (totalInquilinos === 0) {
            return new Response(JSON.stringify({
              ok: false,
              msg: 'No hay inquilinos activos'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Calcular montos
          const mesesDif = parseInt(mesesDiferimiento) || 1;
          const montoPorDepto = parseFloat(proyecto.monto) / totalInquilinos;
          const montoPorMes = montoPorDepto / mesesDif;

          // Obtener mes y año
          const ahora = new Date();
          const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

          let mesInicio = ahora.getMonth();
          let anioInicio = ahora.getFullYear();

          if (inicioCobro === 'siguiente') {
            mesInicio++;
            if (mesInicio > 11) {
              mesInicio = 0;
              anioInicio++;
            }
          }

          let cuotasCreadas = 0;
          let cuotasActualizadas = 0;

          // Generar cuotas para cada inquilino
          for (const inquilino of inquilinos.results) {
            for (let i = 0; i < mesesDif; i++) {
              let mesIdx = mesInicio + i;
              let anio = anioInicio;

              while (mesIdx > 11) {
                mesIdx -= 12;
                anio++;
              }

              const mesNombre = meses[mesIdx];

              const cuotaExistente = await env.DB.prepare(
                'SELECT id, monto, pagado FROM cuotas WHERE departamento = ? AND mes = ? AND anio = ? AND building_id = ?'
              ).bind(inquilino.departamento, mesNombre, anio, buildingId).first();

              if (cuotaExistente) {
                if (cuotaExistente.pagado === 1) {
                  await env.DB.prepare(
                    'INSERT INTO cuotas (departamento, mes, anio, monto, tipo, pagado, fecha_vencimiento, building_id, concepto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                  ).bind(
                    inquilino.departamento,
                    mesNombre,
                    anio,
                    montoPorMes,
                    'EXTRAORDINARIA',
                    0,
                    `${anio}-${String(mesIdx + 1).padStart(2, '0')}-${ahora.getDate()}`,
                    buildingId,
                    `Proyecto: ${proyecto.nombre} (${i + 1}/${mesesDif})`
                  ).run();
                  cuotasCreadas++;
                } else {
                  const nuevoMonto = parseFloat(cuotaExistente.monto) + montoPorMes;
                  await env.DB.prepare(
                    'UPDATE cuotas SET monto = ?, concepto = ? WHERE id = ?'
                  ).bind(
                    nuevoMonto,
                    `Cuota + Proyecto: ${proyecto.nombre} (${i + 1}/${mesesDif})`,
                    cuotaExistente.id
                  ).run();
                  cuotasActualizadas++;
                }
              } else {
                await env.DB.prepare(
                  'INSERT INTO cuotas (departamento, mes, anio, monto, tipo, pagado, fecha_vencimiento, building_id, concepto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                ).bind(
                  inquilino.departamento,
                  mesNombre,
                  anio,
                  montoPorMes,
                  'EXTRAORDINARIA',
                  0,
                  `${anio}-${String(mesIdx + 1).padStart(2, '0')}-${ahora.getDate()}`,
                  buildingId,
                  `Proyecto: ${proyecto.nombre} (${i + 1}/${mesesDif})`
                ).run();
                cuotasCreadas++;
              }
            }
          }

          console.log('✅ Cuotas proyecto existente:', cuotasCreadas, 'creadas,', cuotasActualizadas, 'actualizadas');

          return new Response(JSON.stringify({
            ok: true,
            msg: `Cuotas generadas exitosamente. ${cuotasCreadas} creadas, ${cuotasActualizadas} actualizadas.`,
            stats: {
              inquilinos: totalInquilinos,
              cuotasCreadas,
              cuotasActualizadas,
              mesesDiferimiento: mesesDif,
              montoPorMes,
              montoPorDepto
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error generando cuotas:', error);
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error al generar cuotas',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // DELETE /api/proyectos/:id - Eliminar proyecto
      if (method === 'DELETE' && path.startsWith('/api/proyectos/')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const proyectoId = parseInt(path.split('/').pop());

        const proyecto = await env.DB.prepare(
          'SELECT * FROM proyectos WHERE id = ? AND building_id = ?'
        ).bind(proyectoId, buildingId).first();

        if (!proyecto) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Proyecto no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Buscar cuotas que tienen el concepto de este proyecto
        const conceptoBuscar = `Proyecto: ${proyecto.nombre}`;

        const cuotasAfectadas = await env.DB.prepare(
          'SELECT id, monto_extraordinario FROM cuotas WHERE concepto_extraordinario = ? AND building_id = ?'
        ).bind(conceptoBuscar, buildingId).all();

        let cuotasLimpiadas = 0;

        // Limpiar el monto extraordinario de las cuotas asociadas
        for (const cuota of cuotasAfectadas.results || []) {
          await env.DB.prepare(
            'UPDATE cuotas SET monto_extraordinario = 0, concepto_extraordinario = NULL WHERE id = ?'
          ).bind(cuota.id).run();
          cuotasLimpiadas++;
        }

        // Soft delete del proyecto
        await env.DB.prepare(
          'UPDATE proyectos SET activo = 0 WHERE id = ?'
        ).bind(proyectoId).run();

        return new Response(JSON.stringify({
          ok: true,
          msg: `Proyecto eliminado exitosamente. ${cuotasLimpiadas} cuotas actualizadas (monto extraordinario removido).`,
          cuotasLimpiadas
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // === SUPER ADMIN ENDPOINTS ===

      // POST /api/super-admin/login - Login de super admin
      // POST /api/super-admin/login - Login de super admin (Basado en Secretos)
      if (method === 'POST' && path === '/api/super-admin/login') {
        const body = await request.json();
        const { email, password } = body;

        const SA_EMAIL = env.SUPER_ADMIN_EMAIL;
        const SA_PASSWORD = env.SUPER_ADMIN_PASSWORD;

        if (!SA_EMAIL || !SA_PASSWORD) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Error de configuración en el servidor. Secretos no encontrados.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (email !== SA_EMAIL || password !== SA_PASSWORD) {
          return new Response(JSON.stringify({
            ok: false,
            msg: 'Credenciales de Super Admin inválidas'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generar JWT para el Super Admin virtual (ID 0)
        const token = await generateJWT({
          userId: 0,
          email: SA_EMAIL,
          rol: 'SUPERADMIN',
          departamento: 'System'
        }, env);

        return new Response(JSON.stringify({
          ok: true,
          token,
          usuario: {
            id: 0,
            nombre: 'System Administrator',
            rol: 'SUPERADMIN'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/super-admin/stats - Estadísticas globales
      if (method === 'GET' && path === '/api/super-admin/stats') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ ok: false, msg: 'No autorizado' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const buildingsTotal = await env.DB.prepare('SELECT COUNT(*) as total FROM buildings').first();
        const usuariosTotal = await env.DB.prepare('SELECT COUNT(*) as total FROM usuarios').first();
        const buildingsActivos = await env.DB.prepare('SELECT COUNT(*) as total FROM buildings WHERE active = 1').first();

        return new Response(JSON.stringify({
          ok: true,
          stats: {
            totalBuildings: buildingsTotal?.total || 0,
            totalUsuarios: usuariosTotal?.total || 0,
            buildingsActivos: buildingsActivos?.total || 0,
            pagosPendientes: 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/super-admin/buildings - Listar todos los buildings
      if (method === 'GET' && path === '/api/super-admin/buildings') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ ok: false, msg: 'No autorizado' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { results } = await env.DB.prepare(`
          SELECT b.*, u.email as admin_email, u.nombre as admin_nombre
          FROM buildings b
          LEFT JOIN usuarios u ON b.admin_user_id = u.id
          ORDER BY b.id DESC
        `).all();

        return new Response(JSON.stringify({
          ok: true,
          buildings: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /api/super-admin/buildings/:id/limits - Actualizar límites
      if (method === 'PUT' && path.match(/^\/api\/super-admin\/buildings\/\d+\/limits$/)) {
        const buildingId = parseInt(path.split('/')[4]);
        const body = await request.json();
        const { units_count } = body;

        await env.DB.prepare(
          'UPDATE buildings SET units_count = ? WHERE id = ?'
        ).bind(units_count, buildingId).run();

        return new Response(JSON.stringify({
          ok: true,
          msg: 'Límites actualizados'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /api/super-admin/buildings/:id/status - Activar/Desactivar
      if (method === 'PUT' && path.match(/^\/api\/super-admin\/buildings\/\d+\/status$/)) {
        const buildingId = parseInt(path.split('/')[4]);
        const body = await request.json();
        const { active } = body;

        await env.DB.prepare(
          'UPDATE buildings SET active = ? WHERE id = ?'
        ).bind(active, buildingId).run();

        return new Response(JSON.stringify({
          ok: true,
          msg: active ? 'Building activado' : 'Building desactivado'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }


      // === DOCUMENTOS ENDPOINTS ===
      // GET /api/documentos - Obtener documentos del edificio
      if (method === 'GET' && path === '/api/documentos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const { results } = await env.DB.prepare(
          'SELECT * FROM documentos WHERE building_id = ? ORDER BY created_at DESC'
        ).bind(buildingId).all();

        return new Response(JSON.stringify({
          success: true,
          documentos: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/documentos - Subir documento
      if (method === 'POST' && path === '/api/documentos') {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;

        try {
          const formData = await request.formData();
          const file = formData.get('file');
          const tipo = formData.get('tipo');
          const nombre = formData.get('nombre');
          const descripcion = formData.get('descripcion');

          if (!file || !tipo || !nombre) {
            return new Response(JSON.stringify({
              success: false,
              message: 'Datos incompletos'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Subir a R2
          const timestamp = Date.now();
          const fileName = `${timestamp}_${file.name}`;
          const key = `documentos/${fileName}`;

          if (env.UPLOADS) {
            const fileBuffer = await file.arrayBuffer();

            await env.UPLOADS.put(key, fileBuffer, {
              httpMetadata: {
                contentType: file.type
              }
            });

            // Guardar en BD
            const result = await env.DB.prepare(
              'INSERT INTO documentos (building_id, tipo, nombre, archivo_url, descripcion, created_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
              buildingId,
              tipo,
              nombre,
              `/uploads/${key}`,
              descripcion || '',
              authResult.payload.userId
            ).run();

            return new Response(JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              message: 'Documento subido exitosamente'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
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
            message: 'Error al subir documento',
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // DELETE /api/documentos/:id - Eliminar documento
      if (method === 'DELETE' && path.startsWith('/api/documentos/')) {
        const authResult = await verifyAuth(request, env);
        if (authResult instanceof Response) return authResult;

        const buildingId = authResult.payload.buildingId;
        const docId = parseInt(path.split('/').pop());

        const doc = await env.DB.prepare(
          'SELECT * FROM documentos WHERE id = ? AND building_id = ?'
        ).bind(docId, buildingId).first();

        if (!doc) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Documento no encontrado'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await env.DB.prepare(
          'DELETE FROM documentos WHERE id = ?'
        ).bind(docId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Documento eliminado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }


      // === STATIC ASSETS ===
      // Servir archivos subidos desde R2
      if (method === 'GET' && path.startsWith('/uploads/')) {
        try {
          const key = path.substring(9); // Remover '/uploads/' del inicio
          console.log('📥 Sirviendo archivo desde R2:', key);

          if (env.UPLOADS) {
            const object = await env.UPLOADS.get(key);

            if (object === null) {
              console.log('❌ Archivo no encontrado en R2:', key);
              // Listar claves disponibles para debugging
              const list = await env.UPLOADS.list({ prefix: 'anuncios/', limit: 10 });
              console.log('📋 Archivos disponibles:', list.objects.map(o => o.key));

              return new Response(JSON.stringify({
                error: 'Archivo no encontrado',
                key: key,
                available: list.objects.map(o => o.key)
              }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }

            console.log('✅ Archivo encontrado en R2:', key);

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

            // Add all CORS headers
            Object.entries(corsHeaders).forEach(([k, v]) => {
              headers.set(k, v);
            });

            return new Response(object.body, { headers });
          } else {
            return new Response('Almacenamiento no disponible', {
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
            });
          }
        } catch (error) {
          return new Response('Error al servir archivo: ' + error.message, {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
      }

      // Mapear rutas HTML
      const htmlRoutes = {
        '/': 'index.html',
        '/login': 'login.html',
        '/admin': 'admin.html',
        '/inquilino': 'inquilino.html',

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
