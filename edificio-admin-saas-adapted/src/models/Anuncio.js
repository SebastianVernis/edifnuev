/**
 * Modelo Anuncio para D1 Database
 */

class Anuncio {
  static async create(db, data) {
    const { titulo, contenido, tipo, prioridad, fecha_expiracion, created_by, building_id } = data;
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO anuncios (
        id, titulo, contenido, tipo, prioridad, activo,
        fecha_publicacion, fecha_expiracion, created_by, building_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, titulo, contenido, tipo || 'general', prioridad || 'normal', 1,
      new Date().toISOString(), fecha_expiracion || null, created_by,
      building_id || null, new Date().toISOString()
    ).run();
    
    return await Anuncio.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM anuncios WHERE activo = 1';
    const params = [];
    
    if (filters.tipo) { query += ' AND tipo = ?'; params.push(filters.tipo); }
    if (filters.prioridad) { query += ' AND prioridad = ?'; params.push(filters.prioridad); }
    if (filters.building_id) { query += ' AND building_id = ?'; params.push(filters.building_id); }
    
    query += ' ORDER BY fecha_publicacion DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM anuncios WHERE id = ?').bind(id).first();
  }
  
  static async update(db, id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.titulo !== undefined) { fields.push('titulo = ?'); values.push(updates.titulo); }
    if (updates.contenido !== undefined) { fields.push('contenido = ?'); values.push(updates.contenido); }
    if (updates.tipo !== undefined) { fields.push('tipo = ?'); values.push(updates.tipo); }
    if (updates.prioridad !== undefined) { fields.push('prioridad = ?'); values.push(updates.prioridad); }
    if (updates.activo !== undefined) { fields.push('activo = ?'); values.push(updates.activo ? 1 : 0); }
    
    if (fields.length === 0) return await Anuncio.getById(db, id);
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await db.prepare(`UPDATE anuncios SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Anuncio.getById(db, id);
  }
  
  static async delete(db, id) {
    await db.prepare('UPDATE anuncios SET activo = 0 WHERE id = ?').bind(id).run();
    return true;
  }
}

export default Anuncio;
