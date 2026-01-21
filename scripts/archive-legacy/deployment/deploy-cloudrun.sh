#!/bin/bash

# Deploy to Google Cloud Run
# Usage: ./scripts/deployment/deploy-cloudrun.sh [PROJECT_ID] [REGION] [SERVICE_NAME]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PROJECT_ID=${1:-""}
REGION=${2:-"us-central1"}
SERVICE_NAME=${3:-"edificio-admin"}
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}🚀 Edificio Admin - Cloud Run Deployment${NC}"
echo "========================================="

# Validate PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: PROJECT_ID is required${NC}"
  echo "Usage: $0 PROJECT_ID [REGION] [SERVICE_NAME]"
  echo "Example: $0 my-gcp-project us-central1 edificio-admin"
  exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo "  Image: $IMAGE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
  echo "Visit: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Set project
echo -e "${YELLOW}🔧 Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com

# Build container image
echo -e "${YELLOW}🏗️  Building container image...${NC}"
gcloud builds submit --tag "$IMAGE_NAME" .

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production" \
  --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format "value(status.url)")

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "========================================="
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Set environment variables:"
echo "   gcloud run services update $SERVICE_NAME \\"
echo "     --region $REGION \\"
echo "     --set-env-vars JWT_SECRET=your-secret,SMTP_HOST=smtp.gmail.com,..."
echo ""
echo "2. Test the service:"
echo "   curl $SERVICE_URL/api/validation/health"
echo ""
echo "3. Configure custom domain (optional):"
echo "   gcloud run domain-mappings create --service $SERVICE_NAME --domain yourdomain.com"
echo ""
