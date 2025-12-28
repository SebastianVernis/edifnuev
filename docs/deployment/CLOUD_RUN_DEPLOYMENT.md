# Edificio Admin - Google Cloud Run Deployment Guide

Guía completa para desplegar Edificio Admin en Google Cloud Run.

## 📋 Requisitos Previos

### 1. Cuenta de Google Cloud Platform
- Crear una cuenta en [Google Cloud](https://cloud.google.com)
- Crear un nuevo proyecto o usar uno existente
- Habilitar facturación (Cloud Run tiene nivel gratuito generoso)

### 2. Instalar Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Descargar desde: https://cloud.google.com/sdk/docs/install
```

### 3. Autenticar gcloud
```bash
gcloud auth login
gcloud auth application-default login
```

## 🚀 Despliegue Rápido

### Opción 1: Script Automatizado (Recomendado)

```bash
# 1. Deploy completo
./scripts/deployment/deploy-cloudrun.sh YOUR_PROJECT_ID us-central1 edificio-admin

# 2. Configurar variables de entorno
./scripts/deployment/setup-env-cloudrun.sh YOUR_PROJECT_ID us-central1 edificio-admin
```

### Opción 2: Manual

#### Paso 1: Configurar Proyecto
```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export SERVICE_NAME="edificio-admin"

gcloud config set project $PROJECT_ID
```

#### Paso 2: Habilitar APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Paso 3: Build y Deploy
```bash
# Build imagen
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy a Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars NODE_ENV=production
```

#### Paso 4: Configurar Variables de Entorno
```bash
# Generar JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# Configurar variables
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --set-env-vars "\
NODE_ENV=production,\
PORT=8080,\
JWT_SECRET=$JWT_SECRET,\
APP_URL=https://your-service-url.run.app,\
SMTP_HOST=smtp.gmail.com,\
SMTP_PORT=587,\
SMTP_SECURE=false,\
SMTP_USER=your-email@gmail.com,\
SMTP_PASS=your-app-password,\
SMTP_FROM=noreply@edificio-admin.com"
```

## 📧 Configuración de Email (SMTP)

### Opción 1: Gmail con App Password

1. Habilitar autenticación de 2 factores en tu cuenta Gmail
2. Generar App Password: https://myaccount.google.com/apppasswords
3. Usar en variables de entorno:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Opción 2: SendGrid (Recomendado para Producción)

1. Crear cuenta en [SendGrid](https://sendgrid.com)
2. Crear API Key
3. Configurar:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Opción 3: Mailgun

1. Crear cuenta en [Mailgun](https://www.mailgun.com)
2. Verificar dominio
3. Configurar:
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## 🔒 Seguridad

### 1. Generar JWT Secret Seguro
```bash
# Generar secret aleatorio
openssl rand -base64 32

# O usar este comando más seguro
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Configurar Permisos IAM
```bash
# Permitir invocaciones sin autenticación (para app pública)
gcloud run services add-iam-policy-binding $SERVICE_NAME \
  --region=$REGION \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### 3. Configurar Cloud Armor (Opcional)
Para protección DDoS y rate limiting avanzado.

## 🌐 Configurar Dominio Personalizado

### Opción 1: Via Cloud Run
```bash
# Mapear dominio
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain yourdomain.com \
  --region $REGION

# Obtener registros DNS necesarios
gcloud run domain-mappings describe \
  --domain yourdomain.com \
  --region $REGION
```

### Opción 2: Via Cloud Load Balancer
Para SSL/TLS personalizado y CDN.

## 📊 Monitoreo

### Ver Logs
```bash
# Logs en tiempo real
gcloud run services logs tail $SERVICE_NAME --region=$REGION

# Logs recientes
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50
```

### Métricas
Acceder a Cloud Console > Cloud Run > Tu Servicio > Métricas

### Health Check
```bash
# Verificar health endpoint
curl https://your-service-url.run.app/api/validation/health
```

## 🔄 Actualizaciones

### Deploy Nueva Versión
```bash
# Rebuild y redeploy
./scripts/deployment/deploy-cloudrun.sh $PROJECT_ID $REGION $SERVICE_NAME
```

### Rollback
```bash
# Listar revisiones
gcloud run revisions list --service=$SERVICE_NAME --region=$REGION

# Revertir a revisión anterior
gcloud run services update-traffic $SERVICE_NAME \
  --region=$REGION \
  --to-revisions=REVISION_NAME=100
```

## 💰 Costos Estimados

Cloud Run usa modelo de pago por uso:

- **Nivel Gratuito (mensual):**
  - 2 millones de requests
  - 360,000 GB-segundos de memoria
  - 180,000 vCPU-segundos

- **Costo estimado post-gratuito:**
  - ~$0.24 por millón de requests adicionales
  - ~$0.0000025 por GB-segundo de memoria
  - ~$0.00001 por vCPU-segundo

**Ejemplo:** App con 10k usuarios/mes = ~$5-15/mes

## 🐛 Troubleshooting

### Problema: Build Falla
```bash
# Ver logs detallados
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Problema: Service No Responde
```bash
# Verificar estado
gcloud run services describe $SERVICE_NAME --region=$REGION

# Ver logs de errores
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=100
```

### Problema: Variables de Entorno
```bash
# Listar variables actuales
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env)"

# Actualizar variable específica
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --update-env-vars KEY=value
```

## 📚 Referencias

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Best Practices](https://cloud.google.com/run/docs/tips)
- [Security Guide](https://cloud.google.com/run/docs/securing/managing-access)

## 🎯 Checklist de Deployment

- [ ] Proyecto de GCP creado y configurado
- [ ] gcloud CLI instalado y autenticado
- [ ] APIs habilitadas (Cloud Build, Cloud Run, Container Registry)
- [ ] Dockerfile validado localmente
- [ ] Variables de entorno preparadas (especialmente JWT_SECRET y SMTP)
- [ ] Build y deploy exitoso
- [ ] Health check respondiendo correctamente
- [ ] Variables de entorno configuradas en Cloud Run
- [ ] Emails de prueba funcionando
- [ ] Login y funcionalidad básica verificada
- [ ] Logs monitoreados sin errores críticos
- [ ] Dominio personalizado configurado (opcional)
- [ ] Backup de data.json en lugar seguro
- [ ] Documentación de accesos actualizada

## 🆘 Soporte

Para problemas específicos de la aplicación, consultar:
- [Documentación técnica](../technical/PROYECTO_COMPLETO.md)
- [Guía de setup](../guides/INSTRUCCIONES_SETUP.md)
- [Índice maestro](../technical/INDICE_MAESTRO.md)
