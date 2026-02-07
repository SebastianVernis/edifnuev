# 🚀 Quick Start - Google Cloud Run Deployment

Guía de 5 minutos para desplegar Edificio Admin en Google Cloud Run.

## Prerequisitos

- Cuenta de Google Cloud Platform
- Proyecto GCP creado
- [gcloud CLI instalado](https://cloud.google.com/sdk/docs/install)

## Deploy en 3 Pasos

### 1️⃣ Preparación (2 minutos)

```bash
# Clonar y entrar al proyecto
git clone https://github.com/SebastianVernisMora/edificio-admin.git
cd edificio-admin

# Autenticar gcloud
gcloud auth login

# Configurar proyecto
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
```

### 2️⃣ Deploy Automatizado (3 minutos)

```bash
# Deploy completo con un comando
./scripts/deployment/deploy-cloudrun.sh $PROJECT_ID

# Esperar a que termine el build y deploy
# Output mostrará la URL del servicio
```

### 3️⃣ Configurar Variables (1 minuto)

```bash
# Opción A: Script interactivo (recomendado)
./scripts/deployment/setup-env-cloudrun.sh $PROJECT_ID

# Opción B: Manual
gcloud run services update edificio-admin \
  --region us-central1 \
  --set-env-vars "\
JWT_SECRET=$(openssl rand -base64 32),\
SMTP_HOST=smtp.gmail.com,\
SMTP_PORT=587,\
SMTP_USER=your-email@gmail.com,\
SMTP_PASS=your-app-password,\
SMTP_FROM=noreply@yourdomain.com"
```

## ✅ Verificación

```bash
# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe edificio-admin \
  --region us-central1 \
  --format "value(status.url)")

# Test health check
curl $SERVICE_URL/api/validation/health

# Debería retornar: {"status":"healthy",...}
```

## 🎯 Acceder a la Aplicación

1. **Abrir en navegador:** `https://your-service-url.run.app`
2. **Login con credenciales demo:**
   - Email: `admin@edificio.com`
   - Password: `admin123`

## 🔧 Configuración Rápida de Email

### Gmail con App Password

1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Genera password para "Mail"
3. Usa estos valores:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=generado-password-16-chars
   ```

### SendGrid (Mejor para producción)

1. Crear cuenta en [sendgrid.com](https://sendgrid.com)
2. Crear API Key
3. Usar estos valores:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=tu-api-key
   ```

## 📊 Monitoreo

```bash
# Ver logs en tiempo real
gcloud run services logs tail edificio-admin --region us-central1

# Ver últimos 100 logs
gcloud run services logs read edificio-admin --region us-central1 --limit 100
```

## 🔄 Actualizar Deploy

```bash
# Redeploy después de cambios en código
./scripts/deployment/deploy-cloudrun.sh $PROJECT_ID
```

## 💰 Costos

- **Nivel gratuito:** 2 millones requests/mes
- **Después:** ~$5-15/mes para app pequeña/mediana
- **Sin costo cuando no hay tráfico**

## ❓ Problemas Comunes

### Error: "Permission denied"
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:your-email@gmail.com" \
  --role="roles/owner"
```

### Error: "Service account does not exist"
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

### Email no funciona
- Verificar SMTP_USER y SMTP_PASS correctos
- Gmail: usar App Password, no password normal
- Verificar puerto (587 para TLS, 465 para SSL)

## 📚 Más Información

- [Guía completa de deployment](DESPLIEGUE_CLOUD_RUN.md)
- [Checklist de deployment](LISTA_VERIFICACION_DESPLIEGUE.md)
- [Documentación técnica](../technical/PROYECTO_COMPLETO.md)

## 🆘 Soporte

- Ver logs: `gcloud run services logs tail edificio-admin`
- Status: `gcloud run services describe edificio-admin`
- Issues: [GitHub Issues](https://github.com/SebastianVernisMora/edificio-admin/issues)

---

**¿Listo para producción?** Ver [LISTA_VERIFICACION_DESPLIEGUE.md](LISTA_VERIFICACION_DESPLIEGUE.md)
