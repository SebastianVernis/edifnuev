/**
 * Invitations Controller
 * Maneja invitaciones de usuarios con envío por SMTP
 */

import { readData, writeData } from '../data.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendInvitationEmail } from '../utils/smtp.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edificio-admin-secret-key-2025';

// Storage para tokens de invitación
const invitationTokens = new Map();

/**
 * Generar token de invitación único
 */
function generateInvitationToken() {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * POST /api/invitations/send
 * Enviar invitación a nuevo usuario
 */
export async function sendInvitation(req, res) {
  try {
    const { email, name, role, departamento } = req.body;
    const adminUser = req.usuario; // Del middleware de auth

    // Validar datos
    if (!email || !name || !role) {
      return res.status(400).json({
        ok: false,
        msg: 'Email, nombre y rol son requeridos'
      });
    }

    // Validar email
    if (!email.includes('@')) {
      return res.status(400).json({
        ok: false,
        msg: 'Email inválido'
      });
    }

    // Validar rol
    const rolesValidos = ['ADMIN', 'INQUILINO'];
    if (!rolesValidos.includes(role)) {
      return res.status(400).json({
        ok: false,
        msg: 'Rol inválido'
      });
    }

    // Verificar permisos (solo ADMIN puede invitar)
    if (adminUser.rol !== 'ADMIN') {
      return res.status(403).json({
        ok: false,
        msg: 'Solo administradores pueden enviar invitaciones'
      });
    }

    // Verificar si el email ya existe
    const data = readData();
    const existingUser = data.usuarios.find(u => u.email === email);

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        msg: 'Este email ya está registrado en el sistema'
      });
    }

    // Verificar si ya hay una invitación pendiente
    for (const [token, invitation] of invitationTokens.entries()) {
      if (invitation.email === email && new Date() < new Date(invitation.expiresAt)) {
        return res.status(409).json({
          ok: false,
          msg: 'Ya existe una invitación pendiente para este email',
          existingToken: token
        });
      }
    }

    // Generar token de invitación
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Guardar invitación
    const invitation = {
      token: invitationToken,
      email,
      name,
      role,
      departamento: departamento || '',
      invitedBy: adminUser.id,
      invitedByName: adminUser.nombre,
      buildingName: adminUser.building?.name || 'Edificio',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      used: false,
    };

    invitationTokens.set(invitationToken, invitation);

    // Enviar email de invitación
    const emailResult = await sendInvitationEmail(invitation);

    if (!emailResult.ok) {
      // Eliminar token si falla el envío
      invitationTokens.delete(invitationToken);

      return res.status(500).json({
        ok: false,
        msg: 'Error al enviar la invitación por email',
        error: emailResult.error
      });
    }

    res.json({
      ok: true,
      msg: 'Invitación enviada correctamente',
      data: {
        token: invitationToken,
        email,
        name,
        role,
        expiresAt: expiresAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error en sendInvitation:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/invitations/verify/:token
 * Verificar token de invitación
 */
export async function verifyInvitation(req, res) {
  try {
    const { token } = req.params;

    const invitation = invitationTokens.get(token);

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        msg: 'Token de invitación inválido o expirado'
      });
    }

    // Verificar si ya fue usado
    if (invitation.used) {
      return res.status(410).json({
        ok: false,
        msg: 'Esta invitación ya fue utilizada'
      });
    }

    // Verificar si expiró
    if (new Date() > new Date(invitation.expiresAt)) {
      invitationTokens.delete(token);
      return res.status(410).json({
        ok: false,
        msg: 'Esta invitación ha expirado'
      });
    }

    res.json({
      ok: true,
      msg: 'Token válido',
      data: {
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        departamento: invitation.departamento,
        invitedBy: invitation.invitedByName,
        buildingName: invitation.buildingName,
        expiresAt: invitation.expiresAt,
      }
    });

  } catch (error) {
    console.error('Error en verifyInvitation:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/invitations/activate
 * Activar cuenta usando token de invitación
 */
export async function activateInvitation(req, res) {
  try {
    const { token, password } = req.body;

    // Validar datos
    if (!token || !password) {
      return res.status(400).json({
        ok: false,
        msg: 'Token y contraseña son requeridos'
      });
    }

    // Validar contraseña
    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        msg: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const invitation = invitationTokens.get(token);

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        msg: 'Token de invitación inválido o expirado'
      });
    }

    // Verificar si ya fue usado
    if (invitation.used) {
      return res.status(410).json({
        ok: false,
        msg: 'Esta invitación ya fue utilizada'
      });
    }

    // Verificar si expiró
    if (new Date() > new Date(invitation.expiresAt)) {
      invitationTokens.delete(token);
      return res.status(410).json({
        ok: false,
        msg: 'Esta invitación ha expirado'
      });
    }

    // Crear usuario
    const data = readData();
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      id: data.usuarios.length + 1,
      nombre: invitation.name,
      email: invitation.email,
      password: hashedPassword,
      telefono: '',
      departamento: invitation.departamento || '',
      rol: invitation.role,
      activo: true,
      fechaRegistro: new Date().toISOString(),
      invitedBy: invitation.invitedBy,
    };

    data.usuarios.push(nuevoUsuario);
    writeData(data);

    // Marcar invitación como usada
    invitation.used = true;
    invitation.usedAt = new Date().toISOString();
    invitation.userId = nuevoUsuario.id;
    invitationTokens.set(token, invitation);

    // Generar token JWT
    const jwtToken = jwt.sign(
      {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      msg: 'Cuenta activada exitosamente',
      token: jwtToken,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        departamento: nuevoUsuario.departamento,
      }
    });

  } catch (error) {
    console.error('Error en activateInvitation:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error activando la cuenta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/invitations/pending
 * Listar invitaciones pendientes (solo ADMIN)
 */
export async function getPendingInvitations(req, res) {
  try {
    const adminUser = req.usuario;

    // Verificar permisos
    if (adminUser.rol !== 'ADMIN') {
      return res.status(403).json({
        ok: false,
        msg: 'Solo administradores pueden ver invitaciones pendientes'
      });
    }

    const pendingInvitations = [];
    const now = new Date();

    for (const [token, invitation] of invitationTokens.entries()) {
      if (!invitation.used && new Date(invitation.expiresAt) > now) {
        pendingInvitations.push({
          token,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          departamento: invitation.departamento,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        });
      }
    }

    res.json({
      ok: true,
      count: pendingInvitations.length,
      invitations: pendingInvitations
    });

  } catch (error) {
    console.error('Error en getPendingInvitations:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener invitaciones'
    });
  }
}

/**
 * DELETE /api/invitations/:token
 * Cancelar invitación (solo ADMIN)
 */
export async function cancelInvitation(req, res) {
  try {
    const { token } = req.params;
    const adminUser = req.usuario;

    // Verificar permisos
    if (adminUser.rol !== 'ADMIN') {
      return res.status(403).json({
        ok: false,
        msg: 'Solo administradores pueden cancelar invitaciones'
      });
    }

    const invitation = invitationTokens.get(token);

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        msg: 'Invitación no encontrada'
      });
    }

    invitationTokens.delete(token);

    res.json({
      ok: true,
      msg: 'Invitación cancelada correctamente'
    });

  } catch (error) {
    console.error('Error en cancelInvitation:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al cancelar invitación'
    });
  }
}

// Limpiar invitaciones expiradas cada hora
setInterval(() => {
  const now = new Date();

  for (const [token, invitation] of invitationTokens.entries()) {
    if (new Date(invitation.expiresAt) < now) {
      invitationTokens.delete(token);
      console.log(`Invitación expirada eliminada: ${invitation.email}`);
    }
  }
}, 3600000); // Cada hora
