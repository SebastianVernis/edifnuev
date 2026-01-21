#!/bin/bash

# Configure environment variables for Cloud Run service
# Usage: ./scripts/deployment/setup-env-cloudrun.sh [PROJECT_ID] [REGION] [SERVICE_NAME]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID=${1:-""}
REGION=${2:-"us-central1"}
SERVICE_NAME=${3:-"edificio-admin"}

echo -e "${GREEN}⚙️  Edificio Admin - Environment Configuration${NC}"
echo "=============================================="

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: PROJECT_ID is required${NC}"
  echo "Usage: $0 PROJECT_ID [REGION] [SERVICE_NAME]"
  exit 1
fi

echo -e "${YELLOW}Service: $SERVICE_NAME${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Prompt for required variables
read -p "Enter JWT_SECRET (press Enter to generate random): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "Generated JWT_SECRET: $JWT_SECRET"
fi

read -p "Enter SMTP_HOST (e.g., smtp.gmail.com): " SMTP_HOST
read -p "Enter SMTP_PORT (default: 587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "Enter SMTP_USER: " SMTP_USER
read -s -p "Enter SMTP_PASS: " SMTP_PASS
echo ""

read -p "Enter SMTP_FROM (e.g., noreply@edificio-admin.com): " SMTP_FROM

read -p "Set SMTP_SECURE to false? (Y/n): " SMTP_SECURE_INPUT
if [ "$SMTP_SECURE_INPUT" = "n" ] || [ "$SMTP_SECURE_INPUT" = "N" ]; then
  SMTP_SECURE="true"
else
  SMTP_SECURE="false"
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format "value(status.url)" 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ]; then
  read -p "Service not deployed yet. Enter APP_URL manually: " APP_URL
else
  APP_URL="$SERVICE_URL"
  echo "Detected APP_URL: $APP_URL"
fi

# Update Cloud Run service with environment variables
echo ""
echo -e "${YELLOW}📤 Updating Cloud Run service...${NC}"

gcloud run services update "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --set-env-vars "\
NODE_ENV=production,\
PORT=8080,\
JWT_SECRET=$JWT_SECRET,\
APP_URL=$APP_URL,\
SMTP_HOST=$SMTP_HOST,\
SMTP_PORT=$SMTP_PORT,\
SMTP_SECURE=$SMTP_SECURE,\
SMTP_USER=$SMTP_USER,\
SMTP_PASS=$SMTP_PASS,\
SMTP_FROM=$SMTP_FROM"

echo ""
echo -e "${GREEN}✅ Environment variables configured successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Variables set:${NC}"
echo "  NODE_ENV=production"
echo "  PORT=8080"
echo "  JWT_SECRET=***"
echo "  APP_URL=$APP_URL"
echo "  SMTP_HOST=$SMTP_HOST"
echo "  SMTP_PORT=$SMTP_PORT"
echo "  SMTP_SECURE=$SMTP_SECURE"
echo "  SMTP_USER=$SMTP_USER"
echo "  SMTP_PASS=***"
echo "  SMTP_FROM=$SMTP_FROM"
echo ""
