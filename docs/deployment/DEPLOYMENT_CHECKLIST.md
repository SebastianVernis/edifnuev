# Edificio Admin - Deployment Checklist

Lista de verificación completa antes de desplegar a producción.

## 📋 Pre-Deployment

### Código y Estructura
- [ ] Código limpio sin console.logs innecesarios
- [ ] Sin archivos temporales o de prueba
- [ ] .gitignore actualizado
- [ ] Dependencies actualizadas (`npm audit`)
- [ ] Build exitoso (`npm run build`)
- [ ] Tests pasando (`npm test`)

### Configuración
- [ ] `.env` no incluido en repositorio
- [ ] `.env.example` actualizado con todas las variables
- [ ] Secrets generados de forma segura (JWT_SECRET)
- [ ] Variables de entorno documentadas
- [ ] Configuración SMTP verificada

### Seguridad
- [ ] JWT_SECRET seguro y aleatorio (min 32 caracteres)
- [ ] Passwords de admin cambiados de defaults
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Validación de inputs en todos los endpoints
- [ ] No hay credenciales hardcodeadas
- [ ] HTTPS configurado (en producción)

### Base de Datos
- [ ] data.json con datos iniciales correctos
- [ ] Backup de data.json creado
- [ ] Sistema de backups automáticos funcionando
- [ ] Permisos de archivos correctos

## 🐳 Docker / Cloud Run

### Archivos Docker
- [ ] Dockerfile validado
- [ ] .dockerignore configurado
- [ ] Multi-stage build optimizado
- [ ] Health check endpoint funcionando
- [ ] Usuario non-root configurado
- [ ] Build local exitoso

### Google Cloud Run
- [ ] Proyecto GCP creado
- [ ] APIs habilitadas (Cloud Build, Cloud Run, Container Registry)
- [ ] gcloud CLI instalado y configurado
- [ ] Facturación habilitada
- [ ] Región seleccionada
- [ ] Service name definido

### Variables de Entorno (Cloud Run)
- [ ] NODE_ENV=production
- [ ] PORT=8080
- [ ] JWT_SECRET configurado
- [ ] APP_URL con URL correcta
- [ ] SMTP_HOST configurado
- [ ] SMTP_PORT configurado
- [ ] SMTP_SECURE configurado
- [ ] SMTP_USER configurado
- [ ] SMTP_PASS configurado
- [ ] SMTP_FROM configurado

## 🚀 Deployment

### Build y Deploy
- [ ] Build de imagen exitoso
- [ ] Push a Container Registry exitoso
- [ ] Deploy a Cloud Run exitoso
- [ ] Service URL obtenida
- [ ] Variables de entorno configuradas
- [ ] Permisos IAM configurados

### Verificación Post-Deploy
- [ ] Service status: ACTIVE
- [ ] Health check responde: `/api/validation/health`
- [ ] Página principal carga: `/`
- [ ] Login funciona
- [ ] API endpoints responden correctamente
- [ ] Emails se envían correctamente
- [ ] Sin errores en logs
- [ ] Métricas mostrando tráfico

## 🧪 Testing en Producción

### Tests Funcionales
- [ ] Login con credenciales admin
- [ ] Login con credenciales propietario
- [ ] Crear gasto
- [ ] Crear presupuesto
- [ ] Ver cuotas
- [ ] Subir archivo (anuncio)
- [ ] Cambiar password
- [ ] Cerrar sesión

### Tests de Email
- [ ] Email de bienvenida
- [ ] Email de reset password
- [ ] Email de invitación
- [ ] Email de notificación

### Performance
- [ ] Tiempo de respuesta < 1s
- [ ] Cold start < 3s
- [ ] Memoria uso normal < 300MB
- [ ] Sin memory leaks

## 🌐 Dominio y DNS

### Configuración (Opcional)
- [ ] Dominio registrado
- [ ] DNS configurado
- [ ] SSL/TLS configurado
- [ ] Domain mapping en Cloud Run
- [ ] Certificados válidos
- [ ] Redirección www funcionando

## 📊 Monitoreo

### Logging
- [ ] Logs accesibles en Cloud Console
- [ ] Log level apropiado (info/warn/error)
- [ ] Sin información sensible en logs
- [ ] Structured logging configurado

### Alertas
- [ ] Alertas de error rate configuradas
- [ ] Alertas de downtime configuradas
- [ ] Alertas de latencia configuradas
- [ ] Notificaciones configuradas

### Métricas
- [ ] Dashboard de métricas accesible
- [ ] Request count visible
- [ ] Latency metrics visible
- [ ] Error rate visible
- [ ] Container instance count visible

## 📚 Documentación

### Actualizada
- [ ] README.md con instrucciones deployment
- [ ] CHANGELOG.md actualizado
- [ ] Guía de deployment específica
- [ ] Variables de entorno documentadas
- [ ] Troubleshooting guide actualizada
- [ ] Credenciales de acceso documentadas (seguras)

### Accesos
- [ ] URL de producción documentada
- [ ] Credenciales admin seguras y documentadas
- [ ] Acceso a Cloud Console documentado
- [ ] Runbook de operaciones creado

## 🔄 Rollback Plan

### Preparación
- [ ] Comando de rollback documentado
- [ ] Revisión anterior identificada
- [ ] Proceso de rollback probado
- [ ] Contacto de soporte definido

### Comandos Útiles
```bash
# Rollback
gcloud run services update-traffic SERVICE_NAME \
  --region REGION \
  --to-revisions PREVIOUS_REVISION=100

# Ver revisiones
gcloud run revisions list --service SERVICE_NAME --region REGION
```

## 💾 Backup y Recuperación

### Backups
- [ ] Backup manual de data.json antes de deploy
- [ ] Backups automáticos configurados
- [ ] Backup en ubicación segura (GCS/S3)
- [ ] Proceso de restauración documentado
- [ ] Proceso de restauración probado

## 🎯 Go-Live

### Pre-Launch
- [ ] Todos los checks anteriores completados
- [ ] Stakeholders notificados
- [ ] Ventana de mantenimiento programada (si aplica)
- [ ] Equipo de soporte disponible

### Launch
- [ ] Deploy ejecutado
- [ ] Verificación post-deploy completada
- [ ] Monitoreo activo
- [ ] Sin errores críticos

### Post-Launch
- [ ] Monitorear por 24 horas
- [ ] Verificar métricas de uso
- [ ] Revisar logs por errores
- [ ] Recopilar feedback de usuarios

## 📞 Contactos de Emergencia

```
Desarrollador: [NOMBRE] - [EMAIL] - [TELÉFONO]
DevOps: [NOMBRE] - [EMAIL] - [TELÉFONO]
Soporte GCP: https://cloud.google.com/support
```

## 🆘 Troubleshooting Rápido

### Service no responde
```bash
# Check status
gcloud run services describe SERVICE_NAME --region REGION

# View logs
gcloud run services logs tail SERVICE_NAME --region REGION
```

### Errors en logs
```bash
# Ver últimos errores
gcloud run services logs read SERVICE_NAME --region REGION | grep ERROR
```

### Variables incorrectas
```bash
# Actualizar variable
gcloud run services update SERVICE_NAME \
  --region REGION \
  --update-env-vars KEY=value
```

---

**Última actualización:** 2025-12-28
**Versión:** 2.0.0
