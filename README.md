# Guaraní Unificado

Plataforma de gestión multi-comisión para docentes de SIU Guaraní (USAL).

## Estructura

```
├── frontend/    → React + Vite + Tailwind (Cloudflare Pages)
└── worker/      → Cloudflare Worker (proxy a SIU Guaraní)
```

## Setup

### 1. Worker (API proxy)

```bash
cd worker
npm install
# Configurar secrets:
npx wrangler secret put GUARANI_ALLOWED_ORIGINS
# Deploy:
npx wrangler deploy
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # desarrollo local
npm run build      # build para producción
npx wrangler pages deploy dist  # deploy a Cloudflare Pages
```

## Arquitectura

El Worker actúa como proxy inverso a `autogestion.usal.edu.ar`, manejando la autenticación con cookies de sesión y exponiendo endpoints JSON limpios. El frontend consume estos endpoints para ofrecer una vista unificada de múltiples comisiones.
