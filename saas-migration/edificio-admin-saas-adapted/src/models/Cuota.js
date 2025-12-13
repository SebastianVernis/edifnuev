/**
 * Modelo Cuota para D1 Database
 * Adaptado de Cuota.js (data.json)
 */

class Cuota {
  /**
   * Crear una nueva cuota
   */
  static async create(db, cuotaData) {
    try {
      const { mes, anio, monto, fechaVencimiento, departamento, building_id } = cuotaData;
      
      const id = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO cuotas (
          id, departamento, mes, anio, monto, estado, 
          fecha_vencimiento, building_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        departamento,
        parseInt(mes),
        parseInt(anio),
        parseFloat(monto),
        'PENDIENTE',
        fechaVencimiento || null,
        building_id || null,
        new Date().toISOString()
      ).run();
      
      return await Cuota.getById(db, id);
    } catch (error) {
      console.error('Error al crear cuota:', error);
      throw error;
    }
  }
  
  /**
   * Generar cuotas para todos los departamentos
   */
  static async generateMonthly(db, mes, anio, monto, fechaVencimiento, building_id = null) {
    try {
      // Verificar si ya existen cuotas para este mes y año
      const checkQuery = building_id
        ? 'SELECT COUNT(*) as count FROM cuotas WHERE mes = ? AND anio = ? AND building_id = ?'
        : 'SELECT COUNT(*) as count FROM cuotas WHERE mes = ? AND anio = ?';
      
      const bindParams = building_id 
        ? [parseInt(mes), parseInt(anio), building_id]
        : [parseInt(mes), parseInt(anio)];
      
      const existentes = await db.prepare(checkQuery).bind(...bindParams).first();
      
      if (existentes && existentes.count > 0) {
        throw new Error(`Ya existen cuotas generadas para ${mes}/${anio}`);
      }
      
      // Obtener todos los usuarios inquilinos
      const inquilinosQuery = building_id
        ? 'SELECT DISTINCT departamento FROM usuarios WHERE rol = ? AND activo = 1 AND building_id = ?'
        : 'SELECT DISTINCT departamento FROM usuarios WHERE rol = ? AND activo = 1';
      
      const inquilinosParams = building_id 
        ? ['INQUILINO', building_id]
        : ['INQUILINO'];
      
      const result = await db.prepare(inquilinosQuery).bind(...inquilinosParams).all();
      const departamentos = result.results || [];
      
      // Crear cuotas para cada departamento
      const cuotasGeneradas = [];
      
      for (const { departamento } of departamentos) {
        const id = crypto.randomUUID();
        
        await db.prepare(`
          INSERT INTO cuotas (
            id, departamento, mes, anio, monto, estado, 
            fecha_vencimiento, building_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          departamento,
          parseInt(mes),
          parseInt(anio),
          parseFloat(monto),
          'PENDIENTE',
          fechaVencimiento || null,
          building_id || null,
          new Date().toISOString()
        ).run();
        
        cuotasGeneradas.push({
          id,
          departamento,
          mes: parseInt(mes),
          anio: parseInt(anio),
          monto: parseFloat(monto),
          estado: 'PENDIENTE'
        });
      }
      
      return cuotasGeneradas;
    } catch (error) {
      console.error('Error al generar cuotas mensuales:', error);
      throw error;
    }
  }
  
  /**
   * Obtener todas las cuotas
   */
  static async getAll(db, filters = {}) {
    let query = 'SELECT * FROM cuotas WHERE 1=1';
    const params = [];
    
    if (filters.departamento) {
      query += ' AND departamento = ?';
      params.push(filters.departamento);
    }
    if (filters.mes) {
      query += ' AND mes = ?';
      params.push(parseInt(filters.mes));
    }
    if (filters.anio) {
      query += ' AND anio = ?';
      params.push(parseInt(filters.anio));
    }
    if (filters.estado) {
      query += ' AND estado = ?';
      params.push(filters.estado);
    }
    if (filters.building_id) {
      query += ' AND building_id = ?';
      params.push(filters.building_id);
    }
    
    query += ' ORDER BY anio DESC, mes DESC, departamento ASC';
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  /**
   * Obtener cuotas por departamento
   */
  static async getByDepartamento(db, departamento) {
    const result = await db.prepare(
      'SELECT * FROM cuotas WHERE departamento = ? ORDER BY anio DESC, mes DESC'
    ).bind(departamento).all();
    
    return result.results || [];
  }
  
  /**
   * Obtener cuotas por mes y año
   */
  static async getByPeriodo(db, mes, anio, building_id = null) {
    const query = building_id
      ? 'SELECT * FROM cuotas WHERE mes = ? AND anio = ? AND building_id = ? ORDER BY departamento ASC'
      : 'SELECT * FROM cuotas WHERE mes = ? AND anio = ? ORDER BY departamento ASC';
    
    const params = building_id 
      ? [parseInt(mes), parseInt(anio), building_id]
      : [parseInt(mes), parseInt(anio)];
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  }
  
  /**
   * Obtener una cuota por ID
   */
  static async getById(db, id) {
    return await db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
  }
  
  /**
   * Actualizar estado de cuota
   */
  static async updateStatus(db, id, estado, fechaPago = null, comprobantePago = null) {
    const updates = [];
    const values = [];
    
    updates.push('estado = ?');
    values.push(estado);
    
    if (fechaPago || estado === 'PAGADO') {
      updates.push('fecha_pago = ?');
      values.push(fechaPago || new Date().toISOString());
    }
    
    if (comprobantePago) {
      updates.push('comprobante = ?');
      values.push(comprobantePago);
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    values.push(id);
    
    await db.prepare(`
      UPDATE cuotas 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
    
    return await Cuota.getById(db, id);
  }
  
  /**
   * Registrar pago
   */
  static async registerPayment(db, id, metodoPago = null, referencia = null) {
    const fechaPago = new Date().toISOString();
    
    await db.prepare(`
      UPDATE cuotas 
      SET estado = 'PAGADO',
          fecha_pago = ?,
          metodo_pago = ?,
          referencia = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(fechaPago, metodoPago, referencia, fechaPago, id).run();
    
    return await Cuota.getById(db, id);
  }
  
  /**
   * Actualizar cuotas vencidas
   */
  static async updateOverdue(db) {
    const hoy = new Date().toISOString();
    
    const result = await db.prepare(`
      UPDATE cuotas 
      SET estado = 'VENCIDO'
      WHERE estado = 'PENDIENTE' 
        AND fecha_vencimiento < ?
    `).bind(hoy).run();
    
    return result.changes || 0;
  }
  
  /**
   * Eliminar una cuota
   */
  static async delete(db, id) {
    await db.prepare(
      'DELETE FROM cuotas WHERE id = ?'
    ).bind(id).run();
    
    return true;
  }
  
  /**
   * Obtener acumulado anual de un departamento
   */
  static async getAcumuladoAnual(db, departamento, anio) {
    const result = await db.prepare(`
      SELECT 
        COUNT(*) as total_cuotas,
        SUM(CASE WHEN estado = 'PAGADO' THEN monto ELSE 0 END) as total_pagado,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN monto ELSE 0 END) as total_pendiente,
        SUM(CASE WHEN estado = 'VENCIDO' THEN monto ELSE 0 END) as total_vencido,
        SUM(monto) as total_general
      FROM cuotas
      WHERE departamento = ? AND anio = ?
    `).bind(departamento, parseInt(anio)).first();
    
    return result || {
      total_cuotas: 0,
      total_pagado: 0,
      total_pendiente: 0,
      total_vencido: 0,
      total_general: 0
    };
  }
  
  /**
   * Obtener estadísticas de cuotas
   */
  static async getStatistics(db, filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'PAGADO' THEN 1 ELSE 0 END) as pagadas,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'VENCIDO' THEN 1 ELSE 0 END) as vencidas,
        SUM(CASE WHEN estado = 'PAGADO' THEN monto ELSE 0 END) as monto_pagado,
        SUM(CASE WHEN estado != 'PAGADO' THEN monto ELSE 0 END) as monto_pendiente,
        SUM(monto) as monto_total
      FROM cuotas
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.mes) {
      query += ' AND mes = ?';
      params.push(parseInt(filters.mes));
    }
    if (filters.anio) {
      query += ' AND anio = ?';
      params.push(parseInt(filters.anio));
    }
    if (filters.building_id) {
      query += ' AND building_id = ?';
      params.push(filters.building_id);
    }
    
    const result = await db.prepare(query).bind(...params).first();
    
    return result || {
      total: 0,
      pagadas: 0,
      pendientes: 0,
      vencidas: 0,
      monto_pagado: 0,
      monto_pendiente: 0,
      monto_total: 0
    };
  }
  
  /**
   * Obtener cuotas pendientes por departamento
   */
  static async getPendingByDepartamento(db, departamento) {
    const result = await db.prepare(`
      SELECT * FROM cuotas 
      WHERE departamento = ? 
        AND estado IN ('PENDIENTE', 'VENCIDO')
      ORDER BY anio DESC, mes DESC
    `).bind(departamento).all();
    
    return result.results || [];
  }
  
  /**
   * Actualizar monto de una cuota
   */
  static async updateAmount(db, id, nuevoMonto) {
    await db.prepare(`
      UPDATE cuotas 
      SET monto = ?, updated_at = ?
      WHERE id = ? AND estado = 'PENDIENTE'
    `).bind(parseFloat(nuevoMonto), new Date().toISOString(), id).run();
    
    return await Cuota.getById(db, id);
  }
}

export default Cuota;
