/**
 * Clerk Webhook Controller
 * 
 * Maneja webhooks de Clerk para sincronizar usuarios con la base de datos D1.
 * Eventos soportados: user.created, user.updated, user.deleted
 */

import { Webhook } from 'svix';
import Usuario from '../models/Usuario.js';
import { handleControllerError } from '../middleware/error-handler.js';

/**
 * Verifica la firma del webhook de Clerk usando Svix
 * @param {Request} req - Request object
 * @param {string} webhookSecret - Secret del webhook de Clerk
 * @returns {Object} Payload verificado del webhook
 */
async function verifyWebhookSignature(req, webhookSecret) {
  try {
    // Obtener headers necesarios para verificación
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error('Missing svix headers');
    }

    // Obtener el body como texto
    const body = await req.text();

    // Crear instancia de Webhook de Svix
    const wh = new Webhook(webhookSecret);

    // Verificar el webhook
    const payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });

    return payload;
  } catch (error) {
    console.error('Error verificando firma del webhook:', error);
    throw new Error('Webhook verification failed');
  }
}

/**
 * Handler principal del webhook de Clerk
 * @param {Request} req - Request object
 * @param {Object} env - Environment variables (Cloudflare Workers)
 * @returns {Response} Response object
 */
export const handleClerkWebhook = async (req, env) => {
  try {
    // Verificar que sea un POST request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, msg: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar firma del webhook
    let payload;
    try {
      payload = await verifyWebhookSignature(req, env.CLERK_WEBHOOK_SECRET);
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return new Response(
        JSON.stringify({ ok: false, msg: 'Webhook verification failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { type, data } = payload;

    console.log(`Received Clerk webhook: ${type}`, {
      userId: data.id,
      email: data.email_addresses?.[0]?.email_address
    });

    // Manejar diferentes tipos de eventos
    switch (type) {
      case 'user.created':
        await handleUserCreated(data, env.DB);
        break;

      case 'user.updated':
        await handleUserUpdated(data, env.DB);
        break;

      case 'user.deleted':
        await handleUserDeleted(data, env.DB);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    // Responder con éxito
    return new Response(
      JSON.stringify({ ok: true, msg: 'Webhook processed successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        msg: 'Error processing webhook',
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Maneja el evento user.created
 * Crea un nuevo usuario en la base de datos D1
 */
async function handleUserCreated(userData, db) {
  try {
    console.log('Creating user from Clerk webhook:', userData.id);

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.getByClerkId(userData.id, db);
    if (existingUser) {
      console.log('User already exists, skipping creation:', userData.id);
      return;
    }

    // Crear usuario en D1
    const nuevoUsuario = await Usuario.createFromClerk(userData, db);
    
    console.log('User created successfully:', {
      id: nuevoUsuario.id,
      clerkId: nuevoUsuario.clerk_user_id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol
    });

    // Aquí podrías agregar lógica adicional:
    // - Enviar email de bienvenida
    // - Crear registros relacionados (cuotas, permisos, etc.)
    // - Notificar a administradores

  } catch (error) {
    console.error('Error handling user.created webhook:', error);
    throw error;
  }
}

/**
 * Maneja el evento user.updated
 * Actualiza los datos del usuario en la base de datos D1
 */
async function handleUserUpdated(userData, db) {
  try {
    console.log('Updating user from Clerk webhook:', userData.id);

    // Verificar si el usuario existe
    const existingUser = await Usuario.getByClerkId(userData.id, db);
    if (!existingUser) {
      console.log('User not found, creating new user:', userData.id);
      // Si no existe, crearlo (por si el webhook de creación falló)
      await Usuario.createFromClerk(userData, db);
      return;
    }

    // Actualizar usuario en D1
    const usuarioActualizado = await Usuario.updateFromClerk(userData.id, userData, db);
    
    console.log('User updated successfully:', {
      id: usuarioActualizado.id,
      clerkId: usuarioActualizado.clerk_user_id,
      email: usuarioActualizado.email,
      rol: usuarioActualizado.rol
    });

    // Aquí podrías agregar lógica adicional:
    // - Notificar cambios importantes (cambio de rol, departamento, etc.)
    // - Actualizar permisos relacionados
    // - Sincronizar con otros sistemas

  } catch (error) {
    console.error('Error handling user.updated webhook:', error);
    throw error;
  }
}

/**
 * Maneja el evento user.deleted
 * Marca el usuario como inactivo en la base de datos D1 (soft delete)
 */
async function handleUserDeleted(userData, db) {
  try {
    console.log('Deleting user from Clerk webhook:', userData.id);

    // Marcar usuario como inactivo
    const success = await Usuario.deactivateFromClerk(userData.id, db);
    
    if (success) {
      console.log('User deactivated successfully:', userData.id);
    } else {
      console.log('User not found for deletion:', userData.id);
    }

    // Aquí podrías agregar lógica adicional:
    // - Archivar datos del usuario
    // - Notificar a administradores
    // - Limpiar sesiones activas
    // - Transferir responsabilidades (si era admin/comité)

  } catch (error) {
    console.error('Error handling user.deleted webhook:', error);
    throw error;
  }
}

/**
 * Endpoint de prueba para verificar que el webhook está configurado
 */
export const testWebhook = async (req, res) => {
  try {
    return res.json({
      ok: true,
      msg: 'Clerk webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleControllerError(error, res, 'testWebhook');
  }
};

export default {
  handleClerkWebhook,
  testWebhook
};
