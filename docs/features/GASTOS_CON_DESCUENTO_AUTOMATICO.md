# Gestión de Gastos con Descuento Automático de Fondos

## 📅 Fecha
16-17 de Enero de 2026

## 🎯 Implementación

Sistema completo de gestión de gastos que **descuenta automáticamente** del fondo seleccionado y actualiza los saldos en tiempo real.

---

## ✅ Funcionalidades Implementadas

### 1. **Descuento Automático de Fondos**

Cuando se crea un gasto:
1. ✅ Usuario selecciona el fondo a afectar
2. ✅ Backend valida que el fondo exista y pertenezca al building
3. ✅ Backend valida que haya saldo suficiente
4. ✅ Se descuenta automáticamente: `UPDATE fondos SET saldo = saldo - monto`
5. ✅ Se registra movimiento en historial
6. ✅ Frontend recarga fondos con nuevos saldos

### 2. **Validaciones de Seguridad**

```javascript
// Validación 1: Fondo existe y pertenece al building
if (!fondo || fondo.building_id !== buildingId) {
  return error('Fondo no encontrado');
}

// Validación 2: Saldo suficiente
if (fondo.saldo < monto) {
  return error(`Saldo insuficiente. Disponible: $${fondo.saldo}`);
}

// ✅ Validaciones pasadas → Proceder
```

### 3. **Registro de Movimientos**

Cada gasto crea un movimiento en `movimientos_fondos`:
```sql
INSERT INTO movimientos_fondos (
  fondo_id, 
  tipo, 
  monto, 
  concepto, 
  fecha, 
  building_id
) VALUES (
  ?, 
  'EGRESO', 
  ?, 
  'Gasto: [concepto]', 
  ?, 
  ?
)
```

**Resultado:** Historial completo de movimientos del fondo

---

## 🔄 Flujo Completo

### Crear Gasto

```
1. Usuario hace click en "Nuevo Gasto"
   └─> Selector de fondos se actualiza dinámicamente
       └─> Muestra: "Fon2 ($10,000)"

2. Usuario llena formulario:
   - Concepto: "Mantenimiento de elevador"
   - Monto: $500
   - Categoría: "MANTENIMIENTO"
   - Proveedor: "Elevadores SA"
   - Fondo: "Fon2 ($10,000)"  ← Selecciona fondo
   - Fecha: 2026-01-17 (actual)

3. Usuario presiona "Guardar"
   └─> POST /api/gastos
       
4. Backend procesa:
   ├─> Valida fondo existe ✅
   ├─> Valida saldo suficiente ($10,000 >= $500) ✅
   ├─> Descuenta: $10,000 - $500 = $9,500
   ├─> UPDATE fondos SET saldo = 9500
   ├─> INSERT INTO movimientos_fondos (EGRESO, $500)
   ├─> INSERT INTO gastos (...)
   └─> ✅ Gasto creado

5. Frontend recibe respuesta
   ├─> Mensaje: "Gasto registrado y descontado del fondo exitosamente"
   ├─> Recarga lista de gastos
   ├─> Recarga fondos con nuevos saldos
   └─> Usuario ve: "Fon2 ($9,500)" ← Actualizado

6. En sección Fondos
   └─> Patrimonio Total: $19,505 ($9,500 + $10,005)
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: gastos

```sql
CREATE TABLE gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  categoria TEXT NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT,
  proveedor TEXT,              -- ← NUEVO
  fondo_id INTEGER,            -- ← NUEVO
  building_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: movimientos_fondos

```sql
CREATE TABLE movimientos_fondos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fondo_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,          -- 'INGRESO' | 'EGRESO'
  monto REAL NOT NULL,
  concepto TEXT,
  fecha DATE NOT NULL,
  building_id INTEGER,
  FOREIGN KEY (fondo_id) REFERENCES fondos(id)
);
```

---

## 🔧 Cambios en Backend

### Endpoint: POST /api/gastos

**Parámetros aceptados:**
```javascript
{
  concepto: string,        // Requerido
  monto: number,          // Requerido
  categoria: string,      // Requerido
  proveedor: string,      // Opcional
  fecha: string,          // Opcional (default: hoy)
  descripcion: string,    // Opcional
  fondoId: number        // Opcional (si se especifica, descuenta del fondo)
}
```

**Lógica actualizada:**
```javascript
if (fondoId) {
  // 1. Obtener fondo
  const fondo = await DB.prepare(
    'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
  ).bind(fondoId, buildingId).first();
  
  // 2. Validar fondo existe
  if (!fondo) return error('Fondo no encontrado');
  
  // 3. Validar saldo suficiente
  if (fondo.saldo < monto) {
    return error(`Saldo insuficiente. Disponible: $${fondo.saldo}`);
  }
  
  // 4. Descontar del fondo
  await DB.prepare('UPDATE fondos SET saldo = saldo - ? WHERE id = ?')
    .bind(monto, fondoId).run();
  
  // 5. Registrar movimiento
  await DB.prepare(
    'INSERT INTO movimientos_fondos (...) VALUES (...)'
  ).bind(fondoId, 'EGRESO', monto, ...).run();
}

// 6. Crear gasto
await DB.prepare('INSERT INTO gastos (...) VALUES (...)').run();
```

**Respuestas:**
```javascript
// Con fondo
{
  success: true,
  id: 123,
  message: "Gasto registrado y descontado del fondo exitosamente"
}

// Sin fondo
{
  success: true,
  id: 123,
  message: "Gasto registrado exitosamente (sin afectar fondos)"
}

// Error: Saldo insuficiente
{
  success: false,
  message: "Saldo insuficiente en Fon2. Disponible: $500"
}
```

---

## 🎨 Cambios en Frontend

### Formulario de Gastos

**Campo de Fondo (Dinámico):**
```html
<select id="gasto-fondo" required>
  <!-- Antes (hardcodeado) -->
  <option value="dineroOperacional">Dinero Operacional</option>
  
  <!-- Después (dinámico) -->
  <option value="10">Fon2 ($10,000)</option>
  <option value="11">Fon3 ($10,005)</option>
</select>
```

**Actualización:**
- Se actualiza al abrir el modal "Nuevo Gasto"
- Muestra nombre y saldo actual del fondo
- Value = ID del fondo en la BD

### Submit del Formulario

**Datos enviados:**
```javascript
{
  concepto: "Mantenimiento de elevador",
  monto: 500,
  categoria: "MANTENIMIENTO",
  proveedor: "Elevadores SA",
  fecha: "2026-01-17",
  fondoId: 10,  // ← ID del fondo seleccionado
  descripcion: "Mantenimiento preventivo"
}
```

### Después del Submit

```javascript
if (response.ok) {
  // 1. Mostrar mensaje
  alert(data.message);
  
  // 2. Cerrar modal
  hideModal('gasto-modal');
  
  // 3. Recargar gastos
  filtrarGastos();
  
  // 4. Recargar fondos (para ver nuevos saldos)
  cargarFondos();
  
  // 5. Actualizar dashboard si está visible
  if (dashboardVisible) {
    cargarDashboard();
  }
}
```

---

## 📊 Ejemplo Real

### Escenario de Prueba

**Estado inicial:**
```
Fondos:
├─ Fon2: $10,000
├─ Fon3: $10,005
└─ Total: $20,005
```

**Acción:** Crear gasto de $500 en Fon2
```
Concepto: Test de descuento automático
Monto: $500
Categoría: MANTENIMIENTO
Fondo: Fon2 ($10,000)
```

**Resultado:**
```
Fondos después:
├─ Fon2: $9,500  ← Descontado $500
├─ Fon3: $10,005
└─ Total: $19,505

Movimientos registrados:
└─ EGRESO: -$500 en Fon2 (2026-01-17)
   Concepto: "Gasto: Test de descuento automático"
```

**✅ Validación:** Diferencia = $500 (correcto)

---

## 🛡️ Validaciones Implementadas

### 1. Fondo Existe
```javascript
const fondo = await DB.prepare(
  'SELECT * FROM fondos WHERE id = ? AND building_id = ?'
).bind(fondoId, buildingId).first();

if (!fondo) {
  return error('Fondo no encontrado o no pertenece a este edificio');
}
```

### 2. Saldo Suficiente
```javascript
if (parseFloat(fondo.saldo) < parseFloat(monto)) {
  return error(
    `Saldo insuficiente en ${fondo.nombre}. ` +
    `Disponible: $${parseFloat(fondo.saldo).toLocaleString('es-MX')}`
  );
}
```

### 3. Multi-tenancy
```javascript
// El fondo debe pertenecer al mismo building del usuario
WHERE id = ? AND building_id = ?
```

**No se puede:**
- Usar fondos de otro edificio
- Crear gastos sin autenticación
- Gastar más del saldo disponible

---

## 🔄 Actualización Automática

### En Sección de Gastos
```javascript
// Después de crear gasto
filtrarGastos();  // Muestra el nuevo gasto
cargarFondos();   // Actualiza saldos de fondos
```

### En Dashboard
```javascript
// Si dashboard está visible, también se actualiza
if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
  cargarDashboard(); // Recalcula patrimonio total
}
```

### Resultado
Usuario ve cambios **inmediatamente**:
- ✅ Gasto aparece en la lista
- ✅ Saldo del fondo se reduce
- ✅ Patrimonio total se recalcula
- ✅ Gráfico se actualiza

---

## 📋 Migración de Base de Datos

### Archivo: `migrations/0005_add_fondo_id_to_gastos.sql`

```sql
-- Agregar columna para relacionar gastos con fondos
ALTER TABLE gastos ADD COLUMN fondo_id INTEGER;

-- Agregar columna de proveedor
ALTER TABLE gastos ADD COLUMN proveedor TEXT;
```

**Ejecutada en:** Producción (BD remota)

---

## 🧪 Testing

### Test Automatizado
**Script de prueba creado y ejecutado:**
```bash
# Test de descuento automático
Login → Ver fondos antes → Crear gasto $500 → Ver fondos después
```

**Resultado:**
```
✅ Login exitoso
💰 Fondos ANTES: Fon2 ($10,000)
💸 Creando gasto: $500
✅ Gasto registrado y descontado
💰 Fondos DESPUÉS: Fon2 ($9,500)
✅ DESCUENTO AUTOMÁTICO FUNCIONANDO
```

### Test Manual
1. Login en https://chispartbuilding.pages.dev
2. Ir a "Gastos"
3. Click "Nuevo Gasto"
4. Llenar formulario:
   - Concepto: "Prueba de descuento"
   - Monto: 100
   - Categoría: MANTENIMIENTO
   - Fondo: Seleccionar un fondo
5. Guardar
6. Verificar:
   - ✅ Gasto aparece en lista
   - ✅ Ir a "Fondos" → Saldo reducido en $100
   - ✅ Dashboard → Patrimonio total reducido

---

## 📊 Historial de Movimientos

### Tabla: movimientos_fondos

Cada gasto que afecta un fondo crea un registro:

```
┌────┬──────────┬────────┬────────┬──────────────────────────┬────────────┐
│ ID │ Fondo ID │ Tipo   │ Monto  │ Concepto                 │ Fecha      │
├────┼──────────┼────────┼────────┼──────────────────────────┼────────────┤
│ 1  │ 10       │ EGRESO │ $500   │ Gasto: Test descuento... │ 2026-01-17 │
└────┴──────────┴────────┴────────┴──────────────────────────┴────────────┘
```

**Tipos de movimientos:**
- `EGRESO` - Salida de dinero (gastos)
- `INGRESO` - Entrada de dinero (transferencias)

---

## 🎨 Selectores Dinámicos de Fondos

### Antes ❌
```html
<select id="gasto-fondo">
  <option value="dineroOperacional">Dinero Operacional</option>
  <option value="ahorroAcumulado">Ahorro Acumulado</option>
  <option value="gastosMayores">Gastos Mayores</option>
</select>
```

**Problemas:**
- Opciones fijas
- No muestra saldo actual
- Value no corresponde a ID real

### Después ✅
```html
<select id="gasto-fondo">
  <option value="10">Fon2 ($10,000)</option>
  <option value="11">Fon3 ($10,005)</option>
</select>
```

**Ventajas:**
- ✅ Opciones dinámicas de la BD
- ✅ Muestra saldo actual
- ✅ Value = ID real del fondo
- ✅ Usuario sabe cuánto hay disponible

---

## 📅 Fechas Dinámicas

### Implementado en Todo el Sistema

#### Header Principal
```javascript
// Antes: "Noviembre 2025" (hardcodeado)
// Después: "Enero 2026" (dinámico)
```

#### Dashboard
```javascript
// Cards:
Cuotas Pendientes - Enero 2026
Gastos del Mes - Enero 2026
Fondos - Actualizado: 17/01/2026
```

#### Selectores de Filtros
```javascript
// Meses: Enero seleccionado por defecto
// Años: 2026 seleccionado por defecto
// Rango: 2025, 2026, 2027, 2028, 2029
```

#### Formularios
```javascript
// Al crear nueva cuota/gasto/cierre
Mes: Enero (actual)
Año: 2026 (actual)
Fecha: 17/01/2026 (hoy)
```

**Función centralizada:**
```javascript
function actualizarFechasDinamicas() {
  const ahora = new Date();
  const mesActual = ahora.toLocaleString('es-MX', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Actualiza:
  // - #current-date
  // - #cuotas-pendientes-mes
  // - #gastos-mes-fecha
  // - #fondos-actualizacion
  // - Selectores de mes y año
  // - Inputs de formularios
}
```

---

## 🚀 Deployment

### Worker
- **URL**: https://edificio-admin.sebastianvernis.workers.dev
- **Version**: `b87f7455-3370-4668-ad05-12eafddc89f4`
- **Cambios**: Descuento automático, validaciones

### Pages
- **URL**: https://chispartbuilding.pages.dev
- **Latest**: https://3577a437.chispartbuilding.pages.dev
- **Cambios**: Selectores dinámicos, fechas dinámicas

### GitHub
- **Commit**: `b7c3386` - Gestión de gastos completa

---

## 📁 Archivos Modificados

### Backend
1. `workers-build/index.js`
   - POST /api/gastos con descuento automático
   - Validaciones de fondo y saldo
   - Registro de movimientos

### Frontend
2. `public/js/components/admin-buttons.js`
   - Variable global `fondosGlobales`
   - Función `cargarFondosGlobales()`
   - Función `actualizarSelectoresFondos()`
   - Función `actualizarFechasDinamicas()`
   - Función `renderFondosChartDynamic()`
   - Submit de gastos actualizado
   - Dashboard con fechas dinámicas
   - Recarga de fondos después de crear gasto

3. `public/admin.html`
   - Fechas en "Cargando..." por defecto
   - IDs agregados para actualización dinámica

### Migraciones
4. `migrations/0005_add_fondo_id_to_gastos.sql`
   - Columna `fondo_id` agregada
   - Columna `proveedor` agregada

---

## 🎯 Casos de Uso

### Caso 1: Gasto con Descuento
```
Usuario: "Necesito pagar $500 de mantenimiento"
Sistema: "Selecciona de qué fondo descontar"
Usuario: Selecciona "Fondo de Mantenimiento ($25,000)"
Sistema: 
  ✅ Valida saldo suficiente
  ✅ Descuenta $500
  ✅ Nuevo saldo: $24,500
  ✅ Registra movimiento
  ✅ Actualiza UI
```

### Caso 2: Saldo Insuficiente
```
Usuario: "Necesito pagar $15,000"
Usuario: Selecciona "Fon3 ($10,005)"
Sistema:
  ❌ Error: "Saldo insuficiente en Fon3. Disponible: $10,005"
  → No se crea el gasto
  → Fondos no se modifican
```

### Caso 3: Gasto sin Afectar Fondos
```
Usuario: No selecciona fondo (o fondo vacío)
Sistema:
  ✅ Crea el gasto de todas formas
  ✅ No descuenta de ningún fondo
  ✅ Mensaje: "Gasto registrado (sin afectar fondos)"
```

---

## 📊 Impacto en Patrimonio

### Automático y en Tiempo Real

```
Fondos antes:
├─ Fon2: $10,000
├─ Fon3: $10,005
└─ Total: $20,005

Crear gasto: $500 en Fon2

Fondos después:
├─ Fon2: $9,500   ← -$500
├─ Fon3: $10,005
└─ Total: $19,505  ← -$500 automático

Dashboard:
Patrimonio Total: $19,505  ← Se recalcula automáticamente
```

**No requiere:**
- Cierres mensuales para actualizar
- Recálculo manual
- Intervención del admin

**Es automático:**
- Al crear gasto → Descuenta
- Al recargar página → Saldos actuales
- En tiempo real

---

## ✨ Beneficios

### Para el Usuario
✅ Ve saldos reales al seleccionar fondo  
✅ No puede gastar más del disponible  
✅ Saldos se actualizan inmediatamente  
✅ Historial completo de movimientos  
✅ Patrimonio total siempre correcto  

### Para el Sistema
✅ Integridad de datos garantizada  
✅ Multi-tenant (cada building independiente)  
✅ Validaciones robustas  
✅ Trazabilidad completa  
✅ Sin descuadres contables  

### Para el Desarrollo
✅ Lógica centralizada  
✅ Código reutilizable  
✅ Fácil de mantener  
✅ Escalable a cualquier cantidad de fondos  

---

## 📝 Próximos Pasos Opcionales

### 1. Reversar Gastos
```javascript
// Endpoint para eliminar gasto y revertir descuento
DELETE /api/gastos/:id
  → Devolver monto al fondo
  → Eliminar movimiento
```

### 2. Editar Gastos
```javascript
// Si se cambia el monto o el fondo
PUT /api/gastos/:id
  → Revertir descuento del fondo anterior
  → Aplicar descuento al nuevo fondo
```

### 3. Reportes
```javascript
// Gastos por fondo
GET /api/reportes/gastos-por-fondo?mes=1&anio=2026
  → Desglose de gastos de cada fondo
```

### 4. Alertas de Saldo Bajo
```javascript
// Cuando un fondo < 10% del patrimonio total
→ Mostrar alerta en UI
→ Enviar email al admin
```

---

## ✅ Checklist de Validación

### Backend
- [x] Columna `fondo_id` agregada a tabla gastos
- [x] Columna `proveedor` agregada a tabla gastos
- [x] Validación de fondo existe
- [x] Validación de saldo suficiente
- [x] Descuento automático: UPDATE fondos
- [x] Registro de movimiento: INSERT movimientos_fondos
- [x] Mensajes de error claros

### Frontend
- [x] Selectores de fondos dinámicos
- [x] Muestran nombre y saldo actual
- [x] Se actualizan al abrir modals
- [x] Formulario envía fondoId correcto
- [x] Recarga fondos después de crear gasto
- [x] Recarga dashboard si está visible
- [x] Fechas dinámicas en todo el sistema

### Testing
- [x] Test automatizado ejecutado
- [x] Descuento de $500 validado
- [x] Saldos actualizados correctamente
- [x] Patrimonio total recalculado

---

## 🎉 Conclusión

**Sistema de gastos completamente funcional:**

✅ Descuento automático de fondos  
✅ Validaciones de saldo  
✅ Selectores dinámicos  
✅ Fechas dinámicas  
✅ Actualización en tiempo real  
✅ Historial de movimientos  
✅ Multi-tenant seguro  

**Estado:** ✅ COMPLETADO, TESTEADO Y DESPLEGADO

**Próximo:** Sistema listo para uso en producción
