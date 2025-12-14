# 🚀 Flujo de Trabajo Recomendado - 14 Diciembre 2025

**Proyecto:** Edificio Admin SaaS  
**Objetivo:** Corregir bugs críticos + Completar testing visual  
**Tiempo Estimado:** 4-6 horas  
**Prioridad:** Alta

---

## 📋 Plan del Día

### ⏰ BLOQUE 1: Corrección de Bugs Críticos (2-3 horas)

#### 🔴 TAREA 1.1: Bug #1 - Timeout Campo Expiry en Checkout (45 min)
**Prioridad:** P0 - Blocker  
**Archivo:** `saas-migration/edificio-admin-saas-adapted/public/checkout.html`

**Problema:**
```
page.fill: Timeout 30000ms exceeded.
waiting for locator('input[name="expiry"], #expiry')
```

**Pasos:**
1. Revisar HTML de checkout.html
2. Verificar selector del campo expiry
3. Confirmar visibilidad y accesibilidad del campo
4. Probar selector con DevTools
5. Corregir naming o estructura
6. Validar con Playwright test local

**Checklist:**
- [ ] Identificar campo expiry en HTML
- [ ] Verificar atributo `name="expiry"` o `id="expiry"`
- [ ] Confirmar que no está oculto (display:none)
- [ ] Verificar z-index y overlays
- [ ] Actualizar selector si es necesario
- [ ] Probar manualmente en browser
- [ ] Ejecutar test automatizado
- [ ] Commit fix

---

#### 🔴 TAREA 1.2: Bug #2 - Timeout Campo Password en Setup (45 min)
**Prioridad:** P0 - Blocker  
**Archivo:** `saas-migration/edificio-admin-saas-adapted/public/setup-edificio.html`

**Problema:**
```
page.fill: Timeout 30000ms exceeded.
waiting for locator('input[name="password"], #password')
```

**Pasos:**
1. Revisar HTML de setup-edificio.html
2. Identificar estructura de pasos/wizard
3. Verificar campo password en paso 2
4. Confirmar navegación entre pasos
5. Validar selectores
6. Corregir código

**Checklist:**
- [ ] Revisar estructura de stepper/wizard
- [ ] Verificar botón "Siguiente" funciona
- [ ] Confirmar que paso 2 se muestra correctamente
- [ ] Identificar campo password correcto
- [ ] Verificar selector `input[name="password"]`
- [ ] Probar navegación manual
- [ ] Actualizar test automatizado
- [ ] Commit fix

---

#### 🟡 TAREA 1.3: Bug #3 - Error 500 en Registro (30 min)
**Prioridad:** P1 - High  
**Archivo:** Backend - `src/handlers/onboarding.js` (línea ~24)

**Problema:**
```
Failed to load resource: the server responded with a status of 500 ()
Console en: 08-registro-console-success.png
```

**Pasos:**
1. Revisar logs del Worker en Cloudflare
2. Identificar endpoint que falla
3. Revisar handler de `/api/onboarding/register`
4. Verificar validaciones y try-catch
5. Agregar logging detallado
6. Corregir error
7. Deploy y validar

**Checklist:**
- [ ] `npx wrangler tail` para ver logs en vivo
- [ ] Revisar `src/handlers/onboarding.js`
- [ ] Verificar validaciones de datos
- [ ] Confirmar que response tiene `{ok: boolean}`
- [ ] Agregar logs con `console.error()`
- [ ] Deploy a Workers
- [ ] Probar endpoint con curl
- [ ] Commit fix

---

#### 🟡 TAREA 1.4: Bug #4 - Error Selección Plan Puppeteer (30 min)
**Prioridad:** P2 - Medium  
**Archivo:** `saas-migration/edificio-admin-saas-adapted/public/registro.html`

**Problema:**
```
Node is either not clickable or not an Element
Selector: input[value="profesional"]
```

**Pasos:**
1. Revisar HTML de planes en registro.html
2. Verificar estructura de radio buttons
3. Confirmar que inputs no están ocultos
4. Ajustar CSS si es necesario
5. Actualizar test de Puppeteer

**Checklist:**
- [ ] Revisar estructura HTML de planes
- [ ] Verificar que `input[type="radio"]` sea clickeable
- [ ] Confirmar CSS no oculta inputs
- [ ] Probar click en label vs input
- [ ] Actualizar script de testing
- [ ] Validar manualmente
- [ ] Commit fix

---

### ⏰ BLOQUE 2: Configuración Wrangler (30 min)

#### 🟡 TAREA 2.1: Autenticación Cloudflare
**Prioridad:** P1 - Necesario para testing

**Pasos:**
```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted

# 1. Login
npx wrangler login

# 2. Verificar
npx wrangler whoami

# 3. Test conexión DB
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT 1"

# 4. Verificar acceso
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT COUNT(*) as total FROM usuarios"
```

**Checklist:**
- [ ] Ejecutar `wrangler login`
- [ ] Verificar cuenta correcta con `whoami`
- [ ] Probar acceso a D1
- [ ] Confirmar database `edificio_admin_db` existe
- [ ] Guardar credenciales en variable de entorno (opcional)

---

### ⏰ BLOQUE 3: Testing Manual Completo (2-3 horas)

#### 🟢 TAREA 3.1: Limpieza de DB (5 min)
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="
DELETE FROM usuarios;
DELETE FROM cuotas;
DELETE FROM gastos;
DELETE FROM fondos;
DELETE FROM fondos_movimientos;
DELETE FROM presupuestos;
DELETE FROM cierres;
DELETE FROM anuncios;
DELETE FROM solicitudes;
DELETE FROM parcialidades;
DELETE FROM permisos;
DELETE FROM audit_logs;
DELETE FROM pending_users;
DELETE FROM otp_codes;
DELETE FROM mockup_payments;
DELETE FROM email_logs;
DELETE FROM buildings;
"

# Verificar limpieza
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT 
  (SELECT COUNT(*) FROM usuarios) as usuarios,
  (SELECT COUNT(*) FROM buildings) as buildings,
  (SELECT COUNT(*) FROM pending_users) as pending_users
"

# Capturar resultado
# Screenshot: 00-db-clean-state.txt
```

**Checklist:**
- [ ] Ejecutar DELETE statements
- [ ] Verificar todos en 0
- [ ] Capturar screenshot de terminal
- [ ] Guardar como `00-db-clean-state.txt`

---

#### 🟢 TAREA 3.2: Flujo de Onboarding Completo (45 min)

**Paso 1: Registro (5 min)**
1. Abrir: https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/registro.html
2. Llenar datos:
   - Nombre: María González
   - Email: maria.gonzalez.test@mailinator.com
   - Teléfono: 5512345678
   - Edificio: Torre del Valle
   - Plan: Profesional
3. Click "Continuar"
4. ✅ **Ya capturado** (5-9)

**Paso 2: OTP (10 min)**
1. En terminal:
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT email, code, created_at, expires_at 
FROM otp_codes 
WHERE email='maria.gonzalez.test@mailinator.com'
ORDER BY created_at DESC LIMIT 1
"
```
2. Copiar código de 6 dígitos
3. Ingresar en UI
4. Click "Verificar"
5. 📸 Capturar:
   - [ ] `14-otp-console-success.png`
   - [ ] `15-otp-redirect-checkout.png`

**Paso 3: Checkout (15 min)**
1. Llenar tarjeta:
   - Número: 4242 4242 4242 4242
   - Expiry: 12/28
   - CVV: 123
   - Nombre: MARIA GONZALEZ
   - CP: 12345
2. Click "Procesar Pago"
3. 📸 Capturar (después de fix Bug #1):
   - [ ] `18-checkout-form-filled.png`
   - [ ] `19-checkout-card-formatted.png`
   - [ ] `20-checkout-processing.png`
   - [ ] `21-checkout-console-success.png`
   - [ ] `22-checkout-redirect-setup.png`

**Paso 4: Setup Edificio (15 min)**
1. **Paso 1 - Building:**
   - Nombre: Torre del Valle
   - Dirección: Av. Insurgentes Sur 1234, Col. Del Valle, CDMX, 03100
   - Unidades: 50
   - Tipo: Edificio
   - ✅ **Ya capturado** (23)

2. **Paso 2 - Admin (después de fix Bug #2):**
   - Nombre: María González
   - Teléfono: 5512345678
   - Password: Admin123!
   - Confirmar: Admin123!
   - 📸 `24-setup-step-2-admin.png`

3. **Paso 3 - Reglamento:**
   - Click "Usar plantilla básica"
   - 📸 `25-setup-step-3-reglamento.png`

4. **Paso 4 - Políticas:**
   - Click "Usar plantilla de políticas de pago"
   - 📸 `26-setup-step-3-politicas.png`

5. **Paso 5 - Fondos:**
   - Fondo 1: Fondo de Reserva - $50,000
   - 📸 `27-setup-fondo-1.png`
   - Click "Agregar fondo"
   - Fondo 2: Fondo de Mantenimiento - $25,000
   - 📸 `28-setup-fondo-2.png`
   - Click "Agregar fondo"
   - Fondo 3: Fondo de Emergencias - $15,000
   - 📸 `29-setup-fondo-3.png`
   - 📸 `30-setup-all-fondos.png` (los 3 visibles)

6. **Paso 6 - Cuotas:**
   - Cuota mensual: 1500
   - Cuota extraordinaria: 500
   - Día de corte: 5
   - Días de gracia: 5
   - Recargo: 2.5%
   - 📸 `31-setup-cuotas-config.png`
   - 📸 `32-setup-progress-bar.png`

7. **Finalizar:**
   - 📸 `33-setup-form-complete.png`
   - Click "Completar configuración"
   - 📸 `34-setup-console-token.png` (F12 - ver token JWT)
   - 📸 `35-setup-success-message.png`
   - 📸 `36-setup-redirect-admin.png`
   - F12 → Application → Local Storage
   - 📸 `37-setup-localstorage.txt`

**Checklist Paso 4:**
- [ ] 14 screenshots capturados
- [ ] Token JWT visible en console
- [ ] Token guardado en localStorage
- [ ] Redirección a /admin exitosa

---

#### 🟢 TAREA 3.3: Validación DB Post-Onboarding (10 min)

**Queries y Screenshots:**

```bash
# Building creado
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT * FROM buildings ORDER BY created_at DESC LIMIT 1
" > screenshots-manual/38-db-buildings.txt

# Usuario admin
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT id, nombre, email, rol, departamento, activo 
FROM usuarios 
WHERE rol='ADMIN' 
ORDER BY fechaCreacion DESC LIMIT 1
" > screenshots-manual/39-db-admin-user.txt

# Fondos
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT id, nombre, saldo, building_id 
FROM fondos 
ORDER BY created_at DESC
" > screenshots-manual/40-db-fondos.txt

# Pending user
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT email, otp_verified, checkout_completed, setup_completed 
FROM pending_users 
ORDER BY created_at DESC LIMIT 1
" > screenshots-manual/41-db-pending-user.txt

# Estadísticas
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT 
  (SELECT COUNT(*) FROM usuarios) as usuarios,
  (SELECT COUNT(*) FROM buildings) as buildings,
  (SELECT COUNT(*) FROM fondos) as fondos,
  (SELECT SUM(saldo) FROM fondos) as patrimonio_total
" > screenshots-manual/42-db-stats.txt

# Patrimonio total
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT SUM(saldo) as patrimonio_total FROM fondos
" > screenshots-manual/43-db-patrimonio.txt
```

**Checklist:**
- [ ] Building creado: "Torre del Valle", 50 unidades
- [ ] Usuario admin: maria.gonzalez.test@mailinator.com
- [ ] 3 fondos creados
- [ ] Patrimonio total: $90,000 ⭐
- [ ] Pending user: otp_verified=1, checkout_completed=1, setup_completed=1
- [ ] 6 archivos .txt guardados

---

#### 🟢 TAREA 3.4: Admin Panel - CRUD Completo (60 min)

**3.4.1 Login (5 min)**
1. Abrir: /login.html
2. Email: maria.gonzalez.test@mailinator.com
3. Password: Admin123!
4. Click "Ingresar"
5. ✅ **Ya capturado** (44-46)

---

**3.4.2 Usuarios CRUD (10 min)**
1. Click "Usuarios" en sidebar
2. Click "Nuevo Usuario"
3. 📸 `54-usuarios-create-modal.png`
4. Llenar:
   - Nombre: Carlos Ramírez
   - Email: carlos.ramirez@edificio.com
   - Password: Inquilino123
   - Departamento: 301
   - Rol: INQUILINO
   - Teléfono: 5587654321
5. 📸 `55-usuarios-form-filled.png`
6. Click "Guardar"
7. 📸 `56-usuarios-created-list.png`
8. Click "Editar" en usuario creado
9. 📸 `57-usuarios-edit-modal.png`
10. Cambiar teléfono a 5587654322
11. Click "Guardar"
12. 📸 `58-usuarios-updated.png`
13. Click "Eliminar" (solo captura, cancelar)
14. 📸 `59-usuarios-delete-confirm.png`
15. F12 - Console
16. 📸 `60-usuarios-console.png`

**Checklist:**
- [ ] 7 screenshots capturados
- [ ] Usuario creado exitosamente
- [ ] Edición funciona
- [ ] Console sin errores críticos

---

**3.4.3 Cuotas (15 min)**
1. Click "Cuotas" en sidebar
2. 📸 `61-cuotas-empty.png`
3. Click "Nueva Cuota" → "Generar Masivamente"
4. 📸 `62-cuotas-generate-modal.png`
5. Configurar:
   - Mes: Diciembre
   - Año: 2025
   - Monto: 1500
   - Departamento: TODOS
   - Fecha Vencimiento: 2025-12-05
6. 📸 `63-cuotas-form-todos.png`
7. Click "Generar"
8. Esperar generación de 50 cuotas
9. 📸 `64-cuotas-generated-50.png` ⭐
10. Usar filtros (mes/año)
11. 📸 `65-cuotas-filters.png`
12. Click en una cuota
13. 📸 `66-cuotas-detail-modal.png`
14. Click "Pagar" en una cuota
15. 📸 `67-cuotas-pay-modal.png`
16. Confirmar pago
17. 📸 `68-cuotas-paid-status.png`
18. F12 - Console
19. 📸 `69-cuotas-console.png`
20. Query DB:
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM cuotas
" > screenshots-manual/70-cuotas-db-validation.txt
```

**Checklist:**
- [ ] 10 screenshots capturados
- [ ] 50 cuotas generadas (1 por unidad)
- [ ] Filtros funcionan
- [ ] Pago exitoso
- [ ] DB confirma 50 cuotas

---

**3.4.4 Gastos (10 min)**
1. Click "Gastos" en sidebar
2. Click "Nuevo Gasto"
3. 📸 `71-gastos-create-modal.png`
4. Crear 3 gastos:
   - Gasto 1: Mantenimiento elevadores, $5,000, MANTENIMIENTO, 2025-12-01
   - Gasto 2: Limpieza mensual, $8,000, SERVICIOS, 2025-12-05
   - Gasto 3: Pago agua, $3,500, SERVICIOS, 2025-12-10
5. 📸 `72-gastos-list-3.png`
6. Verificar total
7. 📸 `73-gastos-total-calculation.png` ⭐ ($16,500)
8. Usar filtros por categoría
9. 📸 `74-gastos-filters.png`
10. Click "Editar" en primer gasto
11. 📸 `75-gastos-edit.png`
12. F12 - Console
13. 📸 `76-gastos-console.png`

**Checklist:**
- [ ] 6 screenshots capturados
- [ ] 3 gastos creados
- [ ] Total: $16,500 ⭐
- [ ] Filtros funcionan

---

**3.4.5 Fondos (10 min)**
1. Click "Fondos" en sidebar
2. 📸 `77-fondos-list-3.png` ⭐ (3 fondos visibles)
3. Verificar saldos:
   - Fondo de Reserva: $50,000
   - Fondo de Mantenimiento: $25,000
   - Fondo de Emergencias: $15,000
4. Click "Transferir"
5. 📸 `78-fondos-transfer-modal.png`
6. Configurar:
   - Origen: Fondo de Reserva
   - Destino: Fondo de Mantenimiento
   - Monto: 10000
   - Concepto: Ajuste de fondos
7. Click "Transferir"
8. 📸 `79-fondos-after-transfer.png`
9. Verificar saldos actualizados:
   - Reserva: $40,000
   - Mantenimiento: $35,000
   - Total patrimonio: $90,000 (sin cambios)
10. 📸 `80-fondos-patrimonio-unchanged.png` ⭐
11. F12 - Console
12. 📸 `81-fondos-console.png`

**Checklist:**
- [ ] 5 screenshots capturados
- [ ] 3 fondos visibles
- [ ] Transferencia exitosa
- [ ] Patrimonio total: $90,000 ⭐

---

**3.4.6 Anuncios (10 min)**
1. Click "Anuncios" en sidebar
2. Click "Nuevo Anuncio"
3. 📸 `82-anuncios-create-modal.png`
4. Crear anuncio 1:
   - Título: Corte de agua programado
   - Contenido: El lunes 16/12 habrá corte 9am-2pm
   - Tipo: AVISO
   - Prioridad: ALTA
5. Crear anuncio 2:
   - Título: Reunión de condóminos
   - Contenido: Asamblea general 20/12 a las 18:00
   - Tipo: ASAMBLEA
   - Prioridad: NORMAL
6. 📸 `83-anuncios-list-2.png`
7. Verificar colores por prioridad
8. 📸 `84-anuncios-priority-colors.png`
9. Click "Editar" en primer anuncio
10. 📸 `85-anuncios-edit.png`
11. Click "Eliminar" en segundo anuncio
12. 📸 `86-anuncios-delete.png`

**Checklist:**
- [ ] 5 screenshots capturados
- [ ] 2 anuncios creados
- [ ] Colores de prioridad correctos
- [ ] Edit y delete funcionan

---

**3.4.7 Cierres (10 min)**
1. Click "Cierres" en sidebar
2. Click "Generar Cierre"
3. 📸 `87-cierres-create-modal.png`
4. Configurar:
   - Mes: Diciembre
   - Año: 2025
   - Tipo: MENSUAL
5. Click "Generar"
6. 📸 `88-cierres-generated.png`
7. Verificar cálculos:
   - Ingresos: (cuotas pagadas)
   - Egresos: $16,500 (gastos)
   - Saldo: Ingresos - Egresos
8. 📸 `89-cierres-calculations.png` ⭐
9. F12 - Console
10. 📸 `90-cierres-console.png`

**Checklist:**
- [ ] 4 screenshots capturados
- [ ] Cierre generado
- [ ] Cálculos correctos
- [ ] Ingresos, Egresos, Saldo visibles

---

#### 🟢 TAREA 3.5: Validación Final DB (15 min)

**Query Completa:**
```bash
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

**Screenshots Individuales:**
```bash
# Usuarios
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total, rol FROM usuarios GROUP BY rol
" > screenshots-manual/92-final-usuarios-count.txt

# Cuotas
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM cuotas
" > screenshots-manual/93-final-cuotas-count.txt

# Patrimonio
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT SUM(saldo) as patrimonio_total FROM fondos
" > screenshots-manual/94-final-patrimonio.txt

# Gastos
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT SUM(monto) as total_gastos FROM gastos
" > screenshots-manual/95-final-gastos-sum.txt

# Fondos
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM fondos
" > screenshots-manual/96-final-fondos-3.txt

# Buildings
npx wrangler d1 execute edificio_admin_db --remote --command="
SELECT COUNT(*) as total FROM buildings
" > screenshots-manual/97-final-buildings-1.txt
```

**Screenshots de Console:**
- [ ] `98-final-console-clean.png` (F12 → Console sin errores)
- [ ] `99-final-network-tab.png` (F12 → Network con requests exitosos)

**Validaciones Esperadas:**
- [ ] Total usuarios: 2 (1 admin + 1 inquilino)
- [ ] Buildings: 1
- [ ] Cuotas: 50
- [ ] Fondos: 3
- [ ] Patrimonio: $90,000 ⭐
- [ ] Gastos: 3 ($16,500)
- [ ] Anuncios: 1 (uno fue eliminado)
- [ ] Cierres: 1

---

## 📊 Checklist de Completitud Final

### Screenshots por Fase
- [x] Landing (4/4) - 100% ✅
- [x] Registro (5/5) - 100% ✅
- [ ] OTP (4/6) - 67% ⚠️ → **Completar 2**
- [ ] Checkout (2/7) - 29% 🔴 → **Completar 5**
- [ ] Setup (1/15) - 7% 🔴 → **Completar 14**
- [ ] Validación DB Post (0/6) - 0% 🔴 → **Completar 6**
- [x] Login (3/3) - 100% ✅
- [x] Dashboard (7/6) - 117% ✅
- [ ] Usuarios (1/8) - 13% 🔴 → **Completar 7**
- [ ] Cuotas (0/10) - 0% 🔴 → **Completar 10**
- [ ] Gastos (0/6) - 0% 🔴 → **Completar 6**
- [ ] Fondos (0/5) - 0% 🔴 → **Completar 5**
- [ ] Anuncios (0/5) - 0% 🔴 → **Completar 5**
- [ ] Cierres (0/4) - 0% 🔴 → **Completar 4**
- [ ] Validación Final (0/9) - 0% 🔴 → **Completar 9**

**Total Actual:** 27/99 (27%)  
**Total Objetivo:** 99/99 (100%)  
**Por Capturar:** 72 screenshots

---

## 🎯 Objetivo del Día

### Meta Mínima
- ✅ Corregir 2 bugs críticos (Checkout, Setup)
- ✅ Configurar Wrangler auth
- ✅ Completar flujo de onboarding
- ✅ Capturar 30+ screenshots adicionales
- ✅ Alcanzar 60% cobertura

### Meta Ideal
- ✅ Corregir todos los bugs
- ✅ Flujo completo de onboarding
- ✅ CRUD completo de admin panel
- ✅ Validaciones DB completas
- ✅ 99+ screenshots capturados
- ✅ Alcanzar 100% cobertura

---

## 📁 Estructura de Trabajo

```bash
# Crear carpeta para screenshots manuales
mkdir -p /home/admin/edifnuev/screenshots-manual/{onboarding,admin-panel,db-validation}

# Durante el día, guardar screenshots ahí
# Al final, consolidar con los existentes
```

---

## ⏰ Timeline Estimado

| Hora | Actividad | Duración |
|------|-----------|----------|
| **09:00-09:45** | Bug #1 - Timeout Checkout | 45 min |
| **09:45-10:30** | Bug #2 - Timeout Setup | 45 min |
| **10:30-11:00** | Bug #3 - Error 500 Registro | 30 min |
| **11:00-11:30** | Bug #4 - Selección Plan | 30 min |
| **11:30-12:00** | Configurar Wrangler + Limpiar DB | 30 min |
| **--- BREAK ---** | | 30 min |
| **12:30-13:15** | Flujo Onboarding Completo | 45 min |
| **13:15-13:25** | Validación DB Post-Onboarding | 10 min |
| **13:25-14:25** | Admin Panel CRUD Completo | 60 min |
| **14:25-14:40** | Validación Final DB | 15 min |
| **14:40-15:00** | Consolidar y generar reporte | 20 min |

**Inicio:** 09:00  
**Fin:** 15:00  
**Total:** 6 horas (incluyendo break)

---

## ✅ Criterios de Éxito

### Al Final del Día
- [ ] 4 bugs críticos corregidos
- [ ] Wrangler autenticado y funcional
- [ ] Base de datos limpia y validada
- [ ] Flujo de onboarding 100% completo
- [ ] 72+ screenshots adicionales capturados
- [ ] Admin panel CRUD completo
- [ ] Patrimonio validado: $90,000 ⭐
- [ ] 50 cuotas generadas ⭐
- [ ] Reporte final con 99+ screenshots
- [ ] Commits organizados por fase

---

## 📝 Comandos Rápidos

### Verificar Estado Actual
```bash
cd /home/admin/edifnuev
ls -lh screenshots-consolidados/
tar -tzf screenshots-consolidados/screenshots-consolidados.tar.gz | wc -l
```

### Iniciar Trabajo
```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted
git checkout master
git pull
npx wrangler login
mkdir -p screenshots-manual/{onboarding,admin-panel,db-validation}
```

### Durante Testing
```bash
# Abrir browser
open https://edificio-admin-saas-adapted.sebastianvernis.workers.dev

# Ver logs en tiempo real
npx wrangler tail

# Queries DB rápidas
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT COUNT(*) FROM usuarios"
```

---

## 🎯 Entregables del Día

### Al Finalizar
1. ✅ Carpeta `screenshots-manual/` con 72+ nuevos screenshots
2. ✅ `BUGS_FIXED.md` documentando correcciones
3. ✅ `TESTING_FINAL_REPORT.md` con 99+ screenshots completos
4. ✅ Commits por cada bug corregido
5. ✅ PR consolidando todo el testing
6. ✅ Issue #3 cerrado

---

**Preparado:** 2025-12-14 13:42 UTC  
**Listo para ejecutar:** ✅  
**Tiempo estimado:** 6 horas  
**Resultado esperado:** 100% testing visual completo
