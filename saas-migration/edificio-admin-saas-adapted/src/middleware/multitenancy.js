/**
 * Middleware de Multitenancy
 * Asegura que cada usuario solo vea datos de su building
 */

/**
 * Obtener building_id del usuario autenticado
 * @param {Request} request - Request con user del token JWT
 * @returns {string} building_id
 */
export function getBuildingId(request) {
  if (!request.user || !request.user.building_id) {
    throw new Error('Usuario sin building_id asignado');
  }
  return request.user.building_id;
}

/**
 * Agregar filtro WHERE building_id a query
 * @param {string} query - SQL query
 * @param {string} buildingId - Building ID
 * @returns {string} Query modificada
 */
export function addBuildingFilter(query, buildingId) {
  if (query.toLowerCase().includes('where')) {
    return `${query} AND building_id = ?`;
  } else {
    return `${query} WHERE building_id = ?`;
  }
}

/**
 * Verificar que un recurso pertenece al building del usuario
 * @param {Object} db - D1 Database
 * @param {string} table - Nombre de la tabla
 * @param {string} resourceId - ID del recurso
 * @param {string} buildingId - Building ID del usuario
 * @returns {Promise<boolean>}
 */
export async function verifyBuildingOwnership(db, table, resourceId, buildingId) {
  const result = await db.prepare(
    `SELECT id FROM ${table} WHERE id = ? AND building_id = ?`
  ).bind(resourceId, buildingId).first();
  
  return !!result;
}

/**
 * Middleware para verificar multitenancy
 * Agrega building_id a request para fácil acceso
 */
export function withBuilding(handler) {
  return async (request, env) => {
    try {
      // El token JWT ya tiene building_id (agregado en auth.js)
      if (!request.user?.building_id) {
        return new Response(JSON.stringify({
          ok: false,
          msg: 'Usuario sin edificio asignado. Completa el setup primero.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Agregar building_id directamente al request
      request.building_id = request.user.building_id;

      // Continuar con el handler
      return await handler(request, env);
    } catch (error) {
      console.error('Error en multitenancy middleware:', error);
      return new Response(JSON.stringify({
        ok: false,
        msg: 'Error de autorización'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
