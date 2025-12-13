/**
 * Modelo Fondo para D1 Database
 * Adaptado de Fondo.js (data.json)
 */

class Fondo {
  /**
   * Crear un nuevo fondo
   */
  static async create(db, fondoData) {
    const { nombre, tipo, saldo_actual = 0, meta, descripcion, building_id } = fondoData;
    
    const id = crypto.randomUUID();
    
    await db.prepare(`
      INSERT INTO fondos (
        id, nombre, tipo, saldo_actual, meta, descripcion, 
        building_id, activo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, nombre, tipo, parseFloat(saldo_actual), meta ? parseFloat(meta) : null,
      descripcion || null, building_id || null, 1, new Date().toISOString()
    ).run();
    
    return await Fondo.getById(db, id);
  }
  
  /**
   * Obtener todos los fondos
   */
  static async getAll(db, building_id = null) {
    const query = building_id
      ? 'SELECT * FROM fondos WHERE activo = 1 AND building_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM fondos WHERE activo = 1 ORDER BY created_at DESC';
    
    const result = building_id
      ? await db.prepare(query).bind(building_id).all()
      : await db.prepare(query).all();
    
    return result.results || [];
  }
  
  /**
   * Obtener fondo por ID
   */
  static async getById(db, id) {
    return await db.prepare(
      'SELECT * FROM fondos WHERE id = ?'
    ).bind(id).first();
  }
  
  /**
   * Obtener fondo por tipo
   */
  static async getByTipo(db, tipo, building_id = null) {
    const query = building_id
      ? 'SELECT * FROM fondos WHERE tipo = ? AND building_id = ? AND activo = 1'
      : 'SELECT * FROM fondos WHERE tipo = ? AND activo = 1';
    
    const result = building_id
      ? await db.prepare(query).bind(tipo, building_id).first()
      : await db.prepare(query).bind(tipo).first();
    
    return result;
  }
  
  /**
   * Actualizar fondo
   */
  static async update(db, id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.nombre !== undefined) { fields.push('nombre = ?'); values.push(updates.nombre); }
    if (updates.saldo_actual !== undefined) { fields.push('saldo_actual = ?'); values.push(parseFloat(updates.saldo_actual)); }
    if (updates.meta !== undefined) { fields.push('meta = ?'); values.push(updates.meta ? parseFloat(updates.meta) : null); }
    if (updates.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(updates.descripcion); }
    if (updates.activo !== undefined) { fields.push('activo = ?'); values.push(updates.activo ? 1 : 0); }
    
    if (fields.length === 0) return await Fondo.getById(db, id);
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await db.prepare(`UPDATE fondos SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await Fondo.getById(db, id);
  }
  
  /**
   * Eliminar fondo (soft delete)
   */
  static async delete(db, id) {
    await db.prepare('UPDATE fondos SET activo = 0 WHERE id = ?').bind(id).run();
    return true;
  }
  
  /**
   * Transferir entre fondos
   */
  static async transfer(db, fondoOrigenId, fondoDestinoId, monto, descripcion, userId) {
    try {
      const origen = await Fondo.getById(db, fondoOrigenId);
      const destino = await Fondo.getById(db, fondoDestinoId);
      
      if (!origen || !destino) {
        throw new Error('Fondo no encontrado');
      }
      
      if (origen.saldo_actual < monto) {
        throw new Error('Fondos insuficientes para la transferencia');
      }
      
      // Actualizar saldos
      await db.prepare(
        'UPDATE fondos SET saldo_actual = saldo_actual - ? WHERE id = ?'
      ).bind(parseFloat(monto), fondoOrigenId).run();
      
      await db.prepare(
        'UPDATE fondos SET saldo_actual = saldo_actual + ? WHERE id = ?'
      ).bind(parseFloat(monto), fondoDestinoId).run();
      
      // Registrar movimientos
      const movOrigenId = crypto.randomUUID();
      const movDestinoId = crypto.randomUUID();
      const fecha = new Date().toISOString();
      
      await db.prepare(`
        INSERT INTO fondos_movimientos (
          id, fondo_id, tipo, monto, descripcion, fecha, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        movOrigenId, fondoOrigenId, 'egreso', parseFloat(monto),
        descripcion || `Transferencia a ${destino.nombre}`,
        fecha, userId, fecha
      ).run();
      
      await db.prepare(`
        INSERT INTO fondos_movimientos (
          id, fondo_id, tipo, monto, descripcion, fecha, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        movDestinoId, fondoDestinoId, 'ingreso', parseFloat(monto),
        descripcion || `Transferencia desde ${origen.nombre}`,
        fecha, userId, fecha
      ).run();
      
      return {
        origen: await Fondo.getById(db, fondoOrigenId),
        destino: await Fondo.getById(db, fondoDestinoId)
      };
    } catch (error) {
      console.error('Error en transferencia:', error);
      throw error;
    }
  }
  
  /**
   * Registrar gasto desde un fondo
   */
  static async registerExpense(db, fondoId, monto, descripcion, userId) {
    const fondo = await Fondo.getById(db, fondoId);
    
    if (!fondo) {
      throw new Error('Fondo no encontrado');
    }
    
    if (fondo.saldo_actual < monto) {
      throw new Error('Fondos insuficientes para el gasto');
    }
    
    // Actualizar saldo
    await db.prepare(
      'UPDATE fondos SET saldo_actual = saldo_actual - ? WHERE id = ?'
    ).bind(parseFloat(monto), fondoId).run();
    
    // Registrar movimiento
    const movId = crypto.randomUUID();
    const fecha = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO fondos_movimientos (
        id, fondo_id, tipo, monto, descripcion, fecha, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(movId, fondoId, 'egreso', parseFloat(monto), descripcion, fecha, userId, fecha).run();
    
    return await Fondo.getById(db, fondoId);
  }
  
  /**
   * Registrar ingreso a un fondo
   */
  static async registerIncome(db, fondoId, monto, descripcion, userId) {
    const fondo = await Fondo.getById(db, fondoId);
    
    if (!fondo) {
      throw new Error('Fondo no encontrado');
    }
    
    // Actualizar saldo
    await db.prepare(
      'UPDATE fondos SET saldo_actual = saldo_actual + ? WHERE id = ?'
    ).bind(parseFloat(monto), fondoId).run();
    
    // Registrar movimiento
    const movId = crypto.randomUUID();
    const fecha = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO fondos_movimientos (
        id, fondo_id, tipo, monto, descripcion, fecha, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(movId, fondoId, 'ingreso', parseFloat(monto), descripcion, fecha, userId, fecha).run();
    
    return await Fondo.getById(db, fondoId);
  }
  
  /**
   * Obtener movimientos de un fondo
   */
  static async getMovements(db, fondoId, limit = 50) {
    const result = await db.prepare(`
      SELECT * FROM fondos_movimientos 
      WHERE fondo_id = ? 
      ORDER BY fecha DESC 
      LIMIT ?
    `).bind(fondoId, limit).all();
    
    return result.results || [];
  }
  
  /**
   * Obtener balance de fondos (patrimonio total)
   */
  static async getBalance(db, building_id = null) {
    const query = building_id
      ? 'SELECT SUM(saldo_actual) as total FROM fondos WHERE activo = 1 AND building_id = ?'
      : 'SELECT SUM(saldo_actual) as total FROM fondos WHERE activo = 1';
    
    const result = building_id
      ? await db.prepare(query).bind(building_id).first()
      : await db.prepare(query).first();
    
    return parseFloat(result?.total || 0);
  }
  
  /**
   * Obtener estadísticas de fondos
   */
  static async getStatistics(db, building_id = null) {
    const fondos = await Fondo.getAll(db, building_id);
    
    const stats = {
      total_fondos: fondos.length,
      patrimonio_total: 0,
      por_tipo: {}
    };
    
    for (const fondo of fondos) {
      stats.patrimonio_total += parseFloat(fondo.saldo_actual || 0);
      
      if (!stats.por_tipo[fondo.tipo]) {
        stats.por_tipo[fondo.tipo] = {
          count: 0,
          total: 0
        };
      }
      
      stats.por_tipo[fondo.tipo].count++;
      stats.por_tipo[fondo.tipo].total += parseFloat(fondo.saldo_actual || 0);
    }
    
    return stats;
  }
  
  /**
   * Nombres formatados de fondos
   */
  static formatFondoName(tipo) {
    const nombres = {
      'ahorroAcumulado': 'Ahorro Acumulado',
      'gastosMayores': 'Gastos Mayores',
      'dineroOperacional': 'Dinero Operacional'
    };
    return nombres[tipo] || tipo;
  }
}

export default Fondo;
