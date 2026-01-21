#!/bin/bash

# Restaurar archivos visuales del commit 40af88f (ChispartBuilding branded)
COMMIT="40af88f"
BASE_PATH="saas-migration/edificio-admin-saas-adapted/public"

echo "🔄 Restaurando archivos visuales desde commit $COMMIT"
echo ""

# Archivos a restaurar
files=(
  "index.html:index.html"
  "registro.html:register.html"
  "verificar-otp.html:verify-otp.html"
  "checkout.html:checkout.html"
  "setup-edificio.html:setup.html"
  "admin.html:admin.html"
  "admin-optimized.html:admin-optimized.html"
)

for mapping in "${files[@]}"; do
  src="${mapping%%:*}"
  dst="${mapping##*:}"
  
  echo "📄 $src → $dst"
  git show "$COMMIT:$BASE_PATH/$src" > "public/$dst.tmp" 2>/dev/null
  
  if [ -s "public/$dst.tmp" ]; then
    # Agregar config.js antes de </head>
    sed -i '/<\/head>/i \  <script src="/config.js"><\/script>' "public/$dst.tmp"
    mv "public/$dst.tmp" "public/$dst"
    echo "   ✅ Restaurado ($(wc -l < public/$dst) líneas)"
  else
    rm -f "public/$dst.tmp"
    echo "   ⏭️  No encontrado en commit"
  fi
  echo ""
done

echo "✅ Restauración completa"
