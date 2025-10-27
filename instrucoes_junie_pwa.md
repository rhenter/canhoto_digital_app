# Instruções para Junie: Criação do PWA (React + Vite + TS) - Canhoto Digital

Estas instruções criam um PWA moderno, seguro e de fácil atualização para integrar com sua API Django.

---

## 0) Criar o projeto

```bash
yarn create vite canhoto-pwa --template react-ts
cd canhoto-pwa
yarn add react-router-dom @tanstack/react-query zod react-hook-form axios localforage idb browser-image-compression react-signature-canvas
yarn add -D tailwindcss postcss autoprefixer vite-plugin-pwa @types/react-signature-canvas
yarn dlx tailwindcss init -p
```

Notas (Yarn/Corepack):
```bash
corepack enable
yarn set version stable
```
Opcional no package.json para padronizar a versão:
```json
{ "packageManager": "yarn@stable" }
```

---

## 1) Configurar Tailwind

**Arquivo:** `tailwind.config.js`
```js
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**Arquivo:** `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
html, body, #root { height: 100%; }
```

---

## 2) Configurar PWA (Vite + vite-plugin-pwa)

**Arquivo:** `vite.config.ts`
```ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg','robots.txt','apple-touch-icon.png'],
        manifest: {
          name: 'Canhoto Digital',
          short_name: 'Canhoto',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0ea5e9',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          runtimeCaching: [
            { urlPattern: ({ url }) => url.origin === self.location.origin, handler: 'CacheFirst', options: { cacheName: 'static-assets' } },
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
          ],
        },
      }),
    ],
    server: { port: 5173, host: true },
    build: { sourcemap: true },
    define: { __APP_ENV__: env.APP_ENV },
  })
}
```

---

## 3) Arquivos `.env`

**.env.development**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

**.env.production**
```
VITE_API_BASE_URL=https://api.meudominio.com
VITE_ENV=production
```

---

## 4) Estrutura base

Inclui React Router, TanStack Query, Auth e Fetch com retry/refresh.

Veja detalhes no arquivo `routes.tsx`, `api.ts`, `auth.ts`, e telas `LoginPage`, `DeliveriesPage`, `PodPage`.

---

## 5) Rodar localmente

```bash
yarn dev
```
Acesse: http://localhost:5173

Certifique-se de que a API (`http://localhost:8000`) está rodando e com CORS habilitado para `http://localhost:5173`.

---

## 6) Deploy

**Opção 1 – S3 + CloudFront (barato e escalável)**  
**Opção 2 – Vercel ou Netlify (CI e preview automáticos)**

---

## 7) Segurança

- HTTPS obrigatório (PWA exige).  
- Tokens apenas em memória (sem localStorage).  
- Cookies httpOnly para refresh tokens (opcional).  
- CSP e HSTS no deploy.

---

## 8) Extras (opcional)

- **IndexedDB queue** (`src/lib/offlineQueue.ts`) para salvar POD offline.  
- **Compressão de imagens** com `browser-image-compression`.  
- **Assinatura** com `react-signature-canvas`.  
- **Upload direto para S3** via presign (`/api/deliveries/{id}/presign/`).

---

## 9) Scripts úteis

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173"
  }
}
```

---

✅ **Resumo:**  
Este projeto cria o PWA do *Canhoto Digital* com integração direta à API Django, suporte offline, autenticação segura e deploy simples em nuvem.
