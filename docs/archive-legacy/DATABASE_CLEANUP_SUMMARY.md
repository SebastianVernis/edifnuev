# Resumen de Limpieza de Base de Datos

## 📅 Fecha
16 de Enero de 2026

## 🎯 Objetivo
Limpiar completamente la base de datos de producción (D1) para comenzar con datos frescos después de las correcciones del flujo de setup.

---

## 🗑️ Limpieza Ejecutada

### Base de Datos: `edificio-admin-db`
- **ID**: `a571aea0-d80d-4846-a31c-9936bddabdf5`
- **Ubicación**: Remota (Producción)
- **Region**: ENAM (East North America)

### Proceso de Limpieza

#### 1. Orden de Eliminación (respetando Foreign Keys)

```sql
-- Paso 1: Tablas dependientes
DELETE FROM parcialidades;
DELETE FROM cuotas;
DELETE FROM movimientos_fondos;
DELETE FROM presupuestos;
DELETE FROM gastos;
DELETE FROM anuncios;
DELETE FROM cierres;
DELETE FROM solicitudes;
DELETE FROM audit_log;
DELETE FROM permisos;
DELETE FROM fondos;
DELETE FROM theme_configs;
DELETE FROM patrimonies;

-- Paso 2: Romper relación circular
UPDATE buildings SET admin_user_id = NULL;

-- Paso 3: Eliminar usuarios
DELETE FROM usuarios;

-- Paso 4: Eliminar buildings
DELETE FROM buildings;

-- Paso 5: Reset contadores
DELETE FROM sqlite_sequence;
```

#### 2. Estadísticas de Limpieza
- **Queries ejecutadas**: 17
- **Filas leídas**: 209
- **Filas eliminadas**: 78
- **Duración**: 2.77ms
- **Tamaño BD después**: 0.21 MB (reducido de ~0.21 MB)

---

## ✅ Verificación Post-Limpieza

### Conteo de Registros por Tabla

| Tabla | Registros | Status |
|-------|-----------|--------|
| usuarios | 0 | ✅ Vacía |
| buildings | 0 | ✅ Vacía |
| fondos | 0 | ✅ Vacía |
| cuotas | 0 | ✅ Vacía |
| gastos | 0 | ✅ Vacía |
| anuncios | 0 | ✅ Vacía |
| cierres | 0 | ✅ Vacía |
| presupuestos | 0 | ✅ Vacía |
| parcialidades | 0 | ✅ Vacía |
| movimientos_fondos | 0 | ✅ Vacía |
| solicitudes | 0 | ✅ Vacía |
| audit_log | 0 | ✅ Vacía |
| permisos | 0 | ✅ Vacía |
| theme_configs | 0 | ✅ Vacía |
| patrimonies | 0 | ✅ Vacía |

**Total de tablas limpiadas: 15**

---

## 🛠️ Script Creado

Se creó un script reutilizable para futuras limpiezas:

### `scripts/cleanup-database.sh`

**Uso:**
```bash
# Limpiar BD remota (producción) - requiere confirmación
./scripts/cleanup-database.sh

# Limpiar BD local (desarrollo)
./scripts/cleanup-database.sh local
```

**Características:**
- ✅ Orden correcto de eliminación
- ✅ Respeta foreign keys
- ✅ Confirmación requerida para producción
- ✅ Verificación automática post-limpieza
- ✅ Mensajes coloridos y claros
- ✅ Manejo de errores

---

## ⚠️ Problemas Encontrados y Solucionados

### Problema 1: Foreign Key Constraints
**Error**: `FOREIGN KEY constraint failed: SQLITE_CONSTRAINT`

**Causa**: Intentar eliminar `buildings` antes que `usuarios`, cuando `buildings.admin_user_id` referencia a `usuarios.id`

**Solución**: 
1. Actualizar `buildings SET admin_user_id = NULL` primero
2. Eliminar `usuarios`
3. Eliminar `buildings`

### Problema 2: PRAGMA no funciona en comandos remotos
**Error**: `PRAGMA foreign_keys = OFF` no se ejecuta en remote

**Causa**: Cloudflare D1 no permite PRAGMA en comandos remotos

**Solución**: Usar el orden correcto de DELETE sin necesidad de desactivar foreign keys

---

## 🔄 Relación Circular Detectada

```
buildings.admin_user_id → usuarios.id
usuarios.building_id → buildings.id
```

Esta relación circular requiere:
1. Setear `admin_user_id = NULL` en buildings
2. Eliminar usuarios
3. Eliminar buildings

O alternativamente en creación:
1. Crear building sin admin_user_id
2. Crear usuario con building_id
3. Actualizar building.admin_user_id

---

## 📊 Estado Final

### Base de Datos Remota (Producción)
```
✅ Todas las tablas: 0 registros
✅ Autoincrement reseteado
✅ Foreign keys intactas
✅ Estructura preservada
✅ Lista para nuevos registros
```

### Base de Datos Local (Desarrollo)
```
✅ Todas las tablas: 0 registros
✅ Sincronizada con producción
✅ Lista para testing
```

---

## 🎯 Siguiente Paso Recomendado

Ahora que la base de datos está limpia, puedes:

1. **Probar el flujo completo desde cero:**
   ```bash
   node test-setup-complete.js
   ```

2. **O probar manualmente:**
   - Ir a https://chispartbuilding.pages.dev/register
   - Completar registro con un plan
   - Verificar OTP
   - Procesar checkout
   - Completar setup (con unidades readonly)
   - Hacer login
   - Verificar que todo se guardó correctamente

3. **Verificar que los fondos, políticas y configuración se guardan:**
   ```bash
   wrangler d1 execute edificio-admin-db --remote --command="
     SELECT * FROM buildings ORDER BY id DESC LIMIT 1;
   "
   wrangler d1 execute edificio-admin-db --remote --command="
     SELECT * FROM fondos ORDER BY id DESC LIMIT 10;
   "
   ```

---

## 📝 Nota sobre Datos de Prueba

Si necesitas datos de prueba después de la limpieza:

```bash
# Opción 1: Usar el seed script (si existe)
npm run seed

# Opción 2: Ejecutar test que crea datos
node test-setup-complete.js

# Opción 3: Registro manual vía frontend
# https://chispartbuilding.pages.dev/register
```

---

**Status**: ✅ LIMPIEZA COMPLETADA
**Tablas afectadas**: 15 tablas
**Registros eliminados**: 78 registros
**Tiempo total**: ~3 segundos
