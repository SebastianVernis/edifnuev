/**
 * Modelo Presupuesto para D1 Database
 */

class Presupuesto {
  static async create(db, data) {
    const { anio, mes, categoria, monto_presupuestado, notas, building_id } = data;
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO presupuestos (
        id, anio, mes, categoria, monto_presupuestado, monto_ejecutado,
        estado, notas, building_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, parseInt(anio), mes ? parseInt(mes) : null, categoria,
      parseFloat(monto_presupuestado), 0, 'activo', notas || null,
      building_id || null, new Date().toISOString()
    ).run();
    
    return await Presupuesto.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM presupuestos WHERE 1=1';
    const params = [];
    
    if (filters.anio) { query += ' AND anio = ?'; params.push(parseInt(filters.anio)); }
    if (filters.mes) { query += ' AND mes = ?'; params.push(parseInt(filters.mes)); }
    if (filters.categoria) { query += ' AND categoria = ?'; params.push(filters.categoria); }
    if (filters.estado) { query += ' AND estado = ?'; params.push(filters.estado); }
    if (filters.building_id) { query += ' AND building_id = ?'; params.push(filters.building_id); }
    
    query += ' ORDER BY anio DESC, mes DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM presupuestos WHERE id = ?').bind(id).first();
  }
  
  static async update(db, id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.monto_presupuestado !== undefined) { 
      fields.push('monto_presupuestado = ?'); 
      values.push(parseFloat(updates.monto_presupuestado)); 
    }
    if (updates.monto_ejecutado !== undefined) { 
      fields.push('monto_ejecutado = ?'); 
      values.push(parseFloat(updates.monto_ejecutado)); 
    }
    if (updates.estado !== undefined) { fields.push('estado = ?'); values.push(updates.estado); }
    if (updates.notas !== undefined) { fields.push('notas = ?'); values.push(updates.notas); }
    
    if (fields.length === 0) return await Presupuesto.getById(db, id);
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await db.prepare(`UPDATE presupuestos SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Presupuesto.getById(db, id);
  }
  
  static async delete(db, id) {
    await db.prepare('DELETE FROM presupuestos WHERE id = ?').bind(id).run();
    return true;
  }
  
  static async getByPeriod(db, anio, mes = null, building_id = null) {
    let query = 'SELECT * FROM presupuestos WHERE anio = ?';
    const params = [parseInt(anio)];
    
    if (mes) {
      query += ' AND mes = ?';
      params.push(parseInt(mes));
    }
    if (building_id) {
      query += ' AND building_id = ?';
      params.push(building_id);
    }
    
    query += ' ORDER BY categoria ASC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
}

export default Presupuesto;
