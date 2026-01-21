#!/bin/bash

# Deploy Edificio Admin to Cloudflare Workers
# Usage: ./scripts/deployment/deploy-workers.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying Edificio Admin to Cloudflare Workers${NC}"
echo "================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo "Install: npm install -g wrangler"
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}📋 Checking authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please login to Cloudflare${NC}"
    wrangler login
fi

# Step 1: Create D1 database (if not exists)
echo -e "${YELLOW}📊 Setting up D1 database...${NC}"
echo "Run manually if needed:"
echo "  wrangler d1 create edificio-admin-db"
echo "  # Copy database_id to wrangler.toml"
echo ""

# Step 2: Run migrations
echo -e "${YELLOW}📝 To run migrations (after D1 setup):${NC}"
echo "  wrangler d1 migrations apply edificio-admin-db --local"
echo "  wrangler d1 migrations apply edificio-admin-db --remote"
echo ""

# Step 3: Create KV namespace (if not exists)
echo -e "${YELLOW}💾 Setting up KV namespace...${NC}"
echo "Run manually if needed:"
echo "  wrangler kv:namespace create KV"
echo "  # Copy id to wrangler.toml"
echo ""

# Step 4: Create R2 bucket (if not exists)
echo -e "${YELLOW}📦 Setting up R2 bucket...${NC}"
echo "Run manually if needed:"
echo "  wrangler r2 bucket create edificio-admin-uploads"
echo ""

# Step 5: Deploy to Workers
echo -e "${YELLOW}🚀 Deploying Worker...${NC}"

# Deploy with wrangler
wrangler deploy

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo "================================================="
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo ""
echo "1. Configure secrets:"
echo "   wrangler secret put JWT_SECRET"
echo "   wrangler secret put SMTP_HOST"
echo "   wrangler secret put SMTP_USER"
echo "   wrangler secret put SMTP_PASS"
echo ""
echo "2. Update wrangler.toml with:"
echo "   - D1 database_id"
echo "   - KV namespace id"
echo ""
echo "3. Run migrations:"
echo "   wrangler d1 migrations apply edificio-admin-db --remote"
echo ""
echo "4. Test your worker:"
echo "   curl https://edificio-admin.YOUR_SUBDOMAIN.workers.dev/api/validation/health"
echo ""
echo "5. Configure custom domain (optional):"
echo "   wrangler pages domains add yourdomain.com"
echo ""
