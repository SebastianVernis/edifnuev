# 🔧 Plan de Corrección - Data Leak en Fondos

**Fecha:** 2025-12-23  
**Prioridad:** 🔴 Crítica  
**Issue:** 4 fondos compartidos entre buildings (data leak)

---

## 🔍 Análisis del Problema

### **Data Leak Detectado:**
```
Test: Multitenancy - Fondos están aislados por building
Resultado: ❌ Data leak: 4 fondos shared between buildings

Building 13 ve: 4 fondos (debería ver solo 2)
Building 99 ve: 4 fondos (debería ver solo 2)
```

### **Datos en DB:**
```sql
Building 13:
  - fondo-13-1: Fondo Reserva ($50,000)
  - fondo-13-2: Fondo Mantenimiento ($25,000)

Building 99:
  - fondo-99-1: Fondo Reserva ($30,000)
  - fondo-99-2: Fondo Mantenimiento ($15,000)
```

### **Causa Raíz:**
**Archivo:** `src/handlers/fondos.js`  
**Línea 12:**
```javascript
// ❌ PROBLEMA: No filtra por building_id
const stmt = request.db.prepare('SELECT * FROM fondos ORDER BY created_at DESC');
```

---

## 📋 Archivos a Corregir

### **1. src/handlers/fondos.js** (Prioridad 🔴 CRÍTICA)

#### **Método: getAll()** - Línea 10-33
```javascript
// ANTES
export async function getAll(request, env) {
  const stmt = request.db.prepare('SELECT * FROM fondos ORDER BY created_at DESC');
  const result = await stmt.all();
  // ...
}

// DESPUÉS
export async function getAll(request, env) {
  const buildingId = request.usuario?.building_id;
  if (!buildingId) {
    return error403('Usuario sin edificio asignado');
  }
  
  const stmt = request.db.prepare(
    'SELECT * FROM fondos WHERE building_id = ? ORDER BY created_at DESC'
  );
  const result = await stmt.bind(buildingId).all();
  // ...
}
```

#### **Método: getById()** - Línea 38-72
```javascript
// ANTES
const stmt = request.db.prepare('SELECT * FROM fondos WHERE id = ?');
const item = await stmt.bind(id).first();

// DESPUÉS
const buildingId = request.usuario?.building_id;
const stmt = request.db.prepare(
  'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
);
const item = await stmt.bind(id, buildingId).first();
```

#### **Método: create()** - Línea 77-128
```javascript
// DESPUÉS
const buildingId = request.usuario?.building_id;
if (!buildingId) {
  return error403('Usuario sin edificio asignado');
}

const stmt = request.db.prepare(`
  INSERT INTO fondos (id, nombre, tipo, saldo_actual, building_id, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);
await stmt.bind(id, nombre, tipo, saldo, buildingId).run();
```

#### **Método: update()** - Línea 130-180
```javascript
// DESPUÉS
const buildingId = request.usuario?.building_id;

// Validar ownership
const existing = await request.db.prepare(
  'SELECT id FROM fondos WHERE id = ? AND building_id = ?'
).bind(id, buildingId).first();

if (!existing) {
  return error404('Fondo no encontrado');
}

// UPDATE solo si pertenece al building
await request.db.prepare(
  'UPDATE fondos SET ... WHERE id = ? AND building_id = ?'
).bind(..., id, buildingId).run();
```

#### **Método: remove()** - Línea 182-220
```javascript
// DESPUÉS
const buildingId = request.usuario?.building_id;

// Validar ownership
const existing = await request.db.prepare(
  'SELECT id FROM fondos WHERE id = ? AND building_id = ?'
).bind(id, buildingId).first();

if (!existing) {
  return error404('Fondo no encontrado');
}

// DELETE solo si pertenece al building
await request.db.prepare(
  'DELETE FROM fondos WHERE id = ? AND building_id = ?'
).bind(id, buildingId).run();
```

#### **Método: transferir()** - Verificar si existe
```javascript
// Validar que AMBOS fondos pertenecen al mismo building
const fondoOrigen = await request.db.prepare(
  'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
).bind(fondoOrigenId, buildingId).first();

const fondoDestino = await request.db.prepare(
  'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
).bind(fondoDestinoId, buildingId).first();

if (!fondoOrigen || !fondoDestino) {
  return error404('Fondos no encontrados o no pertenecen a tu edificio');
}
```

---

### **2. src/handlers/missing-endpoints.js** (Prioridad 🟡 MEDIA)

**Línea 104:**
```javascript
// ANTES
const result = await request.db.prepare(
  'SELECT COALESCE(SUM(saldo), 0) as total FROM fondos'
).first();

// DESPUÉS
const buildingId = request.usuario?.building_id;
const result = await request.db.prepare(
  'SELECT COALESCE(SUM(saldo_actual), 0) as total FROM fondos WHERE building_id = ?'
).bind(buildingId).first();
```

---

### **3. src/handlers/cuotas.js** (Prioridad 🟢 BAJA)

**Línea 359:** Ya tiene subquery, verificar que sea correcto
```javascript
// Verificar este SELECT para fondos
(SELECT id FROM fondos WHERE tipo = 'dineroOperacional' LIMIT 1)

// Debería ser:
(SELECT id FROM fondos WHERE tipo = 'dineroOperacional' AND building_id = ? LIMIT 1)
```

---

## 🧪 Plan de Testing Local

### **Paso 1: Crear Test de Verificación**
```bash
cd saas-migration/edificio-admin-saas-adapted

cat > test-fondos-isolation.js << 'EOF'
import fetch from 'node-fetch';

const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';

async function testFondosIsolation() {
  console.log('🧪 Testing Fondos Isolation\n');
  
  // Login admin building 13
  const login1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sebas@sebas.com', password: 'TestPass123!' })
  });
  const { token: token1 } = await login1.json();
  
  await new Promise(r => setTimeout(r, 300));
  
  // Login admin building 99
  const login2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@building99.com', password: 'TestPass123!' })
  });
  const { token: token2 } = await login2.json();
  
  await new Promise(r => setTimeout(r, 300));
  
  // Get fondos building 13
  const fondos1 = await fetch(`${BASE_URL}/api/fondos`, {
    headers: { 'x-auth-token': token1 }
  });
  const data1 = await fondos1.json();
  
  await new Promise(r => setTimeout(r, 300));
  
  // Get fondos building 99
  const fondos2 = await fetch(`${BASE_URL}/api/fondos`, {
    headers: { 'x-auth-token': token2 }
  });
  const data2 = await fondos2.json();
  
  console.log('Building 13 fondos:', data1.fondos?.length || 0);
  console.log('IDs:', data1.fondos?.map(f => f.id).join(', '));
  console.log('');
  console.log('Building 99 fondos:', data2.fondos?.length || 0);
  console.log('IDs:', data2.fondos?.map(f => f.id).join(', '));
  console.log('');
  
  // Verificar overlap
  const ids1 = new Set(data1.fondos?.map(f => f.id) || []);
  const ids2 = new Set(data2.fondos?.map(f => f.id) || []);
  const overlap = [...ids1].filter(id => ids2.has(id));
  
  if (overlap.length > 0) {
    console.log('🚨 DATA LEAK DETECTED!');
    console.log('Shared fondos:', overlap.join(', '));
    console.log('');
    return false;
  } else {
    console.log('✅ ISOLATION CORRECT');
    console.log('No shared fondos between buildings');
    console.log('');
    return true;
  }
}

testFondosIsolation();
EOF
```

### **Paso 2: Ejecutar Test PRE-FIX**
```bash
node test-fondos-isolation.js
```

**Output Esperado (ANTES del fix):**
```
Building 13 fondos: 4
IDs: fondo-13-1, fondo-13-2, fondo-99-1, fondo-99-2

Building 99 fondos: 4
IDs: fondo-13-1, fondo-13-2, fondo-99-1, fondo-99-2

🚨 DATA LEAK DETECTED!
Shared fondos: fondo-13-1, fondo-13-2, fondo-99-1, fondo-99-2
```

### **Paso 3: Aplicar Fixes**
Modificar `src/handlers/fondos.js` según plan arriba

### **Paso 4: Deploy**
```bash
wrangler deploy
```

### **Paso 5: Ejecutar Test POST-FIX**
```bash
node test-fondos-isolation.js
```

**Output Esperado (DESPUÉS del fix):**
```
Building 13 fondos: 2
IDs: fondo-13-1, fondo-13-2

Building 99 fondos: 2
IDs: fondo-99-1, fondo-99-2

✅ ISOLATION CORRECT
No shared fondos between buildings
```

### **Paso 6: Re-ejecutar Suite Completa**
```bash
npm run test:multitenancy
```

**Esperado:** 8/8 passed (100%)

---

## 📊 Métodos a Corregir (Resumen)

| Método | Línea | Fix Required | Prioridad |
|--------|-------|--------------|-----------|
| `getAll()` | 12 | WHERE building_id = ? | 🔴 Crítica |
| `getById()` | 41 | WHERE id = ? AND building_id = ? | 🔴 Crítica |
| `create()` | 77 | INSERT building_id | 🔴 Crítica |
| `update()` | 130 | Validar ownership + WHERE AND building_id | 🔴 Crítica |
| `remove()` | 182 | Validar ownership + WHERE AND building_id | 🔴 Crítica |
| `transferir()` | ? | Validar ambos fondos same building | 🔴 Crítica |

---

## 🎯 Tarea para Remote Code

### **Prompt Estructurado:**
```markdown
🔒 CRÍTICO: Fix Data Leak en Handler de Fondos

REPOSITORIO: https://github.com/SebastianVernis/edifnuev
BRANCH: feature/smartbuilding-e2e-testing-suite-t6dop6

PROBLEMA:
- Handler fondos.js NO filtra por building_id
- Usuarios ven fondos de TODOS los edificios
- Data leak confirmado: 4 fondos compartidos entre buildings

ARCHIVOS A CORREGIR:
1. src/handlers/fondos.js (6 métodos)
2. src/handlers/missing-endpoints.js (1 método)
3. src/handlers/cuotas.js (1 subquery)

PATRÓN DE CORRECCIÓN:
- getAll(): WHERE building_id = ?
- getById(): WHERE id = ? AND building_id = ?
- create(): INSERT building_id
- update(): Validar ownership
- remove(): Validar ownership
- transferir(): Validar ambos fondos mismo building

VALIDACIÓN:
- Test: node test-fondos-isolation.js
- Esperado: 0 overlap entre buildings
- Suite: npm run test:multitenancy
- Target: 8/8 passed (100%)

CRITERIOS DE ÉXITO:
- [ ] 6 métodos corregidos en fondos.js
- [ ] Test de isolation pasa (0 overlap)
- [ ] Suite multitenancy: 8/8 passed
- [ ] 0 data leaks detectados

TIEMPO: 15-20 minutos
```

---

## 📝 Checklist Pre-Tarea

- [x] Data leak confirmado (test ejecutado)
- [x] Causa identificada (línea 12, fondos.js)
- [x] Plan estructurado creado
- [x] Test de validación preparado
- [x] Datos de testing en DB
- [x] Worker estable (sin Error 1102)
- [ ] ⏳ Tarea remota creada
- [ ] ⏳ Fix aplicado
- [ ] ⏳ Testing post-fix
- [ ] ⏳ Merge a master

---

## 🔐 Vulnerabilidades a Verificar

### **1. JWT Header Validation** 🟡 MEDIA
```
Test: Security - JWT - Valida header x-auth-token
Resultado: ❌ Should only accept x-auth-token header

Problema: Worker acepta tokens de header incorrecto
```

**Verificar:** `src/middleware/auth.js`  
**Expected:** Solo aceptar `x-auth-token`, rechazar `Authorization: Bearer`

### **2. Rate Limiting Detection** 🟡 MEDIA
```
Warning: No rate limiting detected on login
```

**Status:** Rate limiting SÍ está implementado  
**Problema:** Test no lo detecta correctamente (falso positivo)  
**Acción:** Actualizar test o documentar

---

## 📊 Estado Post-Fix Esperado

### **Antes del Fix:**
- Pass Rate: 80.3% (61/76)
- Data Leaks: 1
- Multitenancy: 5/8 (62.5%)

### **Después del Fix:**
- Pass Rate: >85% (65+/76)
- Data Leaks: 0 ✅
- Multitenancy: 8/8 (100%) ✅

---

**Ready para:** Crear tarea remote-code con este plan
