/**
 * Modelo Usuario para D1 Database
 * Adaptado de Usuario.js (data.json)
 */
import bcrypt from 'bcryptjs';

class Usuario {
  /**
   * Crear un nuevo usuario
   */
  static async create(db, userData) {
    try {
      const { nombre, email, password, departamento, rol = 'INQUILINO', telefono, permisos } = userData;
      
      // Verificar si el email ya existe
      const existeEmail = await db.prepare(
        'SELECT id FROM usuarios WHERE email = ?'
      ).bind(email).first();
      
      if (existeEmail) {
        throw new Error('El email ya está registrado');
      }
      
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Configurar permisos según el rol (como JSON string)
      let permisosJson = '{}';
      
      if (rol === 'COMITE') {
        permisosJson = JSON.stringify({
          anuncios: permisos?.anuncios || false,
          gastos: permisos?.gastos || false,
          presupuestos: permisos?.presupuestos || false,
          cuotas: permisos?.cuotas || false,
          usuarios: permisos?.usuarios || false,
          cierres: permisos?.cierres || false
        });
      } else if (rol === 'ADMIN') {
        permisosJson = JSON.stringify({
          anuncios: true,
          gastos: true,
          presupuestos: true,
          cuotas: true,
          usuarios: true,
          cierres: true
        });
      }
      
      const id = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO usuarios (
          id, nombre, email, password, departamento, rol, telefono,
          permisos, activo, fechaCreacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        nombre,
        email,
        hashedPassword,
        departamento,
        rol,
        telefono || null,
        permisosJson,
        1,
        new Date().toISOString()
      ).run();
      
      // Retornar usuario sin contraseña
      const usuario = await db.prepare(
        'SELECT id, nombre, email, departamento, rol, telefono, activo, fechaCreacion FROM usuarios WHERE id = ?'
      ).bind(id).first();
      
      return usuario;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }
  
  /**
   * Obtener todos los usuarios
   */
  static async getAll(db) {
    const result = await db.prepare(`
      SELECT id, nombre, email, departamento, rol, telefono, 
             activo, legitimidad_entregada, estatus_validacion, 
             fechaCreacion, esEditor, rol_editor
      FROM usuarios 
      WHERE activo = 1
      ORDER BY fechaCreacion DESC
    `).all();
    
    return result.results || [];
  }
  
  /**
   * Obtener usuario por ID (sin password)
   */
  static async getById(db, id) {
    const usuario = await db.prepare(`
      SELECT id, nombre, email, departamento, rol, telefono, 
             activo, legitimidad_entregada, estatus_validacion, 
             fechaCreacion, esEditor, rol_editor, permisos
      FROM usuarios 
      WHERE id = ?
    `).bind(id).first();
    
    if (!usuario) return null;
    
    // Parse permisos JSON
    if (usuario.permisos) {
      try {
        usuario.permisos = JSON.parse(usuario.permisos);
      } catch (e) {
        usuario.permisos = {};
      }
    }
    
    return usuario;
  }
  
  /**
   * Obtener usuario por email (con password)
   */
  static async getByEmail(db, email) {
    const usuario = await db.prepare(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1'
    ).bind(email).first();
    
    if (!usuario) return null;
    
    // Parse permisos JSON
    if (usuario.permisos) {
      try {
        usuario.permisos = JSON.parse(usuario.permisos);
      } catch (e) {
        usuario.permisos = {};
      }
    }
    
    return usuario;
  }
  
  /**
   * Actualizar usuario
   */
  static async update(db, id, updates) {
    try {
      const fields = [];
      const values = [];
      
      if (updates.nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(updates.nombre);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.departamento !== undefined) {
        fields.push('departamento = ?');
        values.push(updates.departamento);
      }
      if (updates.rol !== undefined) {
        fields.push('rol = ?');
        values.push(updates.rol);
        
        // Actualizar permisos según el nuevo rol
        if (updates.rol === 'ADMIN') {
          fields.push('permisos = ?');
          values.push(JSON.stringify({
            anuncios: true,
            gastos: true,
            presupuestos: true,
            cuotas: true,
            usuarios: true,
            cierres: true
          }));
        } else if (updates.rol === 'INQUILINO') {
          fields.push('permisos = ?');
          values.push('{}');
        }
      }
      if (updates.telefono !== undefined) {
        fields.push('telefono = ?');
        values.push(updates.telefono);
      }
      if (updates.permisos !== undefined && updates.rol === 'COMITE') {
        fields.push('permisos = ?');
        values.push(JSON.stringify(updates.permisos));
      }
      if (updates.esEditor !== undefined) {
        fields.push('esEditor = ?');
        values.push(updates.esEditor ? 1 : 0);
      }
      if (updates.rol_editor !== undefined) {
        fields.push('rol_editor = ?');
        values.push(updates.rol_editor);
      }
      if (updates.estatus_validacion !== undefined) {
        fields.push('estatus_validacion = ?');
        values.push(updates.estatus_validacion);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      await db.prepare(`
        UPDATE usuarios 
        SET ${fields.join(', ')}
        WHERE id = ?
      `).bind(...values).run();
      
      return await Usuario.getById(db, id);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }
  
  /**
   * Cambiar contraseña
   */
  static async changePassword(db, id, currentPassword, newPassword) {
    try {
      // Obtener usuario con password
      const usuario = await db.prepare(
        'SELECT * FROM usuarios WHERE id = ?'
      ).bind(id).first();
      
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, usuario.password);
      
      if (!isValid) {
        throw new Error('Contraseña actual incorrecta');
      }
      
      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Actualizar contraseña
      await db.prepare(
        'UPDATE usuarios SET password = ? WHERE id = ?'
      ).bind(hashedPassword, id).run();
      
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }
  
  /**
   * Eliminar usuario (soft delete)
   */
  static async delete(db, id) {
    await db.prepare(
      'UPDATE usuarios SET activo = 0 WHERE id = ?'
    ).bind(id).run();
    
    return true;
  }
  
  /**
   * Validar contraseña
   */
  static async validatePassword(usuario, password) {
    try {
      return await bcrypt.compare(password, usuario.password);
    } catch (error) {
      console.error('Error al validar contraseña:', error);
      return false;
    }
  }
  
  /**
   * Validar credenciales
   */
  static async validateCredentials(db, email, password) {
    try {
      const usuario = await Usuario.getByEmail(db, email);
      
      if (!usuario) {
        return null;
      }
      
      // Verificar contraseña
      const isValid = await bcrypt.compare(password, usuario.password);
      
      if (!isValid) {
        return null;
      }
      
      // Retornar usuario sin contraseña
      const { password: _, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    } catch (error) {
      console.error('Error al validar credenciales:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si un usuario tiene un permiso específico
   */
  static tienePermiso(usuario, permiso) {
    // Administradores tienen todos los permisos
    if (usuario.rol === 'ADMIN') {
      return true;
    }
    
    // Miembros del comité tienen permisos específicos
    if (usuario.rol === 'COMITE' && usuario.permisos) {
      const permisos = typeof usuario.permisos === 'string' 
        ? JSON.parse(usuario.permisos) 
        : usuario.permisos;
      return permisos[permiso] === true;
    }
    
    // Inquilinos no tienen permisos administrativos
    return false;
  }
  
  /**
   * Obtener usuarios por rol
   */
  static async getByRole(db, rol) {
    const result = await db.prepare(`
      SELECT id, nombre, email, departamento, rol, telefono, 
             activo, fechaCreacion
      FROM usuarios 
      WHERE rol = ? AND activo = 1
      ORDER BY nombre ASC
    `).bind(rol).all();
    
    return result.results || [];
  }
  
  /**
   * Buscar usuarios por término
   */
  static async search(db, searchTerm) {
    const term = `%${searchTerm}%`;
    const result = await db.prepare(`
      SELECT id, nombre, email, departamento, rol, telefono, 
             activo, fechaCreacion
      FROM usuarios 
      WHERE activo = 1 
        AND (nombre LIKE ? OR email LIKE ? OR departamento LIKE ?)
      ORDER BY nombre ASC
    `).bind(term, term, term).all();
    
    return result.results || [];
  }
}

export default Usuario;
