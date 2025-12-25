# Product Guidelines - Sistema de Administración Edificio 205

## Introducción

Este documento establece las directrices de producto para el Sistema de Administración Edificio 205. Define el estilo de comunicación, principios de diseño visual, tono de voz y estándares de experiencia de usuario que deben mantenerse consistentes en todo el sistema.

---

## 1. Estilo de Comunicación

### Tono de Voz: Profesional y Accesible

El sistema debe comunicarse con un tono que equilibre profesionalismo con accesibilidad:

- **Profesional:** Transmite confianza y seriedad en el manejo de información financiera
- **Claro:** Usa lenguaje simple y directo, evitando jerga técnica innecesaria
- **Respetuoso:** Trata a todos los usuarios con cortesía, independientemente de su rol
- **Útil:** Proporciona información accionable y orientación cuando sea necesario

### Principios de Redacción

#### ✅ Hacer:
- Usar lenguaje claro y directo
- Proporcionar contexto cuando sea necesario
- Usar términos consistentes en todo el sistema
- Incluir ejemplos cuando ayude a la comprensión
- Ser específico en mensajes de error y éxito

#### ❌ Evitar:
- Jerga técnica compleja sin explicación
- Mensajes ambiguos o vagos
- Tono condescendiente o infantil
- Humor que pueda malinterpretarse
- Lenguaje demasiado formal o burocrático

### Ejemplos de Mensajes

**Mensajes de Éxito:**
- ✅ "Gasto registrado correctamente. La cuota mensual se actualizará automáticamente."
- ❌ "Operación exitosa." (muy vago)
- ❌ "¡Genial! Tu gasto ha sido guardado en la base de datos." (demasiado informal)

**Mensajes de Error:**
- ✅ "El monto debe ser mayor a $0. Por favor, ingresa un valor válido."
- ❌ "Error: Invalid input." (técnico, no traducido)
- ❌ "¡Ups! Algo salió mal." (no específico)

**Mensajes de Confirmación:**
- ✅ "¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer."
- ❌ "¿Eliminar?" (falta contexto)
- ❌ "¿Realmente quieres hacer esto? Piénsalo bien." (tono inadecuado)

---

## 2. Identidad Visual

### Paleta de Colores

#### Colores Principales
- **Azul Corporativo (#2563eb):** Color principal para elementos de navegación, botones primarios y encabezados
- **Gris Oscuro (#1f2937):** Texto principal y elementos de alta jerarquía
- **Blanco (#ffffff):** Fondos principales y espacios de contenido

#### Colores Funcionales
- **Verde Éxito (#10b981):** Confirmaciones, estados positivos, cuotas pagadas
- **Rojo Alerta (#ef4444):** Errores, advertencias críticas, cuotas vencidas
- **Amarillo Advertencia (#f59e0b):** Alertas moderadas, información importante
- **Azul Información (#3b82f6):** Mensajes informativos, tooltips

#### Colores de Rol
- **ADMIN - Púrpura (#8b5cf6):** Identifica funciones y áreas exclusivas de administrador
- **COMITE - Naranja (#f97316):** Identifica funciones del comité
- **INQUILINO - Verde (#059669):** Identifica áreas de inquilinos

### Tipografía

#### Fuentes
- **Principal:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Monoespaciada:** "Courier New", monospace (para números, códigos)

#### Jerarquía Tipográfica
- **H1 (Títulos Principales):** 2rem (32px), font-weight: 700
- **H2 (Secciones):** 1.5rem (24px), font-weight: 600
- **H3 (Subsecciones):** 1.25rem (20px), font-weight: 600
- **Body (Texto Normal):** 1rem (16px), font-weight: 400
- **Small (Texto Secundario):** 0.875rem (14px), font-weight: 400

### Espaciado y Layout

#### Principios de Espaciado
- **Consistencia:** Usar múltiplos de 4px para todos los espaciados (4, 8, 12, 16, 24, 32, 48, 64)
- **Respiración:** Dar espacio suficiente entre elementos para evitar sensación de saturación
- **Agrupación:** Elementos relacionados deben estar más cerca entre sí que de elementos no relacionados

#### Grid System
- **Contenedor Principal:** Max-width 1280px, centrado
- **Columnas:** Sistema de 12 columnas con gutters de 24px
- **Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## 3. Componentes de Interfaz

### Botones

#### Tipos de Botones
1. **Primario:** Acción principal en una pantalla (ej: "Guardar", "Crear")
   - Color: Azul corporativo
   - Uso: Máximo 1 por pantalla

2. **Secundario:** Acciones alternativas importantes
   - Color: Gris con borde
   - Uso: Acciones complementarias

3. **Destructivo:** Acciones irreversibles o peligrosas
   - Color: Rojo
   - Uso: Eliminar, cancelar operaciones críticas

4. **Texto:** Acciones terciarias o de navegación
   - Color: Azul texto
   - Uso: Enlaces, acciones menores

#### Estados de Botones
- **Normal:** Estado por defecto
- **Hover:** Ligero cambio de color/sombra
- **Active:** Presionado
- **Disabled:** Opacidad 50%, cursor not-allowed
- **Loading:** Spinner + texto "Procesando..."

### Formularios

#### Campos de Entrada
- **Label:** Siempre visible, encima del campo
- **Placeholder:** Ejemplo del formato esperado
- **Helper Text:** Instrucciones adicionales debajo del campo
- **Validación:** En tiempo real después del primer blur
- **Mensajes de Error:** Específicos, debajo del campo, color rojo

#### Validaciones
- **Requerido:** Indicar con asterisco (*) en el label
- **Formato:** Validar en tiempo real (email, números, fechas)
- **Rango:** Indicar valores mínimos/máximos permitidos
- **Feedback:** Inmediato y específico

### Tablas

#### Estructura
- **Header:** Fondo gris claro, texto bold
- **Filas:** Alternadas con fondo blanco/gris muy claro
- **Hover:** Resaltar fila al pasar el mouse
- **Acciones:** Columna derecha con iconos/botones

#### Funcionalidades
- **Ordenamiento:** Clickear en headers para ordenar
- **Filtros:** Disponibles en la parte superior
- **Paginación:** Mostrar 10/25/50/100 registros por página
- **Búsqueda:** Campo de búsqueda global

### Modales y Diálogos

#### Uso Apropiado
- **Confirmaciones:** Acciones destructivas o importantes
- **Formularios Cortos:** Crear/editar elementos simples
- **Información Adicional:** Detalles que no caben en la vista principal

#### Estructura
- **Overlay:** Fondo oscuro semi-transparente
- **Contenedor:** Centrado, max-width 600px
- **Header:** Título claro + botón cerrar (X)
- **Body:** Contenido principal
- **Footer:** Botones de acción (alineados a la derecha)

### Notificaciones y Alertas

#### Tipos
1. **Toast (Temporal):** Mensajes breves que desaparecen automáticamente
   - Posición: Esquina superior derecha
   - Duración: 3-5 segundos
   - Uso: Confirmaciones, errores no críticos

2. **Alert (Persistente):** Mensajes que requieren atención
   - Posición: Parte superior de la sección relevante
   - Duración: Hasta que el usuario la cierre
   - Uso: Advertencias importantes, errores críticos

3. **Banner (Informativo):** Información general del sistema
   - Posición: Parte superior de la página
   - Duración: Persistente hasta resolución
   - Uso: Mantenimiento programado, actualizaciones

---

## 4. Experiencia de Usuario (UX)

### Principios Fundamentales

#### 1. Claridad sobre Complejidad
- Priorizar la información más importante
- Ocultar complejidad innecesaria detrás de opciones avanzadas
- Usar progressive disclosure para funciones complejas

#### 2. Consistencia
- Mantener patrones de interacción uniformes
- Usar los mismos componentes para las mismas funciones
- Ubicar elementos comunes en lugares predecibles

#### 3. Feedback Inmediato
- Confirmar todas las acciones del usuario
- Mostrar estados de carga para operaciones largas
- Indicar claramente el resultado de cada acción

#### 4. Prevención de Errores
- Validar datos antes de enviar
- Deshabilitar acciones no disponibles
- Pedir confirmación para acciones destructivas
- Proporcionar valores por defecto sensatos

#### 5. Recuperación de Errores
- Mensajes de error claros y específicos
- Sugerir cómo corregir el problema
- Mantener los datos ingresados cuando sea posible
- Proporcionar opciones de deshacer cuando sea apropiado

### Flujos de Usuario Optimizados

#### Registro de Gasto (Flujo Crítico)
1. Click en "Nuevo Gasto"
2. Formulario con campos mínimos visibles
3. Validación en tiempo real
4. Subida de comprobante (drag & drop)
5. Confirmación con resumen
6. Feedback de éxito + opción de registrar otro

#### Consulta de Estado de Cuenta (Inquilino)
1. Login → Dashboard
2. Estado de cuenta visible inmediatamente
3. Desglose claro de cuotas
4. Acceso rápido a historial
5. Opción de descargar comprobante

### Accesibilidad

#### Estándares WCAG 2.1 (Nivel AA)

**Contraste:**
- Texto normal: Mínimo 4.5:1
- Texto grande: Mínimo 3:1
- Elementos interactivos: Mínimo 3:1

**Navegación por Teclado:**
- Todos los elementos interactivos accesibles con Tab
- Orden lógico de tabulación
- Indicadores visuales claros de foco
- Shortcuts para acciones comunes

**Lectores de Pantalla:**
- Labels descriptivos en todos los campos
- Alt text en todas las imágenes
- ARIA labels donde sea necesario
- Estructura semántica HTML correcta

**Responsive Design:**
- Funcional en pantallas desde 320px de ancho
- Touch targets mínimo 44x44px en móvil
- Texto legible sin zoom (mínimo 16px)

---

## 5. Contenido y Copywriting

### Títulos y Encabezados

**Características:**
- Concisos (máximo 8 palabras)
- Descriptivos del contenido
- Usar capitalización de título (Title Case)
- Evitar puntos finales

**Ejemplos:**
- ✅ "Gestión de Gastos Mensuales"
- ✅ "Estado de Cuenta - Departamento 205"
- ❌ "Gastos" (muy vago)
- ❌ "Aquí puedes ver todos los gastos del edificio" (muy largo)

### Etiquetas de Campos (Labels)

**Características:**
- Claras y específicas
- Usar sustantivos o frases nominales
- Evitar preguntas
- Indicar unidades cuando sea relevante

**Ejemplos:**
- ✅ "Monto del Gasto ($)"
- ✅ "Fecha de Pago"
- ✅ "Categoría de Presupuesto"
- ❌ "¿Cuánto gastaste?" (pregunta)
- ❌ "Monto" (falta contexto de unidad)

### Mensajes de Ayuda (Helper Text)

**Características:**
- Breves y útiles
- Proporcionar ejemplos cuando sea posible
- Usar tono instructivo pero amable

**Ejemplos:**
- ✅ "Ejemplo: 15/12/2025"
- ✅ "El monto debe incluir IVA si aplica"
- ✅ "Formatos aceptados: JPG, PNG, PDF (máx. 5MB)"

### Mensajes de Error

**Estructura:**
1. Qué salió mal (específico)
2. Por qué ocurrió (si es relevante)
3. Cómo solucionarlo (acción clara)

**Ejemplos:**
- ✅ "El email ya está registrado. Intenta con otro email o recupera tu contraseña."
- ✅ "La fecha no puede ser futura. Selecciona una fecha de hoy o anterior."
- ❌ "Error 400: Bad Request" (técnico)
- ❌ "Algo salió mal" (no específico)

---

## 6. Iconografía

### Estilo de Iconos
- **Tipo:** Line icons (contorno)
- **Grosor:** 2px
- **Tamaño:** 20px, 24px, 32px (según contexto)
- **Color:** Heredar del texto o color específico según función

### Iconos Estándar del Sistema

| Función | Icono | Uso |
|---------|-------|-----|
| Crear/Agregar | ➕ Plus | Botones de creación |
| Editar | ✏️ Pencil | Modificar registros |
| Eliminar | 🗑️ Trash | Borrar elementos |
| Guardar | 💾 Save | Confirmar cambios |
| Cancelar | ✖️ X | Cerrar/cancelar |
| Buscar | 🔍 Search | Campos de búsqueda |
| Filtrar | 🔽 Filter | Opciones de filtrado |
| Descargar | ⬇️ Download | Exportar archivos |
| Subir | ⬆️ Upload | Cargar archivos |
| Ver | 👁️ Eye | Visualizar detalles |
| Configuración | ⚙️ Gear | Ajustes |
| Usuario | 👤 User | Perfil/cuenta |
| Dinero | 💰 Dollar | Transacciones |
| Calendario | 📅 Calendar | Fechas |
| Documento | 📄 Document | Archivos |
| Alerta | ⚠️ Warning | Advertencias |
| Éxito | ✅ Check | Confirmaciones |
| Error | ❌ X Circle | Errores |
| Info | ℹ️ Info | Información |

---

## 7. Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
/* Mobile: Base styles (< 640px) */
/* Tablet: 640px - 1024px */
@media (min-width: 640px) { ... }
/* Desktop: > 1024px */
@media (min-width: 1024px) { ... }
```

### Adaptaciones por Dispositivo

#### Mobile (< 640px)
- Navegación: Hamburger menu
- Tablas: Scroll horizontal o cards
- Formularios: 1 columna
- Botones: Full width
- Espaciado: Reducido (16px margins)

#### Tablet (640px - 1024px)
- Navegación: Tabs o sidebar colapsable
- Tablas: Scroll horizontal con columnas prioritarias
- Formularios: 1-2 columnas según complejidad
- Botones: Width automático
- Espaciado: Medio (24px margins)

#### Desktop (> 1024px)
- Navegación: Sidebar fijo o top nav completo
- Tablas: Todas las columnas visibles
- Formularios: 2-3 columnas
- Botones: Width automático
- Espaciado: Completo (32px margins)

---

## 8. Performance y Optimización

### Tiempos de Carga Objetivo
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Largest Contentful Paint:** < 2.5s

### Optimizaciones Requeridas
- Lazy loading de imágenes
- Minificación de CSS/JS
- Compresión de assets
- Caching apropiado
- Optimización de consultas a base de datos

### Indicadores de Carga
- Skeleton screens para contenido principal
- Spinners para acciones específicas
- Progress bars para operaciones largas
- Mensajes de estado para procesos en background

---

## 9. Localización e Internacionalización

### Idioma Principal
- **Español (es-MX):** Idioma principal del sistema

### Formato de Datos

#### Fechas
- **Formato:** DD/MM/YYYY
- **Ejemplo:** 24/12/2025
- **Librería:** Usar date-fns o similar para consistencia

#### Números
- **Separador decimal:** Punto (.)
- **Separador de miles:** Coma (,)
- **Ejemplo:** 1,234.56

#### Moneda
- **Símbolo:** $ (Peso mexicano)
- **Posición:** Antes del número
- **Formato:** $1,234.56
- **Decimales:** Siempre 2 dígitos

#### Horarios
- **Formato:** 24 horas
- **Ejemplo:** 14:30
- **Zona horaria:** America/Mexico_City

---

## 10. Mantenimiento de Guidelines

### Proceso de Actualización
1. Propuesta de cambio documentada
2. Revisión por equipo de desarrollo
3. Aprobación por stakeholders
4. Actualización de este documento
5. Comunicación a todo el equipo
6. Implementación gradual

### Versionado
- **Versión Actual:** 1.0
- **Última Actualización:** Diciembre 2025
- **Próxima Revisión:** Junio 2026

### Responsabilidades
- **Product Owner:** Aprobar cambios mayores
- **Equipo de Desarrollo:** Implementar y mantener consistencia
- **QA:** Verificar cumplimiento en nuevas features

---

## Conclusión

Estas guidelines aseguran que el Sistema de Administración Edificio 205 mantenga una experiencia consistente, profesional y accesible para todos sus usuarios. El cumplimiento de estos estándares es fundamental para el éxito del producto y la satisfacción de los usuarios.

Todos los miembros del equipo deben familiarizarse con estas directrices y consultarlas regularmente durante el desarrollo de nuevas funcionalidades o mejoras al sistema existente.
