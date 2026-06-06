#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# AgroMarket Bolivia — Setup Script
# Prepara el entorno de desarrollo local desde cero
# ─────────────────────────────────────────────────────────────────
set -e
GREEN='\033[0;32m'; AMBER='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${AMBER}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()    { echo -e "\n${GREEN}▶ $1${NC}"; }

echo -e "${GREEN}"
cat << 'BANNER'
  🌾 AgroMarket Bolivia — Setup
  La primera plataforma agritech integrada de Bolivia
BANNER
echo -e "${NC}"

# ─── Check prerequisites ─────────────────────────────────────────
step "Verificando prerrequisitos..."
command -v node >/dev/null 2>&1 || error "Node.js 20+ no encontrado. Instalar: https://nodejs.org"
command -v npm >/dev/null 2>&1  || error "npm no encontrado"
command -v docker >/dev/null 2>&1 || error "Docker no encontrado. Instalar: https://docker.com"
command -v git >/dev/null 2>&1  || error "Git no encontrado"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VERSION" -lt "20" ] && error "Se requiere Node.js 20+. Versión actual: $(node -v)"
info "Node.js $(node -v) ✓"
info "npm $(npm -v) ✓"
info "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') ✓"

# ─── Environment file ────────────────────────────────────────────
step "Configurando variables de entorno..."
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env 2>/dev/null || cat > apps/api/.env << 'ENV'
# ─── Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/agromarket
REDIS_URL=redis://localhost:6379

# ─── JWT (CHANGE IN PRODUCTION)
JWT_ACCESS_SECRET=dev-access-secret-minimum-32-chars-long
JWT_REFRESH_SECRET=dev-refresh-secret-minimum-32-chars-long
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=2592000

# ─── Storage (MinIO in dev)
DO_SPACES_ENDPOINT=http://localhost:9000
DO_SPACES_BUCKET=agromarket-files
DO_SPACES_KEY=minioadmin
DO_SPACES_SECRET=minioadmin
DO_SPACES_REGION=us-east-1

# ─── Scoring Service
SCORING_SERVICE_URL=http://localhost:8000
SCORING_SERVICE_API_KEY=dev-scoring-key

# ─── App
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3001
API_URL=http://localhost:3000

# ─── External APIs (fill in for full functionality)
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
# WHATSAPP_ACCESS_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
# WHATSAPP_WEBHOOK_VERIFY_TOKEN=agromarket-verify
# GOOGLE_MAPS_API_KEY=
# OPENWEATHER_API_KEY=
ENV
  info ".env creado para apps/api"
else
  warn "apps/api/.env ya existe — saltando"
fi

# ─── Install dependencies ────────────────────────────────────────
step "Instalando dependencias npm..."
npm install
info "Dependencias instaladas"

# ─── Start Docker services ───────────────────────────────────────
step "Iniciando servicios Docker (PostgreSQL, Redis, Elasticsearch, MinIO)..."
docker compose up -d db redis elasticsearch minio
info "Servicios Docker iniciados"

# ─── Wait for DB ─────────────────────────────────────────────────
step "Esperando que PostgreSQL esté listo..."
for i in {1..30}; do
  docker compose exec -T db pg_isready -U postgres -d agromarket >/dev/null 2>&1 && break
  [ $i -eq 30 ] && error "PostgreSQL no inició en 30 segundos"
  sleep 1
done
info "PostgreSQL listo"

# ─── Prisma migrate ──────────────────────────────────────────────
step "Ejecutando migraciones de base de datos..."
cd apps/api
DATABASE_URL=postgresql://postgres:password@localhost:5432/agromarket \
  npx prisma migrate dev --schema=../../packages/database/prisma/schema.prisma --name init 2>/dev/null || \
  DATABASE_URL=postgresql://postgres:password@localhost:5432/agromarket \
  npx prisma db push --schema=../../packages/database/prisma/schema.prisma
cd ../..
info "Migraciones aplicadas"

# ─── Prisma generate ─────────────────────────────────────────────
step "Generando cliente Prisma..."
DATABASE_URL=postgresql://postgres:password@localhost:5432/agromarket \
  npx prisma generate --schema=packages/database/prisma/schema.prisma
info "Cliente Prisma generado"

# ─── MinIO bucket ────────────────────────────────────────────────
step "Configurando MinIO bucket..."
sleep 3  # Wait for MinIO to be ready
docker run --rm --network host \
  minio/mc:latest sh -c "
    mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null;
    mc mb local/agromarket-files --ignore-existing 2>/dev/null;
    mc anonymous set public local/agromarket-files 2>/dev/null;
  " 2>/dev/null || warn "MinIO config manual: http://localhost:9001 (minioadmin/minioadmin)"

# ─── Done ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🌾 AgroMarket Bolivia listo para desarrollo!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  📡 API:           ${GREEN}http://localhost:3000${NC}"
echo -e "  🌐 Web:           ${GREEN}http://localhost:3001${NC}"
echo -e "  📚 Swagger:       ${GREEN}http://localhost:3000/api/docs${NC}"
echo -e "  🐘 Adminer:       ${GREEN}http://localhost:8080${NC}"
echo -e "  🗄️  MinIO:         ${GREEN}http://localhost:9001${NC} (minioadmin/minioadmin)"
echo ""
echo -e "  ${AMBER}Para iniciar el servidor de desarrollo:${NC}"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""
