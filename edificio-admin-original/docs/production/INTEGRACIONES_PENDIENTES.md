# 🔌 Integraciones Pendientes - Edificio Admin

**Fecha:** 12 de Diciembre, 2025  
**Estado Sistema:** 67% Completo  
**Prioridad:** Preparación para Producción

---

## 📊 Resumen Ejecutivo

| Categoría | Total | Completo | Pendiente | % Completo |
|-----------|-------|----------|-----------|------------|
| **Módulos Frontend** | 12 | 8 | 4 | 67% |
| **Backend APIs** | 13 | 13 | 0 | 100% |
| **Integraciones Externas** | 5 | 1 | 4 | 20% |
| **Funcionalidades Core** | 20 | 16 | 4 | 80% |

---

## 🔴 CRÍTICO - Módulos Frontend Pendientes

### 1. Presupuestos 🔴 ALTA PRIORIDAD
**Estado:** 50% Completo  
**Tiempo Estimado:** 8-10 horas  
**Prioridad:** 🔴 CRÍTICA

#### Backend ✅ 100%
```
✅ src/controllers/presupuestos.controller.js
✅ src/routes/presupuestos.routes.js
✅ src/models/Presupuesto.js
```

#### Frontend ❌ 50% - INCOMPLETO
```
⚠️ public/js/modules/presupuestos/presupuestos.js (Existe pero básico)
```

#### Funcionalidades Pendientes
- [ ] **Interfaz de Lista**
  - [ ] Tabla de presupuestos con filtros
  - [ ] Ordenamiento por columnas
  - [ ] Paginación
  - [ ] Búsqueda rápida

- [ ] **Formulario Crear/Editar**
  - [ ] Campos: año, categoría, monto asignado
  - [ ] Validaciones en tiempo real
  - [ ] Desglose por categorías de gasto
  - [ ] Distribución mensual opcional

- [ ] **Vista de Ejecución**
  - [ ] Comparativa presupuesto vs gasto real
  - [ ] Porcentaje de ejecución por categoría
  - [ ] Barra de progreso visual
  - [ ] Semáforo (verde/amarillo/rojo)

- [ ] **Alertas y Notificaciones**
  - [ ] Alerta cuando se excede 80% del presupuesto
  - [ ] Alerta crítica al exceder 100%
  - [ ] Proyección de agotamiento

- [ ] **Reportes y Gráficos**
  - [ ] Gráfico de ejecución presupuestaria (Chart.js)
  - [ ] Comparativa año actual vs anterior
  - [ ] Desglose por categoría (pie chart)
  - [ ] Exportación a PDF/Excel

- [ ] **Vinculación Automática**
  - [ ] Actualización automática al registrar gastos
  - [ ] Cálculo de presupuesto disponible
  - [ ] Historial de movimientos

#### APIs Backend Disponibles
```javascript
GET    /api/presupuestos              # Listar presupuestos
POST   /api/presupuestos              # Crear presupuesto
GET    /api/presupuestos/:id          # Obtener presupuesto
PUT    /api/presupuestos/:id          # Actualizar presupuesto
DELETE /api/presupuestos/:id          # Eliminar presupuesto
GET    /api/presupuestos/:id/ejecucion # Estado de ejecución
```

#### Dependencias
- ✅ Backend completo
- ✅ Sistema de gastos (para vincular)
- ✅ Sistema de fondos (para categorías)
- ⚠️ Chart.js (verificar si está incluido)

---

### 2. Cierres Contables 🔴 ALTA PRIORIDAD
**Estado:** 65% Completo  
**Tiempo Estimado:** 6-8 horas  
**Prioridad:** 🔴 CRÍTICA

#### Backend ✅ 100%
```
✅ src/controllers/cierres.controller.js (Lógica robusta)
✅ src/routes/cierres.routes.js
✅ src/models/Cierre.js (Modelo completo)
```

#### Frontend ⚠️ 65% - PARCIAL
```
⚠️ public/js/modules/cierres/cierres-init.js (Estructura básica)
⚠️ public/js/modules/cierres/cierres-enhanced.js (Parcial)
```

#### Funcionalidades Pendientes
- [ ] **Interfaz de Lista**
  - [ ] Tabla de cierres históricos
  - [ ] Filtro por año/mes
  - [ ] Estado de cierre (abierto/cerrado)
  - [ ] Acciones (ver, descargar)

- [ ] **Formulario Generar Cierre**
  - [ ] Selector de período (mes/año)
  - [ ] Vista previa de datos
  - [ ] Validaciones pre-cierre
  - [ ] Confirmación de cierre (irreversible)

- [ ] **Resumen Financiero**
  - [ ] Total ingresos del período
  - [ ] Total egresos del período
  - [ ] Balance (ingresos - egresos)
  - [ ] Saldo de fondos al cierre
  - [ ] Cuotas cobradas vs pendientes

- [ ] **Generación Automática**
  - [ ] Cálculo automático de totales
  - [ ] Validación de cuotas del mes
  - [ ] Validación de gastos registrados
  - [ ] Verificación de parcialidades
  - [ ] Snapshot de estado financiero

- [ ] **Visualizaciones**
  - [ ] Gráfico ingresos vs egresos
  - [ ] Comparativa con mes anterior
  - [ ] Comparativa con mismo mes año anterior
  - [ ] Tendencias (últimos 6 meses)
  - [ ] Indicadores de salud financiera

- [ ] **Reportes**
  - [ ] Exportación a PDF profesional
  - [ ] Desglose detallado de ingresos
  - [ ] Desglose detallado de egresos
  - [ ] Estado de cuenta por departamento
  - [ ] Firma digital (opcional)

- [ ] **Vista Detallada**
  - [ ] Modal con información completa
  - [ ] Listado de transacciones
  - [ ] Notas del cierre
  - [ ] Auditoría de cambios

#### APIs Backend Disponibles
```javascript
GET    /api/cierres                   # Listar cierres
POST   /api/cierres                   # Generar cierre
GET    /api/cierres/:id               # Obtener cierre
GET    /api/cierres/periodo/:mes/:año # Cierre por período
GET    /api/cierres/:id/reporte       # Generar reporte PDF
```

#### Dependencias
- ✅ Backend completo
- ✅ Sistema de cuotas
- ✅ Sistema de gastos
- ✅ Sistema de fondos
- ⚠️ jsPDF (para exportación PDF)
- ⚠️ Chart.js (para gráficos)

---

### 3. Anuncios 🟡 PRIORIDAD MEDIA
**Estado:** 60% Completo  
**Tiempo Estimado:** 5-7 horas  
**Prioridad:** 🟡 MEDIA

#### Backend ✅ 100%
```
✅ src/controllers/anuncios.controller.js
✅ src/routes/anuncios.routes.js
✅ src/models/Anuncio.js
✅ Upload de imágenes implementado (multer)
```

#### Frontend ⚠️ 60% - ESTRUCTURA BÁSICA
```
⚠️ public/js/modules/anuncios/anuncios-init.js (Estructura básica)
❌ public/js/modules/anuncios/anuncios.js.backup (Deshabilitado)
```

#### Funcionalidades Pendientes
- [ ] **Interfaz de Lista** (Admin)
  - [ ] Cards o tabla de anuncios
  - [ ] Filtros: fecha, tipo, estado
  - [ ] Ordenamiento
  - [ ] Vista previa compacta
  - [ ] Acciones rápidas (editar, eliminar, archivar)

- [ ] **Formulario Crear/Editar**
  - [ ] Campo título (obligatorio)
  - [ ] Editor de texto enriquecido (WYSIWYG)
    - Negrita, cursiva, listas
    - Links
    - Formato de texto
  - [ ] Selector de tipo de anuncio
    - General
    - Urgente
    - Reunión
    - Mantenimiento
  - [ ] Selector de prioridad (normal, alta)
  - [ ] Campo fecha de evento (opcional)
  - [ ] Upload de imagen
  - [ ] Vista previa en tiempo real

- [ ] **Vista Inquilino**
  - [ ] Feed de anuncios recientes
  - [ ] Filtro por tipo
  - [ ] Marcadores de "no leído"
  - [ ] Contador de anuncios nuevos
  - [ ] Vista expandida de anuncio

- [ ] **Notificaciones**
  - [ ] Badge de anuncios no leídos
  - [ ] Notificación en navegación
  - [ ] Marcar como leído
  - [ ] (Futuro: Email/SMS)

- [ ] **Gestión Avanzada**
  - [ ] Programación de publicación futura
  - [ ] Fecha de expiración
  - [ ] Archivar anuncios antiguos
  - [ ] Destacar anuncios importantes
  - [ ] Anclaje de anuncios (sticky)

- [ ] **Estadísticas**
  - [ ] Quién ha leído el anuncio
  - [ ] Número de vistas
  - [ ] Tasa de lectura

#### APIs Backend Disponibles
```javascript
GET    /api/anuncios                  # Listar anuncios
POST   /api/anuncios                  # Crear anuncio
GET    /api/anuncios/:id              # Obtener anuncio
PUT    /api/anuncios/:id              # Actualizar anuncio
DELETE /api/anuncios/:id              # Eliminar anuncio
POST   /api/anuncios/:id/imagen       # Upload imagen
POST   /api/anuncios/:id/marcar-leido # Marcar como leído
```

#### Dependencias
- ✅ Backend completo con upload
- ⚠️ TinyMCE o Quill.js (editor WYSIWYG)
- ⚠️ Sistema de notificaciones (a implementar)

---

### 4. Configuración General 🟡 PRIORIDAD MEDIA
**Estado:** 70% Completo  
**Tiempo Estimado:** 4-6 horas  
**Prioridad:** 🟡 MEDIA

#### Backend ✅ 100%
```
✅ Integrado en usuarios.controller.js
✅ Integrado en permisos.controller.js
✅ Sistema funcional
```

#### Frontend ⚠️ 70% - FUNCIONAL PERO MEJORABLE
```
⚠️ Integrado en public/js/modules/usuarios/usuarios.js
⚠️ Integrado en public/js/modules/permisos/permisos.js
❌ Sin tabs de organización
```

#### Funcionalidades Pendientes
- [ ] **Organización en Tabs**
  - [ ] Tab "Usuarios" (ya existe pero separado)
  - [ ] Tab "Permisos" (ya existe pero separado)
  - [ ] Tab "Configuración General"
  - [ ] Tab "Parámetros del Sistema"

- [ ] **Mejoras UX Usuarios**
  - [ ] Confirmación antes de eliminar
  - [ ] Vista previa de cambios de rol
  - [ ] Bulk actions (múltiples usuarios)
  - [ ] Exportar lista de usuarios

- [ ] **Mejoras UX Permisos**
  - [ ] Tooltips explicativos por permiso
  - [ ] Plantillas de permisos predefinidas
  - [ ] Comparador de roles
  - [ ] Vista previa de impacto

- [ ] **Configuración General** (Nueva)
  - [ ] Nombre del edificio
  - [ ] Dirección
  - [ ] Logo (upload)
  - [ ] Colores del tema
  - [ ] Moneda
  - [ ] Timezone

- [ ] **Parámetros del Sistema** (Nueva)
  - [ ] Día de vencimiento de cuotas
  - [ ] Porcentaje de recargo por mora
  - [ ] Días de gracia
  - [ ] Monto de cuota base
  - [ ] Email de contacto
  - [ ] Teléfono de contacto

- [ ] **Búsqueda y Filtros**
  - [ ] Búsqueda rápida en usuarios
  - [ ] Búsqueda rápida en permisos
  - [ ] Filtros avanzados

#### Dependencias
- ✅ Backend completo
- ✅ Módulos de usuarios y permisos funcionales
- ⚠️ SweetAlert2 (para confirmaciones elegantes)

---

## 🔌 Integraciones Externas Pendientes

### 1. Servicio de Email 🔴 ALTA PRIORIDAD
**Estado:** ❌ No Implementado  
**Tiempo Estimado:** 4-6 horas  
**Prioridad:** 🔴 ALTA

#### Casos de Uso
- **Recordatorios de Pago**
  - Email 7 días antes del vencimiento
  - Email el día del vencimiento
  - Email de mora (cuota vencida)

- **Notificaciones de Anuncios**
  - Email cuando se publica anuncio importante
  - Resumen semanal de anuncios

- **Gestión de Solicitudes**
  - Email de confirmación al crear solicitud
  - Email cuando cambia estado de solicitud
  - Email de respuesta del admin

- **Usuarios**
  - Email de bienvenida
  - Email de cambio de contraseña
  - Email de recuperación de contraseña

#### Proveedores Sugeridos
1. **SendGrid** (Recomendado)
   - Free tier: 100 emails/día
   - API simple
   - Templates profesionales

2. **Mailgun**
   - Free tier: 5,000 emails/mes
   - Buena entregabilidad

3. **AWS SES**
   - Muy económico
   - Requiere AWS account

4. **Resend** (Moderno)
   - Developer-friendly
   - Free tier generoso

#### Implementación Sugerida
```javascript
// Backend: src/utils/emailService.js
import sgMail from '@sendgrid/mail';

export const enviarRecordatorioPago = async (usuario, cuota) => {
  const msg = {
    to: usuario.email,
    from: 'noreply@edificio205.com',
    subject: 'Recordatorio: Cuota Mensual Próxima a Vencer',
    html: templateRecordatorio(usuario, cuota)
  };
  await sgMail.send(msg);
};
```

#### Tareas
- [ ] Elegir proveedor
- [ ] Crear cuenta y API key
- [ ] Implementar servicio email
- [ ] Crear templates
- [ ] Integrar con cuotas
- [ ] Integrar con anuncios
- [ ] Integrar con solicitudes
- [ ] Testing

---

### 2. Servicio de SMS (Opcional) 🟡 BAJA PRIORIDAD
**Estado:** ❌ No Implementado  
**Tiempo Estimado:** 3-4 horas  
**Prioridad:** 🟡 BAJA (Opcional)

#### Casos de Uso
- Alertas urgentes (cuota vencida)
- Código de verificación 2FA (futuro)
- Notificaciones críticas

#### Proveedores Sugeridos
1. **Twilio**
2. **Vonage (Nexmo)**
3. **AWS SNS**

#### Implementación
- [ ] Solo si el presupuesto lo permite
- [ ] Empezar con emails
- [ ] SMS como upgrade futuro

---

### 3. Gateway de Pagos (Futuro) 🟢 FUTURO
**Estado:** ❌ No Implementado  
**Tiempo Estimado:** 20-30 horas  
**Prioridad:** 🟢 FUTURO (No crítico)

#### Objetivo
Permitir que inquilinos paguen cuotas en línea

#### Opciones
1. **Stripe**
   - Internacional
   - Excelente API
   - Comisiones competitivas

2. **PayPal**
   - Ampliamente aceptado
   - API robusta

3. **Mercado Pago**
   - Popular en LATAM
   - Buena integración local

#### Alcance
- [ ] Fase 1: Registro manual de pagos (ACTUAL) ✅
- [ ] Fase 2: Links de pago
- [ ] Fase 3: Checkout integrado
- [ ] Fase 4: Suscripciones automáticas

---

### 4. Cloud Storage 🟡 MEDIA PRIORIDAD
**Estado:** ⚠️ Local Storage (Funcional)  
**Tiempo Estimado:** 4-6 horas  
**Prioridad:** 🟡 MEDIA

#### Estado Actual
```
✅ Multer configurado
✅ Upload local en /uploads/anuncios/
⚠️ No escalable para producción
```

#### Migración Sugerida
1. **Cloudflare R2** (Recomendado)
   - Compatible con S3
   - Sin costos de egress
   - Económico

2. **AWS S3**
   - Estándar de industria
   - Altamente confiable

3. **Backblaze B2**
   - Muy económico
   - Compatible con S3

#### Implementación
```javascript
// Backend: src/middleware/upload.js
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const s3 = new S3Client({...});
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'edificio-admin',
    key: (req, file, cb) => {...}
  })
});
```

#### Tareas
- [ ] Elegir proveedor
- [ ] Crear bucket
- [ ] Configurar credenciales
- [ ] Migrar código de upload
- [ ] Migrar archivos existentes
- [ ] Testing

---

### 5. Sistema de Notificaciones Push (Futuro) 🟢 FUTURO
**Estado:** ❌ No Implementado  
**Tiempo Estimado:** 8-12 horas  
**Prioridad:** 🟢 FUTURO

#### Objetivo
Notificaciones en tiempo real en el navegador

#### Tecnología
- Firebase Cloud Messaging (FCM)
- Web Push API
- Service Workers

#### Casos de Uso
- Nuevo anuncio publicado
- Solicitud respondida
- Recordatorio de pago

#### Implementación
- [ ] Fase 1: Notificaciones email ✅
- [ ] Fase 2: Badges en app ⚠️ (Parcial)
- [ ] Fase 3: Web push notifications
- [ ] Fase 4: App móvil (muy futuro)

---

## 📊 Priorización de Trabajo

### Sprint 1: Funcionalidades Críticas (2 semanas)
**Objetivo:** Completar módulos contables

1. **Presupuestos** (8-10h)
   - Interfaz completa
   - Formularios
   - Gráficos básicos
   - Vinculación con gastos

2. **Cierres Contables** (6-8h)
   - Interfaz de lista
   - Generación automática
   - Reportes básicos
   - Exportación PDF

**Total:** 14-18 horas

### Sprint 2: Comunicación (1 semana)
**Objetivo:** Completar anuncios y configuración

3. **Anuncios** (5-7h)
   - Interfaz completa
   - Editor WYSIWYG
   - Sistema de notificaciones básico

4. **Configuración** (4-6h)
   - Tabs organizadas
   - Mejoras UX
   - Parámetros sistema

**Total:** 9-13 horas

### Sprint 3: Integraciones (1.5 semanas)
**Objetivo:** Email y storage

5. **Email Service** (4-6h)
   - Integración SendGrid
   - Templates
   - Recordatorios

6. **Cloud Storage** (4-6h)
   - Migración a R2/S3
   - Actualizar upload

**Total:** 8-12 horas

---

## 📋 Checklist de Completitud

### Por Módulo
Cada módulo pendiente debe cumplir:

- [ ] **Frontend**
  - [ ] Interfaz completa y responsive
  - [ ] Formularios con validación
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Confirmaciones de acciones

- [ ] **Integración**
  - [ ] Conectado a API backend
  - [ ] Manejo de errores de API
  - [ ] Feedback visual al usuario
  - [ ] Actualización de datos en tiempo real

- [ ] **UX/UI**
  - [ ] Diseño consistente
  - [ ] Accesibilidad básica
  - [ ] Responsive design
  - [ ] Tooltips/ayuda

- [ ] **Testing**
  - [ ] Tests unitarios
  - [ ] Tests de integración
  - [ ] Testing manual completo

- [ ] **Documentación**
  - [ ] Código documentado
  - [ ] README actualizado
  - [ ] Guía de usuario

---

## 🎯 Métricas de Éxito

### Objetivo Final
- ✅ 12/12 módulos completos (100%)
- ✅ 5/5 integraciones externas (100%)
- ✅ Tests >90% cobertura
- ✅ Documentación completa

### Milestone 1 (Sprint 1)
- ✅ 10/12 módulos (83%)
- ⚠️ Sistema funcional para contabilidad

### Milestone 2 (Sprint 2)
- ✅ 12/12 módulos (100%)
- ✅ Sistema completo frontend

### Milestone 3 (Sprint 3)
- ✅ 3/5 integraciones (60%)
- ✅ Email y storage funcionando

---

## 📞 Próximos Pasos

1. **Revisar y Aprobar** este documento
2. **Asignar Recursos** para cada sprint
3. **Crear Issues** en GitHub por cada tarea
4. **Iniciar Sprint 1** - Presupuestos y Cierres
5. **Daily Standups** para seguimiento
6. **Demo** al final de cada sprint

---

**Documento preparado por:** BLACKBOX.AI Assistant  
**Fecha:** 12 de Diciembre, 2025  
**Versión:** 1.0  
**Próxima revisión:** Después de Sprint 1
