/**
 * Modelo Parcialidad para D1 Database
 */

class Parcialidad {
  static async create(db, data) {
    const { cuota_id, monto, fecha_pago, metodo_pago, referencia, notas } = data;
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO parcialidades (
        id, cuota_id, monto, fecha_pago, metodo_pago, referencia, notas, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, cuota_id, parseFloat(monto), fecha_pago || new Date().toISOString(),
      metodo_pago || null, referencia || null, notas || null,
      new Date().toISOString()
    ).run();
    
    return await Parcialidad.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM parcialidades WHERE 1=1';
    const params = [];
    
    if (filters.cuota_id) { query += ' AND cuota_id = ?'; params.push(filters.cuota_id); }
    
    query += ' ORDER BY fecha_pago DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getByCuota(db, cuota_id) {
    const result = await db.prepare(
      'SELECT * FROM parcialidades WHERE cuota_id = ? ORDER BY fecha_pago ASC'
    ).bind(cuota_id).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM parcialidades WHERE id = ?').bind(id).first();
  }
  
  static async update(db, id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.monto !== undefined) { fields.push('monto = ?'); values.push(parseFloat(updates.monto)); }
    if (updates.fecha_pago !== undefined) { fields.push('fecha_pago = ?'); values.push(updates.fecha_pago); }
    if (updates.metodo_pago !== undefined) { fields.push('metodo_pago = ?'); values.push(updates.metodo_pago); }
    if (updates.referencia !== undefined) { fields.push('referencia = ?'); values.push(updates.referencia); }
    if (updates.notas !== undefined) { fields.push('notas = ?'); values.push(updates.notas); }
    
    if (fields.length === 0) return await Parcialidad.getById(db, id);
    
    values.push(id);
    
    await db.prepare(`UPDATE parcialidades SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Parcialidad.getById(db, id);
  }
  
  static async delete(db, id) {
    await db.prepare('DELETE FROM parcialidades WHERE id = ?').bind(id).run();
    return true;
  }
  
  static async getTotalByCuota(db, cuota_id) {
    const result = await db.prepare(
      'SELECT SUM(monto) as total FROM parcialidades WHERE cuota_id = ?'
    ).bind(cuota_id).first();
    return parseFloat(result?.total || 0);
  }
}

export default Parcialidad;
