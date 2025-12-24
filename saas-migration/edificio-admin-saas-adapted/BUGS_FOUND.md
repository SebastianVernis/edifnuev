# Bugs Encontrados - Testing Visual Edificio Admin SaaS

## Bug #1: Entorno de Pruebas No Configurado para Acceso a Base de Datos

**Ubicación:** Entorno de ejecución de pruebas automatizadas.
**Severidad:** Critical

**Pasos para reproducir:**

1.  Intentar ejecutar cualquier comando de `npx wrangler d1 execute` en el entorno de pruebas.
2.  Ejemplo: `npx wrangler d1 execute edificio_admin_db --remote --command="SELECT * FROM usuarios"`
3.  Observar el error devuelto por la herramienta.

**Resultado esperado:**

El comando debería ejecutarse correctamente, devolviendo los resultados de la consulta a la base de datos `edificio_admin_db`.

**Resultado actual:**

El comando falla con el siguiente error:
`In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.`

**Impacto:**

Este bug es **crítico** y bloquea la ejecución de la gran mayoría de los casos de prueba definidos en `TESTING_CHECKLIST.md`. Específicamente:
-   **Limpieza de la DB:** No se puede limpiar la base de datos antes de las pruebas.
-   **Obtención de OTP:** El flujo de onboarding no puede completarse porque es imposible obtener el código OTP de la base de datos.
-   **Validación de Datos:** No se puede verificar que los datos se hayan guardado correctamente tras ninguna operación (onboarding, CRUDs).
-   **Login:** El login falla porque el usuario de prueba no puede ser creado, y no se puede verificar su existencia.
-   **Pruebas del Admin Panel:** Todas las pruebas del panel de administración son inviables, ya que dependen de un estado inicial en la base de datos y de la creación/modificación de entidades.

**Recomendación:**

Configurar la variable de entorno `CLOUDFLARE_API_TOKEN` en el entorno de pruebas con un token válido que tenga los permisos necesarios para acceder y modificar la base de datos D1. Sin esta configuración, no es posible realizar un testing visual o funcional completo del sistema.
