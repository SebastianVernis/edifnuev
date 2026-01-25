import Usuario from '../models/Usuario.js';
import { generarJWT } from '../middleware/auth.js';
import { handleControllerError, validateEmail, validateRequired } from '../middleware/error-handler.js';
import { verifyEmailWithCache } from '../utils/emailVerification.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validar formato de email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        ok: false,
        msg: 'Formato de email inválido'
      });
    }

    // Validar que la contraseña no esté vacía
    if (!password || password.length < 3) {
      return res.status(400).json({
        ok: false,
        msg: 'Contraseña requerida'
      });
    }

    // 1. VALIDACIÓN VIRTUAL DEL SUPER ADMIN (Basado en Secretos)
    const env = req.env || process.env;
    const SA_EMAIL = env.SUPER_ADMIN_EMAIL;
    const SA_PASSWORD = env.SUPER_ADMIN_PASSWORD;

    if (SA_EMAIL && SA_PASSWORD &&
      email.trim().toLowerCase() === SA_EMAIL.trim().toLowerCase() &&
      password === SA_PASSWORD) {

      console.log('👑 Super Admin autenticado vía secretos');
      const token = await generarJWT(0, 'SUPERADMIN', 'System');

      return res.json({
        ok: true,
        usuario: {
          id: 0,
          nombre: 'System Administrator',
          email: SA_EMAIL,
          rol: 'SUPERADMIN'
        },
        token
      });
    }

    // 2. VALIDACIÓN ESTÁNDAR (Base de Datos)
    const usuario = await Usuario.getByEmail(email);
    if (!usuario) {
      return res.status(401).json({
        ok: false,
        msg: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (usuario.activo === false) {
      return res.status(403).json({
        ok: false,
        msg: 'Su cuenta ha sido desactivada o restringida. Contacte al administrador del sistema.'
      });
    }

    // Verificar la contraseña
    const validPassword = await Usuario.validatePassword(usuario, password);
    if (!validPassword) {
      return res.status(401).json({
        ok: false,
        msg: 'Credenciales inválidas'
      });
    }

    // Generar JWT incluyendo buildingId
    const token = await generarJWT(usuario.id, usuario.rol, usuario.departamento, usuario.buildingId);

    res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        departamento: usuario.departamento,
        rol: usuario.rol,
        buildingId: usuario.buildingId
      },
      token
    });
  } catch (error) {
    return handleControllerError(error, res, 'login');
  }
};

export const registro = async (req, res) => {
  const { nombre, email, password, departamento, telefono } = req.body;

  try {
    // Validaciones
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        msg: 'Nombre debe tener al menos 2 caracteres'
      });
    }

    // Validar email con APILayer
    const emailVerification = await verifyEmailWithCache(email, req.env || process.env);

    if (!emailVerification.valid) {
      return res.status(400).json({
        ok: false,
        msg: emailVerification.message,
        reason: emailVerification.reason,
        suggestion: emailVerification.details?.did_you_mean || null
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        ok: false,
        msg: 'Contraseña debe tener al menos 6 caracteres'
      });
    }

    if (!departamento) {
      return res.status(400).json({
        ok: false,
        msg: 'Departamento es requerido'
      });
    }

    // Verificar si el email ya existe
    const existeEmail = await Usuario.getByEmail(email);
    if (existeEmail) {
      return res.status(409).json({
        ok: false,
        msg: 'El email ya está registrado'
      });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      departamento,
      telefono: telefono || '',
      rol: 'inquilino'
    });

    // Generar JWT
    const token = await generarJWT(usuario.id, usuario.rol, usuario.departamento);

    res.status(201).json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        departamento: usuario.departamento,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    return handleControllerError(error, res, 'register');
  }
};

export const renovarToken = async (req, res) => {
  const { usuario } = req;

  // Generar nuevo JWT
  const token = await generarJWT(usuario.id, usuario.rol, usuario.departamento);

  res.json({
    ok: true,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      departamento: usuario.departamento,
      rol: usuario.rol
    },
    token
  });
};

export const getPerfil = async (req, res) => {
  const { usuario } = req;

  res.json({
    ok: true,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      departamento: usuario.departamento,
      rol: usuario.rol
    }
  });
};