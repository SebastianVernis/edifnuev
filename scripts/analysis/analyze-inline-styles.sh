#!/bin/bash

# Inline Styles Analysis Script
# Analiza archivos HTML para encontrar estilos inline

echo "=== Inline Styles Analysis Script ==="
echo ""
echo "Analizando archivos HTML para estilos inline..."
echo ""

# Contar estilos inline por archivo
echo "📊 Estilos inline por archivo:"
echo ""

for file in /home/sebastianvernis/Proyectos/edifnuev/public/*.html; do
    count=$(grep -o 'style="[^"]*"' "$file" | wc -l)
    if [ $count -gt 0 ]; then
        filename=$(basename "$file")
        echo "$filename: $count estilos inline"
    fi
done

echo ""
echo "📈 Total de estilos inline encontrados:"
grep -r 'style="[^"]*"' /home/sebastianvernis/Proyectos/edifnuev/public/*.html | wc -l
echo ""

echo "🔍 Patrones más comunes:"
echo ""
grep -rho 'style="[^"]*"' /home/sebastianvernis/Proyectos/edifnuev/public/*.html | sort | uniq -c | sort -rn | head -10
echo ""

echo "✅ Análisis completado"
