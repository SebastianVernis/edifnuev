# Initial Concept

Sistema de Administración Edificio 205 - A complete web system for managing a 20-apartment building with budget management, fees, expenses, and user administration.

---

# Product Guide - Sistema de Administración Edificio 205

## Visión del Producto

Sistema de Administración Edificio 205 es una plataforma web integral diseñada para modernizar y simplificar la gestión administrativa y financiera de edificios residenciales. El sistema centraliza todas las operaciones críticas de administración, desde la planificación presupuestaria hasta el cálculo automático de cuotas mensuales, proporcionando transparencia total y reduciendo significativamente la carga administrativa manual.

## Usuarios Objetivo

### 1. Administradores del Edificio (ADMIN)
**Perfil:** Personal administrativo o empresa administradora responsable de la gestión completa del edificio.

**Necesidades:**
- Control total sobre todas las operaciones financieras del edificio
- Gestión completa de usuarios (crear, modificar, eliminar cuentas)
- Configuración del sistema y parámetros operativos
- Acceso a reportes detallados y análisis financiero
- Supervisión de todas las actividades del comité y residentes
- Capacidad de realizar cierres anuales y auditorías

**Casos de Uso Principales:**
- Crear y gestionar cuentas de residentes y miembros del comité
- Configurar presupuestos anuales y categorías de gastos
- Supervisar el estado financiero general del edificio
- Generar reportes para asambleas de propietarios
- Realizar cierres de ejercicio fiscal

### 2. Miembros del Comité (COMITE)
**Perfil:** Residentes elegidos para formar parte del comité de administración del edificio.

**Necesidades:**
- Gestión de gastos diarios y mensuales del edificio
- Aprobación y registro de pagos a proveedores
- Seguimiento del presupuesto y control de gastos
- Capacidad de subir comprobantes y documentación
- Acceso limitado pero suficiente para operaciones del día a día

**Casos de Uso Principales:**
- Registrar gastos mensuales con comprobantes
- Revisar y aprobar facturas de proveedores
- Monitorear el cumplimiento del presupuesto
- Consultar el estado de cuotas de residentes
- Generar reportes mensuales de gastos

### 3. Inquilinos/Residentes (INQUILINO)
**Perfil:** Propietarios o inquilinos de los departamentos del edificio.

**Necesidades:**
- Consulta transparente de su estado de cuenta
- Visualización del historial de pagos y cuotas
- Acceso a información sobre gastos del edificio
- Recepción de anuncios y comunicados importantes
- Comprensión clara de cómo se calculan sus cuotas

**Casos de Uso Principales:**
- Consultar saldo actual y cuotas pendientes
- Revisar historial de pagos realizados
- Ver detalle de gastos mensuales del edificio
- Leer anuncios y comunicados de la administración
- Descargar comprobantes de pago

## Objetivos del Sistema

### 1. Gestión Financiera Transparente
**Objetivo:** Proporcionar visibilidad completa y en tiempo real de todas las operaciones financieras del edificio.

**Beneficios:**
- Todos los gastos e ingresos están documentados y accesibles
- Trazabilidad completa de cada transacción
- Reportes detallados por categoría, período y tipo de gasto
- Reducción de dudas y conflictos entre residentes
- Facilita auditorías y rendición de cuentas

**Métricas de Éxito:**
- 100% de gastos registrados con comprobantes
- Tiempo de generación de reportes < 5 segundos
- Reducción de consultas sobre estado de cuenta en 70%

### 2. Cálculo Automatizado de Cuotas
**Objetivo:** Eliminar el trabajo manual y errores en el cálculo de cuotas mensuales para cada departamento.

**Beneficios:**
- Cálculo automático basado en gastos reales del mes
- Distribución equitativa según parámetros configurables
- Actualización en tiempo real al registrar gastos
- Generación automática de estados de cuenta
- Reducción de errores humanos a cero

**Métricas de Éxito:**
- Tiempo de cálculo de cuotas: < 1 segundo para 20 departamentos
- Precisión: 100% (cero errores de cálculo)
- Reducción de tiempo administrativo: 90%

### 3. Comunicación Eficiente
**Objetivo:** Facilitar la comunicación entre administración, comité y residentes de manera organizada.

**Beneficios:**
- Canal centralizado para anuncios importantes
- Notificaciones de cuotas vencidas
- Información accesible 24/7 desde cualquier dispositivo
- Reducción de comunicación por otros medios (email, WhatsApp)
- Historial de comunicaciones disponible

**Métricas de Éxito:**
- Tasa de lectura de anuncios > 80%
- Reducción de consultas repetitivas en 60%
- Tiempo de respuesta a consultas < 24 horas

## Características Principales

### 1. Sistema de Presupuestos Anuales

**Descripción:** Módulo completo para la planificación y seguimiento de presupuestos anuales del edificio.

**Funcionalidades:**
- Creación de presupuesto anual con múltiples categorías
- Asignación de montos por categoría (mantenimiento, servicios, reservas, etc.)
- Seguimiento en tiempo real del gasto vs. presupuesto
- Alertas cuando una categoría supera el 80% del presupuesto
- Comparación año a año de presupuestos
- Ajustes y modificaciones con registro de cambios

**Flujo de Trabajo:**
1. ADMIN crea presupuesto anual al inicio del ejercicio
2. Define categorías y montos asignados
3. Sistema valida y activa el presupuesto
4. Durante el año, gastos se registran contra categorías
5. Dashboard muestra consumo en tiempo real
6. Al cierre, se genera reporte de ejecución presupuestaria

### 2. Gestión de Gastos Mensuales

**Descripción:** Sistema robusto para el registro, aprobación y seguimiento de todos los gastos del edificio.

**Funcionalidades:**
- Registro de gastos con información completa (monto, fecha, proveedor, categoría)
- Subida de comprobantes (facturas, recibos) en formato imagen o PDF
- Categorización automática según presupuesto
- Flujo de aprobación (COMITE registra, ADMIN aprueba si es necesario)
- Búsqueda y filtrado avanzado de gastos
- Exportación de reportes en múltiples formatos
- Vinculación de gastos a cuotas mensuales

**Validaciones:**
- Monto debe ser positivo y razonable
- Fecha no puede ser futura
- Categoría debe existir en presupuesto
- Comprobante es obligatorio para gastos > $X
- Usuario debe tener permisos según rol

### 3. Cierres Anuales Automáticos

**Descripción:** Proceso automatizado de cierre de ejercicio fiscal que consolida toda la información del año.

**Funcionalidades:**
- Cierre automático al finalizar el año fiscal
- Consolidación de todos los gastos e ingresos
- Generación de balance anual
- Cálculo de saldos finales por departamento
- Transferencia de saldos al nuevo ejercicio
- Generación de reportes para asamblea anual
- Archivo histórico de ejercicios cerrados
- Bloqueo de modificaciones en períodos cerrados

**Proceso de Cierre:**
1. Sistema verifica que todos los gastos estén registrados
2. Calcula totales por categoría y departamento
3. Genera reporte de ejecución presupuestaria
4. Identifica saldos pendientes de cobro
5. Crea snapshot del estado financiero
6. Prepara sistema para nuevo ejercicio
7. Notifica a ADMIN para revisión final
8. Ejecuta cierre tras aprobación

## Experiencia de Usuario

### Dashboards Personalizados por Rol

**Principio de Diseño:** Cada usuario ve exactamente la información que necesita según su rol, sin sobrecarga de datos irrelevantes.

#### Dashboard ADMIN
**Contenido:**
- Resumen financiero general (ingresos, gastos, saldo)
- Gráficos de ejecución presupuestaria
- Lista de cuotas pendientes de cobro
- Actividad reciente del sistema
- Accesos rápidos a funciones administrativas
- Alertas y notificaciones importantes

**Acciones Rápidas:**
- Crear nuevo usuario
- Registrar gasto
- Generar reporte
- Ver estado de cuotas
- Gestionar presupuesto

#### Dashboard COMITE
**Contenido:**
- Resumen de gastos del mes actual
- Estado del presupuesto por categoría
- Últimos gastos registrados
- Cuotas calculadas para el mes
- Accesos a funciones de gestión diaria

**Acciones Rápidas:**
- Registrar nuevo gasto
- Subir comprobante
- Ver presupuesto
- Consultar cuotas
- Generar reporte mensual

#### Dashboard INQUILINO
**Contenido:**
- Estado de cuenta personal
- Cuotas pendientes y pagadas
- Últimos gastos del edificio
- Anuncios recientes
- Historial de pagos

**Acciones Rápidas:**
- Ver detalle de cuota actual
- Descargar comprobante
- Ver historial completo
- Leer anuncios
- Contactar administración

### Principios de Diseño UX

1. **Claridad sobre Complejidad:** Interfaces limpias que priorizan la información más importante
2. **Feedback Inmediato:** Confirmaciones visuales claras para todas las acciones
3. **Prevención de Errores:** Validaciones en tiempo real y mensajes de ayuda contextuales
4. **Consistencia:** Patrones de diseño uniformes en todo el sistema
5. **Accesibilidad:** Diseño que funciona para usuarios con diferentes niveles de experiencia técnica

## Seguridad y Confiabilidad

### 1. Control de Acceso Basado en Roles (RBAC)

**Implementación:**
- Sistema de tres roles con permisos claramente definidos
- Validación de permisos en cada endpoint del API
- Tokens JWT con expiración para sesiones seguras
- Middleware de autenticación en todas las rutas protegidas

**Matriz de Permisos:**

| Funcionalidad | ADMIN | COMITE | INQUILINO |
|--------------|-------|--------|-----------|
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Crear presupuesto | ✅ | ❌ | ❌ |
| Registrar gastos | ✅ | ✅ | ❌ |
| Ver gastos | ✅ | ✅ | ✅ (limitado) |
| Calcular cuotas | ✅ | ✅ | ❌ |
| Ver cuotas propias | ✅ | ✅ | ✅ |
| Ver cuotas de otros | ✅ | ✅ | ❌ |
| Realizar cierre anual | ✅ | ❌ | ❌ |
| Crear anuncios | ✅ | ✅ | ❌ |
| Ver anuncios | ✅ | ✅ | ✅ |

### 2. Auditoría y Trazabilidad

**Registro de Auditoría:**
- Todas las operaciones críticas se registran en log de auditoría
- Información capturada: usuario, acción, timestamp, datos modificados, IP
- Logs inmutables (no se pueden modificar o eliminar)
- Retención de logs por período configurable (mínimo 2 años)

**Eventos Auditados:**
- Creación, modificación y eliminación de usuarios
- Registro y modificación de gastos
- Creación y modificación de presupuestos
- Cálculo de cuotas
- Cierres anuales
- Cambios de configuración del sistema
- Intentos de acceso no autorizado

**Reportes de Auditoría:**
- Búsqueda y filtrado de eventos por fecha, usuario, tipo
- Exportación de logs para auditorías externas
- Dashboard de actividad sospechosa
- Alertas automáticas para eventos críticos

### 3. Backups Automáticos

**Estrategia de Respaldo:**
- Backups automáticos diarios de la base de datos
- Retención: 7 días diarios, 4 semanales, 12 mensuales
- Almacenamiento en ubicación separada del servidor principal
- Verificación automática de integridad de backups
- Proceso de restauración documentado y probado

**Contenido de Backup:**
- Base de datos completa (data.json)
- Archivos subidos (comprobantes, documentos)
- Configuración del sistema
- Logs de auditoría

**Procedimiento de Recuperación:**
1. Identificar punto de restauración deseado
2. Detener servicios del sistema
3. Restaurar backup seleccionado
4. Verificar integridad de datos
5. Reiniciar servicios
6. Validar funcionamiento
7. Notificar a usuarios

## Métricas de Éxito del Producto

### Métricas de Adopción
- Tasa de uso activo: > 90% de usuarios registrados
- Frecuencia de acceso: Mínimo 2 veces por semana (ADMIN/COMITE)
- Tiempo promedio de sesión: 5-10 minutos

### Métricas de Eficiencia
- Tiempo de cálculo de cuotas: < 1 segundo
- Tiempo de generación de reportes: < 5 segundos
- Reducción de tiempo administrativo: 80-90%
- Reducción de errores de cálculo: 100%

### Métricas de Satisfacción
- Satisfacción de usuarios: > 4.5/5
- Reducción de consultas repetitivas: > 60%
- Tasa de resolución de problemas: > 95%
- NPS (Net Promoter Score): > 50

### Métricas Técnicas
- Disponibilidad del sistema: > 99.5%
- Tiempo de respuesta promedio: < 200ms
- Tasa de errores: < 0.1%
- Cobertura de tests: > 80%

## Roadmap y Evolución

### Fase Actual (Operacional)
- ✅ Sistema completo funcionando en producción
- ✅ 20 usuarios activos
- ✅ Código limpio y estandarizado
- ✅ Suite de tests completa
- ✅ Documentación técnica

### Próximas Mejoras (Corto Plazo)
- [ ] Implementación de HTTPS con certificado SSL
- [ ] Dominio personalizado
- [ ] Notificaciones por email
- [ ] Exportación de reportes a PDF
- [ ] Gráficos interactivos mejorados

### Evolución Futura (Medio/Largo Plazo)
- [ ] App móvil nativa (iOS/Android)
- [ ] Integración con pasarelas de pago
- [ ] Sistema de reservas de espacios comunes
- [ ] Chat interno entre usuarios
- [ ] Módulo de mantenimiento preventivo
- [ ] Multi-edificio (gestión de múltiples propiedades)
- [ ] API pública para integraciones

## Conclusión

El Sistema de Administración Edificio 205 representa una solución moderna y completa para la gestión de edificios residenciales. Al combinar automatización inteligente, transparencia financiera total y una experiencia de usuario cuidadosamente diseñada, el sistema no solo simplifica las tareas administrativas sino que también mejora la confianza y comunicación entre todos los actores involucrados en la administración del edificio.

El enfoque en seguridad, confiabilidad y escalabilidad asegura que el sistema pueda crecer y adaptarse a las necesidades cambiantes de la comunidad, manteniendo siempre los más altos estándares de calidad y servicio.
