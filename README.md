# 🌾 AgroMarket Bolivia

> **La primera plataforma agritech integrada de Bolivia**

AgroMarket Bolivia conecta productores agrícolas, compradores industriales, proveedores de insumos, arrendadores de maquinaria e instituciones financieras en un ecosistema digital unificado. Diseñado para funcionar en zonas rurales con conectividad limitada, también por WhatsApp.

[![CI/CD](https://github.com/samuucane/agromarket-bolivia/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/samuucane/agromarket-bolivia/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Tabla de contenidos

- [Módulos](#módulos)
- [Stack tecnológico](#stack-tecnológico)
- [Inicio rápido](#inicio-rápido)
- [Estructura del proyecto](#estructura-del-proyecto)
- [API Documentation](#api-documentation)
- [Variables de entorno](#variables-de-entorno)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## 🧩 Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Auth & Users** | ✅ Completo | OTP SMS, PIN, biométrico, KYC, roles |
| **Marketplace** | ✅ Completo | Listings, búsqueda, pedidos, reseñas |
| **Payments** | ✅ Completo | QR Bolivia, wallet interno, split automático |
| **Credit Engine** | ✅ Completo | Scoring ML, originación, cuotas |
| **Farm Manager** | ✅ Completo | Fincas, ciclos, gastos, clima |
| **Certifications** | ✅ Completo | Orgánico, SENASAG, verificación |
| **WhatsApp Bot** | ✅ Completo | Precios, ventas, crédito por WhatsApp |
| **Analytics** | ✅ Completo | Dashboards por rol, reportes |
| **Notifications** | ✅ Completo | Push, WhatsApp, SMS, in-app |

---

## 🛠 Stack tecnológico

```
Frontend Web:    Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui
App Móvil:       React Native / Expo (Android-first)
Backend API:     NestJS 10 · PostgreSQL 15 + PostGIS · Redis · Elasticsearch
ML Scoring:      Python 3.11 · FastAPI · XGBoost · scikit-learn
Infra:           Docker · Kubernetes · DigitalOcean · AWS S3
CI/CD:           GitHub Actions
```

---

## ⚡ Inicio rápido

### Prerrequisitos

- Node.js 20+
- Docker Desktop
- Git

### Setup automático

```bash
git clone https://github.com/samuucane/agromarket-bolivia.git
cd agromarket-bolivia
chmod +x infrastructure/scripts/setup.sh
./infrastructure/scripts/setup.sh
```

### Setup manual

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tus valores

# 3. Levantar servicios Docker
docker compose up -d db redis elasticsearch minio

# 4. Aplicar migraciones de DB
npm run db:migrate

# 5. Generar cliente Prisma
npm run db:generate

# 6. Iniciar en modo desarrollo
npm run dev
```

### URLs de desarrollo

| Servicio | URL |
|----------|-----|
| 🌐 Web Frontend | http://localhost:3001 |
| 📡 API | http://localhost:3000/api/v1 |
| 📚 Swagger Docs | http://localhost:3000/api/docs |
| 🤖 ML Scoring | http://localhost:8000/docs |
| 🐘 Adminer (DB) | http://localhost:8080 |
| 🗄️ MinIO Console | http://localhost:9001 |

---

## 📁 Estructura del proyecto

```
agromarket-bolivia/
├── apps/
│   ├── api/                  # NestJS Backend
│   │   └── src/
│   │       ├── auth/         # Autenticación, OTP, JWT, KYC
│   │       ├── marketplace/  # Listings, pedidos, búsqueda, precios
│   │       ├── payments/     # Wallet, QR, transacciones
│   │       ├── credit/       # Scoring, solicitudes, préstamos
│   │       ├── farms/        # Fincas, ciclos, gastos, clima
│   │       ├── certifications/
│   │       ├── analytics/    # Dashboards por rol
│   │       ├── notifications/# Push, WhatsApp, SMS, in-app
│   │       └── whatsapp/     # Bot de WhatsApp
│   │
│   ├── web/                  # Next.js Frontend
│   │   └── src/app/
│   │       ├── page.tsx          # Landing page
│   │       ├── marketplace/      # Listado y detalle de productos
│   │       ├── auth/             # Login y registro
│   │       ├── dashboard/        # Dashboard del productor
│   │       ├── prices/           # Precios de referencia
│   │       ├── credit/           # Crédito agrícola
│   │       └── farms/            # Farm Manager
│   │
│   ├── mobile/               # React Native / Expo (Android-first)
│   └── scoring/              # Python FastAPI — ML Scoring
│       └── main.py           # Endpoints de scoring crediticio
│
├── packages/
│   ├── database/             # Prisma schema compartido
│   │   └── prisma/schema.prisma
│   ├── types/                # TypeScript types compartidos
│   └── ui/                   # Design system compartido
│
├── infrastructure/
│   ├── docker/               # Nginx, PostgreSQL init
│   ├── k8s/                  # Kubernetes manifests
│   └── scripts/              # setup.sh, deploy.sh
│
├── .github/workflows/        # CI/CD con GitHub Actions
├── docker-compose.yml        # Stack completo de desarrollo
├── turbo.json                # Turborepo pipeline
└── package.json              # Workspace root
```

---

## 📡 API Documentation

Con el servidor corriendo, accede a Swagger en:
**http://localhost:3000/api/docs**

### Endpoints principales

```
POST /api/v1/auth/register          → Registro + OTP SMS
POST /api/v1/auth/verify-otp        → Verificar OTP
POST /api/v1/auth/login             → Login
POST /api/v1/auth/login-pin         → Login rápido con PIN

GET  /api/v1/marketplace/listings   → Listar publicaciones
POST /api/v1/marketplace/listings   → Crear publicación
GET  /api/v1/marketplace/search     → Búsqueda full-text
GET  /api/v1/marketplace/prices     → Precios de referencia

GET  /api/v1/payments/wallet        → Saldo del wallet
POST /api/v1/payments/qr/generate   → Generar QR de pago

POST /api/v1/credit/apply           → Solicitar crédito
GET  /api/v1/credit/score           → Mi score crediticio
GET  /api/v1/credit/simulate        → Simular crédito

GET  /api/v1/farms                  → Mis fincas
POST /api/v1/farms/:id/cycles       → Iniciar ciclo de cultivo
GET  /api/v1/farms/:id/weather      → Clima de la finca

POST /api/v1/whatsapp/webhook       → Bot WhatsApp (Meta Cloud API)
```

---

## 🔐 Variables de entorno

Ver `apps/api/.env.example` para la lista completa.

Variables críticas:

```env
DATABASE_URL=postgresql://user:pass@host:5432/agromarket
REDIS_URL=redis://host:6379
JWT_ACCESS_SECRET=<256-bit-random>
JWT_REFRESH_SECRET=<256-bit-random>
TWILIO_ACCOUNT_SID=          # OTP por SMS
TWILIO_AUTH_TOKEN=
WHATSAPP_ACCESS_TOKEN=       # Bot de WhatsApp
SCORING_SERVICE_URL=http://scoring:8000
OPENWEATHER_API_KEY=         # Alertas climáticas
```

---

## 🚀 Deployment

### Docker (staging)

```bash
docker compose -f docker-compose.yml up -d
```

### Kubernetes (producción)

```bash
kubectl apply -f infrastructure/k8s/deployment.yaml
```

El CI/CD de GitHub Actions se encarga del deploy automático en cada push a `main`.

---

## 🗺 Roadmap

### Sprint 1 — Auth & Users ✅
### Sprint 2 — Marketplace MVP ✅
### Sprint 3 — Pagos ✅
### Sprint 4 — WhatsApp Bot ✅
### Sprint 5 — Motor de Crédito ✅
### Sprint 6 — Farm Manager ✅
### Sprint 7 — Certificaciones & Búsqueda avanzada 🔄
### Sprint 8 — Analytics & Polish 🔄

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea tu rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m 'feat: add mi-feature'`
4. Push: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

MIT © 2025 AgroMarket Bolivia

---

*Hecho con 🌾 en Bolivia — Construido para el productor boliviano*
