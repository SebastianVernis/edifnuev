/**
 * Modelo AuditLog para D1 Database
 */

class AuditLog {
  static async create(db, data) {
    const { 
      building_id, usuario_id, accion, modulo, entidad_tipo, 
      entidad_id, detalles, ip_address, user_agent 
    } = data;
    
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO audit_logs (
        id, building_id, usuario_id, accion, modulo, entidad_tipo,
        entidad_id, detalles, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, building_id || null, usuario_id, accion, modulo,
      entidad_tipo || null, entidad_id || null,
      typeof detalles === 'object' ? JSON.stringify(detalles) : detalles,
      ip_address || null, user_agent || null, new Date().toISOString()
    ).run();
    
    return await AuditLog.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (filters.usuario_id) { query += ' AND usuario_id = ?'; params.push(filters.usuario_id); }
    if (filters.modulo) { query += ' AND modulo = ?'; params.push(filters.modulo); }
    if (filters.accion) { query += ' AND accion = ?'; params.push(filters.accion); }
    if (filters.building_id) { query += ' AND building_id = ?'; params.push(filters.building_id); }
    if (filters.fecha_desde) { query += ' AND created_at >= ?'; params.push(filters.fecha_desde); }
    if (filters.fecha_hasta) { query += ' AND created_at <= ?'; params.push(filters.fecha_hasta); }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(filters.limit || 100);
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM audit_logs WHERE id = ?').bind(id).first();
  }
  
  static async getByUsuario(db, usuario_id, limit = 50) {
    const result = await db.prepare(
      'SELECT * FROM audit_logs WHERE usuario_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(usuario_id, limit).all();
    return result.results || [];
  }
  
  static async getByModulo(db, modulo, limit = 50) {
    const result = await db.prepare(
      'SELECT * FROM audit_logs WHERE modulo = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(modulo, limit).all();
    return result.results || [];
  }
}

export default AuditLog;
