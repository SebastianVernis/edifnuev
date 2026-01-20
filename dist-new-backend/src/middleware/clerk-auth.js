/**
 * Clerk Authentication Middleware for Cloudflare Workers
 * 
 * Este middleware verifica tokens JWT de Clerk y sincroniza usuarios con la base de datos D1.
 * Soporta tanto tokens de sesión de Clerk como el sistema JWT legacy.
 */

import { verifyToken } from '@clerk/backend';
import Usuario from '../models/Usuario.js';

/**
 * Verifica el token de Clerk y carga el usuario desde D1
 * @param {Request} req - Request object
 * @param {Object} env - Environment variables (Cloudflare Workers)
 * @returns {Object} - Usuario autenticado o null
 */
export async function verifyClerkToken(req, env) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar token con Clerk
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      jwtKey: env.CLERK_JWT_KEY,
      authorizedParties: [env.FRONTEND_URL, env.APP_URL, 'http://localhost:3000', 'http://localhost:3001']
    });

    if (!payload || !payload.sub) {
      return null;
    }

    // El payload.sub contiene el clerk_user_id
    const clerkUserId = payload.sub;

    // Buscar usuario en D1 por clerk_user_id
    const usuario = await Usuario.getByClerkId(clerkUserId, env.DB);

    if (!usuario) {
      // Usuario no existe en D1, podría ser un nuevo usuario
      // El webhook debería haberlo creado, pero por si acaso retornamos info básica
      return {
        clerk_user_id: clerkUserId,
        email: payload.email || null,
        nombre: payload.name || payload.first_name || 'Usuario',
        rol: 'INQUILINO', // Rol por defecto
        isNewUser: true
      };
    }

    return usuario;
  } catch (error) {
    console.error('Error verificando token de Clerk:', error);
    return null;
  }
}

/**
 * Middleware para Cloudflare Workers que verifica autenticación con Clerk
 * Compatible con itty-router
 */
export const clerkAuthMiddleware = (env) => {
  return async (req) => {
    const usuario = await verifyClerkToken(req, env);
    
    if (!usuario) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          msg: 'No autorizado. Token inválido o expirado.' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Adjuntar usuario al request para uso posterior
    req.usuario = usuario;
  };
};

/**
 * Middleware para verificar rol de administrador
 */
export const requireAdmin = (req) => {
  if (!req.usuario || req.usuario.rol !== 'ADMIN') {
    return new Response(
      JSON.stringify({ 
        ok: false, 
        msg: 'Acceso denegado. Se requiere rol de administrador.' 
      }), 
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Middleware para verificar rol de comité o administrador
 */
export const requireComiteOrAdmin = (req) => {
  if (!req.usuario || !['ADMIN', 'COMITE'].includes(req.usuario.rol)) {
    return new Response(
      JSON.stringify({ 
        ok: false, 
        msg: 'Acceso denegado. Se requiere rol de comité o administrador.' 
      }), 
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Middleware para verificar que el usuario pertenece al mismo edificio
 */
export const requireSameBuilding = (buildingId) => {
  return (req) => {
    if (!req.usuario) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          msg: 'No autorizado.' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Admin puede acceder a todos los edificios
    if (req.usuario.rol === 'ADMIN' && !req.usuario.buildingId) {
      return;
    }

    if (req.usuario.buildingId !== buildingId) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          msg: 'Acceso denegado. No tienes permisos para este edificio.' 
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
};

export default {
  verifyClerkToken,
  clerkAuthMiddleware,
  requireAdmin,
  requireComiteOrAdmin,
  requireSameBuilding
};
