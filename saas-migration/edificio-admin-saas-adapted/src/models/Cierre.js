/**
 * Modelo Cierre para D1 Database
 */

class Cierre {
  static async create(db, data) {
    const { 
      periodo, anio, mes, tipo, total_ingresos, total_egresos, 
      saldo_final, observaciones, created_by, building_id 
    } = data;
    
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO cierres (
        id, periodo, anio, mes, tipo, total_ingresos, total_egresos,
        saldo_final, estado, observaciones, created_by, building_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, periodo, parseInt(anio), mes ? parseInt(mes) : null, tipo,
      parseFloat(total_ingresos || 0), parseFloat(total_egresos || 0),
      parseFloat(saldo_final || 0), 'borrador', observaciones || null,
      created_by, building_id || null, new Date().toISOString()
    ).run();
    
    return await Cierre.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM cierres WHERE 1=1';
    const params = [];
    
    if (filters.anio) { query += ' AND anio = ?'; params.push(parseInt(filters.anio)); }
    if (filters.mes) { query += ' AND mes = ?'; params.push(parseInt(filters.mes)); }
    if (filters.tipo) { query += ' AND tipo = ?'; params.push(filters.tipo); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    if (filters.building_id) { query += ' AND building_id = ?'; params.push(filters.building_id); }
    
    query += ' ORDER BY anio DESC, mes DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM cierres WHERE id = ?').bind(id).first();
  }
  
  static async update(db, id, updates) {
    const allowedFields = [
      'estado', 'observaciones', 'fecha_cierre', 'total_ingresos', 
      'total_egresos', 'saldo_final', 'pdf_url', 'comprobantes_zip_url',
      'total_comprobantes', 'enviado_email', 'fecha_envio'
    ];
    const fields = [];
    const values = [];
    
    if (updates.estado !== undefined) { fields.push('estado = ?'); values.push(updates.estado); }
    if (updates.observaciones !== undefined) { fields.push('observaciones = ?'); values.push(updates.observaciones); }
    if (updates.estado === 'cerrado') { fields.push('fecha_cierre = ?'); values.push(new Date().toISOString()); }
    
    if (fields.length === 0) return await Cierre.getById(db, id);
    
    values.push(id);
    
    await db.prepare(`UPDATE cierres SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Cierre.getById(db, id);
  }
  
  static async delete(db, id) {
    await db.prepare('DELETE FROM cierres WHERE id = ?').bind(id).run();
    return true;
  }
}

export default Cierre;
