# Canhoto Digital — PWA (React + Vite + TypeScript)

Aplicativo PWA para registro de comprovantes de entrega (POD) integrado a uma API Django. O projeto foi configurado para usar Yarn (Corepack), Vite, Tailwind CSS, autenticação com token em memória, fila offline via IndexedDB e `vite-plugin-pwa` para instalação e cache.

---

## Sumário
- Visão Geral
- Requisitos
- Como começar (dev)
- Variáveis de ambiente
- Scripts Yarn
- Estrutura do projeto
- Autenticação e API
- Offline e fila de POD
- PWA, Manifesto e Ícones
- Deploy
- CI/CD (Yarn Immutable)
- Troubleshooting

---

## Visão Geral
- Front-end: React 18 + Vite + TypeScript
- Estilos: Tailwind CSS
- PWA: `vite-plugin-pwa` (autoUpdate, Workbox)
- State/Server: TanStack Query
- Formulários/Validação: React Hook Form + Zod
- HTTP: Axios com interceptors e refresh de token
- Offline: IndexedDB (localforage) para enfileirar PODs
- Gerenciador de pacotes: Yarn (via Corepack)

Caminho do app: `./canhoto-pwa`

---

## Requisitos
- Node.js LTS (18+) recomendado
- Corepack habilitado (para padronizar Yarn)

Habilite o Corepack (uma única vez por máquina):
```bash
corepack enable
```

Opcional: padronizar a versão do Yarn (Berry) no projeto localmente:
```bash
cd canhoto-pwa
yarn set version stable
```

---

## Como começar (dev)
1) Instalar dependências e rodar o servidor de desenvolvimento
```bash
cd canhoto-pwa
yarn
yarn dev
```

2) Acesse a aplicação
- URL: http://localhost:5173

3) Backend
- Certifique-se de que sua API Django está rodando em `http://localhost:8000` (config padrão) e com CORS liberado para `http://localhost:5173`.

---

## Variáveis de ambiente
Arquivos já incluídos no pacote `canhoto-pwa` e prontos para quem for instalar pela 1ª vez:

`canhoto-pwa/.env` (padrão para todos os modos)
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

Template para configuração local (não é commitado):

`canhoto-pwa/.env.local.example`
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

Como usar na 1ª instalação:
1) Copie o template para `.env.local` e ajuste os valores conforme seu ambiente:
```
cd canhoto-pwa
cp .env.local.example .env.local
# edite .env.local e ajuste VITE_API_BASE_URL, etc.
```
2) O Vite carrega variáveis em ordem de precedência (da maior para a menor):
- `.env.local` (sobrescreve os demais)
- `.env.[mode]` (ex.: `.env.development`, `.env.production`)
- `.env`

A variável `VITE_API_BASE_URL` é usada pelo cliente HTTP. Ajuste-a para apontar ao seu backend.

---

## Scripts Yarn (no pacote canhoto-pwa)
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview --port 4173"
}
```
- Desenvolvimento: `yarn dev`
- Build de produção: `yarn build`
- Preview do build: `yarn preview`

---

## Estrutura do projeto
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
│  │  │  ├─ auth.ts          # Token em memória + refresh via cookie httpOnly
│  │  │  └─ offlineQueue.ts  # Fila IndexedDB para POD offline
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
└─ package.json (raiz)
```

---

## Autenticação e API
- O token de acesso é mantido somente em memória (não é salvo em `localStorage`), reduzindo vetores de XSS.
- O refresh é esperado via cookie httpOnly configurado pelo backend.
- Endpoints esperados (ajuste para o seu backend):
  - `POST /api/auth/login/` → `{ access: "<jwt>" }` e define cookie de refresh (opcional)
  - `POST /api/auth/refresh/` → `{ access: "<jwt>" }` usando o refresh cookie
  - `GET /api/deliveries/` → lista entregas
  - `POST /api/deliveries/{id}/pod/` → `FormData` com `note`, `image`, `signature`

Arquivos relevantes:
- `src/lib/auth.ts` → login/logout/refresh/token em memória
- `src/lib/api.ts` → Axios + interceptors (retry após refresh)

---

## Offline e fila de POD
- Se estiver offline, o envio de POD é enfileirado em IndexedDB com `localforage`.
- Ao voltar a ficar online, a fila é processada automaticamente (listener `window.online` em `src/main.tsx`).
- Conversão de imagens Base64 de/para Blob já inclusa.

Arquivo: `src/lib/offlineQueue.ts`.

---

## PWA, Manifesto e Ícones
- Plugin: `vite-plugin-pwa` com `registerType: 'autoUpdate'` e Workbox configurado.
- Rotas de API são tratadas como `NetworkOnly` para evitar servir dados stale.
- Precisam estar presentes em `canhoto-pwa/public/` (adicione seus arquivos):
  - `favicon.svg`
  - `apple-touch-icon.png`
  - `pwa-192.png`
  - `pwa-512.png` (opcionalmente com `purpose: any maskable`)

Obs.: `public/robots.txt` já está incluído.

---

## Deploy
- Opção 1: S3 + CloudFront
  - Habilite HTTPS, HSTS, e configure uma CSP adequada.
  - Cache estático permitido; requisições `\u002Fapi\u002F` como `NetworkOnly`.
- Opção 2: Vercel/Netlify (CI e previews)

Build de produção:
```bash
cd canhoto-pwa
yarn build
```
O output fica em `canhoto-pwa/dist`.

---

## CI/CD (Yarn Immutable)
Para builds reproduzíveis em CI, use o modo imutável do Yarn:
```bash
yarn install --immutable
```
Isso garante que o `yarn.lock` está sincronizado com `package.json`.

---

## Segurança
- Use HTTPS em produção (requisito para PWA e Service Workers).
- Token de acesso apenas em memória.
- Refresh via cookie httpOnly (configuração no backend).
- Ative HSTS e uma CSP estrita no CDN/hosting.

---

## Troubleshooting
- Service Worker não atualiza: limpe cache do navegador ou aguarde o ciclo de `autoUpdate`.
- 401 após expirar token: confirme que o endpoint `/api/auth/refresh/` está emitindo `{ access }` e o cookie httpOnly.
- Falha no upload de imagem: verifique limites de tamanho e CORS; compressão é feita por `browser-image-compression`.
- Offline não processa: confirme que o evento `online` dispara e que `VITE_API_BASE_URL` está acessível.

---

## Licença
Defina aqui a licença do projeto (ex.: MIT, Proprietária, etc.).
# canhoto_digital_app
