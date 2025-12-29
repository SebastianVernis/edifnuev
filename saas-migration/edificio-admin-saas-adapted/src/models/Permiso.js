/**
 * Modelo Permiso para D1 Database
 */

class Permiso {
  static async create(db, data) {
    const { usuario_id, building_id, modulo, puede_ver, puede_crear, puede_editar, puede_eliminar } = data;
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO permisos (
        id, usuario_id, building_id, modulo, puede_ver, puede_crear,
        puede_editar, puede_eliminar, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario_id, building_id || null, modulo,
      puede_ver ? 1 : 0, puede_crear ? 1 : 0,
      puede_editar ? 1 : 0, puede_eliminar ? 1 : 0,
      new Date().toISOString()
    ).run();
    
    return await Permiso.getById(db, id);
  }
  
  static async getByUsuario(db, usuario_id, building_id = null) {
    const query = building_id
      ? 'SELECT * FROM permisos WHERE usuario_id = ? AND building_id = ?'
      : 'SELECT * FROM permisos WHERE usuario_id = ?';
    
    const result = building_id
      ? await db.prepare(query).bind(usuario_id, building_id).all()
      : await db.prepare(query).bind(usuario_id).all();
    
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM permisos WHERE id = ?').bind(id).first();
  }
  
  static async update(db, usuario_id, modulo, updates) {
    const fields = [];
    const values = [];
    
    if (updates.puede_ver !== undefined) { fields.push('puede_ver = ?'); values.push(updates.puede_ver ? 1 : 0); }
    if (updates.puede_crear !== undefined) { fields.push('puede_crear = ?'); values.push(updates.puede_crear ? 1 : 0); }
    if (updates.puede_editar !== undefined) { fields.push('puede_editar = ?'); values.push(updates.puede_editar ? 1 : 0); }
    if (updates.puede_eliminar !== undefined) { fields.push('puede_eliminar = ?'); values.push(updates.puede_eliminar ? 1 : 0); }
    
    if (fields.length === 0) return null;
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(usuario_id);
    values.push(modulo);
    
    await db.prepare(`UPDATE permisos SET ${fields.join(', ')} WHERE usuario_id = ? AND modulo = ?`).bind(...values).run();
    return await Permiso.getByUsuario(db, usuario_id);
  }
  
  static async delete(db, id) {
    await db.prepare('DELETE FROM permisos WHERE id = ?').bind(id).run();
    return true;
  }
  
  static async checkPermission(db, usuario_id, modulo, accion) {
    const result = await db.prepare(
      `SELECT ${accion} FROM permisos WHERE usuario_id = ? AND modulo = ?`
    ).bind(usuario_id, modulo).first();
    
    return result ? (result[accion] === 1) : false;
  }
}

export default Permiso;
