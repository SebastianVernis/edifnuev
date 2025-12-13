# 🧪 Testing Checklist - Edificio Admin SaaS

**Fecha:** 2025-12-13  
**URL Base:** https://edificio-admin-saas-adapted.sebastianvernis.workers.dev  
**Estado:** Pendiente de testing completo

---

## 📋 Pre-requisitos

### 1. Limpiar Base de Datos

```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted

# Eliminar todos los datos
npx wrangler d1 execute edificio_admin_db --remote --command="DELETE FROM usuarios; DELETE FROM cuotas; DELETE FROM gastos; DELETE FROM fondos; DELETE FROM fondos_movimientos; DELETE FROM presupuestos; DELETE FROM cierres; DELETE FROM anuncios; DELETE FROM solicitudes; DELETE FROM parcialidades; DELETE FROM permisos; DELETE FROM audit_logs; DELETE FROM pending_users; DELETE FROM otp_codes; DELETE FROM mockup_payments; DELETE FROM email_logs; DELETE FROM buildings;"

# Verificar que esté vacía
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT COUNT(*) as usuarios FROM usuarios; SELECT COUNT(*) as buildings FROM buildings; SELECT COUNT(*) as pending FROM pending_users;"
```

### 2. Crear Usuario Admin de Prueba

**IMPORTANTE:** Este usuario se crea DESPUÉS de completar el flujo de onboarding completo (ver sección "Flujo 1")

**Email:** admin@prueba.com  
**Contraseña:** Admin123!  
**Edificio:** Edificio Prueba Central  
**Unidades:** 50  
**Plan:** Profesional ($999/mes)

---

## 🎯 Flujo 1: Onboarding Completo (Usuario Nuevo)

### 1.1 Landing Page
**URL:** https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/

**Capturar:**
- [ ] Screenshot completo de la landing
- [ ] Screenshot de la sección de features
- [ ] Screenshot de la sección de pricing
- [ ] Console sin errores

**Validar:**
- [ ] Los 3 planes se muestran correctamente (Básico, Profesional, Empresarial)
- [ ] Botón "Comenzar Gratis" funciona
- [ ] Botón "Ver Demo" redirige a login
- [ ] Links del footer funcionan
- [ ] Responsive en mobile

**Acciones:**
1. Click en "Comenzar Gratis"
2. **Screenshot:** Debe redirigir a `/registro.html`

---

### 1.2 Registro Inicial
**URL:** /registro.html

**Capturar:**
- [ ] Screenshot del formulario de registro
- [ ] Screenshot con un plan seleccionado
- [ ] Console antes de enviar
- [ ] Console después de enviar (debe mostrar success)
- [ ] Screenshot de redirección a verificar-otp

**Datos de prueba:**
```json
{
  "fullName": "María González",
  "email": "maria.gonzalez.test@mailinator.com",
  "phone": "5512345678",
  "buildingName": "Torre del Valle",
  "selectedPlan": "profesional"
}
```

**Validar:**
- [ ] Todos los campos se validan correctamente
- [ ] Los 4 planes se muestran (Básico, Profesional, Empresarial, Personalizado)
- [ ] Al seleccionar un plan, se marca visualmente
- [ ] Link "Crea tu paquete" abre `/crear-paquete.html`
- [ ] Link "Inicia sesión" redirige a `/login.html`
- [ ] Botón "Continuar" se deshabilita mientras procesa
- [ ] Mensaje de éxito se muestra
- [ ] Redirige automáticamente a verificar-otp después de 1.5s

**Acciones:**
1. Llenar formulario con datos de prueba
2. Seleccionar plan "Profesional"
3. Click en "Continuar"
4. **Screenshot:** Mensaje de éxito
5. Esperar redirección automática

---

### 1.3 Constructor de Paquete Personalizado (Opcional)
**URL:** /crear-paquete.html

**Capturar:**
- [ ] Screenshot con 25 unidades
- [ ] Screenshot con 100 unidades
- [ ] Screenshot con 300 unidades
- [ ] Screenshot del cálculo de precio
- [ ] Console sin errores

**Validar:**
- [ ] Slider funciona de 1 a 500 unidades
- [ ] Cálculo de precio es correcto:
  - 1-20 unidades: $24.95/unidad + 10%
  - 21-50 unidades: $19.98/unidad + 10%
  - 51-200 unidades: $9.995/unidad + 10%
  - 200+ unidades: $9.995/unidad + 10%
- [ ] Muestra "Costo base" y "Margen (10%)" separados
- [ ] El total se actualiza en tiempo real
- [ ] Botón "Continuar con este paquete" funciona
- [ ] Redirige a `/registro.html?plan=personalizado&units=X`
- [ ] El plan personalizado se muestra en registro con el precio calculado

**Ejemplos de validación:**
- 25 unidades: Base $499.50 + Margen $49.95 = **$549/mes**
- 100 unidades: Base $999.50 + Margen $99.95 = **$1,099/mes**
- 300 unidades: Base $2,998.50 + Margen $299.85 = **$3,298/mes**

---

### 1.4 Verificación OTP
**URL:** /verificar-otp.html

**Capturar:**
- [ ] Screenshot de la página de OTP
- [ ] Screenshot del email mostrado
- [ ] Screenshot del temporizador activo
- [ ] Console mostrando "Código enviado"
- [ ] Screenshot después de ingresar código correcto
- [ ] Screenshot de redirección a checkout

**Obtener código OTP:**
```bash
# En terminal
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT email, code, created_at, expires_at FROM otp_codes ORDER BY created_at DESC LIMIT 1"

# El código estará en el campo "code"
```

**Validar:**
- [ ] Email se muestra correctamente
- [ ] 6 inputs para el código OTP
- [ ] Auto-focus al siguiente input al escribir
- [ ] Backspace regresa al input anterior
- [ ] Paste pega el código completo en los 6 inputs
- [ ] Temporizador cuenta regresiva desde 5:00
- [ ] Botón "Reenviar código" está deshabilitado durante temporizador
- [ ] Al ingresar código incorrecto muestra error con intentos restantes
- [ ] Al ingresar código correcto muestra success
- [ ] Redirige a `/checkout.html` después de verificación exitosa

**Acciones:**
1. Obtener código OTP de la base de datos
2. Ingresar código en los 6 inputs
3. **Screenshot:** Mensaje de verificación exitosa
4. Esperar redirección

---

### 1.5 Checkout/Pago
**URL:** /checkout.html

**Capturar:**
- [ ] Screenshot del formulario de pago
- [ ] Screenshot del resumen del pedido
- [ ] Screenshot mostrando el plan seleccionado
- [ ] Screenshot del cálculo de IVA
- [ ] Console antes de pagar
- [ ] Screenshot después de pago exitoso

**Datos de tarjeta de prueba:**
```
Nombre: MARIA GONZALEZ
Número: 4242 4242 4242 4242
Vencimiento: 12/28
CVV: 123
CP: 12345
```

**Validar:**
- [ ] Plan y precio se muestran correctamente
- [ ] Cálculo de IVA (16%) es correcto
- [ ] Total = Subtotal + IVA
- [ ] Formateo automático del número de tarjeta (espacios cada 4 dígitos)
- [ ] Formateo automático de fecha (MM/YY con /)
- [ ] CVV solo acepta números
- [ ] CP solo acepta números
- [ ] Íconos de tarjetas de crédito se muestran
- [ ] Badge "Pago 100% seguro" visible
- [ ] Botón se deshabilita mientras procesa
- [ ] Mensaje de éxito se muestra
- [ ] Redirige a `/setup-edificio.html`

**Acciones:**
1. Verificar que el plan y precio sean correctos
2. Llenar datos de tarjeta
3. Click en "Procesar pago"
4. **Screenshot:** Mensaje de pago exitoso
5. Esperar redirección

---

### 1.6 Setup del Edificio
**URL:** /setup-edificio.html

**Capturar:**
- [ ] Screenshot de la barra de progreso (pasos 1-4)
- [ ] Screenshot de cada sección del formulario
- [ ] Screenshot de plantilla de reglamento básico
- [ ] Screenshot de plantilla de reglamento completo
- [ ] Screenshot de plantilla de políticas de privacidad
- [ ] Screenshot de plantilla de políticas de pago
- [ ] Screenshot agregando fondos/patrimonios
- [ ] Screenshot del formulario completo
- [ ] Console antes de enviar
- [ ] Screenshot del mensaje de éxito
- [ ] Screenshot de redirección a /admin

**Datos de prueba completos:**

**Información del Edificio:**
```
Nombre: Torre del Valle
Dirección: Av. Insurgentes Sur 1234, Col. Del Valle, Ciudad de México, CP 03100
Total unidades: 50
Tipo: Edificio
```

**Información del Administrador:**
```
Nombre: María González
Teléfono: 5512345678
Contraseña: Admin123!
Confirmar: Admin123!
```

**Configuración SMTP (dejar vacío):**
```
Servidor SMTP: (vacío)
Puerto: (vacío)
Usuario: (vacío)
Contraseña: (vacío)
```

**Documentos (no subir archivos en esta prueba)**

**Reglamentos:**
```
1. Click en "Usar plantilla básica" - validar que se llena el textarea
2. Click en "Usar plantilla completa" - validar que se actualiza
3. Click en "Usar plantilla de privacidad" - validar que se llena
4. Click en "Usar plantilla de políticas de pago" - validar que se llena con datos del formulario
```

**Fondos/Patrimonios (agregar 3):**
```json
[
  { "name": "Fondo de Reserva", "amount": 50000 },
  { "name": "Fondo de Mantenimiento", "amount": 25000 },
  { "name": "Fondo de Emergencias", "amount": 15000 }
]
```

**Configuración de Cuotas:**
```
Cuota mensual ordinaria: 1500
Cuota extraordinaria: 500
Día de corte: 5
Días de gracia: 5
Recargo por mora: 2.5
```

**Validar:**
- [ ] Barra de progreso muestra paso 4 activo
- [ ] Todos los campos se muestran correctamente
- [ ] Botón "Usar plantilla básica" llena el textarea de reglamento
- [ ] Botón "Usar plantilla completa" actualiza el reglamento
- [ ] Botón "Usar plantilla de privacidad" llena políticas
- [ ] Botón "Usar plantilla de políticas de pago" llena con datos correctos (día de corte, días de gracia, %)
- [ ] Botón "Agregar fondo" crea nueva fila
- [ ] Botón "X" elimina fondo (no permite eliminar el último)
- [ ] Upload de archivos funciona con drag & drop
- [ ] Preview de archivos seleccionados
- [ ] Botón "Completar configuración" se deshabilita mientras procesa
- [ ] Mensaje de éxito se muestra
- [ ] Token se guarda en localStorage
- [ ] Redirige a `/admin` después de 2s

**Acciones:**
1. Llenar TODOS los campos del formulario
2. Agregar los 3 fondos especificados
3. Usar todas las plantillas (reglamentos y políticas)
4. Click en "Completar configuración"
5. **Screenshot:** Mensaje de configuración completada
6. **Console screenshot:** Verificar que no hay errores
7. Esperar redirección a admin

---

### 1.7 Verificar Datos Guardados en Base de Datos

**Después del setup, ejecutar:**

```bash
# Verificar edificio creado
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT * FROM buildings ORDER BY created_at DESC LIMIT 1"

# Verificar usuario admin creado
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT id, nombre, email, rol, departamento, building_id FROM usuarios WHERE rol='ADMIN' ORDER BY fechaCreacion DESC LIMIT 1"

# Verificar fondos creados
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT * FROM fondos ORDER BY created_at DESC LIMIT 10"

# Verificar pending_user marcado como completado
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT * FROM pending_users ORDER BY created_at DESC LIMIT 1"
```

**Validar en DB:**
- [ ] Building creado con todos los datos:
  - name = "Torre del Valle"
  - total_units = 50
  - monthly_fee = 1500
  - extraordinary_fee = 500
  - cutoff_day = 5
  - payment_due_days = 5
  - late_fee_percent = 2.5
  - setup_completed = 1
- [ ] Usuario ADMIN creado:
  - nombre = "María González"
  - email = "maria.gonzalez.test@mailinator.com"
  - rol = "ADMIN"
  - building_id = (ID del edificio creado)
  - password está hasheado
- [ ] 3 Fondos creados:
  - Fondo de Reserva: $50,000
  - Fondo de Mantenimiento: $25,000
  - Fondo de Emergencias: $15,000
- [ ] pending_user:
  - setup_completed = 1
  - completed_at tiene fecha

**Screenshots requeridos:**
- [ ] Output completo del query de buildings
- [ ] Output completo del query de usuario
- [ ] Output completo del query de fondos
- [ ] Output completo del query de pending_users

---

## 🎯 Flujo 2: Login Usuario Existente

### 2.1 Login
**URL:** /login.html

**Capturar:**
- [ ] Screenshot del formulario de login
- [ ] Console antes de login
- [ ] Console después de login exitoso
- [ ] Screenshot mostrando token guardado en localStorage

**Datos:**
```
Email: admin@prueba.com
Contraseña: Admin123!
```

**Validar:**
- [ ] Formulario se muestra correctamente
- [ ] Link "Regístrate aquí" redirige a `/`
- [ ] Validación de email
- [ ] Validación de contraseña
- [ ] Botón se deshabilita mientras procesa
- [ ] En caso de error muestra mensaje
- [ ] En caso de éxito guarda token en localStorage
- [ ] Redirige a `/admin` o `/inquilino` según rol

**Console commands para verificar:**
```javascript
localStorage.getItem('token')
localStorage.getItem('edificio_user')
```

---

## 🎯 Flujo 3: Panel de Administración

### 3.1 Dashboard
**URL:** /admin#dashboard

**Capturar:**
- [ ] Screenshot completo del dashboard
- [ ] Screenshot de la sección de patrimonio
- [ ] Screenshot de la sección de cuotas pendientes
- [ ] Screenshot de gráficas (fondos y cuotas)
- [ ] Console sin errores

**Validar:**
- [ ] Sidebar se muestra con todas las opciones
- [ ] Nombre de usuario y rol se muestran en header
- [ ] Botón de logout funciona
- [ ] Patrimonio total muestra suma de fondos ($90,000)
- [ ] Gráfico de fondos se renderiza
- [ ] Cuotas pendientes muestra 0 (base limpia)
- [ ] Gráfico de cuotas se renderiza
- [ ] Últimos anuncios se muestra vacío

**APIs que deben responder 200:**
- [ ] GET /api/fondos
- [ ] GET /api/cuotas
- [ ] GET /api/gastos
- [ ] GET /api/anuncios?limit=5

---

### 3.2 Usuarios
**URL:** /admin#usuarios

**Capturar:**
- [ ] Screenshot de la lista de usuarios
- [ ] Screenshot del botón "Nuevo Usuario"
- [ ] Screenshot del modal de crear usuario
- [ ] Screenshot con usuario creado exitosamente
- [ ] Screenshot del botón "Editar"
- [ ] Screenshot del modal de edición
- [ ] Screenshot con usuario editado
- [ ] Screenshot del botón "Eliminar"
- [ ] Screenshot de confirmación de eliminado
- [ ] Console de todas las operaciones

**Crear Usuario de Prueba:**
```json
{
  "nombre": "Carlos Ramírez",
  "email": "carlos.ramirez@edificio.com",
  "password": "Inquilino123",
  "departamento": "301",
  "rol": "INQUILINO",
  "telefono": "5587654321"
}
```

**Validar:**
- [ ] Lista muestra usuario admin existente
- [ ] Filtros funcionan (por rol, por estado)
- [ ] Botón "Nuevo Usuario" abre modal
- [ ] Modal tiene todos los campos
- [ ] Validación de departamento único
- [ ] Validación de email único
- [ ] Validación de formato de departamento (XXX)
- [ ] Usuario se crea correctamente
- [ ] Lista se actualiza automáticamente
- [ ] Botón "Editar" abre modal con datos pre-llenados
- [ ] Modal de edición permite cambiar todos los campos
- [ ] Actualización funciona correctamente
- [ ] Botón "Eliminar" pide confirmación
- [ ] Eliminación es soft-delete (activo = 0)

**APIs que deben responder 200:**
- [ ] GET /api/usuarios
- [ ] POST /api/usuarios
- [ ] PUT /api/usuarios/:id
- [ ] DELETE /api/usuarios/:id

---

### 3.3 Cuotas
**URL:** /admin#cuotas

**Capturar:**
- [ ] Screenshot de la sección vacía
- [ ] Screenshot del botón "Nueva Cuota"
- [ ] Screenshot del modal de crear cuota
- [ ] Screenshot seleccionando departamento "TODOS"
- [ ] Screenshot de cuotas generadas masivamente
- [ ] Screenshot del filtro por mes
- [ ] Screenshot del botón "Pagar"
- [ ] Screenshot de confirmación de pago
- [ ] Screenshot de cuota pagada
- [ ] Console de todas las operaciones

**Crear Cuota Masiva:**
```json
{
  "mes": "Diciembre",
  "anio": 2025,
  "monto": 1500,
  "departamento": "TODOS",
  "fechaVencimiento": "2025-12-05"
}
```

**Validar:**
- [ ] Botón "Nueva Cuota" abre modal
- [ ] Opción "TODOS" en dropdown de departamentos
- [ ] Al seleccionar "TODOS" genera cuota para todas las unidades (50)
- [ ] Cuotas se crean con estado "PENDIENTE"
- [ ] Lista muestra las 50 cuotas
- [ ] Filtros por mes y año funcionan
- [ ] Botón "Pagar" cambia estado a "PAGADA"
- [ ] Al pagar se registra en fondos automáticamente
- [ ] Acumulado se calcula correctamente
- [ ] Estados se muestran con colores (Pendiente, Pagada, Vencida)

**APIs que deben responder 200:**
- [ ] GET /api/cuotas
- [ ] GET /api/cuotas?mes=X&anio=Y
- [ ] POST /api/cuotas/generar
- [ ] POST /api/cuotas/:id/pagar
- [ ] PUT /api/cuotas/:id
- [ ] DELETE /api/cuotas/:id

**Verificar en DB después:**
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT COUNT(*) as total, SUM(monto) as suma FROM cuotas"
```
Debe mostrar: 50 cuotas, suma $75,000

---

### 3.4 Gastos
**URL:** /admin#gastos

**Capturar:**
- [ ] Screenshot de la sección vacía
- [ ] Screenshot del botón "Nuevo Gasto"
- [ ] Screenshot del modal de crear gasto
- [ ] Screenshot de gasto creado
- [ ] Screenshot de filtros por categoría
- [ ] Screenshot de filtros por fecha
- [ ] Screenshot del botón editar
- [ ] Screenshot del botón eliminar
- [ ] Console de todas las operaciones

**Crear Gastos de Prueba (3):**
```json
[
  {
    "descripcion": "Mantenimiento de elevadores",
    "monto": 5000,
    "categoria": "MANTENIMIENTO",
    "fecha": "2025-12-01",
    "proveedor": "Elevadores S.A."
  },
  {
    "descripcion": "Servicio de limpieza mensual",
    "monto": 8000,
    "categoria": "SERVICIOS",
    "fecha": "2025-12-05",
    "proveedor": "Limpieza Total"
  },
  {
    "descripcion": "Pago de agua",
    "monto": 3500,
    "categoria": "SERVICIOS",
    "fecha": "2025-12-10",
    "proveedor": "CDMX Agua"
  }
]
```

**Validar:**
- [ ] Botón "Nuevo Gasto" abre modal
- [ ] Todas las categorías disponibles
- [ ] Campo de proveedor opcional
- [ ] Upload de comprobante funciona
- [ ] Gastos se crean correctamente
- [ ] Filtro por categoría funciona
- [ ] Filtro por año funciona
- [ ] Total de gastos se calcula ($16,500)
- [ ] Edición de gastos funciona
- [ ] Eliminación de gastos funciona

**APIs que deben responder 200:**
- [ ] GET /api/gastos
- [ ] GET /api/gastos?anio=2025
- [ ] POST /api/gastos
- [ ] PUT /api/gastos/:id
- [ ] DELETE /api/gastos/:id

---

### 3.5 Fondos
**URL:** /admin#fondos

**Capturar:**
- [ ] Screenshot mostrando los 3 fondos iniciales
- [ ] Screenshot de saldos de cada fondo
- [ ] Screenshot del botón "Nuevo Fondo"
- [ ] Screenshot del modal de transferencia
- [ ] Screenshot después de transferencia
- [ ] Screenshot de movimientos de fondos
- [ ] Console de todas las operaciones

**Validar:**
- [ ] Se muestran los 3 fondos creados en setup:
  - Fondo de Reserva: $50,000
  - Fondo de Mantenimiento: $25,000
  - Fondo de Emergencias: $15,000
- [ ] Patrimonio total: $90,000
- [ ] Botón "Transferir" abre modal
- [ ] Transferencia entre fondos funciona
- [ ] Saldos se actualizan correctamente
- [ ] Movimientos se registran
- [ ] Lista de movimientos muestra origen/destino

**Prueba de Transferencia:**
```
Desde: Fondo de Reserva
Hacia: Fondo de Mantenimiento
Monto: 10000
Concepto: Ajuste de fondos
```

**Después de transferencia validar:**
- [ ] Fondo de Reserva: $40,000
- [ ] Fondo de Mantenimiento: $35,000
- [ ] Patrimonio total sigue siendo: $90,000

**APIs que deben responder 200:**
- [ ] GET /api/fondos
- [ ] POST /api/fondos
- [ ] POST /api/fondos/transferir
- [ ] PUT /api/fondos/:id
- [ ] DELETE /api/fondos/:id

---

### 3.6 Anuncios
**URL:** /admin#anuncios

**Capturar:**
- [ ] Screenshot de sección vacía
- [ ] Screenshot del botón "Nuevo Anuncio"
- [ ] Screenshot del modal de crear anuncio
- [ ] Screenshot de anuncio creado
- [ ] Screenshot de filtros por tipo
- [ ] Console sin errores

**Crear Anuncios (2):**
```json
[
  {
    "titulo": "Corte de agua programado",
    "contenido": "El próximo lunes 16 de diciembre habrá corte de agua de 9am a 2pm por mantenimiento.",
    "tipo": "AVISO",
    "prioridad": "ALTA"
  },
  {
    "titulo": "Reunión de condóminos",
    "contenido": "Se convoca a asamblea general el día 20 de diciembre a las 18:00 hrs en el salón de eventos.",
    "tipo": "ASAMBLEA",
    "prioridad": "NORMAL"
  }
]
```

**Validar:**
- [ ] Botón "Nuevo Anuncio" abre modal
- [ ] Tipos disponibles: AVISO, ASAMBLEA, MANTENIMIENTO
- [ ] Prioridades: BAJA, NORMAL, ALTA, URGENTE
- [ ] Anuncios se crean correctamente
- [ ] Filtro por tipo funciona
- [ ] Edición funciona
- [ ] Eliminación funciona

**APIs que deben responder 200:**
- [ ] GET /api/anuncios
- [ ] POST /api/anuncios
- [ ] PUT /api/anuncios/:id
- [ ] DELETE /api/anuncios/:id

---

### 3.7 Cierres
**URL:** /admin#cierres

**Capturar:**
- [ ] Screenshot de sección vacía
- [ ] Screenshot del botón "Generar Cierre"
- [ ] Screenshot del modal
- [ ] Screenshot de cierre generado
- [ ] Console sin errores

**Crear Cierre Mensual:**
```json
{
  "mes": "Diciembre",
  "anio": 2025,
  "tipo": "MENSUAL"
}
```

**Validar:**
- [ ] Botón "Generar Cierre" funciona
- [ ] Cierre calcula automáticamente:
  - Total ingresos (cuotas pagadas)
  - Total egresos (gastos)
  - Saldo
- [ ] Cierre se guarda correctamente
- [ ] Lista muestra cierres con totales
- [ ] Filtro por año funciona

**APIs que deben responder 200:**
- [ ] GET /api/cierres
- [ ] GET /api/cierres?anio=2025
- [ ] POST /api/cierres

---

### 3.8 Parcialidades (2026)
**URL:** /admin#parcialidades

**Capturar:**
- [ ] Screenshot de sección (puede dar 404 en algunas rutas)
- [ ] Console mostrando errores 404 esperados

**Validar:**
- [ ] Sección se carga sin romper la app
- [ ] Errores 404 son esperados (rutas no implementadas):
  - /api/parcialidades/pagos
  - /api/parcialidades/estado

**Nota:** Esta sección tiene funcionalidad limitada.

---

## 🎯 Flujo 4: Testing de Invitaciones

### 4.1 Enviar Invitación
**Desde:** /admin#usuarios

**Capturar:**
- [ ] Screenshot del botón "Invitar Usuario"
- [ ] Screenshot del modal de invitación
- [ ] Screenshot de invitación enviada
- [ ] Console mostrando success

**Datos de Invitación:**
```json
{
  "email": "nuevo.usuario@edificio.com",
  "name": "Roberto Martínez",
  "role": "INQUILINO",
  "department": "402"
}
```

**Validar:**
- [ ] Modal de invitación se abre
- [ ] Todos los campos requeridos
- [ ] Email se valida
- [ ] Rol se puede seleccionar
- [ ] Departamento se valida
- [ ] Invitación se envía correctamente
- [ ] Se guarda en tabla `invitations`

**Verificar en DB:**
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT * FROM invitations ORDER BY created_at DESC LIMIT 1"
```

**Validar:**
- [ ] Token generado (único)
- [ ] Email correcto
- [ ] expires_at = 7 días desde creación
- [ ] status = 'pending'

---

## 🎯 Flujo 5: Crear Usuario desde Datos Aleatorios

### 5.1 Generar Usuario Aleatorio

**Usar generador online:** https://www.fakenamegenerator.com/

**Datos sugeridos:**
```json
{
  "nombre": "[Nombre aleatorio del generador]",
  "email": "[email del generador]@mailinator.com",
  "password": "Test123!",
  "departamento": "[número aleatorio 101-550]",
  "rol": "INQUILINO",
  "telefono": "[teléfono aleatorio 10 dígitos]"
}
```

**Capturar:**
- [ ] Screenshot del generador con datos
- [ ] Screenshot del modal con datos pegados
- [ ] Screenshot de usuario creado
- [ ] Console sin errores

**Validar:**
- [ ] Usuario se crea con datos aleatorios
- [ ] Email único se valida
- [ ] Departamento único se valida
- [ ] Formato de departamento se valida

---

## 🎯 Flujo 6: Validaciones y Edge Cases

### 6.1 Validación de Duplicados

**Capturar:**
- [ ] Screenshot intentando crear usuario con email existente
- [ ] Screenshot del mensaje de error
- [ ] Screenshot intentando crear usuario con departamento existente
- [ ] Screenshot del mensaje de error

**Validar:**
- [ ] Error: "El email ya está registrado"
- [ ] Error: "El departamento ya está asignado"
- [ ] No se crea usuario duplicado en DB

---

### 6.2 Validación de Permisos

**Capturar:**
- [ ] Screenshot de logout
- [ ] Screenshot intentando acceder a /admin sin token
- [ ] Screenshot de redirección a login

**Validar:**
- [ ] Logout limpia localStorage
- [ ] Redirige a `/`
- [ ] Intentar acceder a `/admin` sin token redirige a login
- [ ] APIs sin token retornan 401

---

## 🎯 Checklist Final de Endpoints

### Authentication (4/4)
- [ ] POST /api/auth/login
- [ ] POST /api/auth/registro  
- [ ] GET /api/auth/renew
- [ ] GET /api/auth/perfil

### Onboarding (7/7)
- [ ] POST /api/onboarding/register
- [ ] POST /api/onboarding/checkout
- [ ] POST /api/onboarding/setup-building
- [ ] POST /api/otp/send
- [ ] POST /api/otp/verify
- [ ] POST /api/otp/resend
- [ ] GET /api/otp/status/:email

### Usuarios (5/5)
- [ ] GET /api/usuarios
- [ ] GET /api/usuarios/:id
- [ ] POST /api/usuarios
- [ ] PUT /api/usuarios/:id
- [ ] DELETE /api/usuarios/:id

### Cuotas (6/6)
- [ ] GET /api/cuotas
- [ ] GET /api/cuotas/departamento/:depto
- [ ] POST /api/cuotas
- [ ] POST /api/cuotas/generar
- [ ] POST /api/cuotas/:id/pagar
- [ ] DELETE /api/cuotas/:id

### Gastos (5/5)
- [ ] GET /api/gastos
- [ ] GET /api/gastos/:id
- [ ] POST /api/gastos
- [ ] PUT /api/gastos/:id
- [ ] DELETE /api/gastos/:id

### Fondos (5/5)
- [ ] GET /api/fondos
- [ ] GET /api/fondos/:id
- [ ] POST /api/fondos
- [ ] PUT /api/fondos/:id
- [ ] DELETE /api/fondos/:id

### Anuncios (5/5)
- [ ] GET /api/anuncios
- [ ] GET /api/anuncios/:id
- [ ] POST /api/anuncios
- [ ] PUT /api/anuncios/:id
- [ ] DELETE /api/anuncios/:id

### Cierres (3/3)
- [ ] GET /api/cierres
- [ ] GET /api/cierres/:id
- [ ] POST /api/cierres

---

## 📸 Screenshots Obligatorios - Resumen

### Landing y Onboarding (15 screenshots mínimo)
1. Landing completa
2. Pricing section
3. Registro - formulario vacío
4. Registro - plan seleccionado
5. Constructor de paquetes
6. Verificar OTP - pantalla inicial
7. Verificar OTP - código ingresado
8. Checkout - formulario
9. Checkout - resumen con totales
10. Setup - sección edificio
11. Setup - sección admin
12. Setup - sección reglamentos
13. Setup - fondos agregados
14. Setup - mensaje de éxito
15. Redirección a admin

### Panel Admin (20 screenshots mínimo)
16. Dashboard completo
17. Usuarios - lista
18. Usuarios - crear modal
19. Usuarios - editar modal
20. Cuotas - lista vacía
21. Cuotas - crear modal
22. Cuotas - 50 cuotas generadas
23. Cuotas - pagar cuota
24. Gastos - lista
25. Gastos - crear modal
26. Gastos - filtros
27. Fondos - 3 fondos iniciales
28. Fondos - transferencia
29. Fondos - movimientos
30. Anuncios - lista
31. Anuncios - crear modal
32. Cierres - generar
33. Cierres - detalle
34. Logout
35. Login de nuevo

### Console y DB (10 screenshots mínimo)
36. Console - sin errores en landing
37. Console - registro exitoso
38. Console - OTP verificado
39. Console - pago procesado
40. Console - setup completado
41. Console - token guardado en localStorage
42. DB - buildings query result
43. DB - usuarios query result
44. DB - fondos query result
45. DB - cuotas count

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
npx wrangler tail --format=pretty
```

### Obtener último código OTP
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT email, code, expires_at FROM otp_codes ORDER BY created_at DESC LIMIT 1"
```

### Ver estado de pending_users
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT email, otp_verified, checkout_completed, setup_completed FROM pending_users ORDER BY created_at DESC LIMIT 5"
```

### Estadísticas generales
```bash
npx wrangler d1 execute edificio_admin_db --remote --command="SELECT 
  (SELECT COUNT(*) FROM usuarios) as usuarios,
  (SELECT COUNT(*) FROM buildings) as buildings,
  (SELECT COUNT(*) FROM cuotas) as cuotas,
  (SELECT COUNT(*) FROM gastos) as gastos,
  (SELECT COUNT(*) FROM fondos) as fondos,
  (SELECT SUM(saldo) FROM fondos) as patrimonio_total"
```

---

## 📊 Resultados Esperados

### Después de Testing Completo

**Base de Datos:**
- 1 Building (Torre del Valle)
- 3+ Usuarios (1 Admin + usuarios creados)
- 50 Cuotas (generadas masivamente)
- 3 Gastos
- 3 Fondos (con transferencias)
- 2 Anuncios
- 1 Cierre
- Patrimonio total: $90,000 (ajustado por transferencias)

**APIs:**
- 45+ endpoints testeados
- Todos respondiendo 200 o códigos apropiados
- 0 errores 500 inesperados
- CORS funcionando
- JWT funcionando

**Frontend:**
- Todos los modales abren correctamente
- Todos los formularios validan
- Todas las listas cargan y filtran
- Navegación funciona sin loops
- No hay errores en console (excepto 404 de sourcemaps)

---

## ✅ Criterios de Aceptación

- [ ] **100% de screenshots capturados** (45 mínimo)
- [ ] **100% de endpoints testeados** (45+)
- [ ] **Console limpia** en todas las operaciones
- [ ] **DB queries exitosas** con datos correctos
- [ ] **Flujo completo** de onboarding funcional
- [ ] **CRUD completo** en todas las secciones
- [ ] **Validaciones** funcionando correctamente
- [ ] **No hay errores 500** inesperados
- [ ] **Datos del setup** se cargan correctamente (fondos, cuotas, configuración)

---

## 🐛 Reporte de Bugs

Para cada bug encontrado, documentar:

```markdown
### Bug #X: [Título descriptivo]

**Ubicación:** [URL y sección]
**Severidad:** Critical / High / Medium / Low
**Pasos para reproducir:**
1. 
2. 
3. 

**Resultado esperado:**

**Resultado actual:**

**Screenshot:**
[Adjuntar]

**Console log:**
[Adjuntar]

**DB state:**
[Query y resultado si aplica]
```

---

## 📝 Notas

- Todos los screenshots deben incluir la URL visible
- Console debe estar abierto en todos los screenshots
- Usar Ctrl+Shift+R entre pruebas para limpiar caché
- Documentar cualquier comportamiento inesperado
- Los códigos OTP expiran en 10 minutos

---

**Tester:** _________________  
**Fecha de inicio:** _________________  
**Fecha de fin:** _________________  
**Status:** ⬜ Pendiente | ⬜ En progreso | ⬜ Completado
