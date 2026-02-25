#!/bin/bash
# =============================================================================
# Mirror complet du site bey-library.vercel.app
# Utilise wget en mode miroir pour telecharger tout le site statique
# =============================================================================

set -euo pipefail

SITE_URL="https://bey-library.vercel.app"
OUTPUT_DIR="./bey-library-mirror"
LOG_FILE="./bey-library-mirror.log"
USER_AGENT="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

echo "============================================"
echo "  Mirror de $SITE_URL"
echo "============================================"
echo ""

# Verifier que wget est installe
if ! command -v wget &> /dev/null; then
    echo "ERREUR: wget n'est pas installe."
    echo "Installez-le avec: sudo apt install wget"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Destination : $OUTPUT_DIR"
echo "Log         : $LOG_FILE"
echo ""
echo "Demarrage du telechargement..."
echo ""

wget \
    --mirror \
    --convert-links \
    --adjust-extension \
    --page-requisites \
    --no-parent \
    --directory-prefix="$OUTPUT_DIR" \
    --user-agent="$USER_AGENT" \
    --wait=1 \
    --random-wait \
    --timeout=30 \
    --tries=3 \
    --reject="*.woff2,*.woff,*.ttf,*.eot" \
    --execute robots=off \
    --no-check-certificate \
    -o "$LOG_FILE" \
    "$SITE_URL/" \
    || true

# =============================================================================
# Next.js SSR: wget --mirror ne suit pas les liens generes par le JS client.
# On crawl manuellement les pages de categories et produits.
# =============================================================================

CATEGORIES=(
    "/category/blade"
    "/category/over-blade"
    "/category/assist-blade"
    "/category/ratchet"
    "/category/bit"
    "/category/other"
    "/category/x-over"
    "/category/credits"
    "/random"
)

echo ""
echo "Telechargement des pages de categories..."

for path in "${CATEGORIES[@]}"; do
    echo "  -> $path"
    wget \
        --page-requisites \
        --convert-links \
        --adjust-extension \
        --directory-prefix="$OUTPUT_DIR" \
        --user-agent="$USER_AGENT" \
        --wait=0.5 \
        --timeout=30 \
        --tries=3 \
        --execute robots=off \
        --no-check-certificate \
        -a "$LOG_FILE" \
        "${SITE_URL}${path}" \
        || true
done

# =============================================================================
# Extraire tous les liens produits depuis les pages de categories deja telechargees
# =============================================================================

echo ""
echo "Extraction des liens produits depuis les pages telechargees..."

PRODUCT_LINKS_FILE=$(mktemp)

# Chercher les liens /product/ dans tous les fichiers HTML telecharges
grep -rhoP '(?:href|src)="(/product/[^"]+)"' "$OUTPUT_DIR" 2>/dev/null \
    | grep -oP '/product/[^"]+' \
    | sort -u \
    > "$PRODUCT_LINKS_FILE" || true

# Chercher aussi dans les fichiers JS (Next.js data)
grep -rhoP '"/product/[^"]+' "$OUTPUT_DIR" 2>/dev/null \
    | grep -oP '/product/[^"]+' \
    | sort -u \
    >> "$PRODUCT_LINKS_FILE" || true

# Dedupliquer
sort -u -o "$PRODUCT_LINKS_FILE" "$PRODUCT_LINKS_FILE"

TOTAL=$(wc -l < "$PRODUCT_LINKS_FILE")
echo "Trouve $TOTAL liens produits."

if [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "Telechargement des pages produits..."
    COUNT=0

    while IFS= read -r product_path; do
        COUNT=$((COUNT + 1))
        echo "  [$COUNT/$TOTAL] $product_path"
        wget \
            --page-requisites \
            --convert-links \
            --adjust-extension \
            --directory-prefix="$OUTPUT_DIR" \
            --user-agent="$USER_AGENT" \
            --wait=0.5 \
            --random-wait \
            --timeout=30 \
            --tries=3 \
            --execute robots=off \
            --no-check-certificate \
            -a "$LOG_FILE" \
            "${SITE_URL}${product_path}" \
            || true
    done < "$PRODUCT_LINKS_FILE"
fi

rm -f "$PRODUCT_LINKS_FILE"

# =============================================================================
# Deuxieme passe: re-extraire les liens depuis les nouvelles pages
# (au cas ou des pages produits menent a d'autres pages)
# =============================================================================

echo ""
echo "Deuxieme passe: recherche de liens supplementaires..."

EXTRA_LINKS_FILE=$(mktemp)

grep -rhoP 'href="(/[^"]*)"' "$OUTPUT_DIR" 2>/dev/null \
    | grep -oP '/[^"]+' \
    | grep -vE '\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$' \
    | sort -u \
    > "$EXTRA_LINKS_FILE" || true

EXTRA_TOTAL=$(wc -l < "$EXTRA_LINKS_FILE")
echo "Trouve $EXTRA_TOTAL liens supplementaires."

if [ "$EXTRA_TOTAL" -gt 0 ]; then
    COUNT=0
    while IFS= read -r extra_path; do
        # Verifier si la page existe deja
        LOCAL_PATH="$OUTPUT_DIR/bey-library.vercel.app${extra_path}"
        if [ -f "$LOCAL_PATH" ] || [ -f "${LOCAL_PATH}.html" ] || [ -f "${LOCAL_PATH}/index.html" ]; then
            continue
        fi

        COUNT=$((COUNT + 1))
        echo "  [extra $COUNT] $extra_path"
        wget \
            --page-requisites \
            --convert-links \
            --adjust-extension \
            --directory-prefix="$OUTPUT_DIR" \
            --user-agent="$USER_AGENT" \
            --wait=0.5 \
            --timeout=30 \
            --tries=2 \
            --execute robots=off \
            --no-check-certificate \
            -a "$LOG_FILE" \
            "${SITE_URL}${extra_path}" \
            || true
    done < "$EXTRA_LINKS_FILE"
fi

rm -f "$EXTRA_LINKS_FILE"

# =============================================================================
# Convertir les liens pour la navigation hors-ligne
# =============================================================================

echo ""
echo "Conversion finale des liens pour navigation hors-ligne..."

if command -v wget &> /dev/null; then
    wget \
        --convert-links \
        --directory-prefix="$OUTPUT_DIR" \
        --input-file=/dev/null \
        2>/dev/null || true
fi

# =============================================================================
# Rapport final
# =============================================================================

echo ""
echo "============================================"
echo "  Mirror termine!"
echo "============================================"

TOTAL_FILES=$(find "$OUTPUT_DIR" -type f 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1)

echo "  Fichiers telecharges : $TOTAL_FILES"
echo "  Taille totale        : $TOTAL_SIZE"
echo "  Dossier              : $OUTPUT_DIR"
echo "  Log complet          : $LOG_FILE"
echo ""
echo "Pour naviguer hors-ligne, ouvrez :"
echo "  $OUTPUT_DIR/bey-library.vercel.app/index.html"
echo ""
