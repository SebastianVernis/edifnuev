#!/bin/bash

# Script de despliegue unificado para Edificio Production
# Este script construye tanto el frontend como los workers y los despliega a Cloudflare.

set -e

echo "🚀 Iniciando despliegue de edificio-production..."

# 1. Construcción del proyecto
echo "📦 Construyendo proyecto..."
npm run build

# 2. Despliegue de Workers (Backend)
echo "🔧 Desplegando Cloudflare Workers..."
npx wrangler deploy --config wrangler.toml

# 3. Despliegue de Pages (Frontend)
echo "🌐 Desplegando Cloudflare Pages..."
# Nota: Usamos wrangler pages deploy para subir el directorio dist
npx wrangler pages deploy ./dist --project-name edificio-production

echo "✅ Despliegue completado con éxito!"
