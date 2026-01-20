/**
 * Clerk Authentication Controller
 * 
 * Controladores para manejar autenticación con Clerk
 */

import { verifyToken } from '@clerk/backend';
import Usuario from '../models/Usuario.js';
import { handleControllerError } from '../middleware/error-handler.js';

/**
 * Obtiene los datos del usuario autenticado con Clerk
 * GET /api/auth/me
 */
export const getAuthenticatedUser = async (req, res) => {
  try {
    // El middleware ya verificó el token y adjuntó el usuario
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        msg: 'No autorizado'
      });
    }

    // Si es un usuario nuevo (no existe en D1), retornar info básica
    if (usuario.isNewUser) {
      return res.json({
        ok: true,
        usuario: {
          clerk_user_id: usuario.clerk_user_id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
          isNewUser: true
        }
      });
    }

    // Retornar usuario completo
    return res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        clerk_user_id: usuario.clerk_user_id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        departamento: usuario.departamento,
        buildingId: usuario.building_id || usuario.buildingId,
        telefono: usuario.telefono,
        activo: usuario.activo
      }
    });

  } catch (error) {
    return handleControllerError(error, res, 'getAuthenticatedUser');
  }
};

/**
 * Sincroniza el usuario de Clerk con el backend
 * POST /api/auth/clerk-sync
 */
export const syncClerkUser = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        msg: 'No autorizado'
      });
    }

    // Si el usuario ya existe, retornar sus datos
    if (!usuario.isNewUser) {
      return res.json({
        ok: true,
        usuario: {
          id: usuario.id,
          clerk_user_id: usuario.clerk_user_id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          departamento: usuario.departamento,
          buildingId: usuario.building_id || usuario.buildingId
        }
      });
    }

    // Usuario nuevo, necesita completar el setup
    return res.json({
      ok: true,
      requiresSetup: true,
      usuario: {
        clerk_user_id: usuario.clerk_user_id,
        email: usuario.email,
        nombre: usuario.nombre
      }
    });

  } catch (error) {
    return handleControllerError(error, res, 'syncClerkUser');
  }
};

/**
 * Completa el setup de un nuevo usuario de Clerk
 * POST /api/auth/clerk-setup
 */
export const completeClerkSetup = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { departamento, telefono, buildingId, rol } = req.body;

    if (!usuario || !usuario.clerk_user_id) {
      return res.status(401).json({
        ok: false,
        msg: 'No autorizado'
      });
    }

    // Validaciones
    if (!departamento) {
      return res.status(400).json({
        ok: false,
        msg: 'Departamento es requerido'
      });
    }

    // Crear usuario en D1 si no existe
    const existingUser = await Usuario.getByClerkId(usuario.clerk_user_id, req.env?.DB);
    
    if (existingUser) {
      return res.json({
        ok: true,
        usuario: existingUser
      });
    }

    // Crear datos del usuario para Clerk
    const clerkUserData = {
      id: usuario.clerk_user_id,
      email_addresses: [{ email_address: usuario.email }],
      first_name: usuario.nombre.split(' ')[0],
      last_name: usuario.nombre.split(' ').slice(1).join(' '),
      public_metadata: {
        rol: rol || 'INQUILINO',
        departamento,
        telefono: telefono || '',
        buildingId: buildingId || null
      }
    };

    // Crear usuario en D1
    const nuevoUsuario = await Usuario.createFromClerk(clerkUserData, req.env?.DB);

    return res.status(201).json({
      ok: true,
      usuario: nuevoUsuario
    });

  } catch (error) {
    return handleControllerError(error, res, 'completeClerkSetup');
  }
};

export default {
  getAuthenticatedUser,
  syncClerkUser,
  completeClerkSetup
};
