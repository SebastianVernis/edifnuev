/**
 * Modelo Solicitud para D1 Database
 */

class Solicitud {
  static async create(db, data) {
    const { usuario_id, tipo, asunto, descripcion, prioridad, building_id } = data;
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO solicitudes (
        id, usuario_id, tipo, asunto, descripcion, estado, prioridad,
        building_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, usuario_id, tipo, asunto, descripcion, 'pendiente',
      prioridad || 'normal', building_id || null, new Date().toISOString()
    ).run();
    
    return await Solicitud.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM solicitudes WHERE 1=1';
    const params = [];
    
    if (filters.usuario_id) { query += ' AND usuario_id = ?'; params.push(filters.usuario_id); }
    if (filters.tipo) { query += ' AND tipo = ?'; params.push(filters.tipo); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    if (filters.building_id) { query += ' AND building_id = ?'; params.push(filters.building_id); }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM solicitudes WHERE id = ?').bind(id).first();
  }
  
  static async update(db, id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.estado !== undefined) { fields.push('estado = ?'); values.push(updates.estado); }
    if (updates.respuesta !== undefined) { 
      fields.push('respuesta = ?'); 
      values.push(updates.respuesta);
      fields.push('fecha_respuesta = ?');
      values.push(new Date().toISOString());
    }
    if (updates.respondido_por !== undefined) { 
      fields.push('respondido_por = ?'); 
      values.push(updates.respondido_por); 
    }
    
    if (fields.length === 0) return await Solicitud.getById(db, id);
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await db.prepare(`UPDATE solicitudes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Solicitud.getById(db, id);
  }
  
  static async delete(db, id) {
    await db.prepare('DELETE FROM solicitudes WHERE id = ?').bind(id).run();
    return true;
  }
}

export default Solicitud;
