# 🧪 Guía de Testing End-to-End - Edificio Admin SaaS

**Fecha:** 14 de Diciembre, 2025  
**URL:** https://edificio-admin-saas-adapted.sebastianvernis.workers.dev  
**Modo:** Testing sin OTP (validación deshabilitada)  
**Objetivo:** Capturar 72 screenshots faltantes con flujo completo

---

## ⚡ MODO TESTING ACTIVADO

### Variable Configurada
```bash
SKIP_OTP_VALIDATION=true  # En desarrollo automático
ENVIRONMENT=development    # Activa skip automáticamente
```

**Ventaja:** Puedes completar todo el flujo SIN verificar OTP

---

## 🚀 Flujo Completo Simplificado

### ✅ **PASO 1: Registro (5 min)**

**URL:** https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/registro.html

**Datos:**
```
Nombre: María González
Email: maria.test@mailinator.com
Teléfono: 5512345678
Edificio: Torre del Valle
Plan: Profesional (click en la card)
```

**Screenshots:**
- Ya capturados: 05-09 ✅

**Resultado esperado:**
- ✅ Redirección a `/verificar-otp.html`

---

### ⚡ **PASO 2: Saltar OTP (DIRECTO)**

**Opción A: Ir directo a Checkout**
```
Abrir: https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/checkout.html
```

**Opción B: Simular OTP verificado**
```javascript
// En Console de /verificar-otp.html
localStorage.setItem('otp_verified', 'true');
window.location.href = '/checkout.html';
```

**⚠️ NO se requiere código OTP real** - El backend permite continuar sin validación

**Screenshots a capturar:**
- [ ] `14-otp-skip-testing-mode.png` (página OTP con nota de skip)
- [ ] `15-otp-redirect-checkout.png` (redirección directa)

---

### ✅ **PASO 3: Checkout (10 min)**

**URL:** Automático desde paso 2

**Datos de Tarjeta:**
```
Nombre: MARIA GONZALEZ
Número: 4242 4242 4242 4242
Expiry: 12/28
CVV: 123
CP: 12345
```

**Screenshots a capturar:**
- [x] `16-checkout-plan-summary.png` ✅ Ya capturado
- [x] `17-checkout-iva-calculation.png` ✅ Ya capturado
- [ ] `18-checkout-form-filled.png` - Form completo (después de Bug #1 fix)
- [ ] `19-checkout-card-formatted.png` - Auto-formato visible
- [ ] `20-checkout-processing.png` - Botón "Procesando pago..."
- [ ] `21-checkout-console-success.png` - F12 → Console sin errores
- [ ] `22-checkout-redirect-setup.png` - Redirección a setup

**Validaciones:**
- ✅ Plan: Profesional - $999/mes
- ✅ IVA: $159.84 (16%)
- ✅ Total: $1,158.84

---

### ✅ **PASO 4: Setup Edificio (30 min) - 14 SCREENSHOTS**

**URL:** Automático desde checkout

**Formulario Completo:**

#### **Sección 1: Información del Edificio**
```
Nombre: Torre del Valle
Dirección: Av. Insurgentes Sur 1234, Col. Del Valle, Ciudad de México, CP 03100
Total Unidades: 50
Tipo: Edificio
```
- [x] `23-setup-step-1-building.png` ✅ Ya capturado

---

#### **Sección 2: Administrador**
```
Nombre: María González
Teléfono: 5512345678
Password: Admin123!
Confirmar: Admin123!
```
- [ ] `24-setup-step-2-admin.png` - Con passwords llenos (después de Bug #2 fix)

---

#### **Sección 3: Reglamento**
Click botón **"Usar plantilla básica"**
- [ ] `25-setup-step-3-reglamento.png` - Textarea lleno con plantilla

---

#### **Sección 4: Políticas de Privacidad**
Click botón **"Usar plantilla de políticas de pago"**
- [ ] `26-setup-step-4-politicas.png` - Textarea lleno con plantilla

---

#### **Sección 5: Fondos Iniciales (3 fondos)**

**Fondo 1:**
```
Nombre: Fondo de Reserva
Saldo: 50000
Descripción: Fondo de reserva para emergencias
```
- [ ] `27-setup-fondo-1.png`

Click **"Agregar fondo"**

**Fondo 2:**
```
Nombre: Fondo de Mantenimiento
Saldo: 25000
Descripción: Mantenimiento preventivo
```
- [ ] `28-setup-fondo-2.png`

Click **"Agregar fondo"**

**Fondo 3:**
```
Nombre: Fondo de Emergencias
Saldo: 15000
Descripción: Emergencias del edificio
```
- [ ] `29-setup-fondo-3.png`

**Vista con 3 fondos:**
- [ ] `30-setup-all-fondos.png` - Los 3 fondos visibles en lista

---

#### **Sección 6: Configuración de Cuotas**
```
Cuota mensual ordinaria: 1500
Cuota extraordinaria: 500
Día de corte: 5
Días de gracia: 5
Recargo por mora: 2.5
```
- [ ] `31-setup-cuotas-config.png` - Todos los campos llenos

**Políticas de vencimiento:**
Click **"Usar plantilla de políticas de pago"**
- [ ] `32-setup-progress-bar.png` - Barra de progreso visible (paso 5/6)

---

#### **Finalizar Setup**
- [ ] `33-setup-form-complete.png` - Todo el formulario completo antes de submit
- F12 → Console
- Click **"Completar configuración"**
- Esperar procesamiento (~3-5 segundos)
- [ ] `34-setup-console-token.png` - Console mostrando token JWT generado
- [ ] `35-setup-success-message.png` - Mensaje "¡Configuración completada!"
- Esperar redirección automática
- [ ] `36-setup-redirect-admin.png` - Redirigiendo a /admin
- F12 → Application → Local Storage
- [ ] `37-setup-localstorage.png` - Token guardado en localStorage

---

### ✅ **PASO 5: Login (5 min)**

**URL:** https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/login.html

**Credenciales:**
```
Email: maria.test@mailinator.com
Password: Admin123!
```

**Screenshots:**
- [x] `44-login-page.png` ✅
- [x] `45-login-console-token.png` ✅
- [x] `46-login-redirect-admin.png` ✅

---

### ✅ **PASO 6: Dashboard (5 min)**

**URL:** Automático después de login → `/admin`

**Screenshots:**
- [x] `47-dashboard-full.png` ✅
- [x] `48-dashboard-sidebar.png` ✅
- [x] `49-dashboard-header.png` ✅
- [x] `50-dashboard-patrimonio.png` ✅ (Debería mostrar $90,000)
- [x] `51-dashboard-fondos-chart.png` ✅
- [x] `52-dashboard-console-clean.png` ✅

---

### 🆕 **PASO 7: Usuarios CRUD (10 min) - 7 SCREENSHOTS**

**Click en Sidebar:** Usuarios

- [x] `53-usuarios-empty.png` ✅ (Solo admin creado)

**Crear Usuario:**
Click **"Nuevo Usuario"**
- [ ] `54-usuarios-create-modal.png` - Modal vacío

**Llenar:**
```
Nombre: Carlos Ramírez
Email: carlos.ramirez@edificio.com
Password: Inquilino123
Departamento: 301
Rol: INQUILINO
Teléfono: 5587654321
```
- [ ] `55-usuarios-form-filled.png` - Formulario completo

Click **"Guardar"**
- [ ] `56-usuarios-created-list.png` - Carlos aparece en lista

**Editar Usuario:**
Click **"Editar"** en Carlos
- [ ] `57-usuarios-edit-modal.png` - Modal de edición

Cambiar teléfono a: 5587654322  
Click **"Guardar"**
- [ ] `58-usuarios-updated.png` - Teléfono actualizado en lista

**Eliminar (solo screenshot, cancelar):**
Click **"Eliminar"** en Carlos
- [ ] `59-usuarios-delete-confirm.png` - Modal de confirmación

Click **"Cancelar"**

**Console:**
F12 → Console
- [ ] `60-usuarios-console.png` - Verificar sin errores

---

### 🆕 **PASO 8: Cuotas (15 min) - 10 SCREENSHOTS**

**Click en Sidebar:** Cuotas

- [ ] `61-cuotas-empty.png` - Lista vacía

**Generar Cuotas Masivamente:**
Click **"Nueva Cuota"** o **"Generar Cuotas"**
- [ ] `62-cuotas-generate-modal.png` - Modal de generación

**Configurar:**
```
Mes: Diciembre
Año: 2025
Monto: 1500
Departamento: TODOS
Fecha de Vencimiento: 2025-12-05
```
- [ ] `63-cuotas-form-todos.png` - Opción "TODOS" seleccionada

Click **"Generar"**  
Esperar generación (~2-3 segundos)
- [ ] `64-cuotas-generated-50.png` ⭐ - 50 cuotas generadas (1 por unidad)

**Usar Filtros:**
Filtrar por mes: Diciembre
- [ ] `65-cuotas-filters.png` - Filtros aplicados

**Ver Detalle:**
Click en una cuota
- [ ] `66-cuotas-detail-modal.png` - Modal con info completa

**Pagar Cuota:**
Click **"Pagar"** en una cuota
- [ ] `67-cuotas-pay-modal.png` - Modal de pago

**Llenar:**
```
Método de pago: TRANSFERENCIA
Referencia: TEST-REF-001
```

Click **"Confirmar Pago"**
- [ ] `68-cuotas-paid-status.png` - Cuota marcada como PAGADA (verde)

**Console:**
F12 → Console
- [ ] `69-cuotas-console.png` - Sin errores

**Validar en Terminal (opcional):**
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT COUNT(*) as total FROM cuotas"
# Resultado esperado: 50
```
- [ ] `70-cuotas-db-validation.txt` - Screenshot del terminal

---

### 🆕 **PASO 9: Gastos (10 min) - 6 SCREENSHOTS**

**Click en Sidebar:** Gastos

**Crear Gasto 1:**
Click **"Nuevo Gasto"**
- [ ] `71-gastos-create-modal.png` - Modal vacío

**Llenar:**
```
Descripción: Mantenimiento de elevadores
Monto: 5000
Categoría: MANTENIMIENTO
Fecha: 2025-12-01
Proveedor: Elevadores S.A.
```

Click **"Guardar"**

**Repetir para Gasto 2 y 3:**
```
Gasto 2:
- Servicio de limpieza mensual
- $8,000
- SERVICIOS
- 2025-12-05

Gasto 3:
- Pago de agua
- $3,500
- SERVICIOS
- 2025-12-10
```

**Lista con 3 gastos:**
- [ ] `72-gastos-list-3.png` - 3 gastos visibles

**Verificar Total:**
Debe mostrar: Total: $16,500
- [ ] `73-gastos-total-calculation.png` ⭐

**Filtros:**
Filtrar por categoría: SERVICIOS
- [ ] `74-gastos-filters.png`

**Editar:**
Click **"Editar"** en primer gasto
- [ ] `75-gastos-edit.png` - Modal de edición

**Console:**
- [ ] `76-gastos-console.png`

---

### 🆕 **PASO 10: Fondos (10 min) - 5 SCREENSHOTS**

**Click en Sidebar:** Fondos

**Verificar 3 fondos:**
- Fondo de Reserva: $50,000
- Fondo de Mantenimiento: $25,000
- Fondo de Emergencias: $15,000
- **Patrimonio Total: $90,000** ⭐

- [ ] `77-fondos-list-3.png` ⭐

**Transferir entre Fondos:**
Click **"Transferir"** o **"Nueva Transferencia"**
- [ ] `78-fondos-transfer-modal.png`

**Configurar:**
```
Fondo Origen: Fondo de Reserva
Fondo Destino: Fondo de Mantenimiento
Monto: 10000
Concepto: Ajuste de fondos - Testing
```

Click **"Transferir"**

**Verificar saldos actualizados:**
- Reserva: $40,000 (50k - 10k)
- Mantenimiento: $35,000 (25k + 10k)
- Emergencias: $15,000 (sin cambios)
- **Patrimonio Total: $90,000** (sin cambios) ⭐

- [ ] `79-fondos-after-transfer.png`
- [ ] `80-fondos-patrimonio-unchanged.png` ⭐

**Console:**
- [ ] `81-fondos-console.png`

---

### 🆕 **PASO 11: Anuncios (10 min) - 5 SCREENSHOTS**

**Click en Sidebar:** Anuncios

**Crear Anuncio 1:**
Click **"Nuevo Anuncio"**
- [ ] `82-anuncios-create-modal.png`

**Llenar:**
```
Título: Corte de agua programado
Contenido: El próximo lunes 16 de diciembre habrá corte de agua de 9am a 2pm por mantenimiento.
Tipo: AVISO
Prioridad: ALTA
```

Click **"Guardar"**

**Crear Anuncio 2:**
```
Título: Reunión de condóminos
Contenido: Se convoca a asamblea general el día 20 de diciembre a las 18:00 hrs en el salón de eventos.
Tipo: ASAMBLEA
Prioridad: NORMAL
```

**Lista con 2 anuncios:**
- [ ] `83-anuncios-list-2.png`

**Verificar colores:**
- ALTA = Rojo
- NORMAL = Azul/Gris
- [ ] `84-anuncios-priority-colors.png`

**Editar:**
Click **"Editar"** en primer anuncio
- [ ] `85-anuncios-edit.png`

**Eliminar:**
Click **"Eliminar"** en segundo anuncio
- [ ] `86-anuncios-delete.png` - Confirmación

Click **"Eliminar"** para confirmar

---

### 🆕 **PASO 12: Cierres (10 min) - 4 SCREENSHOTS**

**Click en Sidebar:** Cierres

**Generar Cierre:**
Click **"Generar Cierre"** o **"Nuevo Cierre"**
- [ ] `87-cierres-create-modal.png`

**Configurar:**
```
Mes: Diciembre
Año: 2025
Tipo: MENSUAL
```

Click **"Generar Cierre"**

**Verificar cálculos:**
- Ingresos: (cuotas pagadas × $1,500)
- Egresos: $16,500 (gastos totales)
- Saldo: Ingresos - Egresos

- [ ] `88-cierres-generated.png` - Cierre creado
- [ ] `89-cierres-calculations.png` ⭐ - Ingresos, Egresos, Saldo visibles

**Console:**
- [ ] `90-cierres-console.png`

---

### 🆕 **PASO 13: Validación Final (15 min) - 9 SCREENSHOTS**

#### **Opción A: Con Wrangler (Recomendado)**

```bash
cd saas-migration/edificio-admin-saas-adapted

# Query completa
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT 
  (SELECT COUNT(*) FROM usuarios) as total_usuarios,
  (SELECT COUNT(*) FROM usuarios WHERE rol='ADMIN') as admins,
  (SELECT COUNT(*) FROM usuarios WHERE rol='INQUILINO') as inquilinos,
  (SELECT COUNT(*) FROM buildings) as buildings,
  (SELECT COUNT(*) FROM cuotas) as total_cuotas,
  (SELECT COUNT(*) FROM cuotas WHERE estado='PAGADA') as cuotas_pagadas,
  (SELECT SUM(monto) FROM cuotas) as total_cuotas_monto,
  (SELECT COUNT(*) FROM gastos) as total_gastos,
  (SELECT SUM(monto) FROM gastos) as total_gastos_monto,
  (SELECT COUNT(*) FROM fondos) as total_fondos,
  (SELECT SUM(saldo) FROM fondos) as patrimonio_total,
  (SELECT COUNT(*) FROM anuncios) as total_anuncios,
  (SELECT COUNT(*) FROM cierres) as total_cierres
" > screenshots-manual/91-final-db-stats.txt
```

**Queries individuales:**
```bash
# Usuarios por rol
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total, rol FROM usuarios GROUP BY rol
" > screenshots-manual/92-final-usuarios-count.txt

# Total cuotas
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM cuotas
" > screenshots-manual/93-final-cuotas-count.txt

# Patrimonio total
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT SUM(saldo) as patrimonio_total FROM fondos
" > screenshots-manual/94-final-patrimonio.txt

# Total gastos
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT SUM(monto) as total_gastos FROM gastos
" > screenshots-manual/95-final-gastos-sum.txt

# Total fondos
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM fondos
" > screenshots-manual/96-final-fondos-3.txt

# Total buildings
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM buildings
" > screenshots-manual/97-final-buildings-1.txt
```

**Screenshots:**
- [ ] `91-final-db-stats.txt` (captura de terminal)
- [ ] `92-final-usuarios-count.txt`
- [ ] `93-final-cuotas-count.txt`
- [ ] `94-final-patrimonio.txt` ⭐ ($90,000)
- [ ] `95-final-gastos-sum.txt` ($16,500)
- [ ] `96-final-fondos-3.txt` (3)
- [ ] `97-final-buildings-1.txt` (1)

---

#### **Opción B: Sin Wrangler (Screenshots de UI)**

En el Dashboard:
- [ ] `98-final-console-clean.png` - F12 → Console sin errores críticos
- [ ] `99-final-network-tab.png` - F12 → Network con requests exitosos (200)

---

## ✅ Validaciones Esperadas

### Base de Datos
- **Usuarios:** 2 (1 ADMIN + 1 INQUILINO)
- **Buildings:** 1 (Torre del Valle)
- **Cuotas:** 50 (1 por unidad)
- **Cuotas Pagadas:** 1+
- **Gastos:** 3 ($16,500 total)
- **Fondos:** 3
- **Patrimonio Total:** $90,000 ⭐
- **Anuncios:** 1 (uno eliminado)
- **Cierres:** 1

### Frontend
- ✅ Sin errores 500 en console
- ✅ Sin errores de CORS
- ✅ Todos los módulos accesibles
- ✅ Cálculos correctos (IVA, totales, patrimonio)

---

## 🎯 Checklist Final

### Screenshots Capturados
- [x] Landing (4/4) 100% ✅
- [x] Registro (5/5) 100% ✅
- [ ] OTP Skip (2/6) ⭐ Modo testing
- [ ] Checkout (5/7) 71% → **Completar 5**
- [ ] Setup (1/15) 7% → **Completar 14**
- [x] Login (3/3) 100% ✅
- [x] Dashboard (6/6) 100% ✅
- [ ] Usuarios (1/8) 13% → **Completar 7**
- [ ] Cuotas (0/10) 0% → **Completar 10**
- [ ] Gastos (0/6) 0% → **Completar 6**
- [ ] Fondos (0/5) 0% → **Completar 5**
- [ ] Anuncios (0/5) 0% → **Completar 5**
- [ ] Cierres (0/4) 0% → **Completar 4**
- [ ] Validación Final (0/9) 0% → **Completar 9**

**Total Actual:** 27/99 (27%)  
**Por Capturar:** 72 screenshots  
**Con modo skip OTP:** Flujo completo posible

---

## 🚀 Comandos Útiles

### Ver Logs en Tiempo Real
```bash
cd saas-migration/edificio-admin-saas-adapted
npx wrangler tail
```

### Limpiar DB Antes de Testing
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="
DELETE FROM usuarios;
DELETE FROM cuotas;
DELETE FROM gastos;
DELETE FROM fondos;
DELETE FROM buildings;
DELETE FROM pending_users;
"
```

### Verificar Estado
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT 
  (SELECT COUNT(*) FROM usuarios) as usuarios,
  (SELECT COUNT(*) FROM buildings) as buildings,
  (SELECT COUNT(*) FROM cuotas) as cuotas
"
```

---

## 📁 Guardar Screenshots

**Carpeta recomendada:**
```bash
mkdir -p screenshots-manual/{checkout,setup,admin-crud,validacion}
```

**Nomenclatura:**
- Usar números del checklist: `18-checkout-form-filled.png`
- Guardar en carpetas por fase
- Formato PNG, resolución 1920x1080

---

**Preparado:** 2025-12-14  
**Modo:** Skip OTP habilitado  
**Bugs corregidos:** 4/4 ✅  
**Listo para testing completo** 🚀
