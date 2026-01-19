import bcrypt from 'bcryptjs';
import { readData, addItem, updateItem, deleteItem } from '../data.js';

class Usuario {
  constructor(nombre, email, password, departamento, rol = 'INQUILINO', permisos = {}, buildingId = null) {
    this.nombre = nombre;
    this.email = email;
    this.password = password;
    this.departamento = departamento;
    this.rol = rol;
    this.permisos = permisos; // Nuevo campo para permisos configurables
    this.buildingId = buildingId; // ID del edificio para multitenancy
    this.fechaCreacion = new Date().toISOString();
    this.activo = true;
  }
  
  // Método para crear un nuevo usuario
  static async crear(userData) {
    try {
      // Verificar si el email ya existe
      const data = readData();
      const existeEmail = data.usuarios.some(u => u.email === userData.email);
      
      if (existeEmail) {
        throw new Error('El email ya está registrado');
      }
      
      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Configurar permisos según el rol
      let permisos = {};
      
      if (userData.rol === 'COMITE') {
        // Permisos por defecto para el comité (todos desactivados)
        permisos = {
          anuncios: userData.permisos?.anuncios || false,
          gastos: userData.permisos?.gastos || false,
          presupuestos: userData.permisos?.presupuestos || false,
          cuotas: userData.permisos?.cuotas || false,
          usuarios: userData.permisos?.usuarios || false,
          cierres: userData.permisos?.cierres || false
        };
      } else if (userData.rol === 'ADMIN') {
        // Administrador tiene todos los permisos
        permisos = {
          anuncios: true,
          gastos: true,
          presupuestos: true,
          cuotas: true,
          usuarios: true,
          cierres: true
        };
      }
      
      // Crear nuevo usuario con contraseña hasheada y permisos
      const nuevoUsuario = new Usuario(
        userData.nombre,
        userData.email,
        hashedPassword,
        userData.departamento,
        userData.rol || 'INQUILINO',
        permisos
      );
      
      // Guardar en la base de datos
      return addItem('usuarios', nuevoUsuario);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }
  
  // Método para obtener todos los usuarios
  static obtenerTodos() {
    const data = readData();
    return data.usuarios.map(u => {
      const { password, ...usuarioSinPassword } = u;
      return usuarioSinPassword;
    });
  }
  
  // Método para obtener un usuario por ID
  static obtenerPorId(id) {
    const data = readData();
    const usuario = data.usuarios.find(u => u.id === id);
    
    if (!usuario) return null;
    
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }
  
  // Método para obtener un usuario por email
  static obtenerPorEmail(email) {
    const data = readData();
    return data.usuarios.find(u => u.email === email);
  }
  
  // Método para actualizar un usuario
  static actualizar(id, updates) {
    // No permitir actualizar la contraseña directamente
    const { password, ...actualizaciones } = updates;
    
    // Si se están actualizando permisos y el rol es COMITE, asegurarse de que los permisos sean válidos
    if (actualizaciones.permisos && actualizaciones.rol === 'COMITE') {
      actualizaciones.permisos = {
        anuncios: actualizaciones.permisos.anuncios || false,
        gastos: actualizaciones.permisos.gastos || false,
        presupuestos: actualizaciones.permisos.presupuestos || false,
        cuotas: actualizaciones.permisos.cuotas || false,
        usuarios: actualizaciones.permisos.usuarios || false,
        cierres: actualizaciones.permisos.cierres || false
      };
    } else if (actualizaciones.rol === 'ADMIN') {
      // Si se cambia el rol a ADMIN, asignar todos los permisos
      actualizaciones.permisos = {
        anuncios: true,
        gastos: true,
        presupuestos: true,
        cuotas: true,
        usuarios: true,
        cierres: true
      };
    } else if (actualizaciones.rol === 'INQUILINO') {
      // Si se cambia el rol a INQUILINO, eliminar permisos
      actualizaciones.permisos = {};
    }
    
    return updateItem('usuarios', id, actualizaciones);
  }
  
  // Método para cambiar contraseña
  static async cambiarPassword(id, passwordActual, passwordNueva) {
    try {
      const data = readData();
      const usuario = data.usuarios.find(u => u.id === id);
      
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
      
      if (!passwordValida) {
        throw new Error('Contraseña actual incorrecta');
      }
      
      // Hash de la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordNueva, salt);
      
      // Actualizar contraseña
      return updateItem('usuarios', id, { password: hashedPassword });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }
  
  // Método para eliminar un usuario
  static eliminar(id) {
    return deleteItem('usuarios', id);
  }
  
  // Método para validar credenciales
  static async validarCredenciales(email, password) {
    try {
      const usuario = Usuario.obtenerPorEmail(email);
      
      if (!usuario) {
        return null;
      }
      
      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password);
      
      if (!passwordValida) {
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
  
  // Métodos alias para compatibilidad con controladores existentes
  static getByEmail(email) {
    return Usuario.obtenerPorEmail(email);
  }
  
  static async validatePassword(usuario, password) {
    try {
      return await bcrypt.compare(password, usuario.password);
    } catch (error) {
      console.error('Error al validar contraseña:', error);
      return false;
    }
  }
  
  static async create(userData) {
    return Usuario.crear(userData);
  }
  
  static getById(id) {
    return Usuario.obtenerPorId(id);
  }
  
  // Método para verificar si un usuario tiene un permiso específico
  static tienePermiso(usuario, permiso) {
    // Administradores tienen todos los permisos
    if (usuario.rol === 'ADMIN') {
      return true;
    }
    
    // Miembros del comité tienen permisos específicos
    if (usuario.rol === 'COMITE' && usuario.permisos) {
      return usuario.permisos[permiso] === true;
    }
    
    // Inquilinos no tienen permisos administrativos
    return false;
  }

  // ========== MÉTODOS PARA INTEGRACIÓN CON CLERK ==========

  /**
   * Obtener usuario por Clerk User ID
   * @param {string} clerkUserId - ID de usuario de Clerk
   * @param {Object} db - Instancia de D1 database (Cloudflare Workers)
   * @returns {Object|null} Usuario encontrado o null
   */
  static async getByClerkId(clerkUserId, db) {
    try {
      if (!db) {
        // Fallback a data.js si no hay DB (desarrollo local)
        const data = readData();
        const usuario = data.usuarios.find(u => u.clerk_user_id === clerkUserId);
        if (!usuario) return null;
        const { password, ...usuarioSinPassword } = usuario;
        return usuarioSinPassword;
      }

      // Query a D1
      const result = await db.prepare(
        'SELECT * FROM usuarios WHERE clerk_user_id = ?'
      ).bind(clerkUserId).first();

      if (!result) return null;

      // No retornar password
      const { password, ...usuarioSinPassword } = result;
      return usuarioSinPassword;
    } catch (error) {
      console.error('Error al obtener usuario por Clerk ID:', error);
      return null;
    }
  }

  /**
   * Crear usuario desde webhook de Clerk
   * @param {Object} clerkUserData - Datos del usuario de Clerk
   * @param {Object} db - Instancia de D1 database
   * @returns {Object} Usuario creado
   */
  static async createFromClerk(clerkUserData, db) {
    try {
      const {
        id: clerkUserId,
        email_addresses,
        first_name,
        last_name,
        public_metadata,
        private_metadata
      } = clerkUserData;

      // Obtener email principal
      const primaryEmail = email_addresses.find(e => e.id === clerkUserData.primary_email_address_id);
      const email = primaryEmail?.email_address || email_addresses[0]?.email_address;

      // Obtener datos de metadata
      const rol = public_metadata?.rol || 'INQUILINO';
      const departamento = public_metadata?.departamento || '';
      const buildingId = public_metadata?.buildingId || null;
      const nombre = `${first_name || ''} ${last_name || ''}`.trim() || 'Usuario';

      // Preparar permisos según rol
      let permisos = {};
      if (rol === 'ADMIN') {
        permisos = {
          anuncios: true,
          gastos: true,
          presupuestos: true,
          cuotas: true,
          usuarios: true,
          cierres: true
        };
      } else if (rol === 'COMITE') {
        permisos = public_metadata?.permisos || {
          anuncios: false,
          gastos: false,
          presupuestos: false,
          cuotas: false,
          usuarios: false,
          cierres: false
        };
      }

      const userData = {
        clerk_user_id: clerkUserId,
        nombre,
        email,
        password: '', // No se usa password con Clerk
        rol,
        departamento,
        telefono: public_metadata?.telefono || '',
        buildingId,
        permisos: JSON.stringify(permisos),
        created_via_clerk: 1,
        clerk_metadata: JSON.stringify(public_metadata || {}),
        activo: 1
      };

      if (!db) {
        // Fallback a data.js
        return addItem('usuarios', userData);
      }

      // Insertar en D1
      const result = await db.prepare(`
        INSERT INTO usuarios (
          clerk_user_id, nombre, email, password, rol, departamento, 
          telefono, building_id, created_via_clerk, clerk_metadata, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userData.clerk_user_id,
        userData.nombre,
        userData.email,
        userData.password,
        userData.rol,
        userData.departamento,
        userData.telefono,
        userData.buildingId,
        userData.created_via_clerk,
        userData.clerk_metadata,
        userData.activo
      ).run();

      // Obtener el usuario creado
      const nuevoUsuario = await db.prepare(
        'SELECT * FROM usuarios WHERE clerk_user_id = ?'
      ).bind(clerkUserId).first();

      const { password, ...usuarioSinPassword } = nuevoUsuario;
      return usuarioSinPassword;
    } catch (error) {
      console.error('Error al crear usuario desde Clerk:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario desde webhook de Clerk
   * @param {string} clerkUserId - ID de usuario de Clerk
   * @param {Object} clerkUserData - Datos actualizados del usuario
   * @param {Object} db - Instancia de D1 database
   * @returns {Object} Usuario actualizado
   */
  static async updateFromClerk(clerkUserId, clerkUserData, db) {
    try {
      const {
        email_addresses,
        first_name,
        last_name,
        public_metadata
      } = clerkUserData;

      // Obtener email principal
      const primaryEmail = email_addresses.find(e => e.id === clerkUserData.primary_email_address_id);
      const email = primaryEmail?.email_address || email_addresses[0]?.email_address;

      const nombre = `${first_name || ''} ${last_name || ''}`.trim() || 'Usuario';
      const rol = public_metadata?.rol;
      const departamento = public_metadata?.departamento;
      const telefono = public_metadata?.telefono;

      if (!db) {
        // Fallback a data.js
        const data = readData();
        const usuario = data.usuarios.find(u => u.clerk_user_id === clerkUserId);
        if (!usuario) throw new Error('Usuario no encontrado');

        const updates = {
          nombre,
          email,
          clerk_metadata: JSON.stringify(public_metadata || {})
        };

        if (rol) updates.rol = rol;
        if (departamento) updates.departamento = departamento;
        if (telefono) updates.telefono = telefono;

        return updateItem('usuarios', usuario.id, updates);
      }

      // Actualizar en D1
      const updates = [];
      const bindings = [];

      updates.push('nombre = ?');
      bindings.push(nombre);

      updates.push('email = ?');
      bindings.push(email);

      if (rol) {
        updates.push('rol = ?');
        bindings.push(rol);
      }

      if (departamento) {
        updates.push('departamento = ?');
        bindings.push(departamento);
      }

      if (telefono) {
        updates.push('telefono = ?');
        bindings.push(telefono);
      }

      updates.push('clerk_metadata = ?');
      bindings.push(JSON.stringify(public_metadata || {}));

      updates.push('updated_at = CURRENT_TIMESTAMP');

      bindings.push(clerkUserId);

      await db.prepare(`
        UPDATE usuarios 
        SET ${updates.join(', ')}
        WHERE clerk_user_id = ?
      `).bind(...bindings).run();

      // Obtener usuario actualizado
      const usuarioActualizado = await db.prepare(
        'SELECT * FROM usuarios WHERE clerk_user_id = ?'
      ).bind(clerkUserId).first();

      const { password, ...usuarioSinPassword } = usuarioActualizado;
      return usuarioSinPassword;
    } catch (error) {
      console.error('Error al actualizar usuario desde Clerk:', error);
      throw error;
    }
  }

  /**
   * Marcar usuario como inactivo (soft delete) desde webhook de Clerk
   * @param {string} clerkUserId - ID de usuario de Clerk
   * @param {Object} db - Instancia de D1 database
   * @returns {boolean} True si se desactivó correctamente
   */
  static async deactivateFromClerk(clerkUserId, db) {
    try {
      if (!db) {
        // Fallback a data.js
        const data = readData();
        const usuario = data.usuarios.find(u => u.clerk_user_id === clerkUserId);
        if (!usuario) return false;

        updateItem('usuarios', usuario.id, { activo: 0 });
        return true;
      }

      // Actualizar en D1
      await db.prepare(`
        UPDATE usuarios 
        SET activo = 0, updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = ?
      `).bind(clerkUserId).run();

      return true;
    } catch (error) {
      console.error('Error al desactivar usuario desde Clerk:', error);
      return false;
    }
  }
}

export default Usuario;