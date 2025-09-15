# AGENTS.md — y2kfund/app-dashboard

**Purpose:** This repo contains the **Dashboard app** (Vue 3 SPA) that composes y2kfund apps/components like `@y2kfund/positions` and `@y2kfund/trades`.  
It relies on **`@y2kfund/core` (app-core)** to initialize and provide:
- **Supabase** client
- **TanStack Vue Query** with **IndexedDB persistence**
- Injection keys, hooks, and `queryKeys`

**System layout**
- **app-core** (`@y2kfund/core`) ⟶ creates/provides Supabase + Query + IDB persistence via a Vue plugin.
- **app-positions** (`@y2kfund/positions`), **app-trades**, … ⟶ downstream apps/components that consume core.
- **app-dashboard** ⟶ this host app; installs **app-core** plugin, renders/coordinates the apps.

---

## 1) Architecture & Rules (authoritative)

- **Vue 3 SPA** using Vite. Uses **Vue Router** for pages and **Pinia (optional)** for UI state (not server data).
- **Single Supabase & Query clients** are created by **`@y2kfund/core`** — **do not** create your own in this repo.
- **Cache persistence** (TanStack Query + IDB) is configured within **`@y2kfund/core`**.
- **Apps/components** (e.g., `@y2kfund/positions`) are imported and rendered; they handle their own queries and realtime within the boundaries set by core.
- **Styling**: global theme via CSS variables; avoid global overrides that leak into downstream apps. Downstream apps use scoped styles.
- **Routing**: each page should lazy-load its app/component code (route-level code splitting).
- **Env/Secrets**: No secrets committed. Runtime config via `import.meta.env.*` env vars and deployment secrets.
- **SemVer**: This is an **app**, not a library. Respect downstream **SemVer** when upgrading `@y2kfund/*` packages.
- **Code organization:** **Strong preference that each code file should be less than 300 lines.** When files approach this limit, consider splitting pages/components, extracting composables, creating utility modules, or separating UI/logic concerns.

---

## 2) File/Folder Layout (baseline)

```
src/
  main.ts               # boot: installs core, router, pinia; mounts App.vue
  App.vue               # root layout
  router/
    index.ts            # Vue Router setup (lazy routes)
  pages/
    Home.vue
    PositionsPage.vue   # uses <Positions/>
    TradesPage.vue
  components/
    NavBar.vue
    ErrorBoundary.vue
  stores/               # (optional) Pinia UI stores only
  styles/
    theme.css           # CSS vars (light/dark)
    globals.css         # minimal resets/utilities
env.d.ts
index.html
vite.config.ts
tsconfig.json
package.json
AGENTS.md
```

---

## 3) Bootstrapping (core plugin + router)

**`src/main.ts`**
```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { createCore } from '@y2kfund/core'
import './styles/globals.css'
import './styles/theme.css'

const core = await createCore({
  supabaseUrl: import.meta.env.VITE_SUPA_URL,
  supabaseAnon: import.meta.env.VITE_SUPA_ANON,
  idb: { databaseName: 'y2k-cache', storeName: 'tanstack' },
  query: { staleTime: 60_000, gcTime: 86_400_000, refetchOnWindowFocus: false },
  buster: 'v1'
})

createApp(App)
  .use(core)           // provides Supabase + Query + persistence
  .use(router)
  .use(createPinia())  // optional; UI-only state
  .mount('#app')
```

**`src/router/index.ts`**
```ts
import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('../pages/Home.vue')
const PositionsPage = () => import('../pages/PositionsPage.vue')
const TradesPage = () => import('../pages/TradesPage.vue')

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/positions/:accountId?', name: 'positions', component: PositionsPage, props: true },
    { path: '/trades/:accountId?', name: 'trades', component: TradesPage, props: true }
  ]
})
```

---

## 4) Using downstream apps/components

**`src/pages/PositionsPage.vue`**
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Positions } from '@y2kfund/positions'

const accountId = defineModel<string>('accountId', { default: 'demo' })
const selected = ref<any | null>(null)
function onRow(row:any){ selected.value = row }
</script>

<template>
  <section>
    <h1>Positions</h1>
    <Positions :account-id="accountId" @row-click="onRow" />
    <pre v-if="selected">{{ selected }}</pre>
  </section>
</template>
```

- **Do not** pass a Supabase client prop — downstream apps get it from **app-core** via injection.
- Use **route params** (`/positions/:accountId`) to drive props when appropriate.

---

## 5) Environment & secrets

Define these in your `.env` (local) and deployment secrets (CI/CD, hosting):
```
VITE_SUPA_URL=...
VITE_SUPA_ANON=...
VITE_APP_ENV=local|staging|prod
```
- Never commit real keys. Staging/prod are injected at deploy time.

To consume private packages from GitHub Packages, add `.npmrc` at the repo root:
```
@y2kfund:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_TOKEN}
always-auth=true
```

---

## 6) Error boundaries & loading UX

- Wrap page content with a simple error boundary that shows a retry and logs to console in dev.
- Show **skeletons** for first-load (`isLoading`), and a subtle “Updating…” for background fetches (`isFetching && !isLoading`). Downstream apps generally render their own loading states; keep dashboard spinners minimal.

**`src/components/ErrorBoundary.vue`** (sketch)
```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
const err = ref<unknown>(null)
onErrorCaptured((e) => { err.value = e; return true })
function reload(){ location.reload() }
</script>
<template>
  <div v-if="err">
    <h3>Something went wrong</h3>
    <button @click="reload">Reload</button>
    <details><summary>Details</summary><pre>{{ err }}</pre></details>
  </div>
  <slot v-else />
</template>
```

---

## 7) Theming & layout

- Define CSS variables in `styles/theme.css` (light/dark). Keep **global CSS minimal**.
- Downstream apps should style via **scoped CSS** and honor theme variables where needed.
- Use a simple, responsive layout (header + content). Avoid complex global grids that constrain downstream apps.

---

## 8) Auth (optional)

If you enable Supabase Auth:
- Prefer handling auth flows in **app-dashboard** (e.g., `/login`, `/logout`) using the **core-provided** Supabase client (`useSupabase()` from `@y2kfund/core`).
- Propagate auth state via standard Vue patterns (provide/inject, Pinia), not via global singletons outside the app boundary.

---

## 9) Performance

- **Route-level code splitting** for pages (already shown via dynamic imports).
- Keep **app-core** as a shared peer — **do not** bundle a second copy.
- Avoid unnecessary global watchers; use **TanStack Query** for server data and let downstream apps manage their own invalidations.
- If you need polling, set it in downstream apps; dashboard should not globally poll.

---

## 10) CI/CD (example)

**GitHub Actions** (build & deploy skeleton):
```yaml
name: deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          VITE_SUPA_URL: ${{ secrets.VITE_SUPA_URL }}
          VITE_SUPA_ANON: ${{ secrets.VITE_SUPA_ANON }}
      # add your hosting provider action here (Netlify/Vercel/S3/Cloudflare)
```

---

## 11) Do / Don’t

- ✅ Install **`@y2kfund/core`** and boot the app with `createCore()`.
- ✅ Import apps/components like `@y2kfund/positions` lazily per route.
- ✅ Keep dashboard UI state local/Pinia; **never** duplicate server data outside TanStack Query.
- ✅ Use CSS variables for theming; avoid heavy global styles.
- ❌ Don’t create Supabase or Query clients here.
- ❌ Don’t pass a Supabase client into downstream apps; they consume from core.
- ❌ Don’t tightly couple pages to specific component internals (treat them as black-box apps).

---

## 12) Definition of done

- App boots with **app-core** (Supabase + Query + IDB persistence working).
- Routes render downstream apps (`@y2kfund/positions`, …) and data loads.
- Private packages install correctly via `.npmrc`.
- Build passes in CI with env injected.
- No Supabase/Query client instantiation in this repo (only through core).
