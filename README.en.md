# Canhoto Digital — PWA (React + Vite + TypeScript)

PWA app for recording Proof of Delivery (POD) integrated with a Django API. The project is set up to use Yarn (Corepack), Vite, Tailwind CSS, in-memory token auth, an offline queue via IndexedDB, and `vite-plugin-pwa` for install and caching.

---

## Table of contents
- Overview
- Requirements
- Getting started (dev)
- Environment variables
- Yarn scripts
- Project structure
- Authentication and API
- Offline and POD queue
- PWA, Manifest and Icons
- Deploy
- CI/CD (Yarn Immutable)
- Troubleshooting

---

## Overview
- Front-end: React 18 + Vite + TypeScript
- Styles: Tailwind CSS
- PWA: `vite-plugin-pwa` (autoUpdate, Workbox)
- State/Server: TanStack Query
- Forms/Validation: React Hook Form + Zod
- HTTP: Axios with interceptors and token refresh
- Offline: IndexedDB (localforage) to enqueue PODs
- Package manager: Yarn (via Corepack)

App path: `./canhoto-pwa`

---

## Requirements
- Node.js LTS (18+) recommended
- Corepack enabled (to standardize Yarn)

Enable Corepack (once per machine):
```bash
corepack enable
```

Project Yarn version: `yarn@4.4.1`
Activate it locally (once per machine):
```bash
corepack prepare yarn@4.4.1 --activate
```

---

## Getting started (dev)
1) Install dependencies and run the dev server
```bash
cd canhoto-pwa
yarn
yarn dev
```

2) Access the application
- URL: http://localhost:5173

3) Backend
- Make sure your Django API is running at `http://localhost:8000` (default config) and that CORS is allowed for `http://localhost:5173`.

---

## Environment variables
Files already included under `canhoto-pwa` and ready for first-time setup:

`canhoto-pwa/.env` (default for all modes)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

`canhoto-pwa/.env.development`
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

`canhoto-pwa/.env.production`
```
VITE_API_BASE_URL=https://api.meudominio.com
VITE_ENV=production
```

Template for local configuration (not committed):

`canhoto-pwa/.env.local.example`
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

How to use on first installation:
1) Copy the template to `.env.local` and adjust values for your environment:
```
cd canhoto-pwa
cp .env.local.example .env.local
# edit .env.local and set VITE_API_BASE_URL, etc.
```
2) Vite loads variables in order of precedence (highest to lowest):
- `.env.local` (overrides the others)
- `.env.[mode]` (e.g., `.env.development`, `.env.production`)
- `.env`

The `VITE_API_BASE_URL` variable is used by the HTTP client. Set it to point to your backend.

---

## Yarn scripts (in the canhoto-pwa package)
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview --port 4173"
}
```
- Development: `yarn dev`
- Production build: `yarn build`
- Build preview: `yarn preview`

---

## Project structure
```
canhoto_digital_app/
├─ canhoto-pwa/
│  ├─ index.html
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public/
│  │  └─ robots.txt
│  ├─ src/
│  │  ├─ App.tsx
│  │  ├─ index.css
│  │  ├─ lib/
│  │  │  ├─ api.ts           # Axios + interceptors + helpers
│  │  │  ├─ auth.ts          # In-memory token + refresh via httpOnly cookie
│  │  │  └─ offlineQueue.ts  # IndexedDB queue for offline POD
│  │  ├─ main.tsx
│  │  ├─ pages/
│  │  │  ├─ DeliveriesPage.tsx
│  │  │  ├─ LoginPage.tsx
│  │  │  └─ PodPage.tsx
│  │  ├─ routes.tsx
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ instrucoes_junie_pwa.md
└─ package.json (root)
```

---

## Authentication and API
- The access token is kept only in memory (not persisted in `localStorage`), reducing XSS vectors.
- Refresh is expected via httpOnly cookie configured by the backend.
- Expected endpoints (adjust to your backend):
  - `POST /api/auth/login/` → `{ access: "<jwt>" }` and sets refresh cookie (optional)
  - `POST /api/auth/refresh/` → `{ access: "<jwt>" }` using the refresh cookie
  - `GET /api/deliveries/` → list deliveries
  - `POST /api/deliveries/{id}/pod/` → `FormData` with `note`, `image`, `signature`

Relevant files:
- `src/lib/auth.ts` → login/logout/refresh/token in memory
- `src/lib/api.ts` → Axios + interceptors (retry after refresh)

---

## Offline and POD queue
- If offline, POD submission is queued in IndexedDB with `localforage`.
- When coming back online, the queue is processed automatically (`window.online` listener in `src/main.tsx`).
- Base64 image to/from Blob conversion is included.

File: `src/lib/offlineQueue.ts`.

---

## PWA, Manifest and Icons
- Plugin: `vite-plugin-pwa` with `registerType: 'autoUpdate'` and configured Workbox.
- API routes are handled as `NetworkOnly` to avoid serving stale data.
- The following should be present in `canhoto-pwa/public/` (add your files):
  - `favicon.svg`
  - `apple-touch-icon.png`
  - `pwa-192.png`
  - `pwa-512.png` (optionally with `purpose: any maskable`)

Note: `public/robots.txt` is already included.

---

## Deploy
- Option 1: S3 + CloudFront
  - Enable HTTPS, HSTS, and configure a strict CSP.
  - Static cache allowed; `\u002Fapi\u002F` requests as `NetworkOnly`.
- Option 2: Vercel/Netlify (CI and previews)

Production build:
```bash
cd canhoto-pwa
yarn build
```
Output is in `canhoto-pwa/dist`.

---

## CI/CD (Yarn Immutable)
For reproducible builds in CI, use Yarn immutable mode:
```bash
yarn install --immutable
```
This ensures `yarn.lock` is in sync with `package.json`.

---

## Security
- Use HTTPS in production (required for PWA and Service Workers).
- Access token only in memory.
- Refresh via httpOnly cookie (backend config).
- Enable HSTS and a strict CSP on CDN/hosting.

---

## Troubleshooting
- Service Worker not updating: clear the browser cache or wait for the `autoUpdate` cycle.
- 401 after token expiration: confirm that `/api/auth/refresh/` returns `{ access }` and sets the httpOnly cookie.
- Image upload failure: check size limits and CORS; compression is done by `browser-image-compression`.
- Offline queue not processing: confirm the `online` event fires and `VITE_API_BASE_URL` is reachable.

---

## License
This project is licensed under the BSD 3-Clause License. See [LICENSE](LICENSE) for the full text.

Summary:
- You may use, modify, and distribute, with or without modifications, including commercially.
- You must retain the copyright notice and license terms.
- You may not use the names of the authors or contributors to endorse or promote products derived from this software without prior written permission.

---

Read this document in Portuguese: [README.md](README.md)
