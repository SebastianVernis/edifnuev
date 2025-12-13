# Template de Conversión: Express Controllers → Cloudflare Workers Handlers

Este documento explica cómo convertir los controllers de Express a handlers de Cloudflare Workers.

## Estructura General

### Express Controller (Antes)
```javascript
export const getAll = async (req, res) => {
  try {
    const data = await Model.getAll();
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, msg: error.message });
  }
};
```

### Cloudflare Handler (Después)
```javascript
export async function getAll(request, env) {
  try {
    const data = await Model.getAll(request.db);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}
```

## Cambios Necesarios

### 1. Signature de la función
- **Antes**: `async (req, res) => {}`
- **Después**: `async function name(request, env) {}`

### 2. Acceso a datos del request
- **Antes**: `req.body`, `req.params`, `req.query`
- **Después**: 
  - Body: `await request.json()`
  - Params: `request.params` (ya parseados por itty-router)
  - Query: `new URL(request.url).searchParams`

### 3. Usuario autenticado
- **Antes**: `req.usuario` (añadido por middleware)
- **Después**: `request.user` (añadido por verifyToken middleware)

### 4. Base de datos
- **Antes**: Se importa directamente
- **Después**: `request.db` (añadido por withDb middleware)

### 5. Respuestas
- **Antes**: `res.json()`, `res.status().json()`
- **Después**: 
```javascript
return addCorsHeaders(new Response(JSON.stringify({
  // data
}), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
}), request);
```

## Handlers Faltantes

Los siguientes handlers necesitan ser creados siguiendo el template:

### Prioritarios (funcionalidad core)
1. ✅ **auth.js** - COMPLETADO
2. **usuarios.js** - Gestión de usuarios
3. **cuotas.js** - Gestión de cuotas (funcionalidad principal)
4. **gastos.js** - Registro de gastos
5. **fondos.js** - Gestión de fondos

### Secundarios
6. **presupuestos.js** - Gestión de presupuestos
7. **cierres.js** - Cierres contables
8. **anuncios.js** - Sistema de anuncios
9. **permisos.js** - Gestión de permisos
10. **audit.js** - Logs de auditoría
11. **solicitudes.js** - Solicitudes de residentes
12. **parcialidades.js** - Pagos parciales

## Modelos Necesarios

Los modelos también deben adaptarse:

### Cambios en Modelos
- **Antes**: Usa `data.js` directamente
- **Después**: Recibe `db` como primer parámetro

```javascript
// Express (antes)
static async getAll() {
  const { data } = await import('../data.js');
  return data.usuarios;
}

// Cloudflare Workers (después)
static async getAll(db) {
  const stmt = db.prepare('SELECT * FROM usuarios');
  const result = await stmt.all();
  return result.results;
}
```

## Próximos Pasos

1. Completar handlers restantes usando este template
2. Adaptar modelos para usar D1 database
3. Migrar esquema de data.json a SQL (migrations)
4. Testear cada endpoint individualmente
5. Configurar variables de entorno en Cloudflare
