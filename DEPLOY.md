# 🚀 Deployment Guide

## Quick Links

- **[5-Min Quick Start](docs/deployment/QUICK_START_CLOUD_RUN.md)** - Deploy to Cloud Run in 5 minutes
- **[Complete Cloud Run Guide](docs/deployment/CLOUD_RUN_DEPLOYMENT.md)** - Full deployment documentation
- **[Deployment Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
- **[General Deployment Guide](docs/guides/GUIA_DESPLIEGUE.md)** - VPS/Server deployment

## Deployment Options

### 🌩️ Google Cloud Run (Recommended)

**Best for:** Production, auto-scaling, serverless

```bash
./scripts/deployment/deploy-cloudrun.sh YOUR_PROJECT_ID
./scripts/deployment/setup-env-cloudrun.sh YOUR_PROJECT_ID
```

**Pros:**
- Auto-scaling (0 to N instances)
- Pay per use (only when running)
- Managed infrastructure
- HTTPS included
- Easy rollbacks

**Cost:** ~$5-15/month for typical usage

[→ Full Guide](docs/deployment/CLOUD_RUN_DEPLOYMENT.md)

### 🖥️ VPS / Traditional Server

**Best for:** Full control, existing infrastructure

```bash
# On your server
git clone repo
cd edificio-admin
npm install
npm start

# With PM2
npm install -g pm2
pm2 start config/ecosystem.config.js
```

[→ Full Guide](docs/guides/GUIA_DESPLIEGUE.md)

### 🐳 Docker

**Best for:** Consistent environments, Kubernetes

```bash
docker build -t edificio-admin .
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  edificio-admin
```

### 🔥 Cloudflare Pages

**Current deployment:** https://smartbuilding.pages.dev

See existing Cloudflare configuration in `docs/cloudflare/`

## Environment Variables

Required variables for all deployments:

```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-random-32-char-secret
APP_URL=https://your-domain.com

# SMTP (choose one provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

See [.env.production.example](.env.production.example) for complete list.

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Environment variables prepared
- [ ] JWT_SECRET generated securely
- [ ] SMTP configured and tested
- [ ] Backup of data.json created
- [ ] Documentation reviewed

[→ Complete Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md)

## Post-Deployment

1. **Verify health endpoint:**
   ```bash
   curl https://your-domain.com/api/validation/health
   ```

2. **Test login:**
   - Navigate to your URL
   - Login with admin credentials
   - Verify all features work

3. **Monitor logs:**
   - Check for errors
   - Verify email sending
   - Monitor performance

4. **Setup monitoring:**
   - Configure alerts
   - Setup uptime monitoring
   - Review metrics

## Support

- **Quick Start Issues:** See [QUICK_START_CLOUD_RUN.md](docs/deployment/QUICK_START_CLOUD_RUN.md#-problemas-comunes)
- **Technical Issues:** See [Troubleshooting](docs/deployment/CLOUD_RUN_DEPLOYMENT.md#-troubleshooting)
- **GitHub Issues:** [Report a bug](https://github.com/SebastianVernisMora/edificio-admin/issues)

---

**Need help?** Start with the [5-minute Quick Start](docs/deployment/QUICK_START_CLOUD_RUN.md)
