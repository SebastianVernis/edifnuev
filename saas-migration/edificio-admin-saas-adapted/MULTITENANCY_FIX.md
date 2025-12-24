# 🔒 Fix Crítico de Multitenancy

**PROBLEMA DETECTADO:** Handlers NO filtran por building_id

**Riesgo:** Usuarios ven datos de TODOS los edificios (violación de privacidad)

---

## ✅ Correcciones Aplicadas

### 1. Token JWT
- ✅ Agregado `building_id` al payload del token
- Archivo: `src/handlers/auth.js:72`

### 2. Handlers Corregidos

#### Cuotas
- ✅ getAll() - Filtro `WHERE building_id = ?`

#### Pendientes (CRÍTICOS):
- ⚠️ Gastos - Falta filtro
- ⚠️ Fondos - Falta filtro  
- ⚠️ Anuncios - Falta filtro
- ⚠️ Cierres - Falta filtro
- ⚠️ Usuarios - Falta filtro

---

## 🚨 ACCIÓN INMEDIATA REQUERIDA

Cada handler de GET/POST/PUT/DELETE debe:

```javascript
// 1. Obtener building_id del token
const buildingId = request.user?.building_id;

// 2. Validar que existe
if (!buildingId) {
  return error('Usuario sin edificio');
}

// 3. Filtrar queries
SELECT * FROM tabla WHERE building_id = ?
INSERT INTO tabla (..., building_id) VALUES (..., ?)
UPDATE tabla SET ... WHERE id = ? AND building_id = ?
DELETE FROM tabla WHERE id = ? AND building_id = ?
```

---

## 📋 Checklist de Seguridad

- [x] Token incluye building_id
- [x] Cuotas filtran por building_id
- [ ] Gastos filtran por building_id
- [ ] Fondos filtran por building_id
- [ ] Anuncios filtran por building_id
- [ ] Cierres filtran por building_id
- [ ] Usuarios filtran por building_id
- [ ] Presupuestos filtran por building_id

---

**PRIORIDAD:** 🔴 CRÍTICA
**Debe corregirse antes de producción**
