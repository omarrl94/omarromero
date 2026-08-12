#!/usr/bin/env bash
#
# Despliegue de Hipster Bingo en Netlify desde la terminal.
#
#   npm run deploy            → publica en producción
#   npm run deploy:preview    → publica una URL de preview (no toca producción)
#
# El script es idempotente: puedes ejecutarlo tantas veces como quieras.
# La primera vez pedirá login y creará el sitio; las siguientes, solo
# compila y sube.
#
set -euo pipefail

# ── Estilo de salida ────────────────────────────────────────────
BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
YELLOW=$'\033[33m'; CYAN=$'\033[36m'; RESET=$'\033[0m'

step()  { printf '\n%s▸ %s%s\n' "$BOLD$CYAN" "$1" "$RESET"; }
ok()    { printf '%s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn()  { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
fail()  { printf '\n%s✗ %s%s\n\n' "$RED$BOLD" "$1" "$RESET" >&2; exit 1; }

PREVIEW=false
if [[ "${1:-}" == "--preview" ]]; then
  PREVIEW=true
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NETLIFY="npx --yes netlify-cli@latest"
ENV_FILE=".env.local"

printf '\n%s🎵 Hipster Bingo → Netlify%s\n' "$BOLD" "$RESET"
printf '%s%s%s\n' "$DIM" "$ROOT" "$RESET"

# ── 1. Requisitos ───────────────────────────────────────────────
step "Comprobando requisitos"

command -v node >/dev/null 2>&1 || fail "No se encuentra Node.js. Instálalo desde https://nodejs.org (versión 18 o superior)."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 18 )); then
  fail "Necesitas Node.js 18 o superior (tienes la $NODE_MAJOR). Actualiza desde https://nodejs.org"
fi
ok "Node.js $(node -v)"

# ── 2. Credenciales de Supabase ─────────────────────────────────
step "Credenciales de Supabase"

# Lee un valor de .env.local sin ejecutar el archivo.
read_env_value() {
  local key="$1" line
  [[ -f "$ENV_FILE" ]] || return 1
  line="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" | tail -1 || true)"
  [[ -n "$line" ]] || return 1
  line="${line#*=}"
  line="${line#\"}"; line="${line%\"}"
  line="${line#\'}"; line="${line%\'}"
  printf '%s' "$line"
}

url_is_valid() { [[ "$1" =~ ^https://.+ ]] && [[ "$1" != *"TU-PROYECTO"* ]]; }
key_is_valid() { (( ${#1} >= 30 )) && [[ "$1" != *"tu-anon-key"* ]]; }

SUPABASE_URL="$(read_env_value NEXT_PUBLIC_SUPABASE_URL || true)"
SUPABASE_KEY="$(read_env_value NEXT_PUBLIC_SUPABASE_ANON_KEY || true)"

if url_is_valid "${SUPABASE_URL:-}" && key_is_valid "${SUPABASE_KEY:-}"; then
  ok "Leídas de $ENV_FILE"
else
  printf '%s\n' "$DIM"
  printf 'Necesito las dos claves de tu proyecto Supabase.\n'
  printf 'Las encuentras en: Project Settings → API\n'
  printf '(Plan gratuito, sin base de datos ni tablas.)%s\n\n' "$RESET"

  while ! url_is_valid "${SUPABASE_URL:-}"; do
    read -rp "  Project URL (https://xxxx.supabase.co): " SUPABASE_URL
    url_is_valid "${SUPABASE_URL:-}" || warn "Debe empezar por https:// — inténtalo de nuevo."
  done

  while ! key_is_valid "${SUPABASE_KEY:-}"; do
    read -rp "  anon public key (eyJ...): " SUPABASE_KEY
    key_is_valid "${SUPABASE_KEY:-}" || warn "Esa clave parece demasiado corta — inténtalo de nuevo."
  done

  cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF
  ok "Guardadas en $ENV_FILE (ignorado por git)"
fi

# Se exportan para que el build local las incruste en el bundle.
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY"

# ── 3. Dependencias ─────────────────────────────────────────────
step "Instalando dependencias"
if [[ -d node_modules ]]; then
  ok "Ya estaban instaladas"
else
  npm install --no-audit --no-fund
  ok "Dependencias instaladas"
fi

# ── 4. Sesión de Netlify ────────────────────────────────────────
step "Sesión de Netlify"
warn "Si es tu primera vez se abrirá el navegador para autorizar."
$NETLIFY login
ok "Sesión iniciada"

# ── 5. Vincular o crear el sitio ────────────────────────────────
step "Sitio de Netlify"
if [[ -f .netlify/state.json ]]; then
  ok "Esta carpeta ya está vinculada a un sitio"
else
  printf '%s\n' "$DIM"
  printf 'Elige "Create & configure a new site" para crear uno nuevo,\n'
  printf 'o "Link this directory to an existing site" si ya lo tienes.%s\n\n' "$RESET"
  $NETLIFY init
  ok "Sitio vinculado"
fi

# ── 6. Variables de entorno en Netlify ──────────────────────────
step "Configurando variables de entorno en Netlify"
$NETLIFY env:set NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" >/dev/null
$NETLIFY env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_KEY" >/dev/null
ok "Variables configuradas (persisten para los próximos despliegues)"

# ── 7. Compilar y publicar ──────────────────────────────────────
if $PREVIEW; then
  step "Compilando y publicando URL de preview"
  $NETLIFY deploy --build
else
  step "Compilando y publicando en producción"
  $NETLIFY deploy --build --prod
fi

printf '\n%s✓ Despliegue completado%s\n' "$GREEN$BOLD" "$RESET"
printf '%sAbre la URL de arriba y comprueba que el indicador dice "En directo" en verde.%s\n\n' "$DIM" "$RESET"
