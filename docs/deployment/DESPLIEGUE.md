# 🚀 Guía de Despliegue

## Enlaces Rápidos

- **[Inicio Rápido en 5 Minutos](docs/deployment/QUICK_START_CLOUD_RUN.md)** - Despliegue en Cloud Run en 5 minutos.
- **[Guía Completa de Cloud Run](docs/deployment/DESPLIEGUE_CLOUD_RUN.md)** - Documentación completa de despliegue.
- **[Lista de Verificación de Despliegue](docs/deployment/LISTA_VERIFICACION_DESPLIEGUE.md)** - Verificación pre-despliegue.
- **[Guía General de Despliegue](docs/guides/GUIA_DESPLIEGUE.md)** - Despliegue en VPS/Servidor.

## Opciones de Despliegue

### 🌩️ Google Cloud Run (Recomendado)

**Ideal para:** Producción, escalado automático, serverless.

```bash
./scripts/deployment/deploy-cloudrun.sh TU_PROJECT_ID
./scripts/deployment/setup-env-cloudrun.sh TU_PROJECT_ID
```

**Ventajas:**
- Escalado automático (de 0 a N instancias).
- Pago por uso (solo cuando está en ejecución).
- Infraestructura gestionada.
- HTTPS incluido.
- Reversiones (rollbacks) fáciles.

**Costo:** ~$5-15/mes para un uso típico.

[→ Guía Completa](docs/deployment/DESPLIEGUE_CLOUD_RUN.md)

### 🖥️ VPS / Servidor Tradicional

**Ideal para:** Control total, infraestructura existente.

```bash
# En tu servidor
git clone repo
cd edificio-admin
npm install
npm start

# Con PM2
npm install -g pm2
pm2 start config/ecosystem.config.js
```

[→ Guía Completa](docs/guides/GUIA_DESPLIEGUE.md)

### 🐳 Docker

**Ideal para:** Entornos consistentes, Kubernetes.

```bash
docker build -t edificio-admin .
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e JWT_SECRET=tu-secreto \
  edificio-admin
```

### 🔥 Cloudflare Pages

**Despliegue actual:** https://production.chispartbuilding.pages.dev

Vea la configuración existente de Cloudflare en `docs/cloudflare/`.

## Variables de Entorno

Variables requeridas para todos los despliegues:

```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=tu-secreto-aleatorio-de-32-caracteres
APP_URL=https://tu-dominio.com

# SMTP (elija un proveedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
SMTP_FROM=noreply@tudominio.com
```

Vea [.env.production.example](../.env.production.example) para la lista completa.

## Lista de Verificación Pre-Despliegue

- [ ] Todas las pruebas pasando (`npm test`).
- [ ] Variables de entorno preparadas.
- [ ] JWT_SECRET generado de forma segura.
- [ ] SMTP configurado y probado.
- [ ] Backup de data.json creado (si aplica).
- [ ] Documentación revisada.

[→ Lista de Verificación Completa](docs/deployment/LISTA_VERIFICACION_DESPLIEGUE.md)

## Post-Despliegue

1. **Verificar endpoint de salud:**
   ```bash
   curl https://tu-dominio.com/api/validation/health
   ```

2. **Probar inicio de sesión:**
   - Navegue a su URL.
   - Inicie sesión con credenciales de administrador.
   - Verifique que todas las funciones operen correctamente.

3. **Monitorear logs:**
   - Busque errores.
   - Verifique el envío de correos electrónicos.
   - Monitoree el rendimiento.

4. **Configurar monitoreo:**
   - Configure alertas.
   - Configure el monitoreo de tiempo de actividad (uptime).
   - Revise las métricas.

## Soporte

- **Problemas de Inicio Rápido:** Ver [QUICK_START_CLOUD_RUN.md](docs/deployment/QUICK_START_CLOUD_RUN.md#-problemas-comunes)
- **Problemas Técnicos:** Ver [Solución de problemas](docs/deployment/DESPLIEGUE_CLOUD_RUN.md#-troubleshooting)
- **GitHub Issues:** [Reportar un error](https://github.com/SebastianVernisMora/edificio-admin/issues)

---

**¿Necesita ayuda?** Comience con el [Inicio Rápido en 5 minutos](docs/deployment/QUICK_START_CLOUD_RUN.md)
