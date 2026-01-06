/**
 * Modelo Gasto para D1 Database
 */

class Gasto {
  static async create(db, gastoData) {
    const { concepto, monto, categoria, fecha, proveedor, forma_pago, comprobante, notas, created_by, building_id } = gastoData;
    
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO gastos (
        id, concepto, monto, categoria, fecha, proveedor, 
        forma_pago, comprobante, notas, created_by, building_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, concepto, parseFloat(monto), categoria, fecha || new Date().toISOString(),
      proveedor || null, forma_pago || null, comprobante || null, notas || null,
      created_by, building_id || null, new Date().toISOString()
    ).run();
    
    return await Gasto.getById(db, id);
  }
  
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM gastos WHERE 1=1';
    const params = [];
    
    if (filters.categoria) {
      query += ' AND categoria = ?';
      params.push(filters.categoria);
    }
    if (filters.fecha_desde) {
      query += ' AND fecha >= ?';
      params.push(filters.fecha_desde);
    }
    if (filters.fecha_hasta) {
      query += ' AND fecha <= ?';
      params.push(filters.fecha_hasta);
    }
    if (filters.building_id) {
      query += ' AND building_id = ?';
      params.push(filters.building_id);
    }
    
    query += ' ORDER BY fecha DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  static async getById(db, id) {
    return await db.prepare('SELECT * FROM gastos WHERE id = ?').bind(id).first();
  }
  
  static async update(db, id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.concepto !== undefined) { fields.push('concepto = ?'); values.push(updates.concepto); }
    if (updates.monto !== undefined) { fields.push('monto = ?'); values.push(parseFloat(updates.monto)); }
    if (updates.categoria !== undefined) { fields.push('categoria = ?'); values.push(updates.categoria); }
    if (updates.fecha !== undefined) { fields.push('fecha = ?'); values.push(updates.fecha); }
    if (updates.proveedor !== undefined) { fields.push('proveedor = ?'); values.push(updates.proveedor); }
    if (updates.forma_pago !== undefined) { fields.push('forma_pago = ?'); values.push(updates.forma_pago); }
    if (updates.comprobante !== undefined) { fields.push('comprobante = ?'); values.push(updates.comprobante); }
    if (updates.notas !== undefined) { fields.push('notas = ?'); values.push(updates.notas); }
    
    if (fields.length === 0) return await Gasto.getById(db, id);
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await db.prepare(`UPDATE gastos SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Gasto.getById(db, id);
  }
  
  static async delete(db, id) {
    await db.prepare('DELETE FROM gastos WHERE id = ?').bind(id).run();
    return true;
  }
  
  static async getByCategoria(db, categoria) {
    const result = await db.prepare(
      'SELECT * FROM gastos WHERE categoria = ? ORDER BY fecha DESC'
    ).bind(categoria).all();
    return result.results || [];
  }
  
  static async getTotalByPeriod(db, fecha_desde, fecha_hasta, building_id = null) {
    const query = building_id
      ? 'SELECT SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ? AND building_id = ?'
      : 'SELECT SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ?';
    
    const params = building_id ? [fecha_desde, fecha_hasta, building_id] : [fecha_desde, fecha_hasta];
    const result = await db.prepare(query).bind(...params).first();
    
    return parseFloat(result?.total || 0);
  }
}

export default Gasto;
