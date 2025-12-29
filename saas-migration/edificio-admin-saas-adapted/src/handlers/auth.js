/**
 * Auth handlers adaptados para Cloudflare Workers
 * Mantiene la funcionalidad completa del sistema actual
 */
import { addCorsHeaders } from '../middleware/cors.js';
import { generateToken } from '../middleware/auth.js';
import Usuario from '../models/Usuario.js';

/**
 * Login de usuario
 */
export async function login(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'POST' }
      });
    }

    const data = await request.json();
    const { email, password } = data;
    
    // Validar formato de email
    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Formato de email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Validar que la contraseña no esté vacía
    if (!password || password.length < 3) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Contraseña requerida'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar si el email existe
    const usuario = await Usuario.getByEmail(request.db, email);
    if (!usuario) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar la contraseña
    const validPassword = await Usuario.validatePassword(usuario, password);
    if (!validPassword) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Generar JWT
    const token = await generateToken({
      id: usuario.id,
      rol: usuario.rol,
      departamento: usuario.departamento
    }, env);
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        departamento: usuario.departamento,
        rol: usuario.rol
      },
      token
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error en login:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Registro de usuario
 */
export async function registro(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'POST' }
      });
    }

    const data = await request.json();
    const { nombre, email, password, departamento, telefono } = data;
    
    // Validaciones
    if (!nombre || nombre.trim().length < 2) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Nombre debe tener al menos 2 caracteres'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Email válido requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    if (!password || password.length < 6) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Contraseña debe tener al menos 6 caracteres'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    if (!departamento) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Departamento es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar si el email ya existe
    const existeEmail = await Usuario.getByEmail(request.db, email);
    if (existeEmail) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'El email ya está registrado'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Crear el usuario
    const nuevoUsuario = await Usuario.create(request.db, {
      nombre,
      email,
      password,
      departamento,
      telefono,
      rol: 'inquilino' // Por defecto
    });
    
    // Generar JWT
    const token = await generateToken({
      id: nuevoUsuario.id,
      rol: nuevoUsuario.rol,
      departamento: nuevoUsuario.departamento
    }, env);
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        departamento: nuevoUsuario.departamento,
        rol: nuevoUsuario.rol
      },
      token
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error en registro:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Renovar token
 */
export async function renovarToken(request, env) {
  try {
    const { user } = request;
    
    // Generar nuevo JWT
    const token = await generateToken({
      id: user.id,
      rol: user.rol,
      departamento: user.departamento
    }, env);
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      token
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error renovando token:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Obtener perfil de usuario
 */
export async function getPerfil(request, env) {
  try {
    const { user } = request;
    
    // Obtener datos completos del usuario
    const usuario = await Usuario.getById(request.db, user.id);
    
    if (!usuario) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        departamento: usuario.departamento,
        telefono: usuario.telefono,
        rol: usuario.rol
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}
